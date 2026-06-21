import { useState, useMemo, useEffect, useRef } from 'react'
import PageLayout from '../../layouts/PageLayout.jsx'
import { AsnReportApi, authConfig } from '../../services/Asnreport.js'

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
    default: return rows
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORT PROGRESS MODAL
// ═══════════════════════════════════════════════════════════════
function ExportModal({ progress, total, onCancel }) {
  const pct = total > 0 ? Math.round((progress / total) * 100) : 0
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-xl shadow-2xl w-[440px] max-w-[95vw] p-6" style={{ animation: 'modalIn 0.2s ease-out both' }}>
        <h3 className="text-[15px] font-semibold text-[#32363a] mb-1">Export document</h3>
        <p className="text-[13px] text-[#6a6d70] mb-5">Generating file, please wait…</p>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[12px] text-[#32363a] font-semibold tabular-nums min-w-[60px]">{progress} / {total}</span>
          <div className="flex-1 h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
            <div className="h-full bg-[#107e3e] rounded-full transition-all duration-200" style={{ width: `${pct}%` }} />
          </div>
          {pct >= 100 && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#107e3e" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><path d="M5 13l4 4L19 7"/>
            </svg>
          )}
        </div>
        <div className="flex justify-end">
          <button onClick={onCancel} className="px-4 h-8 text-[13px] font-medium text-[#6a6d70] hover:bg-[#f5f6f7] rounded-lg transition-all border border-[#e5e5e5]">Cancel</button>
        </div>
      </div>
    </div>
  )
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
      <div className="bg-white rounded-xl shadow-2xl w-[360px] max-w-[95vw] flex flex-col overflow-hidden" style={{ maxHeight: '70vh', animation: 'modalIn 0.2s ease-out both' }}>
        <div className="px-5 py-4 border-b border-[#e5e5e5] flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-[#32363a]">{title}</h3>
          <button onClick={onCancel} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#6a6d70] hover:text-[#cc1c14] hover:bg-[#fce8e6] transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="px-4 py-3 border-b border-[#e5e5e5]">
          <div className="relative">
            <input autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              className="w-full h-9 pl-3 pr-9 text-[13px] border border-[#d9d9d9] rounded-lg focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" className="absolute right-3 top-2.5">
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
                <div className="text-[13px] font-semibold text-[#0a6ed1]">{opt.code}</div>
                {opt.label && <div className="text-[11px] text-[#6a6d70] mt-0.5">{opt.label}</div>}
              </button>
            ))
          }
        </div>
        <div className="px-5 py-3 border-t border-[#e5e5e5] flex justify-end">
          <button onClick={onCancel} className="px-4 h-8 text-[13px] font-medium text-[#0a6ed1] hover:bg-[#ebf5ff] rounded-lg transition-all">Cancel</button>
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
    <div className="flex h-9 border border-[#d9d9d9] rounded-lg overflow-hidden bg-white focus-within:border-[#0a6ed1] focus-within:ring-2 focus-within:ring-[#0a6ed1]/20 transition-all">
      <div className="flex-1 flex items-center pl-3 text-[13px] truncate min-w-0 select-none">
        {value
          ? <span className="font-medium text-[#32363a] truncate">{value}</span>
          : <span className="text-[#9ca3af]">{placeholder}</span>
        }
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
    Completed:       { bg: '#e8f5ec', text: '#107e3e' },
    'Reached Plant': { bg: '#ebf5ff', text: '#0a6ed1' },
    New:             { bg: '#f0f4f8', text: '#32363a' },
    'In Transit':    { bg: '#fff4e5', text: '#c06000' },
    Pending:         { bg: '#fef7e6', text: '#b45309' },
  }
  const c = cfg[value] || { bg: '#f5f6f7', text: '#6a6d70' }
  if (!value) return <span className="text-[#d9d9d9] text-[12px]">—</span>
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: c.bg, color: c.text }}>
      {value}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════
// COLUMN DEFINITIONS — no fixed widths, auto layout
// ═══════════════════════════════════════════════════════════════
const COLUMNS = [
  { key: 'plant',            label: 'Plant'                },
  { key: 'invoiceNumber',    label: 'Invoice number'       },
  { key: 'invoiceDate',      label: 'Invoice date'         },
  { key: 'ibdNo',            label: 'IBD no.'              },
  { key: 'gateEntryNo',      label: 'Gate entry no.'       },
  { key: 'asnNumber',        label: 'ASN number'           },
  { key: 'shipmentNo',       label: 'Shipment no.'         },
  { key: 'createdOn',        label: 'Created on'           },
  { key: 'shipmentDate',     label: 'Shipment date'        },
  { key: 'baseDocument',     label: 'Base document'        },
  { key: 'vendor',           label: 'Vendor'               },
  { key: 'purchaseGroup',    label: 'Purchase group'       },
  { key: 'asnStatus',        label: 'ASN status'           },
  { key: 'grStatus',         label: 'GR status'            },
  { key: 'invStatus',        label: 'Inv. status'          },
  { key: 'currency',         label: 'Currency'             },
  { key: 'qty',              label: 'Qty'                  },
  { key: 'ewayBillNo',       label: 'Eway bill no.'        },
  { key: 'ewayBillDate',     label: 'Eway bill date'       },
  { key: 'reachedPlantDate', label: 'Reached plant date'   },
  { key: 'etaDate',          label: 'ETA date'             },
  { key: 'etaTime',          label: 'ETA time'             },
  { key: 'gateEntryDT',      label: 'Gate entry D&T'       },
  { key: 'gateExitDT',       label: 'Gate exit D&T'        },
  { key: 'invoicePdir',      label: 'Invoice/PDIR'         },
]

// ═══════════════════════════════════════════════════════════════
// DETAIL PAGE
// ═══════════════════════════════════════════════════════════════
function AsnDetailPage({ row, onBack }) {
  return (
    <div className="bg-[#f5f6f7] min-h-[calc(100vh-104px)]">
      <main className="bg-white" style={{ minHeight: 'calc(100vh - 220px)' }}>
        <div className="px-4 sm:px-6 lg:px-10 pt-4 pb-3 border-b border-[#e5e5e5] bg-[#fafbfc] flex items-center gap-3">
          <button onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#d9d9d9] text-[#6a6d70] hover:text-[#0a6ed1] hover:border-[#0a6ed1] transition-all flex-shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <div className="text-[13px] font-medium text-[#32363a]">
            ASN number — <span className="text-[#0a6ed1] font-semibold">{row.asnNumber}</span>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-10 pt-6 pb-8">
          <div className="px-4 sm:px-6 py-2.5 bg-[#fafbfc] border border-[#e5e5e5] rounded-lg mb-5 text-center">
            <span className="text-[12px] text-[#6a6d70]">Company code: <strong className="text-[#32363a] font-medium">{companyCode}</strong></span>
          </div>

          <div className="rounded-xl border border-[#e5e5e5] bg-white p-5 sm:p-6 mb-5">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
              <div>
                <h1 className="text-[24px] sm:text-[28px] font-semibold text-[#32363a] tracking-tight">{row.asnNumber}</h1>
                <div className="text-[12px] text-[#6a6d70] mt-1">Plant: <span className="text-[#32363a] font-medium">{row.plantDesc} ({row.plant})</span></div>
                <div className="text-[12px] text-[#6a6d70] mt-0.5">Created on: <span className="text-[#32363a] font-medium">{row.createdOn}</span></div>
              </div>
              <div className="text-right">
                <StatusBadge value={row.asnStatus} />
                {row.invoiceNumber && (
                  <div className="text-[12px] text-[#6a6d70] mt-2">Invoice no.: <span className="font-medium text-[#32363a]">{row.invoiceNumber}</span></div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#e5e5e5] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] border-collapse" style={{ minWidth: '640px' }}>
                <thead>
                  <tr className="bg-[#fafbfc] border-b border-[#e5e5e5] text-[#6a6d70]">
                    {['Material', 'Challan no.', 'Qty', 'Quality status', 'Packing material type', 'Packing material qty'].map((h, i) => (
                      <th key={i} className={`font-medium py-3 px-4 text-[11px] tracking-wide border-b border-[#e5e5e5] ${i >= 2 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(row.items || []).map((item, idx) => (
                    <tr key={idx} className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#32363a] text-[12px]">{item.materialName}</div>
                        <div className="text-[#0a6ed1] text-[11px] mt-0.5 font-medium">{item.materialCode}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[#32363a]">{item.challanNo || <span className="text-[#d9d9d9]">—</span>}</td>
                      <td className="py-3.5 px-4 text-right font-medium text-[#32363a] tabular-nums">{item.qty}</td>
                      <td className="py-3.5 px-4"><StatusBadge value={item.qualityStatus} /></td>
                      <td className="py-3.5 px-4 text-[#32363a]">{item.packingMaterialType}</td>
                      <td className="py-3.5 px-4 text-right tabular-nums text-[#32363a]">{item.packingMaterialQty}</td>
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
  const [asnDateFrom,  setAsnDateFrom]  = useState(monthsAgoIso(1))
  const [asnDateTo,    setAsnDateTo]    = useState(todayIso())
  const [supplier,     setSupplier]     = useState('')
  const [material,     setMaterial]     = useState('')
  const [invoiceNo,    setInvoiceNo]    = useState('')
  const [refDoc,       setRefDoc]       = useState('')
  const [asnNo,        setAsnNo]        = useState('')
  const [shipmentNo,   setShipmentNo]   = useState('')
  const [ibdNo,        setIbdNo]        = useState('')
  const [status,       setStatus]       = useState('')
  const [filterBarVisible, setFilterBarVisible] = useState(true)

  const [vhModal,   setVhModal]   = useState(null)
  const [vhOptions, setVhOptions] = useState([])

  const [rawRows,     setRawRows]     = useState([])
  const [loading,     setLoading]     = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error,       setError]       = useState(null)

  const [selectedRow, setSelectedRow] = useState(null)

  const [exporting,      setExporting]      = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportTotal,    setExportTotal]    = useState(0)
  const exportCancelRef = useRef(false)

  const rows = useMemo(() => applyStatusFilter(rawRows, status), [rawRows, status])

  const dateError = useMemo(() => {
    if (!asnDateFrom || !asnDateTo) return null
    return new Date(asnDateFrom) > new Date(asnDateTo) ? 'From date must be before To date' : null
  }, [asnDateFrom, asnDateTo])

  const VH_TITLES = {
    supplier: 'Supplier', material: 'Material', invoice: 'Invoice number',
    refDoc: 'Reference document', asn: 'ASN number', shipment: 'Shipment number', ibd: 'IBD number',
  }

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
    } catch { setVhOptions([]) }
  }

  const handleVhSelect = (opt) => {
    const map = {
      supplier: setSupplier, material: setMaterial, invoice: setInvoiceNo,
      refDoc: setRefDoc, asn: setAsnNo, shipment: setShipmentNo, ibd: setIbdNo,
    }
    map[vhModal]?.(opt.code)
    setVhModal(null)
  }

  const handleGo = async () => {
    if (dateError) return
    setLoading(true); setError(null)
    try {
      const data = await AsnReportApi.fetchReport({
        asnDateFrom, asnDateTo, supplier, material, invoiceNo, refDoc, asnNo, shipmentNo, ibdNo,
      })
      setRawRows(data)
      setHasSearched(true)
    } catch (err) {
      setError(err.message || 'Failed to fetch')
    } finally { setLoading(false) }
  }

  const handleClear = () => {
    setAsnDateFrom(monthsAgoIso(1)); setAsnDateTo(todayIso())
    setSupplier(''); setMaterial(''); setInvoiceNo(''); setRefDoc('')
    setAsnNo(''); setShipmentNo(''); setIbdNo(''); setStatus('')
    setRawRows([]); setHasSearched(false); setError(null)
  }

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
      const colLetter = (n) => {
        let s = ''; n += 1
        while (n > 0) { n--; s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) }
        return s
      }
      const dataRows = []
      for (let i = 0; i < rows.length; i++) {
        if (exportCancelRef.current) break
        const r = rows[i]
        dataRows.push([
          r.plant, r.plantDesc, r.invoiceNumber, r.invoiceDate,
          r.ibdNo, r.gateEntryNo, r.asnNumber, r.shipmentNo,
          r.createdOn, r.shipmentDate, r.baseDocument, r.baseDocumentType,
          r.material, r.materialName, r.vendorCode, r.vendorName,
          r.purchaseGroup, r.asnStatus, r.grStatus, r.invStatus,
          r.currency, r.qty, r.ewayBillNo, r.ewayBillDate,
          r.reachedPlantDate, r.etaDate, r.etaTime,
          r.gateEntryDate, r.gateEntryTime, r.gateExitDate, r.gateExitTime,
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
    } finally { setExporting(false); setExportProgress(0) }
  }

  // ── Cell renderer ──
  const renderCell = (row, col) => {
    switch (col.key) {
      case 'plant':
        return (
          <div>
            <div className="font-medium text-[#32363a] text-[12px]">{row.plant}</div>
            <div className="text-[#6a6d70] text-[11px] mt-0.5">{row.plantDesc}</div>
          </div>
        )
      case 'invoiceNumber':
        return row.invoiceNumber
          ? <span className="inline-flex items-center px-2 py-0.5 bg-[#f0f4f8] border border-[#e5e5e5] text-[#32363a] rounded-md text-[11px] font-medium">{row.invoiceNumber}</span>
          : <span className="text-[#d9d9d9]">—</span>
      case 'asnNumber':
        return <span className="font-semibold text-[#0a6ed1] text-[12px]">{row.asnNumber}</span>
      case 'baseDocument':
        return (
          <div>
            <div className="font-medium text-[#32363a] text-[12px]">{row.baseDocument}</div>
            <div className="text-[#6a6d70] text-[11px] mt-0.5">{row.baseDocumentType}</div>
          </div>
        )
      case 'vendor':
        return (
          <div>
            <div className="font-medium text-[#32363a] text-[12px]">{row.vendorCode}</div>
            <div className="text-[#6a6d70] text-[11px] mt-0.5">{row.vendorName}</div>
          </div>
        )
      case 'asnStatus': return <StatusBadge value={row.asnStatus} />
      case 'grStatus':  return <StatusBadge value={row.grStatus} />
      case 'invStatus':
        return (
          <span className={`text-[11px] font-medium ${row.invStatus === 'Pending' ? 'text-[#b45309]' : 'text-[#107e3e]'}`}>
            {row.invStatus || '—'}
          </span>
        )
      case 'qty':
        return <span className="tabular-nums font-medium text-[#32363a] text-[12px]">{row.qty}</span>
      case 'invoicePdir':
        return (
          <button
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f5f6f7] text-[#f59e0b] transition-all"
            title="Attachment"
            onClick={e => e.stopPropagation()}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>
        )
      case 'gateEntryDT':
        return row.gateEntryDate
          ? <div><div className="text-[12px] text-[#32363a]">{row.gateEntryDate}</div><div className="text-[11px] text-[#6a6d70] mt-0.5">{row.gateEntryTime}</div></div>
          : <span className="text-[#d9d9d9]">—</span>
      case 'gateExitDT':
        return row.gateExitDate
          ? <div><div className="text-[12px] text-[#32363a]">{row.gateExitDate}</div><div className="text-[11px] text-[#6a6d70] mt-0.5">{row.gateExitTime}</div></div>
          : <span className="text-[#d9d9d9]">—</span>
      default:
        return row[col.key]
          ? <span className="text-[#32363a] text-[12px]">{row[col.key]}</span>
          : <span className="text-[#d9d9d9]">—</span>
    }
  }

  if (selectedRow) {
    return (
      <PageLayout>
        <AsnDetailPage row={selectedRow} onBack={() => setSelectedRow(null)} />
      </PageLayout>
    )
  }

  // ── shared input class ──
  const inputCls = "w-full h-9 pl-3 pr-2 text-[13px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all"
  const labelCls = "block text-[11px] font-medium text-[#6a6d70] mb-1.5 tracking-wide"

  return (
    <PageLayout>
      <style>{`
        @keyframes fadeIn  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes modalIn { from { opacity:0; transform:scale(0.95);     } to { opacity:1; transform:scale(1);     } }
        .anim-fade { animation: fadeIn 0.3s ease-out both; }
        .row-stagger > tr { animation: fadeIn 0.3s ease-out both; }
        .row-stagger > tr:nth-child(1) { animation-delay: 0.02s; }
        .row-stagger > tr:nth-child(2) { animation-delay: 0.05s; }
        .row-stagger > tr:nth-child(3) { animation-delay: 0.08s; }
        .row-stagger > tr:nth-child(4) { animation-delay: 0.11s; }
        .row-stagger > tr:nth-child(5) { animation-delay: 0.14s; }
        .row-stagger > tr:nth-child(6) { animation-delay: 0.17s; }
        .tbl-th { position: sticky; top: 0; z-index: 10; }
      `}</style>

      {vhModal && (
        <ValueHelpModal title={VH_TITLES[vhModal]} options={vhOptions} onSelect={handleVhSelect} onCancel={() => setVhModal(null)} />
      )}
      {exporting && (
        <ExportModal progress={exportProgress} total={exportTotal} onCancel={() => { exportCancelRef.current = true; setExporting(false) }} />
      )}

      <div className="bg-[#f5f6f7] min-h-[calc(100vh-104px)] flex flex-col">

        {/* ── ACTION BAR ── */}
        <div className="bg-white border-b border-[#e5e5e5] px-4 sm:px-6 lg:px-10 py-2.5 flex items-center justify-end gap-2 flex-shrink-0">
          <button
            onClick={handleGo} disabled={loading || !!dateError}
            className="flex items-center gap-1.5 px-4 h-8 text-[13px] font-medium text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            }
            Go
          </button>
          <button
            onClick={() => setFilterBarVisible(v => !v)}
            className="flex items-center gap-1.5 px-4 h-8 text-[13px] font-medium text-[#32363a] bg-white border border-[#d9d9d9] rounded-lg hover:bg-[#f5f6f7] transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/>
            </svg>
            {filterBarVisible ? 'Hide filters' : 'Show filters'}
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-4 h-8 text-[13px] font-medium text-[#cc1c14] bg-[#fce8e6] border border-[#fce8e6] rounded-lg hover:bg-[#fad6d3] transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            Clear
          </button>
        </div>

        {/* ── FILTER BAR ── */}
        {filterBarVisible && (
          <div className="bg-white border-b border-[#e5e5e5] px-4 sm:px-6 lg:px-10 pt-4 pb-5 flex-shrink-0 anim-fade">

            {/* Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-3">
              <div>
                <label className={labelCls}>ASN creation date from <span className="text-[#cc1c14]">*</span></label>
                <div className="relative">
                  <input type="date" value={asnDateFrom} onChange={e => setAsnDateFrom(e.target.value)} max={asnDateTo || undefined}
                    className={`${inputCls} ${dateError ? 'border-[#cc1c14] focus:ring-[#cc1c14]/20' : ''}`} />
                </div>
              </div>
              <div>
                <label className={labelCls}>ASN creation date to <span className="text-[#cc1c14]">*</span></label>
                <input type="date" value={asnDateTo} onChange={e => setAsnDateTo(e.target.value)} min={asnDateFrom || undefined}
                  className={`${inputCls} ${dateError ? 'border-[#cc1c14] focus:ring-[#cc1c14]/20' : ''}`} />
              </div>
              <div>
                <label className={labelCls}>Supplier</label>
                <VhInput placeholder="Select supplier" value={supplier} onOpen={() => openVh('supplier')} />
              </div>
              <div>
                <label className={labelCls}>Material</label>
                <VhInput placeholder="Select material" value={material} onOpen={() => openVh('material')} />
              </div>
              <div>
                <label className={labelCls}>Invoice number</label>
                <VhInput placeholder="Select invoice no." value={invoiceNo} onOpen={() => openVh('invoice')} />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              <div>
                <label className={labelCls}>Reference document</label>
                <VhInput placeholder="Select reference doc." value={refDoc} onOpen={() => openVh('refDoc')} />
              </div>
              <div>
                <label className={labelCls}>ASN number</label>
                <VhInput placeholder="Select ASN no." value={asnNo} onOpen={() => openVh('asn')} />
              </div>
              <div>
                <label className={labelCls}>Shipment number</label>
                <VhInput placeholder="Select shipment no." value={shipmentNo} onOpen={() => openVh('shipment')} />
              </div>
              <div>
                <label className={labelCls}>IBD number</label>
                <VhInput placeholder="Select IBD no." value={ibdNo} onOpen={() => openVh('ibd')} />
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <div className="relative">
                  <select value={status} onChange={e => setStatus(e.target.value)}
                    className={`${inputCls} pr-8 appearance-none cursor-pointer`}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || '(All)'}</option>)}
                  </select>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" className="absolute right-2.5 top-3.5 pointer-events-none">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
              </div>
            </div>

            {dateError && (
              <div className="mt-3 flex items-center gap-1.5 text-[12px] text-[#cc1c14] anim-fade">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                {dateError}
              </div>
            )}
          </div>
        )}

        {/* ── TABLE AREA ── */}
        <div className="flex-1 px-4 sm:px-6 lg:px-10 py-4">
          {!hasSearched && !loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-[#6a6d70] anim-fade">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-25">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <div className="text-[14px] font-medium text-[#32363a] mb-1">No report loaded</div>
              <div className="text-[13px]">Set filters and click <strong className="font-medium">Go</strong> to generate the report</div>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-[#6a6d70] anim-fade">
              <div className="w-7 h-7 border-2 border-[#e5e5e5] border-t-[#0a6ed1] rounded-full animate-spin" />
              <span className="text-[13px]">Fetching report…</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-2 px-4 py-3 bg-[#fce8e6] text-[#cc1c14] rounded-lg text-[13px]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                {error}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[#e5e5e5] bg-white overflow-hidden anim-fade">

              {/* Table toolbar — record count + download */}
              <div className="px-4 py-2.5 border-b border-[#e5e5e5] bg-[#fafbfc] flex items-center justify-between flex-shrink-0">
                <span className="text-[12px] text-[#6a6d70]">
                  <span className="font-medium text-[#32363a]">{rows.length}</span> record{rows.length !== 1 ? 's' : ''} found
                  {status && rawRows.length !== rows.length && (
                    <span className="ml-2 text-[#9ca3af]">(filtered from {rawRows.length} total)</span>
                  )}
                </span>
                <button
                  onClick={handleDownload} disabled={!rows.length || exporting}
                  className="flex items-center gap-1.5 px-3 h-7 text-[12px] font-medium text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {exporting
                    ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  }
                  {exporting ? 'Downloading…' : 'Download'}
                </button>
              </div>

              {/* ── STICKY HEADER TABLE ── */}
              <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
                <table className="w-full text-[12px] border-collapse" style={{ tableLayout: 'auto', whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr className="bg-[#fafbfc] border-b border-[#e5e5e5]">
                      {COLUMNS.map(c => (
                        <th
                          key={c.key}
                          className="tbl-th text-left font-medium py-3 px-3 text-[11px] text-[#6a6d70] tracking-wide border-b border-r border-[#e5e5e5] bg-[#fafbfc] last:border-r-0"
                        >
                          {c.label}
                        </th>
                      ))}
                      <th className="tbl-th py-3 px-2 border-b border-[#e5e5e5] bg-[#fafbfc] w-8" />
                    </tr>
                  </thead>
                  <tbody className="row-stagger">
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={COLUMNS.length + 1} className="py-14 text-center text-[13px] text-[#6a6d70]">No records found</td>
                      </tr>
                    ) : rows.map((row, idx) => (
                      <tr
                        key={`${row.asnNumber}-${idx}`}
                        onClick={() => setSelectedRow(row)}
                        className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#f0f7ff] cursor-pointer transition-colors duration-100 group"
                      >
                        {COLUMNS.map(col => (
                          <td key={col.key} className="py-2.5 px-3 border-r border-[#f0f0f0] align-middle last:border-r-0">
                            {renderCell(row, col)}
                          </td>
                        ))}
                        <td className="py-2.5 px-2 text-center align-middle">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                            className="text-[#0a6ed1] opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all inline">
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

        {/* ── FOOTER DOWNLOAD ── */}
        <div className="px-4 sm:px-6 lg:px-10 py-3 flex justify-end flex-shrink-0 border-t border-[#e5e5e5] bg-white">
          <button
            onClick={handleDownload} disabled={!rows.length || exporting}
            className="flex items-center gap-2 px-4 h-9 text-[13px] font-medium text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {exporting
              ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            }
            {exporting ? 'Downloading…' : 'Download'}
          </button>
        </div>

      </div>
    </PageLayout>
  )
}