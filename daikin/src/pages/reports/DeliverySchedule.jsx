import { useState, useMemo, useRef, useEffect } from 'react'
import PageLayout from '../../layouts/PageLayout.jsx'
import { DeliveryScheduleApi, authConfig } from '../../services/DeliverySchedule.js'
// import { useUser } from '../../context/UserContext.jsx'
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
const fmtDate = (val) => {
  if (!val) return ''
  let iso = val
  if (/^\d{8}$/.test(val)) iso = `${val.slice(0,4)}-${val.slice(4,6)}-${val.slice(6,8)}`
  const d = new Date(iso)
  if (isNaN(d)) return val
  const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${m[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

// ═══════════════════════════════════════════════════════════════
// CHART CONFIG
// ═══════════════════════════════════════════════════════════════
const BAR_STATUS_ORDER  = ['In Transit', 'Reached Plant', 'Goods Received']
const PIE_STATUS_ORDER  = ['In Transit', 'Reached Plant', 'Unloading Started', 'Completed']
const DELAY_ORDER       = ['Before Time', 'On Time', 'Delayed']

const PIE_COLORS_STATUS = {
  'In Transit':        '#0a6ed1',
  'Reached Plant':     '#f0b429',
  'Unloading Started': '#7c3aed',
  'Completed':         '#107e3e',
  'Goods Received':    '#6a6d70',
}
const PIE_COLORS_DELAY = {
  'Before Time': '#107e3e',
  'On Time':     '#0a6ed1',
  'Delayed':     '#cc1c14',
}

const computeChartData = (rows) => {
  const shipment = {}
  const delay    = {}
  rows.forEach(r => {
    const s = r.status || 'Unknown'
    shipment[s] = (shipment[s] || 0) + 1
    const d = r.timeDelay || 'Unknown'
    delay[d] = (delay[d] || 0) + 1
  })
  return { shipment, delay }
}

// ═══════════════════════════════════════════════════════════════
// PIE CHART (4-status donut)
// ═══════════════════════════════════════════════════════════════
function PieChart({ title, data, colorMap, order }) {
  const values = order.map(l => data[l] || 0)
  const total  = values.reduce((a, b) => a + b, 0)

  const CX = 70, CY = 70, R = 52, INNER = 30
  let slices = []
  if (total === 0) {
    slices = [{ label: 'empty', color: '#f0f0f0', path: describeArc(CX, CY, R, 0, 359.99), count: 0 }]
  } else {
    let angle = -90
    order.forEach((label, i) => {
      const val = values[i]
      if (val === 0) return
      const sweep = (val / total) * 360
      slices.push({
        label,
        color: colorMap[label] || '#94a3b8',
        path: describeArc(CX, CY, R, angle, angle + sweep),
        count: val,
        midAngle: angle + sweep / 2,
      })
      angle += sweep
    })
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ fontSize:13, fontWeight:700, color:'#32363a', marginBottom:6, textAlign:'center' }}>{title}</div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:12, minHeight:0 }}>
        <svg viewBox="0 0 140 140" style={{ width:130, height:130, flexShrink:0 }}>
          {slices.map((s, i) => (
            <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth="2" />
          ))}
          <circle cx={CX} cy={CY} r={INNER} fill="white" />
          <text x={CX} y={CY - 6} textAnchor="middle" fontSize="18" fontWeight="800" fill="#32363a">{total}</text>
          <text x={CX} y={CY + 10} textAnchor="middle" fontSize="9" fill="#94a3b8">TOTAL</text>
        </svg>
        <div style={{ display:'flex', flexDirection:'column', gap:5, minWidth:0 }}>
          {order.map(label => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ width:10, height:10, borderRadius:2, background: colorMap[label] || '#94a3b8', flexShrink:0 }} />
              <span style={{ fontSize:11, color:'#6a6d70', whiteSpace:'nowrap' }}>{label}</span>
              <span style={{ fontSize:11, fontWeight:700, color:'#32363a', marginLeft:2 }}>{data[label] || 0}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const toRad = (a) => (a * Math.PI) / 180
  const x1 = cx + r * Math.cos(toRad(startAngle))
  const y1 = cy + r * Math.sin(toRad(startAngle))
  const x2 = cx + r * Math.cos(toRad(endAngle))
  const y2 = cy + r * Math.sin(toRad(endAngle))
  const large = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
}

// ═══════════════════════════════════════════════════════════════
// VERTICAL BAR CHART (3 bars only)
// ═══════════════════════════════════════════════════════════════
function BarChart({ title, data, colorMap, order }) {
  const labels = order
  const values = labels.map(l => data[l] || 0)
  const max    = Math.max(1, ...values)
  const niceMax = (() => {
    if (max <= 1) return 1
    const pow  = Math.pow(10, Math.floor(Math.log10(max)))
    const norm = max / pow
    let nice
    if (norm <= 1) nice = 1
    else if (norm <= 2) nice = 2
    else if (norm <= 5) nice = 5
    else nice = 10
    return nice * pow
  })()
  const steps    = 3
  const gridVals = Array.from({ length: steps + 1 }, (_, i) => Math.round((niceMax / steps) * i))
  const chartH   = 120
  const chartW   = 240

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ fontSize:13, fontWeight:700, color:'#32363a', marginBottom:6, textAlign:'center' }}>{title}</div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', minHeight:0 }}>
        <svg viewBox={`0 0 ${chartW + 50} ${chartH + 44}`} preserveAspectRatio="xMidYMid meet" style={{ width:'100%', height:'100%' }}>
          {gridVals.map((g, i) => {
            const y = chartH - (g / niceMax) * (chartH - 20) - 5
            return (
              <g key={i}>
                <line x1="40" y1={y} x2={chartW + 40} y2={y} stroke="#eef0f2" strokeWidth="1" />
                <text x="34" y={y + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{g}</text>
              </g>
            )
          })}
          {labels.map((label, i) => {
            const val   = values[i]
            const barW  = 44
            const slotW = chartW / labels.length
            const x     = 40 + i * slotW + (slotW - barW) / 2
            const barH  = niceMax === 0 ? 0 : (val / niceMax) * (chartH - 20)
            const y     = chartH - barH - 5
            const words = label.split(' ')
            return (
              <g key={label}>
                <rect x={x} y={y} width={barW} height={Math.max(barH, 0)} fill={colorMap[label] || '#94a3b8'} rx="2" />
                {val > 0 && (
                  <text x={x + barW/2} y={y - 5} textAnchor="middle" fontSize="12" fontWeight="700" fill="#32363a">{val}</text>
                )}
                {val === 0 && (
                  <text x={x + barW/2} y={chartH - 7} textAnchor="middle" fontSize="11" fill="#94a3b8">0</text>
                )}
                {words.map((w, wi) => (
                  <text key={wi} x={x + barW/2} y={chartH + 14 + wi * 12} textAnchor="middle" fontSize="10.5" fill="#6a6d70">{w}</text>
                ))}
              </g>
            )
          })}
          <line x1="40" y1={chartH - 5} x2={chartW + 40} y2={chartH - 5} stroke="#d9d9d9" strokeWidth="1" />
        </svg>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// HORIZONTAL BAR CHART (Delay Status)
// ═══════════════════════════════════════════════════════════════
function HorizontalBarChart({ title, data, colorMap, order }) {
  const labels   = order
  const values   = labels.map(l => data[l] || 0)
  const max      = Math.max(1, ...values)
  const niceMax  = (() => {
    if (max <= 5) return 5
    const pow  = Math.pow(10, Math.floor(Math.log10(max)))
    const norm = max / pow
    let nice
    if (norm <= 1) nice = 1
    else if (norm <= 2) nice = 2
    else if (norm <= 5) nice = 5
    else nice = 10
    return nice * pow
  })()
  const steps    = 3
  const gridVals = Array.from({ length: steps + 1 }, (_, i) => Math.round((niceMax / steps) * i))
  const rowH     = 36
  const chartW   = 280
  const plotW    = chartW - 100
  const chartH   = labels.length * rowH + 30

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ fontSize:13, fontWeight:700, color:'#32363a', marginBottom:6, textAlign:'center' }}>{title}</div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', minHeight:0 }}>
        <svg viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="xMidYMid meet" style={{ width:'100%', height:'100%', maxHeight: chartH + 10 }}>
          {gridVals.map((g, i) => {
            const x = 90 + (g / niceMax) * plotW
            return (
              <g key={i}>
                <line x1={x} y1="0" x2={x} y2={labels.length * rowH} stroke="#eef0f2" strokeWidth="1" />
                <text x={x} y={chartH - 4} textAnchor="middle" fontSize="10.5" fill="#94a3b8">{g}</text>
              </g>
            )
          })}
          {labels.map((label, i) => {
            const val  = values[i]
            const barH = 18
            const y    = i * rowH + (rowH - barH) / 2
            const barW = niceMax === 0 ? 0 : (val / niceMax) * plotW
            return (
              <g key={label}>
                <text x="86" y={y + barH/2 + 4} textAnchor="end" fontSize="11.5" fill="#6a6d70">{label}</text>
                <rect x="90" y={y} width={Math.max(barW, val > 0 ? 2 : 0)} height={barH} fill={colorMap[label] || '#94a3b8'} rx="2" />
                {val > 0 && (
                  <text x={90 + barW + 6} y={y + barH/2 + 4} fontSize="11.5" fontWeight="700" fill="#32363a">{val}</text>
                )}
                {val === 0 && (
                  <text x="96" y={y + barH/2 + 4} fontSize="11.5" fill="#94a3b8">0</text>
                )}
              </g>
            )
          })}
          <line x1="90" y1="0" x2="90" y2={labels.length * rowH} stroke="#d9d9d9" strokeWidth="1" />
        </svg>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CHART ROW
// FIX #3 — Order: Pie (today only) | Bar | Horizontal Bar
//           Pie is only shown for today's overview (not after search)
//           If today has no rows, show "No schedule for today" in pie slot
// ═══════════════════════════════════════════════════════════════
// chartData      — bar/horizontal bar data (search results or today if no search)
// todayChartData — pie chart data (ALWAYS today only, never changes with search)
// loading        — search loading state for bar charts
// todayLoading   — today's fetch loading state for pie
// todayHasData   — whether today has any deliveries
function ChartRow({ chartData, todayChartData, loading, todayHasData, todayLoading }) {
  return (
    <div className="px-4 sm:px-6 lg:px-10 pb-4 flex-shrink-0 anim-fade">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>

        {/* SLOT 1 — Pie: TODAY only, always, never affected by search */}
        <div
          className="bg-white rounded-xl border border-[#e5e5e5] shadow-sm p-4"
          style={{ height:210, position:'relative', order:1 }}
        >
          {todayLoading ? (
            <Spinner />
          ) : todayHasData ? (
            <PieChart
              title="Today's Status"
              data={todayChartData.shipment}
              colorMap={PIE_COLORS_STATUS}
              order={PIE_STATUS_ORDER}
            />
          ) : (
            <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d9d9d9" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              <div style={{ fontSize:13, fontWeight:700, color:'#6a6d70', textAlign:'center' }}>No Schedules for Today</div>
            </div>
          )}
        </div>

        {/* SLOT 2 — Shipment Status Bar: reflects search results (or today if no search) */}
        <div
          className="bg-white rounded-xl border border-[#e5e5e5] shadow-sm p-4"
          style={{ height:210, position:'relative', order:2 }}
        >
          {loading
            ? <Spinner />
            : <BarChart title="Shipment Status" data={chartData.shipment} colorMap={PIE_COLORS_STATUS} order={BAR_STATUS_ORDER} />
          }
        </div>

        {/* SLOT 3 — Delay Status Horizontal Bar: reflects search results (or today if no search) */}
        <div
          className="bg-white rounded-xl border border-[#e5e5e5] shadow-sm p-4"
          style={{ height:210, position:'relative', order:3 }}
        >
          {loading
            ? <Spinner />
            : <HorizontalBarChart title="Delay Status" data={chartData.delay} colorMap={PIE_COLORS_DELAY} order={DELAY_ORDER} />
          }
        </div>

      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div className="w-6 h-6 border-2 border-[#e5e5e5] border-t-[#0a6ed1] rounded-full animate-spin" />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// STATUS BADGE
// ═══════════════════════════════════════════════════════════════
function StatusBadge({ status }) {
  const map = {
    'Completed':          { bg:'#e8f5e9', color:'#107e3e', border:'#a8d5b5' },
    'Reached Plant':      { bg:'#fff8e1', color:'#b45309', border:'#f0c060' },
    'In Transit':         { bg:'#e8f0ff', color:'#0a6ed1', border:'#a0c0f0' },
    'Unloading Started':  { bg:'#f3e8ff', color:'#7c3aed', border:'#c4b5fd' },
    'Goods Received':     { bg:'#f0f0f5', color:'#32363a', border:'#c8c8d0' },
  }
  const s = map[status] || { bg:'#f5f6f7', color:'#6a6d70', border:'#d9d9d9' }
  return (
    <span style={{ background:s.bg, color:s.color, border:`1px solid ${s.border}`, borderRadius:6, padding:'2px 10px', fontSize:12, fontWeight:700, whiteSpace:'nowrap', display:'inline-block' }}>
      {status}
    </span>
  )
}

function TimeDelayLabel({ value }) {
  let color = '#32363a', weight = 500
  if (value === 'On Time')     { color = '#107e3e'; weight = 700 }
  else if (value === 'Delayed')     { color = '#cc1c14'; weight = 700 }
  else if (value === 'Before Time') { color = '#0a6ed1'; weight = 700 }
  return <span style={{ fontSize:12, color, fontWeight:weight }}>{value || '—'}</span>
}

// ═══════════════════════════════════════════════════════════════
// VALUE HELP MODAL
// ═══════════════════════════════════════════════════════════════
function ValueHelpModal({ title, options, onSelect, onCancel }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return options
    const q = search.trim().toLowerCase()
    return options.filter(o =>
      o.code.toLowerCase().includes(q) ||
      (o.label && o.label.toLowerCase().includes(q))
    )
  }, [options, search])

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backgroundColor:'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-xl shadow-2xl w-[360px] max-w-[95vw] overflow-hidden flex flex-col"
        style={{ maxHeight:'70vh', animation:'modalIn 0.2s ease-out both' }}>
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
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2 text-[#6a6d70] hover:text-[#cc1c14] transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
            {!search && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-3 top-2.5 text-[#6a6d70] pointer-events-none">
                <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
              </svg>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          {filtered.length === 0
            ? <div className="py-10 text-center text-[13px] text-[#6a6d70]">No results found</div>
            : filtered.map((opt, idx) => (
              // Use idx in key to handle duplicate codes
              <button key={`${opt.code}-${idx}`} onClick={() => onSelect(opt)}
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

function ValueHelpInput({ placeholder, value, onOpen }) {
  return (
    <div className="flex h-10 w-full border border-[#d9d9d9] rounded-lg overflow-hidden bg-white focus-within:border-[#0a6ed1] focus-within:ring-2 focus-within:ring-[#0a6ed1]/20 transition-all">
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
// DD/MM/YYYY DATE INPUT
// Uses three separate inputs so format is browser/OS independent.
// Internal value is always yyyy-mm-dd (ISO) — nothing else changes.
// ═══════════════════════════════════════════════════════════════
function DateInput({ value, onChange }) {
  const inputRef = useRef(null)

  // Format ISO yyyy-mm-dd → dd/mm/yyyy for display only
  const displayValue = value
    ? value.split('-').reverse().join('/')  // "2026-06-18" → "18/06/2026"
    : ''

  return (
    <div className="relative h-10 w-full">
      {/* Native date input — invisible but fully functional (handles calendar picker) */}
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      {/* Visual overlay showing dd/mm/yyyy format */}
      <div
        onClick={() => inputRef.current?.showPicker?.()}
        className="absolute inset-0 flex items-center justify-between px-3 h-10 border border-[#d9d9d9] rounded-lg bg-white cursor-pointer
                   focus-within:border-[#0a6ed1] transition-all"
      >
        <span className={`text-[14px] ${value ? 'text-[#32363a]' : 'text-[#94a3b8]'}`}>
          {displayValue || 'DD/MM/YYYY'}
        </span>
        {/* Calendar icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6a6d70" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
      </div>
    </div>
  )
}



// ═══════════════════════════════════════════════════════════════
// DETAIL VIEW
// FIX #4 — Left: Tracking No + Supplier  |  Right: Status (bold big) + Shipment Date + ETA
function DetailView({ trackingNo, trackYear, supplierName, onBack }) {
  const [detail,  setDetail]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    setLoading(true); setError(null)
    DeliveryScheduleApi.fetchDetail(trackingNo, trackYear)
      .then(d => { setDetail(d); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [trackingNo, trackYear])

  const displayTrackingNo = trackYear ? `${trackingNo}/${trackYear}` : trackingNo

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Back bar */}
      <div className="px-4 sm:px-6 lg:px-10 pt-4 pb-3 flex items-center gap-3 border-b border-[#e5e5e5] flex-shrink-0 anim-fade">
        <button onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded border border-[#d9d9d9] text-[#6a6d70] hover:text-[#0a6ed1] hover:border-[#0a6ed1] transition-all flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span className="text-[14px] text-[#6a6d70] font-medium">
          Tracking No. — <strong className="text-[#32363a]">{displayTrackingNo}</strong>
        </span>
      </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-[#6a6d70]">
              <div className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#0a6ed1] rounded-full animate-spin" />
              <span className="text-[14px]">Loading detail…</span>
              {/* Show supplier immediately from the list row while API loads */}
              {supplierName && (
                <span className="text-[13px] text-[#94a3b8]">{supplierName}</span>
              )}
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

          {/* ── Header card ── */}
          <div className="bg-white rounded-xl border border-[#e5e5e5] shadow-sm p-5 mb-5">
            <div className="flex flex-wrap items-start justify-between gap-4">

              {/* LEFT — Tracking No + Supplier */}
              <div className="flex flex-col gap-2">
                <div style={{
                  fontSize: 22, fontWeight: 800, color: '#b45309',
                  fontFamily: 'monospace', letterSpacing: 0.5,
                  background: '#fce8e6', display: 'inline-block',
                  borderRadius: 6, padding: '2px 10px'
                }}>
                  {displayTrackingNo}
                </div>
                {(detail.supplier || supplierName) && (
                  <div className="text-[13px] text-[#6a6d70]">
                    Supplier: <span className="font-semibold text-[#32363a]">{detail.supplier || supplierName}</span>
                  </div>
                )}
              </div>

              {/* RIGHT — Status (big bold) → Shipment Date → ETA */}
              <div className="flex flex-col items-end gap-1.5">
                {detail.status && (
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#107e3e', lineHeight: 1.2 }}>
                    {detail.status}
                  </div>
                )}
                {detail.shipmentDate && (
                  <div className="text-[12px] text-[#6a6d70]">
                    Shipment Date:&nbsp;<span className="font-semibold text-[#32363a]">{fmtDate(detail.shipmentDate)}</span>
                  </div>
                )}
                {detail.eta && (
                  <div className="text-[12px] text-[#6a6d70]">
                    ETA:&nbsp;<span className="font-semibold text-[#32363a]">{fmtDate(detail.eta)}</span>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ── Line items table ── */}
          {detail.items && detail.items.length > 0 ? (
            <div className="rounded-xl border border-[#e5e5e5] shadow-sm overflow-hidden">
              <div className="overflow-auto">
                <table className="text-[13px] w-full border-collapse" style={{ minWidth:900 }}>
                  <thead>
                    <tr className="bg-[#f5f6f7] text-[#6a6d70]">
                      {['ASN','IBD','Base Doc','Purchase Group','Invoice','Material','Description','Quantity'].map(h => (
                        <th key={h} className="text-center font-semibold py-3 px-3 text-[11px] uppercase tracking-wider border-b border-r border-[#e5e5e5] last:border-r-0">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="row-stagger">
                    {detail.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc] transition-colors">
                        <td className="py-3 px-3 text-center border-r border-[#f0f0f0]">
                          <span style={{ background:'#fce8e6', color:'#cc1c14', borderRadius:5, padding:'2px 8px', fontSize:12, fontWeight:700, fontFamily:'monospace', display:'inline-block' }}>
                            {item.asn}{item.asnYear ? `/${item.asnYear}` : ''}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center text-[#32363a] border-r border-[#f0f0f0] tabular-nums">{item.ibd || '—'}</td>
                        <td className="py-3 px-3 text-center text-[#0a6ed1] font-semibold border-r border-[#f0f0f0]">
                          {item.baseDoc ? `${item.docType ? item.docType + ' ' : ''}${item.baseDoc}` : '—'}
                        </td>
                        <td className="py-3 px-3 text-center text-[#32363a] border-r border-[#f0f0f0]">{item.purchaseGroup || '—'}</td>
                        <td className="py-3 px-3 text-center text-[#32363a] tabular-nums border-r border-[#f0f0f0]">{item.invoice || '—'}</td>
                        <td className="py-3 px-3 text-center font-semibold text-[#32363a] border-r border-[#f0f0f0]">{item.material}</td>
                        <td className="py-3 px-3 text-center text-[#6a6d70] border-r border-[#f0f0f0]">{item.description}</td>
                        <td className="py-3 px-3 text-center font-semibold text-[#32363a] tabular-nums">{item.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-[13px] text-[#6a6d70] bg-white rounded-xl border border-[#e5e5e5]">
              No line items available for this tracking number.
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
const STATUS_OPTIONS = ['', 'In Transit', 'Reached Plant', 'Unloading Started', 'Goods Received', 'Completed']

// Client-side filter acts as a safety net after the API returns rows.
// All fields now exist on the row object (see mapDeliveryRow).
// This guarantees filtering works even if SAP ignores certain OData filter params.
function applyClientFilters(rows, { status, supplier, material, asn, invoiceNo, trackSearch, startDate, endDate }) {
  return rows.filter(row => {
    // Status — exact match on StatusText
    if (status && row.status !== status) return false

    // Supplier — match on name OR vendor code (VH returns code, row.supplier is name)
    if (supplier) {
      const nameMatch = row.supplier    && row.supplier.toLowerCase().includes(supplier.toLowerCase())
      const codeMatch = row.vendorCode  && row.vendorCode.toLowerCase().includes(supplier.toLowerCase())
      if (!nameMatch && !codeMatch) return false
    }

    // Material / ASN / Invoice — only filter if the row has the field
    // (GoodsMvtHeaderSet may not return these; if empty, skip — SAP already filtered server-side)
    if (material  && row.material  && !row.material.toLowerCase().includes(material.toLowerCase()))   return false
    if (asn       && row.asn       && !row.asn.toLowerCase().includes(asn.toLowerCase()))             return false
    if (invoiceNo && row.invoiceNo && !row.invoiceNo.toLowerCase().includes(invoiceNo.toLowerCase())) return false

    // Track search — across trackingNo, plant, city
    if (trackSearch) {
      const q   = trackSearch.toLowerCase()
      const hit = String(row.trackingNo || '').toLowerCase().includes(q) ||
                  String(row.plant      || '').toLowerCase().includes(q) ||
                  String(row.city       || '').toLowerCase().includes(q)
      if (!hit) return false
    }

    // Date filter on shipmentDate (YYYYMMDD from SAP)
    if (startDate || endDate) {
      const shipYmd = String(row.shipmentDate || '').replace(/-/g, '').slice(0, 8)
      if (shipYmd && shipYmd !== '00000000') {
        if (startDate && shipYmd < startDate.replace(/-/g, '')) return false
        if (endDate   && shipYmd > endDate.replace(/-/g, ''))   return false
      }
    }

    return true
  })
}
const EMPTY_CHART = { shipment: {}, delay: {} }

export default function DeliverySchedule() {
  // const { loginId, loginType, loading: userLoading } = useUser()
  // authConfig.loginId   = loginId
  // authConfig.loginType = loginType
  const companyCode = '1000 (Comstar India)'

  const [view,             setView]             = useState('list')
  const [selectedTracking, setSelectedTracking] = useState(null)
  const [selectedYear,     setSelectedYear]     = useState(null)
  const [selectedSupplier, setSelectedSupplier] = useState(null)

  const [startDate,   setStartDate]   = useState(todayIso())
  const [endDate,     setEndDate]     = useState(todayIso())
  const [status,      setStatus]      = useState('')
  const [supplier,    setSupplier]    = useState('')
  const [material,    setMaterial]    = useState('')
  const [asn,         setAsn]         = useState('')
  const [invoiceNo,   setInvoiceNo]   = useState('')
  const [trackSearch, setTrackSearch] = useState('')

  // FIX #2 — date validation error message
  const [dateError, setDateError] = useState('')

  const [filterBarVisible, setFilterBarVisible] = useState(true)

  const [vhModal,   setVhModal]   = useState(null)
  const [vhOptions, setVhOptions] = useState([])

  const [rawRows,     setRawRows]     = useState([])
  const [loading,     setLoading]     = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error,       setError]       = useState(null)

  const [todayRows,    setTodayRows]    = useState([])
  const [todayLoading, setTodayLoading] = useState(true)
  const [todayFetched, setTodayFetched] = useState(false)

const rows = useMemo(() =>
  applyClientFilters(rawRows, { status, supplier, material, asn, invoiceNo, trackSearch, startDate, endDate }),
  [rawRows, status, supplier, material, asn, invoiceNo, trackSearch, startDate, endDate]
)

  const chartData      = useMemo(() => computeChartData(rows),     [rows])
  const todayChartData = useMemo(() => computeChartData(todayRows), [todayRows])

  // After search: bar & horizontal bar use search results; pie always uses today
  const activeBarChartData = hasSearched ? chartData : todayChartData

useEffect(() => {
  // if (userLoading) return
  // if (!loginId || !loginType) return
  const today = todayIso()

  // 1. Fetch today's rows for the pie chart — always runs on mount, never changes
  setTodayLoading(true)
  DeliveryScheduleApi.fetchDeliveries({ startDate: today, endDate: today })
    .then(data => {
      setTodayRows(data)
      setTodayFetched(true)
    })
    .catch(() => setTodayFetched(true))
    .finally(() => setTodayLoading(false))

  // 2. Also auto-load today's data into the main table on first render
  // so the user sees today's deliveries immediately without clicking Go.
  // Uses fetchTodayScheduled (Status 02–06) same as the "View Today's" link.
// 2. Auto-load today into main table using same fetchDeliveries as Go button
// fetchTodayScheduled (Status 02-06) is unreliable if SAP numeric codes differ
setLoading(true)
DeliveryScheduleApi.fetchDeliveries({ startDate: today, endDate: today })
  .then(data => {
    setRawRows(data)
    setHasSearched(true)
  })
  .catch(err => {
    console.warn('Mount auto-load failed:', err.message)
  })
  .finally(() => setLoading(false))
}, [])

  const openVh = async (field) => {
    setVhModal(field); setVhOptions([])
    try {
      let opts = []
      if      (field === 'supplier') opts = await DeliveryScheduleApi.fetchSupplierOptions()
      else if (field === 'material') opts = await DeliveryScheduleApi.fetchMaterialOptions()
      else if (field === 'asn')      opts = await DeliveryScheduleApi.fetchAsnOptions()
      else if (field === 'invoice')  opts = await DeliveryScheduleApi.fetchInvoiceOptions()
      setVhOptions(opts)
    } catch { setVhOptions([]) }
  }

  const handleVhSelect = (opt) => {
    if      (vhModal === 'supplier') setSupplier(opt.code)
    else if (vhModal === 'material') setMaterial(opt.code)
    else if (vhModal === 'asn')      setAsn(opt.code)
    else if (vhModal === 'invoice')  setInvoiceNo(opt.code)
    setVhModal(null)
  }

  // FIX #1 — pass ALL filters to API  |  FIX #2 — date validation
  const handleGo = async () => {
    console.log('handleGo fired with:', { startDate, endDate, status, supplier, material, asn, invoiceNo, trackSearch })
    // Date validation
    if (startDate && endDate && startDate > endDate) {
      setDateError('Start date must be on or before end date.')
      return
    }
    setDateError('')
    setLoading(true); setError(null)
    try {
      const data = await DeliveryScheduleApi.fetchDeliveries({
        startDate,
        endDate,
        status,
        supplier,
        material,
        asn,
        invoiceNo,
        trackSearch,
      })
      setRawRows(data); setHasSearched(true)
    } catch (err) {
      setError(err.message || 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setStartDate(todayIso()); setEndDate(todayIso())
    setStatus(''); setSupplier(''); setMaterial('')
    setAsn(''); setInvoiceNo(''); setTrackSearch('')
    setRawRows([]); setHasSearched(false); setError(null); setDateError('')
  }
  const handleViewToday = async () => {
  const today = todayIso()                   // e.g. "2026-06-18"
  setStartDate(today)                        // sync date inputs to today
  setEndDate(today)
  setStatus(''); setSupplier(''); setMaterial('')
  setAsn(''); setInvoiceNo(''); setTrackSearch('')
  setDateError('')
  setLoading(true); setError(null)
  try {
    const data = await DeliveryScheduleApi.fetchTodayScheduled(today)
    setRawRows(data)
    setHasSearched(true)
  } catch (err) {
    setError(err.message || 'Failed to fetch today\'s schedule')
  } finally {
    setLoading(false)
  }
}

 const handleRowClick = (trackingNo, trackYear, supplier) => {
  setSelectedTracking(trackingNo)
  setSelectedYear(trackYear)
  setSelectedSupplier(supplier || '')   
  setView('detail')
}
  const handleBack = () => { setView('list'); setSelectedTracking(null); setSelectedYear(null) }

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
        .tracking-row:hover .tracking-link { color:#085caf !important; text-decoration:underline; }
        .filter-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(160px, 1fr)); gap:16px; align-items:end; }
        .filter-field-track { grid-column:span 2; }
        @media (max-width:639px) { .filter-field-track { grid-column:span 1; } }
      `}</style>

      {vhModal && (
        <ValueHelpModal
          title={vhModal === 'supplier' ? 'Supplier' : vhModal === 'material' ? 'Material' : vhModal === 'asn' ? 'ASN' : 'Invoice No.'}
          options={vhOptions} onSelect={handleVhSelect} onCancel={() => setVhModal(null)}
        />
      )}

      <div className="bg-[#f5f6f7] min-h-[calc(100vh-104px)]">
        <main className="flex flex-col bg-white" style={{ minHeight:'calc(100vh - 220px)' }}>

          {/* Company code */}
          <div className="px-4 sm:px-6 lg:px-10 py-3 bg-white border-b border-[#e5e5e5] flex-shrink-0 text-center">
            <div className="text-[13px] text-[#6a6d70]">
              Company Code: <strong className="text-[#32363a]">{companyCode}</strong>
            </div>
          </div>

          {view === 'detail' ? (
            <DetailView trackingNo={selectedTracking} trackYear={selectedYear} supplierName={selectedSupplier} onBack={handleBack}/>
          ) : (
            <>
              {/* Header row */}
              <div className="px-4 sm:px-6 lg:px-10 pt-4 pb-3 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
                <h2 className="text-[15px] sm:text-[16px] font-bold text-[#32363a] tracking-tight">
                  {hasSearched ? 'Search Results' : 'Schedule for Today'}
                </h2>
                  <button
                    onClick={handleViewToday}
                    disabled={loading}
                    className="text-[13px] font-semibold text-[#0a6ed1] underline underline-offset-2 hover:text-[#085caf] hover:no-underline transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    View Today&apos;s Scheduled Items
                  </button>
                <div className="flex items-center gap-2 flex-wrap">
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

              {/* FIX #3 — Charts with corrected order and today-only pie */}
              <ChartRow
                chartData={activeBarChartData}
                todayChartData={todayChartData}
                loading={loading}
                todayHasData={todayRows.length > 0}
                todayLoading={todayLoading}
              />

              {/* Filter bar */}
              {filterBarVisible && (
                <div className="px-4 sm:px-6 lg:px-10 pb-4 flex-shrink-0 anim-fade border-t border-[#e5e5e5] pt-4">

                  {dateError && (
                    <div className="mb-3 flex items-center gap-2 px-4 py-2.5 bg-[#fce8e6] text-[#cc1c14] rounded-lg text-[13px] font-medium">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                      {dateError}
                    </div>
                  )}

                  <div className="filter-grid">
                    {/* FIX #3 — Removed SVG calendar icons; native date input has its own picker */}
                  {/* <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] text-[#6a6d70] font-semibold">
                      Start Date<span className="text-[#cc1c14]">*</span>
                    </label>
                    <input
                      type="date"
                      lang="en-GB"
                      value={startDate}
                      onChange={e => { setStartDate(e.target.value); setDateError('') }}
                      className="h-10 px-3 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all w-full"
                    />
                  </div> */}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] text-[#6a6d70] font-semibold">
                      Start Date<span className="text-[#cc1c14]">*</span>
                    </label>
                    <DateInput
                      value={startDate}
                      onChange={v => { setStartDate(v); setDateError('') }}
                    />
                  </div>
                  {/* <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] text-[#6a6d70] font-semibold">
                      End Date<span className="text-[#cc1c14]">*</span>
                    </label>
                    <input
                      type="date"
                      lang="en-GB"
                      value={endDate}
                      onChange={e => { setEndDate(e.target.value); setDateError('') }}
                      className="h-10 px-3 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all w-full"
                    />
                  </div> */}
                  <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] text-[#6a6d70] font-semibold">
                        End Date<span className="text-[#cc1c14]">*</span>
                      </label>
                      <DateInput
                        value={endDate}
                        onChange={v => { setEndDate(v); setDateError('') }}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] text-[#6a6d70] font-semibold">Status</label>
                      <div className="relative">
                        <select value={status} onChange={e => setStatus(e.target.value)}
                          className="h-10 pl-3 pr-8 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] appearance-none cursor-pointer w-full">
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
                        </select>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2.5 top-3.5 text-[#6a6d70] pointer-events-none"><path d="M6 9l6 6 6-6"/></svg>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] text-[#6a6d70] font-semibold">Supplier</label>
                      <ValueHelpInput placeholder="Select Supplier" value={supplier} onOpen={() => openVh('supplier')} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] text-[#6a6d70] font-semibold">Material</label>
                      <ValueHelpInput placeholder="Select Material" value={material} onOpen={() => openVh('material')} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] text-[#6a6d70] font-semibold">ASN</label>
                      <ValueHelpInput placeholder="Select ASN" value={asn} onOpen={() => openVh('asn')} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] text-[#6a6d70] font-semibold">Invoice No.</label>
                      <ValueHelpInput placeholder="Select Invoice No." value={invoiceNo} onOpen={() => openVh('invoice')} />
                    </div>
                    <div className="flex flex-col gap-1.5 filter-field-track">
                      <label className="text-[13px] text-[#6a6d70] font-semibold">Track no / Plant / City</label>
                      <div className="relative">
                        <input type="text" value={trackSearch} onChange={e => setTrackSearch(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleGo()}
                          placeholder="Track no / Plant / City"
                          className="w-full h-10 pl-3 pr-9 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-3 top-3 text-[#94a3b8]">
                          <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Table */}
              <div className="flex-1 overflow-hidden flex flex-col px-4 sm:px-6 lg:px-10 pb-6 pt-2 border-t border-[#e5e5e5]">
                {!hasSearched && !loading ? (
                  <div className="flex-1 flex items-center justify-center anim-fade py-10">
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
                    <div className="px-4 py-2 border-b border-[#e5e5e5] bg-[#fafbfc] flex-shrink-0">
                      <span className="text-[13px] text-[#6a6d70]">
                        <span className="font-semibold text-[#32363a]">{rows.length}</span> record{rows.length !== 1 ? 's' : ''} found
                        {rows.length !== rawRows.length && (
                          <span className="ml-2 text-[#0a6ed1]">(filtered from {rawRows.length} total)</span>
                        )}
                      </span>
                    </div>
                    <div className="overflow-auto flex-1 min-h-0">
                      <table className="text-[13px] border-collapse w-full" style={{ minWidth:800 }}>
                        <colgroup>
                          <col style={{ width:'160px' }} /><col style={{ width:'70px' }} />
                          <col style={{ width:'110px' }} /><col style={{ width:'110px' }} />
                          <col style={{ width:'110px' }} /><col style={{ width:'130px' }} />
                          <col style={{ width:'100px' }} /><col style={{ width:'90px' }} />
                          <col style={{ width:'150px' }} /><col style={{ width:'36px' }} />
                        </colgroup>
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-[#f5f6f7] text-[#6a6d70]">
                            {['Tracking No.','Plant','Shipment Date','ETA','ATA','Status','Time Delay','City','Supplier',''].map((h, i) => (
                              <th key={i} className="text-center font-semibold py-3 px-3 text-[11px] uppercase tracking-wider border-b border-r border-[#e5e5e5] last:border-r-0 bg-[#f5f6f7]">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="row-stagger">
                          {rows.length === 0 ? (
                            <tr><td colSpan={10} className="py-12 text-center text-[14px] text-[#6a6d70]">No records match the current filters</td></tr>
                          ) : rows.map((row, idx) => (
                            <tr key={`${row.trackingNo}-${idx}`}
                              className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#f0f7ff] transition-colors duration-100 cursor-pointer tracking-row"
                              onClick={() => handleRowClick(row.trackingNo, row.trackYear, row.supplier)}>
                              <td className="py-3 px-3 text-center border-r border-[#f0f0f0]">
                                <span className="tracking-link text-[#0a6ed1] font-semibold text-[12px] font-mono">
                                  {row.trackingNo}{row.trackYear ? `/${row.trackYear}` : ''}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center text-[#32363a] border-r border-[#f0f0f0]">{row.plant}</td>
                              <td className="py-3 px-3 text-center text-[#32363a] border-r border-[#f0f0f0] whitespace-nowrap">{fmtDate(row.shipmentDate)}</td>
                              <td className="py-3 px-3 text-center text-[#32363a] border-r border-[#f0f0f0] whitespace-nowrap">{fmtDate(row.eta)}</td>
                              <td className="py-3 px-3 text-center text-[#32363a] border-r border-[#f0f0f0] whitespace-nowrap">{fmtDate(row.ata)}</td>
                              <td className="py-3 px-3 text-center border-r border-[#f0f0f0]"><StatusBadge status={row.status} /></td>
                              <td className="py-3 px-3 text-center border-r border-[#f0f0f0]"><TimeDelayLabel value={row.timeDelay} /></td>
                              <td className="py-3 px-3 text-center text-[#32363a] border-r border-[#f0f0f0]">{row.city}</td>
                              <td className="py-3 px-3 text-center text-[#6a6d70] border-r border-[#f0f0f0] truncate max-w-[150px]">{row.supplier}</td>
                              <td className="py-3 px-2 text-[#94a3b8] text-center">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block"><path d="M9 18l6-6-6-6"/></svg>
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