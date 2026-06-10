
import { useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PageLayout from '../../layouts/PageLayout.jsx'
import { scheduleGenerateApi } from '../../services/ScheduleGenerate.js'

// ─── calendar helpers ─────────────────────────────────────────
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_ABBR   = ['SUN','MON','TUE','WED','THU','FRI','SAT']

/** Build an array of Date objects starting today for `count` days */
function buildCalendarDays(count = 30) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return d
  })
}

/** Group consecutive days by month → [{month:'Jun', year:2026, span:N}, …] */
function groupByMonth(days) {
  const groups = []
  days.forEach((d) => {
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!groups.length || groups[groups.length - 1].key !== key) {
      groups.push({ key, month: MONTH_NAMES[d.getMonth()], year: d.getFullYear(), span: 1 })
    } else {
      groups[groups.length - 1].span++
    }
  })
  return groups
}

// Placeholder: treat no days as govt. holiday (replace with real data)
const GOVT_HOLIDAYS = new Set([
  // e.g. '2026-08-15', '2026-10-02'
])
function isGovtHoliday(d) {
  const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  return GOVT_HOLIDAYS.has(key)
}
function isSunday(d)   { return d.getDay() === 0 }
function isSaturday(d) { return d.getDay() === 6 }

// ─── cell bg ──────────────────────────────────────────────────
function cellBg(d) {
  if (isSunday(d))     return '#fff1f0'
  if (isGovtHoliday(d)) return '#fff7e6'
  return 'transparent'
}
function headerBg(d) {
  if (isSunday(d))     return '#fff1f0'
  if (isGovtHoliday(d)) return '#fff7e6'
  return '#f8fbff'
}

// ─── ScheduleLines page ───────────────────────────────────────
export default function ScheduleLines() {
  const navigate  = useNavigate()
  const { state } = useLocation()

  const {
    lines: initialLines = [],
    editable = false,
    title    = 'Schedule Lines',
    mode     = '',           // 'DAILY' | 'WEEKLY' | ''
    agreementId  = '',
    supplierName = '',
  } = state || {}

  const [editLines, setEditLines] = useState(() =>
    initialLines.map(l => ({
      ...l,
      days: l.days ? [...l.days] : Array(30).fill(0),
      forecast: l.forecast ? [...l.forecast] : [0, 0, 0],
    }))
  )
  const [saving, setSaving] = useState(false)

  const calDays    = useMemo(() => buildCalendarDays(30), [])
  const monthGroups = useMemo(() => groupByMonth(calDays), [calDays])

  // ── cell edit ──
  const handleCellChange = (li, di, val) => {
    setEditLines(prev => prev.map((l, i) => {
      if (i !== li) return l
      const days = [...l.days]
      days[di] = Math.max(0, parseInt(val) || 0)
      return { ...l, days, total: days.reduce((s, v) => s + v, 0) }
    }))
  }

  // ── validation ──
  const overLines = editLines.filter(l => l.days.reduce((s,v)=>s+v,0) > l.totalQuantity)
  const canSave   = !saving && overLines.length === 0

  // ── save ──
  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await scheduleGenerateApi.saveScheduleLines(agreementId, editLines)
      navigate(-1, { state: { savedLines: editLines } })
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const displayLines = editable ? editLines : initialLines.map(l => ({
    ...l,
    days: l.days || Array(30).fill(0),
  }))

  return (
    <PageLayout>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .sl-fade { animation: fadeIn .28s ease-out both; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
        .cell-input {
          width:100%; height:28px; text-align:center; font-size:11px; font-weight:600;
          border:0; background:transparent;
          transition: background .15s, box-shadow .15s;
        }
        .cell-input:focus {
          background:#ebf5ff; outline:none;
          box-shadow: inset 0 0 0 1.5px #0a6ed1;
          border-radius:4px;
        }
      `}</style>

      <div className="flex flex-col bg-[#f5f6f7]" style={{ minHeight: 'calc(100vh - 64px)' }}>

        {/* ── Top bar ── */}
        <div className="bg-white border-b border-[#e5e5e5] px-4 sm:px-8 lg:px-12 py-4 flex-shrink-0 sl-fade">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[12px] text-[#6a6d70] mb-3">
            <button onClick={() => navigate(-1)} className="hover:text-[#0a6ed1] transition-colors font-medium">
              Schedule Agreement
            </button>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6"/>
            </svg>
            <span className="text-[#32363a] font-semibold">{title}</span>
          </nav>

          {/* Title row */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-[22px] sm:text-[26px] font-bold text-[#32363a] tracking-tight">{title}</h1>
              {mode && (
                <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider ${mode === 'DAILY' ? 'bg-[#fff3e8] text-[#e76500]' : 'bg-[#ebf5ff] text-[#0a6ed1]'}`}>
                  {mode}
                </span>
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-[11px] text-[#6a6d70]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ background:'#fff1f0', border:'1px solid #ffd6d6' }} />
                Sunday
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ background:'#fff7e6', border:'1px solid #ffe7ba' }} />
                Govt. Holiday
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ background:'#e8f5ec', border:'1px solid #b7e2c4' }} />
                Fully allocated
              </div>
            </div>
          </div>

          {/* Sub-line */}
          <div className="mt-1.5 text-[12px] text-[#6a6d70]">
            {displayLines.length} item{displayLines.length !== 1 ? 's' : ''}
            {agreementId  && <> · <span className="font-semibold text-[#32363a]">{agreementId}</span></>}
            {supplierName && <> · {supplierName}</>}
          </div>
        </div>

        {/* ── Grid ── */}
        <div className="flex-1 overflow-hidden px-4 sm:px-8 lg:px-12 py-4 sl-fade" style={{ animationDelay: '.05s' }}>
          <div className="h-full overflow-auto rounded-xl border border-[#e5e5e5] bg-white shadow-sm">
            <table className="border-collapse text-[12px]" style={{ minWidth: '1800px' }}>
              <thead className="sticky top-0 z-10">

                {/* Row 1 — month groups */}
                <tr className="bg-white">
                  {/* fixed cols */}
                  <th className="border-b border-r border-[#e5e5e5] sticky left-0 bg-white z-20" style={{ minWidth:60 }} />
                  <th className="border-b border-r border-[#e5e5e5]" style={{ minWidth:80 }} />
                  <th className="border-b border-r border-[#e5e5e5]" style={{ minWidth:150 }} />
                  <th className="border-b border-r border-[#e5e5e5]" style={{ minWidth:90 }} />
                  <th className="border-b border-r border-[#e5e5e5]" style={{ minWidth:80 }} />
                  {/* month headers */}
                  {monthGroups.map(g => (
                    <th key={g.key} colSpan={g.span}
                      className="text-center text-[11px] font-bold py-1.5 border-b border-r border-[#e5e5e5] text-[#0a6ed1]"
                      style={{ background:'#f0f7ff' }}>
                      {g.month} {g.year}
                    </th>
                  ))}
                  {/* total + forecast */}
                  <th className="border-b border-r border-[#e5e5e5] bg-[#f0fff4]" style={{ minWidth:64 }} />
                  <th colSpan={3} className="text-center text-[11px] font-bold py-1.5 border-b border-[#e5e5e5] text-[#b45309]" style={{ background:'#fef7e6' }}>
                    Forecast
                  </th>
                </tr>

                {/* Row 2 — column labels */}
                <tr className="bg-[#fafbfc] text-[#6a6d70]">
                  <th className="text-left font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] sticky left-0 bg-[#fafbfc] z-20 text-[11px] uppercase tracking-wider">Item</th>
                  <th className="text-left font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] text-[11px] uppercase tracking-wider">SAP Code</th>
                  <th className="text-left font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] text-[11px] uppercase tracking-wider">Description</th>
                  <th className="text-left font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] text-[11px] uppercase tracking-wider">HSN Code</th>
                  <th className="text-center font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] text-[11px] uppercase tracking-wider">Total Qty</th>
                  {/* date + day-of-week */}
                  {calDays.map((d, i) => (
                    <th key={i}
                      className="border-b border-r border-[#e5e5e5] text-center"
                      style={{ minWidth:38, background: headerBg(d) }}>
                      <div className={`text-[11px] font-bold leading-tight ${isSunday(d) ? 'text-[#cc1c14]' : 'text-[#32363a]'}`}>
                        {d.getDate()}
                      </div>
                      <div className={`text-[9px] font-semibold leading-tight ${isSunday(d) ? 'text-[#cc1c14]' : 'text-[#6a6d70]'}`}>
                        {DAY_ABBR[d.getDay()]}
                      </div>
                    </th>
                  ))}
                  <th className="text-center font-semibold py-2.5 px-2 border-b border-r border-[#e5e5e5] text-[11px] uppercase tracking-wider text-[#107e3e]" style={{ minWidth:64, background:'#e8f5ec' }}>Total</th>
                  {['N1','N2','N3'].map(n => (
                    <th key={n} className="text-center font-semibold py-2.5 px-2 border-b border-r border-[#e5e5e5] text-[11px]" style={{ minWidth:38, background:'#fef7e6', color:'#b45309' }}>{n}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {displayLines.map((line, li) => {
                  const allocated = line.days.reduce((s,v)=>s+v,0)
                  const over      = allocated > line.totalQuantity
                  const full      = allocated === line.totalQuantity && allocated > 0
                  const pct       = Math.min(100, line.totalQuantity > 0 ? Math.round((allocated/line.totalQuantity)*100) : 0)
                  return (
                    <tr key={line.itemNo} className={`border-b border-[#f0f0f0] transition-colors ${over ? 'bg-[#fff5f5]' : 'hover:bg-[#fafbfc]'}`}>

                      {/* Item + progress */}
                      <td className={`py-2 px-3 border-r border-[#f0f0f0] sticky left-0 z-10 ${over ? 'bg-[#fff5f5]' : full ? 'bg-[#f0fff4]' : 'bg-white'}`}>
                        <div className="text-[12px] font-bold text-[#32363a]">{line.itemNo}</div>
                        <div className="mt-1 w-full h-1.5 bg-[#e5e5e5] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-300 ${over ? 'bg-[#cc1c14]' : full ? 'bg-[#107e3e]' : 'bg-[#0a6ed1]'}`}
                            style={{ width:`${pct}%` }} />
                        </div>
                        <div className={`text-[9px] mt-0.5 tabular-nums font-semibold ${over ? 'text-[#cc1c14]' : full ? 'text-[#107e3e]' : 'text-[#6a6d70]'}`}>
                          {allocated.toLocaleString()} / {line.totalQuantity.toLocaleString()}
                          {over && <span> (+{(allocated-line.totalQuantity).toLocaleString()})</span>}
                        </div>
                      </td>

                      <td className="py-2 px-3 border-r border-[#f0f0f0] font-semibold text-[#0a6ed1]">{line.sapCode}</td>
                      <td className="py-2 px-3 border-r border-[#f0f0f0] text-[#32363a]">{line.description}</td>
                      <td className="py-2 px-3 border-r border-[#f0f0f0] text-[#32363a]">{line.hsnCode}</td>
                      <td className="py-2 px-3 border-r border-[#f0f0f0] text-center font-bold text-[#32363a]">{line.totalQuantity}</td>

                      {calDays.map((d, di) => {
                        const val = line.days[di] ?? 0
                        const bg  = isSunday(d) ? '#fff1f0' : isGovtHoliday(d) ? '#fff7e6' : 'transparent'
                        return (
                          <td key={di} className="border-r border-[#f0f0f0] p-0 text-center" style={{ background: bg }}>
                            {editable ? (
                              <input
                                type="number" min="0"
                                value={val}
                                onChange={e => handleCellChange(li, di, e.target.value)}
                                className="cell-input"
                              />
                            ) : (
                              <span className={`text-[11px] tabular-nums block py-1.5 ${val > 0 ? 'font-bold text-[#32363a]' : 'text-[#d9d9d9]'}`}>
                                {val || 0}
                              </span>
                            )}
                          </td>
                        )
                      })}

                      {/* row total */}
                      <td className={`py-2 px-3 border-r border-[#f0f0f0] text-center font-bold tabular-nums text-[12px] ${over ? 'text-[#cc1c14] bg-[#fce8e6]' : full ? 'text-[#107e3e] bg-[#e8f5ec]' : 'text-[#32363a] bg-[#f0fff4]'}`}>
                        {allocated}
                      </td>

                      {/* forecast */}
                      {(line.forecast || [0,0,0]).map((f, fi) => (
                        <td key={fi} className="py-2 px-2 border-r border-[#f0f0f0] text-center text-[11px] text-[#b45309]" style={{ background:'#fffdf5' }}>
                          {f || ''}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Sticky bottom bar ── */}
        <div className="flex-shrink-0 bg-white border-t border-[#e5e5e5] shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
          {/* over-quota warning */}
          {editable && overLines.length > 0 && (
            <div className="flex items-center gap-2 px-6 py-2 bg-[#fce8e6] border-b border-[#f5c6c2]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#cc1c14" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
              <span className="text-[12px] text-[#cc1c14] font-semibold">
                {overLines.length} item{overLines.length > 1 ? 's' : ''} exceed Total Qty — reduce allocation before saving
              </span>
            </div>
          )}

          <div className="flex items-center justify-between px-4 sm:px-8 lg:px-12 py-3 gap-4">
            {/* Per-item mini progress */}
            <div className="flex items-center gap-4 overflow-x-auto flex-1 min-w-0">
              {displayLines.map(line => {
                const alloc = line.days.reduce((s,v)=>s+v,0)
                const over  = alloc > line.totalQuantity
                const full  = alloc === line.totalQuantity && alloc > 0
                const pct   = Math.min(100, line.totalQuantity > 0 ? Math.round((alloc/line.totalQuantity)*100) : 0)
                return (
                  <div key={line.itemNo} className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] font-bold text-[#32363a]">{line.itemNo}</span>
                    <div className="w-20 h-2 bg-[#e5e5e5] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${over ? 'bg-[#cc1c14]' : full ? 'bg-[#107e3e]' : 'bg-[#0a6ed1]'}`}
                        style={{ width:`${pct}%` }} />
                    </div>
                    <span className={`text-[11px] font-semibold tabular-nums ${over ? 'text-[#cc1c14]' : full ? 'text-[#107e3e]' : 'text-[#6a6d70]'}`}>
                      {pct}%
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => navigate(-1)}
                disabled={saving}
                className="px-5 h-10 text-[13px] font-semibold text-[#cc1c14] bg-[#fce8e6] border border-[#fce8e6] rounded-lg hover:bg-[#fad6d3] transition-all disabled:opacity-50">
                Cancel
              </button>
              {editable && (
                <button
                  onClick={handleSave}
                  disabled={!canSave}
                  className="flex items-center gap-2 px-6 h-10 text-[13px] font-semibold text-white bg-[#107e3e] rounded-lg hover:bg-[#0d6633] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                  {saving && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  {saving ? 'Saving…' : 'Save'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}