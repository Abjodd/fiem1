import { useState, useMemo, useEffect, useRef } from 'react'
import PageLayout from '../../layouts/PageLayout.jsx'
import ReactDOM from 'react-dom'

// ═══════════════════════════════════════════════════════════════
// DUMMY DATA
// ═══════════════════════════════════════════════════════════════
const PO_SCHEDULE_REPORT_DATA = [
  {
    poSaNumber: '7000037139', poItem: '10',
    materialNumber: '1P302790-1 G', materialName: 'LEFT SIDE PANEL(RESIN)',
    plantCode: 'NMR', plantName: 'Daikin Airconditioning -NMR',
    vendorCode: '401122', vendorName: 'Kunstocom(India) Ltd',
    challanNo: '', expectedShipmentDate: 'May 19, 2026', deliveryDate: 'May 19, 2026',
    poQty: 1500, poUnit: 'NO', confirmedQty: 1500, confirmedUnit: 'NO',
    deliveredQty: 0, deliveredUnit: 'NO', asnCreated: 48, poType: 'Purchase Order',
  },
  {
    poSaNumber: '7000037138', poItem: '10',
    materialNumber: '1P302790-1 G', materialName: 'LEFT SIDE PANEL(RESIN)',
    plantCode: 'NMR', plantName: 'Daikin Airconditioning -NMR',
    vendorCode: '401122', vendorName: 'Kunstocom(India) Ltd',
    challanNo: '', expectedShipmentDate: 'May 19, 2026', deliveryDate: 'May 19, 2026',
    poQty: 1500, poUnit: 'NO', confirmedQty: 1500, confirmedUnit: 'NO',
    deliveredQty: 0, deliveredUnit: 'NO', asnCreated: 40, poType: 'Purchase Order',
  },
  {
    poSaNumber: '7000037138', poItem: '20',
    materialNumber: '2P438825-1 D', materialName: 'INDICATION LAMP COVER',
    plantCode: 'NMR', plantName: 'Daikin Airconditioning -NMR',
    vendorCode: '401122', vendorName: 'Kunstocom(India) Ltd',
    challanNo: '', expectedShipmentDate: 'May 19, 2026', deliveryDate: 'May 19, 2026',
    poQty: 1000, poUnit: 'NO', confirmedQty: 1000, confirmedUnit: 'NO',
    deliveredQty: 0, deliveredUnit: 'NO', asnCreated: 20, poType: 'Purchase Order',
  },
  {
    poSaNumber: '7000037140', poItem: '10',
    materialNumber: '3P512010-2 A', materialName: 'FRONT GRILLE ASSY',
    plantCode: 'SR01', plantName: 'Sri City FG',
    vendorCode: '401155', vendorName: 'ABC Components Ltd',
    challanNo: 'CH-2026-001', expectedShipmentDate: 'May 20, 2026', deliveryDate: 'May 21, 2026',
    poQty: 800, poUnit: 'NO', confirmedQty: 800, confirmedUnit: 'NO',
    deliveredQty: 400, deliveredUnit: 'NO', asnCreated: 12, poType: 'Purchase Order',
  },
  {
    poSaNumber: '7000037141', poItem: '10',
    materialNumber: '4C100230-1', materialName: 'COMPRESSOR ASSY R32',
    plantCode: 'NMR', plantName: 'Daikin Airconditioning -NMR',
    vendorCode: '401199', vendorName: 'XYZ Compressors Pvt Ltd',
    challanNo: 'CH-2026-002', expectedShipmentDate: 'May 18, 2026', deliveryDate: 'May 19, 2026',
    poQty: 200, poUnit: 'NO', confirmedQty: 200, confirmedUnit: 'NO',
    deliveredQty: 200, deliveredUnit: 'NO', asnCreated: 5, poType: 'Scheduling Agreement',
  },
  {
    poSaNumber: '7000037142', poItem: '30',
    materialNumber: '5P198710-3 B', materialName: 'PCB ASSY MAIN',
    plantCode: 'SR01', plantName: 'Sri City FG',
    vendorCode: '401122', vendorName: 'Kunstocom(India) Ltd',
    challanNo: '', expectedShipmentDate: 'May 22, 2026', deliveryDate: 'May 23, 2026',
    poQty: 600, poUnit: 'NO', confirmedQty: 500, confirmedUnit: 'NO',
    deliveredQty: 100, deliveredUnit: 'NO', asnCreated: 8, poType: 'Purchase Order',
  },
]

// ── Value-help options (mock; in prod fetched from backend) ──
const VALUE_HELP_OPTIONS = {
  vendor: [
    { code: '401122', label: 'Kunstocom(India) Ltd' },
    { code: '401155', label: 'ABC Components Ltd' },
    { code: '401199', label: 'XYZ Compressors Pvt Ltd' },
  ],
  poNumber: [
    { code: '7000037139', label: '7000037139' },
    { code: '7000037138', label: '7000037138' },
    { code: '7000037140', label: '7000037140' },
    { code: '7000037141', label: '7000037141' },
    { code: '7000037142', label: '7000037142' },
  ],
  material: [
    { code: '1P302790-1 G', label: 'LEFT SIDE PANEL(RESIN)' },
    { code: '2P438825-1 D', label: 'INDICATION LAMP COVER' },
    { code: '3P512010-2 A', label: 'FRONT GRILLE ASSY' },
    { code: '4C100230-1',   label: 'COMPRESSOR ASSY R32' },
    { code: '5P198710-3 B', label: 'PCB ASSY MAIN' },
  ],
  plant: [
    { code: 'NMR',  label: 'Daikin Airconditioning -NMR' },
    { code: 'SR01', label: 'Sri City FG' },
  ],
}

// ═══════════════════════════════════════════════════════════════
// API STRUCTURE — for future backend integration
// ═══════════════════════════════════════════════════════════════
const API_BASE_URL = '/api/v1'
const USE_MOCK = true

const POScheduleReportApi = {
  async fetchReport({ deliveryDateFrom='', deliveryDateTo='', poType='', vendor='', poNumber='', material='', plant='' } = {}) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
      return PO_SCHEDULE_REPORT_DATA.filter(row => {
        const matchPoType   = !poType   || poType === 'All' || row.poType === poType
        const matchVendor   = !vendor   || row.vendorName.toLowerCase().includes(vendor.toLowerCase()) || row.vendorCode.includes(vendor)
        const matchPoNumber = !poNumber || row.poSaNumber.includes(poNumber)
        const matchMaterial = !material || row.materialNumber.toLowerCase().includes(material.toLowerCase()) || row.materialName.toLowerCase().includes(material.toLowerCase())
        const matchPlant    = !plant    || row.plantCode.toLowerCase().includes(plant.toLowerCase()) || row.plantName.toLowerCase().includes(plant.toLowerCase())
        return matchPoType && matchVendor && matchPoNumber && matchMaterial && matchPlant
      })
    }
    const params = new URLSearchParams()
    if (deliveryDateFrom) params.set('deliveryDateFrom', deliveryDateFrom)
    if (deliveryDateTo)   params.set('deliveryDateTo', deliveryDateTo)
    if (poType)           params.set('poType', poType)
    if (vendor)           params.set('vendor', vendor)
    if (poNumber)         params.set('poNumber', poNumber)
    if (material)         params.set('material', material)
    if (plant)            params.set('plant', plant)
    const res = await fetch(`${API_BASE_URL}/po-schedule-report?${params}`)
    if (!res.ok) throw new Error('Failed to fetch PO Schedule Report')
    return res.json()
  },

  // Future: fetch value-help options per field from backend
  async fetchValueHelp(field, query = '') {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 80))
      const opts = VALUE_HELP_OPTIONS[field] || []
      if (!query) return opts
      const q = query.toLowerCase()
      return opts.filter(o => o.code.toLowerCase().includes(q) || o.label.toLowerCase().includes(q))
    }
    const res = await fetch(`${API_BASE_URL}/value-help/${field}?q=${encodeURIComponent(query)}`)
    if (!res.ok) throw new Error('Failed to fetch value help')
    return res.json()
  },
}

// ═══════════════════════════════════════════════════════════════
// DATE HELPERS
// ═══════════════════════════════════════════════════════════════
const ddmmyyyyToIso = (s) => {
  if (!s) return ''
  const parts = s.split('.')
  if (parts.length !== 3) return ''
  const [d, m, y] = parts
  if (!d || !m || !y) return ''
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
}
const isoToDdmmyyyy = (s) => {
  if (!s) return ''
  const [y, m, d] = s.split('-')
  if (!y || !m || !d) return ''
  return `${d}.${m}.${y}`
}
const parseDdmmyyyy = (s) => {
  const iso = ddmmyyyyToIso(s)
  return iso ? new Date(iso) : null
}
const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

// ═══════════════════════════════════════════════════════════════
// ADHERENCE % — ((PO Qty - Delivered Qty) / PO Qty) * 100
// ═══════════════════════════════════════════════════════════════
const calcAdherence = (poQty, deliveredQty) => {
  if (!poQty || poQty === 0) return null
  return ((poQty - deliveredQty) / poQty) * 100
}

// ═══════════════════════════════════════════════════════════════
// VALUE HELP FIELD COMPONENT
// Text input + copy icon → opens dropdown with backend-sourced options.
// Selecting an option fills the text; typing also filters.
// ═══════════════════════════════════════════════════════════════
function ValueHelpField({ fieldKey, value, onChange, placeholder }) {
  const [open, setOpen]   = useState(false)
  const [opts, setOpts]   = useState([])
  const [pos,  setPos]    = useState({ top: 0, left: 0, width: 0 })
  const btnRef            = useRef(null)
  const dropRef           = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (
        btnRef.current  && !btnRef.current.closest('[data-vh-root]').contains(e.target) &&
        dropRef.current && !dropRef.current.contains(e.target)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleOpenValueHelp = () => {
    const rect = btnRef.current.closest('[data-vh-root]').getBoundingClientRect()
    setPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: rect.width })
    setOpts(VALUE_HELP_OPTIONS[fieldKey] || [])
    setOpen(true)
  }

  const handleSelect = (opt) => { onChange(opt.code); setOpen(false) }

  return (
    <div data-vh-root className="relative">
      <div className="flex h-10 border border-[#d9d9d9] rounded-lg overflow-hidden focus-within:border-[#0a6ed1] focus-within:ring-2 focus-within:ring-[#0a6ed1]/20 transition-all bg-white">
        <input
          type="text" value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 pl-3 pr-2 text-[14px] bg-transparent focus:outline-none min-w-0"
        />
        <button ref={btnRef} type="button" onClick={handleOpenValueHelp}
          className="flex-shrink-0 w-9 flex items-center justify-center border-l border-[#e5e5e5] text-[#6a6d70] hover:text-[#0a6ed1] hover:bg-[#f0f7ff] transition-all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
      </div>

      {open && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div ref={dropRef}
          style={{ position: 'absolute', top: pos.top, left: pos.left, width: Math.max(pos.width, 220), zIndex: 9999, animation: 'scaleIn 0.18s ease-out both' }}
          className="bg-white border border-[#d9d9d9] rounded-lg shadow-xl">
          <div className="max-h-52 overflow-y-auto py-1">
            {opts.length === 0
              ? <div className="py-6 text-center text-[13px] text-[#6a6d70]">No options found</div>
              : opts.map(opt => (
                <button key={opt.code} onClick={() => handleSelect(opt)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-[#ebf5ff] transition-colors flex items-center gap-2">
                  <span className="text-[12px] font-mono font-semibold text-[#0a6ed1] min-w-[80px]">{opt.code}</span>
                  <span className="text-[13px] text-[#32363a] truncate">{opt.label}</span>
                </button>
              ))
            }
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function POScheduleReport() {
  const [deliveryDateFrom, setDeliveryDateFrom] = useState(isoToDdmmyyyy(todayIso()))
  const [deliveryDateTo,   setDeliveryDateTo]   = useState(isoToDdmmyyyy(todayIso()))
  const [poType,    setPoType]    = useState('Purchase Order')
  const [vendor,    setVendor]    = useState('')
  const [poNumber,  setPoNumber]  = useState('')
  const [material,  setMaterial]  = useState('')
  const [plant,     setPlant]     = useState('')

  const [rows,        setRows]        = useState([])
  const [loading,     setLoading]     = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error,       setError]       = useState(null)

  const dateError = useMemo(() => {
    if (!deliveryDateFrom || !deliveryDateTo) return null
    const f = parseDdmmyyyy(deliveryDateFrom)
    const t = parseDdmmyyyy(deliveryDateTo)
    if (!f || !t) return null
    return f > t ? 'From Date must be earlier than To Date' : null
  }, [deliveryDateFrom, deliveryDateTo])

  const handleGo = async () => {
    if (dateError) return
    setLoading(true)
    setError(null)
    try {
      const data = await POScheduleReportApi.fetchReport({ deliveryDateFrom, deliveryDateTo, poType, vendor, poNumber, material, plant })
      setRows(data)
      setHasSearched(true)
    } catch (err) {
      setError(err.message || 'Failed to fetch report')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setDeliveryDateFrom(isoToDdmmyyyy(todayIso()))
    setDeliveryDateTo(isoToDdmmyyyy(todayIso()))
    setPoType('Purchase Order')
    setVendor('')
    setPoNumber('')
    setMaterial('')
    setPlant('')
    setRows([])
    setHasSearched(false)
    setError(null)
  }

  return (
    <PageLayout>
      <style>{`
        @keyframes fadeIn    { from { opacity:0; transform:translateY(8px);  } to { opacity:1; transform:translateY(0);  } }
        @keyframes scaleIn   { from { opacity:0; transform:scale(0.96);      } to { opacity:1; transform:scale(1);       } }
        @keyframes slideInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0);  } }
        .anim-fade     { animation: fadeIn    0.35s ease-out both; }
        .anim-scale    { animation: scaleIn   0.25s ease-out both; }
        .anim-slide-up { animation: slideInUp 0.4s  ease-out both; }
        .row-stagger > * { animation: fadeIn 0.4s ease-out both; }
        .row-stagger > *:nth-child(1) { animation-delay:0.02s; }
        .row-stagger > *:nth-child(2) { animation-delay:0.06s; }
        .row-stagger > *:nth-child(3) { animation-delay:0.10s; }
        .row-stagger > *:nth-child(4) { animation-delay:0.14s; }
        .row-stagger > *:nth-child(5) { animation-delay:0.18s; }
        .row-stagger > *:nth-child(6) { animation-delay:0.22s; }
        .row-stagger > *:nth-child(7) { animation-delay:0.26s; }
        .row-stagger > *:nth-child(8) { animation-delay:0.30s; }
      `}</style>

      <div className="bg-[#f5f6f7] min-h-[calc(100vh-104px)]">
        <main className="flex flex-col" style={{ minHeight:'calc(100vh - 220px)' }}>

          {/* ── Page Header ── */}
          <div className="px-4 sm:px-6 lg:px-10 pt-5 sm:pt-7 pb-4 border-b border-[#e5e5e5] bg-gradient-to-b from-[#fafbfc] to-white flex-shrink-0">
            <div className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">
              Company Code: DSAL (Daikin Airconditioning India Private Limited)
            </div>
            <h2 className="text-[20px] sm:text-[24px] font-bold text-[#32363a] tracking-tight">PO Schedule Report</h2>
          </div>

          {/* ── Filters ── */}
          <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-5 border-b border-[#e5e5e5] bg-white flex-shrink-0 anim-fade">

            {/* Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-3">

              {/* Delivery Date From */}
              <div>
                <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">
                  Delivery Date From <span className="text-[#cc1c14]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={ddmmyyyyToIso(deliveryDateFrom)}
                    onChange={(e) => setDeliveryDateFrom(isoToDdmmyyyy(e.target.value))}
                    max={deliveryDateTo ? ddmmyyyyToIso(deliveryDateTo) : undefined}
                    className={`w-full h-10 pl-3 pr-9 text-[14px] border rounded-lg bg-white focus:outline-none focus:ring-2 transition-all ${dateError ? 'border-[#cc1c14] focus:ring-[#cc1c14]/20' : 'border-[#d9d9d9] focus:border-[#0a6ed1] focus:ring-[#0a6ed1]/20'}`}
                  />
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2.5 top-3.5 text-[#6a6d70] pointer-events-none">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                </div>
              </div>

              {/* Delivery Date To */}
              <div>
                <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">
                  Delivery Date To <span className="text-[#cc1c14]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={ddmmyyyyToIso(deliveryDateTo)}
                    onChange={(e) => setDeliveryDateTo(isoToDdmmyyyy(e.target.value))}
                    min={deliveryDateFrom ? ddmmyyyyToIso(deliveryDateFrom) : undefined}
                    className={`w-full h-10 pl-3 pr-9 text-[14px] border rounded-lg bg-white focus:outline-none focus:ring-2 transition-all ${dateError ? 'border-[#cc1c14] focus:ring-[#cc1c14]/20' : 'border-[#d9d9d9] focus:border-[#0a6ed1] focus:ring-[#0a6ed1]/20'}`}
                  />
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2.5 top-3.5 text-[#6a6d70] pointer-events-none">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                </div>
              </div>

              {/* PO Type */}
              <div>
                <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">PO Type</label>
                <div className="relative">
                  <select
                    value={poType}
                    onChange={(e) => setPoType(e.target.value)}
                    className="w-full h-10 pl-3 pr-8 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="All">All</option>
                    <option value="Purchase Order">Purchase Order</option>
                    <option value="Scheduling Agreement">Scheduling Agreement</option>
                  </select>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2.5 top-3.5 text-[#6a6d70] pointer-events-none">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
              </div>

              {/* Vendor — value help */}
              <div>
                <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">Vendor</label>
                <ValueHelpField fieldKey="vendor" value={vendor} onChange={setVendor} placeholder="Code or name" />
              </div>

              {/* PO Number — value help */}
              <div>
                <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">PO Number</label>
                <ValueHelpField fieldKey="poNumber" value={poNumber} onChange={setPoNumber} placeholder="e.g. 7000037139" />
              </div>

              {/* Material — value help */}
              <div>
                <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">Material</label>
                <ValueHelpField fieldKey="material" value={material} onChange={setMaterial} placeholder="Number or name" />
              </div>
            </div>

            {/* Row 2: Plant + buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-end">
              <div className="w-full sm:w-56">
                <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">Plant</label>
                <ValueHelpField fieldKey="plant" value={plant} onChange={setPlant} placeholder="Code or name" />
              </div>

              <div className="hidden sm:block flex-1" />

              <div className="flex gap-2 w-full sm:w-auto sm:self-end">
                <button
                  onClick={handleGo}
                  disabled={loading || !!dateError || !deliveryDateFrom || !deliveryDateTo}
                  className="flex items-center gap-2 px-6 h-10 text-[14px] font-semibold text-white bg-[#0a6ed1] border border-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Loading…</>
                  ) : (
                    <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>Go</>
                  )}
                </button>
                <button
                  onClick={handleClear}
                  className="flex items-center gap-2 px-5 h-10 text-[14px] font-semibold text-[#cc1c14] bg-[#fce8e6] border border-[#fce8e6] rounded-lg hover:bg-[#fad6d3] hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
                >
                  Clear
                </button>
              </div>
            </div>

            {dateError && (
              <div className="mt-2 flex items-center gap-1.5 text-[13px] text-[#cc1c14] anim-fade">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                {dateError}
              </div>
            )}
          </div>

          {/* ── Results ── */}
          <div className="flex-1 px-4 sm:px-6 lg:px-10 pt-4 sm:pt-6 pb-6 overflow-hidden flex flex-col">
            {error && (
              <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-[#fce8e6] text-[#cc1c14] rounded-lg text-[13px] font-medium anim-fade">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                {error}
              </div>
            )}

            {!hasSearched && !loading ? (
              <div className="flex-1 flex items-center justify-center anim-fade">
                <div className="text-center text-[#6a6d70]">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-30">
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
            ) : (
              <div className="rounded-xl border border-[#e5e5e5] shadow-sm flex flex-col overflow-hidden flex-1 anim-slide-up">

                {/* Record count bar */}
                <div className="px-4 py-2.5 border-b border-[#e5e5e5] bg-[#fafbfc] flex items-center flex-shrink-0">
                  <span className="text-[13px] text-[#6a6d70]">
                    <span className="font-semibold text-[#32363a]">{rows.length}</span> record{rows.length !== 1 ? 's' : ''} found
                  </span>
                </div>

                {/* ── Single scrollable area: header + body scroll together ── */}
                <div className="flex-1 overflow-auto min-h-0">
                  <table
                    className="w-full text-[13px] border-collapse"
                    style={{ minWidth: '1400px', tableLayout: 'fixed' }}
                  >
                    {/* Fixed col widths — ensures header & body align perfectly */}
                    <colgroup>
                      <col style={{ width: '130px' }} /> {/* PO/SA Number */}
                      <col style={{ width: '72px'  }} /> {/* PO Item      */}
                      <col style={{ width: '170px' }} /> {/* Material     */}
                      <col style={{ width: '150px' }} /> {/* Plant        */}
                      <col style={{ width: '150px' }} /> {/* Vendor       */}
                      <col style={{ width: '110px' }} /> {/* Challan No.  */}
                      <col style={{ width: '130px' }} /> {/* Exp Ship Date*/}
                      <col style={{ width: '115px' }} /> {/* Delivery Date*/}
                      <col style={{ width: '95px'  }} /> {/* PO Qty       */}
                      <col style={{ width: '100px' }} /> {/* Confirmed Qty*/}
                      <col style={{ width: '100px' }} /> {/* Delivered Qty*/}
                      <col style={{ width: '90px'  }} /> {/* ASN Created  */}
                      <col style={{ width: '130px' }} /> {/* Adherence %  */}
                    </colgroup>

                    <thead className="sticky top-0 z-10">
                      <tr className="bg-gradient-to-b from-[#fafbfc] to-[#f5f6f7] text-[#6a6d70]">
                        <th className="text-left font-semibold py-3.5 px-3 text-[11px] uppercase tracking-wider border-b border-[#e5e5e5]">PO/SA Number</th>
                        <th className="text-center font-semibold py-3.5 px-3 text-[11px] uppercase tracking-wider border-b border-[#e5e5e5]">PO Item</th>
                        <th className="text-left font-semibold py-3.5 px-3 text-[11px] uppercase tracking-wider border-b border-[#e5e5e5]">Material</th>
                        <th className="text-left font-semibold py-3.5 px-3 text-[11px] uppercase tracking-wider border-b border-[#e5e5e5]">Plant</th>
                        <th className="text-left font-semibold py-3.5 px-3 text-[11px] uppercase tracking-wider border-b border-[#e5e5e5]">Vendor</th>
                        <th className="text-left font-semibold py-3.5 px-3 text-[11px] uppercase tracking-wider border-b border-[#e5e5e5]">Challan No.</th>
                        <th className="text-left font-semibold py-3.5 px-3 text-[11px] uppercase tracking-wider border-b border-[#e5e5e5]">Exp. Shipment Date</th>
                        <th className="text-left font-semibold py-3.5 px-3 text-[11px] uppercase tracking-wider border-b border-[#e5e5e5]">Delivery Date</th>
                        <th className="text-right font-semibold py-3.5 px-3 text-[11px] uppercase tracking-wider border-b border-[#e5e5e5]">PO Qty</th>
                        <th className="text-right font-semibold py-3.5 px-3 text-[11px] uppercase tracking-wider border-b border-[#e5e5e5]">Confirmed Qty</th>
                        <th className="text-right font-semibold py-3.5 px-3 text-[11px] uppercase tracking-wider border-b border-[#e5e5e5]">Delivered Qty</th>
                        <th className="text-right font-semibold py-3.5 px-3 text-[11px] uppercase tracking-wider border-b border-[#e5e5e5]">ASN Created</th>
                        <th className="text-right font-semibold py-3.5 px-3 text-[11px] uppercase tracking-wider border-b border-[#e5e5e5]">Adherence / Variance %</th>
                      </tr>
                    </thead>

                    <tbody className="row-stagger">
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={13} className="py-12 text-center text-[14px] text-[#6a6d70]">
                            No records found for the selected filters
                          </td>
                        </tr>
                      ) : (
                        rows.map((row, idx) => {
                          const adherence = calcAdherence(row.poQty, row.deliveredQty)
                          const adherenceColor = adherence === null ? 'text-[#6a6d70]'
                            : adherence === 0 ? 'text-[#107e3e]'
                            : adherence <= 25  ? 'text-[#b45309]'
                            : 'text-[#cc1c14]'
                          const adherenceBg = adherence === null ? 'bg-[#f5f6f7]'
                            : adherence === 0 ? 'bg-[#e8f5ec]'
                            : adherence <= 25  ? 'bg-[#fef7e6]'
                            : 'bg-[#fce8e6]'

                          return (
                            <tr
                              key={`${row.poSaNumber}-${row.poItem}-${idx}`}
                              className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc] transition-colors duration-150"
                            >
                              <td className="py-3 px-3 text-[#0a6ed1] font-semibold truncate">{row.poSaNumber}</td>
                              <td className="py-3 px-3 text-[#32363a] font-semibold text-center">{row.poItem}</td>
                              <td className="py-3 px-3">
                                <div className="text-[#32363a] font-semibold text-[12px] truncate">{row.materialNumber}</div>
                                <div className="text-[#6a6d70] text-[11px] mt-0.5 truncate">{row.materialName}</div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="text-[#32363a] font-semibold text-[12px]">{row.plantCode}</div>
                                <div className="text-[#6a6d70] text-[11px] mt-0.5 truncate">{row.plantName}</div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="text-[#32363a] font-semibold text-[12px]">{row.vendorCode}</div>
                                <div className="text-[#6a6d70] text-[11px] mt-0.5 truncate">{row.vendorName}</div>
                              </td>
                              <td className="py-3 px-3">
                                {row.challanNo
                                  ? <span className="px-2 py-0.5 bg-[#f0f4f8] text-[#32363a] rounded text-[11px] font-medium">{row.challanNo}</span>
                                  : <span className="text-[#94a3b8] text-[12px]">—</span>
                                }
                              </td>
                              <td className="py-3 px-3 text-[#32363a] text-[12px]">
                                <div className="flex items-center gap-1">
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#6a6d70] flex-shrink-0">
                                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                                  </svg>
                                  <span className="truncate">{row.expectedShipmentDate}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-[#32363a] text-[12px]">
                                <div className="flex items-center gap-1">
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#6a6d70] flex-shrink-0">
                                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                                  </svg>
                                  <span className="truncate">{row.deliveryDate}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <span className="font-semibold text-[#32363a]">{row.poQty.toLocaleString()}</span>
                                <span className="text-[#6a6d70] text-[11px] ml-1">{row.poUnit}</span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <span className="font-semibold text-[#32363a]">{row.confirmedQty.toLocaleString()}</span>
                                <span className="text-[#6a6d70] text-[11px] ml-1">{row.confirmedUnit}</span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <span className={`font-semibold ${row.deliveredQty > 0 ? 'text-[#107e3e]' : 'text-[#6a6d70]'}`}>
                                  {row.deliveredQty.toLocaleString()}
                                </span>
                                <span className="text-[#6a6d70] text-[11px] ml-1">{row.deliveredUnit}</span>
                              </td>
                              <td className="py-3 px-3 text-right font-semibold text-[#32363a]">
                                {row.asnCreated.toLocaleString()}
                              </td>
                              <td className="py-3 px-3 text-right">
                                {adherence === null ? (
                                  <span className="text-[#94a3b8] text-[12px]">—</span>
                                ) : (
                                  <span className={`inline-flex items-center justify-end gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold tabular-nums ${adherenceBg} ${adherenceColor}`}>
                                    {adherence === 0
                                      ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>
                                      : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                    }
                                    {adherence.toFixed(1)}%
                                  </span>
                                )}
                              </td>
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