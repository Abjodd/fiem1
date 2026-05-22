import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import PageLayout from '../../layouts/PageLayout.jsx'
import { useNavigate } from 'react-router-dom'

// ═══════════════════════════════════════════════════════════════
// DUMMY DATA
// ═══════════════════════════════════════════════════════════════
const MOCK_ROWS = [
  {
    grnNumber:          '5000003466',
    postingDate:        'Apr 28, 2026',
    gateInNo:           '4500000476',
    ibdNumber:          '0180001473',
    posa:               '5100000248',
    shipmentNo:         '3000000620/2026',
    invoiceNo:          '897999',
    invoiceDate:        'Apr 28, 2026',
    asnNumber:          '1200000059/2026',
    asnQty:             2000.000,
    asnQtyUnit:         'EA',
    asnCrDate:          'Apr 28, 2026',
    grQty:              2000.000,
    grQtyUnit:          'EA',
    materialCode:       'YS4U 11A121AA',
    materialName:       'PLUNGER-STARTING MOTOR S',
    vehicleNo:          '',
    plant:              '1000',
    plantLoc:           'KRL',
    asnCrBy:            'JSHESHAD@SON',
    grnBy:              'JSHESHAD@SONACOMSTAR.COM',
    stLoc:              'SAPP',
    trNo:               '253',
    toNo:               '1235',
    packagingComment:   '',
    packingMaterialType:'EXP',
    packingMaterialQty: 0.000,
    shortQty:           0.000,
    remarks:            '',
  },
  {
    grnNumber:          '5000003466',
    postingDate:        'Apr 28, 2026',
    gateInNo:           '4500000476',
    ibdNumber:          '0180001473',
    posa:               '5100000248',
    shipmentNo:         '3000000620/2026',
    invoiceNo:          '897999',
    invoiceDate:        'Apr 28, 2026',
    asnNumber:          '1200000059/2026',
    asnQty:             1900.000,
    asnQtyUnit:         'EA',
    asnCrDate:          'Apr 28, 2026',
    grQty:              1900.000,
    grQtyUnit:          'EA',
    materialCode:       'YS4U 11448BA',
    materialName:       'BEARING - STR MTR DRV',
    vehicleNo:          '',
    plant:              '1000',
    plantLoc:           'KRL',
    asnCrBy:            'JSHESHAD@SON',
    grnBy:              'JSHESHAD@SONACOMSTAR.COM',
    stLoc:              'SAPP',
    trNo:               '253',
    toNo:               '1235',
    packagingComment:   '',
    packingMaterialType:'EXP',
    packingMaterialQty: 0.000,
    shortQty:           0.000,
    remarks:            '',
  },
  {
    grnNumber:          '5000003466',
    postingDate:        'Apr 28, 2026',
    gateInNo:           '4500000476',
    ibdNumber:          '0180001473',
    posa:               '5100000248',
    shipmentNo:         '3000000620/2026',
    invoiceNo:          '897999',
    invoiceDate:        'Apr 28, 2026',
    asnNumber:          '1200000059/2026',
    asnQty:             2100.000,
    asnQtyUnit:         'EA',
    asnCrDate:          'Apr 28, 2026',
    grQty:              100.000,
    grQtyUnit:          'EA',
    materialCode:       'YS4U 11448AA',
    materialName:       'BEARING - STR MTR DRV',
    vehicleNo:          '',
    plant:              '1000',
    plantLoc:           'KRL',
    asnCrBy:            'JSHESHAD@SON',
    grnBy:              'JSHESHAD@SONACOMSTAR.COM',
    stLoc:              'SAPP',
    trNo:               '253',
    toNo:               '1235',
    packagingComment:   '',
    packingMaterialType:'EXP',
    packingMaterialQty: 0.000,
    shortQty:           0.000,
    remarks:            '',
  },
  {
    grnNumber:          '5000003466',
    postingDate:        'Apr 28, 2026',
    gateInNo:           '4500000476',
    ibdNumber:          '0180001473',
    posa:               '5100000248',
    shipmentNo:         '3000000620/2026',
    invoiceNo:          '897999',
    invoiceDate:        'Apr 28, 2026',
    asnNumber:          '1200000059/2026',
    asnQty:             2100.000,
    asnQtyUnit:         'EA',
    asnCrDate:          'Apr 28, 2026',
    grQty:              2000.000,
    grQtyUnit:          'EA',
    materialCode:       'YS4U 11448AA',
    materialName:       'BEARING - STR MTR DRV',
    vehicleNo:          '',
    plant:              '1000',
    plantLoc:           'KRL',
    asnCrBy:            'JSHESHAD@SON',
    grnBy:              'JSHESHAD@SONACOMSTAR.COM',
    stLoc:              'SAPP',
    trNo:               '253',
    toNo:               '1235',
    packagingComment:   '',
    packingMaterialType:'EXP',
    packingMaterialQty: 0.000,
    shortQty:           0.000,
    remarks:            '',
  },
  {
    grnNumber:          '5000003465',
    postingDate:        'Apr 27, 2026',
    gateInNo:           '4500000472',
    ibdNumber:          '0180001472',
    posa:               '5100000146',
    shipmentNo:         '3000000619/2026',
    invoiceNo:          '79698',
    invoiceDate:        'Apr 27, 2026',
    asnNumber:          '1200000058/2026',
    asnQty:             1500.000,
    asnQtyUnit:         'EA',
    asnCrDate:          'Apr 27, 2026',
    grQty:              1500.000,
    grQtyUnit:          'EA',
    materialCode:       'YS4U 11A100BA',
    materialName:       'MOTOR ASSY - STARTER',
    vehicleNo:          '',
    plant:              '1000',
    plantLoc:           'KRL',
    asnCrBy:            'JSHESHAD@SON',
    grnBy:              'JSHESHAD@SONACOMSTAR.COM',
    stLoc:              'SAPP',
    trNo:               '252',
    toNo:               '1234',
    packagingComment:   '',
    packingMaterialType:'EXP',
    packingMaterialQty: 0.000,
    shortQty:           0.000,
    remarks:            '',
  },
]

// Value help options (replace with API calls in prod)
const VALUE_HELP_ASN    = [{ code: '1200000059/2026', label: '' }, { code: '1200000058/2026', label: '' }, { code: '1200000057/2026', label: '' }]
const VALUE_HELP_GRN    = [{ code: '5000003466', label: '' }, { code: '5000003465', label: '' }, { code: '5000003464', label: '' }]
const VALUE_HELP_PLANT  = [{ code: '1000', label: 'KRL - Kireei Plant' }, { code: '2000', label: 'NMR - Neemrana Plant' }]
const VALUE_HELP_MAT    = [{ code: 'YS4U 11A121AA', label: 'PLUNGER-STARTING MOTOR S' }, { code: 'YS4U 11448BA', label: 'BEARING - STR MTR DRV' }, { code: 'YS4U 11448AA', label: 'BEARING - STR MTR DRV' }]
const VALUE_HELP_SHIP   = [{ code: '3000000620/2026', label: '' }, { code: '3000000619/2026', label: '' }, { code: '3000000618/2026', label: '' }]
const VALUE_HELP_IBD    = [{ code: '0180001473', label: '' }, { code: '0180001472', label: '' }, { code: '0180001471', label: '' }]

// ═══════════════════════════════════════════════════════════════
// API STRUCTURE — swap USE_MOCK = false and wire real endpoints
// ═══════════════════════════════════════════════════════════════
const API_BASE_URL = '/api/v1'
const USE_MOCK = true

const GateInMIGOApi = {
  async fetchReport({ postingStartDate, postingEndDate, asnNo, grnNo, plant, material, shipmentNo, ibdNumber } = {}) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 450))
      let rows = [...MOCK_ROWS]
      if (asnNo)      rows = rows.filter(r => r.asnNumber.toLowerCase().includes(asnNo.toLowerCase()))
      if (grnNo)      rows = rows.filter(r => r.grnNumber.toLowerCase().includes(grnNo.toLowerCase()))
      if (plant)      rows = rows.filter(r => r.plant.includes(plant))
      if (material)   rows = rows.filter(r => r.materialCode.toLowerCase().includes(material.toLowerCase()) || r.materialName.toLowerCase().includes(material.toLowerCase()))
      if (shipmentNo) rows = rows.filter(r => r.shipmentNo.toLowerCase().includes(shipmentNo.toLowerCase()))
      if (ibdNumber)  rows = rows.filter(r => r.ibdNumber.toLowerCase().includes(ibdNumber.toLowerCase()))
      return rows
    }
    const params = new URLSearchParams()
    if (postingStartDate) params.set('postingStartDate', postingStartDate)
    if (postingEndDate)   params.set('postingEndDate',   postingEndDate)
    if (asnNo)            params.set('asnNo',            asnNo)
    if (grnNo)            params.set('grnNo',            grnNo)
    if (plant)            params.set('plant',            plant)
    if (material)         params.set('material',         material)
    if (shipmentNo)       params.set('shipmentNo',       shipmentNo)
    if (ibdNumber)        params.set('ibdNumber',        ibdNumber)
    const res = await fetch(`${API_BASE_URL}/gate-in-migo-report?${params}`)
    if (!res.ok) throw new Error('Failed to fetch Gate-In to MIGO report')
    return res.json()
  },

  async fetchValueHelp(field, query = '') {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 80))
      const map = { asn: VALUE_HELP_ASN, grn: VALUE_HELP_GRN, plant: VALUE_HELP_PLANT, material: VALUE_HELP_MAT, shipment: VALUE_HELP_SHIP, ibd: VALUE_HELP_IBD }
      const opts = map[field] || []
      if (!query) return opts
      const q = query.toLowerCase()
      return opts.filter(o => o.code.toLowerCase().includes(q) || (o.label && o.label.toLowerCase().includes(q)))
    }
    const res = await fetch(`${API_BASE_URL}/value-help/${field}?q=${encodeURIComponent(query)}`)
    if (!res.ok) throw new Error(`Failed to fetch value help for ${field}`)
    return res.json()
  },
}

// ═══════════════════════════════════════════════════════════════
// DATE HELPERS
// ═══════════════════════════════════════════════════════════════
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

// Default start = 30 days ago
const thirtyDaysAgoIso = () => {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const getExportFilename = () => {
  const d = new Date()
  return `GoodsReceiptReport_${MONTHS_SHORT[d.getMonth()]}_${String(d.getDate()).padStart(2,'0')}_${d.getFullYear()}.xlsx`
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
        <div className="px-5 py-4 border-b border-[#e5e5e5]">
          <h3 className="text-[16px] font-semibold text-[#32363a]">{title}</h3>
        </div>

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

// ═══════════════════════════════════════════════════════════════
// VALUE HELP INPUT FIELD (SAP-style with copy icon button)
// ═══════════════════════════════════════════════════════════════
function ValueHelpInput({ label, placeholder, value, onOpen, required }) {
  return (
    <div>
      {label && (
        <label className="block text-[12px] text-[#6a6d70] mb-1 font-semibold">
          {label}{required && <span className="text-[#cc1c14] ml-0.5">*</span>}
        </label>
      )}
      <div className="flex h-9 border border-[#d9d9d9] rounded-lg overflow-hidden bg-white focus-within:border-[#0a6ed1] focus-within:ring-2 focus-within:ring-[#0a6ed1]/20 transition-all">
        <div className="flex-1 flex items-center pl-3 pr-2 text-[13px] text-[#32363a] truncate min-w-0">
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
          className="flex-shrink-0 w-8 flex items-center justify-center border-l border-[#e5e5e5] text-[#6a6d70] hover:text-[#0a6ed1] hover:bg-[#f0f7ff] transition-all"
        >
          {/* SAP-style copy/selector icon */}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// DATE INPUT (consistent styling)
// ═══════════════════════════════════════════════════════════════
function DateInput({ label, value, onChange, required }) {
  return (
    <div>
      {label && (
        <label className="block text-[12px] text-[#6a6d70] mb-1 font-semibold">
          {label}{required && <span className="text-[#cc1c14] ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-9 pl-3 pr-8 text-[13px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all w-full"
        />
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2.5 top-3 text-[#6a6d70] pointer-events-none">
          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// COLUMN DEFINITIONS — single source of truth for table + export
// ═══════════════════════════════════════════════════════════════
const COLUMNS = [
  { key: 'grnNumber',          label: 'GRN Number',           width: 110, align: 'left'  },
  { key: 'postingDate',        label: 'Posting Date',         width: 100, align: 'left'  },
  { key: 'gateInNo',           label: 'Gate-In No.',          width: 110, align: 'left'  },
  { key: 'ibdNumber',          label: 'IBD Number',           width: 110, align: 'left'  },
  { key: 'posa',               label: 'PO/SA',                width: 110, align: 'left'  },
  { key: 'shipmentNo',         label: 'Shipment No',          width: 140, align: 'left'  },
  { key: 'invoiceNo',          label: 'Invoice No.',          width: 100, align: 'center'},
  { key: 'invoiceDate',        label: 'Invoice Date',         width: 100, align: 'left'  },
  { key: 'asnNumber',          label: 'ASN Number',           width: 145, align: 'left'  },
  { key: 'asnQty',             label: 'ASN Quantity',         width: 105, align: 'right' },
  { key: 'asnCrDate',          label: 'ASN Cr. Date',         width: 100, align: 'left'  },
  { key: 'grQty',              label: 'GR Quantity',          width: 105, align: 'right' },
  { key: 'material',           label: 'Material',             width: 190, align: 'left'  },
  { key: 'vehicleNo',          label: 'Vehicle No.',          width: 100, align: 'left'  },
  { key: 'plant',              label: 'Plant',                width: 80,  align: 'center'},
  { key: 'asnCrBy',            label: 'Asn Cr. By',          width: 140, align: 'left'  },
  { key: 'grnBy',              label: 'GRN By',               width: 180, align: 'left'  },
  { key: 'stLoc',              label: 'St. Loc.',             width: 75,  align: 'center'},
  { key: 'trNo',               label: 'TR No.',               width: 70,  align: 'center'},
  { key: 'toNo',               label: 'TO No.',               width: 70,  align: 'center'},
  { key: 'packagingComment',   label: 'Packaging Comment',    width: 140, align: 'left'  },
  { key: 'packingMaterialType','label': 'Packing Material Type', width: 140, align: 'left'},
  { key: 'packingMaterialQty', label: 'Packing Material Qty', width: 130, align: 'right' },
  { key: 'shortQty',           label: 'Short Qty',            width: 90,  align: 'right' },
  { key: 'remarks',            label: 'Remarks',              width: 130, align: 'left'  },
]

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function GateInMIGO() {
  // ── Filter state ──
  const [postingStartDate, setPostingStartDate] = useState(thirtyDaysAgoIso())
  const [postingEndDate,   setPostingEndDate]   = useState(todayIso())
  const [asnNo,            setAsnNo]            = useState('')
  const [grnNo,            setGrnNo]            = useState('')
  const [plant,            setPlant]            = useState('')
  const [material,         setMaterial]         = useState('')
  const [shipmentNo,       setShipmentNo]       = useState('')
  const [ibdNumber,        setIbdNumber]        = useState('')

  const companyCode = 'FIEM (FIEM Industries Limited)'

  // ── Filter bar visibility ──
  const [filterBarVisible, setFilterBarVisible] = useState(true)

  // ── Value help modal ──
  const [vhModal,   setVhModal]   = useState(null)  // null | 'asn' | 'grn' | 'plant' | 'material' | 'shipment' | 'ibd'
  const [vhOptions, setVhOptions] = useState([])
  const [vhLoading, setVhLoading] = useState(false)

  // ── Data state ──
  const [rows,        setRows]        = useState([])
  const [loading,     setLoading]     = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error,       setError]       = useState(null)

  // ── Export state ──
  const [exporting,       setExporting]       = useState(false)
  const [exportProgress,  setExportProgress]  = useState(0)
  const [exportTotal,     setExportTotal]     = useState(0)
  const exportCancelRef = useRef(false)

  // ── Open value help ──
  const openVh = async (field) => {
    setVhLoading(true)
    setVhModal(field)
    setVhOptions([])
    try {
      const opts = await GateInMIGOApi.fetchValueHelp(field, '')
      setVhOptions(opts)
    } catch { setVhOptions([]) }
    setVhLoading(false)
  }

  const handleVhSelect = (opt) => {
    const setters = { asn: setAsnNo, grn: setGrnNo, plant: setPlant, material: setMaterial, shipment: setShipmentNo, ibd: setIbdNumber }
    setters[vhModal]?.(opt.code)
    setVhModal(null)
  }

  const vhTitles = { asn: 'ASN No.', grn: 'GRN No.', plant: 'Plant', material: 'Material', shipment: 'Shipment Number', ibd: 'IBD Number' }

  // ── Go / fetch ──
  const handleGo = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await GateInMIGOApi.fetchReport({ postingStartDate, postingEndDate, asnNo, grnNo, plant, material, shipmentNo, ibdNumber })
      setRows(data)
      setHasSearched(true)
    } catch (err) {
      setError(err.message || 'Failed to fetch report')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setPostingStartDate(thirtyDaysAgoIso())
    setPostingEndDate(todayIso())
    setAsnNo(''); setGrnNo(''); setPlant(''); setMaterial(''); setShipmentNo(''); setIbdNumber('')
    setRows([]); setHasSearched(false); setError(null)
  }

  // ── Get cell value for a row ──
  const getCellValue = (row, colKey) => {
    switch (colKey) {
      case 'asnQty':  return `${row.asnQty.toFixed(3)} ${row.asnQtyUnit}`
      case 'grQty':   return `${row.grQty.toFixed(3)} ${row.grQtyUnit}`
      case 'material':return `${row.materialCode} — ${row.materialName}`
      case 'plant':   return `${row.plant}\n${row.plantLoc}`
      case 'packingMaterialQty': return row.packingMaterialQty.toFixed(3)
      case 'shortQty': return row.shortQty.toFixed(3)
      default: return row[colKey] ?? ''
    }
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
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')

      // Header row
      const headers = COLUMNS.map(c => c.label)

      // Data rows with progress
      const dataRows = []
      for (let i = 0; i < rows.length; i++) {
        if (exportCancelRef.current) break
        const row = rows[i]
        const cells = COLUMNS.map(col => {
          switch (col.key) {
            case 'asnQty':  return `${row.asnQty.toFixed(3)} ${row.asnQtyUnit}`
            case 'grQty':   return `${row.grQty.toFixed(3)} ${row.grQtyUnit}`
            case 'material':return `${row.materialCode} - ${row.materialName}`
            case 'plant':   return `${row.plant} / ${row.plantLoc}`
            case 'packingMaterialQty': return row.packingMaterialQty
            case 'shortQty': return row.shortQty
            default: return row[col.key] ?? ''
          }
        })
        dataRows.push(cells)
        setExportProgress(i + 1)
        await new Promise(r => setTimeout(r, 8))
      }

      if (exportCancelRef.current) return

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows])

      // Style header row bold + light blue fill
      const range = XLSX.utils.decode_range(ws['!ref'])
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellAddr = XLSX.utils.encode_cell({ r: 0, c: C })
        if (!ws[cellAddr]) continue
        ws[cellAddr].s = { font: { bold: true }, fill: { fgColor: { rgb: 'DDEEFF' } } }
      }

      // Column widths
      ws['!cols'] = COLUMNS.map(c => ({ wch: Math.round(c.width / 7) }))

      // Freeze first row
      ws['!freeze'] = { xSplit: 0, ySplit: 1 }

      XLSX.utils.book_append_sheet(wb, ws, 'GR Report')
      XLSX.writeFile(wb, getExportFilename())

      await new Promise(r => setTimeout(r, 600))
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
      setExportProgress(0)
    }
  }

  const totalColWidth = COLUMNS.reduce((s, c) => s + c.width, 0)

  return (
    <PageLayout>
      <style>{`
        @keyframes fadeIn    { from { opacity:0; transform:translateY(8px);  } to { opacity:1; transform:translateY(0);  } }
        @keyframes slideInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0);  } }
        @keyframes modalIn   { from { opacity:0; transform:scale(0.94);      } to { opacity:1; transform:scale(1);       } }
        .anim-fade     { animation: fadeIn    0.35s ease-out both; }
        .anim-slide-up { animation: slideInUp 0.4s  ease-out both; }
        .row-stagger > tr { animation: fadeIn 0.35s ease-out both; }
        .row-stagger > tr:nth-child(1)  { animation-delay:0.02s; }
        .row-stagger > tr:nth-child(2)  { animation-delay:0.05s; }
        .row-stagger > tr:nth-child(3)  { animation-delay:0.08s; }
        .row-stagger > tr:nth-child(4)  { animation-delay:0.11s; }
        .row-stagger > tr:nth-child(5)  { animation-delay:0.14s; }
        .row-stagger > tr:nth-child(6)  { animation-delay:0.17s; }
        .row-stagger > tr:nth-child(7)  { animation-delay:0.20s; }
        .row-stagger > tr:nth-child(8)  { animation-delay:0.23s; }
        .row-stagger > tr:nth-child(9)  { animation-delay:0.26s; }
        .row-stagger > tr:nth-child(10) { animation-delay:0.29s; }
      `}</style>

      {/* Value help modal */}
      {vhModal && (
        <ValueHelpModal
          title={vhTitles[vhModal] || vhModal}
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

          {/* ── Company Code header ── */}
          <div className="px-4 sm:px-6 lg:px-10 pt-3 pb-2 bg-white border-b border-[#e5e5e5] flex-shrink-0">
            <div className="text-[13px] text-[#32363a] text-center font-medium">
              Company Code: <strong>{companyCode}</strong>
            </div>
          </div>

          {/* ── Page title + action buttons ── */}
          <div className="px-4 sm:px-6 lg:px-10 pt-3 pb-2 flex items-center justify-between flex-shrink-0 flex-wrap gap-2">
            <h2 className="text-[18px] sm:text-[20px] font-bold text-[#32363a] tracking-tight">Gate-In to MIGO Report</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleGo}
                disabled={loading}
                className="flex items-center gap-1.5 px-5 h-9 text-[14px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                Go
              </button>
              <button
                onClick={() => setFilterBarVisible(v => !v)}
                className="px-4 h-9 text-[13px] font-semibold text-[#32363a] bg-white border border-[#d9d9d9] rounded-lg hover:bg-[#f5f6f7] transition-all whitespace-nowrap"
              >
                {filterBarVisible ? 'Hide Filter Bar' : 'Show Filter Bar'}
              </button>
              <button
                onClick={handleClear}
                className="px-4 h-9 text-[13px] font-semibold text-[#cc1c14] bg-[#fce8e6] border border-[#fce8e6] rounded-lg hover:bg-[#fad6d3] transition-all"
              >
                Clear
              </button>
            </div>
          </div>

          {/* ── Filter bar ── */}
          {filterBarVisible && (
            <div className="px-4 sm:px-6 lg:px-10 py-3 border-b border-[#e5e5e5] flex-shrink-0 anim-fade bg-[#fafbfc]">
              {/* Row 1: Date + ASN + GRN + Plant + Material */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
                <DateInput
                  label="Posting Start Date:"
                  value={postingStartDate}
                  onChange={setPostingStartDate}
                  required
                />
                <DateInput
                  label="Posting End Date:"
                  value={postingEndDate}
                  onChange={setPostingEndDate}
                  required
                />
                <ValueHelpInput
                  label="ASN No.:"
                  placeholder="Select ASN"
                  value={asnNo}
                  onOpen={() => openVh('asn')}
                />
                <ValueHelpInput
                  label="GRN No.:"
                  placeholder="Select Document"
                  value={grnNo}
                  onOpen={() => openVh('grn')}
                />
                <ValueHelpInput
                  label="Plant:"
                  placeholder="Select Plant"
                  value={plant}
                  onOpen={() => openVh('plant')}
                />
                <ValueHelpInput
                  label="Material:"
                  placeholder="Select Material"
                  value={material}
                  onOpen={() => openVh('material')}
                />
              </div>
              {/* Row 2: Shipment + IBD */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <ValueHelpInput
                  label="Shipment Number:"
                  placeholder="Select Shipment No."
                  value={shipmentNo}
                  onOpen={() => openVh('shipment')}
                />
                <ValueHelpInput
                  label="IBD Number:"
                  placeholder="Select IBD No."
                  value={ibdNumber}
                  onOpen={() => openVh('ibd')}
                />
              </div>
            </div>
          )}

          {/* ── Table area ── */}
          <div className="flex-1 flex flex-col px-4 sm:px-6 lg:px-10 pt-3 pb-3 min-h-0">

            {!hasSearched && !loading ? (
              <div className="flex-1 flex items-center justify-center anim-fade py-16">
                <div className="text-center text-[#6a6d70]">
                  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-25">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M3 9h18M9 21V9"/>
                  </svg>
                  <div className="text-[15px] font-semibold mb-1">No report loaded</div>
                  <div className="text-[13px]">Set filters and click <strong>Go</strong> to load the Gate-In to MIGO report</div>
                </div>
              </div>
            ) : loading ? (
              <div className="flex-1 flex items-center justify-center py-16 anim-fade">
                <div className="flex flex-col items-center gap-3 text-[#6a6d70]">
                  <div className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#0a6ed1] rounded-full animate-spin" />
                  <span className="text-[14px]">Loading report…</span>
                </div>
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center py-16">
                <div className="flex items-center gap-2 px-4 py-3 bg-[#fce8e6] text-[#cc1c14] rounded-lg text-[13px]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                  {error}
                </div>
              </div>
            ) : (
              <>
                {/* Row count + Download button */}
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                  <span className="text-[13px] text-[#6a6d70]">
                    {rows.length} record{rows.length !== 1 ? 's' : ''} found
                  </span>
                  <button
                    onClick={handleExport}
                    disabled={rows.length === 0 || exporting}
                    className="flex items-center gap-2 px-5 h-9 text-[13px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download
                  </button>
                </div>

                {/* ── Table ── */}
                <div className="rounded-xl border border-[#e5e5e5] shadow-sm overflow-hidden flex flex-col flex-1 anim-slide-up">
                  <div className="overflow-auto flex-1 min-h-0">
                    <table
                      className="text-[12px] border-collapse"
                      style={{ tableLayout: 'fixed', minWidth: `${totalColWidth}px` }}
                    >
                      <colgroup>
                        {COLUMNS.map(col => (
                          <col key={col.key} style={{ width: `${col.width}px` }} />
                        ))}
                      </colgroup>

                      <thead className="sticky top-0 z-10">
                        <tr className="bg-[#f5f6f7] text-[#6a6d70]">
                          {COLUMNS.map(col => (
                            <th
                              key={col.key}
                              className={`py-3 px-3 text-[11px] uppercase tracking-wider font-semibold border-b border-r border-[#e5e5e5] whitespace-nowrap bg-[#f5f6f7] ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody className="row-stagger">
                        {rows.length === 0 ? (
                          <tr>
                            <td colSpan={COLUMNS.length} className="py-12 text-center text-[14px] text-[#6a6d70]">
                              No records found
                            </td>
                          </tr>
                        ) : (
                          rows.map((row, idx) => (
                            <tr key={`${row.grnNumber}-${idx}`} className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc] transition-colors duration-100">
                              {COLUMNS.map(col => {
                                // Special cell renderers
                                if (col.key === 'grnNumber') return (
                                  <td key={col.key} className="py-3 px-3 border-r border-[#f0f0f0] text-[#0a6ed1] font-semibold whitespace-nowrap">{row.grnNumber}</td>
                                )
                                if (col.key === 'invoiceNo') return (
                                  <td key={col.key} className="py-3 px-3 border-r border-[#f0f0f0] text-center">
                                    {row.invoiceNo ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0a6ed1] text-white rounded text-[11px] font-bold tracking-wide">
                                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                        {row.invoiceNo}
                                      </span>
                                    ) : <span className="text-[#9ca3af]">—</span>}
                                  </td>
                                )
                                if (col.key === 'material') return (
                                  <td key={col.key} className="py-3 px-3 border-r border-[#f0f0f0]">
                                    <div className="text-[#0a6ed1] font-semibold text-[11px] leading-snug">{row.materialCode}</div>
                                    <div className="text-[#6a6d70] text-[11px] leading-snug mt-0.5 truncate">{row.materialName}</div>
                                  </td>
                                )
                                if (col.key === 'plant') return (
                                  <td key={col.key} className="py-3 px-3 border-r border-[#f0f0f0] text-center">
                                    <div className="font-semibold text-[#32363a]">{row.plant}</div>
                                    <div className="text-[#6a6d70] text-[11px]">{row.plantLoc}</div>
                                  </td>
                                )
                                if (col.key === 'asnQty') return (
                                  <td key={col.key} className="py-3 px-3 border-r border-[#f0f0f0] text-right tabular-nums whitespace-nowrap text-[#32363a] font-semibold">
                                    {row.asnQty.toFixed(3)} <span className="text-[#6a6d70] font-normal">{row.asnQtyUnit}</span>
                                  </td>
                                )
                                if (col.key === 'grQty') return (
                                  <td key={col.key} className="py-3 px-3 border-r border-[#f0f0f0] text-right tabular-nums whitespace-nowrap text-[#32363a] font-semibold">
                                    {row.grQty.toFixed(3)} <span className="text-[#6a6d70] font-normal">{row.grQtyUnit}</span>
                                  </td>
                                )
                                if (col.key === 'packingMaterialQty') return (
                                  <td key={col.key} className="py-3 px-3 border-r border-[#f0f0f0] text-right tabular-nums text-[#32363a]">
                                    {row.packingMaterialQty.toFixed(3)}
                                  </td>
                                )
                                if (col.key === 'shortQty') return (
                                  <td key={col.key} className="py-3 px-3 border-r border-[#f0f0f0] text-right tabular-nums">
                                    <span className={row.shortQty > 0 ? 'font-bold text-[#cc1c14]' : 'text-[#6a6d70]'}>
                                      {row.shortQty.toFixed(3)}
                                    </span>
                                  </td>
                                )
                                if (col.key === 'grnBy') return (
                                  <td key={col.key} className="py-3 px-3 border-r border-[#f0f0f0] text-[#32363a] text-[11px] break-all">
                                    {row.grnBy}
                                  </td>
                                )
                                // Default cell
                                const val = row[col.key] ?? ''
                                return (
                                  <td
                                    key={col.key}
                                    className={`py-3 px-3 border-r border-[#f0f0f0] text-[#32363a] whitespace-nowrap ${col.align === 'right' ? 'text-right tabular-nums' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                                  >
                                    {val || <span className="text-[#d1d5db]">—</span>}
                                  </td>
                                )
                              })}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

        </main>
      </div>
    </PageLayout>
  )
}