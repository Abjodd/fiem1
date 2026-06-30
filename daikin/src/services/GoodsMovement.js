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
// SAP Status codes → UI colors only (label comes from StatusText)
const STATUS_COLOR_MAP = {
  '01': 'gray',
  '02': 'blue',
  '03': 'blue',
  '04': 'orange',
  '05': 'orange',
  '06': 'green',
  '07': 'green',
}

const resolveStatusColor = (statusCode, statusText) => {
  if (STATUS_COLOR_MAP[statusCode]) return STATUS_COLOR_MAP[statusCode]
  const t = (statusText || '').toLowerCase()
  if (t.includes('received'))  return 'green'
  if (t.includes('transit'))   return 'blue'
  if (t.includes('shipped'))   return 'blue'
  if (t.includes('gate'))      return 'orange'
  if (t.includes('completed')) return 'green'
  return 'gray'
}

// ── Transport Mode ─────────────────────────────────────────────
const TRANS_MODE_MAP = { '01': 'By Road', '02': 'By Air', '03': 'By Rail', '04': 'By Sea' }
const resolveTransMode = (code) => TRANS_MODE_MAP[code] || code || ''

// ── Timeline builder ───────────────────────────────────────────
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
  // Use StatusText directly from SAP — no label override
  const statusText  = d.StatusText || ''
  const statusColor = resolveStatusColor(d.Status, statusText)
  const transMode   = resolveTransMode(d.Mode)
  const trackId     = `${d.TrackNo}/${year || d.Year || ''}`

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

    // Status — use exact StatusText from SAP
    status:      statusText,
    statusCode:  d.Status,
    statusColor,

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
    lrNum: d.LRNO || d.InvoiceNum || '',
    finalTransporterName: d.FINALTRANS || d.FinalTransporter || '',

    // Timeline
    timeline: buildTimeline(d),

    // ASNs
    asns: (d.HeaderAsnNav?.results || []).map(mapAsn),
  }
}

// ── List item mapper (for sidebar list — no expand) ───────────
const mapHeaderListItem = (d) => {
  const statusText  = d.StatusText || ''
  const statusColor = resolveStatusColor(d.Status, statusText)
  const year = d.Year || ''
  return {
    id:           `${d.TrackNo}/${year}`,
    trackingNo:   d.TrackNo,
    year,
    transportMode: resolveTransMode(d.Mode),
    date:          fromSapDateDisplay(d.CreateDate),
    plant:         d.Plant || '',
    plantName:     d.PlantText || '',
    // Use exact StatusText from SAP for sidebar display
    status:        statusText,
    statusCode:    d.Status,
    statusColor,
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
    headers: {
      Accept: 'application/json',
      Loginid: authConfig.loginId,
      Logintype: authConfig.loginType,
    },
    credentials: 'include',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OData ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

// ── CSRF token fetch (needed for POST/PUT/PATCH) ──────────────
async function fetchCsrfToken() {
  const res = await fetch(`${SRV}/`, {
    method: 'GET',
    headers: {
      'X-CSRF-Token': 'Fetch',
      Accept: 'application/json',
      Loginid: authConfig.loginId,
      Logintype: authConfig.loginType,
    },
    credentials: 'include',
  })
  return res.headers.get('X-CSRF-Token') || res.headers.get('x-csrf-token') || ''
}

// ── Generic OData write ───────────────────────────────────────
async function odataWrite(path, payload, method = 'POST') {
  const csrf = await fetchCsrfToken()
  const res = await fetch(`${SRV}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-CSRF-Token': csrf,
      Loginid: authConfig.loginId,
      Logintype: authConfig.loginType,
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OData ${method} ${res.status}: ${text.slice(0, 200)}`)
  }
  if (res.status === 204) return {}
  return res.json()
}

// ═══════════════════════════════════════════════════════════════
// API OBJECT
// ═══════════════════════════════════════════════════════════════
export const goodsMovementApi = {

  // ── List all headers (sidebar) ──────────────────────────────
  async listTrackings({ search = '' } = {}) {
    const filters = []
    if (search.trim()) {
      filters.push(`substringof('${search.trim()}',TrackNo)`)
    }
    const qs = filters.length ? `?$filter=${filters.map(encodeURIComponent).join('%20and%20')}` : ''
    const data = await odata(`/GoodsMvtHeaderSet${qs}`)
    return (data.d?.results || []).map(mapHeaderListItem)
  },

  // ── Get single header + ASN expand ─────────────────────────
  async getTracking(id) {
    const [trackNo, year] = id.split('/')
    const key = `TrackNo='${encodeURIComponent(trackNo)}',Year='${encodeURIComponent(year)}'`
    const expand = '$expand=HeaderAsnNav,HeaderRpmInNav,HeaderRpmOutNav'
    const data = await odata(`/GoodsMvtHeaderSet(${key})?${expand}`)
    return mapHeader(data.d, year)
  },

  // ── Create new tracking ─────────────────────────────────────
  async createTracking(payload) {
    const body = {
      TrackNo:       '',
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
      HeaderAsnNav:  { results: (payload.asns || []).map(a => ({
        Asn:   a.asnId,
        InvNo: a.invoiceNumber,
      }))},
    }
    const data = await odataWrite('/GoodsMvtHeaderSet', body, 'POST')
    return mapHeader(data.d || {})
  },

  // ── Update shipment in-transit (Invoice_Transporter_editSet) ─
  // Called from "Edit" in Update Shipment tab (In Transit status)
  // GET asndropdownSet to get ASN → PUT Invoice_Transporter_editSet(ASN='...',TRACK='...')
  async updateInTransitShipment(trackNo, asnId, payload) {
    // payload: { vehicleNumber, invoiceNumber }
    const key = `ASN='${encodeURIComponent(asnId)}',TRACK='${encodeURIComponent(trackNo)}'`
    const body = {
  ASN:       asnId,
  TRACK:     trackNo,
  INVNO:     payload.invoiceNumber || '',
  TRANSPORT: payload.vehicleNumber || '',
  LRNO:      payload.lrNum || '',
  FINALTRANS: payload.finalTransporterName || '',
}
    return odataWrite(`/Invoice_Transporter_editSet(${key})`, body, 'PUT')
  },

  // ── ASN dropdown for Update Shipment dialog (in-transit) ───
  // GET asndropdownSet?$filter=Track eq 'TRACKNO'
  async searchAsns({ trackNo = '', search = '' } = {}) {
    const filters = []
    if (trackNo) filters.push(`Track eq '${trackNo}'`)
    const qs = filters.length ? `?$filter=${filters.map(encodeURIComponent).join('%20and%20')}` : ''
    const data = await odata(`/asndropdownSet${qs}`)
    let results = (data.d?.results || []).map(mapAsnDropdown)

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      results = results.filter(a =>
        a.asnId.toLowerCase().includes(q) ||
        a.invoiceNumber.toLowerCase().includes(q)
      )
    }
    return results
  },

  // ── Start shipment ──────────────────────────────────────────
  // PUT GoodsMvtHeaderSet(TrackNo='...',Year='...')
  // Payload: { ShipDate, ShipTime, Year, TrackNo, Eta }
  async startShipment(id, payload) {
    const [trackNo, year] = id.split('/')
    const key = `TrackNo='${encodeURIComponent(trackNo)}',Year='${encodeURIComponent(year)}'`

    // Convert time: '12:34:56 PM' or HH:MM:SS → HHMMSS (24h)
    let timeStr = (payload.time || '').replace(/[:\s]/g, '')
    // Handle AM/PM if present
    const rawTime = (payload.time || '').trim()
    const ampmMatch = rawTime.match(/^(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/i)
    if (ampmMatch) {
      let h = parseInt(ampmMatch[1], 10)
      const m = ampmMatch[2]
      const s = ampmMatch[3]
      const period = ampmMatch[4].toUpperCase()
      if (period === 'PM' && h !== 12) h += 12
      if (period === 'AM' && h === 12) h = 0
      timeStr = `${String(h).padStart(2, '0')}${m}${s}`
    } else {
      timeStr = rawTime.replace(/:/g, '').slice(0, 6)
    }

    const body = {
      ShipDate: toSapDate(payload.date) || '',
      ShipTime: timeStr,
      Year:     year,
      TrackNo:  trackNo,
      Eta:      toSapDate(payload.etaDate) || '',
    }
    // SAP uses PUT for start shipment
    return odataWrite(`/GoodsMvtHeaderSet(${key})`, body, 'PUT')
  },

  // ── Cancel tracking ─────────────────────────────────────────
  async cancelTracking(id) {
    const [trackNo, year] = id.split('/')
    const key = `TrackNo='${encodeURIComponent(trackNo)}',Year='${encodeURIComponent(year)}'`
    const csrf = await fetchCsrfToken()
    const res = await fetch(`${SRV}/GoodsMvtHeaderSet(${key})`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-Token': csrf,
        Accept: 'application/json',
        Loginid: authConfig.loginId,
        Logintype: authConfig.loginType,
      },
      credentials: 'include',
    })
    if (!res.ok && res.status !== 204) {
      const text = await res.text().catch(() => '')
      throw new Error(`OData DELETE ${res.status}: ${text.slice(0, 200)}`)
    }
    return { success: true }
  },

  // ── Print ───────────────────────────────────────────────────
  async printTracking(id) {
    const [trackNo, year] = id.split('/')
    return odataWrite(
      `/PrintTrackingSet`,
      { TrackNo: trackNo, Year: year },
      'POST'
    )
  },
}

export default goodsMovementApi