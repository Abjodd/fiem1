import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import PageLayout from '../../layouts/PageLayout.jsx'
import { useNavigate } from 'react-router-dom'

// ═══════════════════════════════════════════════════════════════
// DUMMY DATA
// ═══════════════════════════════════════════════════════════════
const MOCK_ROWS = [
  { saNo: '5501000113', item: '10',  partNo: '1P438820-1 B', partName: 'EL.COMPO.BOARD ASSY', plant: 'NMR', cumulativeBacklogQty: 0 },
  { saNo: '5501000113', item: '20',  partNo: '1P528979-2 K', partName: 'BOTTOM FRAME',         plant: 'NMR', cumulativeBacklogQty: 325 },
  { saNo: '5501000113', item: '30',  partNo: '1P640837-1 C', partName: 'EL.COMPO.BOARD ASSY', plant: 'NMR', cumulativeBacklogQty: 0 },
  { saNo: '5501000113', item: '40',  partNo: '1P640838-1 A', partName: 'EL.COMPO.BOARD ASSY', plant: 'NMR', cumulativeBacklogQty: 0 },
  { saNo: '5501000113', item: '50',  partNo: '1P772713-9 D', partName: 'FRONT GRILLE',         plant: 'NMR', cumulativeBacklogQty: 0 },
  { saNo: '5501000113', item: '60',  partNo: '2P438825-1 D', partName: 'INDICATION LAMP COVER',plant: 'NMR', cumulativeBacklogQty: 0 },
  { saNo: '5501000113', item: '70',  partNo: '2P640792-1',   partName: 'DRIP PROOF COVER',     plant: 'NMR', cumulativeBacklogQty: 0 },
  { saNo: '5501000113', item: '80',  partNo: '3P487615-1',   partName: 'FLARE CAP PACKING',    plant: 'NMR', cumulativeBacklogQty: 0 },
  { saNo: '5501000113', item: '90',  partNo: '3P487615-2',   partName: 'FLARE CAP PACKING',    plant: 'NMR', cumulativeBacklogQty: 0 },
  { saNo: '5501000113', item: '100', partNo: '3P487615-3',   partName: 'FLARE CAP PACKING',    plant: 'NMR', cumulativeBacklogQty: 0 },
  { saNo: '5501000178', item: '10',  partNo: '1P438820-1 B', partName: 'EL.COMPO.BOARD ASSY', plant: 'NMR', cumulativeBacklogQty: 0 },
  { saNo: '5501000178', item: '20',  partNo: '1P528979-2',   partName: 'BOTTOM FRAME ASSY',    plant: 'NMR', cumulativeBacklogQty: 0 },
  { saNo: '5501000240', item: '10',  partNo: '1P640838-1 A', partName: 'EL.COMPO.BOARD ASSY', plant: 'NMR', cumulativeBacklogQty: 0 },
  { saNo: '5501000391', item: '10',  partNo: '3P4876',        partName: 'FLARE CAP PACKING',   plant: 'NMR', cumulativeBacklogQty: 0 },
]

// Mock schedule/supply data per row per period (all zeros for now)
const getMockPeriodValue = () => ({ schedule: 0, supply: 0 })

// Value-help options (in prod fetched from backend)
const VALUE_HELP_PARTS = [
  { code: '1P438820-1 B', label: 'EL.COMPO.BOARD ASSY' },
  { code: '1P528979-2 K', label: 'BOTTOM FRAME' },
  { code: '1P640837-1 C', label: 'EL.COMPO.BOARD ASSY' },
  { code: '1P640838-1 A', label: 'EL.COMPO.BOARD ASSY' },
  { code: '1P772713-9 D', label: 'FRONT GRILLE' },
  { code: '2P438825-1 D', label: 'INDICATION LAMP COVER' },
  { code: '2P640792-1',   label: 'DRIP PROOF COVER' },
  { code: '3P487615-1',   label: 'FLARE CAP PACKING' },
  { code: '3P487615-2',   label: 'FLARE CAP PACKING' },
  { code: '3P487615-3',   label: 'FLARE CAP PACKING' },
]

const VALUE_HELP_SA = [
  { code: '5501000113', label: '' },
  { code: '5501000178', label: '' },
  { code: '5501000240', label: '' },
  { code: '5501000391', label: '' },
]

// ═══════════════════════════════════════════════════════════════
// API STRUCTURE — for future backend integration
// ═══════════════════════════════════════════════════════════════
const API_BASE_URL = '/api/v1'
const USE_MOCK = true

const ForecastReportApi = {
  // Fetch forecast report data
  async fetchReport({ date = '', partNo = '', saNo = '', showSupply = true, viewMode = 'Monthly' } = {}) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 400))
      let rows = [...MOCK_ROWS]
      if (partNo) rows = rows.filter(r => r.partNo.toLowerCase().includes(partNo.toLowerCase()))
      if (saNo)   rows = rows.filter(r => r.saNo.includes(saNo))
      return rows
    }
    const params = new URLSearchParams()
    if (date)     params.set('date', date)
    if (partNo)   params.set('partNo', partNo)
    if (saNo)     params.set('saNo', saNo)
    params.set('showSupply', showSupply)
    params.set('viewMode', viewMode)
    const res = await fetch(`${API_BASE_URL}/forecast-report?${params}`)
    if (!res.ok) throw new Error('Failed to fetch forecast report')
    return res.json()
  },

  // Value-help: fetch parts list
  async fetchPartOptions(query = '') {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 80))
      if (!query) return VALUE_HELP_PARTS
      const q = query.toLowerCase()
      return VALUE_HELP_PARTS.filter(o => o.code.toLowerCase().includes(q) || o.label.toLowerCase().includes(q))
    }
    const res = await fetch(`${API_BASE_URL}/value-help/parts?q=${encodeURIComponent(query)}`)
    if (!res.ok) throw new Error('Failed to fetch parts')
    return res.json()
  },

  // Value-help: fetch SA numbers
  async fetchSaOptions(query = '') {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 80))
      if (!query) return VALUE_HELP_SA
      const q = query.toLowerCase()
      return VALUE_HELP_SA.filter(o => o.code.toLowerCase().includes(q))
    }
    const res = await fetch(`${API_BASE_URL}/value-help/sa-numbers?q=${encodeURIComponent(query)}`)
    if (!res.ok) throw new Error('Failed to fetch SA numbers')
    return res.json()
  },
}

// ═══════════════════════════════════════════════════════════════
// DATE HELPERS
// ═══════════════════════════════════════════════════════════════
const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// Generate monthly period columns starting from given date, count months
const getMonthlyPeriods = (fromIso, count = 6) => {
  const base = new Date(fromIso)
  const periods = []
  for (let i = 0; i < count; i++) {
    const d = new Date(base.getFullYear(), base.getMonth() + i, 1)
    periods.push({
      key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,
      label: `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`,
    })
  }
  return periods
}

// Generate daily period columns starting from given date, count days
const getDailyPeriods = (fromIso, count = 60) => {
  const base = new Date(fromIso)
  const periods = []
  for (let i = 0; i < count; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    const dd = String(d.getDate()).padStart(2,'0')
    const mm = String(d.getMonth()+1).padStart(2,'0')
    const yyyy = d.getFullYear()
    periods.push({
      key: `${yyyy}-${mm}-${dd}`,
      label: `${dd}.${mm}.${yyyy}`,
    })
  }
  return periods
}

// Filename: forecast_report_May_22.xlsx
const getExportFilename = () => {
  const d = new Date()
  return `forecast_report_${MONTHS_SHORT[d.getMonth()]}_${String(d.getDate()).padStart(2,'0')}.xlsx`
}

// ═══════════════════════════════════════════════════════════════
// VALUE HELP MODAL COMPONENT
// SAP-style: title + search + list + Cancel
// ═══════════════════════════════════════════════════════════════
function ValueHelpModal({ title, options, onSelect, onCancel }) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    if (!search) return options
    const q = search.toLowerCase()
    return options.filter(o => o.code.toLowerCase().includes(q) || (o.label && o.label.toLowerCase().includes(q)))
  }, [options, search])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div
        className="bg-white rounded-xl shadow-2xl w-[360px] max-w-[95vw] overflow-hidden flex flex-col"
        style={{ maxHeight: '70vh', animation: 'modalIn 0.2s ease-out both' }}
      >
        {/* Title */}
        <div className="px-5 py-4 border-b border-[#e5e5e5]">
          <h3 className="text-[16px] font-semibold text-[#32363a]">{title}</h3>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-[#e5e5e5]">
          <div className="relative">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full h-9 pl-3 pr-9 text-[14px] border border-[#d9d9d9] rounded-lg focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all"
            />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-3 top-2.5 text-[#6a6d70]">
              <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </div>
        </div>

        {/* Options list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-[#6a6d70]">No results found</div>
          ) : (
            filtered.map(opt => (
              <button
                key={opt.code}
                onClick={() => onSelect(opt)}
                className="w-full text-left px-5 py-3 border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#ebf5ff] transition-colors"
              >
                <div className="text-[14px] font-semibold text-[#0a6ed1]">{opt.code}</div>
                {opt.label && <div className="text-[12px] text-[#6a6d70] mt-0.5">{opt.label}</div>}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#e5e5e5] flex justify-end">
          <button
            onClick={onCancel}
            className="px-5 h-9 text-[14px] font-semibold text-[#0a6ed1] hover:bg-[#ebf5ff] rounded-lg transition-all"
          >
            Cancel
          </button>
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
      <div className="bg-white rounded-xl shadow-2xl w-[440px] max-w-[95vw] p-6"
        style={{ animation: 'modalIn 0.2s ease-out both' }}>
        <h3 className="text-[16px] font-semibold text-[#32363a] mb-4">Export Document</h3>
        <p className="text-[14px] text-[#6a6d70] mb-4">Generating file…</p>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[13px] text-[#32363a] font-semibold tabular-nums min-w-[60px]">
            {progress} / {total}
          </span>
          <div className="flex-1 h-3 bg-[#f0f0f0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#107e3e] rounded-full transition-all duration-200"
              style={{ width: `${pct}%` }}
            />
          </div>
          {pct >= 100 && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#107e3e" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><path d="M5 13l4 4L19 7"/>
            </svg>
          )}
        </div>
        <div className="flex justify-end">
          <button
            onClick={onCancel}
            className="px-5 h-9 text-[14px] font-semibold text-[#6a6d70] hover:bg-[#f5f6f7] rounded-lg transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// VALUE HELP INPUT FIELD
// ═══════════════════════════════════════════════════════════════
function ValueHelpInput({ placeholder, value, onOpen }) {
  return (
    <div className="flex h-10 border border-[#d9d9d9] rounded-lg overflow-hidden bg-white focus-within:border-[#0a6ed1] focus-within:ring-2 focus-within:ring-[#0a6ed1]/20 transition-all">
      <div className="flex-1 flex items-center pl-3 pr-2 text-[14px] text-[#32363a] truncate min-w-0">
        {value ? (
          <span className="truncate font-medium">{value}</span>
        ) : (
          <span className="text-[#94a3b8]">{placeholder}</span>
        )}
      </div>
      <button
        type="button"
        onClick={onOpen}
        title="Open value help"
        className="flex-shrink-0 w-9 flex items-center justify-center border-l border-[#e5e5e5] text-[#6a6d70] hover:text-[#0a6ed1] hover:bg-[#f0f7ff] transition-all"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TOGGLE SWITCH COMPONENT
// ═══════════════════════════════════════════════════════════════
function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative inline-flex w-14 h-7 items-center rounded-full transition-colors duration-200 focus:outline-none ${value ? 'bg-[#0a6ed1]' : 'bg-[#d9d9d9]'}`}
    >
      <span
        className={`inline-block w-6 h-6 rounded-full bg-white shadow transition-transform duration-200 ${value ? 'translate-x-7' : 'translate-x-1'}`}
      />
      <span className={`absolute text-[10px] font-bold ${value ? 'left-2 text-white' : 'right-1.5 text-[#6a6d70]'}`}>
        {value ? 'YES' : 'NO'}
      </span>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ForecastReport() {
  // ── Filter state ──
  const [date,   setDate]   = useState(todayIso())
  const [partNo, setPartNo] = useState('')
  const [saNo,   setSaNo]   = useState('')
  const vendor = 'The Supreme Industries Ltd' // read-only, comes from session/profile

  // ── Filter bar visibility ──
  const [filterBarVisible, setFilterBarVisible] = useState(true)

  // ── Value help modal state ──
  const [vhModal, setVhModal] = useState(null) // null | 'part' | 'sa'
  const [vhOptions, setVhOptions] = useState([])
  const [vhLoading, setVhLoading] = useState(false)

  // ── Table controls ──
  const [showSupply, setShowSupply] = useState(true)
  const [viewMode, setViewMode]     = useState('Monthly') // 'Monthly' | 'Daily'

  // ── Data state ──
  const [rows, setRows]             = useState([])
  const [loading, setLoading]       = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError]           = useState(null)

  // ── Export state ──
  const [exporting, setExporting]       = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportTotal, setExportTotal]   = useState(0)
  const exportCancelRef = useRef(false)

  // ── Compute period columns ──
  const periods = useMemo(() => {
    if (viewMode === 'Monthly') return getMonthlyPeriods(date, 6)
    return getDailyPeriods(date, 60)
  }, [date, viewMode])

  // ── Open value help ──
  const openVh = async (field) => {
    setVhLoading(true)
    setVhModal(field)
    setVhOptions([])
    try {
      const opts = field === 'part'
        ? await ForecastReportApi.fetchPartOptions('')
        : await ForecastReportApi.fetchSaOptions('')
      setVhOptions(opts)
    } catch { setVhOptions([]) }
    setVhLoading(false)
  }

  const handleVhSelect = (opt) => {
    if (vhModal === 'part') setPartNo(opt.code)
    else setSaNo(opt.code)
    setVhModal(null)
  }

  // ── Go / fetch ──
  const handleGo = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await ForecastReportApi.fetchReport({ date, partNo, saNo, showSupply, viewMode })
      setRows(data)
      setHasSearched(true)
    } catch (err) {
      setError(err.message || 'Failed to fetch report')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setDate(todayIso())
    setPartNo('')
    setSaNo('')
    setRows([])
    setHasSearched(false)
    setError(null)
  }

  // ── Export to XLSX ──
  const handleExport = async () => {
    if (rows.length === 0) return
    setExporting(true)
    exportCancelRef.current = false

    const total = rows.length
    setExportTotal(total)
    setExportProgress(0)

    try {
      // Dynamically import SheetJS
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')

      // Build header row
      const fixedHeaders = ['S No.', 'SA No.', 'Line Item', 'Part No.', 'Part Name', 'Plant', 'Cumulative Backlog Qty']
      const periodHeaders = periods.flatMap(p =>
        showSupply && viewMode === 'Monthly'
          ? [`${p.label} Schedule`, `${p.label} Supply`]
          : [`${p.label} Schedule`]
      )
      const headers = [...fixedHeaders, ...periodHeaders]

      // Build data rows with progress
      const dataRows = []
      for (let i = 0; i < rows.length; i++) {
        if (exportCancelRef.current) break
        const row = rows[i]
        const fixed = [i + 1, row.saNo, row.item, row.partNo, row.partName, row.plant, row.cumulativeBacklogQty]
        const periodCells = periods.flatMap(p => {
          const v = getMockPeriodValue()
          return showSupply && viewMode === 'Monthly' ? [v.schedule, v.supply] : [v.schedule]
        })
        dataRows.push([...fixed, ...periodCells])
        setExportProgress(i + 1)
        // Yield to UI
        await new Promise(r => setTimeout(r, 8))
      }

      if (exportCancelRef.current) return

      // Create workbook
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows])

      // Style header row (bold)
      const range = XLSX.utils.decode_range(ws['!ref'])
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellAddr = XLSX.utils.encode_cell({ r: 0, c: C })
        if (!ws[cellAddr]) continue
        ws[cellAddr].s = { font: { bold: true }, fill: { fgColor: { rgb: 'DDEEFF' } } }
      }

      // Col widths
      ws['!cols'] = [
        { wch: 6 }, { wch: 14 }, { wch: 10 }, { wch: 16 }, { wch: 28 }, { wch: 6 }, { wch: 22 },
        ...periods.flatMap(() => showSupply && viewMode === 'Monthly' ? [{ wch: 22 }, { wch: 18 }] : [{ wch: 22 }])
      ]

      XLSX.utils.book_append_sheet(wb, ws, 'SAPUI5 Export')
      XLSX.writeFile(wb, getExportFilename())

      // Small delay so user sees 100%
      await new Promise(r => setTimeout(r, 600))
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
      setExportProgress(0)
    }
  }

  // ── Collapse/expand filter bar toggle icon ──
  const CollapseIcon = () => (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setFilterBarVisible(v => !v)}
        className="w-7 h-7 flex items-center justify-center rounded border border-[#d9d9d9] text-[#6a6d70] hover:text-[#0a6ed1] hover:border-[#0a6ed1] transition-all"
        title={filterBarVisible ? 'Hide filter bar' : 'Show filter bar'}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ transform: filterBarVisible ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          <path d="M18 15l-6-6-6 6"/>
        </svg>
      </button>
      <button
        onClick={handleClear}
        className="w-7 h-7 flex items-center justify-center rounded border border-[#d9d9d9] text-[#6a6d70] hover:text-[#cc1c14] hover:border-[#cc1c14] transition-all"
        title="Reset filters"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
      </button>
    </div>
  )

  return (
    <PageLayout>
      <style>{`
        @keyframes fadeIn    { from { opacity:0; transform:translateY(8px);  } to { opacity:1; transform:translateY(0);  } }
        @keyframes slideInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0);  } }
        @keyframes modalIn   { from { opacity:0; transform:scale(0.94);      } to { opacity:1; transform:scale(1);       } }
        .anim-fade     { animation: fadeIn    0.35s ease-out both; }
        .anim-slide-up { animation: slideInUp 0.4s  ease-out both; }
        .row-stagger > * { animation: fadeIn 0.35s ease-out both; }
        .row-stagger > *:nth-child(1)  { animation-delay:0.02s; }
        .row-stagger > *:nth-child(2)  { animation-delay:0.05s; }
        .row-stagger > *:nth-child(3)  { animation-delay:0.08s; }
        .row-stagger > *:nth-child(4)  { animation-delay:0.11s; }
        .row-stagger > *:nth-child(5)  { animation-delay:0.14s; }
        .row-stagger > *:nth-child(6)  { animation-delay:0.17s; }
        .row-stagger > *:nth-child(7)  { animation-delay:0.20s; }
        .row-stagger > *:nth-child(8)  { animation-delay:0.23s; }
        .row-stagger > *:nth-child(9)  { animation-delay:0.26s; }
        .row-stagger > *:nth-child(10) { animation-delay:0.29s; }
      `}</style>

      {/* Value help modals */}
      {vhModal === 'part' && (
        <ValueHelpModal
          title="Part"
          options={vhOptions}
          onSelect={handleVhSelect}
          onCancel={() => setVhModal(null)}
        />
      )}
      {vhModal === 'sa' && (
        <ValueHelpModal
          title="Scheduling Agreement"
          options={vhOptions}
          onSelect={handleVhSelect}
          onCancel={() => setVhModal(null)}
        />
      )}

      {/* Export progress modal */}
      {exporting && (
        <ExportModal
          progress={exportProgress}
          total={exportTotal}
          onCancel={() => { exportCancelRef.current = true; setExporting(false) }}
        />
      )}

      <div className="bg-[#f5f6f7] min-h-[calc(100vh-104px)]">
        <main className="flex flex-col bg-white" style={{ minHeight: 'calc(100vh - 220px)' }}>

          {/* ── Page meta header ── */}
          <div className="px-4 sm:px-6 lg:px-10 pt-4 pb-2 bg-white border-b border-[#e5e5e5] flex-shrink-0">
            <div className="flex flex-wrap gap-x-8 gap-y-1 text-[13px] text-[#6a6d70]">
              <span>Company Code: <strong className="text-[#32363a]">FIEM (FIEM Industries Limited)</strong></span>
              <span className="hidden sm:inline">Supplier Name: <strong className="text-[#32363a]">{vendor}</strong></span>
              <span className="hidden lg:inline">Supplier Location: <strong className="text-[#32363a]">Alwar</strong></span>
            </div>
          </div>

          {/* ── Page title + action buttons ── */}
          <div className="px-4 sm:px-6 lg:px-10 pt-4 pb-3 flex items-center justify-between flex-shrink-0">
            <h2 className="text-[20px] sm:text-[22px] font-bold text-[#32363a] tracking-tight">Monthly Supply Schedule</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGo}
                disabled={loading}
                className="flex items-center gap-1.5 px-5 h-9 text-[14px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
                Go
              </button>
              <button
                onClick={() => setFilterBarVisible(v => !v)}
                className="px-4 h-9 text-[14px] font-semibold text-[#32363a] bg-white border border-[#d9d9d9] rounded-lg hover:bg-[#f5f6f7] transition-all whitespace-nowrap"
              >
                {filterBarVisible ? 'Hide Filter Bar' : 'Show Filter Bar'}
              </button>
              <button
                onClick={handleClear}
                className="px-4 h-9 text-[14px] font-semibold text-[#cc1c14] bg-[#fce8e6] border border-[#fce8e6] rounded-lg hover:bg-[#fad6d3] transition-all"
              >
                Clear
              </button>
            </div>
          </div>

          {/* ── Filter bar ── */}
          {filterBarVisible && (
            <div className="px-4 sm:px-6 lg:px-10 pb-3 flex-shrink-0 anim-fade">
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-6 items-start">

                {/* Date */}
                <div>
                  <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">Date:</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="h-10 pl-3 pr-9 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all w-[160px]"
                    />
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2.5 top-3.5 text-[#6a6d70] pointer-events-none">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                    </svg>
                  </div>
                </div>

                {/* Part No. */}
                <div>
                  <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">Part No.:</label>
                  <div className="w-[180px]">
                    <ValueHelpInput
                      placeholder="Select Part"
                      value={partNo}
                      onOpen={() => openVh('part')}
                    />
                  </div>
                </div>

                {/* SA No. */}
                <div>
                  <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">SA No.:</label>
                  <div className="w-[180px]">
                    <ValueHelpInput
                      placeholder="Select SA"
                      value={saNo}
                      onOpen={() => openVh('sa')}
                    />
                  </div>
                </div>
              </div>

              {/* Vendor (read-only, shown below filters) */}
              <div className="mt-2 text-[13px] text-[#6a6d70]">
                Vendor: <span className="font-medium text-[#32363a]">{vendor}</span>
              </div>
            </div>
          )}

          {/* ── Collapse/expand toggle icons (between filters and table) ── */}
          <div className="px-4 sm:px-6 lg:px-10 pb-2 flex items-center justify-center gap-2 flex-shrink-0">
            <CollapseIcon />
          </div>

          {/* ── Table controls row ── */}
          <div className="px-4 sm:px-6 lg:px-10 py-2 flex items-center justify-between gap-3 flex-shrink-0 border-t border-[#e5e5e5]">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[#6a6d70] font-medium">Show Supply Column</span>
                <Toggle value={showSupply} onChange={setShowSupply} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[#6a6d70] font-medium">Show Monthly/Daily</span>
                <div className="relative">
                  <select
                    value={viewMode}
                    onChange={e => setViewMode(e.target.value)}
                    className="h-8 pl-3 pr-8 text-[13px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] appearance-none cursor-pointer"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Daily">Daily</option>
                  </select>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2.5 top-2 text-[#6a6d70] pointer-events-none">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Export button */}
            <button
              onClick={handleExport}
              disabled={rows.length === 0 || exporting}
              className="flex items-center gap-2 px-4 h-8 text-[13px] font-semibold text-[#32363a] bg-white border border-[#d9d9d9] rounded-lg hover:bg-[#f5f6f7] hover:border-[#0a6ed1] hover:text-[#0a6ed1] transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              Export
              {/* Spreadsheet icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18M9 21V9"/>
              </svg>
            </button>
          </div>

          {/* ── Table ── */}
          <div className="flex-1 overflow-hidden flex flex-col px-4 sm:px-6 lg:px-10 pb-6 pt-2">

            {!hasSearched && !loading ? (
              <div className="flex-1 flex items-center justify-center anim-fade">
                <div className="text-center text-[#6a6d70]">
                  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-25">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M3 9h18M9 21V9M3 15h18"/>
                  </svg>
                  <div className="text-[15px] font-semibold mb-1">No report loaded</div>
                  <div className="text-[13px]">Set filters and click <strong>Go</strong> to generate the schedule</div>
                </div>
              </div>
            ) : loading ? (
              <div className="flex-1 flex items-center justify-center anim-fade">
                <div className="flex flex-col items-center gap-3 text-[#6a6d70]">
                  <div className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#0a6ed1] rounded-full animate-spin" />
                  <span className="text-[14px]">Loading schedule…</span>
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
                {/* Single scroll container — header + body scroll together */}
                <div className="overflow-auto flex-1 min-h-0">
                  <table
                    className="text-[13px] border-collapse"
                    style={{ tableLayout: 'fixed', minWidth: `${7 * 100 + periods.length * (showSupply && viewMode === 'Monthly' ? 200 : 110)}px` }}
                  >
                    <colgroup>
                      {/* Fixed cols */}
                      <col style={{ width: '54px'  }} /> {/* S.No */}
                      <col style={{ width: '118px' }} /> {/* SA No */}
                      <col style={{ width: '64px'  }} /> {/* Item */}
                      <col style={{ width: '150px' }} /> {/* Part */}
                      <col style={{ width: '66px'  }} /> {/* Plant */}
                      <col style={{ width: '130px' }} /> {/* Cumul Backlog */}
                      {/* Dynamic period cols */}
                      {periods.map(p =>
                        showSupply && viewMode === 'Monthly'
                          ? [<col key={p.key+'s'} style={{ width: '100px' }} />, <col key={p.key+'u'} style={{ width: '100px' }} />]
                          : <col key={p.key+'s'} style={{ width: '110px' }} />
                      )}
                    </colgroup>

                    <thead className="sticky top-0 z-10">
                      {/* Row 1: fixed headers + month/date groups */}
                      <tr className="bg-[#f5f6f7] text-[#6a6d70]">
                        <th rowSpan={2} className="text-center font-semibold py-3 px-2 text-[11px] uppercase tracking-wider border-b border-r border-[#e5e5e5] bg-[#f5f6f7]">S.No.</th>
                        <th rowSpan={2} className="text-left font-semibold py-3 px-3 text-[11px] uppercase tracking-wider border-b border-r border-[#e5e5e5] bg-[#f5f6f7]">SA No.</th>
                        <th rowSpan={2} className="text-center font-semibold py-3 px-2 text-[11px] uppercase tracking-wider border-b border-r border-[#e5e5e5] bg-[#f5f6f7]">Item</th>
                        <th rowSpan={2} className="text-left font-semibold py-3 px-3 text-[11px] uppercase tracking-wider border-b border-r border-[#e5e5e5] bg-[#f5f6f7]">Part</th>
                        <th rowSpan={2} className="text-center font-semibold py-3 px-2 text-[11px] uppercase tracking-wider border-b border-r border-[#e5e5e5] bg-[#f5f6f7]">Plant</th>
                        <th rowSpan={2} className="text-right font-semibold py-3 px-3 text-[11px] uppercase tracking-wider border-b border-r border-[#e5e5e5] bg-[#f5f6f7] whitespace-nowrap">Cumulative<br/>Backlog Qty</th>
                        {periods.map(p => (
                          showSupply && viewMode === 'Monthly' ? (
                            <th key={p.key} colSpan={2} className="text-center font-semibold py-3 px-3 text-[12px] border-b border-r border-[#e5e5e5] bg-[#ebf5ff] text-[#0a6ed1]">
                              {p.label}
                            </th>
                          ) : (
                            <th key={p.key} colSpan={1} className="text-center font-semibold py-3 px-3 text-[11px] border-b border-r border-[#e5e5e5] bg-[#ebf5ff] text-[#0a6ed1] whitespace-nowrap">
                              {p.label}
                            </th>
                          )
                        ))}
                      </tr>

                      {/* Row 2: Schedule / Supply sub-headers */}
                      <tr className="bg-[#fafbfc] text-[#6a6d70]">
                        {periods.map(p =>
                          showSupply && viewMode === 'Monthly' ? [
                            <th key={p.key+'s'} className="text-center font-semibold py-2 px-2 text-[11px] border-b border-r border-[#e5e5e5]">Schedule</th>,
                            <th key={p.key+'u'} className="text-center font-semibold py-2 px-2 text-[11px] border-b border-r border-[#e5e5e5]">Supply</th>,
                          ] : [
                            <th key={p.key+'s'} className="text-center font-semibold py-2 px-2 text-[11px] border-b border-r border-[#e5e5e5]">Schedule</th>,
                          ]
                        )}
                      </tr>
                    </thead>

                    <tbody className="row-stagger">
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={6 + periods.length * (showSupply && viewMode === 'Monthly' ? 2 : 1)} className="py-12 text-center text-[14px] text-[#6a6d70]">
                            No records found
                          </td>
                        </tr>
                      ) : (
                        rows.map((row, idx) => {
                          const pv = getMockPeriodValue()
                          return (
                            <tr key={`${row.saNo}-${row.item}-${idx}`} className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc] transition-colors duration-100">
                              <td className="py-3 px-2 text-center text-[#6a6d70] font-semibold border-r border-[#f0f0f0]">{idx + 1}</td>
                              <td className="py-3 px-3 text-[#0a6ed1] font-semibold border-r border-[#f0f0f0] whitespace-nowrap">{row.saNo}</td>
                              <td className="py-3 px-2 text-center text-[#32363a] border-r border-[#f0f0f0]">{row.item}</td>
                              <td className="py-3 px-3 border-r border-[#f0f0f0]">
                                <div className="font-semibold text-[#0a6ed1] text-[12px]">{row.partNo}</div>
                                <div className="text-[#6a6d70] text-[11px] mt-0.5 truncate">{row.partName}</div>
                              </td>
                              <td className="py-3 px-2 text-center text-[#32363a] font-semibold border-r border-[#f0f0f0]">{row.plant}</td>
                              <td className="py-3 px-3 text-right border-r border-[#f0f0f0]">
                                <span className={row.cumulativeBacklogQty > 0 ? 'font-bold text-[#b45309]' : 'text-[#6a6d70]'}>
                                  {row.cumulativeBacklogQty.toFixed(3)}
                                </span>
                              </td>
                              {periods.map(p =>
                                showSupply && viewMode === 'Monthly' ? [
                                  <td key={p.key+'s'} className="py-3 px-2 text-center border-r border-[#f0f0f0]">
                                    <div className="flex items-center gap-1 justify-center">
                                      <span className="inline-block w-1 h-5 bg-[#d9d9d9] rounded-sm flex-shrink-0" />
                                      <span className="text-[#32363a] tabular-nums">{pv.schedule.toFixed(3)}</span>
                                    </div>
                                  </td>,
                                  <td key={p.key+'u'} className="py-3 px-2 text-center border-r border-[#f0f0f0]">
                                    <span className="text-[#32363a] tabular-nums">{pv.supply.toFixed(3)}</span>
                                  </td>,
                                ] : [
                                  <td key={p.key+'s'} className="py-3 px-2 text-center border-r border-[#f0f0f0]">
                                    <div className="flex items-center gap-1 justify-center">
                                      <span className="inline-block w-1 h-5 bg-[#d9d9d9] rounded-sm flex-shrink-0" />
                                      <span className="text-[#32363a] tabular-nums">{pv.schedule.toFixed(3)}</span>
                                    </div>
                                  </td>,
                                ]
                              )}
                            </tr>
                          )
                        })
                      )}
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