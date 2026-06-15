// ═══════════════════════════════════════════════════════════════
// Goods Movement OData API
// Service: SUP_PORTAL_GDS_MVT_APP_SRV
// ═══════════════════════════════════════════════════════════════

const SRV = '/sap/opu/odata/shiv/SUP_PORTAL_GDS_MVT_APP_SRV'
export const authConfig = { loginId: '', loginType: '' }

// ── SAP Date/Time helpers ─────────────────────────────────────

export const toSapDate = (isoDate) => {
  if (!isoDate) return ''
  return isoDate.replace(/-/g, '')               // '2026-05-27' → '20260527'
}

export const fromSapDate = (sapDate) => {
  if (!sapDate || sapDate === '00000000') return ''
  return `${sapDate.slice(0, 4)}-${sapDate.slice(4, 6)}-${sapDate.slice(6, 8)}`
}

export const fromSapDateDisplay = (sapDate) => {
  if (!sapDate || sapDate === '00000000') return ''
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const y = sapDate.slice(0, 4)
  const m = parseInt(sapDate.slice(4, 6), 10) - 1
  const d = parseInt(sapDate.slice(6, 8), 10)
  return `${months[m]} ${String(d).padStart(2, '0')}, ${y}`
}

// 'HHmmss' + date string → 'DD.MM.YYYY HH:MM'
const formatTimestamp = (sapDate, sapTime) => {
  if (!sapDate || sapDate === '00000000') return null
  if (!sapTime || sapTime === '000000') return fromSapDateDisplay(sapDate)
  const d = sapDate.slice(6, 8)
  const mo = sapDate.slice(4, 6)
  const y = sapDate.slice(0, 4)
  const hh = sapTime.slice(0, 2)
  const mm = sapTime.slice(2, 4)
  return `${d}.${mo}.${y} ${hh}:${mm}`
}

// ── Status mapping ─────────────────────────────────────────────
// SAP Status codes → UI labels + colors
const STATUS_MAP = {
  '01': { label: 'Created',        color: 'gray'  },
  '02': { label: 'In Transit',     color: 'blue'  },
  '03': { label: 'Shipped',        color: 'blue'  },
  '04': { label: 'Gate Reporting', color: 'orange'},
  '05': { label: 'Gate Entry',     color: 'orange'},
  '06': { label: 'Goods Received', color: 'green' },
  '07': { label: 'Completed',      color: 'green' },
}

const resolveStatus = (statusCode, statusText) => {
  if (STATUS_MAP[statusCode]) return STATUS_MAP[statusCode]
  // Fallback: derive from StatusText
  const t = (statusText || '').toLowerCase()
  if (t.includes('received'))  return { label: 'Goods Received', color: 'green'  }
  if (t.includes('transit'))   return { label: 'In Transit',     color: 'blue'   }
  if (t.includes('shipped'))   return { label: 'Shipped',        color: 'blue'   }
  if (t.includes('gate'))      return { label: statusText,       color: 'orange' }
  if (t.includes('created'))   return { label: 'Created',        color: 'gray'   }
  if (t.includes('completed')) return { label: 'Completed',      color: 'green'  }
  return { label: statusText || 'Unknown', color: 'gray' }
}

// ── Transport Mode ─────────────────────────────────────────────
const TRANS_MODE_MAP = { '01': 'By Road', '02': 'By Air', '03': 'By Rail', '04': 'By Sea' }
const resolveTransMode = (code) => TRANS_MODE_MAP[code] || code || ''

// ── Timeline builder ───────────────────────────────────────────
// Timeline step is completed when its SAP date field is not '00000000'
const buildTimeline = (d) => [
  {
    key: 'created',
    label: 'Created',
    completed: !!(d.CreateDate && d.CreateDate !== '00000000'),
    timestamp: formatTimestamp(d.CreateDate, d.CreateTime),
  },
  {
    key: 'shipped',
    label: 'Shipped',
    completed: !!(d.ShipDate && d.ShipDate !== '00000000'),
    timestamp: formatTimestamp(d.ShipDate, d.ShipTime),
  },
  {
    key: 'gate_reporting',
    label: 'Gate Reporting',
    completed: !!(d.RepDate && d.RepDate !== '00000000'),
    timestamp: formatTimestamp(d.RepDate, d.RepTime),
  },
  {
    key: 'gate_entry',
    label: 'Gate Entry (IN)',
    completed: !!(d.InDate && d.InDate !== '00000000'),
    timestamp: formatTimestamp(d.InDate, d.InTime),
  },
  {
    key: 'goods_received',
    label: 'Goods Received',
    completed: !!(d.GrDate && d.GrDate !== '00000000'),
    timestamp: formatTimestamp(d.GrDate, d.GrTime),
  },
  {
    key: 'completed',
    label: 'Completed',
    completed: !!(d.OutDate && d.OutDate !== '00000000'),
    timestamp: formatTimestamp(d.OutDate, d.OutTime),
  },
]

// ── ASN mapper ────────────────────────────────────────────────
const mapAsn = (raw) => ({
  asnId:           raw.Asn || '',
  asnYear:         raw.AsnYear || '',
  totalLineItems:  parseInt(raw.ItmCount || '0', 10),
  ibdNumber:       (raw.IbdNo || '').trim(),
  plant:           raw.Plant || '',
  storageLocation: raw.StorageLocation || '',
  invoiceNumber:   raw.InvNo || '',
  invoiceAmount:   parseFloat(raw.Price || '0'),
  invoiceDate:     fromSapDateDisplay(raw.InvDate),
  warehouseNo:     raw.Warehouse_No || '',
})

// ── Header mapper ─────────────────────────────────────────────
const mapHeader = (d, year) => {
  const status = resolveStatus(d.Status, d.StatusText)
  const transMode = resolveTransMode(d.Mode)
  const trackId = `${d.TrackNo}/${year || d.Year || ''}`

  return {
    // IDs
    id:          trackId,
    trackingNo:  d.TrackNo,
    year:        d.Year || year || '',

    // Display fields
    transportMode:  transMode,
    date:           fromSapDateDisplay(d.CreateDate),
    plant:          d.Plant || (d.HeaderAsnNav?.results?.[0]?.Plant || ''),
    plantName:      d.PlantText || '',

    // Status
    status:      status.label,
    statusCode:  d.Status,
    statusColor: status.color,

    // Transporter / driver
    transporter: d.Transporter || '',
    driverName:  d.Person || '',
    contact:     d.Contact || '',

    // Detail fields
    transportationMode:              transMode,
    pollutionCertificateApplicable:  d.PollCertApp ? 'Yes' : 'No',
    totalAsnAmount:                  parseFloat((d.TotalAmt || '0').trim()),
    etaDate:                         fromSapDateDisplay(d.Eta),
    safetyEquipments:                d.SafetyEquip ? 'Yes' : 'No',
    safetyGuardForMaterial:          d.SafetyGauMat ? 'Yes' : 'No',
    vehicleRegNo:                    d.RegNum || '',
    ewayBillNo:                      d.EwayBill || '',
    ewayBillDate:                    fromSapDateDisplay(d.EwayBillDate),

    // Vendor
    vendor:     d.Vendor || '',
    vendorName: d.Name || '',

    // Other
    shipment:   d.Shipment || '',
    txn:        d.Txn || '',
    invoiceNum: d.InvoiceNum || '',

    // Timeline
    timeline: buildTimeline(d),

    // ASNs
    asns: (d.HeaderAsnNav?.results || []).map(mapAsn),
  }
}

// ── List item mapper (for sidebar list — no expand) ───────────
const mapHeaderListItem = (d) => {
  const status = resolveStatus(d.Status, d.StatusText)
  const year = d.Year || ''
  return {
    id:           `${d.TrackNo}/${year}`,
    trackingNo:   d.TrackNo,
    year,
    transportMode: resolveTransMode(d.Mode),
    date:          fromSapDateDisplay(d.CreateDate),
    plant:         d.Plant || '',
    plantName:     d.PlantText || '',
    status:        status.label,
    statusCode:    d.Status,
    statusColor:   status.color,
  }
}

// ── ASN dropdown item mapper ──────────────────────────────────
const mapAsnDropdown = (raw) => ({
  asnId:          raw.Asn || '',
  track:          raw.Track || '',
  invoiceNumber:  raw.invoiceno || '',
  transporter:    raw.transporter || '',
})

// ── Generic OData fetch ───────────────────────────────────────
async function odata(path) {
  const res = await fetch(`${SRV}${path}`, {
    headers: { Accept: 'application/json',       
          Loginid: authConfig.loginId,
          Logintype: authConfig.loginType, },
    credentials: 'include',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OData ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

// ── CSRF token fetch (needed for POST/PATCH) ──────────────────
async function fetchCsrfToken() {
  const res = await fetch(`${SRV}/`, {
    method: 'GET',
    headers: { 'X-CSRF-Token': 'Fetch', Accept: 'application/json' },
    credentials: 'include',
  })
  return res.headers.get('X-CSRF-Token') || ''
}

// ── Generic OData write (POST/PATCH) ─────────────────────────
async function odataWrite(path, payload, method = 'POST') {
  const csrf = await fetchCsrfToken()
  const res = await fetch(`${SRV}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-CSRF-Token': csrf,
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OData ${method} ${res.status}: ${text.slice(0, 200)}`)
  }
  // 204 No Content → return empty
  if (res.status === 204) return {}
  return res.json()
}

// ═══════════════════════════════════════════════════════════════
// API OBJECT
// ═══════════════════════════════════════════════════════════════
export const goodsMovementApi = {

  // ── List all headers (sidebar) ──────────────────────────────
  // GET GoodsMvtHeaderSet (no expand for performance)
  async listTrackings({ search = '' } = {}) {
    const filters = []

    // Vendor filter injected by backend session — no explicit Lifnr needed
    // Add search filter if provided (filter on TrackNo)
    if (search.trim()) {
      filters.push(`substringof('${search.trim()}',TrackNo)`)
    }

    const qs = filters.length ? `?$filter=${filters.map(encodeURIComponent).join('%20and%20')}` : ''
    const data = await odata(`/GoodsMvtHeaderSet${qs}`)
    return (data.d?.results || []).map(mapHeaderListItem)
  },

  // ── Get single header + ASN expand ─────────────────────────
  // GET GoodsMvtHeaderSet(TrackNo='...',Year='...')?$expand=HeaderAsnNav,...
  async getTracking(id) {
    // id format: 'TRACKNUMBER/YEAR'
    const [trackNo, year] = id.split('/')
    const key = `TrackNo='${encodeURIComponent(trackNo)}',Year='${encodeURIComponent(year)}'`
    const expand = '$expand=HeaderAsnNav,HeaderRpmInNav,HeaderRpmOutNav'
    const data = await odata(`/GoodsMvtHeaderSet(${key})?${expand}`)
    return mapHeader(data.d, year)
  },

  // ── Create new tracking ─────────────────────────────────────
  // POST GoodsMvtHeaderSet
  async createTracking(payload) {
    const body = {
      TrackNo:       '',                           // SAP assigns
      Year:          String(new Date().getFullYear()),
      RegNum:        payload.vehicleRegNo || '',
      Transporter:   payload.transporter || '',
      Person:        payload.driverName || '',
      Contact:       payload.contact || '',
      Mode:          payload.modeCode || '01',
      Eta:           toSapDate(payload.etaDate) || '',
      EwayBill:      payload.ewayBillNo || '',
      EwayBillDate:  toSapDate(payload.ewayBillDate) || '',
      PollCertApp:   payload.pollutionCertificateApplicable === 'Yes',
      SafetyEquip:   payload.safetyEquipments === 'Yes',
      SafetyGauMat:  payload.safetyGuardForMaterial === 'Yes',
      // ASNs passed as nav property if API supports deep insert
      HeaderAsnNav:  { results: (payload.asns || []).map(a => ({
        Asn:   a.asnId,
        InvNo: a.invoiceNumber,
      }))},
    }
    const data = await odataWrite('/GoodsMvtHeaderSet', body, 'POST')
    return mapHeader(data.d || {})
  },

  // ── Update shipment (vehicle/ASN/invoice) ───────────────────
  // PATCH GoodsMvtHeaderSet(TrackNo='...',Year='...')
  async updateShipment(id, payload) {
    const [trackNo, year] = id.split('/')
    const key = `TrackNo='${encodeURIComponent(trackNo)}',Year='${encodeURIComponent(year)}'`
    const body = {
      RegNum:     payload.vehicleNumber || '',
      InvoiceNum: payload.invoiceNumber || '',
      // ASN update handled via AsnDetailsSet if needed separately
    }
    return odataWrite(`/GoodsMvtHeaderSet(${key})`, body, 'PATCH')
  },

  // ── Start shipment (sets ShipDate/ShipTime + Status → Shipped) ─
  // PATCH GoodsMvtHeaderSet(...)
  async startShipment(id, payload) {
    const [trackNo, year] = id.split('/')
    const key = `TrackNo='${encodeURIComponent(trackNo)}',Year='${encodeURIComponent(year)}'`
    const body = {
      ShipDate: toSapDate(payload.date) || '',
      ShipTime: (payload.time || '').replace(/[:\s]/g, '').slice(0, 6), // 'HH:MM:SS AM' → 'HHMMSS' approx
      Eta:      toSapDate(payload.etaDate) || '',
    }
    return odataWrite(`/GoodsMvtHeaderSet(${key})`, body, 'PATCH')
  },

  // ── Cancel tracking ─────────────────────────────────────────
  // DELETE GoodsMvtHeaderSet(...)  — or PATCH with cancel status, depending on backend
  async cancelTracking(id) {
    const [trackNo, year] = id.split('/')
    const key = `TrackNo='${encodeURIComponent(trackNo)}',Year='${encodeURIComponent(year)}'`
    // Try DELETE; if backend uses status-based cancel change to PATCH with Status='99'
    const csrf = await fetchCsrfToken()
    const res = await fetch(`${SRV}/GoodsMvtHeaderSet(${key})`, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrf, Accept: 'application/json' },
      credentials: 'include',
    })
    if (!res.ok && res.status !== 204) {
      const text = await res.text().catch(() => '')
      throw new Error(`OData DELETE ${res.status}: ${text.slice(0, 200)}`)
    }
    return { success: true }
  },

  // ── Print (trigger SAP smartform / spool) ──────────────────
  // POST — actual endpoint TBD; placeholder uses function import pattern
  async printTracking(id) {
    const [trackNo, year] = id.split('/')
    return odataWrite(
      `/PrintTrackingSet`,
      { TrackNo: trackNo, Year: year },
      'POST'
    )
  },

  // ── ASN dropdown for Update Shipment dialog ─────────────────
  // GET asndropdownSet?$filter=Track eq 'TRACKNO'
  async searchAsns({ trackNo = '', search = '' } = {}) {
    const filters = []
    if (trackNo) filters.push(`Track eq '${trackNo}'`)
    const qs = filters.length ? `?$filter=${filters.map(encodeURIComponent).join('%20and%20')}` : ''
    const data = await odata(`/asndropdownSet${qs}`)
    let results = (data.d?.results || []).map(mapAsnDropdown)

    // Client-side search filter (ASN ID or invoice number)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      results = results.filter(a =>
        a.asnId.toLowerCase().includes(q) ||
        a.invoiceNumber.toLowerCase().includes(q)
      )
    }
    return results
  },
}

export default goodsMovementApi