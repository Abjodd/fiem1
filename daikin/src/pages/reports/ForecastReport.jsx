import { useState, useMemo, useRef, useEffect } from 'react'
import PageLayout from '../../layouts/PageLayout.jsx'
import { ForecastReportApi, toSapDate } from '../../services/ForecastReport.js'

// ═══════════════════════════════════════════════════════════════
// DATE HELPERS
// ═══════════════════════════════════════════════════════════════
const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const getExportFilename = () => {
  const d = new Date()
  return `forecast_report_${MONTHS_SHORT[d.getMonth()]}_${String(d.getDate()).padStart(2,'0')}.xlsx`
}

// ═══════════════════════════════════════════════════════════════
// VALUE HELP MODAL
// ═══════════════════════════════════════════════════════════════
function ValueHelpModal({ title, options, onSelect, onCancel, loading }) {
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
      <div className="bg-white rounded-xl shadow-2xl w-[360px] max-w-[95vw] overflow-hidden flex flex-col" style={{ maxHeight: '70vh', animation: 'modalIn 0.2s ease-out both' }}>
        <div className="px-5 py-4 border-b border-[#e5e5e5]"><h3 className="text-[16px] font-semibold text-[#32363a]">{title}</h3></div>
        <div className="px-4 py-3 border-b border-[#e5e5e5]"><div className="relative">
          <input autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search"
            className="w-full h-9 pl-3 pr-9 text-[14px] border border-[#d9d9d9] rounded-lg focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-3 top-2.5 text-[#6a6d70]"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        </div></div>
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-[#6a6d70] text-[13px]">
              <div className="w-5 h-5 border-2 border-[#e5e5e5] border-t-[#0a6ed1] rounded-full animate-spin mr-2" />Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-[#6a6d70]">No results found</div>
          ) : filtered.map(opt => (
            <button key={opt.code} onClick={() => onSelect(opt)} className="w-full text-left px-5 py-3 border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#ebf5ff] transition-colors">
              <div className="text-[14px] font-semibold text-[#0a6ed1]">{opt.code}</div>
              {opt.label && <div className="text-[12px] text-[#6a6d70] mt-0.5">{opt.label}</div>}
            </button>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-[#e5e5e5] flex justify-end">
          <button onClick={onCancel} className="px-5 h-9 text-[14px] font-semibold text-[#0a6ed1] hover:bg-[#ebf5ff] rounded-lg transition-all">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// EXPORT PROGRESS MODAL
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
          {pct >= 100 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#107e3e" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M5 13l4 4L19 7"/></svg>}
        </div>
        <div className="flex justify-end">
          <button onClick={onCancel} className="px-5 h-9 text-[14px] font-semibold text-[#6a6d70] hover:bg-[#f5f6f7] rounded-lg transition-all">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// VALUE HELP INPUT
// ═══════════════════════════════════════════════════════════════
function ValueHelpInput({ placeholder, value, onOpen, onClear }) {
  return (
    <div className="flex h-10 border border-[#d9d9d9] rounded-lg overflow-hidden bg-white focus-within:border-[#0a6ed1] focus-within:ring-2 focus-within:ring-[#0a6ed1]/20 transition-all">
      <div className="flex-1 flex items-center pl-3 pr-2 text-[14px] text-[#32363a] truncate min-w-0">
        {value ? <span className="truncate font-medium">{value}</span> : <span className="text-[#94a3b8]">{placeholder}</span>}
      </div>
      {value && (
        <button type="button" onClick={onClear} className="flex-shrink-0 w-7 flex items-center justify-center text-[#6a6d70] hover:text-[#cc1c14] transition-all">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      )}
      <button type="button" onClick={onOpen} title="Open value help"
        className="flex-shrink-0 w-9 flex items-center justify-center border-l border-[#e5e5e5] text-[#6a6d70] hover:text-[#0a6ed1] hover:bg-[#f0f7ff] transition-all">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TOGGLE SWITCH
// ═══════════════════════════════════════════════════════════════
function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`relative inline-flex w-14 h-7 items-center rounded-full transition-colors duration-200 focus:outline-none ${value ? 'bg-[#0a6ed1]' : 'bg-[#d9d9d9]'}`}>
      <span className={`inline-block w-6 h-6 rounded-full bg-white shadow transition-transform duration-200 ${value ? 'translate-x-7' : 'translate-x-1'}`} />
      <span className={`absolute text-[10px] font-bold ${value ? 'left-2 text-white' : 'right-1.5 text-[#6a6d70]'}`}>{value ? 'YES' : 'NO'}</span>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ForecastReport() {
  const [date, setDate] = useState(todayIso())
  const [partNo, setPartNo] = useState('')
  const [saNo, setSaNo] = useState('')

  const [filterBarVisible, setFilterBarVisible] = useState(true)
  const [vhModal, setVhModal] = useState(null)
  const [vhOptions, setVhOptions] = useState([])
  const [vhLoading, setVhLoading] = useState(false)

  const [showSupply, setShowSupply] = useState(true)
  const [viewMode, setViewMode] = useState('Daily') // 'Monthly' | 'Daily'

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState(null)

  const [exporting, setExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportTotal, setExportTotal] = useState(0)
  const exportCancelRef = useRef(false)

  // ── Period columns from first row's data ──
  const periods = useMemo(() => {
    if (rows.length === 0) return []
    return rows[0].periods.map(p => ({
      key: p.startdate,
      label: p.startdate,
      index: p.index,
    }))
  }, [rows])

  // ── Load default on mount ──
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ForecastReportApi.fetchDefaultReport('DSAL')
      .then(data => { if (!cancelled) { setRows(data); setHasSearched(true) } })
      .catch(err => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // ── Open value help ──
  const openVh = async (field) => {
    setVhLoading(true); setVhModal(field); setVhOptions([])
    try {
      const inputDate = toSapDate(date)
      const opts = field === 'part'
        ? await ForecastReportApi.fetchMaterials({ inputDate, matnr: '', ebeln: '', supplier: '' })
        : await ForecastReportApi.fetchSaNumbers({ inputDate, matnr: '', ebeln: '', supplier: '' })
      setVhOptions(opts)
    } catch { setVhOptions([]) }
    setVhLoading(false)
  }

  const handleVhSelect = (opt) => {
    if (vhModal === 'part') setPartNo(opt.code)
    else setSaNo(opt.code)
    setVhModal(null)
  }

  // ── Go ──
  const handleGo = async () => {
    setLoading(true); setError(null)
    try {
      const data = await ForecastReportApi.fetchReport({
        inputDate: toSapDate(date),
        matnr: partNo,
        ebeln: saNo,
        supplier: '',
        bukrs: 'DSAL',
        mdIndicator: viewMode === 'Daily' ? 'D' : 'M',
      })
      setRows(data); setHasSearched(true)
    } catch (err) { setError(err.message || 'Failed to fetch') }
    finally { setLoading(false) }
  }

  const handleClear = () => {
    setDate(todayIso()); setPartNo(''); setSaNo('')
    setRows([]); setHasSearched(false); setError(null)
  }

  // ── Export ──
  const handleExport = async () => {
    if (rows.length === 0) return
    setExporting(true); exportCancelRef.current = false
    setExportTotal(rows.length); setExportProgress(0)
    try {
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')
      const fixedHeaders = ['S No.', 'SA No.', 'Line Item', 'Part No.', 'Part Name', 'Plant', 'Cum. Backlog Qty', 'GRN Qty']
      const periodHeaders = periods.flatMap(p =>
        showSupply ? [`${p.label} Schedule`, `${p.label} Supply`] : [`${p.label} Schedule`]
      )
      const headers = [...fixedHeaders, ...periodHeaders]
      const dataRows = []
      for (let i = 0; i < rows.length; i++) {
        if (exportCancelRef.current) break
        const r = rows[i]
        const fixed = [r.srNo, r.ebeln, r.ebelp, r.matnr, r.maktx, r.werks, r.cumBacklogQty, r.grnQty]
        const pCells = r.periods.flatMap(p => showSupply ? [p.schedule, p.supply] : [p.schedule])
        dataRows.push([...fixed, ...pCells])
        setExportProgress(i + 1)
        await new Promise(res => setTimeout(res, 5))
      }
      if (!exportCancelRef.current) {
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows])
        ws['!cols'] = headers.map(() => ({ wch: 16 }))
        XLSX.utils.book_append_sheet(wb, ws, 'Forecast Report')
        XLSX.writeFile(wb, getExportFilename())
        await new Promise(res => setTimeout(res, 600))
      }
    } catch (err) { console.error('Export failed:', err) }
    finally { setExporting(false); setExportProgress(0) }
  }

  return (
    <PageLayout>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideInUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}
        .anim-fade{animation:fadeIn .35s ease-out both}
        .anim-slide-up{animation:slideInUp .4s ease-out both}
        .row-stagger>*{animation:fadeIn .35s ease-out both}
        .row-stagger>*:nth-child(1){animation-delay:.02s}.row-stagger>*:nth-child(2){animation-delay:.05s}
        .row-stagger>*:nth-child(3){animation-delay:.08s}.row-stagger>*:nth-child(4){animation-delay:.11s}
        .row-stagger>*:nth-child(5){animation-delay:.14s}
      `}</style>

      {vhModal === 'part' && <ValueHelpModal title="Part No." options={vhOptions} onSelect={handleVhSelect} onCancel={() => setVhModal(null)} loading={vhLoading} />}
      {vhModal === 'sa' && <ValueHelpModal title="SA No." options={vhOptions} onSelect={handleVhSelect} onCancel={() => setVhModal(null)} loading={vhLoading} />}
      {exporting && <ExportModal progress={exportProgress} total={exportTotal} onCancel={() => { exportCancelRef.current = true; setExporting(false) }} />}

      <div className="bg-[#f5f6f7] min-h-[calc(100vh-104px)]">
        <main className="flex flex-col bg-white" style={{ minHeight: 'calc(100vh - 220px)' }}>

          {/* Meta header */}
          <div className="px-4 sm:px-6 lg:px-10 pt-4 pb-2 bg-white border-b border-[#e5e5e5] flex-shrink-0">
            <div className="flex flex-wrap gap-x-8 gap-y-1 text-[13px] text-[#6a6d70]">
              <span className="hidden sm:inline">Supplier Name: <strong className="text-[#32363a]">{rows[0]?.supplierName || '—'}</strong></span>
              <span className="hidden lg:inline">Plant: <strong className="text-[#32363a]">{rows[0]?.werks || '—'}</strong></span>
            </div>
          </div>

          {/* Title + actions */}
          <div className="px-4 sm:px-6 lg:px-10 pt-4 pb-3 flex items-center justify-between flex-shrink-0">
            <h2 className="text-[20px] sm:text-[22px] font-bold text-[#32363a] tracking-tight">Forecast Report</h2>
            <div className="flex items-center gap-2">
              <button onClick={handleGo} disabled={loading}
                className="flex items-center gap-1.5 px-5 h-9 text-[14px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm disabled:opacity-50">
                {loading && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}Go
              </button>
              <button onClick={() => setFilterBarVisible(v => !v)} className="px-4 h-9 text-[14px] font-semibold text-[#32363a] bg-white border border-[#d9d9d9] rounded-lg hover:bg-[#f5f6f7] transition-all whitespace-nowrap">
                {filterBarVisible ? 'Hide Filter Bar' : 'Show Filter Bar'}
              </button>
              <button onClick={handleClear} className="px-4 h-9 text-[14px] font-semibold text-[#cc1c14] bg-[#fce8e6] border border-[#fce8e6] rounded-lg hover:bg-[#fad6d3] transition-all">Clear</button>
            </div>
          </div>

          {/* Filter bar */}
          {filterBarVisible && (
            <div className="px-4 sm:px-6 lg:px-10 pb-3 flex-shrink-0 anim-fade">
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-6 items-start">
                <div>
                  <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">Date:</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    className="h-10 pl-3 pr-9 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all w-[160px]" />
                </div>
                <div>
                  <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">Part No.:</label>
                  <div className="w-[180px]"><ValueHelpInput placeholder="Select Part" value={partNo} onOpen={() => openVh('part')} onClear={() => setPartNo('')} /></div>
                </div>
                <div>
                  <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">SA No.:</label>
                  <div className="w-[180px]"><ValueHelpInput placeholder="Select SA" value={saNo} onOpen={() => openVh('sa')} onClear={() => setSaNo('')} /></div>
                </div>
              </div>
            </div>
          )}

          {/* Table controls */}
          <div className="px-4 sm:px-6 lg:px-10 py-2 flex items-center justify-between gap-3 flex-shrink-0 border-t border-[#e5e5e5]">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[#6a6d70] font-medium">Show Supply</span>
                <Toggle value={showSupply} onChange={setShowSupply} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[#6a6d70] font-medium">View</span>
                <div className="relative flex h-8 bg-[#f0f0f0] rounded-lg p-0.5">
                  <div className="absolute top-0.5 bottom-0.5 rounded-md bg-white shadow-sm transition-all duration-250 ease-out"
                    style={{ width: 'calc(50% - 2px)', left: viewMode === 'Daily' ? '2px' : 'calc(50%)' }} />
                  {['Daily', 'Monthly'].map(m => (
                    <button key={m} onClick={() => setViewMode(m)}
                      className={`relative z-10 px-4 text-[12px] font-semibold rounded-md transition-colors duration-200 ${viewMode === m ? 'text-[#0a6ed1]' : 'text-[#6a6d70] hover:text-[#32363a]'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={handleExport} disabled={rows.length === 0 || exporting}
              className="flex items-center gap-2 px-4 h-8 text-[13px] font-semibold text-[#32363a] bg-white border border-[#d9d9d9] rounded-lg hover:bg-[#f5f6f7] hover:border-[#0a6ed1] hover:text-[#0a6ed1] transition-all disabled:opacity-40 whitespace-nowrap">
              Export
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
            </button>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-hidden flex flex-col px-4 sm:px-6 lg:px-10 pb-6 pt-2">
            {!hasSearched && !loading ? (
              <div className="flex-1 flex items-center justify-center anim-fade">
                <div className="text-center text-[#6a6d70]">
                  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-25"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9M3 15h18"/></svg>
                  <div className="text-[15px] font-semibold mb-1">No report loaded</div>
                  <div className="text-[13px]">Set filters and click <strong>Go</strong></div>
                </div>
              </div>
            ) : loading ? (
              <div className="flex-1 flex items-center justify-center anim-fade">
                <div className="flex flex-col items-center gap-3 text-[#6a6d70]">
                  <div className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#0a6ed1] rounded-full animate-spin" />
                  <span className="text-[14px]">Loading…</span>
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
              <div className="rounded-xl border border-[#e5e5e5] shadow-sm overflow-hidden flex flex-col flex-1 anim-slide-up">
                <div className="overflow-auto flex-1 min-h-0">
                  <table className="text-[13px] border-collapse" style={{ tableLayout: 'fixed', minWidth: `${700 + periods.length * (showSupply ? 200 : 110)}px` }}>
                    <colgroup>
                      <col style={{ width: '50px' }} />
                      <col style={{ width: '115px' }} />
                      <col style={{ width: '55px' }} />
                      <col style={{ width: '150px' }} />
                      <col style={{ width: '55px' }} />
                      <col style={{ width: '100px' }} />
                      <col style={{ width: '80px' }} />
                      {periods.map(p => showSupply
                        ? [<col key={p.key+'s'} style={{ width: '100px' }} />, <col key={p.key+'u'} style={{ width: '100px' }} />]
                        : <col key={p.key+'s'} style={{ width: '110px' }} />
                      )}
                    </colgroup>
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-[#f5f6f7] text-[#6a6d70]">
                        <th rowSpan={2} className="text-center font-semibold py-3 px-2 text-[11px] uppercase tracking-wider border-b border-r border-[#e5e5e5] bg-[#f5f6f7]">S.No.</th>
                        <th rowSpan={2} className="text-left font-semibold py-3 px-3 text-[11px] uppercase tracking-wider border-b border-r border-[#e5e5e5] bg-[#f5f6f7]">SA No.</th>
                        <th rowSpan={2} className="text-center font-semibold py-3 px-2 text-[11px] uppercase tracking-wider border-b border-r border-[#e5e5e5] bg-[#f5f6f7]">Item</th>
                        <th rowSpan={2} className="text-left font-semibold py-3 px-3 text-[11px] uppercase tracking-wider border-b border-r border-[#e5e5e5] bg-[#f5f6f7]">Part</th>
                        <th rowSpan={2} className="text-center font-semibold py-3 px-2 text-[11px] uppercase tracking-wider border-b border-r border-[#e5e5e5] bg-[#f5f6f7]">Plant</th>
                        <th rowSpan={2} className="text-right font-semibold py-3 px-3 text-[11px] uppercase tracking-wider border-b border-r border-[#e5e5e5] bg-[#f5f6f7] whitespace-nowrap">Cum.<br/>Backlog</th>
                        <th rowSpan={2} className="text-right font-semibold py-3 px-3 text-[11px] uppercase tracking-wider border-b border-r border-[#e5e5e5] bg-[#f5f6f7]">GRN Qty</th>
                        {periods.map(p => (
                          <th key={p.key} colSpan={showSupply ? 2 : 1}
                            className="text-center font-semibold py-3 px-2 text-[11px] border-b border-r border-[#e5e5e5] bg-[#ebf5ff] text-[#0a6ed1] whitespace-nowrap">
                            {p.label}
                          </th>
                        ))}
                      </tr>
                      <tr className="bg-[#fafbfc] text-[#6a6d70]">
                        {periods.map(p => showSupply ? [
                          <th key={p.key+'s'} className="text-center font-semibold py-2 px-2 text-[11px] border-b border-r border-[#e5e5e5]">Schedule</th>,
                          <th key={p.key+'u'} className="text-center font-semibold py-2 px-2 text-[11px] border-b border-r border-[#e5e5e5]">Supply</th>,
                        ] : [
                          <th key={p.key+'s'} className="text-center font-semibold py-2 px-2 text-[11px] border-b border-r border-[#e5e5e5]">Schedule</th>,
                        ])}
                      </tr>
                    </thead>
                    <tbody className="row-stagger">
                      {rows.length === 0 ? (
                        <tr><td colSpan={7 + periods.length * (showSupply ? 2 : 1)} className="py-12 text-center text-[14px] text-[#6a6d70]">No records found</td></tr>
                      ) : rows.map((row, idx) => (
                        <tr key={`${row.ebeln}-${row.ebelp}-${idx}`} className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc] transition-colors duration-100">
                          <td className="py-3 px-2 text-center text-[#6a6d70] font-semibold border-r border-[#f0f0f0]">{row.srNo || idx + 1}</td>
                          <td className="py-3 px-3 text-[#0a6ed1] font-semibold border-r border-[#f0f0f0] whitespace-nowrap">{row.ebeln}</td>
                          <td className="py-3 px-2 text-center text-[#32363a] border-r border-[#f0f0f0]">{row.ebelp}</td>
                          <td className="py-3 px-3 border-r border-[#f0f0f0]">
                            <div className="font-semibold text-[#0a6ed1] text-[12px]">{row.matnr || '—'}</div>
                            <div className="text-[#6a6d70] text-[11px] mt-0.5 truncate">{row.maktx}</div>
                          </td>
                          <td className="py-3 px-2 text-center text-[#32363a] font-semibold border-r border-[#f0f0f0]">{row.werks}</td>
                          <td className="py-3 px-3 text-right border-r border-[#f0f0f0]">
                            <span className={row.cumBacklogQty > 0 ? 'font-bold text-[#b45309]' : 'text-[#6a6d70]'}>{row.cumBacklogQty.toFixed(3)}</span>
                          </td>
                          <td className="py-3 px-3 text-right border-r border-[#f0f0f0] text-[#32363a] tabular-nums">{row.grnQty.toFixed(3)}</td>
                          {row.periods.map(p => showSupply ? [
                            <td key={p.index+'s'} className="py-3 px-2 text-center border-r border-[#f0f0f0]">
                              <span className={`tabular-nums ${p.schedule > 0 ? 'font-semibold text-[#32363a]' : 'text-[#d9d9d9]'}`}>{p.schedule.toFixed(3)}</span>
                            </td>,
                            <td key={p.index+'u'} className="py-3 px-2 text-center border-r border-[#f0f0f0]">
                              <span className={`tabular-nums ${p.supply > 0 ? 'font-semibold text-[#32363a]' : 'text-[#d9d9d9]'}`}>{p.supply.toFixed(3)}</span>
                            </td>,
                          ] : [
                            <td key={p.index+'s'} className="py-3 px-2 text-center border-r border-[#f0f0f0]">
                              <span className={`tabular-nums ${p.schedule > 0 ? 'font-semibold text-[#32363a]' : 'text-[#d9d9d9]'}`}>{p.schedule.toFixed(3)}</span>
                            </td>,
                          ])}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

        </main>
      </div>
    </PageLayout>
  )
}