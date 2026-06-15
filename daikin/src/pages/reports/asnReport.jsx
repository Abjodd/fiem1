import { useState, useMemo, useEffect, useRef } from 'react'
import PageLayout from '../../layouts/PageLayout.jsx'
import { AsnReportApi, authConfig } from '../../services/Asnreport.js'

// ═══════════════════════════════════════════════════════════════
// DATE HELPERS
// ═══════════════════════════════════════════════════════════════
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
const monthsAgoIso = (n) => {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
const getDownloadFilename = () => {
  const d = new Date()
  return `asnReport_${MONTHS_SHORT[d.getMonth()]}_${String(d.getDate()).padStart(2,'0')}.xlsx`
}

const companyCode = 'FIEM (FIEM Industries Limited)'

const STATUS_OPTIONS = ['', 'GR Completed', 'GR Pending', 'INV. Completed', 'INV. Pending', 'ASN-In Transit']

// ── Client-side status filter ─────────────────────────────────
// Status dropdown filters the already-fetched rows locally.
// GR status col → grStatus, INV status col → invStatus, ASN status col → asnStatus
function applyStatusFilter(rows, status) {
  if (!status) return rows
  switch (status) {
    case 'GR Completed':   return rows.filter(r => r.grStatus  === 'Completed')
    case 'GR Pending':     return rows.filter(r => r.grStatus  === 'Pending')
    case 'INV. Completed': return rows.filter(r => r.invStatus === 'Completed')
    case 'INV. Pending':   return rows.filter(r => r.invStatus === 'Pending')
    case 'ASN-In Transit': return rows.filter(r => {
      const s = (r.asnStatus || '').toLowerCase()
      return s === 'in transit' || s === 'new' || s.includes('transit')
    })
    default:               return rows
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORT PROGRESS MODAL (same as MIGO)
// ═══════════════════════════════════════════════════════════════
function ExportModal({ progress, total, onCancel }) {
  const pct = total > 0 ? Math.round((progress / total) * 100) : 0
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-xl shadow-2xl w-[440px] max-w-[95vw] p-6" style={{ animation: 'modalIn 0.2s ease-out both' }}>
        <h3 className="text-[16px] font-semibold text-[#32363a] mb-4">Export Document</h3>
        <p className="text-[14px] text-[#6a6d70] mb-4">Generating file…</p>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[13px] text-[#32363a] font-semibold tabular-nums min-w-[60px]">{progress} / {total}</span>
          <div className="flex-1 h-3 bg-[#f0f0f0] rounded-full overflow-hidden">
            <div className="h-full bg-[#107e3e] rounded-full transition-all duration-200" style={{ width: `${pct}%` }} />
          </div>
          {pct >= 100 && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#107e3e" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><path d="M5 13l4 4L19 7"/>
            </svg>
          )}
        </div>
        <div className="flex justify-end">
          <button onClick={onCancel} className="px-5 h-9 text-[14px] font-semibold text-[#6a6d70] hover:bg-[#f5f6f7] rounded-lg transition-all">Cancel</button>
        </div>
      </div>
    </div>
  )
}


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
// STATUS BADGE
// ═══════════════════════════════════════════════════════════════
function StatusBadge({ value }) {
  const cfg = {
    Completed:       { bg: 'bg-[#e8f5ec]', text: 'text-[#107e3e]' },
    'Reached Plant': { bg: 'bg-[#ebf5ff]', text: 'text-[#0a6ed1]' },
    New:             { bg: 'bg-[#f0f4f8]', text: 'text-[#32363a]' },
    'In Transit':    { bg: 'bg-[#fff4e5]', text: 'text-[#c06000]' },
    Pending:         { bg: 'bg-[#fef7e6]', text: 'text-[#b45309]' },
  }
  const c = cfg[value] || { bg: 'bg-[#f5f6f7]', text: 'text-[#6a6d70]' }
  if (!value) return <span className="text-[#d9d9d9] text-[12px]">—</span>
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${c.bg} ${c.text}`}>
      {value}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════
// COLUMN DEFINITIONS
// ═══════════════════════════════════════════════════════════════
const COLUMNS = [
  { key: 'plant',            label: 'Plant',               width: 90  },
  { key: 'invoiceNumber',    label: 'Invoice Number',      width: 120 },
  { key: 'invoiceDate',      label: 'Invoice Date',        width: 110 },
  { key: 'ibdNo',            label: 'IBD No.',             width: 110 },
  { key: 'gateEntryNo',      label: 'Gate Entry No.',      width: 120 },
  { key: 'asnNumber',        label: 'ASN Number',          width: 165 },
  { key: 'shipmentNo',       label: 'Shipment No.',        width: 130 },
  { key: 'createdOn',        label: 'Created On',          width: 110 },
  { key: 'shipmentDate',     label: 'Shipment Date',       width: 115 },
  { key: 'baseDocument',     label: 'Base Document',       width: 120 },
  { key: 'vendor',           label: 'Vendor',              width: 160 },
  { key: 'purchaseGroup',    label: 'Purchase Group',      width: 115 },
  { key: 'asnStatus',        label: 'ASN Status',          width: 110 },
  { key: 'grStatus',         label: 'GR Status',           width: 105 },
  { key: 'invStatus',        label: 'Inv. Status',         width: 105 },
  { key: 'currency',         label: 'Currency',            width: 85  },
  { key: 'qty',              label: 'Qty',                 width: 100 },
  { key: 'ewayBillNo',       label: 'Eway Bill No.',       width: 120 },
  { key: 'ewayBillDate',     label: 'Eway Bill Date',      width: 115 },
  { key: 'reachedPlantDate', label: 'Reached Plant Date',  width: 145 },
  { key: 'etaDate',          label: 'ETA Date',            width: 100 },
  { key: 'etaTime',          label: 'ETA Time',            width: 90  },
  { key: 'gateEntryDT',      label: 'Gate Entry Date & Time', width: 155 },
  { key: 'gateExitDT',       label: 'Gate Exit Date & Time',  width: 150 },
  { key: 'invoicePdir',      label: 'Invoice/PDIR',        width: 100 },
]

const TOTAL_WIDTH = COLUMNS.reduce((s, c) => s + c.width, 0) + 48

// ═══════════════════════════════════════════════════════════════
// DETAIL PAGE
// ═══════════════════════════════════════════════════════════════
function AsnDetailPage({ row, onBack }) {
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
            ASN Number - <span className="text-[#0a6ed1]">{row.asnNumber}</span>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-10 pt-6 pb-8">
          <div className="px-4 sm:px-6 lg:px-10 pt-3 pb-2 bg-white border-b border-[#e5e5e5] flex-shrink-0">
            <div className="text-[13px] text-[#32363a] text-center font-medium">
              Company Code: <strong>{companyCode}</strong>
            </div>
          </div>

          <div className="rounded-xl border border-[#e5e5e5] shadow-sm bg-white p-5 sm:p-6 mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div>
                <h1 className="text-[26px] sm:text-[30px] font-bold text-[#32363a] tracking-tight">{row.asnNumber}</h1>
                <div className="text-[13px] text-[#6a6d70] mt-1.5">Plant: <span className="text-[#32363a] font-medium">{row.plantDesc} ({row.plant})</span></div>
                <div className="text-[13px] text-[#6a6d70] mt-0.5">Created On: <span className="text-[#32363a] font-medium">{row.createdOn}</span></div>
              </div>
              <div className="text-right">
                <StatusBadge value={row.asnStatus} />
                {row.invoiceNumber && (
                  <div className="text-[13px] text-[#6a6d70] mt-2">Invoice No.: <span className="font-medium text-[#32363a]">{row.invoiceNumber}</span></div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#e5e5e5] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] border-collapse" style={{ minWidth: '640px' }}>
                <thead>
                  <tr className="bg-gradient-to-b from-[#fafbfc] to-[#f5f6f7] text-[#6a6d70]">
                    <th className="text-left font-semibold py-3.5 px-4 text-[11px] uppercase tracking-wider border-b border-[#e5e5e5]">Material</th>
                    <th className="text-left font-semibold py-3.5 px-4 text-[11px] uppercase tracking-wider border-b border-[#e5e5e5]">Challan No</th>
                    <th className="text-right font-semibold py-3.5 px-4 text-[11px] uppercase tracking-wider border-b border-[#e5e5e5]">Qty</th>
                    <th className="text-left font-semibold py-3.5 px-4 text-[11px] uppercase tracking-wider border-b border-[#e5e5e5]">Quality Status</th>
                    <th className="text-left font-semibold py-3.5 px-4 text-[11px] uppercase tracking-wider border-b border-[#e5e5e5]">Packing Material Type</th>
                    <th className="text-right font-semibold py-3.5 px-4 text-[11px] uppercase tracking-wider border-b border-[#e5e5e5]">Packing Material Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {(row.items || []).map((item, idx) => (
                    <tr key={idx} className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc] transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-semibold text-[#32363a] text-[13px]">{item.materialName}</div>
                        <div className="text-[#0a6ed1] text-[12px] mt-0.5 font-medium">{item.materialCode}</div>
                      </td>
                      <td className="py-4 px-4 text-[#32363a]">{item.challanNo || <span className="text-[#d9d9d9]">—</span>}</td>
                      <td className="py-4 px-4 text-right font-semibold text-[#32363a] tabular-nums">{item.qty}</td>
                      <td className="py-4 px-4"><StatusBadge value={item.qualityStatus} /></td>
                      <td className="py-4 px-4 text-[#32363a]">{item.packingMaterialType}</td>
                      <td className="py-4 px-4 text-right tabular-nums text-[#32363a]">{item.packingMaterialQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
export default function AsnReport() {
  // ── Filter state ──
  const [asnDateFrom,  setAsnDateFrom]  = useState(monthsAgoIso(1))
  const [asnDateTo,    setAsnDateTo]    = useState(todayIso())
  const [supplier,     setSupplier]     = useState('')
  const [material,     setMaterial]     = useState('')
  const [invoiceNo,    setInvoiceNo]    = useState('')
  const [refDoc,       setRefDoc]       = useState('')
  const [asnNo,        setAsnNo]        = useState('')
  const [shipmentNo,   setShipmentNo]   = useState('')
  const [ibdNo,        setIbdNo]        = useState('')
  // plant REMOVED from filter
  const [status,       setStatus]       = useState('')

  const [filterBarVisible, setFilterBarVisible] = useState(true)

  // ── Value help ──
  const [vhModal,   setVhModal]   = useState(null)
  const [vhOptions, setVhOptions] = useState([])

  // ── Data — rawRows = full OData result, rows = after client status filter ──
  const [rawRows,     setRawRows]     = useState([])
  const [loading,     setLoading]     = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error,       setError]       = useState(null)

  // ── Detail page ──
  const [selectedRow, setSelectedRow] = useState(null)

  // ── Downloading ──
  const [exporting,      setExporting]      = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportTotal,    setExportTotal]    = useState(0)
  const exportCancelRef = useRef(false)

  // ── Derived: apply client-side status filter on top of raw rows ──
  const rows = useMemo(() => applyStatusFilter(rawRows, status), [rawRows, status])

  const dateError = useMemo(() => {
    if (!asnDateFrom || !asnDateTo) return null
    return new Date(asnDateFrom) > new Date(asnDateTo) ? 'From date must be before To date' : null
  }, [asnDateFrom, asnDateTo])

  const VH_TITLES = {
    supplier: 'Supplier',
    material: 'Material',
    invoice:  'Invoice Number',
    refDoc:   'Reference Document',
    asn:      'ASN Number',
    shipment: 'Shipment Number',
    ibd:      'IBD Number',
  }

  // ── Open VH ──
  const openVh = async (field) => {
    setVhModal(field)
    setVhOptions([])
    try {
      let opts = []
      const dateArgs = { startDate: asnDateFrom, endDate: asnDateTo }
      switch (field) {
        case 'asn':      opts = await AsnReportApi.fetchAsnHelp(dateArgs);      break
        case 'material': opts = await AsnReportApi.fetchMaterialHelp(dateArgs); break
        case 'invoice':  opts = await AsnReportApi.fetchInvoiceHelp(dateArgs);  break
        case 'refDoc':   opts = await AsnReportApi.fetchRefDocHelp(dateArgs);   break
        case 'shipment': opts = await AsnReportApi.fetchShipmentHelp(dateArgs); break
        case 'ibd':      opts = await AsnReportApi.fetchIbdHelp(dateArgs);      break
        case 'supplier': opts = await AsnReportApi.fetchSupplierHelp();          break
        default:         opts = []
      }
      setVhOptions(opts)
    } catch {
      setVhOptions([])
    }
  }

  const handleVhSelect = (opt) => {
    const map = {
      supplier: setSupplier, material: setMaterial,
      invoice: setInvoiceNo, refDoc: setRefDoc, asn: setAsnNo,
      shipment: setShipmentNo, ibd: setIbdNo,
    }
    map[vhModal]?.(opt.code)
    setVhModal(null)
  }

  const handleGo = async () => {
    if (dateError) return
    setLoading(true)
    setError(null)
    try {
      // Status NOT sent to OData — applied client-side after fetch
      const data = await AsnReportApi.fetchReport({
        asnDateFrom, asnDateTo, supplier, material, invoiceNo,
        refDoc, asnNo, shipmentNo, ibdNo,
      })
      setRawRows(data)
      setHasSearched(true)
    } catch (err) {
      setError(err.message || 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setAsnDateFrom(monthsAgoIso(1)); setAsnDateTo(todayIso())
    setSupplier(''); setMaterial(''); setInvoiceNo(''); setRefDoc('')
    setAsnNo(''); setShipmentNo(''); setIbdNo(''); setStatus('')
    setRawRows([]); setHasSearched(false); setError(null)
  }

  // ── Download — MIGO-style progress export ──
  const handleDownload = async () => {
    if (!rows.length || exporting) return
    setExporting(true)
    exportCancelRef.current = false
    setExportTotal(rows.length)
    setExportProgress(0)
    try {
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')

      const headers = [
        'Plant', 'Plant Description', 'Invoice Number', 'Invoice Date', 'IBD No.',
        'Gate Entry No.', 'ASN Number', 'Shipment', 'ASN Created On', 'Shipment Date',
        'Base Document', 'Base Document Type', 'Material', 'Material Description',
        'Vendor Code', 'Vendor Name', 'Purchase Group',
        'ASN Status', 'GR Status', 'Inv. Status',
        'Currency', 'Qty', 'Eway Bill No.', 'Eway Bill Date',
        'Reached Plant Date', 'ETA Date', 'ETA Time',
        'Gate Entry Date', 'Gate Entry Time', 'Gate Exit Date', 'Gate Exit Time',
      ]

      // Helper: convert column index to Excel letter(s) — handles AA, AB etc.
      const colLetter = (n) => {
        let s = ''
        n += 1
        while (n > 0) {
          n--
          s = String.fromCharCode(65 + (n % 26)) + s
          n = Math.floor(n / 26)
        }
        return s
      }

      const dataRows = []
      for (let i = 0; i < rows.length; i++) {
        if (exportCancelRef.current) break
        const r = rows[i]
        dataRows.push([
          r.plant,            r.plantDesc,        r.invoiceNumber,  r.invoiceDate,
          r.ibdNo,            r.gateEntryNo,      r.asnNumber,      r.shipmentNo,
          r.createdOn,        r.shipmentDate,     r.baseDocument,   r.baseDocumentType,
          r.material,         r.materialName,     r.vendorCode,     r.vendorName,
          r.purchaseGroup,    r.asnStatus,        r.grStatus,       r.invStatus,
          r.currency,         r.qty,              r.ewayBillNo,     r.ewayBillDate,
          r.reachedPlantDate, r.etaDate,          r.etaTime,
          r.gateEntryDate,    r.gateEntryTime,    r.gateExitDate,   r.gateExitTime,
        ])
        setExportProgress(i + 1)
        await new Promise(res => setTimeout(res, 8))
      }

      if (exportCancelRef.current) return

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows])
      ws['!cols'] = headers.map(() => ({ wch: 18 }))
      ws['!autofilter'] = { ref: `A1:${colLetter(headers.length - 1)}1` }
      ws['!freeze'] = { xSplit: 0, ySplit: 1 }

      const range = XLSX.utils.decode_range(ws['!ref'])
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c: C })
        if (!ws[addr]) continue
        ws[addr].s = { font: { bold: true, name: 'Arial', sz: 11 }, fill: { fgColor: { rgb: 'D9E1F2' } } }
      }

      XLSX.utils.book_append_sheet(wb, ws, 'ASN Report')
      XLSX.writeFile(wb, getDownloadFilename())
      await new Promise(res => setTimeout(res, 600))
    } catch (err) {
      console.error('Download failed:', err)
      alert(`Download failed: ${err.message}`)
    } finally {
      setExporting(false)
      setExportProgress(0)
    }
  }

  // ── Cell renderer ──
  const renderCell = (row, col) => {
    switch (col.key) {
      case 'plant':
        return <div><div className="font-semibold text-[#32363a]">{row.plant}</div><div className="text-[#6a6d70] text-[11px]">{row.plantDesc}</div></div>
      case 'invoiceNumber':
        return row.invoiceNumber
          ? <span className="inline-flex items-center px-2.5 py-1 bg-[#f0f4f8] text-[#32363a] rounded-md text-[12px] font-semibold">{row.invoiceNumber}</span>
          : <span className="text-[#d9d9d9]">—</span>
      case 'asnNumber':
        return <span className="font-semibold text-[#0a6ed1] text-[12px]">{row.asnNumber}</span>
      case 'baseDocument':
        return <div><div className="font-semibold text-[#32363a] text-[12px]">{row.baseDocument}</div><div className="text-[#6a6d70] text-[11px]">{row.baseDocumentType}</div></div>
      case 'vendor':
        return <div><div className="font-semibold text-[#32363a] text-[12px]">{row.vendorCode}</div><div className="text-[#6a6d70] text-[11px] mt-0.5">{row.vendorName}</div></div>
      case 'asnStatus': return <StatusBadge value={row.asnStatus} />
      case 'grStatus':  return <StatusBadge value={row.grStatus} />
      case 'invStatus':
        return <span className={`text-[12px] font-semibold ${row.invStatus === 'Pending' ? 'text-[#b45309]' : 'text-[#107e3e]'}`}>{row.invStatus}</span>
      case 'qty':
        return <span className="tabular-nums font-semibold text-[#32363a]">{row.qty}</span>
      case 'invoicePdir':
        return (
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f5f6f7] text-[#f59e0b] transition-all" title="Attachment">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>
        )
      case 'gateEntryDT':
        return row.gateEntryDate
          ? <div><div className="text-[12px] text-[#32363a]">{row.gateEntryDate}</div><div className="text-[11px] text-[#6a6d70]">{row.gateEntryTime}</div></div>
          : <span className="text-[#d9d9d9]">—</span>
      case 'gateExitDT':
        return row.gateExitDate
          ? <div><div className="text-[12px] text-[#32363a]">{row.gateExitDate}</div><div className="text-[11px] text-[#6a6d70]">{row.gateExitTime}</div></div>
          : <span className="text-[#d9d9d9]">—</span>
      default:
        return row[col.key] ? <span className="text-[#32363a] text-[12px]">{row[col.key]}</span> : <span className="text-[#d9d9d9]">—</span>
    }
  }

  if (selectedRow) {
    return (
      <PageLayout>
        <AsnDetailPage row={selectedRow} onBack={() => setSelectedRow(null)} />
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <style>{`
        @keyframes fadeIn  { from { opacity:0; transform:translateY(8px);  } to { opacity:1; transform:translateY(0); } }
        @keyframes modalIn { from { opacity:0; transform:scale(0.94);      } to { opacity:1; transform:scale(1);      } }
        .anim-fade { animation: fadeIn 0.35s ease-out both; }
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

      {exporting && (
        <ExportModal progress={exportProgress} total={exportTotal}
          onCancel={() => { exportCancelRef.current = true; setExporting(false) }} />
      )}

      <div className="bg-[#f5f6f7] min-h-[calc(100vh-104px)]">
        <main className="flex flex-col bg-white" style={{ minHeight: 'calc(100vh - 220px)' }}>

          {/* Action buttons */}
          <div className="px-4 sm:px-6 lg:px-10 pt-3 pb-2 flex items-center justify-end gap-2 flex-shrink-0">
            <button onClick={handleGo} disabled={loading || !!dateError}
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

          {/* Filter bar — plant REMOVED, 5+5 layout */}
          {filterBarVisible && (
            <div className="px-4 sm:px-6 lg:px-10 pt-1 pb-4 flex-shrink-0 border-b border-[#e5e5e5] anim-fade">

              {/* Row 1: dates + supplier + material + invoice */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-3">
                <div>
                  <label className="block text-[12px] text-[#6a6d70] mb-1 font-semibold">ASN Creation Date From <span className="text-[#cc1c14]">*</span></label>
                  <div className="relative">
                    <input type="date" value={asnDateFrom} onChange={e => setAsnDateFrom(e.target.value)} max={asnDateTo || undefined}
                      className={`w-full h-10 pl-3 pr-8 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 transition-all ${dateError ? 'border-[#cc1c14] focus:ring-[#cc1c14]/20' : 'border-[#d9d9d9] focus:border-[#0a6ed1] focus:ring-[#0a6ed1]/20'}`} />
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2.5 top-3.5 text-[#6a6d70] pointer-events-none"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] text-[#6a6d70] mb-1 font-semibold">ASN Creation Date To <span className="text-[#cc1c14]">*</span></label>
                  <div className="relative">
                    <input type="date" value={asnDateTo} onChange={e => setAsnDateTo(e.target.value)} min={asnDateFrom || undefined}
                      className={`w-full h-10 pl-3 pr-8 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 transition-all ${dateError ? 'border-[#cc1c14] focus:ring-[#cc1c14]/20' : 'border-[#d9d9d9] focus:border-[#0a6ed1] focus:ring-[#0a6ed1]/20'}`} />
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2.5 top-3.5 text-[#6a6d70] pointer-events-none"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] text-[#6a6d70] mb-1 font-semibold">Supplier:</label>
                  <VhInput placeholder="Select Supplier" value={supplier} onOpen={() => openVh('supplier')} />
                </div>
                <div>
                  <label className="block text-[12px] text-[#6a6d70] mb-1 font-semibold">Material:</label>
                  <VhInput placeholder="Select Material" value={material} onOpen={() => openVh('material')} />
                </div>
                <div>
                  <label className="block text-[12px] text-[#6a6d70] mb-1 font-semibold">Invoice Number:</label>
                  <VhInput placeholder="Select Invoice No." value={invoiceNo} onOpen={() => openVh('invoice')} />
                </div>
              </div>

              {/* Row 2: refDoc + asn + shipment + ibd + status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[12px] text-[#6a6d70] mb-1 font-semibold">Reference Document:</label>
                  <VhInput placeholder="Select Reference Doc." value={refDoc} onOpen={() => openVh('refDoc')} />
                </div>
                <div>
                  <label className="block text-[12px] text-[#6a6d70] mb-1 font-semibold">ASN Number:</label>
                  <VhInput placeholder="Select ASN No." value={asnNo} onOpen={() => openVh('asn')} />
                </div>
                <div>
                  <label className="block text-[12px] text-[#6a6d70] mb-1 font-semibold">Shipment Number:</label>
                  <VhInput placeholder="Select Shipment No." value={shipmentNo} onOpen={() => openVh('shipment')} />
                </div>
                <div>
                  <label className="block text-[12px] text-[#6a6d70] mb-1 font-semibold">IBD Number:</label>
                  <VhInput placeholder="Select IBD No." value={ibdNo} onOpen={() => openVh('ibd')} />
                </div>
                <div>
                  <label className="block text-[12px] text-[#6a6d70] mb-1 font-semibold">Status:</label>
                  <div className="relative">
                    <select value={status} onChange={e => setStatus(e.target.value)}
                      className="w-full h-10 pl-3 pr-8 text-[13px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all appearance-none cursor-pointer">
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || '(All)'}</option>)}
                    </select>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2.5 top-3.5 text-[#6a6d70] pointer-events-none"><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              {dateError && (
                <div className="mt-2 flex items-center gap-1.5 text-[12px] text-[#cc1c14]">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                  {dateError}
                </div>
              )}
            </div>
          )}

          {/* Table area */}
          <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 lg:px-10 pt-3 pb-0 min-h-0">
            {!hasSearched && !loading ? (
              <div className="flex-1 flex items-center justify-center anim-fade">
                <div className="text-center text-[#6a6d70]">
                  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-25">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  <div className="text-[15px] font-semibold mb-1">No report loaded</div>
                  <div className="text-[13px]">Set filters and click <strong>Go</strong> to generate the report</div>
                </div>
              </div>
            ) : loading ? (
              <div className="flex-1 flex items-center justify-center anim-fade">
                <div className="flex flex-col items-center gap-3 text-[#6a6d70]">
                  <div className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#0a6ed1] rounded-full animate-spin" />
                  <span className="text-[14px]">Fetching report…</span>
                </div>
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-2 px-4 py-3 bg-[#fce8e6] text-[#cc1c14] rounded-lg text-[13px]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                  {error}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-[#e5e5e5] shadow-sm overflow-hidden flex flex-col flex-1 anim-fade" style={{ minHeight: 0 }}>
                <div className="px-4 py-2 border-b border-[#e5e5e5] bg-[#fafbfc] flex-shrink-0">
                  <span className="text-[13px] text-[#6a6d70]">
                    <span className="font-semibold text-[#32363a]">{rows.length}</span> record{rows.length !== 1 ? 's' : ''} found
                    {status && rawRows.length !== rows.length && (
                      <span className="ml-2 text-[#6a6d70]">(filtered from {rawRows.length} total)</span>
                    )}
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
                      {rows.length === 0 ? (
                        <tr><td colSpan={COLUMNS.length + 1} className="py-12 text-center text-[14px] text-[#6a6d70]">No records found</td></tr>
                      ) : rows.map((row, idx) => (
                        <tr key={`${row.asnNumber}-${idx}`}
                          onClick={() => setSelectedRow(row)}
                          className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#ebf5ff] cursor-pointer transition-colors duration-100 group">
                          {COLUMNS.map(col => (
                            <td key={col.key} className="py-3 px-3 border-r border-[#f0f0f0] align-top">
                              {renderCell(row, col)}
                            </td>
                          ))}
                          <td className="py-3 px-2 text-center align-middle border-r-0">
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

          {/* Download button */}
          <div className="px-4 sm:px-6 lg:px-10 py-3 flex justify-end flex-shrink-0 border-t border-[#e5e5e5] bg-white">
            <button onClick={handleDownload} disabled={!rows.length || exporting}
              className="flex items-center gap-2 px-5 h-10 text-[14px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed">
              {exporting
                ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
              }
              {exporting ? 'Downloading…' : 'Download'}
            </button>
          </div>

        </main>
      </div>
    </PageLayout>
  )
}