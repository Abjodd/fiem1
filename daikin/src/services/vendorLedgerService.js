// ═══════════════════════════════════════════════════════════════
// vendorLedgerService.js — OData service for Vendor Ledger Report
// Service: SUP_PRTL_VENDR_ITM_DISP_SRV
// ═══════════════════════════════════════════════════════════════

const SRV = '/sap/opu/odata/shiv/SUP_PRTL_VENDR_ITM_DISP_SRV'

// ── SAP Date helpers ──────────────────────────────────────────
// All date conversion is handled here in the service.
// Callers always pass ISO strings (YYYY-MM-DD); service converts internally.

export const toSapDate = (isoDate) => {
  if (!isoDate) return ''
  return isoDate.replace(/-/g, '')
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
    headers: {
      Accept: 'application/json',
      Loginid: 'manishgupta8@kpmg.com',
      Logintype: 'E',
    },
    credentials: 'include',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OData ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

// ── Mappers ───────────────────────────────────────────────────

const mapSupplier = (raw) => ({
  code:     raw.Lifnr,
  name:     raw.Name,
  region:   raw.Regio,
  suppType: raw.SuppType,
  label:    `${raw.Lifnr} — ${raw.Name}`,
})

const mapChildSupplier = (raw) => ({
  code:  raw.Lifnr,
  name:  raw.Name || '',
  label: raw.Name ? `${raw.Lifnr} — ${raw.Name}` : raw.Lifnr,
})

const mapDocType = (raw) => ({
  code:  raw.Blart,
  label: raw.Ltext,
})

const mapInvoice = (raw) => ({
  code:  raw.Xblnr,
  label: '',
})

// VendorDeailsSet → full row
const mapReportRow = (raw) => ({
  supplier:             raw.Lifnr       || '',
  companyCode:          raw.Bukrs       || '',
  childSupplier:        raw.ChildLifnr  || '',
  supplierName:         raw.Name        || '',

  gstId:                raw.Allgstid   || '',
  supplierLocation:     raw.Regio       || '',

  dueDate:              fromSapDateDisplay(raw.Duedate),
  dueDateRaw:           raw.Duedate     || '',
  postingDate:          fromSapDateDisplay(raw.Budat),
  postingDateRaw:       raw.Budat       || '',
  documentDate:         fromSapDateDisplay(raw.Bldat),
  documentDateRaw:      raw.Bldat       || '',

  flagNormal:           raw.Xnorm  || '',
  flagShbv:             raw.Xshbv  || '',
  flagMerk:             raw.Xmerk  || '',
  flagPark:             raw.Xpark  || '',

  currency:             raw.Waers  || '',
  amountDocCurrency:    raw.Dmbtr  || '',
  glAccount:            raw.Saknr  || '',
  clearingDocument:     raw.Augbl  || '',
  documentNumber:       raw.Belnr  || '',

  documentType:         raw.Blart  || '',
  documentTypeText:     raw.Ltext  || '',

  localCurrencyAmount:  raw.Dmshb  || '',
  localCurrency:        raw.Hwaer  || 'INR',

  text:                 raw.Sgtxt  || '',
  specialGlTransaction: raw.Umskz  || '',
  assignment:           raw.Zuonr  || '',

  clearingDate:         raw.IcoAugp || '',

  basicAmount:          raw.BasicAmt || '',
  igstAmount:           raw.IgstAmt  || '',
  sgstAmount:           raw.SgstAmt  || '',
  cgstAmount:           raw.CgstAmt  || '',
  invoiceAmount:        raw.InvAmt   || '',
  tdsAmount:            raw.WithAmt  || '',
  othersAmount:         raw.OthAmt   || '',

  headerText:           raw.Bktxt  || '',
  invoiceNumber:        raw.Xblnr  || '',

  openBalance:          raw.OpenBal  || '',
  closeBalance:         raw.CloseBal || '',
  totalValue:           raw.TotalVal || '',

  color:                raw.Color || '',
})

const mapOpenCloseBal = (raw) => ({
  openBal:  parseFloat(raw.OpenBal  || '0'),
  closeBal: parseFloat(raw.CloseBal || '0'),
})

// ── Filter builder helpers ────────────────────────────────────

// Builds an OData filter string for a field that may have multiple values.
// Single value  → Blart eq 'RE'
// Multiple vals → (Blart eq 'RE' or Blart eq 'KR')
const buildMultiFilter = (field, commaSeparated) => {
  if (!commaSeparated) return null
  const values = commaSeparated.split(',').map(v => v.trim()).filter(Boolean)
  if (!values.length) return null
  if (values.length === 1) return `${field} eq '${values[0]}'`
  return '(' + values.map(v => `${field} eq '${v}'`).join(' or ') + ')'
}

// ── API object ────────────────────────────────────────────────
export const VendorLedgerApi = {

  async fetchSuppliers(skip = 0, top = 50) {
    const data = await odata(`/SupplierCodeHelpSet?$skip=${skip}&$top=${top}`)
    return (data.d?.results || []).map(mapSupplier)
  },

  async fetchChildSuppliers(lifnr) {
    const data = await odata(`/ChildSuppHelpSet?$filter=Lifnr%20eq%20'${encodeURIComponent(lifnr)}'`)
    return (data.d?.results || []).map(mapChildSupplier)
  },

  async fetchDocTypes(skip = 0, top = 50) {
    const data = await odata(`/DocTypeHelpSet?$skip=${skip}&$top=${top}`)
    return (data.d?.results || []).map(mapDocType)
  },

  async fetchInvoices(skip = 0, top = 50) {
    const data = await odata(`/InvoiceHelpSet?$skip=${skip}&$top=${top}`)
    return (data.d?.results || []).map(mapInvoice)
  },

  // All date params accept ISO strings (YYYY-MM-DD); conversion is done here.
  async fetchReport({
    lifnr       = '',
    childLifnr  = '',  // FIX: was missing — child supplier filter now forwarded
    blart       = '',  // FIX: comma-separated values now build proper or-clauses
    xblnr       = '',
    bldat       = '',
    openItem    = '',
    clearedItem = '',
    allItem     = '',
    paStida     = '',
    clearFrom   = '',
    clearTo     = '',
    keyDate     = '',
    postFrom    = '',
    postTo      = '',
    bukrs       = 'DSAL',
  } = {}) {
    const filters = []

    if (lifnr)       filters.push(`Lifnr eq '${lifnr}'`)
    if (childLifnr)  filters.push(`ChildLifnr eq '${childLifnr}'`)

    // Multi-value doc type (or-clause when more than one selected)
    const blartFilter = buildMultiFilter('Blart', blart)
    if (blartFilter)  filters.push(blartFilter)

    if (xblnr)        filters.push(`Xblnr eq '${xblnr}'`)
    if (bldat)        filters.push(`Bldat eq '${toSapDate(bldat)}'`)
    if (openItem)     filters.push(`OpenItem eq '${openItem}'`)
    if (clearedItem)  filters.push(`ClearedItem eq '${clearedItem}'`)
    if (allItem)      filters.push(`AllItem eq '${allItem}'`)
    if (paStida)      filters.push(`PA_STIDA eq '${toSapDate(paStida)}'`)
    if (clearFrom)    filters.push(`AUGDT_LOW eq '${toSapDate(clearFrom)}'`)
    if (clearTo)      filters.push(`AUGDT_HIGH eq '${toSapDate(clearTo)}'`)
    if (keyDate)      filters.push(`PA_STID2 eq '${toSapDate(keyDate)}'`)
    if (postFrom)     filters.push(`BUDAT_LOW eq '${toSapDate(postFrom)}'`)
    if (postTo)       filters.push(`BUDAT_HIGH eq '${toSapDate(postTo)}'`)

    filters.push(`Bukrs eq '${bukrs}'`)

    const filterStr = filters.map(f => encodeURIComponent(f)).join('%20and%20')
    const data = await odata(`/VendorDeailsSet?$filter=${filterStr}`)
    return (data.d?.results || []).map(mapReportRow)
  },

  // Date params accept ISO strings (YYYY-MM-DD); conversion is done here.
  // FIX: was previously expecting pre-converted SAP dates from the caller —
  // now consistent with fetchReport: callers always pass ISO, service converts.
  async fetchOpenCloseBal({
    lifnr      = '',
    childLifnr = '',
    bukrs      = 'DSAL',
    fromDat    = '',
    toDat      = '',
  } = {}) {
    const from = toSapDate(fromDat)
    const to   = toSapDate(toDat) || '00000000'
    const key  = `Lifnr='${encodeURIComponent(lifnr)}',ChildLifnr='${encodeURIComponent(childLifnr)}',Bukrs='${bukrs}',FromDat='${from}',ToDat='${to}'`
    const data = await odata(`/OpenCloseBalSet(${key})`)
    return mapOpenCloseBal(data.d || {})
  },
}

export default VendorLedgerApi