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

function buildFilter(required = {}, optional = {}) {
  const parts = []
  Object.entries(required).forEach(([key, val]) => {
    parts.push(`${key} eq '${val}'`)
  })
  Object.entries(optional).forEach(([key, val]) => {
    if (val && val.trim() !== '') parts.push(`${key} eq '${val}'`)
  })
  return encodeURIComponent(`(${parts.join(' and ')})`)
}

export const ForecastReportApi = {

  async fetchDefaultReport({ bukrs = '', skip = 0, top = 100 } = {}) {
    const f = buildFilter({ Bukrs: bukrs })
    const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
    const data = await odata(`/POSA_REPORT_OUTPUTSet?$filter=${f}${pagination}`)
    return (data.d?.results || []).map(mapReportRow)
  },

  async fetchReport({
  inputDate = '', matnr = '', ebeln = '', supplier = '',
  bukrs = '', mdIndicator = '', skip = 0, top = 100,
} = {}) {
     const f = buildFilter(
    { Bukrs: bukrs },
    { InputDate: inputDate, Matnr: matnr, Ebeln: ebeln, Supplier: supplier }
  )
    const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
  const data = await odata(`/POSA_REPORT_OUTPUTSet?$filter=${f}${pagination}`)
  return (data.d?.results || []).map(mapReportRow)
},

  async fetchMaterials({ inputDate = '', matnr = '', ebeln = '', supplier = '', skip = 0, top = 200 } = {}) {
    const f = buildFilter(
      {},
      { InputDate: inputDate, Matnr: matnr, Ebeln: ebeln, Supplier: supplier }
    )
    const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
    const data = await odata(`/MaterialHelpSet?$filter=${f}${pagination}`)
    return (data.d?.results || []).map(mapMaterial)
  },

  async fetchSaNumbers({ inputDate = '', matnr = '', ebeln = '', supplier = '', skip = 0, top = 200 } = {}) {
    const f = buildFilter(
      {},
      { InputDate: inputDate, Matnr: matnr, Ebeln: ebeln, Supplier: supplier }
    )
    const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
    const data = await odata(`/SaHelpSet?$filter=${f}${pagination}`)
    return (data.d?.results || []).map(mapSa)
  },


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