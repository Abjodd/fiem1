import { useState, useMemo, useEffect, useRef } from 'react'
import PageLayout from '../../layouts/PageLayout.jsx'

// ═══════════════════════════════════════════════════════════════
// DUMMY DATA
// ═══════════════════════════════════════════════════════════════
const SUPPLIER_CHILD_OPTIONS = [
  { code: 'SC001', label: 'The Supreme Industries Ltd - Alwar' },
  { code: 'SC002', label: 'The Supreme Industries Ltd - Pune' },
  { code: 'SC003', label: 'The Supreme Industries Ltd - Delhi' },
]

const MOCK_ROWS = [
  {
    supplier: 'The Supreme Industries Ltd', companyCode: 'DSAL',
    invoiceNumber: 'INV-2026-001', supplierLocation: 'Alwar',
    postingDate: 'Apr 22, 2026', barcode: 'BC100023456',
    basic: '45,000.00', taxDetails: '8,100.00',
    totalInvoiceAmount: '53,100.00', tds: '450.00', others: '0.00',
    amountPayable: '52,650.00', specialGlTransaction: '',
    clearingDocument: 'CLR-20260422', documentNumber: 'DOC-20260422-001',
    documentType: 'RE', documentDate: 'Apr 22, 2026',
    localCurrencyAmount: '52,650.00', localCurrency: 'INR',
    text: 'Invoice payment April', assignment: 'ASSGN-001', dueDate: 'May 22, 2026',
  },
  {
    supplier: 'The Supreme Industries Ltd', companyCode: 'DSAL',
    invoiceNumber: 'INV-2026-002', supplierLocation: 'Alwar',
    postingDate: 'Apr 25, 2026', barcode: 'BC100023457',
    basic: '78,500.00', taxDetails: '14,130.00',
    totalInvoiceAmount: '92,630.00', tds: '785.00', others: '200.00',
    amountPayable: '91,645.00', specialGlTransaction: '',
    clearingDocument: '', documentNumber: 'DOC-20260425-002',
    documentType: 'KR', documentDate: 'Apr 25, 2026',
    localCurrencyAmount: '91,645.00', localCurrency: 'INR',
    text: 'Goods receipt May batch', assignment: 'ASSGN-002', dueDate: 'May 25, 2026',
  },
  {
    supplier: 'The Supreme Industries Ltd', companyCode: 'DSAL',
    invoiceNumber: 'INV-2026-003', supplierLocation: 'Alwar',
    postingDate: 'May 01, 2026', barcode: 'BC100023458',
    basic: '1,20,000.00', taxDetails: '21,600.00',
    totalInvoiceAmount: '1,41,600.00', tds: '1,200.00', others: '500.00',
    amountPayable: '1,39,900.00', specialGlTransaction: 'SGL-001',
    clearingDocument: 'CLR-20260501', documentNumber: 'DOC-20260501-003',
    documentType: 'RE', documentDate: 'May 01, 2026',
    localCurrencyAmount: '1,39,900.00', localCurrency: 'INR',
    text: 'Monthly supply invoice', assignment: 'ASSGN-003', dueDate: 'Jun 01, 2026',
  },
  {
    supplier: 'The Supreme Industries Ltd', companyCode: 'DSAL',
    invoiceNumber: 'INV-2026-004', supplierLocation: 'Alwar',
    postingDate: 'May 10, 2026', barcode: '',
    basic: '35,200.00', taxDetails: '6,336.00',
    totalInvoiceAmount: '41,536.00', tds: '352.00', others: '0.00',
    amountPayable: '41,184.00', specialGlTransaction: '',
    clearingDocument: '', documentNumber: 'DOC-20260510-004',
    documentType: 'KR', documentDate: 'May 10, 2026',
    localCurrencyAmount: '41,184.00', localCurrency: 'INR',
    text: 'Parts delivery Q2', assignment: '', dueDate: 'Jun 10, 2026',
  },
  {
    supplier: 'The Supreme Industries Ltd', companyCode: 'DSAL',
    invoiceNumber: 'INV-2026-005', supplierLocation: 'Alwar',
    postingDate: 'May 15, 2026', barcode: 'BC100023459',
    basic: '92,750.00', taxDetails: '16,695.00',
    totalInvoiceAmount: '1,09,445.00', tds: '927.50', others: '100.00',
    amountPayable: '1,08,417.50', specialGlTransaction: '',
    clearingDocument: 'CLR-20260515', documentNumber: 'DOC-20260515-005',
    documentType: 'RE', documentDate: 'May 15, 2026',
    localCurrencyAmount: '1,08,417.50', localCurrency: 'INR',
    text: 'Special order batch', assignment: 'ASSGN-005', dueDate: 'Jun 15, 2026',
  },
]

const VH_OPTIONS = {
  docType: [{ code: 'RE', label: 'Invoice' }, { code: 'KR', label: 'Vendor Invoice' }, { code: 'ZP', label: 'Payment' }],
  invoice: MOCK_ROWS.map(r => ({ code: r.invoiceNumber, label: '' })),
}

// ═══════════════════════════════════════════════════════════════
// API STRUCTURE
// ═══════════════════════════════════════════════════════════════
const API_BASE_URL = '/api/v1'
const USE_MOCK = true

const VendorLedgerApi = {
  async fetchReport({
    supplierChild='', docType='', invoiceNo='', documentDate='',
    openItem=false, openItemDate='',
    clearedItems=false, clearingDateFrom='', clearingDateTo='', openAtKeyDate='',
    allItem=false, postFrom='', postTo='',
  } = {}) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 350))
      let rows = [...MOCK_ROWS]
      if (docType)   rows = rows.filter(r => r.documentType === docType)
      if (invoiceNo) rows = rows.filter(r => r.invoiceNumber.toLowerCase().includes(invoiceNo.toLowerCase()))
      if (documentDate) {
        const d = new Date(documentDate)
        rows = rows.filter(r => new Date(r.documentDate) <= d)
      }
      return rows
    }
    const params = new URLSearchParams()
    if (supplierChild)   params.set('supplierChild', supplierChild)
    if (docType)         params.set('docType', docType)
    if (invoiceNo)       params.set('invoiceNo', invoiceNo)
    if (documentDate)    params.set('documentDate', documentDate)
    params.set('openItem', openItem)
    if (openItem && openItemDate)           params.set('openItemDate', openItemDate)
    params.set('clearedItems', clearedItems)
    if (clearedItems && clearingDateFrom)   params.set('clearingDateFrom', clearingDateFrom)
    if (clearedItems && clearingDateTo)     params.set('clearingDateTo', clearingDateTo)
    if (clearedItems && openAtKeyDate)      params.set('openAtKeyDate', openAtKeyDate)
    params.set('allItem', allItem)
    if (allItem && postFrom)                params.set('postFrom', postFrom)
    if (allItem && postTo)                  params.set('postTo', postTo)
    const res = await fetch(`${API_BASE_URL}/vendor-ledger-report?${params}`)
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
  },

  async fetchValueHelp(field, query = '') {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 60))
      const opts = VH_OPTIONS[field] || []
      if (!query) return opts
      const q = query.toLowerCase()
      return opts.filter(o => o.code.toLowerCase().includes(q) || (o.label && o.label.toLowerCase().includes(q)))
    }
    const res = await fetch(`${API_BASE_URL}/value-help/${field}?q=${encodeURIComponent(query)}`)
    if (!res.ok) throw new Error('Failed')
    return res.json()
  },
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const getExportFilename = () => {
  const d = new Date()
  return `vendorLedger_${MONTHS_SHORT[d.getMonth()]}_${String(d.getDate()).padStart(2,'0')}.xlsx`
}

// ═══════════════════════════════════════════════════════════════
// VALUE HELP MODAL
// ═══════════════════════════════════════════════════════════════
function ValueHelpModal({ title, options, onSelect, onCancel }) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    if (!search) return options
    const q = search.toLowerCase()
    return options.filter(o => o.code.toLowerCase().includes(q) || (o.label && o.label.toLowerCase().includes(q)))
  }, [options, search])

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-xl shadow-2xl w-[360px] max-w-[95vw] flex flex-col overflow-hidden"
        style={{ maxHeight: '70vh', animation: 'modalIn 0.2s ease-out both' }}>
        <div className="px-5 py-4 border-b border-[#e5e5e5]">
          <h3 className="text-[16px] font-semibold text-[#32363a]">{title}</h3>
        </div>
        <div className="px-4 py-3 border-b border-[#e5e5e5]">
          <div className="relative">
            <input autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full h-9 pl-3 pr-9 text-[14px] border border-[#d9d9d9] rounded-lg focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-3 top-2.5 text-[#6a6d70]">
              <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          {filtered.length === 0
            ? <div className="py-10 text-center text-[13px] text-[#6a6d70]">No results found</div>
            : filtered.map(opt => (
              <button key={opt.code} onClick={() => onSelect(opt)}
                className="w-full text-left px-5 py-3 border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#ebf5ff] transition-colors">
                <div className="text-[14px] font-semibold text-[#0a6ed1]">{opt.code}</div>
                {opt.label && <div className="text-[12px] text-[#6a6d70] mt-0.5">{opt.label}</div>}
              </button>
            ))
          }
        </div>
        <div className="px-5 py-3 border-t border-[#e5e5e5] flex justify-end">
          <button onClick={onCancel} className="px-5 h-9 text-[14px] font-semibold text-[#0a6ed1] hover:bg-[#ebf5ff] rounded-lg transition-all">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// VALUE HELP INPUT
// ═══════════════════════════════════════════════════════════════
function VhInput({ placeholder, value, onOpen }) {
  return (
    <div className="flex h-10 border border-[#d9d9d9] rounded-lg overflow-hidden bg-white focus-within:border-[#0a6ed1] focus-within:ring-2 focus-within:ring-[#0a6ed1]/20 transition-all">
      <div className="flex-1 flex items-center pl-3 text-[13px] truncate min-w-0 select-none">
        {value ? <span className="font-medium text-[#32363a] truncate">{value}</span>
               : <span className="text-[#94a3b8]">{placeholder}</span>}
      </div>
      <button type="button" onClick={onOpen} title="Open value help"
        className="flex-shrink-0 w-9 flex items-center justify-center border-l border-[#e5e5e5] text-[#6a6d70] hover:text-[#0a6ed1] hover:bg-[#f0f7ff] transition-all">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// STYLED CHECKBOX
// ═══════════════════════════════════════════════════════════════
function CheckField({ label, checked, onChange, required }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer group select-none">
      <div onClick={() => onChange(!checked)}
        className={`w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
          checked ? 'bg-[#0a6ed1] border-[#0a6ed1]' : 'bg-white border-[#d9d9d9] group-hover:border-[#0a6ed1]'
        }`}>
        {checked && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
            <path d="M5 13l4 4L19 7"/>
          </svg>
        )}
      </div>
      <span className="text-[13px] font-semibold text-[#32363a]">
        {label}{required && <span className="text-[#cc1c14] ml-0.5">*</span>}
      </span>
    </label>
  )
}

// ═══════════════════════════════════════════════════════════════
// DATE INPUT
// ═══════════════════════════════════════════════════════════════
function DateInput({ label, value, onChange, required, placeholder }) {
  return (
    <div>
      <label className="block text-[12px] text-[#6a6d70] mb-1 font-semibold">
        {label}{required && <span className="text-[#cc1c14] ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input type="date" value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-10 pl-3 pr-8 text-[13px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2.5 top-3.5 text-[#6a6d70] pointer-events-none">
          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// COLUMN DEFINITIONS
// ═══════════════════════════════════════════════════════════════
const COLUMNS = [
  { key: 'supplier',             label: 'Supplier',                       width: 180 },
  { key: 'companyCode',          label: 'Company Code',                   width: 115 },
  { key: 'invoiceNumber',        label: 'Invoice Number',                 width: 145 },
  { key: 'supplierLocation',     label: 'Supplier Location',              width: 140 },
  { key: 'postingDate',          label: 'Posting Date',                   width: 110 },
  { key: 'barcode',              label: 'Barcode',                        width: 130 },
  { key: 'basic',                label: 'Basic',                          width: 115 },
  { key: 'taxDetails',           label: 'Tax Details (SGST, CGST, IGST)', width: 195 },
  { key: 'totalInvoiceAmount',   label: 'Total Invoice Amount',           width: 160 },
  { key: 'tds',                  label: 'TDS',                            width: 90  },
  { key: 'others',               label: 'Others',                         width: 90  },
  { key: 'amountPayable',        label: 'Amount Payable',                 width: 135 },
  { key: 'specialGlTransaction', label: 'Special GL Transaction',         width: 165 },
  { key: 'clearingDocument',     label: 'Clearing Document',              width: 155 },
  { key: 'documentNumber',       label: 'Document Number',                width: 185 },
  { key: 'documentType',         label: 'Document Type',                  width: 120 },
  { key: 'documentDate',         label: 'Document Date',                  width: 115 },
  { key: 'localCurrencyAmount',  label: 'Local Currency Amount',          width: 170 },
  { key: 'localCurrency',        label: 'Local Currency',                 width: 115 },
  { key: 'text',                 label: 'Text',                           width: 180 },
  { key: 'assignment',           label: 'Assignment',                     width: 120 },
  { key: 'dueDate',              label: 'Due Date',                       width: 110 },
]

const TOTAL_WIDTH = COLUMNS.reduce((s, c) => s + c.width, 0) + 48

// ═══════════════════════════════════════════════════════════════
// DETAIL PAGE
// ═══════════════════════════════════════════════════════════════
function DetailPage({ row, onBack }) {
  const fields = [
    { label: 'Supplier',               value: row.supplier },
    { label: 'Company Code',           value: row.companyCode },
    { label: 'Invoice Number',         value: row.invoiceNumber },
    { label: 'Supplier Location',      value: row.supplierLocation },
    { label: 'Posting Date',           value: row.postingDate },
    { label: 'Barcode',                value: row.barcode },
    { label: 'Basic',                  value: row.basic },
    { label: 'Tax Details',            value: row.taxDetails },
    { label: 'Total Invoice Amount',   value: row.totalInvoiceAmount },
    { label: 'TDS',                    value: row.tds },
    { label: 'Others',                 value: row.others },
    { label: 'Amount Payable',         value: row.amountPayable },
    { label: 'Special GL Transaction', value: row.specialGlTransaction },
    { label: 'Clearing Document',      value: row.clearingDocument },
    { label: 'Document Number',        value: row.documentNumber },
    { label: 'Document Type',          value: row.documentType },
    { label: 'Document Date',          value: row.documentDate },
    { label: 'Local Currency Amount',  value: row.localCurrencyAmount },
    { label: 'Local Currency',         value: row.localCurrency },
    { label: 'Text',                   value: row.text },
    { label: 'Assignment',             value: row.assignment },
    { label: 'Due Date',               value: row.dueDate },
  ]
  return (
    <div className="bg-[#f5f6f7] min-h-[calc(100vh-104px)]">
      <main className="bg-white" style={{ minHeight: 'calc(100vh - 220px)' }}>
        <div className="px-4 sm:px-6 lg:px-10 pt-4 pb-3 border-b border-[#e5e5e5] bg-[#fafbfc] flex items-center gap-3">
          <button onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#d9d9d9] text-[#6a6d70] hover:text-[#0a6ed1] hover:border-[#0a6ed1] transition-all flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <div className="text-[14px] font-semibold text-[#32363a]">
            Document — <span className="text-[#0a6ed1]">{row.documentNumber}</span>
          </div>
        </div>
        <div className="px-4 sm:px-6 lg:px-10 pt-6 pb-10">
          {/* Summary */}
          <div className="rounded-xl border border-[#e5e5e5] shadow-sm bg-white p-5 sm:p-6 mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
              <div>
                <div className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">Invoice Number</div>
                <h1 className="text-[22px] sm:text-[26px] font-bold text-[#0a6ed1] tracking-tight">{row.invoiceNumber}</h1>
              </div>
              <div className="text-right">
                <div className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">Amount Payable</div>
                <div className="text-[22px] font-bold text-[#107e3e]">₹ {row.amountPayable}</div>
                <div className="text-[12px] text-[#6a6d70] mt-0.5">{row.localCurrency}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#f0f0f0]">
              {[
                { l: 'Supplier',     v: row.supplier },
                { l: 'Company Code', v: row.companyCode },
                { l: 'Posting Date', v: row.postingDate },
                { l: 'Due Date',     v: row.dueDate },
              ].map(f => (
                <div key={f.l}>
                  <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">{f.l}</div>
                  <div className="text-[13px] font-medium text-[#32363a]">{f.v || '—'}</div>
                </div>
              ))}
            </div>
          </div>
          {/* All fields */}
          <div className="rounded-xl border border-[#e5e5e5] shadow-sm bg-white p-5 sm:p-6">
            <h2 className="text-[15px] font-semibold text-[#32363a] mb-4">Document Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
              {fields.map(f => (
                <div key={f.label}>
                  <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-0.5">{f.label}</div>
                  <div className="text-[13px] text-[#32363a] font-medium">{f.value || <span className="text-[#d9d9d9]">—</span>}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function VendorLedgerReport() {
  // ── Core filters ──
  const [supplierChild, setSupplierChild] = useState('')
  const [docType,       setDocType]       = useState('')
  const [invoiceNo,     setInvoiceNo]     = useState('')
  const [documentDate,  setDocumentDate]  = useState('')

  // ── Checkbox filters ──
  const [openItem,      setOpenItem]      = useState(false)
  const [openItemDate,  setOpenItemDate]  = useState('')

  const [clearedItems,      setClearedItems]      = useState(false)
  const [clearingDateFrom,  setClearingDateFrom]  = useState('')
  const [clearingDateTo,    setClearingDateTo]    = useState('')
  const [openAtKeyDate,     setOpenAtKeyDate]     = useState('')

  const [allItem,   setAllItem]   = useState(false)
  const [postFrom,  setPostFrom]  = useState('')
  const [postTo,    setPostTo]    = useState('')

  const [filterBarVisible, setFilterBarVisible] = useState(true)

  // ── Value help ──
  const [vhModal,   setVhModal]   = useState(null)
  const [vhOptions, setVhOptions] = useState([])

  // ── Data ──
  const [rows,        setRows]        = useState([])
  const [loading,     setLoading]     = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error,       setError]       = useState(null)

  // ── Detail ──
  const [selectedRow, setSelectedRow] = useState(null)
  const [exporting,   setExporting]   = useState(false)

  // Validation: at least one checkbox must be checked; conditional fields required
  const validationErrors = useMemo(() => {
    const errs = []
    if (!openItem && !clearedItems && !allItem)
      errs.push('At least one of Open Item, Cleared Items, or All Item must be selected.')
    if (openItem && !openItemDate)
      errs.push('Open Item Date is required when Open Item is checked.')
    if (clearedItems && !clearingDateFrom)
      errs.push('Clearing Date From is required when Cleared Items is checked.')
    if (clearedItems && !clearingDateTo)
      errs.push('Clearing Date To is required when Cleared Items is checked.')
    if (clearedItems && !openAtKeyDate)
      errs.push('Open at Key Date is required when Cleared Items is checked.')
    if (allItem && !postFrom)
      errs.push('Post From is required when All Item is checked.')
    if (allItem && !postTo)
      errs.push('Post To is required when All Item is checked.')
    return errs
  }, [openItem, openItemDate, clearedItems, clearingDateFrom, clearingDateTo, openAtKeyDate, allItem, postFrom, postTo])

  const VH_TITLES = { docType: 'Document Type', invoice: 'Invoice Number' }

  const openVh = async (field) => {
    setVhModal(field)
    setVhOptions([])
    try {
      const opts = await VendorLedgerApi.fetchValueHelp(field, '')
      setVhOptions(opts)
    } catch { setVhOptions([]) }
  }

  const handleVhSelect = (opt) => {
    const map = { docType: setDocType, invoice: setInvoiceNo }
    map[vhModal]?.(opt.code)
    setVhModal(null)
  }

  const handleGo = async () => {
    if (validationErrors.length > 0) return
    setLoading(true); setError(null)
    try {
      const data = await VendorLedgerApi.fetchReport({
        supplierChild, docType, invoiceNo, documentDate,
        openItem, openItemDate,
        clearedItems, clearingDateFrom, clearingDateTo, openAtKeyDate,
        allItem, postFrom, postTo,
      })
      setRows(data); setHasSearched(true)
    } catch (err) {
      setError(err.message || 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setSupplierChild(''); setDocType(''); setInvoiceNo(''); setDocumentDate('')
    setOpenItem(false); setOpenItemDate('')
    setClearedItems(false); setClearingDateFrom(''); setClearingDateTo(''); setOpenAtKeyDate('')
    setAllItem(false); setPostFrom(''); setPostTo('')
    setRows([]); setHasSearched(false); setError(null)
  }

  const handleExport = async () => {
    if (!rows.length || exporting) return
    setExporting(true)
    try {
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')
      const headers = COLUMNS.map(c => c.label)
      const dataRows = rows.map(r => COLUMNS.map(c => r[c.key] || ''))
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows])
      ws['!cols'] = COLUMNS.map(c => ({ wch: Math.max(12, Math.round(c.width / 7)) }))
      ws['!autofilter'] = { ref: `A1:${String.fromCharCode(65 + COLUMNS.length - 1)}1` }
      const range = XLSX.utils.decode_range(ws['!ref'])
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c: C })
        if (ws[addr]) ws[addr].s = { font: { bold: true, name: 'Arial', sz: 11 }, fill: { fgColor: { rgb: 'D9E1F2' } } }
      }
      XLSX.utils.book_append_sheet(wb, ws, 'SAPUI5 Export')
      XLSX.writeFile(wb, getExportFilename())
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  const renderCell = (row, col) => {
    switch (col.key) {
      case 'invoiceNumber':
        return <span className="font-semibold text-[#0a6ed1] text-[12px]">{row.invoiceNumber}</span>
      case 'totalInvoiceAmount': case 'amountPayable': case 'localCurrencyAmount':
        return <span className="tabular-nums font-semibold text-[#32363a] text-[12px]">{row[col.key]}</span>
      case 'basic': case 'tds': case 'others': case 'taxDetails':
        return <span className="tabular-nums text-[#32363a] text-[12px]">{row[col.key]}</span>
      case 'documentType':
        return <span className="inline-flex items-center px-2 py-0.5 bg-[#f0f4f8] text-[#32363a] rounded text-[11px] font-semibold">{row.documentType}</span>
      case 'clearingDocument':
        return row.clearingDocument
          ? <span className="text-[#107e3e] text-[12px] font-medium">{row.clearingDocument}</span>
          : <span className="text-[#d9d9d9]">—</span>
      default:
        return row[col.key] ? <span className="text-[#32363a] text-[12px]">{row[col.key]}</span> : <span className="text-[#d9d9d9]">—</span>
    }
  }

  if (selectedRow) {
    return <PageLayout><DetailPage row={selectedRow} onBack={() => setSelectedRow(null)} /></PageLayout>
  }

  const hasValidationIssue = validationErrors.length > 0

  return (
    <PageLayout>
      <style>{`
        @keyframes fadeIn    { from { opacity:0; transform:translateY(8px);  } to { opacity:1; transform:translateY(0); } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes modalIn   { from { opacity:0; transform:scale(0.94);      } to { opacity:1; transform:scale(1);      } }
        .anim-fade      { animation: fadeIn    0.35s ease-out both; }
        .anim-slidedown { animation: slideDown 0.25s ease-out both; }
        .row-stagger > * { animation: fadeIn 0.35s ease-out both; }
        .row-stagger > *:nth-child(1) { animation-delay:0.02s; }
        .row-stagger > *:nth-child(2) { animation-delay:0.05s; }
        .row-stagger > *:nth-child(3) { animation-delay:0.08s; }
        .row-stagger > *:nth-child(4) { animation-delay:0.11s; }
        .row-stagger > *:nth-child(5) { animation-delay:0.14s; }
        .row-stagger > *:nth-child(6) { animation-delay:0.17s; }
      `}</style>

      {vhModal && (
        <ValueHelpModal title={VH_TITLES[vhModal]} options={vhOptions} onSelect={handleVhSelect} onCancel={() => setVhModal(null)} />
      )}

      <div className="bg-[#f5f6f7] min-h-[calc(100vh-104px)]">
        <main className="flex flex-col bg-white" style={{ minHeight: 'calc(100vh - 220px)' }}>

          {/* ── Meta header ── */}
         

          {/* ── Title + action buttons ── */}
          <div className="px-4 sm:px-6 lg:px-10 pt-3 pb-2 flex items-center justify-between gap-3 flex-shrink-0">
            <h1 className="text-[17px] sm:text-[19px] font-bold text-[#32363a] tracking-tight">Vendor Ledger Report</h1>
            <div className="flex items-center gap-2">
              <button onClick={handleGo} disabled={loading || hasValidationIssue}
                className="flex items-center gap-1.5 px-5 h-9 text-[14px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
                Go
              </button>
              <button onClick={() => setFilterBarVisible(v => !v)}
                className="px-4 h-9 text-[14px] font-semibold text-[#32363a] bg-white border border-[#d9d9d9] rounded-lg hover:bg-[#f5f6f7] transition-all whitespace-nowrap">
                {filterBarVisible ? 'Hide Filter Bar' : 'Show Filter Bar'}
              </button>
              <button onClick={handleClear}
                className="px-4 h-9 text-[14px] font-semibold text-[#cc1c14] bg-[#fce8e6] border border-[#fce8e6] rounded-lg hover:bg-[#fad6d3] transition-all">
                Clear
              </button>
            </div>
          </div>

          {/* ── Filter bar ── */}
          {filterBarVisible && (
            <div className="px-4 sm:px-6 lg:px-10 pt-1 pb-4 flex-shrink-0 border-b border-[#e5e5e5] anim-fade">

              {/* Row 1: 5 core fields + 3 checkboxes aligned */}
              <div className="flex flex-col lg:flex-row lg:items-end gap-3 lg:gap-4 mb-4">

                {/* Core filter fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 flex-1">

                  {/* Supplier Child */}
                  <div>
                    <label className="block text-[12px] text-[#6a6d70] mb-1 font-semibold">
                      Supplier Child <span className="text-[#cc1c14]">*</span>
                    </label>
                    <div className="relative">
                      <select value={supplierChild} onChange={e => setSupplierChild(e.target.value)}
                        className="w-full h-10 pl-3 pr-8 text-[13px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all appearance-none cursor-pointer">
                        <option value=""></option>
                        {SUPPLIER_CHILD_OPTIONS.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
                      </select>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2.5 top-3.5 text-[#6a6d70] pointer-events-none"><path d="M6 9l6 6 6-6"/></svg>
                    </div>
                  </div>

                  {/* Document Type */}
                  <div>
                    <label className="block text-[12px] text-[#6a6d70] mb-1 font-semibold">Document Type:</label>
                    <VhInput placeholder="Select type" value={docType} onOpen={() => openVh('docType')} />
                  </div>

                  {/* Invoice Number */}
                  <div>
                    <label className="block text-[12px] text-[#6a6d70] mb-1 font-semibold">Invoice Number:</label>
                    <VhInput placeholder="Select invoice" value={invoiceNo} onOpen={() => openVh('invoice')} />
                  </div>

                  {/* Document Date */}
                  <div>
                    <label className="block text-[12px] text-[#6a6d70] mb-1 font-semibold">Document Date:</label>
                    <div className="relative">
                      <input type="date" value={documentDate} onChange={e => setDocumentDate(e.target.value)}
                        className="w-full h-10 pl-3 pr-8 text-[13px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2.5 top-3.5 text-[#6a6d70] pointer-events-none">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 3 Checkboxes — right-aligned, vertically stacked */}
                <div className="flex flex-row lg:flex-col gap-4 lg:gap-2.5 lg:pb-0.5 lg:flex-shrink-0">
                  <CheckField label="Open Item"     checked={openItem}     onChange={setOpenItem}     required />
                  <CheckField label="Cleared Items" checked={clearedItems} onChange={setClearedItems} required />
                  <CheckField label="All Item"      checked={allItem}      onChange={setAllItem}      required />
                </div>
              </div>

              {/* Conditional fields */}
              <div className="space-y-3">

                {/* Open Item → Open Item Date */}
                {openItem && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 anim-slidedown p-3 bg-[#f0f7ff] rounded-lg border border-[#cce0ff]">
                    <DateInput label="Open Item Date" value={openItemDate} onChange={setOpenItemDate} required />
                  </div>
                )}

                {/* Cleared Items → 3 fields */}
                {clearedItems && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 anim-slidedown p-3 bg-[#f0fff4] rounded-lg border border-[#b7e8c7]">
                    <DateInput label="Clearing Date From" value={clearingDateFrom} onChange={setClearingDateFrom} required />
                    <DateInput label="Clearing Date To"   value={clearingDateTo}   onChange={setClearingDateTo}   required />
                    <DateInput label="Open at Key Date"   value={openAtKeyDate}    onChange={setOpenAtKeyDate}    required />
                  </div>
                )}

                {/* All Item → Post From + Post To */}
                {allItem && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 anim-slidedown p-3 bg-[#fffbeb] rounded-lg border border-[#fde68a]">
                    <DateInput label="Post From" value={postFrom} onChange={setPostFrom} required />
                    <DateInput label="Post To"   value={postTo}   onChange={setPostTo}   required />
                  </div>
                )}
              </div>

              {/* Validation messages */}
              {hasValidationIssue && (
                <div className="mt-3 flex flex-col gap-1">
                  {validationErrors.map((e, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[12px] text-[#cc1c14]">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                      {e}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Table ── */}
          <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 lg:px-10 pt-3 pb-0 min-h-0">
            {!hasSearched && !loading ? (
              <div className="flex-1 flex items-center justify-center anim-fade">
                <div className="text-center text-[#6a6d70]">
                  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-25">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  <div className="text-[15px] font-semibold mb-1">No data loaded</div>
                  <div className="text-[13px]">Set filters and click <strong>Go</strong> to generate the report</div>
                </div>
              </div>
            ) : loading ? (
              <div className="flex-1 flex items-center justify-center anim-fade">
                <div className="flex flex-col items-center gap-3 text-[#6a6d70]">
                  <div className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#0a6ed1] rounded-full animate-spin" />
                  <span className="text-[14px]">Fetching data…</span>
                </div>
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-2 px-4 py-3 bg-[#fce8e6] text-[#cc1c14] rounded-lg text-[13px]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                  {error}
                </div>
              </div>
            ) : rows.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-[15px] font-semibold text-[#6a6d70]">No data found for selected filters</div>
              </div>
            ) : (
              <div className="rounded-xl border border-[#e5e5e5] shadow-sm overflow-hidden flex flex-col flex-1 anim-fade" style={{ minHeight: 0 }}>
                <div className="px-4 py-2 border-b border-[#e5e5e5] bg-[#fafbfc] flex-shrink-0">
                  <span className="text-[13px] text-[#6a6d70]">
                    <span className="font-semibold text-[#32363a]">{rows.length}</span> record{rows.length !== 1 ? 's' : ''} found
                  </span>
                </div>
                <div className="flex-1 overflow-auto min-h-0">
                  <table className="border-collapse text-[12px]"
                    style={{ minWidth: `${TOTAL_WIDTH}px`, tableLayout: 'fixed', width: `${TOTAL_WIDTH}px` }}>
                    <colgroup>
                      {COLUMNS.map(c => <col key={c.key} style={{ width: `${c.width}px` }} />)}
                      <col style={{ width: '48px' }} />
                    </colgroup>
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-gradient-to-b from-[#fafbfc] to-[#f5f6f7] text-[#6a6d70]">
                        {COLUMNS.map(c => (
                          <th key={c.key} className="text-left font-semibold py-3.5 px-3 text-[11px] uppercase tracking-wider border-b border-r border-[#e5e5e5] whitespace-nowrap">
                            {c.label}
                          </th>
                        ))}
                        <th className="py-3.5 px-2 border-b border-[#e5e5e5] w-12" />
                      </tr>
                    </thead>
                    <tbody className="row-stagger">
                      {rows.map((row, idx) => (
                        <tr key={`${row.documentNumber}-${idx}`}
                          onClick={() => setSelectedRow(row)}
                          className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#ebf5ff] cursor-pointer transition-colors duration-100 group">
                          {COLUMNS.map(col => (
                            <td key={col.key} className="py-3 px-3 border-r border-[#f0f0f0] align-top">
                              {renderCell(row, col)}
                            </td>
                          ))}
                          <td className="py-3 px-2 text-center align-middle">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                              className="text-[#0a6ed1] group-hover:translate-x-1 transition-transform duration-200 inline">
                              <path d="M9 18l6-6-6-6"/>
                            </svg>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ── Export button ── */}
          <div className="px-4 sm:px-6 lg:px-10 py-3 flex justify-end flex-shrink-0 border-t border-[#e5e5e5] bg-white">
            <button onClick={handleExport} disabled={!rows.length || exporting}
              className="flex items-center gap-2 px-5 h-10 text-[14px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed">
              {exporting
                ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
              }
              {exporting ? 'Exporting…' : 'Export'}
              {!exporting && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              )}
            </button>
          </div>

        </main>
      </div>
    </PageLayout>
  )
}