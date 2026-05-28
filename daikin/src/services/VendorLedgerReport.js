const SRV = '/sap/opu/odata/shiv/SUP_PRTL_VENDR_ITM_DISP_SRV'

// ── SAP Date helpers ──────────────────────────────────────────
// SAP dates: 'YYYYMMDD', UI dates: 'YYYY-MM-DD'
export const toSapDate = (isoDate) => {
  if (!isoDate) return ''
  return isoDate.replace(/-/g, '') // '2026-05-27' → '20260527'
}

export const fromSapDate = (sapDate) => {
  if (!sapDate || sapDate === '00000000') return ''
  // '20260527' → '2026-05-27'
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
    headers: { Accept: 'application/json' },
    credentials: 'include',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OData ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

// ── Mappers ───────────────────────────────────────────────────

// SupplierCodeHelpSet → [{ Lifnr, Name, Regio, SuppType }]
const mapSupplier = (raw) => ({
  code:     raw.Lifnr,
  name:     raw.Name,
  region:   raw.Regio,
  suppType: raw.SuppType,
  label:    `${raw.Lifnr} — ${raw.Name}`,
})

// ChildSuppHelpSet → [{ Lifnr, Name, ... }]
const mapChildSupplier = (raw) => ({
  code:  raw.Lifnr,
  name:  raw.Name || '',
  label: raw.Name ? `${raw.Lifnr} — ${raw.Name}` : raw.Lifnr,
})

// DocTypeHelpSet → [{ Blart, Ltext }]
const mapDocType = (raw) => ({
  code:  raw.Blart,
  label: raw.Ltext,
})

// InvoiceHelpSet → [{ Xblnr }]
const mapInvoice = (raw) => ({
  code:  raw.Xblnr,
  label: '',
})

// VendorDeailsSet → main report row
const mapReportRow = (raw) => ({
  supplier:             raw.Lifnr || '',
  supplierName:         raw.Name1 || '',
  companyCode:          raw.Bukrs || '',
  invoiceNumber:        raw.Xblnr || '',
  supplierLocation:     raw.Regio || '',
  postingDate:          fromSapDateDisplay(raw.Budat),
  postingDateRaw:       raw.Budat || '',
  barcode:              raw.Barcode || '',
  basic:                raw.Dmbtr || '',
  taxDetails:           raw.TaxAmt || '',
  totalInvoiceAmount:   raw.Wrbtr || '',
  tds:                  raw.TdsAmt || '',
  others:               raw.OthAmt || '',
  amountPayable:        raw.PayAmt || '',
  specialGlTransaction: raw.Umskz || '',
  clearingDocument:     raw.Augbl || '',
  documentNumber:       raw.Belnr || '',
  documentType:         raw.Blart || '',
  documentDate:         fromSapDateDisplay(raw.Bldat),
  documentDateRaw:      raw.Bldat || '',
  localCurrencyAmount:  raw.Dmbtr || '',
  localCurrency:        raw.Waers || 'INR',
  text:                 raw.Sgtxt || '',
  assignment:           raw.Zuonr || '',
  dueDate:              fromSapDateDisplay(raw.Zfbdt),
  dueDateRaw:           raw.Zfbdt || '',
})

// OpenCloseBalSet
const mapOpenCloseBal = (raw) => ({
  openBal:  parseFloat(raw.OpenBal || '0'),
  closeBal: parseFloat(raw.CloseBal || '0'),
})

// ── API object ────────────────────────────────────────────────
export const VendorLedgerApi = {

  // Fetch supplier list for top-level dropdown
  async fetchSuppliers(skip = 0, top = 50) {
    const data = await odata(`/SupplierCodeHelpSet?$skip=${skip}&$top=${top}`)
    return (data.d?.results || []).map(mapSupplier)
  },

  // Fetch child suppliers after selecting a parent supplier
  async fetchChildSuppliers(lifnr) {
    const data = await odata(`/ChildSuppHelpSet?$filter=Lifnr%20eq%20'${encodeURIComponent(lifnr)}'`)
    return (data.d?.results || []).map(mapChildSupplier)
  },

  // Document Type dropdown (multi-select)
  async fetchDocTypes(skip = 0, top = 50) {
    const data = await odata(`/DocTypeHelpSet?$skip=${skip}&$top=${top}`)
    return (data.d?.results || []).map(mapDocType)
  },

  // Invoice Number dropdown
  async fetchInvoices(skip = 0, top = 50) {
    const data = await odata(`/InvoiceHelpSet?$skip=${skip}&$top=${top}`)
    return (data.d?.results || []).map(mapInvoice)
  },

  // Main report — Go button
  // Params shaped exactly to match SAP filter string
  async fetchReport({
    lifnr = '',           // Supplier (Lifnr)
    blart = '',           // Document types comma-joined e.g. '0A,0B'
    xblnr = '',           // Invoice number
    bldat = '',           // Document date (SAP format YYYYMMDD)
    openItem = '',        // 'X' or ''
    clearedItem = '',     // 'X' or ''
    allItem = '',         // 'X' or ''
    paStida = '',         // Open Item Date (SAP YYYYMMDD)
    clearFrom = '',       // Clearing Date From
    clearTo = '',         // Clearing Date To
    keyDate = '',         // Open at Key Date
    postFrom = '',        // Post From
    postTo = '',          // Post To
    bukrs = 'DSAL',       // Company code
  } = {}) {
    const filters = []
    if (lifnr) filters.push(`Lifnr eq '${lifnr}'`)
    if (blart) filters.push(`Blart eq '${blart}'`)
    if (xblnr) filters.push(`Xblnr eq '${xblnr}'`)
    if (bldat) filters.push(`Bldat eq '${bldat}'`)
    if (openItem) filters.push(`OpenItem eq '${openItem}'`)
    if (clearedItem) filters.push(`ClearedItem eq '${clearedItem}'`)
    if (allItem) filters.push(`AllItem eq '${allItem}'`)
    if (paStida) filters.push(`PA_STIDA eq '${paStida}'`)
    if (clearFrom) filters.push(`ClearFrom eq '${clearFrom}'`)
    if (clearTo) filters.push(`ClearTo eq '${clearTo}'`)
    if (keyDate) filters.push(`KeyDate eq '${keyDate}'`)
    if (postFrom) filters.push(`PostFrom eq '${postFrom}'`)
    if (postTo) filters.push(`PostTo eq '${postTo}'`)
    filters.push(`Bukrs eq '${bukrs}'`)

    const filterStr = filters.map(f => encodeURIComponent(f)).join('%20and%20')
    const data = await odata(`/VendorDeailsSet?$filter=${filterStr}`)
    return (data.d?.results || []).map(mapReportRow)
  },

  // Opening/Closing balance
  async fetchOpenCloseBal({ lifnr = '', childLifnr = '', bukrs = 'DSAL', fromDat = '', toDat = '' } = {}) {
    const key = `Lifnr='${encodeURIComponent(lifnr)}',ChildLifnr='${encodeURIComponent(childLifnr)}',Bukrs='${bukrs}',FromDat='${fromDat}',ToDat='${toDat || '00000000'}'`
    const data = await odata(`/OpenCloseBalSet(${key})`)
    return mapOpenCloseBal(data.d || {})
  },
}

export default VendorLedgerApi