// ═══════════════════════════════════════════════════════════════
// poScheduleService.js — OData service for PO Schedule Report
// Service: NW_SUP_POR_POSC_REPORT_SRV
// ═══════════════════════════════════════════════════════════════

const SRV = '/sap/opu/odata/shiv/NW_SUP_POR_POSC_REPORT_SRV'
export const authConfig = { loginId: '', loginType: '' }

// ── SAP Date helpers ──────────────────────────────────────────
export const toSapDate = (isoDate) => {
  if (!isoDate) return ''
  return isoDate.replace(/-/g, '') // '2026-05-27' → '20260527'
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

// ── Mappers ───────────────────────────────────────────────────

// VendorHelpSet → { Lifnr, Name, POType }
const mapVendor = (raw) => ({
  code:   raw.Lifnr?.trim(),
  name:   raw.Name,
  label:  `${raw.Lifnr?.trim()} — ${raw.Name}`,
})

// POHelpSet → { Ebeln, POType }
const mapPO = (raw) => ({
  code:  raw.Ebeln,
  label: raw.Ebeln,
})

// MaterialHelpSet → { Matnr, Maktx, POType, Ebeln }
const mapMaterial = (raw) => ({
  code:  raw.Matnr,
  label: raw.Maktx,
})

// PlantHelpSet → { Werks, Name1, POType, Matnr, Ebeln }
const mapPlant = (raw) => ({
  code:  raw.Werks,
  name:  raw.Name1,
  label: `${raw.Werks} — ${raw.Name1}`,
})

// PODetailsSet → main report row
const mapReportRow = (raw) => ({
  // Keys
  poSaNumber:           raw.Ebeln,
  poItem:               raw.Ebelp,
  scheduleLineNo:       raw.Etenr,
  poItemNew:            raw.Ebelp_New,
  scheduleLineNoNew:    raw.Etenr_New,
  // Material
  materialNumber:       raw.Matnr,
  materialName:         raw.Maktx,
  // Plant
  plantCode:            raw.Werks,
  plantName:            raw.Name1,
  // Vendor
  vendorCode:           raw.Lifnr?.trim(),
  vendorName:           raw.VendorName,
  // Dates
  deliveryDate:         fromSapDateDisplay(raw.DeliveryDate),
  deliveryDateRaw:      raw.DeliveryDate,
  expectedShipmentDate: fromSapDateDisplay(raw.ExpShipDate),
  expectedShipmentDateRaw: raw.ExpShipDate,
  // Quantities
  poQty:                parseFloat(raw.POQuantity) || 0,
  confirmedQty:         parseFloat(raw.ConfirmQuantity) || 0,
  deliveredQty:         parseFloat(raw.DeliveredQuantity) || 0,
  asnCreated:           parseFloat(raw.ASNCreatedQuantity) || 0,
  pendingAsnQty:        parseFloat(raw.PendingASNQuantity) || 0,
  pendingConfirmQty:    parseFloat(raw.PendingConfirmQuantity) || 0,
  // Unit / Price
  poUnit:               raw.UOM || '',
  netPrice:             raw.Netpr?.trim() || '',
  // Misc
  purchaseGroup:        raw.PurGrp || '',
  docType:              raw.DocType || '',
  status:               raw.Status || '',
  deliveryTime:         raw.DeliveryTime || '',
  grnTime:              raw.GRNTime || '',
  challanNo:            raw.ChallanNo || '',
  poType:               raw.Type === 'P' ? 'Purchase Order' : raw.Type === 'S' ? 'Scheduling Agreement' : raw.Type || '',
})

// ── API object ────────────────────────────────────────────────
export const POScheduleReportApi = {

  // Vendor dropdown
  async fetchVendors(poType = 'P', skip = 0, top = 50) {
    const data = await odata(`/VendorHelpSet?$skip=${skip}&$top=${top}&$filter=POType%20eq%20'${poType}'`)
    return (data.d?.results || []).map(mapVendor)
  },

  // PO Number dropdown
  async fetchPONumbers(poType = 'P', skip = 0, top = 50) {
    const data = await odata(`/POHelpSet?$skip=${skip}&$top=${top}&$filter=POType%20eq%20'${poType}'`)
    return (data.d?.results || []).map(mapPO)
  },

  // Material dropdown (optionally filtered by PO)
  async fetchMaterials(poType = 'P', ebeln = '', skip = 0, top = 50) {
    const data = await odata(`/MaterialHelpSet?$skip=${skip}&$top=${top}&$filter=POType%20eq%20'${poType}'%20and%20Ebeln%20eq%20'${encodeURIComponent(ebeln)}'`)
    return (data.d?.results || []).map(mapMaterial)
  },

  // Plant dropdown (optionally filtered by PO + Material)
  async fetchPlants(poType = 'P', ebeln = '', matnr = '', skip = 0, top = 50) {
    const data = await odata(`/PlantHelpSet?$skip=${skip}&$top=${top}&$filter=POType%20eq%20'${poType}'%20and%20Ebeln%20eq%20'${encodeURIComponent(ebeln)}'%20and%20Matnr%20eq%20'${encodeURIComponent(matnr)}'`)
    return (data.d?.results || []).map(mapPlant)
  },

  // Main report — Go button
  // Builds filter: (FDate ge 'YYYYMMDD' and FDate le 'YYYYMMDD') and Type eq 'P'
  // Additional optional filters: Lifnr, Ebeln, Matnr, Werks
  async fetchReport({
    fDate = '',       // from date SAP YYYYMMDD
    tDate = '',       // to date SAP YYYYMMDD
    type = 'P',       // 'P' = Purchase Order, 'S' = Scheduling Agreement, '' = All
    lifnr = '',       // Vendor
    ebeln = '',       // PO Number
    matnr = '',       // Material
    werks = '',       // Plant
  } = {}) {
    const parts = []
    if (fDate && tDate) parts.push(`(FDate%20ge%20'${fDate}'%20and%20FDate%20le%20'${tDate}')`)
    if (type) parts.push(`Type%20eq%20'${type}'`)
    if (lifnr) parts.push(`Lifnr%20eq%20'${encodeURIComponent(lifnr)}'`)
    if (ebeln) parts.push(`Ebeln%20eq%20'${encodeURIComponent(ebeln)}'`)
    if (matnr) parts.push(`Matnr%20eq%20'${encodeURIComponent(matnr)}'`)
    if (werks) parts.push(`Werks%20eq%20'${encodeURIComponent(werks)}'`)

    const filterStr = parts.join('%20and%20')
    const data = await odata(`/PODetailsSet?$filter=${filterStr}`)
    return (data.d?.results || []).map(mapReportRow)
  },
}

export default POScheduleReportApi