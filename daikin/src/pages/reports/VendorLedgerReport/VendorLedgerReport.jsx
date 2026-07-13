import { useState, useMemo, useEffect, useCallback } from 'react'
import PageLayout from '../../../layouts/PageLayout.jsx'
import { VendorLedgerApi, toSapDate, authConfig } from '../../../services/Reports/VendorLedgerReport/vendorLedgerService.js'
import { useUser } from '../../../context/UserContext.jsx'
// ═══════════════════════════════════════════════════════════════
// MOCK DATA — remove when backend is live
// ═══════════════════════════════════════════════════════════════
const USE_MOCK = false

const MOCK_SUPPLIERS = [
  { code: 'FS827', name: 'Salim', region: 'Rajasthan', suppType: '', label: 'FS827 — Salim' },
  { code: 'FS833', name: 'Ravi Industries', region: 'Maharashtra', suppType: '', label: 'FS833 — Ravi Industries' },
  { code: 'FS859', name: 'Supreme Industries', region: 'Rajasthan', suppType: '', label: 'FS859 — Supreme Industries' },
]

const MOCK_CHILD_SUPPLIERS = [
  { code: 'CSP001', name: 'Supreme - Alwar', label: 'CSP001 — Supreme - Alwar' },
  { code: 'CSP002', name: 'Supreme - Pune', label: 'CSP002 — Supreme - Pune' },
]

const MOCK_DOC_TYPES = [
  { code: '0A', label: 'SBI RECEIPT, QNF' },
  { code: '0B', label: 'SBI PAYMENT, QNF' },
  { code: 'RE', label: 'Invoice' },
  { code: 'KR', label: 'Vendor Invoice' },
  { code: 'ZP', label: 'Payment' },
]

const MOCK_INVOICES = [
  { code: 'INV-2026-001', label: '' },
  { code: 'INV-2026-002', label: '' },
  { code: 'INV-2026-003', label: '' },
  { code: '897999', label: '' },
  { code: '79698', label: '' },
]

const MOCK_REPORT_ROWS = [
  {
    supplier: 'FS859', supplierName: 'Supreme Industries', companyCode: 'DSAL',
    invoiceNumber: 'INV-2026-001', supplierLocation: 'Alwar',
    postingDate: 'Apr 22, 2026', headerText: 'BC100023456',
    basicAmount: '45,000.00', igstAmount: '8,100.00',
    invoiceAmount: '53,100.00', tdsAmount: '450.00', othersAmount: '0.00',
    localCurrencyAmount: '52,650.00', specialGlTransaction: '',
    clearingDocument: 'CLR-20260422', documentNumber: 'DOC-20260422-001',
    documentType: 'RE', documentTypeText: 'Invoice', documentDate: 'Apr 22, 2026',
    amountDocCurrency: '52,650.00', localCurrency: 'INR',
    text: 'Invoice payment April', assignment: 'ASSGN-001', dueDate: 'May 22, 2026',
  },
]

// ═══════════════════════════════════════════════════════════════
// MOCK API wrapper
// ═══════════════════════════════════════════════════════════════
const api = {
  async fetchSuppliers() {
    if (USE_MOCK) { await new Promise(r => setTimeout(r, 80)); return MOCK_SUPPLIERS }
    return VendorLedgerApi.fetchSuppliers()
  },
  async fetchChildSuppliers(lifnr) {
    if (USE_MOCK) { await new Promise(r => setTimeout(r, 60)); return MOCK_CHILD_SUPPLIERS }
    return VendorLedgerApi.fetchChildSuppliers(lifnr)
  },
  async fetchDocTypes() {
    if (USE_MOCK) { await new Promise(r => setTimeout(r, 60)); return MOCK_DOC_TYPES }
    return VendorLedgerApi.fetchDocTypes()
  },
  async fetchInvoices() {
    if (USE_MOCK) { await new Promise(r => setTimeout(r, 60)); return MOCK_INVOICES }
    return VendorLedgerApi.fetchInvoices()
  },
  async fetchDocumentNos() {
    if (USE_MOCK) { await new Promise(r => setTimeout(r, 60)); return [] }
    return VendorLedgerApi.fetchDocumentNos()
  },
  async fetchReport(params) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 400))
      let rows = [...MOCK_REPORT_ROWS]
      if (params.docType) rows = rows.filter(r => params.docType.includes(r.documentType))
      if (params.invoiceNo) rows = rows.filter(r => r.invoiceNumber.toLowerCase().includes(params.invoiceNo.toLowerCase()))
      return rows
    }
    return VendorLedgerApi.fetchReport({
      lifnr: params.supplier,
      blart: params.docType,
      xblnr: params.invoiceNo,
      belnr: params.documentNo,
      bldat: params.documentDate ? toSapDate(params.documentDate) : '',
      openItem: params.openItem ? 'X' : '',
      clearedItem: params.clearedItems ? 'X' : '',
      allItem: params.allItem ? 'X' : '',
      paStida: params.openItemDate ? toSapDate(params.openItemDate) : '',
      clearFrom: params.clearingDateFrom ? toSapDate(params.clearingDateFrom) : '',
      clearTo: params.clearingDateTo ? toSapDate(params.clearingDateTo) : '',
      keyDate: params.openAtKeyDate ? toSapDate(params.openAtKeyDate) : '',
      postFrom: params.postFrom ? toSapDate(params.postFrom) : '',
      postTo: params.postTo ? toSapDate(params.postTo) : '',
    })
  },
  async fetchOpenCloseBal(params) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 100))
      return { openBal: 1711.0, closeBal: 0.0 }
    }
    return VendorLedgerApi.fetchOpenCloseBal({
      lifnr: params.supplier,
      childLifnr: params.childSupplier || '',
      fromDat: params.fromDat ? toSapDate(params.fromDat) : '',
      toDat: params.toDat ? toSapDate(params.toDat) : '',
    })
  },
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const getExportFilename = () => {
  const d = new Date()
  return `VendorLedger_${MONTHS[d.getMonth()]}_${String(d.getDate()).padStart(2,'0')}_${d.getFullYear()}.xlsx`
}

// Show value even if "0", "0.00", "0 ", etc — only blank for truly empty string
const displayVal = (v) => {
  if (v === null || v === undefined) return ''
  const s = String(v).trim()
  return s
}

// ═══════════════════════════════════════════════════════════════
// COLUMN DEFINITIONS
// Keys must match mapReportRow output in vendorLedgerService.js
// ═══════════════════════════════════════════════════════════════
const COLUMNS = [
  { key: 'supplier',             label: 'Supplier',               w: 150 }, 
  { key: 'companyCode',          label: 'Company Code',           w: 105 },
  { key: 'invoiceNumber',        label: 'Invoice No.',            w: 135 },
  { key: 'supplierLocation',     label: 'Supplier Location',      w: 130 },
  { key: 'postingDate',          label: 'Posting Date',           w: 105 },
  { key: 'headerText',           label: 'Barcode',                w: 120 }, 
  { key: 'basicAmount',          label: 'Basic',                  w: 110 },
  { key: 'igstAmount',           label: 'Tax Details',            w: 110 },
  { key: 'invoiceAmount',        label: 'Total Invoice Amt',      w: 140 },
  { key: 'tdsAmount',            label: 'TDS',                    w: 90  },
  { key: 'othersAmount',         label: 'Others',                 w: 90  },
  { key: 'localCurrencyAmount',  label: 'Amount Payable',         w: 125 }, 
  { key: 'specialGlTransaction', label: 'Special GL',     w: 100 },
  { key: 'clearingDocument',     label: 'Clearing Doc.',          w: 130 },
  { key: 'documentNumber',       label: 'Document No.',           w: 170 },
  { key: 'documentType',         label: 'Document Type',          w: 170 }, 
  { key: 'documentDate',         label: 'Document Date',          w: 170 },
  { key: 'amountDocCurrency',    label: 'Local Currency Amt',     w: 175 },
  { key: 'localCurrency',        label: 'Currency',               w: 85  },
  { key: 'text',                 label: 'Text',                   w: 170 },
  { key: 'assignment',           label: 'Assignment',             w: 110 },
  { key: 'dueDate',              label: 'Due Date',               w: 105 },
]
const TABLE_W = COLUMNS.reduce((s, c) => s + c.w, 0) + 44

// ═══════════════════════════════════════════════════════════════
// DROPDOWN MODAL
// ═══════════════════════════════════════════════════════════════
function DropdownModal({ title, options, multi, selected, onDone, onCancel }) {
  const [search, setSearch] = useState('')
  const [picks, setPicks] = useState(multi ? (selected || []) : [])

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

  const toggle = (code) => {
    if (multi) {
      setPicks(p => p.includes(code) ? p.filter(c => c !== code) : [...p, code])
    } else {
      onDone(code)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-xl shadow-2xl w-[400px] max-w-[95vw] flex flex-col overflow-hidden"
        style={{ maxHeight: '70vh', animation: 'modalIn 0.2s ease-out both' }}>
        <div className="px-5 py-3.5 border-b border-[#e5e5e5] flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-[#32363a]">{title}</h3>
          {multi && picks.length > 0 && (
            <span className="text-[11px] font-bold text-[#0a6ed1] bg-[#ebf5ff] px-2 py-0.5 rounded-full">{picks.length} selected</span>
          )}
        </div>
        <div className="px-4 py-2.5 border-b border-[#e5e5e5]">
          <div className="relative">
            <input autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              className="w-full h-9 pl-3 pr-9 text-[13px] border border-[#d9d9d9] rounded-lg focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-3 top-2.5 text-[#6a6d70]">
              <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          {filtered.length === 0
            ? <div className="py-10 text-center text-[13px] text-[#6a6d70]">No results</div>
            : filtered.map(opt => {
                const on = multi ? picks.includes(opt.code) : false
                return (
                  <button key={opt.code} onClick={() => toggle(opt.code)}
                    className={`w-full text-left px-5 py-2.5 border-b border-[#f0f0f0] last:border-b-0 flex items-center gap-3 transition-colors ${on ? 'bg-[#ebf5ff]' : 'hover:bg-[#fafbfc]'}`}>
                    {multi && (
                      <div className={`w-4.5 h-4.5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all ${on ? 'bg-[#0a6ed1] border-[#0a6ed1]' : 'border-[#d9d9d9]'}`}
                        style={{ width: 18, height: 18 }}>
                        {on && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-[#0a6ed1]">{opt.code}</div>
                      {opt.label && <div className="text-[11px] text-[#6a6d70] mt-0.5 truncate">{opt.label}</div>}
                    </div>
                  </button>
                )
              })
          }
        </div>
        <div className="px-5 py-3 border-t border-[#e5e5e5] flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 h-9 text-[13px] font-semibold text-[#6a6d70] hover:bg-[#f5f6f7] rounded-lg transition-all">Cancel</button>
          {multi && (
            <button onClick={() => onDone(picks)} className="px-4 h-9 text-[13px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] transition-all">
              Apply ({picks.length})
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// DROPDOWN TRIGGER BUTTON
// ═══════════════════════════════════════════════════════════════
function DropdownTrigger({ placeholder, displayValue, onClick, onClear }) {
  return (
    <div className="flex h-10 border border-[#d9d9d9] rounded-lg overflow-hidden bg-white focus-within:border-[#0a6ed1] focus-within:ring-2 focus-within:ring-[#0a6ed1]/20 transition-all">
      <button type="button" onClick={onClick} className="flex-1 flex items-center pl-3 text-[13px] truncate min-w-0 text-left">
        {displayValue
          ? <span className="font-medium text-[#32363a] truncate">{displayValue}</span>
          : <span className="text-[#94a3b8]">{placeholder}</span>}
      </button>
      {displayValue && (
        <button type="button" onClick={onClear} title="Clear"
          className="flex-shrink-0 w-7 flex items-center justify-center text-[#6a6d70] hover:text-[#cc1c14] transition-all">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      )}
      <button type="button" onClick={onClick} title="Open"
        className="flex-shrink-0 w-9 flex items-center justify-center border-l border-[#e5e5e5] text-[#6a6d70] hover:text-[#0a6ed1] hover:bg-[#f0f7ff] transition-all">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// DETAIL PAGE
// ═══════════════════════════════════════════════════════════════
function DetailPage({ row, onBack }) {
  const fields = COLUMNS.map(c => ({ label: c.label, value: row[c.key] }))
  return (
    <div className="bg-[#f5f6f7] min-h-[calc(100vh-104px)]">
      <main className="bg-white" style={{ minHeight: 'calc(100vh - 220px)' }}>
        <div className="px-4 sm:px-6 lg:px-10 pt-4 pb-3 border-b border-[#e5e5e5] bg-[#fafbfc] flex items-center gap-3">
          <button onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#d9d9d9] text-[#6a6d70] hover:text-[#0a6ed1] hover:border-[#0a6ed1] transition-all flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div className="text-[14px] font-semibold text-[#32363a]">
            Document — <span className="text-[#0a6ed1]">{row.documentNumber}</span>
          </div>
        </div>
        <div className="px-4 sm:px-6 lg:px-10 pt-6 pb-10">
          <div className="rounded-xl border border-[#e5e5e5] shadow-sm bg-white p-5 sm:p-6 mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">Invoice Number</div>
                <h1 className="text-[22px] sm:text-[26px] font-bold text-[#0a6ed1] tracking-tight">{row.invoiceNumber}</h1>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">Amount Payable</div>
                <div className="text-[22px] font-bold text-[#107e3e]">₹ {row.localCurrencyAmount}</div>
                <div className="text-[12px] text-[#6a6d70] mt-0.5">{row.localCurrency}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#f0f0f0]">
              {[
                { l: 'Supplier', v: `${row.supplier} — ${row.supplierName}` },
                { l: 'Company Code', v: row.companyCode },
                { l: 'Posting Date', v: row.postingDate },
                { l: 'Due Date', v: row.dueDate },
              ].map(f => (
                <div key={f.l}>
                  <div className="text-[10px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-0.5">{f.l}</div>
                  <div className="text-[13px] font-medium text-[#32363a]">{f.v || '—'}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-[#e5e5e5] shadow-sm bg-white p-5 sm:p-6">
            <h2 className="text-[14px] font-semibold text-[#32363a] mb-4">Document Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
              {fields.map(f => (
                <div key={f.label}>
                  <div className="text-[10px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-0.5">{f.label}</div>
                  <div className="text-[13px] text-[#32363a] font-medium">{displayVal(f.value) || <span className="text-[#d9d9d9]">—</span>}</div>
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
// MAIN
// ═══════════════════════════════════════════════════════════════
export default function VendorLedgerReport() {
  const { loginId, loginType, role, loading: userLoading } = useUser();
  authConfig.loginId   = loginId;
  authConfig.loginType = loginType;
  // ── Dropdown option stores ──
  const [suppliers,    setSuppliers]    = useState([])
  const [childSuppliers, setChildSuppliers] = useState([])
  const [docTypes,     setDocTypes]     = useState([])
  const [invoices,     setInvoices]     = useState([])
  const [documentNos,  setDocumentNos]  = useState([])

  // ── Core filters ──
  const [supplier,         setSupplier]         = useState('')
  const [supplierChild,    setSupplierChild]    = useState('')
  const [selectedDocTypes, setSelectedDocTypes] = useState([])
  const [invoiceNo,        setInvoiceNo]        = useState('')
  const [documentNo,       setDocumentNo]       = useState('')
  const [documentDate,     setDocumentDate]     = useState('')

  // ── Exclusive checkboxes ──
  const [activeCheck,       setActiveCheck]       = useState('')
  const [openItemDate,      setOpenItemDate]      = useState('')
  const [clearingDateFrom,  setClearingDateFrom]  = useState('')
  const [clearingDateTo,    setClearingDateTo]    = useState('')
  const [openAtKeyDate,     setOpenAtKeyDate]     = useState('')
  const [postFrom,          setPostFrom]          = useState('')
  const [postTo,            setPostTo]            = useState('')

  // ── Balance fields ──
  const [openBal,  setOpenBal]  = useState(0)
  const [closeBal, setCloseBal] = useState(0)

  // ── UI state ──
  const [filterBarVisible, setFilterBarVisible] = useState(true)
  const [rows,        setRows]        = useState([])
  const [loading,     setLoading]     = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error,       setError]       = useState(null)
  const [selectedRow, setSelectedRow] = useState(null)
  const [exporting,   setExporting]   = useState(false)
  const [ddModal,     setDdModal]     = useState(null)

  useEffect(() => {
    if (userLoading) return;
    if (!loginId || !loginType) return;
    api.fetchSuppliers().then(setSuppliers).catch(console.error)
    api.fetchDocumentNos().then(setDocumentNos).catch(console.error)
    api.fetchDocTypes().then(setDocTypes).catch(console.error)
    api.fetchInvoices().then(setInvoices).catch(console.error)
    
  }, [userLoading, loginId, loginType])

  useEffect(() => {
    if (userLoading) return;
    if (!loginId || !loginType) return;
    if (!supplier) { setChildSuppliers([]); setSupplierChild(''); return }
    api.fetchChildSuppliers(supplier).then(setChildSuppliers).catch(console.error)
  }, [userLoading, loginId, loginType, supplier])

  const toggleCheck = (which) => {
    if (activeCheck === which) {
      setActiveCheck('')
    } else {
      setActiveCheck(which)
      if (which !== 'open')    setOpenItemDate('')
      if (which !== 'cleared') { setClearingDateFrom(''); setClearingDateTo(''); setOpenAtKeyDate('') }
      if (which !== 'all')     { setPostFrom(''); setPostTo('') }
    }
  }

  const validationErrors = useMemo(() => {
    const e = []
    if (!supplier) e.push('Supplier is required.')
    if (!activeCheck) e.push('Select one of Open Item, Cleared Items, or All Item.')
    if (activeCheck === 'open' && !openItemDate) e.push('Open Item Date is required.')
    if (activeCheck === 'cleared') {
      if (!clearingDateFrom) e.push('Clearing Date From is required.')
      if (!clearingDateTo)   e.push('Clearing Date To is required.')
      if (!openAtKeyDate)    e.push('Open at Key Date is required.')
    }
    if (activeCheck === 'all') {
      if (!postFrom) e.push('Post From is required.')
      if (!postTo)   e.push('Post To is required.')
    }
    return e
  }, [supplier, activeCheck, openItemDate, clearingDateFrom, clearingDateTo, openAtKeyDate, postFrom, postTo])

  const handleGo = async () => {
    if (validationErrors.length) return
    setLoading(true); setError(null)
    try {
      const data = await api.fetchReport({
        supplier,
        childSupplier: supplierChild,
        docType: selectedDocTypes.join(','),
        invoiceNo,
        documentNo,
        documentDate,
        openItem: activeCheck === 'open',
        openItemDate,
        clearedItems: activeCheck === 'cleared',
        clearingDateFrom, clearingDateTo, openAtKeyDate,
        allItem: activeCheck === 'all',
        postFrom, postTo,
      })
      setRows(data); setHasSearched(true)

      let from = '', to = ''
      if (activeCheck === 'open')    { from = openItemDate }
      if (activeCheck === 'cleared') { from = clearingDateFrom; to = clearingDateTo }
      if (activeCheck === 'all')     { from = postFrom; to = postTo }
      const bal = await api.fetchOpenCloseBal({ supplier, childSupplier: supplierChild, fromDat: from, toDat: to })
      setOpenBal(bal.openBal); setCloseBal(bal.closeBal)
    } catch (err) {
      setError(err.message || 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setSupplier(''); setSupplierChild(''); setSelectedDocTypes([]); setInvoiceNo(''); setDocumentNo(''); setDocumentDate('')
    setActiveCheck(''); setOpenItemDate(''); setClearingDateFrom(''); setClearingDateTo(''); setOpenAtKeyDate('')
    setPostFrom(''); setPostTo(''); setOpenBal(0); setCloseBal(0)
    setRows([]); setHasSearched(false); setError(null)
  }

  const handleExport = async () => {
    if (!rows.length || exporting) return
    setExporting(true)
    try {
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')
      const headers = COLUMNS.map(c => c.label)
      const dataRows = rows.map(r => COLUMNS.map(c => displayVal(r[c.key])))
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows])
      ws['!cols'] = COLUMNS.map(c => ({ wch: Math.max(12, Math.round(c.w / 7)) }))
      XLSX.utils.book_append_sheet(wb, ws, 'Vendor Ledger')
      XLSX.writeFile(wb, getExportFilename())
    } catch (err) { console.error('Export failed:', err) }
    finally { setExporting(false) }
  }

  const openDD = (field) => {
    const cfg = {
      supplier:   { title: 'Select Supplier',  options: suppliers,   multi: false },
      documentNo: { title: 'Document Number',  options: documentNos, multi: false },
      docType:    { title: 'Document Type',    options: docTypes,    multi: true, selected: selectedDocTypes },
      invoice:    { title: 'Invoice Number',   options: invoices,    multi: false },
      
    }
    setDdModal({ field, ...cfg[field] })
  }

  const handleDDDone = (val) => {
    if (ddModal.field === 'supplier')   setSupplier(val)
    if (ddModal.field === 'docType')    setSelectedDocTypes(Array.isArray(val) ? val : [val])
    if (ddModal.field === 'invoice')    setInvoiceNo(val)
    if (ddModal.field === 'documentNo') setDocumentNo(val)
    setDdModal(null)
  }

  const renderCell = (row, col) => {
    const raw = displayVal(row[col.key])

    switch (col.key) {
      // ── Two-line: Supplier ──
      case 'supplier':
        return (
          <div>
            <div className="inline-flex text-[12px] font-bold text-[#32363a] leading-tight">{raw || '—'}</div>
            {row.supplierName && (
              <div className="inline-flex text-[11px] text-[#6a6d70] leading-tight mt-0.5 truncate">{row.supplierName}</div>
            )}
          </div>
        )

      // ── Invoice number ──
      case 'invoiceNumber':
        return <span className="inline-flex font-semibold text-[#0a6ed1] text-[12px]">{raw || '—'}</span>

      // ── Amount columns — tabular, always show value ──
      case 'localCurrencyAmount':
      case 'amountDocCurrency':
      case 'invoiceAmount':
        return <span className="inline-flex tabular-nums font-semibold text-[#32363a] text-[12px]">{raw || '—'}</span>

      case 'basicAmount':
      case 'tdsAmount':
      case 'othersAmount':
      case 'igstAmount':
        return <span className="inline-flex tabular-nums text-[#32363a] text-[12px]">{raw !== '' ? raw : '—'}</span>

      // ── Two-line: Document Type ──
      case 'documentType':
        return (
          <div>
            <span className="inline-flex items-center px-2 py-0.5 bg-[#f0f4f8] text-[#32363a] rounded text-[11px] font-semibold">
              {raw || '—'}
            </span>
            {row.documentTypeText && (
              <div className="inline-flex text-[10px] text-[#6a6d70] mt-0.5 truncate leading-tight">{row.documentTypeText}</div>
            )}
          </div>
        )

      // ── Clearing document — green if present ──
      case 'clearingDocument':
        return raw
          ? <span className="text-[#107e3e] text-[12px] font-medium">{raw}</span>
          : <span className="text-[#d9d9d9]">—</span>

      // ── Default: show value or dash ──
      default:
        return raw !== ''
          ? <span className="text-[#32363a] text-[12px]">{raw}</span>
          : <span className="text-[#d9d9d9]">—</span>
    }
  }

  // ── Supplier display label for filter ──
  const supplierLabel = useMemo(() => {
    const s = suppliers.find(s => s.code === supplier)
    return s ? s.label : ''
  }, [supplier, suppliers])

  const docTypeLabel = useMemo(() => {
    if (!selectedDocTypes.length) return ''
    if (selectedDocTypes.length === 1) {
      const d = docTypes.find(d => d.code === selectedDocTypes[0])
      return d ? `${d.code} — ${d.label}` : selectedDocTypes[0]
    }
    return `${selectedDocTypes.length} types selected`
  }, [selectedDocTypes, docTypes])

  if (selectedRow) {
    return <PageLayout><DetailPage row={selectedRow} onBack={() => setSelectedRow(null)} /></PageLayout>
  }

  return (
    <PageLayout>
      <style>{`
        @keyframes fadeIn    { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)} }
        @keyframes modalIn   { from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)} }
        .anim-fade{animation:fadeIn .3s ease-out both}
        .anim-sd{animation:slideDown .22s ease-out both}
        .row-stagger>*{animation:fadeIn .3s ease-out both}
        .row-stagger>*:nth-child(1){animation-delay:.02s}
        .row-stagger>*:nth-child(2){animation-delay:.05s}
        .row-stagger>*:nth-child(3){animation-delay:.08s}
        .row-stagger>*:nth-child(4){animation-delay:.11s}
        .row-stagger>*:nth-child(5){animation-delay:.14s}
      `}</style>

      {ddModal && (
        <DropdownModal
          title={ddModal.title}
          options={ddModal.options}
          multi={ddModal.multi}
          selected={ddModal.selected}
          onDone={handleDDDone}
          onCancel={() => setDdModal(null)}
        />
      )}

      <div className="bg-[#f5f6f7] min-h-[calc(100vh-104px)]">
        <main className="flex flex-col bg-white" style={{ minHeight: 'calc(100vh - 220px)' }}>

          {/* ── Title bar ── */}
          <div className="px-4 sm:px-6 lg:px-10 pt-4 pb-3 flex items-center justify-between gap-3 flex-shrink-0 border-b border-[#e5e5e5]">
            <h1 className="text-[17px] sm:text-[19px] font-bold text-[#32363a] tracking-tight">Vendor Ledger Report</h1>
            <div className="flex items-center gap-2">
              <button onClick={handleGo} disabled={loading || validationErrors.length > 0}
                className="flex items-center gap-1.5 px-5 h-9 text-[13px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {loading && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                Go
              </button>
              <button onClick={() => setFilterBarVisible(v => !v)}
                className="hidden sm:flex px-3 h-9 text-[13px] font-semibold text-[#32363a] bg-white border border-[#d9d9d9] rounded-lg hover:bg-[#f5f6f7] transition-all whitespace-nowrap">
                {filterBarVisible ? 'Hide Filter Bar' : 'Show Filter Bar'}
              </button>
              <button onClick={handleClear}
                className="px-3 h-9 text-[13px] font-semibold text-[#cc1c14] bg-[#fce8e6] border border-[#fce8e6] rounded-lg hover:bg-[#fad6d3] transition-all">
                Clear
              </button>
            </div>
          </div>

          {/* ── Filter bar ── */}
          {filterBarVisible && (
            <div className="px-4 sm:px-6 lg:px-10 pt-4 pb-4 flex-shrink-0 border-b border-[#e5e5e5] bg-[#fafbfc] anim-fade">
              <div className="flex flex-col xl:flex-row gap-4 xl:gap-5">

                {/* LEFT: fields grid */}
                <div className="flex-1 min-w-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">

                    {role !== 'partner' && (
                      <div>
                        <label className="block text-[11px] text-[#6a6d70] mb-1 font-semibold uppercase tracking-wider">Supplier <span className="text-[#cc1c14]">*</span></label>
                        <DropdownTrigger placeholder="Select supplier" displayValue={supplierLabel} onClick={() => openDD('supplier')} onClear={() => setSupplier('')} />
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] text-[#6a6d70] mb-1 font-semibold uppercase tracking-wider">Document No.</label>
                      <DropdownTrigger placeholder="Select doc no." displayValue={documentNo} onClick={() => openDD('documentNo')} onClear={() => setDocumentNo('')} />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#6a6d70] mb-1 font-semibold uppercase tracking-wider">Document Type</label>
                      <DropdownTrigger placeholder="Select type(s)" displayValue={docTypeLabel} onClick={() => openDD('docType')} onClear={() => setSelectedDocTypes([])} />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#6a6d70] mb-1 font-semibold uppercase tracking-wider">Invoice Number</label>
                      <DropdownTrigger placeholder="Select invoice" displayValue={invoiceNo} onClick={() => openDD('invoice')} onClear={() => setInvoiceNo('')} />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#6a6d70] mb-1 font-semibold uppercase tracking-wider">Document Date</label>
                      <input type="date" value={documentDate} onChange={e => setDocumentDate(e.target.value)}
                        className="w-full h-10 pl-3 pr-2 text-[13px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#6a6d70] mb-1 font-semibold uppercase tracking-wider">Opening Balance</label>
                      <div className="h-10 rounded-lg border border-dashed border-[#cfd8e3] bg-[#f8fafc] flex items-center px-3 text-[13px] tabular-nums font-semibold text-[#32363a]">
                        ₹ {openBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#6a6d70] mb-1 font-semibold uppercase tracking-wider">Closing Balance</label>
                      <div className="h-10 rounded-lg border border-dashed border-[#cfd8e3] bg-[#f8fafc] flex items-center px-3 text-[13px] tabular-nums font-semibold text-[#32363a]">
                        ₹ {closeBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT: exclusive checkboxes */}
                <div className="flex flex-row xl:flex-col gap-3 xl:gap-2 xl:pt-4 xl:pl-4 xl:border-l xl:border-[#e5e5e5] xl:min-w-[155px] flex-shrink-0">
                  {[
                    { id: 'open',    label: 'Open Item' },
                    { id: 'cleared', label: 'Cleared Items' },
                    { id: 'all',     label: 'All Item' },
                  ].map(ck => {
                    const on = activeCheck === ck.id
                    const otherActive = activeCheck && activeCheck !== ck.id
                    return (
                      <button key={ck.id} onClick={() => toggleCheck(ck.id)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all select-none ${
                          otherActive
                            ? 'opacity-0 h-0 py-0 px-0 overflow-hidden pointer-events-none'
                            : on
                              ? 'bg-[#0a6ed1] text-white shadow-md'
                              : 'bg-white border border-[#d9d9d9] text-[#32363a] hover:border-[#0a6ed1] hover:text-[#0a6ed1]'
                        }`}
                        style={{ transition: 'all 0.25s ease' }}
                      >
                        <div className={`w-[18px] h-[18px] flex-shrink-0 rounded border-2 flex items-center justify-center transition-all ${
                          on ? 'bg-white border-white' : 'border-[#d9d9d9]'
                        }`}>
                          {on && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0a6ed1" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
                        </div>
                        {ck.label} <span className="text-[10px] opacity-70">*</span>
                      </button>
                    )
                  })}
                  {activeCheck && (
                    <button onClick={() => toggleCheck(activeCheck)}
                      className="text-[11px] text-[#6a6d70] hover:text-[#cc1c14] underline underline-offset-2 transition-colors mt-0.5">
                      Deselect
                    </button>
                  )}
                </div>
              </div>

              {/* Conditional date fields */}
              {activeCheck === 'open' && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 p-3 bg-[#f0f7ff] rounded-lg border border-[#cce0ff] anim-sd">
                  <div>
                    <label className="block text-[11px] text-[#0a6ed1] mb-1 font-semibold uppercase tracking-wider">Open Item Date <span className="text-[#cc1c14]">*</span></label>
                    <input type="date" value={openItemDate} onChange={e => setOpenItemDate(e.target.value)}
                      className="w-full h-10 pl-3 pr-2 text-[13px] border border-[#0a6ed1]/30 rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
                  </div>
                </div>
              )}

              {activeCheck === 'cleared' && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#f0fff4] rounded-lg border border-[#b7e8c7] anim-sd">
                  <div>
                    <label className="block text-[11px] text-[#107e3e] mb-1 font-semibold uppercase tracking-wider">Clearing Date From <span className="text-[#cc1c14]">*</span></label>
                    <input type="date" value={clearingDateFrom} onChange={e => setClearingDateFrom(e.target.value)}
                      className="w-full h-10 pl-3 pr-2 text-[13px] border border-[#107e3e]/30 rounded-lg bg-white focus:outline-none focus:border-[#107e3e] focus:ring-2 focus:ring-[#107e3e]/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#107e3e] mb-1 font-semibold uppercase tracking-wider">Clearing Date To <span className="text-[#cc1c14]">*</span></label>
                    <input type="date" value={clearingDateTo} onChange={e => setClearingDateTo(e.target.value)}
                      className="w-full h-10 pl-3 pr-2 text-[13px] border border-[#107e3e]/30 rounded-lg bg-white focus:outline-none focus:border-[#107e3e] focus:ring-2 focus:ring-[#107e3e]/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#107e3e] mb-1 font-semibold uppercase tracking-wider">Open at Key Date <span className="text-[#cc1c14]">*</span></label>
                    <input type="date" value={openAtKeyDate} onChange={e => setOpenAtKeyDate(e.target.value)}
                      className="w-full h-10 pl-3 pr-2 text-[13px] border border-[#107e3e]/30 rounded-lg bg-white focus:outline-none focus:border-[#107e3e] focus:ring-2 focus:ring-[#107e3e]/20 transition-all" />
                  </div>
                </div>
              )}

              {activeCheck === 'all' && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 p-3 bg-[#fffbeb] rounded-lg border border-[#fde68a] anim-sd">
                  <div>
                    <label className="block text-[11px] text-[#b45309] mb-1 font-semibold uppercase tracking-wider">Post From <span className="text-[#cc1c14]">*</span></label>
                    <input type="date" value={postFrom} onChange={e => setPostFrom(e.target.value)}
                      className="w-full h-10 pl-3 pr-2 text-[13px] border border-[#b45309]/30 rounded-lg bg-white focus:outline-none focus:border-[#b45309] focus:ring-2 focus:ring-[#b45309]/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#b45309] mb-1 font-semibold uppercase tracking-wider">Post To <span className="text-[#cc1c14]">*</span></label>
                    <input type="date" value={postTo} onChange={e => setPostTo(e.target.value)}
                      className="w-full h-10 pl-3 pr-2 text-[13px] border border-[#b45309]/30 rounded-lg bg-white focus:outline-none focus:border-[#b45309] focus:ring-2 focus:ring-[#b45309]/20 transition-all" />
                  </div>
                </div>
              )}

              {validationErrors.length > 0 && (
                <div className="mt-3 space-y-0.5">
                  {validationErrors.map((e, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-[#cc1c14]">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
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
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-25">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  <div className="text-[14px] font-semibold mb-1">No data loaded</div>
                  <div className="text-[12px]">Set filters and click <strong>Go</strong></div>
                </div>
              </div>
            ) : loading ? (
              <div className="flex-1 flex items-center justify-center anim-fade">
                <div className="flex flex-col items-center gap-3 text-[#6a6d70]">
                  <div className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#0a6ed1] rounded-full animate-spin" />
                  <span className="text-[13px]">Fetching data…</span>
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
                <div className="text-[14px] font-semibold text-[#6a6d70]">No data found</div>
              </div>
            ) : (
              <div className="rounded-xl border border-[#e5e5e5] shadow-sm overflow-hidden flex flex-col flex-1 anim-fade" style={{ minHeight: 0 }}>
                <div className="px-4 py-2 border-b border-[#e5e5e5] bg-[#fafbfc] flex-shrink-0 flex items-center justify-between">
                  <span className="text-[12px] text-[#6a6d70]">
                    <span className="font-semibold text-[#32363a]">{rows.length}</span> record{rows.length !== 1 ? 's' : ''}
                  </span>
                  {(openBal !== 0 || closeBal !== 0) && (
                    <div className="flex items-center gap-4 text-[12px]">
                      <span className="text-[#6a6d70]">Opening: <strong className="text-[#32363a] tabular-nums">₹ {openBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                      <span className="text-[#6a6d70]">Closing: <strong className="text-[#32363a] tabular-nums">₹ {closeBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-auto min-h-0">
                  <table className="border-collapse text-[12px]"
                    style={{ minWidth: `${TABLE_W}px`, tableLayout: 'fixed', width: `${TABLE_W}px` }}>
                    <colgroup>
                      {COLUMNS.map(c => <col key={c.key} style={{ width: `${c.w}px` }} />)}
                      <col style={{ width: '44px' }} />
                    </colgroup>
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-gradient-to-b from-[#fafbfc] to-[#f5f6f7] text-[#6a6d70]">
                        {COLUMNS.map(c => (
                          <th key={c.key} className="text-left font-semibold py-3 px-3 text-[10px] uppercase tracking-wider border-b border-r border-[#e5e5e5] whitespace-nowrap">
                            {c.label}
                          </th>
                        ))}
                        <th className="py-3 px-2 border-b border-[#e5e5e5] w-11" />
                      </tr>
                    </thead>
                    <tbody className="row-stagger">
                      {rows.map((row, idx) => (
                        <tr key={`${row.documentNumber}-${idx}`}
                          onClick={() => setSelectedRow(row)}
                          className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#ebf5ff] cursor-pointer transition-colors duration-100 group">
                          {COLUMNS.map(col => (
                            <td key={col.key} className="py-2.5 px-3 border-r border-[#f0f0f0] align-top">
                              {renderCell(row, col)}
                            </td>
                          ))}
                          <td className="py-2.5 px-2 text-center align-middle">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
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

          {/* ── Export footer ── */}
          <div className="px-4 sm:px-6 lg:px-10 py-3 flex justify-end flex-shrink-0 border-t border-[#e5e5e5] bg-white">
            <button onClick={handleExport} disabled={!rows.length || exporting}
              className="flex items-center gap-2 px-5 h-10 text-[13px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed">
              {exporting
                ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
              }
              {exporting ? 'Exporting…' : 'Export'}
            </button>
          </div>

        </main>
      </div>
    </PageLayout>
  )
}