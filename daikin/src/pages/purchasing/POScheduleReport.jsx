import { useState, useMemo, useEffect, useRef } from 'react'
import PageLayout from '../../layouts/PageLayout.jsx'
import ReactDOM from 'react-dom'
import { POScheduleReportApi, toSapDate, fromSapDateDisplay } from '../../services/poScheduleService.js'

// ═══════════════════════════════════════════════════════════════
// MOCK DATA — remove when backend is live
// ═══════════════════════════════════════════════════════════════
const USE_MOCK = false

const MOCK_VENDORS = [
  { code: '401122', name: 'Kunstocom(India) Ltd', label: '401122 — Kunstocom(India) Ltd' },
  { code: '401155', name: 'ABC Components Ltd', label: '401155 — ABC Components Ltd' },
  { code: '401199', name: 'XYZ Compressors Pvt Ltd', label: '401199 — XYZ Compressors Pvt Ltd' },
  { code: '402946', name: 'FUJITA ENGINEERING INDIA PRIVATE LI', label: '402946 — FUJITA ENGINEERING INDIA' },
]
const MOCK_PO_NUMBERS = [
  { code: '7000037139', label: '7000037139' },
  { code: '7000037138', label: '7000037138' },
  { code: '7000037140', label: '7000037140' },
  { code: '7000037141', label: '7000037141' },
  { code: '7000037142', label: '7000037142' },
  { code: '9901000798', label: '9901000798' },
]
const MOCK_MATERIALS = [
  { code: '1P302790-1 G', label: 'LEFT SIDE PANEL(RESIN)' },
  { code: '2P438825-1 D', label: 'INDICATION LAMP COVER' },
  { code: '3P512010-2 A', label: 'FRONT GRILLE ASSY' },
  { code: '4C100230-1', label: 'COMPRESSOR ASSY R32' },
  { code: '5P198710-3 B', label: 'PCB ASSY MAIN' },
  { code: '1P482326-1 B', label: 'THERMAL INSULATION(REAR-1)' },
]
const MOCK_PLANTS = [
  { code: 'NMR', name: 'FIEM Industries Limited - NMR', label: 'NMR — FIEM Industries' },
  { code: 'SR01', name: 'Sri City FG', label: 'SR01 — Sri City FG' },
  { code: 'RND', name: 'Daikin India -RND', label: 'RND — Daikin India RND' },
]

const MOCK_REPORT_ROWS = [
  {
    poSaNumber: '7000037139', poItem: '10', scheduleLineNo: '1',
    materialNumber: '1P302790-1 G', materialName: 'LEFT SIDE PANEL(RESIN)',
    plantCode: 'NMR', plantName: 'FIEM Industries Limited - NMR',
    vendorCode: '401122', vendorName: 'Kunstocom(India) Ltd',
    challanNo: '', expectedShipmentDate: 'May 19, 2026', deliveryDate: 'May 19, 2026',
    poQty: 1500, poUnit: 'NO', confirmedQty: 1500, deliveredQty: 0, asnCreated: 48,
    pendingAsnQty: 1452, pendingConfirmQty: 0, purchaseGroup: 'SRI', docType: 'ZSR1',
    netPrice: '1000.00', status: 'Not Started', poType: 'Purchase Order',
  },
  {
    poSaNumber: '7000037138', poItem: '10', scheduleLineNo: '1',
    materialNumber: '1P302790-1 G', materialName: 'LEFT SIDE PANEL(RESIN)',
    plantCode: 'NMR', plantName: 'FIEM Industries Limited - NMR',
    vendorCode: '401122', vendorName: 'Kunstocom(India) Ltd',
    challanNo: '', expectedShipmentDate: 'May 19, 2026', deliveryDate: 'May 19, 2026',
    poQty: 1500, poUnit: 'NO', confirmedQty: 1500, deliveredQty: 0, asnCreated: 40,
    pendingAsnQty: 1460, pendingConfirmQty: 0, purchaseGroup: 'SRI', docType: 'ZSR1',
    netPrice: '1000.00', status: 'Not Started', poType: 'Purchase Order',
  },
  {
    poSaNumber: '7000037138', poItem: '20', scheduleLineNo: '1',
    materialNumber: '2P438825-1 D', materialName: 'INDICATION LAMP COVER',
    plantCode: 'NMR', plantName: 'FIEM Industries Limited - NMR',
    vendorCode: '401122', vendorName: 'Kunstocom(India) Ltd',
    challanNo: '', expectedShipmentDate: 'May 19, 2026', deliveryDate: 'May 19, 2026',
    poQty: 1000, poUnit: 'NO', confirmedQty: 1000, deliveredQty: 0, asnCreated: 20,
    pendingAsnQty: 980, pendingConfirmQty: 0, purchaseGroup: 'NMR', docType: 'ZNM1',
    netPrice: '500.00', status: 'Not Started', poType: 'Purchase Order',
  },
  {
    poSaNumber: '7000037140', poItem: '10', scheduleLineNo: '1',
    materialNumber: '3P512010-2 A', materialName: 'FRONT GRILLE ASSY',
    plantCode: 'SR01', plantName: 'Sri City FG',
    vendorCode: '401155', vendorName: 'ABC Components Ltd',
    challanNo: 'CH-2026-001', expectedShipmentDate: 'May 20, 2026', deliveryDate: 'May 21, 2026',
    poQty: 800, poUnit: 'NO', confirmedQty: 800, deliveredQty: 400, asnCreated: 12,
    pendingAsnQty: 388, pendingConfirmQty: 0, purchaseGroup: 'SRI', docType: 'ZSR1',
    netPrice: '750.00', status: 'In Progress', poType: 'Purchase Order',
  },
  {
    poSaNumber: '7000037141', poItem: '10', scheduleLineNo: '1',
    materialNumber: '4C100230-1', materialName: 'COMPRESSOR ASSY R32',
    plantCode: 'NMR', plantName: 'FIEM Industries Limited - NMR',
    vendorCode: '401199', vendorName: 'XYZ Compressors Pvt Ltd',
    challanNo: 'CH-2026-002', expectedShipmentDate: 'May 18, 2026', deliveryDate: 'May 19, 2026',
    poQty: 200, poUnit: 'NO', confirmedQty: 200, deliveredQty: 200, asnCreated: 5,
    pendingAsnQty: 0, pendingConfirmQty: 0, purchaseGroup: 'NMR', docType: 'ZNM1',
    netPrice: '12500.00', status: 'Completed', poType: 'Scheduling Agreement',
  },
  {
    poSaNumber: '9901000798', poItem: '10', scheduleLineNo: '1',
    materialNumber: '1P482326-1 B', materialName: 'THERMAL INSULATION(REAR-1)',
    plantCode: 'SR01', plantName: 'Sri City FG',
    vendorCode: '402946', vendorName: 'FUJITA ENGINEERING INDIA PRIVATE LI',
    challanNo: '', expectedShipmentDate: 'Jan 02, 2026', deliveryDate: 'Jan 02, 2026',
    poQty: 150, poUnit: 'NO', confirmedQty: 0, deliveredQty: 0, asnCreated: 0,
    pendingAsnQty: 150, pendingConfirmQty: 150, purchaseGroup: 'SRI', docType: 'ZSR1',
    netPrice: '1000.00', status: 'Not Started', poType: 'Purchase Order',
  },
]

// ═══════════════════════════════════════════════════════════════
// MOCK API wrapper
// ═══════════════════════════════════════════════════════════════
const api = {
  async fetchVendors(poType) {
    if (USE_MOCK) { await new Promise(r => setTimeout(r, 80)); return MOCK_VENDORS }
    return POScheduleReportApi.fetchVendors(poType)
  },
  async fetchPONumbers(poType) {
    if (USE_MOCK) { await new Promise(r => setTimeout(r, 60)); return MOCK_PO_NUMBERS }
    return POScheduleReportApi.fetchPONumbers(poType)
  },
  async fetchMaterials(poType, ebeln) {
    if (USE_MOCK) { await new Promise(r => setTimeout(r, 60)); return MOCK_MATERIALS }
    return POScheduleReportApi.fetchMaterials(poType, ebeln)
  },
  async fetchPlants(poType, ebeln, matnr) {
    if (USE_MOCK) { await new Promise(r => setTimeout(r, 60)); return MOCK_PLANTS }
    return POScheduleReportApi.fetchPlants(poType, ebeln, matnr)
  },
  async fetchReport(params) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
      return MOCK_REPORT_ROWS.filter(row => {
        const matchPoType   = !params.poType || params.poType === 'All' || row.poType === params.poType
        const matchVendor   = !params.vendor || row.vendorName.toLowerCase().includes(params.vendor.toLowerCase()) || row.vendorCode.includes(params.vendor)
        const matchPoNumber = !params.poNumber || row.poSaNumber.includes(params.poNumber)
        const matchMaterial = !params.material || row.materialNumber.toLowerCase().includes(params.material.toLowerCase()) || row.materialName.toLowerCase().includes(params.material.toLowerCase())
        const matchPlant    = !params.plant || row.plantCode.toLowerCase().includes(params.plant.toLowerCase()) || row.plantName.toLowerCase().includes(params.plant.toLowerCase())
        return matchPoType && matchVendor && matchPoNumber && matchMaterial && matchPlant
      })
    }
    const typeMap = { 'Purchase Order': 'P', 'Scheduling Agreement': 'S', 'All': '' }
    return POScheduleReportApi.fetchReport({
      fDate: params.deliveryDateFrom ? toSapDate(params.deliveryDateFrom) : '',
      tDate: params.deliveryDateTo ? toSapDate(params.deliveryDateTo) : '',
      type: typeMap[params.poType] || '',
      lifnr: params.vendor,
      ebeln: params.poNumber,
      matnr: params.material,
      werks: params.plant,
    })
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
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
}
const isoToDdmmyyyy = (s) => {
  if (!s) return ''
  const [y, m, d] = s.split('-')
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
// ADHERENCE %
// ═══════════════════════════════════════════════════════════════
const calcAdherence = (poQty, deliveredQty) => {
  if (!poQty || poQty === 0) return null
  return ((poQty - deliveredQty) / poQty) * 100
}

// ═══════════════════════════════════════════════════════════════
// VALUE HELP FIELD
// ═══════════════════════════════════════════════════════════════
function ValueHelpField({ options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos]   = useState({ top: 0, left: 0, width: 0 })
  const btnRef  = useRef(null)
  const dropRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (btnRef.current && !btnRef.current.closest('[data-vh-root]').contains(e.target) &&
          dropRef.current && !dropRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleOpen = () => {
    const rect = btnRef.current.closest('[data-vh-root]').getBoundingClientRect()
    setPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: rect.width })
    setOpen(true)
  }

  const filtered = useMemo(() => {
    if (!value) return options
    const q = value.toLowerCase()
    return options.filter(o => o.code.toLowerCase().includes(q) || (o.label && o.label.toLowerCase().includes(q)))
  }, [options, value])

  return (
    <div data-vh-root className="relative">
      <div className="flex h-10 border border-[#d9d9d9] rounded-lg overflow-hidden focus-within:border-[#0a6ed1] focus-within:ring-2 focus-within:ring-[#0a6ed1]/20 transition-all bg-white">
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="flex-1 pl-3 pr-2 text-[14px] bg-transparent focus:outline-none min-w-0" />
        <button ref={btnRef} type="button" onClick={handleOpen}
          className="flex-shrink-0 w-9 flex items-center justify-center border-l border-[#e5e5e5] text-[#6a6d70] hover:text-[#0a6ed1] hover:bg-[#f0f7ff] transition-all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
      </div>
      {open && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div ref={dropRef}
          style={{ position: 'absolute', top: pos.top, left: pos.left, width: Math.max(pos.width, 240), zIndex: 9999, animation: 'scaleIn 0.18s ease-out both' }}
          className="bg-white border border-[#d9d9d9] rounded-lg shadow-xl">
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0
              ? <div className="py-6 text-center text-[13px] text-[#6a6d70]">No options</div>
              : filtered.map(opt => (
                <button key={opt.code} onClick={() => { onChange(opt.code); setOpen(false) }}
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

  // Dropdown option stores — loaded from backend
  const [vendorOpts,   setVendorOpts]   = useState([])
  const [poOpts,       setPoOpts]       = useState([])
  const [materialOpts, setMaterialOpts] = useState([])
  const [plantOpts,    setPlantOpts]    = useState([])

  const [rows,        setRows]        = useState([])
  const [loading,     setLoading]     = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error,       setError]       = useState(null)

  // Load dropdown options on mount
  useEffect(() => {
    const pt = poType === 'Purchase Order' ? 'P' : poType === 'Scheduling Agreement' ? 'S' : 'P'
    api.fetchVendors(pt).then(setVendorOpts).catch(console.error)
    api.fetchPONumbers(pt).then(setPoOpts).catch(console.error)
    api.fetchMaterials(pt, poNumber).then(setMaterialOpts).catch(console.error)
    api.fetchPlants(pt, poNumber, material).then(setPlantOpts).catch(console.error)
  }, [poType, poNumber, material])

  const dateError = useMemo(() => {
    if (!deliveryDateFrom || !deliveryDateTo) return null
    const f = parseDdmmyyyy(deliveryDateFrom)
    const t = parseDdmmyyyy(deliveryDateTo)
    if (!f || !t) return null
    return f > t ? 'From Date must be earlier than To Date' : null
  }, [deliveryDateFrom, deliveryDateTo])

  const handleGo = async () => {
    if (dateError) return
    setLoading(true); setError(null)
    try {
      const data = await api.fetchReport({
        deliveryDateFrom: ddmmyyyyToIso(deliveryDateFrom),
        deliveryDateTo: ddmmyyyyToIso(deliveryDateTo),
        poType, vendor, poNumber, material, plant,
      })
      setRows(data); setHasSearched(true)
    } catch (err) {
      setError(err.message || 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setDeliveryDateFrom(isoToDdmmyyyy(todayIso()))
    setDeliveryDateTo(isoToDdmmyyyy(todayIso()))
    setPoType('Purchase Order'); setVendor(''); setPoNumber(''); setMaterial(''); setPlant('')
    setRows([]); setHasSearched(false); setError(null)
  }

  return (
    <PageLayout>
      <style>{`
        @keyframes fadeIn    { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
        @keyframes scaleIn   { from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)} }
        @keyframes slideInUp { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        .anim-fade{animation:fadeIn .35s ease-out both}
        .anim-scale{animation:scaleIn .25s ease-out both}
        .anim-slide-up{animation:slideInUp .4s ease-out both}
        .row-stagger>*{animation:fadeIn .4s ease-out both}
        .row-stagger>*:nth-child(1){animation-delay:.02s}
        .row-stagger>*:nth-child(2){animation-delay:.06s}
        .row-stagger>*:nth-child(3){animation-delay:.10s}
        .row-stagger>*:nth-child(4){animation-delay:.14s}
        .row-stagger>*:nth-child(5){animation-delay:.18s}
        .row-stagger>*:nth-child(6){animation-delay:.22s}
      `}</style>

      <div className="bg-[#f5f6f7] min-h-[calc(100vh-104px)]">
        <main className="flex flex-col" style={{ minHeight: 'calc(100vh - 220px)' }}>

          {/* Header */}
          <div className="px-4 sm:px-6 lg:px-10 pt-5 sm:pt-7 pb-4 border-b border-[#e5e5e5] bg-gradient-to-b from-[#fafbfc] to-white flex-shrink-0">
            <div className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">
              Company Code: DSAL (FIEM Industries Limited)
            </div>
            <h2 className="text-[20px] sm:text-[24px] font-bold text-[#32363a] tracking-tight">PO Schedule Report</h2>
          </div>

          {/* Filters */}
          <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-5 border-b border-[#e5e5e5] bg-white flex-shrink-0 anim-fade">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-3">
              <div>
                <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">Delivery Date From <span className="text-[#cc1c14]">*</span></label>
                <input type="date" value={ddmmyyyyToIso(deliveryDateFrom)} onChange={e => setDeliveryDateFrom(isoToDdmmyyyy(e.target.value))} max={deliveryDateTo ? ddmmyyyyToIso(deliveryDateTo) : undefined}
                  className={`w-full h-10 pl-3 pr-2 text-[14px] border rounded-lg bg-white focus:outline-none focus:ring-2 transition-all ${dateError ? 'border-[#cc1c14] focus:ring-[#cc1c14]/20' : 'border-[#d9d9d9] focus:border-[#0a6ed1] focus:ring-[#0a6ed1]/20'}`} />
              </div>
              <div>
                <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">Delivery Date To <span className="text-[#cc1c14]">*</span></label>
                <input type="date" value={ddmmyyyyToIso(deliveryDateTo)} onChange={e => setDeliveryDateTo(isoToDdmmyyyy(e.target.value))} min={deliveryDateFrom ? ddmmyyyyToIso(deliveryDateFrom) : undefined}
                  className={`w-full h-10 pl-3 pr-2 text-[14px] border rounded-lg bg-white focus:outline-none focus:ring-2 transition-all ${dateError ? 'border-[#cc1c14] focus:ring-[#cc1c14]/20' : 'border-[#d9d9d9] focus:border-[#0a6ed1] focus:ring-[#0a6ed1]/20'}`} />
              </div>
              <div>
                <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">PO Type</label>
                <select value={poType} onChange={e => setPoType(e.target.value)}
                  className="w-full h-10 pl-3 pr-8 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all appearance-none cursor-pointer">
                  <option value="All">All</option>
                  <option value="Purchase Order">Purchase Order</option>
                  <option value="Scheduling Agreement">Scheduling Agreement</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">Vendor</label>
                <ValueHelpField options={vendorOpts} value={vendor} onChange={setVendor} placeholder="Code or name" />
              </div>
              <div>
                <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">PO Number</label>
                <ValueHelpField options={poOpts} value={poNumber} onChange={setPoNumber} placeholder="e.g. 7000037139" />
              </div>
              <div>
                <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">Material</label>
                <ValueHelpField options={materialOpts} value={material} onChange={setMaterial} placeholder="Number or name" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-end">
              <div className="w-full sm:w-56">
                <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">Plant</label>
                <ValueHelpField options={plantOpts} value={plant} onChange={setPlant} placeholder="Code or name" />
              </div>
              <div className="hidden sm:block flex-1" />
              <div className="flex gap-2 w-full sm:w-auto sm:self-end">
                <button onClick={handleGo} disabled={loading || !!dateError || !deliveryDateFrom || !deliveryDateTo}
                  className="flex items-center gap-2 px-6 h-10 text-[14px] font-semibold text-white bg-[#0a6ed1] border border-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                  {loading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Loading…</> : <>Go</>}
                </button>
                <button onClick={handleClear}
                  className="flex items-center gap-2 px-5 h-10 text-[14px] font-semibold text-[#cc1c14] bg-[#fce8e6] border border-[#fce8e6] rounded-lg hover:bg-[#fad6d3] hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap">
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

          {/* Results */}
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
                  <div className="text-[13px]">Set filters and click <strong>Go</strong></div>
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
                <div className="px-4 py-2.5 border-b border-[#e5e5e5] bg-[#fafbfc] flex-shrink-0">
                  <span className="text-[13px] text-[#6a6d70]">
                    <span className="font-semibold text-[#32363a]">{rows.length}</span> record{rows.length !== 1 ? 's' : ''}
                  </span>
                </div>

                
                <div className="overflow-auto flex-1" style={{ minHeight: 0 }}>
                  <table className="w-full text-[13px]" style={{ minWidth: '1400px', borderCollapse: 'collapse' }}>
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-gradient-to-b from-[#fafbfc] to-[#f5f6f7] text-[#6a6d70]">
                        {[
                          { label: 'PO/SA Number',    w: 'w-[120px]' },
                          { label: 'PO Item',         w: 'w-[70px]'  },
                          { label: 'Material',        w: 'w-[160px]' },
                          { label: 'Plant',           w: 'w-[110px]' },
                          { label: 'Vendor',          w: 'w-[130px]' },
                          { label: 'Challan No.',     w: 'w-[100px]' },
                          { label: 'Exp. Ship Date',  w: 'w-[110px]' },
                          { label: 'Delivery Date',   w: 'w-[100px]' },
                          { label: 'PO Qty',          w: 'w-[80px]'  },
                          { label: 'Conf. Qty',       w: 'w-[80px]'  },
                          { label: 'Del. Qty',        w: 'w-[80px]'  },
                          { label: 'ASN Created',     w: 'w-[90px]'  },
                          { label: 'Pending ASN',     w: 'w-[90px]'  },
                          { label: 'Pending Confirm', w: 'w-[110px]' },
                          { label: 'Pur. Group',      w: 'w-[90px]'  },
                          { label: 'Doc Type',        w: 'w-[80px]'  },
                          { label: 'Adherence %',     w: 'w-[90px]'  },
                        ].map(({ label, w }) => (
                          <th key={label} className={`text-left font-semibold py-3 px-3 text-[11px] uppercase tracking-wider border-b border-[#e5e5e5] whitespace-nowrap ${w}`}>
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="row-stagger">
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={17} className="py-12 text-center text-[14px] text-[#6a6d70]">No records found</td>
                        </tr>
                      ) : rows.map((row, idx) => {
                        const adh = calcAdherence(row.poQty, row.deliveredQty)
                        const adhColor = adh === null ? 'text-[#6a6d70]' : adh === 0 ? 'text-[#107e3e]' : adh <= 25 ? 'text-[#b45309]' : 'text-[#cc1c14]'
                        const adhBg    = adh === null ? 'bg-[#f5f6f7]'  : adh === 0 ? 'bg-[#e8f5ec]'  : adh <= 25 ? 'bg-[#fef7e6]'  : 'bg-[#fce8e6]'
                        return (
                          <tr key={`${row.poSaNumber}-${row.poItem}-${idx}`}
                            className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc] transition-colors">

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
                                : <span className="text-[#94a3b8] text-[12px]">—</span>}
                            </td>

                            <td className="py-3 px-3 text-[#32363a] text-[12px]">{row.expectedShipmentDate}</td>
                            <td className="py-3 px-3 text-[#32363a] text-[12px]">{row.deliveryDate}</td>

                            <td className="py-3 px-3 text-right">
                              <span className="font-semibold text-[#32363a]">{row.poQty.toLocaleString()}</span>
                              <span className="text-[#6a6d70] text-[11px] ml-1">{row.poUnit}</span>
                            </td>

                            <td className="py-3 px-3 text-right">
                              <span className="font-semibold text-[#32363a]">{row.confirmedQty.toLocaleString()}</span>
                            </td>

                            <td className="py-3 px-3 text-right">
                              <span className={`font-semibold ${row.deliveredQty > 0 ? 'text-[#107e3e]' : 'text-[#6a6d70]'}`}>
                                {row.deliveredQty.toLocaleString()}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-right font-semibold text-[#32363a]">
                              {row.asnCreated.toLocaleString()}
                            </td>

                            <td className="py-3 px-3 text-right">
                              <span className={`font-semibold tabular-nums ${row.pendingAsnQty > 0 ? 'text-[#b45309]' : 'text-[#6a6d70]'}`}>
                                {row.pendingAsnQty.toLocaleString()}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-right">
                              <span className={`font-semibold tabular-nums ${row.pendingConfirmQty > 0 ? 'text-[#cc1c14]' : 'text-[#6a6d70]'}`}>
                                {row.pendingConfirmQty.toLocaleString()}
                              </span>
                            </td>

                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 bg-[#f0f4f8] text-[#32363a] rounded text-[11px] font-semibold">
                                {row.purchaseGroup || '—'}
                              </span>
                            </td>

                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 bg-[#ebf5ff] text-[#0a6ed1] rounded text-[11px] font-semibold">
                                {row.docType || '—'}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-right">
                              {adh === null ? (
                                <span className="text-[#94a3b8] text-[12px]">—</span>
                              ) : (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums ${adhBg} ${adhColor}`}>
                                  {adh === 0
                                    ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>
                                    : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
                                  }
                                  {adh.toFixed(1)}%
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
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