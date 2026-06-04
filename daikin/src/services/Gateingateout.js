// ═══════════════════════════════════════════════════════════════
// gateEntryService.js — Gate In / Gate Out OData Service
// Service: SUPP_PORTAL_GATE_ENTRY_SRV
// ═══════════════════════════════════════════════════════════════

const SRV = '/sap/opu/odata/shiv/SUPP_PORTAL_GATE_ENTRY_SRV'

const str = (v) => String(v ?? '').trim()
const num = (v) => parseFloat(String(v ?? '0').trim()) || 0

export const fromSapDateDisplay = (sapDate) => {
  if (!sapDate || sapDate === '00000000') return ''
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const y = sapDate.slice(0, 4), m = parseInt(sapDate.slice(4, 6), 10) - 1, d = parseInt(sapDate.slice(6, 8), 10)
  return `${months[m]} ${String(d).padStart(2, '0')}, ${y}`
}

const formatTimestamp = (sapDate, sapTime) => {
  if (!sapDate || sapDate === '00000000') return null
  if (!sapTime || sapTime === '000000') return fromSapDateDisplay(sapDate)
  return `${sapDate.slice(6,8)}.${sapDate.slice(4,6)}.${sapDate.slice(0,4)} ${sapTime.slice(0,2)}:${sapTime.slice(2,4)}`
}

const TRANS_MODE = { '01': 'By Road', '02': 'By Air', '03': 'By Rail', '04': 'By Sea' }

const STATUS_MAP = {
  '01': { label: 'Created',         color: 'gray'   },
  '02': { label: 'Yet to Ship',     color: 'gray'   },
  '03': { label: 'Shipped',         color: 'blue'   },
  '04': { label: 'In Transit',      color: 'blue'   },
  '05': { label: 'Reached Plant',   color: 'orange' },
  '06': { label: 'Gate Reported',   color: 'orange' },
  '07': { label: 'Gate Entry (IN)', color: 'blue'   },
  '08': { label: 'Gate Reported',   color: 'orange' },
  '09': { label: 'Goods Received',  color: 'green'  },
  '10': { label: 'Gate Entry (Out)',color: 'green'  },
  '11': { label: 'Completed',       color: 'green'  },
}

const resolveStatus = (code, text) => {
  if (STATUS_MAP[code]) return STATUS_MAP[code]
  const t = (text || '').toLowerCase()
  if (t.includes('reported'))  return { label: text, color: 'orange' }
  if (t.includes('reached'))   return { label: text, color: 'orange' }
  if (t.includes('entry'))     return { label: text, color: 'blue'   }
  if (t.includes('received'))  return { label: text, color: 'green'  }
  if (t.includes('shipped'))   return { label: text, color: 'blue'   }
  if (t.includes('completed')) return { label: text, color: 'green'  }
  return { label: text || 'Unknown', color: 'gray' }
}

// ── Timeline builder ──────────────────────────────────────────
const buildTimeline = (d) => [
  { key: 'created',        label: 'Created',          completed: !!(d.CreateDate && d.CreateDate !== '00000000'), timestamp: formatTimestamp(d.CreateDate, d.CreateTime) },
  { key: 'shipped',        label: 'Shipped',          completed: !!(d.ShipDate && d.ShipDate !== '00000000'),     timestamp: formatTimestamp(d.ShipDate, d.ShipTime) },
  { key: 'gate_reporting', label: 'Gate Reporting',   completed: !!(d.RepDate && d.RepDate !== '00000000'),       timestamp: formatTimestamp(d.RepDate, d.RepTime) },
  { key: 'gate_entry_in',  label: 'Gate Entry (IN)',  completed: !!(d.InDate && d.InDate !== '00000000'),         timestamp: formatTimestamp(d.InDate, d.InTime) },
  { key: 'goods_received', label: 'Goods Received',   completed: !!(d.GrDate && d.GrDate !== '00000000'),         timestamp: formatTimestamp(d.GrDate, d.GrTime) },
  { key: 'gate_entry_out', label: 'Gate Entry (Out)', completed: !!(d.OutDate && d.OutDate !== '00000000'),       timestamp: formatTimestamp(d.OutDate, d.OutTime) },
]

// ── ASN mapper (from HeaderAsnNav) ────────────────────────────
const mapAsn = (raw) => ({
  asnId:         `${str(raw.Asn)}/${str(raw.AsnYear)}`,
  asnNum:        str(raw.Asn),
  asnYear:       str(raw.AsnYear),
  totalLineItems: parseInt(str(raw.ItmCount) || '0', 10),
  ibdNumber:     str(raw.IbdNo),
  doc103Number:  str(raw.Doc103No),
  plant:         str(raw.Plant),
  invoiceNumber: str(raw.Invoice_Num),
  invoiceAmount: num(raw.Price),
  invoiceDate:   fromSapDateDisplay(str(raw.Invoice_Date)),
  currency:      str(raw.Curr) || 'INR',
})

// ── ASN item mapper (from AsnItemSet) ─────────────────────────
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
    id:           `${d.TrackNo}/${d.Year}`,
    trackingNo:   str(d.TrackNo),
    year:         str(d.Year),
    status:       status.label,
    statusCode:   str(d.Status),
    statusColor:  status.color,
    statusText:   str(d.StatusText),
    transporter:  str(d.Transporter),
    driverName:   str(d.Person),
    contact:      str(d.Contact),
    transportMode: TRANS_MODE[str(d.Mode)] || str(d.Mode),
    vehicleRegNo: str(d.RegNum),
    vendor:       `${str(d.Vendor)},${str(d.Name)}`,
    vendorName:   str(d.Name),
    vendorCode:   str(d.Vendor),
    date:         fromSapDateDisplay(d.CreateDate),
    etaDate:      fromSapDateDisplay(d.Eta),
    ewayBillNo:   str(d.EwayBill),
    ewayBillDate: fromSapDateDisplay(d.EwayBillDate),
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

// ── OData helpers ─────────────────────────────────────────────
async function odata(path) {
  const res = await fetch(`${SRV}${path}`, {
    headers: { Accept: 'application/json' ,Loginid: "vakeel.ahmad@daikinindia.com",
        Logintype: "E",},
    credentials: 'include',
  })
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(`OData ${res.status}: ${t.slice(0, 200)}`) }
  return res.json()
}

// async function fetchCsrfToken() {
//   const res = await fetch(`${SRV}/`, { method: 'GET', headers: { 'X-CSRF-Token': 'Fetch', Accept: 'application/json' }, credentials: 'include' })
//   return res.headers.get('X-CSRF-Token') || ''
// }

async function odataWrite(path, payload, method = 'POST') {
  const res = await fetch(`${SRV}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Loginid: "vakeel.ahmad@daikinindia.com",
      Logintype: "E",
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(`OData ${method} ${res.status}: ${t.slice(0, 200)}`) }
  if (res.status === 204) return {}
  return res.json()
}

// ═══════════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════════
export const gateEntryApi = {

  // GET GateEntryHeaderSet(TrackNo='...',Year='...')?$expand=HeaderAsnNav,HeaderRpmInNav,HeaderRpmOutNav
  async getTracking(trackNo, year) {
    const key = `TrackNo='${encodeURIComponent(trackNo)}',Year='${encodeURIComponent(year)}'`
    const data = await odata(`/GateEntryHeaderSet(${key})?$expand=HeaderAsnNav,HeaderRpmInNav,HeaderRpmOutNav`)
    return mapHeader(data.d)
  },

  // GET ASNDataSet?$filter=TrackNo eq '...' and Year eq '...'
  // Returns summary-level ASN item data
  async getAsnData(trackNo, year) {
    const f = encodeURIComponent(`TrackNo eq '${trackNo}' and Year eq '${year}'`)
    const data = await odata(`/ASNDataSet?$filter=${f}`)
    return (data.d?.results || []).map(mapAsnItem)
  },

  // GET AsnItemSet?$filter=AsnNum eq '...' and FisYear eq '...'
  // Returns item details when clicking on an ASN number
  async getAsnItems(asnNum, fisYear) {
    const f = encodeURIComponent(`AsnNum eq '${asnNum}' and FisYear eq '${fisYear}'`)
    const data = await odata(`/AsnItemSet?$filter=${f}`)
    return (data.d?.results || []).map(mapAsnItem)
  },

  // Gate Reporting — PATCH GateEntryHeaderSet
  async processGateReporting(trackNo, year) {
    const key = `TrackNo='${encodeURIComponent(trackNo)}',Year='${encodeURIComponent(year)}'`
    return odataWrite(`/GateEntryHeaderSet(${key})`, {}, 'PATCH')
  },

  // Gate In — GET GateNumberSet(TrackNo='...',Year='...')
  async processGateIn(trackNo, year) {
  const key = `TrackNo='${encodeURIComponent(trackNo)}',Year='${encodeURIComponent(year)}'`
  const data = await odata(`/GateNumberSet(${key})`)
  return data.d || {}
},
}

export default gateEntryApi