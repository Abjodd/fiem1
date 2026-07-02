// ═══════════════════════════════════════════════════════════════
// ForecastReport.js — Forecast Report OData Service
// Service: SUPP_PORTAL_POSA_REPORT_SRV
// ═══════════════════════════════════════════════════════════════

const SRV = '/sap/opu/odata/shiv/SUPP_PORTAL_POSA_REPORT_SRV'
export const authConfig = { loginId: '', loginType: '' }

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

const str = (v) => String(v ?? '').trim()
const num = (v) => parseFloat(String(v ?? '0').trim()) || 0

export const toSapDate = (isoDate) => {
  if (!isoDate) return ''
  return isoDate.replace(/-/g, '')
}

// ── Period extractor: W1..W60 → array ─────────────────────────
function extractPeriods(raw) {
  const periods = []
  for (let i = 1; i <= 60; i++) {
    const sd = str(raw[`W${i}Startdate`])
    if (!sd) continue
    periods.push({
      index: i,
      startdate: sd,
      indicator: str(raw[`W${i}Indicator`]),
      schedule:  num(raw[`W${i}Schedule`]),
      supply:    num(raw[`W${i}Supply`]),
    })
  }
  return periods
}

// ── Group daily periods into monthly buckets ──────────────────
export function groupPeriodsMonthly(periods) {
  const map = new Map()
  periods.forEach(p => {
    const parts = p.startdate.split('.')
    if (parts.length !== 3) return
    const monthKey = `${parts[1]}.${parts[2]}`
    const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const mIdx = parseInt(parts[1], 10)
    const label = `${MONTHS[mIdx] || parts[1]} ${parts[2]}`
    if (!map.has(monthKey)) {
      map.set(monthKey, { key: monthKey, label, schedule: 0, supply: 0 })
    }
    const bucket = map.get(monthKey)
    bucket.schedule += p.schedule
    bucket.supply += p.supply
  })
  return Array.from(map.values())
}

// ── Row mapper ────────────────────────────────────────────────
function mapReportRow(raw) {
  return {
    srNo:          raw.SrNo || 0,
    ebeln:         str(raw.Ebeln),
    ebelp:         str(raw.Ebelp),
    supplier:      str(raw.Supplier),
    supplierName:  str(raw.SupplierName),
    werks:         str(raw.Werks),
    matnr:         str(raw.Matnr),
    maktx:         str(raw.Maktx),
    inputDate:     str(raw.InputDate),
    userType:      str(raw.UserType),
    bukrs:         str(raw.Bukrs),
    mdIndicator:   str(raw.MDIndicator),
    cumBacklogQty: num(raw.CumBacklogQty),
    grnQty:        num(raw.GRNQty),
    periods:       extractPeriods(raw),
  }
}

const mapMaterial = (raw) => ({ code: str(raw.Matnr), label: str(raw.Maktx) })
const mapSa       = (raw) => ({ code: str(raw.Ebeln), label: '' })
const mapSupplier = (raw) => ({ code: str(raw.Supplier), label: str(raw.SupplierName) })

// ── Build filter string — only include params that have a value ──
// FIX: Sending empty string filters like Matnr eq '' causes SAP Gateway
//      to crash with an internal server error. Only add a filter clause
//      when the value is actually provided.
function buildFilter(required = {}, optional = {}) {
  const parts = []
  // Required params are always included (e.g. Bukrs, MDIndicator)
  Object.entries(required).forEach(([key, val]) => {
    parts.push(`${key} eq '${val}'`)
  })
  // Optional params are only included when non-empty
  Object.entries(optional).forEach(([key, val]) => {
    if (val && val.trim() !== '') parts.push(`${key} eq '${val}'`)
  })
  return encodeURIComponent(`(${parts.join(' and ')})`)
}

// ═══════════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════════
export const ForecastReportApi = {

  // Page load default — only Bukrs filter, no $skip (SAP may not support it)
  async fetchDefaultReport({ bukrs = 'DSAL', skip = 0, top = 100 } = {}) {
    const f = buildFilter({ Bukrs: bukrs })
    // FIX: Use $skip only when skip > 0, some SAP services reject $skip=0
    const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
    const data = await odata(`/POSA_REPORT_OUTPUTSet?$filter=${f}${pagination}`)
    return (data.d?.results || []).map(mapReportRow)
  },

  // Go button — all filters + pagination
  async fetchReport({
    inputDate = '', matnr = '', ebeln = '', supplier = '',
    bukrs = 'DSAL', mdIndicator = 'D', skip = 0, top = 100,
  } = {}) {
    // FIX: Bukrs and MDIndicator are always required.
    //      InputDate, Matnr, Ebeln, Supplier are optional — only sent if filled.
    const f = buildFilter(
      { Bukrs: bukrs, MDIndicator: mdIndicator },
      { InputDate: inputDate, Matnr: matnr, Ebeln: ebeln, Supplier: supplier }
    )
    // FIX: Use $skip only when skip > 0
    const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
    const data = await odata(`/POSA_REPORT_OUTPUTSet?$filter=${f}${pagination}`)
    return (data.d?.results || []).map(mapReportRow)
  },

  // Material value help
  async fetchMaterials({ inputDate = '', matnr = '', ebeln = '', supplier = '', skip = 0, top = 200 } = {}) {
    const f = buildFilter(
      {},
      { InputDate: inputDate, Matnr: matnr, Ebeln: ebeln, Supplier: supplier }
    )
    const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
    const data = await odata(`/MaterialHelpSet?$filter=${f}${pagination}`)
    return (data.d?.results || []).map(mapMaterial)
  },

  // SA value help
  async fetchSaNumbers({ inputDate = '', matnr = '', ebeln = '', supplier = '', skip = 0, top = 200 } = {}) {
    const f = buildFilter(
      {},
      { InputDate: inputDate, Matnr: matnr, Ebeln: ebeln, Supplier: supplier }
    )
    const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
    const data = await odata(`/SaHelpSet?$filter=${f}${pagination}`)
    return (data.d?.results || []).map(mapSa)
  },


  // Supplier value help
  async fetchSuppliers({ inputDate = '', matnr = '', ebeln = '', supplier = '', skip = 0, top = 200 } = {}) {
    const f = buildFilter(
      {},
      { InputDate: inputDate, Matnr: matnr, Ebeln: ebeln, Supplier: supplier }
    )
    const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
    const data = await odata(`/SupplierHelpSet?$filter=${f}${pagination}`)
    return (data.d?.results || []).map(mapSupplier)
  },
}

export default ForecastReportApi