// ═══════════════════════════════════════════════════════════════
// Gateingateout.js — Gate In / Gate Out OData Service
// Service: SUPP_PORTAL_GATE_ENTRY_SRV
// ═══════════════════════════════════════════════════════════════

const SRV = '/sap/opu/odata/shiv/SUPP_PORTAL_GATE_ENTRY_SRV'
export const authConfig = { loginId: '', loginType: '' }

const str = (v) => String(v ?? '').trim()
const num = (v) => parseFloat(String(v ?? '0').trim()) || 0

// ── Date / Time helpers ───────────────────────────────────────
export const fromSapDateDisplay = (sapDate) => {
  if (!sapDate || sapDate === '00000000') return ''
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const y = sapDate.slice(0, 4)
  const m = parseInt(sapDate.slice(4, 6), 10) - 1
  const d = parseInt(sapDate.slice(6, 8), 10)
  return `${months[m]} ${String(d).padStart(2, '0')}, ${y}`
}

const formatTimestamp = (sapDate, sapTime) => {
  if (!sapDate || sapDate === '00000000') return null
  if (!sapTime || sapTime === '000000') return fromSapDateDisplay(sapDate)
  return `${sapDate.slice(6,8)}.${sapDate.slice(4,6)}.${sapDate.slice(0,4)} ${sapTime.slice(0,2)}:${sapTime.slice(2,4)}`
}

const TRANS_MODE = { '01': 'By Road', '02': 'By Air', '03': 'By Rail', '04': 'By Sea' }

// ── Status resolver ───────────────────────────────────────────
const resolveStatus = (code, text) => {
  const label = str(text) || 'Unknown'
  const t = (text || '').toLowerCase()
  let color = 'gray'
  if (t.includes('transit') || t.includes('shipped') || t.includes('entry')) color = 'blue'
  else if (t.includes('reported') || t.includes('reached'))                  color = 'orange'
  else if (t.includes('received') || t.includes('completed'))                color = 'green'
  return { label, color }
}

// ── Timeline builder ──────────────────────────────────────────
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
    completed: !!(d.RepDate && d.RepDate !== '00000000' && d.RepDate !== ''),
    timestamp: formatTimestamp(d.RepDate, d.RepTime),
  },
  {
    key: 'gate_entry_in',
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
    key: 'gate_entry_out',
    label: 'Gate Entry (Out)',
    completed: !!(d.OutDate && d.OutDate !== '00000000'),
    timestamp: formatTimestamp(d.OutDate, d.OutTime),
  },
]

// ── ASN mapper ────────────────────────────────────────────────
const mapAsn = (raw) => ({
  asnId:          `${str(raw.Asn)}/${str(raw.AsnYear)}`,
  asnNum:         str(raw.Asn),
  asnYear:        str(raw.AsnYear),
  totalLineItems: parseInt(str(raw.ItmCount) || '0', 10),
  ibdNumber:      str(raw.IbdNo),
  doc103Number:   str(raw.Doc103No),
  plant:          str(raw.Plant),
  invoiceNumber:  str(raw.Invoice_Num),
  invoiceAmount:  num(raw.Price),
  invoiceDate:    fromSapDateDisplay(str(raw.Invoice_Date)),
  currency:       str(raw.Curr) || 'INR',
})

// ── ASN item mapper ───────────────────────────────────────────
const mapAsnItem = (raw) => ({
  asnNum:       str(raw.AsnNum),
  fisYear:      str(raw.FisYear),
  item:         str(raw.Item),
  material:     str(raw.Matnr),
  materialDesc: str(raw.Maktx),
  quantity:     num(raw.Menge),
  unit:         str(raw.Meins),
  price:        num(raw.Netpr),
  perUnitPrice: num(raw.PerUnitPrice),
  currency:     str(raw.Currency) || 'INR',
  hsnCode:      str(raw.HsnCode),
})

// ── Header mapper ─────────────────────────────────────────────
const mapHeader = (d) => {
  const status = resolveStatus(d.Status, d.StatusText)
  return {
    id:                      `${str(d.TrackNo)}/${str(d.Year)}`,
    trackingNo:              str(d.TrackNo),
    year:                    str(d.Year),
    status:                  status.label,
    statusCode:              str(d.Status),
    statusColor:             status.color,
    statusText:              str(d.StatusText),
    transporter:             str(d.Transporter),
    driverName:              str(d.Person),
    contact:                 str(d.Contact),
    transportMode:           TRANS_MODE[str(d.Mode)] || str(d.Mode),
    vehicleRegNo:            str(d.RegNum),
    vendor:                  `${str(d.Vendor)}, ${str(d.Name)}`,
    vendorName:              str(d.Name),
    vendorCode:              str(d.Vendor),
    date:                    fromSapDateDisplay(d.CreateDate),
    etaDate:                 fromSapDateDisplay(d.Eta),
    ewayBillNo:              str(d.EwayBill),
    ewayBillDate:            fromSapDateDisplay(d.EwayBillDate),
    pollutionCertApplicable: str(d.Pollution_crtapp) || 'No',
    safetyEquipments:        str(d.Safetyeqp) === 'Yes' ? 'Yes' : 'No',
    safetyGuardForMaterial:  str(d.Safetygudmat) === 'Yes' ? 'Yes' : 'No',
    totalAsnAmount:          num(d.Totalasnamt),
    gateOutFlag:             str(d.GateOutFlag),
    mblnr:                   str(d.Mblnr),
    mjahr:                   str(d.Mjahr),
    timeline:                buildTimeline(d),
    asns:                    (d.HeaderAsnNav?.results || []).map(mapAsn),
    rpmIn:                   d.HeaderRpmInNav?.results || [],
    rpmOut:                  d.HeaderRpmOutNav?.results || [],
  }
}

// ═══════════════════════════════════════════════════════════════
// OData transport helpers
// ═══════════════════════════════════════════════════════════════

const buildKey = (trackNo, year) => `TrackNo='${trackNo}',Year='${year}'`

const BASE_HEADERS = {
  Accept:    'application/json',
      Loginid: authConfig.loginId,
      Logintype: authConfig.loginType,
}

// ── SAP error extractor ───────────────────────────────────────
function extractSapError(responseText, method, status) {
  try {
    const errJson = JSON.parse(responseText)
    const details = errJson?.error?.innererror?.errordetails
    if (Array.isArray(details) && details.length > 0) {
      const errDetail = details.find((d) => d.severity === 'error') || details[0]
      if (errDetail?.message) return errDetail.message
    }
    if (errJson?.error?.message?.value) return errJson.error.message.value
    if (typeof errJson?.error?.message === 'string') return errJson.error.message
  } catch {
    // JSON parse failed — fall through
  }
  return `OData ${method} ${status}: ${responseText.slice(0, 300)}`
}

// ── GET ───────────────────────────────────────────────────────
async function odata(path) {
  const res = await fetch(`${SRV}${path}`, {
    method: 'GET',
    headers: BASE_HEADERS,
    credentials: 'include',
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(extractSapError(t, 'GET', res.status))
  }
  return res.json()
}

// ── CSRF token fetch ──────────────────────────────────────────
async function fetchCsrfToken() {
  const res = await fetch(`${SRV}/`, {
    method: 'GET',
    headers: { ...BASE_HEADERS, 'X-CSRF-Token': 'Fetch' },
    credentials: 'include',
  })
  const token = res.headers.get('X-CSRF-Token') || ''
  if (!token) console.warn('[CSRF] No X-CSRF-Token returned — writes may fail with 403')
  return token
}

// ── Write with pre-fetched token ─────────────────────────────
async function odataWriteWithToken(token, path, payload, method) {
  const res = await fetch(`${SRV}${path}`, {
    method,
    headers: {
      ...BASE_HEADERS,
      'Content-Type': 'application/json',
      'X-CSRF-Token': token,
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(extractSapError(t, method, res.status))
  }
  if (res.status === 204) return {}
  return res.json()
}

// ── Write with auto CSRF fetch ────────────────────────────────
async function odataWrite(path, payload, method) {
  const token = await fetchCsrfToken()
  return odataWriteWithToken(token, path, payload, method)
}

// ═══════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════
export const gateEntryApi = {

  // ── READ: full header with nav expansions ───────────────────
  async getTracking(trackNo, year) {
    const key  = buildKey(trackNo, year)
    const data = await odata(
      `/GateEntryHeaderSet(${key})?$expand=HeaderAsnNav,HeaderRpmInNav,HeaderRpmOutNav`
    )
    if (!data?.d) throw new Error('No record found')
    return mapHeader(data.d)
  },

  // ── READ: ASN summary rows for a tracking entry ─────────────
  async getAsnData(trackNo, year) {
    const filter = encodeURIComponent(`TrackNo eq '${trackNo}' and Year eq '${year}'`)
    const data   = await odata(`/ASNDataSet?$filter=${filter}`)
    return (data.d?.results || []).map(mapAsnItem)
  },

  // ── READ: line items for one ASN ────────────────────────────
  async getAsnItems(asnNum, fisYear) {
    const filter = encodeURIComponent(`AsnNum eq '${asnNum}' and FisYear eq '${fisYear}'`)
    const data   = await odata(`/AsnItemSet?$filter=${filter}`)
    return (data.d?.results || []).map(mapAsnItem)
  },

  // ── WRITE: Gate Reporting ────────────────────────────────────
  // PATCH → backend sets RepDate/RepTime, moves status to "Gate Reported"
  async processGateReporting(trackNo, year) {
    const key = buildKey(trackNo, year)
    return odataWrite(
      `/GateEntryHeaderSet(${key})`,
      { TrackNo: trackNo, Year: year },
      'PATCH'
    )
  },

  // ── WRITE: Gate In ───────────────────────────────────────────
  //
  // FIX 1: Removed this.getTracking() — `this` is undefined when called as
  //         gateEntryApi.processGateIn(...). The UI re-fetches and passes
  //         fresh header in, so the guard check is always reliable.
  //
  // FIX 2: freshHeader parameter — caller passes the just-refreshed tracking
  //         object so we never check stale state from before Gate Reporting.
  //
  // Flow:
  //   Step 1 — PATCH GateEntryHeaderSet  → SAP transitions to "Gate In"
  //   Step 2 — PUT   ASNHeaderSet        → SAP creates GR document
  //   Step 3 — GET   GateNumberSet       → reads Gno + Mblnr103
  //
  async processGateIn(trackNo, year, asnNum, asnYear, freshHeader) {
    const gateReportingDone = freshHeader?.timeline
      ?.find(t => t.key === 'gate_reporting')?.completed

    if (!gateReportingDone) {
      throw new Error(
        `Gate Reporting must be completed before Gate In. ` +
        `Current status: "${freshHeader?.statusText || 'Unknown'}"`
      )
    }

    const headerKey = buildKey(trackNo, year)
    const asnKey    = `AsnNum='${asnNum}',FisYear='${asnYear}',Bwart=''`

    const token = await fetchCsrfToken()

    // ── REMOVED: PATCH GateEntryHeaderSet ────────────────────────
    // When status is "Gate Reported", SAP rejects the PATCH with 400.
    // The PATCH is only for Gate Reporting transition, not Gate In.
    // Gate In is triggered directly by the PUT on ASNHeaderSet.

    // Step 1: PUT — this is the actual Gate In trigger
    await odataWriteWithToken(
      token,
      `/ASNHeaderSet(${asnKey})`,
      {
        AsnNum:       asnNum,
        FisYear:      asnYear,
        TrackingNo:   trackNo,
        TrackingYear: year,
        Lfsnr:        'TRD',
      },
      'PUT'
    )

    // Step 2: GET — read the generated gate number and reference doc
    const numData = await odata(`/GateNumberSet(${headerKey})`)
    return {
      Gno:      str(numData.d?.Gno      || ''),
      Mblnr103: str(numData.d?.Mblnr103 || ''),
    }
  },
}

export default gateEntryApi