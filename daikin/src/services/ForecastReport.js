// ═══════════════════════════════════════════════════════════════
// forecastReportService.js — Forecast Report OData Service
// Service: SUPP_PORTAL_POSA_REPORT_SRV
// ═══════════════════════════════════════════════════════════════

const SRV = '/sap/opu/odata/shiv/SUPP_PORTAL_POSA_REPORT_SRV'

// ── OData fetch helper ────────────────────────────────────────
async function odata(path) {
  const res = await fetch(`${SRV}${path}`, {
    headers: { Accept: 'application/json', Loginid: "401122",
        Logintype: "P",},
    credentials: 'include',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OData ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

// ── Value helpers ─────────────────────────────────────────────
const str = (v) => String(v ?? '').trim()
const num = (v) => parseFloat(String(v ?? '0').trim()) || 0

// SAP date 'YYYYMMDD' → 'YYYYMMDD' (for filters)
export const toSapDate = (isoDate) => {
  if (!isoDate) return ''
  return isoDate.replace(/-/g, '')
}

// ── Period extractor ──────────────────────────────────────────
// SAP returns W1..W60 with Startdate, Indicator, Schedule, Supply
// We flatten them into an array of period objects
function extractPeriods(raw) {
  const periods = []
  for (let i = 1; i <= 60; i++) {
    const prefix = `W${i}`
    const startdate = str(raw[`${prefix}Startdate`])
    if (!startdate) continue
    periods.push({
      index: i,
      startdate,                           // 'dd.MM.yyyy'
      indicator: str(raw[`${prefix}Indicator`]),  // 'T' etc.
      schedule: num(raw[`${prefix}Schedule`]),
      supply: num(raw[`${prefix}Supply`]),
    })
  }
  return periods
}

// ── Row mapper ────────────────────────────────────────────────
function mapReportRow(raw) {
  return {
    srNo:             raw.SrNo || 0,
    ebeln:            str(raw.Ebeln),          // SA / PO number
    ebelp:            str(raw.Ebelp),          // Line item
    supplier:         str(raw.Supplier),
    supplierName:     str(raw.SupplierName),
    werks:            str(raw.Werks),          // Plant
    matnr:            str(raw.Matnr),          // Material number
    maktx:            str(raw.Maktx),          // Material description
    inputDate:        str(raw.InputDate),
    userType:         str(raw.UserType),
    bukrs:            str(raw.Bukrs),
    mdIndicator:      str(raw.MDIndicator),    // 'D' daily, 'M'/'W' monthly/weekly
    cumBacklogQty:    num(raw.CumBacklogQty),
    grnQty:           num(raw.GRNQty),
    periods:          extractPeriods(raw),
  }
}

// ── Material value help mapper ────────────────────────────────
function mapMaterial(raw) {
  return {
    code:  str(raw.Matnr),
    label: str(raw.Maktx),
  }
}

// ── SA value help mapper ──────────────────────────────────────
function mapSa(raw) {
  return {
    code:  str(raw.Ebeln),
    label: '',
  }
}

// ═══════════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════════
export const ForecastReportApi = {

  // Page load — fetch default report
  // GET POSA_REPORT_OUTPUTSet?$filter=Bukrs eq 'DSAL'
  async fetchDefaultReport(bukrs = 'DSAL') {
    const data = await odata(
      `/POSA_REPORT_OUTPUTSet?$filter=Bukrs%20eq%20'${bukrs}'`
    )
    return (data.d?.results || []).map(mapReportRow)
  },

  // Go button — fetch with all filters
  // GET POSA_REPORT_OUTPUTSet?$filter=(InputDate eq '...' and Matnr eq '...' and ...)
  async fetchReport({
    inputDate = '',      // YYYYMMDD
    matnr = '',          // Material number
    ebeln = '',          // SA number
    supplier = '',       // Supplier code
    bukrs = 'DSAL',
    mdIndicator = 'D',   // 'D' daily, 'M' monthly
  } = {}) {
    const parts = []
    parts.push(`InputDate eq '${inputDate}'`)
    parts.push(`Matnr eq '${matnr}'`)
    parts.push(`Ebeln eq '${ebeln}'`)
    parts.push(`Supplier eq '${supplier}'`)
    parts.push(`Bukrs eq '${bukrs}'`)
    parts.push(`MDIndicator eq '${mdIndicator}'`)

    const filterStr = encodeURIComponent(`(${parts.join(' and ')})`)
    const data = await odata(`/POSA_REPORT_OUTPUTSet?$filter=${filterStr}`)
    return (data.d?.results || []).map(mapReportRow)
  },

  // Material value help
  // GET MaterialHelpSet?$skip=0&$top=20&$filter=(InputDate eq '...' and ...)
  async fetchMaterials({ inputDate = '', matnr = '', ebeln = '', supplier = '', skip = 0, top = 20 } = {}) {
    const parts = [
      `InputDate eq '${inputDate}'`,
      `Matnr eq '${matnr}'`,
      `Ebeln eq '${ebeln}'`,
      `Supplier eq '${supplier}'`,
    ]
    const filterStr = encodeURIComponent(`(${parts.join(' and ')})`)
    const data = await odata(`/MaterialHelpSet?$skip=${skip}&$top=${top}&$filter=${filterStr}`)
    return (data.d?.results || []).map(mapMaterial)
  },

  // SA value help
  // GET SaHelpSet?$skip=0&$top=20&$filter=(InputDate eq '...' and ...)
  async fetchSaNumbers({ inputDate = '', matnr = '', ebeln = '', supplier = '', skip = 0, top = 20 } = {}) {
    const parts = [
      `InputDate eq '${inputDate}'`,
      `Matnr eq '${matnr}'`,
      `Ebeln eq '${ebeln}'`,
      `Supplier eq '${supplier}'`,
    ]
    const filterStr = encodeURIComponent(`(${parts.join(' and ')})`)
    const data = await odata(`/SaHelpSet?$skip=${skip}&$top=${top}&$filter=${filterStr}`)
    return (data.d?.results || []).map(mapSa)
  },
}

export default ForecastReportApi