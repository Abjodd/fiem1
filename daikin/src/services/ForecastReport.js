// ═══════════════════════════════════════════════════════════════
// ForecastReport.js — Forecast Report OData Service
// Service: SUPP_PORTAL_POSA_REPORT_SRV
// ═══════════════════════════════════════════════════════════════

const SRV = '/sap/opu/odata/shiv/SUPP_PORTAL_POSA_REPORT_SRV'

async function odata(path) {
  const res = await fetch(`${SRV}${path}`, {
    headers: {
      Accept: 'application/json',
      Loginid: "401122",
      Logintype: "P",

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
      startdate: sd,                 // 'dd.MM.yyyy'
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

// ═══════════════════════════════════════════════════════════════
// API — with pagination ($skip / $top)
// ═══════════════════════════════════════════════════════════════
export const ForecastReportApi = {

  // Page load default
  async fetchDefaultReport({ bukrs = 'DSAL', skip = 0, top = 100 } = {}) {
    const data = await odata(
      `/POSA_REPORT_OUTPUTSet?$filter=Bukrs%20eq%20'${bukrs}'&$skip=${skip}&$top=${top}`
    )
    return (data.d?.results || []).map(mapReportRow)
  },

  // Go button — all filters + pagination
  async fetchReport({
    inputDate = '', matnr = '', ebeln = '', supplier = '',
    bukrs = 'DSAL', mdIndicator = 'D', skip = 0, top = 100,
  } = {}) {
    const parts = [
      `InputDate eq '${inputDate}'`,
      `Matnr eq '${matnr}'`,
      `Ebeln eq '${ebeln}'`,
      `Supplier eq '${supplier}'`,
      `Bukrs eq '${bukrs}'`,
      `MDIndicator eq '${mdIndicator}'`,
    ]
    const filterStr = encodeURIComponent(`(${parts.join(' and ')})`)
    const data = await odata(`/POSA_REPORT_OUTPUTSet?$filter=${filterStr}&$skip=${skip}&$top=${top}`)
    return (data.d?.results || []).map(mapReportRow)
  },

  // Material value help
  async fetchMaterials({ inputDate = '', matnr = '', ebeln = '', supplier = '', skip = 0, top = 20 } = {}) {
    const parts = [
      `InputDate eq '${inputDate}'`,
      `Matnr eq '${matnr}'`,
      `Ebeln eq '${ebeln}'`,
      `Supplier eq '${supplier}'`,
    ]
    const f = encodeURIComponent(`(${parts.join(' and ')})`)
    const data = await odata(`/MaterialHelpSet?$skip=${skip}&$top=${top}&$filter=${f}`)
    return (data.d?.results || []).map(mapMaterial)
  },

  // SA value help
  async fetchSaNumbers({ inputDate = '', matnr = '', ebeln = '', supplier = '', skip = 0, top = 20 } = {}) {
    const parts = [
      `InputDate eq '${inputDate}'`,
      `Matnr eq '${matnr}'`,
      `Ebeln eq '${ebeln}'`,
      `Supplier eq '${supplier}'`,
    ]
    const f = encodeURIComponent(`(${parts.join(' and ')})`)
    const data = await odata(`/SaHelpSet?$skip=${skip}&$top=${top}&$filter=${f}`)
    return (data.d?.results || []).map(mapSa)
  },

  // Supplier value help
  async fetchSuppliers({ inputDate = '', matnr = '', ebeln = '', supplier = '', skip = 0, top = 20 } = {}) {
    const parts = [
      `InputDate eq '${inputDate}'`,
      `Matnr eq '${matnr}'`,
      `Ebeln eq '${ebeln}'`,
      `Supplier eq '${supplier}'`,
    ]
    const f = encodeURIComponent(`(${parts.join(' and ')})`)
    const data = await odata(`/SupplierHelpSet?$skip=${skip}&$top=${top}&$filter=${f}`)
    return (data.d?.results || []).map(mapSupplier)
  },
}

export default ForecastReportApi
