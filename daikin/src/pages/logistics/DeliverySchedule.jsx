import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import PageLayout from '../../layouts/PageLayout.jsx'

// ═══════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════
const MOCK_DELIVERIES = [
  { trackingNo: '3000000620/2026', plant: '1000', shipmentDate: '2026-04-28', eta: '2026-04-28', ata: '2026-04-28', status: 'Completed',     timeDelay: 'On Time',    city: 'Chennai', supplier: 'NECCO TOOLS1' },
  { trackingNo: '3000000619/2026', plant: '1000', shipmentDate: '2026-04-28', eta: '2026-04-28', ata: '2026-04-28', status: 'Completed',     timeDelay: 'On Time',    city: 'PUNE',    supplier: 'ABC WELDING LTD.' },
  { trackingNo: '3000000618/2026', plant: '1000', shipmentDate: '2026-04-28', eta: '2026-04-28', ata: '2026-04-28', status: 'Completed',     timeDelay: 'On Time',    city: 'PUNE',    supplier: 'ABC WELDING LTD.' },
  { trackingNo: '3000000617/2026', plant: '1000', shipmentDate: '2026-04-25', eta: '2026-04-25', ata: '2026-04-25', status: 'Reached Plant', timeDelay: 'On Time',    city: 'Chennai', supplier: 'NECCO TOOLS1' },
  { trackingNo: '3000000616/2026', plant: '1000', shipmentDate: '2026-04-25', eta: '2026-04-25', ata: '2026-04-25', status: 'Completed',     timeDelay: 'On Time',    city: 'Chennai', supplier: 'NECCO TOOLS1' },
  { trackingNo: '3000000615/2026', plant: '1000', shipmentDate: '2026-04-24', eta: '2026-04-24', ata: '2026-04-24', status: 'Completed',     timeDelay: 'On Time',    city: 'Chennai', supplier: 'NECCO TOOLS1' },
  { trackingNo: '3000000614/2026', plant: '1000', shipmentDate: '2026-04-24', eta: '2026-04-24', ata: '2026-04-24', status: 'Completed',     timeDelay: 'On Time',    city: 'Chennai', supplier: 'NECCO TOOLS1' },
  { trackingNo: '3000000613/2026', plant: '1000', shipmentDate: '2026-04-24', eta: '2026-04-24', ata: '2026-04-24', status: 'Completed',     timeDelay: 'On Time',    city: 'Chennai', supplier: 'NECCO TOOLS1' },
  { trackingNo: '3000000612/2026', plant: '1000', shipmentDate: '2026-04-24', eta: '2026-04-24', ata: '2026-04-24', status: 'Completed',     timeDelay: 'On Time',    city: 'Chennai', supplier: 'NECCO TOOLS1' },
  { trackingNo: '3000000611/2026', plant: '1000', shipmentDate: '2026-04-24', eta: '2026-04-24', ata: '2026-04-24', status: 'Completed',     timeDelay: 'Delayed',    city: 'Chennai', supplier: 'NECCO TOOLS1' },
  { trackingNo: '3000000610/2026', plant: '1000', shipmentDate: '2026-04-24', eta: '2026-04-24', ata: '2026-04-24', status: 'Completed',     timeDelay: 'On Time',    city: 'Chennai', supplier: 'NECCO TOOLS1' },
  { trackingNo: '3000000609/2026', plant: '1000', shipmentDate: '2026-04-24', eta: '2026-04-24', ata: '2026-04-24', status: 'In Transit',    timeDelay: 'Before Time', city: 'Mumbai',  supplier: 'NECCO TOOLS1' },
  { trackingNo: '3000000608/2026', plant: '1000', shipmentDate: '2026-04-24', eta: '2026-04-24', ata: '2026-04-24', status: 'Completed',     timeDelay: 'On Time',    city: 'Chennai', supplier: 'NECCO TOOLS1' },
  { trackingNo: '3000000607/2026', plant: '1000', shipmentDate: '2026-04-24', eta: '2026-04-24', ata: '2026-04-24', status: 'Completed',     timeDelay: 'On Time',    city: 'Chennai', supplier: 'NECCO TOOLS1' },
  { trackingNo: '3000000606/2026', plant: '1000', shipmentDate: '2026-04-24', eta: '2026-04-24', ata: '2026-04-24', status: 'Completed',     timeDelay: 'On Time',    city: 'Chennai', supplier: 'NECCO TOOLS1' },
  { trackingNo: '3000000605/2026', plant: '1000', shipmentDate: '2026-04-24', eta: '2026-04-24', ata: '2026-04-24', status: 'Completed',     timeDelay: 'On Time',    city: 'Chennai', supplier: 'NECCO TOOLS1' },
]

const MOCK_DETAIL = {
  '3000000617/2026': {
    trackingNo: '3000000617/2026',
    status: 'Reached Plant',
    supplier: 'NECCO TOOLS1 (0002000092)',
    shipmentDate: 'Apr 25, 2026',
    eta: 'Apr 25, 2026',
    items: [
      { asn: '1200000056/2026', ibd: '0180001470', baseDoc: 'SA 5100000251', purchaseGroup: '106', invoice: '34343421111', material: 'CPGK2T 11003CA', description: 'GSKT - STR MTR DRV HSG', qty: '5000.000 EA' },
      { asn: '1200000056/2026', ibd: '0180001470', baseDoc: 'SA 5100000251', purchaseGroup: '106', invoice: '34343421111', material: 'CPGK2T 11003CA', description: 'GSKT - STR MTR DRV HSG', qty: '1000.000 EA' },
      { asn: '1200000056/2026', ibd: '0180001470', baseDoc: 'SA 5100000251', purchaseGroup: '106', invoice: '34343421111', material: 'CPGK2T 11003CA', description: 'GSKT - STR MTR DRV HSG', qty: '1000.000 EA' },
      { asn: '1200000056/2026', ibd: '0180001470', baseDoc: 'SA 5100000251', purchaseGroup: '106', invoice: '34343421111', material: 'CPGK2T 11003CA', description: 'GSKT - STR MTR DRV HSG', qty: '1000.000 EA' },
      { asn: '1200000056/2026', ibd: '0180001470', baseDoc: 'SA 5100000251', purchaseGroup: '106', invoice: '34343421111', material: 'CPVK6T 11010AA', description: 'SHFT-STR MTR ARMA',     qty: '1000.000 EA' },
      { asn: '1200000056/2026', ibd: '0180001470', baseDoc: 'SA 5100000251', purchaseGroup: '106', invoice: '34343421111', material: 'CPVK6T 11010AA', description: 'SHFT-STR MTR ARMA',     qty: '1000.000 EA' },
    ]
  }
}

const VALUE_HELP_SUPPLIERS = [
  { code: 'NECCO TOOLS1',    label: '0002000092' },
  { code: 'ABC WELDING LTD.', label: '0002000088' },
]
const VALUE_HELP_MATERIALS = [
  { code: 'CPGK2T 11003CA', label: 'GSKT - STR MTR DRV HSG' },
  { code: 'CPVK6T 11010AA', label: 'SHFT-STR MTR ARMA' },
]
const VALUE_HELP_ASN = [
  { code: '1200000056/2026', label: '' },
  { code: '1200000055/2026', label: '' },
]
const VALUE_HELP_INVOICE = [
  { code: '34343421111', label: '' },
  { code: '34343421110', label: '' },
]

const STATUS_OPTIONS = ['', 'In Transit', 'Reached Plant', 'Completed', 'Goods Received']

// ═══════════════════════════════════════════════════════════════
// API STRUCTURE
// ═══════════════════════════════════════════════════════════════
const API_BASE_URL = '/api/v1'
const USE_MOCK = true

const DeliveryScheduleApi = {
  async fetchDeliveries({ startDate = '', endDate = '', status = '', supplier = '', material = '', asn = '', invoiceNo = '', trackSearch = '' } = {}) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 500))
      let rows = [...MOCK_DELIVERIES]
      if (status)   rows = rows.filter(r => r.status === status)
      if (supplier) rows = rows.filter(r => r.supplier.toLowerCase().includes(supplier.toLowerCase()))
      if (trackSearch) rows = rows.filter(r => r.trackingNo.toLowerCase().includes(trackSearch.toLowerCase()) || r.city.toLowerCase().includes(trackSearch.toLowerCase()) || r.plant.includes(trackSearch))
      return rows
    }
    const params = new URLSearchParams()
    if (startDate)   params.set('startDate', startDate)
    if (endDate)     params.set('endDate', endDate)
    if (status)      params.set('status', status)
    if (supplier)    params.set('supplier', supplier)
    if (material)    params.set('material', material)
    if (asn)         params.set('asn', asn)
    if (invoiceNo)   params.set('invoiceNo', invoiceNo)
    if (trackSearch) params.set('trackSearch', trackSearch)
    const res = await fetch(`${API_BASE_URL}/delivery-schedule?${params}`)
    if (!res.ok) throw new Error('Failed to fetch delivery schedule')
    return res.json()
  },

  async fetchDetail(trackingNo) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
      return MOCK_DETAIL[trackingNo] || {
        trackingNo,
        status: 'Completed',
        supplier: 'NECCO TOOLS1 (0002000092)',
        shipmentDate: 'Apr 24, 2026',
        eta: 'Apr 24, 2026',
        items: [
          { asn: '1200000055/2026', ibd: '0180001469', baseDoc: 'SA 5100000250', purchaseGroup: '105', invoice: '34343421110', material: 'CPGK2T 11003CA', description: 'GSKT - STR MTR DRV HSG', qty: '2000.000 EA' },
        ]
      }
    }
    const res = await fetch(`${API_BASE_URL}/delivery-schedule/${encodeURIComponent(trackingNo)}`)
    if (!res.ok) throw new Error('Failed to fetch detail')
    return res.json()
  },

  async fetchSupplierOptions(query = '') {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 80))
      if (!query) return VALUE_HELP_SUPPLIERS
      const q = query.toLowerCase()
      return VALUE_HELP_SUPPLIERS.filter(o => o.code.toLowerCase().includes(q))
    }
    const res = await fetch(`${API_BASE_URL}/value-help/suppliers?q=${encodeURIComponent(query)}`)
    return res.json()
  },

  async fetchMaterialOptions(query = '') {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 80))
      if (!query) return VALUE_HELP_MATERIALS
      const q = query.toLowerCase()
      return VALUE_HELP_MATERIALS.filter(o => o.code.toLowerCase().includes(q) || o.label.toLowerCase().includes(q))
    }
    const res = await fetch(`${API_BASE_URL}/value-help/materials?q=${encodeURIComponent(query)}`)
    return res.json()
  },

  async fetchAsnOptions(query = '') {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 80))
      if (!query) return VALUE_HELP_ASN
      const q = query.toLowerCase()
      return VALUE_HELP_ASN.filter(o => o.code.toLowerCase().includes(q))
    }
    const res = await fetch(`${API_BASE_URL}/value-help/asn?q=${encodeURIComponent(query)}`)
    return res.json()
  },

  async fetchInvoiceOptions(query = '') {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 80))
      if (!query) return VALUE_HELP_INVOICE
      const q = query.toLowerCase()
      return VALUE_HELP_INVOICE.filter(o => o.code.toLowerCase().includes(q))
    }
    const res = await fetch(`${API_BASE_URL}/value-help/invoices?q=${encodeURIComponent(query)}`)
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
const offsetDateIso = (days) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
const fmtDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

// ═══════════════════════════════════════════════════════════════
// COMPUTE CHART DATA from rows
// ═══════════════════════════════════════════════════════════════
const computeChartData = (rows) => {
  const shipment = { 'In Transit': 0, 'Reached Plant': 0, 'Goods Received': 0, 'Completed': 0 }
  const delay    = { 'Before Time': 0, 'On Time': 0, 'Delayed': 0 }
  rows.forEach(r => {
    if (r.status in shipment) shipment[r.status]++
    else shipment['Completed'] = (shipment['Completed'] || 0) + 1
    if (r.timeDelay in delay) delay[r.timeDelay]++
  })
  return { shipment, delay }
}

// ═══════════════════════════════════════════════════════════════
// STATUS BADGE
// ═══════════════════════════════════════════════════════════════
function StatusBadge({ status }) {
  const map = {
    'Completed':     { bg: '#e8f5e9', color: '#107e3e', border: '#a8d5b5' },
    'Reached Plant': { bg: '#fff8e1', color: '#b45309', border: '#f0c060' },
    'In Transit':    { bg: '#e8f0ff', color: '#0a6ed1', border: '#a0c0f0' },
    'Goods Received':{ bg: '#f0f0f5', color: '#32363a', border: '#c8c8d0' },
  }
  const s = map[status] || { bg: '#f5f6f7', color: '#6a6d70', border: '#d9d9d9' }
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════
// ANIMATED BAR CHART
// ═══════════════════════════════════════════════════════════════
function AnimatedBarChart({ title, data, colorFn, horizontal = false, animate = false }) {
  const [progress, setProgress] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!animate) { setProgress(1); return }
    setProgress(0)
    let start = null
    const duration = 900
    const ease = t => t < 0.5 ? 2*t*t : -1+(4-2*t)*t
    const step = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setProgress(ease(p))
      if (p < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [animate, JSON.stringify(data)])

  const entries = Object.entries(data)
  const maxVal = Math.max(...entries.map(([,v]) => v), 1)

  if (!horizontal) {
    // Vertical bar chart (Shipment Status)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#32363a', marginBottom: 8 }}>{title}</div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 16, paddingBottom: 24, position: 'relative' }}>
          {/* Y-axis labels */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 24, width: 28, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 4 }}>
            {[1.5, 1, 0.5, 0].map(v => (
              <span key={v} style={{ fontSize: 10, color: '#94a3b8' }}>{v}</span>
            ))}
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 8, paddingLeft: 32, height: '100%' }}>
            {entries.map(([label, val]) => (
              <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', width: '100%', maxWidth: 60 }}>
                  <div style={{ fontSize: 11, textAlign: 'center', color: '#32363a', fontWeight: 600, marginBottom: 2 }}>{val}</div>
                  <div style={{
                    height: `${(val / maxVal) * 100 * progress}%`,
                    minHeight: val > 0 ? 2 : 0,
                    background: colorFn(label, val),
                    borderRadius: '4px 4px 0 0',
                    transition: 'none',
                    maxWidth: 60,
                    width: '100%',
                  }} />
                </div>
                <div style={{ fontSize: 10, color: '#6a6d70', textAlign: 'center', marginTop: 4, lineHeight: 1.2, wordBreak: 'break-word', maxWidth: 64 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Horizontal bar chart (Delay Status)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#32363a', marginBottom: 8 }}>{title}</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
        {entries.map(([label, val]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 80, fontSize: 12, color: '#6a6d70', textAlign: 'right', flexShrink: 0 }}>{label}</div>
            <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 4, height: 22, overflow: 'hidden', position: 'relative' }}>
              <div style={{
                width: `${(val / maxVal) * 100 * progress}%`,
                height: '100%',
                background: colorFn(label, val),
                borderRadius: 4,
                transition: 'none',
              }} />
              <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 700, color: '#32363a' }}>{val}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// VALUE HELP MODAL (reuse same pattern as ForecastReport)
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
      <div className="bg-white rounded-xl shadow-2xl w-[360px] max-w-[95vw] overflow-hidden flex flex-col"
        style={{ maxHeight: '70vh', animation: 'modalIn 0.2s ease-out both' }}>
        <div className="px-5 py-4 border-b border-[#e5e5e5]">
          <h3 className="text-[16px] font-semibold text-[#32363a]">{title}</h3>
        </div>
        <div className="px-4 py-3 border-b border-[#e5e5e5]">
          <div className="relative">
            <input autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search"
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
function ValueHelpInput({ placeholder, value, onOpen }) {
  return (
    <div className="flex h-10 border border-[#d9d9d9] rounded-lg overflow-hidden bg-white focus-within:border-[#0a6ed1] focus-within:ring-2 focus-within:ring-[#0a6ed1]/20 transition-all">
      <div className="flex-1 flex items-center pl-3 pr-2 text-[14px] text-[#32363a] truncate min-w-0">
        {value ? <span className="truncate font-medium">{value}</span> : <span className="text-[#94a3b8]">{placeholder}</span>}
      </div>
      <button type="button" onClick={onOpen}
        className="flex-shrink-0 w-9 flex items-center justify-center border-l border-[#e5e5e5] text-[#6a6d70] hover:text-[#0a6ed1] hover:bg-[#f0f7ff] transition-all">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// DETAIL VIEW
// ═══════════════════════════════════════════════════════════════
function DetailView({ trackingNo, onBack }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    DeliveryScheduleApi.fetchDetail(trackingNo)
      .then(d => { setDetail(d); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [trackingNo])

  const statusStyle = detail?.status === 'Reached Plant'
    ? { color: '#b45309', fontWeight: 700, fontSize: 20 }
    : detail?.status === 'Completed'
    ? { color: '#107e3e', fontWeight: 700, fontSize: 20 }
    : { color: '#0a6ed1', fontWeight: 700, fontSize: 20 }

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Back header */}
      <div className="px-4 sm:px-6 lg:px-10 pt-4 pb-3 flex items-center gap-3 border-b border-[#e5e5e5] flex-shrink-0 anim-fade">
        <button onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded border border-[#d9d9d9] text-[#6a6d70] hover:text-[#0a6ed1] hover:border-[#0a6ed1] transition-all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span className="text-[14px] text-[#6a6d70] font-medium">Tracking No. - <strong className="text-[#32363a]">{trackingNo}</strong></span>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-[#6a6d70]">
            <div className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#0a6ed1] rounded-full animate-spin" />
            <span className="text-[14px]">Loading detail…</span>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 px-4 py-3 bg-[#fce8e6] text-[#cc1c14] rounded-lg text-[13px]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            {error}
          </div>
        </div>
      ) : detail ? (
        <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-10 py-6 anim-slide-up">
          {/* Card header */}
          <div className="bg-white rounded-xl border border-[#e5e5e5] shadow-sm p-5 mb-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#b45309', fontFamily: 'monospace', letterSpacing: 0.5 }}>{detail.trackingNo}</div>
                <div className="text-[13px] text-[#6a6d70] mt-1.5">Supplier: <span className="font-medium text-[#32363a]">{detail.supplier}</span></div>
              </div>
              <div className="text-right">
                <div style={statusStyle}>{detail.status}</div>
                <div className="text-[12px] text-[#6a6d70] mt-1">Shipment Date: <span className="font-medium text-[#32363a]">{detail.shipmentDate}</span></div>
                <div className="text-[12px] text-[#6a6d70]">ETA: <span className="font-medium text-[#32363a]">{detail.eta}</span></div>
              </div>
            </div>
          </div>

          {/* ASN items table */}
          <div className="rounded-xl border border-[#e5e5e5] shadow-sm overflow-hidden">
            <div className="overflow-auto">
              <table className="text-[13px] w-full border-collapse" style={{ minWidth: 900 }}>
                <thead>
                  <tr className="bg-[#f5f6f7] text-[#6a6d70]">
                    {['ASN', 'IBD', 'Base Doc', 'Purchase Group', 'Invoice', 'Material', 'Description', 'Quantity'].map(h => (
                      <th key={h} className="text-left font-semibold py-3 px-3 text-[11px] uppercase tracking-wider border-b border-r border-[#e5e5e5] last:border-r-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="row-stagger">
                  {detail.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc] transition-colors">
                      <td className="py-3 px-3 border-r border-[#f0f0f0]">
                        <span style={{ background: '#fce8e6', color: '#cc1c14', borderRadius: 5, padding: '2px 8px', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{item.asn}</span>
                      </td>
                      <td className="py-3 px-3 text-[#32363a] border-r border-[#f0f0f0] tabular-nums">{item.ibd}</td>
                      <td className="py-3 px-3 text-[#0a6ed1] font-semibold border-r border-[#f0f0f0]">{item.baseDoc}</td>
                      <td className="py-3 px-3 text-center text-[#32363a] border-r border-[#f0f0f0]">{item.purchaseGroup}</td>
                      <td className="py-3 px-3 text-[#32363a] tabular-nums border-r border-[#f0f0f0]">{item.invoice}</td>
                      <td className="py-3 px-3 font-semibold text-[#32363a] border-r border-[#f0f0f0]">{item.material}</td>
                      <td className="py-3 px-3 text-[#6a6d70] border-r border-[#f0f0f0]">{item.description}</td>
                      <td className="py-3 px-3 text-right font-semibold text-[#32363a] tabular-nums">{item.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function DeliverySchedule() {
  const companyCode = 'FIEM (FIEM Industries Limited)'

  // ── View state ──
  const [view, setView] = useState('list') // 'list' | 'detail'
  const [selectedTracking, setSelectedTracking] = useState(null)

  // ── Filter state ──
  const [startDate, setStartDate] = useState(offsetDateIso(-30))
  const [endDate,   setEndDate]   = useState(todayIso())
  const [status,    setStatus]    = useState('')
  const [supplier,  setSupplier]  = useState('')
  const [material,  setMaterial]  = useState('')
  const [asn,       setAsn]       = useState('')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [trackSearch, setTrackSearch] = useState('')

  // ── Filter bar ──
  const [filterBarVisible, setFilterBarVisible] = useState(true)

  // ── Value help ──
  const [vhModal,   setVhModal]   = useState(null)
  const [vhOptions, setVhOptions] = useState([])

  // ── Data state ──
  const [rows,       setRows]       = useState([])
  const [loading,    setLoading]    = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error,      setError]      = useState(null)

  // ── Chart animate flag ──
  const [animateCharts, setAnimateCharts] = useState(false)

  // Chart data
  const chartData = useMemo(() => computeChartData(rows), [rows])

  // Animate charts whenever rows change after a search
  useEffect(() => {
    if (hasSearched && rows.length > 0) {
      setAnimateCharts(false)
      const t = setTimeout(() => setAnimateCharts(true), 50)
      return () => clearTimeout(t)
    }
  }, [rows, hasSearched])

  // ── Open value help ──
  const openVh = async (field) => {
    setVhModal(field)
    setVhOptions([])
    try {
      let opts = []
      if (field === 'supplier') opts = await DeliveryScheduleApi.fetchSupplierOptions('')
      else if (field === 'material') opts = await DeliveryScheduleApi.fetchMaterialOptions('')
      else if (field === 'asn')  opts = await DeliveryScheduleApi.fetchAsnOptions('')
      else if (field === 'invoice') opts = await DeliveryScheduleApi.fetchInvoiceOptions('')
      setVhOptions(opts)
    } catch { setVhOptions([]) }
  }

  const handleVhSelect = (opt) => {
    if (vhModal === 'supplier') setSupplier(opt.code)
    else if (vhModal === 'material') setMaterial(opt.code)
    else if (vhModal === 'asn') setAsn(opt.code)
    else if (vhModal === 'invoice') setInvoiceNo(opt.code)
    setVhModal(null)
  }

  // ── Go ──
  const handleGo = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await DeliveryScheduleApi.fetchDeliveries({ startDate, endDate, status, supplier, material, asn, invoiceNo, trackSearch })
      setRows(data)
      setHasSearched(true)
    } catch (err) {
      setError(err.message || 'Failed to fetch delivery schedule')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setStartDate(offsetDateIso(-30))
    setEndDate(todayIso())
    setStatus('')
    setSupplier('')
    setMaterial('')
    setAsn('')
    setInvoiceNo('')
    setTrackSearch('')
    setRows([])
    setHasSearched(false)
    setError(null)
    setAnimateCharts(false)
  }

  // ── Click tracking row ──
  const handleRowClick = (trackingNo) => {
    setSelectedTracking(trackingNo)
    setView('detail')
  }

  const handleBack = () => {
    setView('list')
    setSelectedTracking(null)
  }

  const shipmentColorFn = (label) => {
    if (label === 'In Transit')    return '#0a6ed1'
    if (label === 'Reached Plant') return '#f0b429'
    if (label === 'Goods Received') return '#107e3e'
    if (label === 'Completed')     return '#0a6ed1'
    return '#94a3b8'
  }
  const delayColorFn = (label) => {
    if (label === 'Before Time') return '#107e3e'
    if (label === 'On Time')     return '#0a6ed1'
    if (label === 'Delayed')     return '#cc1c14'
    return '#94a3b8'
  }

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
        .tracking-row { cursor: pointer; }
        .tracking-row:hover .tracking-link { color: #085caf !important; text-decoration: underline; }
      `}</style>

      {/* Value help modals */}
      {vhModal && (
        <ValueHelpModal
          title={vhModal === 'supplier' ? 'Supplier' : vhModal === 'material' ? 'Material' : vhModal === 'asn' ? 'ASN' : 'Invoice No.'}
          options={vhOptions}
          onSelect={handleVhSelect}
          onCancel={() => setVhModal(null)}
        />
      )}

      <div className="bg-[#f5f6f7] min-h-[calc(100vh-104px)]">
        <main className="flex flex-col bg-white" style={{ minHeight: 'calc(100vh - 220px)' }}>

          {/* ── Page meta header ── */}
          <div className="px-4 sm:px-6 lg:px-10 pt-4 pb-2 bg-white border-b border-[#e5e5e5] flex-shrink-0">
            <div className="flex flex-wrap gap-x-8 gap-y-1 text-[13px] text-[#6a6d70]">
              <span>Company Code: <strong className="text-[#32363a]">{companyCode}</strong></span>
            </div>
          </div>

          {view === 'detail' ? (
            <DetailView trackingNo={selectedTracking} onBack={handleBack} />
          ) : (
            <>
              {/* ── Page title + action buttons ── */}
              <div className="px-4 sm:px-6 lg:px-10 pt-4 pb-3 flex items-center justify-between flex-shrink-0">
                <h2 className="text-[20px] sm:text-[22px] font-bold text-[#32363a] tracking-tight">Delivery Schedule</h2>
                <div className="flex items-center gap-2">
                  <button onClick={handleGo} disabled={loading}
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

              {/* ── Charts panel (always visible once searched) ── */}
              {hasSearched && (
                <div className="px-4 sm:px-6 lg:px-10 pb-4 flex-shrink-0 anim-fade">
                  {rows.length === 0 ? (
                    <div className="bg-[#fff8e1] border border-[#f0c060] rounded-lg px-4 py-2 text-[13px] text-[#b45309] font-semibold inline-block">
                      No Schedule for Today
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white rounded-xl border border-[#e5e5e5] shadow-sm p-4" style={{ height: 200 }}>
                        <AnimatedBarChart
                          title="Shipment Status"
                          data={chartData.shipment}
                          colorFn={shipmentColorFn}
                          horizontal={false}
                          animate={animateCharts}
                        />
                      </div>
                      <div className="bg-white rounded-xl border border-[#e5e5e5] shadow-sm p-4" style={{ height: 200 }}>
                        <AnimatedBarChart
                          title="Delay Status"
                          data={chartData.delay}
                          colorFn={delayColorFn}
                          horizontal={true}
                          animate={animateCharts}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── View Today's Scheduled Items link ── */}
              {!hasSearched && (
                <div className="px-4 sm:px-6 lg:px-10 pb-2 flex-shrink-0">
                  <button onClick={handleGo} className="text-[13px] text-[#0a6ed1] hover:underline font-medium">
                    View Today's Scheduled Items
                  </button>
                </div>
              )}

              {/* ── Filter bar ── */}
              {filterBarVisible && (
                <div className="px-4 sm:px-6 lg:px-10 pb-3 flex-shrink-0 anim-fade border-t border-[#e5e5e5] pt-3">
                  {/* Row 1 */}
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-6 items-start mb-3">
                    {/* Start Date */}
                    <div>
                      <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">Start Date:<span className="text-[#cc1c14]">*</span></label>
                      <div className="relative">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                          className="h-10 pl-3 pr-9 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all w-[160px]" />
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2.5 top-3.5 text-[#6a6d70] pointer-events-none">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                        </svg>
                      </div>
                    </div>
                    {/* End Date */}
                    <div>
                      <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">End Date:<span className="text-[#cc1c14]">*</span></label>
                      <div className="relative">
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                          className="h-10 pl-3 pr-9 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all w-[160px]" />
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2.5 top-3.5 text-[#6a6d70] pointer-events-none">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                        </svg>
                      </div>
                    </div>
                    {/* Status */}
                    <div>
                      <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">Status:</label>
                      <div className="relative">
                        <select value={status} onChange={e => setStatus(e.target.value)}
                          className="h-10 pl-3 pr-8 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] appearance-none cursor-pointer w-[160px]">
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
                        </select>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2.5 top-3.5 text-[#6a6d70] pointer-events-none">
                          <path d="M6 9l6 6 6-6"/>
                        </svg>
                      </div>
                    </div>
                    {/* Supplier */}
                    <div>
                      <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">Supplier:</label>
                      <div className="w-[180px]">
                        <ValueHelpInput placeholder="Select Supplier" value={supplier} onOpen={() => openVh('supplier')} />
                      </div>
                    </div>
                    {/* Material */}
                    <div>
                      <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">Material:</label>
                      <div className="w-[180px]">
                        <ValueHelpInput placeholder="Select Material" value={material} onOpen={() => openVh('material')} />
                      </div>
                    </div>
                  </div>
                  {/* Row 2 */}
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-6 items-start">
                    {/* ASN */}
                    <div>
                      <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">ASN:</label>
                      <div className="w-[180px]">
                        <ValueHelpInput placeholder="Select ASN" value={asn} onOpen={() => openVh('asn')} />
                      </div>
                    </div>
                    {/* Invoice No. */}
                    <div>
                      <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">Invoice No.:</label>
                      <div className="w-[180px]">
                        <ValueHelpInput placeholder="Select Invoice No." value={invoiceNo} onOpen={() => openVh('invoice')} />
                      </div>
                    </div>
                    {/* Track / Plant / City search */}
                    <div className="flex-1 min-w-[240px] max-w-[400px]">
                      <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">Track no / Plant / City:</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={trackSearch}
                          onChange={e => setTrackSearch(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleGo()}
                          placeholder="Track no / Plant / City"
                          className="w-full h-10 pl-3 pr-9 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all"
                        />
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-3 top-3 text-[#94a3b8]">
                          <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Collapse toggle ── */}
              <div className="px-4 sm:px-6 lg:px-10 pb-2 flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setFilterBarVisible(v => !v)}
                  className="w-7 h-7 flex items-center justify-center rounded border border-[#d9d9d9] text-[#6a6d70] hover:text-[#0a6ed1] hover:border-[#0a6ed1] transition-all"
                  title={filterBarVisible ? 'Hide filter bar' : 'Show filter bar'}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ transform: filterBarVisible ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                    <path d="M18 15l-6-6-6 6"/>
                  </svg>
                </button>
                <button onClick={handleClear}
                  className="w-7 h-7 flex items-center justify-center rounded border border-[#d9d9d9] text-[#6a6d70] hover:text-[#cc1c14] hover:border-[#cc1c14] transition-all"
                  title="Reset filters">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
                  </svg>
                </button>
              </div>

              {/* ── Table ── */}
              <div className="flex-1 overflow-hidden flex flex-col px-4 sm:px-6 lg:px-10 pb-6 pt-2 border-t border-[#e5e5e5]">
                {!hasSearched && !loading ? (
                  <div className="flex-1 flex items-center justify-center anim-fade">
                    <div className="text-center text-[#6a6d70]">
                      <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-25">
                        <rect x="1" y="3" width="15" height="13" rx="2"/>
                        <path d="M16 8h4a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-1"/><path d="M12 21H7m5 0v-4m-5 4v-4"/>
                      </svg>
                      <div className="text-[15px] font-semibold mb-1">No deliveries loaded</div>
                      <div className="text-[13px]">Set filters and click <strong>Go</strong> to view delivery schedule</div>
                    </div>
                  </div>
                ) : loading ? (
                  <div className="flex-1 flex items-center justify-center anim-fade">
                    <div className="flex flex-col items-center gap-3 text-[#6a6d70]">
                      <div className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#0a6ed1] rounded-full animate-spin" />
                      <span className="text-[14px]">Loading deliveries…</span>
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
                      <table className="text-[13px] border-collapse w-full" style={{ minWidth: 800 }}>
                        <colgroup>
                          <col style={{ width: '160px' }} />
                          <col style={{ width: '70px' }} />
                          <col style={{ width: '110px' }} />
                          <col style={{ width: '110px' }} />
                          <col style={{ width: '110px' }} />
                          <col style={{ width: '130px' }} />
                          <col style={{ width: '100px' }} />
                          <col style={{ width: '90px' }} />
                          <col style={{ width: '150px' }} />
                          <col style={{ width: '36px' }} />
                        </colgroup>
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-[#f5f6f7] text-[#6a6d70]">
                            {['Tracking No.', 'Plant', 'Shipment date', 'ETA', 'ATA', 'Status', 'Time Delay', 'City', 'Supplier', ''].map((h, i) => (
                              <th key={i} className="text-left font-semibold py-3 px-3 text-[11px] uppercase tracking-wider border-b border-r border-[#e5e5e5] last:border-r-0 bg-[#f5f6f7]">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="row-stagger">
                          {rows.length === 0 ? (
                            <tr>
                              <td colSpan={10} className="py-12 text-center text-[14px] text-[#6a6d70]">No records found</td>
                            </tr>
                          ) : rows.map((row, idx) => (
                            <tr key={`${row.trackingNo}-${idx}`}
                              className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#f0f7ff] transition-colors duration-100 tracking-row"
                              onClick={() => handleRowClick(row.trackingNo)}>
                              <td className="py-3 px-3 border-r border-[#f0f0f0]">
                                <span className="tracking-link text-[#0a6ed1] font-semibold text-[12px] font-mono cursor-pointer">
                                  {row.trackingNo}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center text-[#32363a] border-r border-[#f0f0f0]">{row.plant}</td>
                              <td className="py-3 px-3 text-[#32363a] border-r border-[#f0f0f0] whitespace-nowrap">{fmtDate(row.shipmentDate)}</td>
                              <td className="py-3 px-3 text-[#32363a] border-r border-[#f0f0f0] whitespace-nowrap">{fmtDate(row.eta)}</td>
                              <td className="py-3 px-3 text-[#32363a] border-r border-[#f0f0f0] whitespace-nowrap">{fmtDate(row.ata)}</td>
                              <td className="py-3 px-3 border-r border-[#f0f0f0]"><StatusBadge status={row.status} /></td>
                              <td className="py-3 px-3 border-r border-[#f0f0f0]">
                                <span style={{ fontSize: 12, color: row.timeDelay === 'Delayed' ? '#cc1c14' : row.timeDelay === 'Before Time' ? '#107e3e' : '#32363a', fontWeight: row.timeDelay === 'Delayed' ? 700 : 400 }}>
                                  {row.timeDelay}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-[#32363a] border-r border-[#f0f0f0]">{row.city}</td>
                              <td className="py-3 px-3 text-[#6a6d70] border-r border-[#f0f0f0] truncate max-w-[150px]">{row.supplier}</td>
                              <td className="py-3 px-2 text-[#94a3b8] text-right">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </PageLayout>
  )
}