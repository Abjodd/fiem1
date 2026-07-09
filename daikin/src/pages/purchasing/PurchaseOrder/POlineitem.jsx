import { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PageLayout from '../../../layouts/PageLayout.jsx'
import { useUser } from '../../../context/UserContext.jsx'
import { purchaseOrderApi, authConfig } from '../../../services/Purchasing/PurchaseOrder/PurchaseOrder.js'

// ── Constants ──────────────────────────────────────────────────
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_ABBR    = ['SUN','MON','TUE','WED','THU','FRI','SAT']

// ── Status config ──────────────────────────────────────────────
const STATUS_CONFIG = {
  'Confirmation Required': { bg: '#fff3e0', text: '#e65100', dot: '#ff9800', label: 'Confirmation Required' },
  'Partially Confirmed':   { bg: '#e3f2fd', text: '#1565c0', dot: '#1976d2', label: 'Partially Confirmed'   },
  'Confirmed':             { bg: '#e8f5e9', text: '#2e7d32', dot: '#43a047', label: 'Confirmed'             },
  'Completed':             { bg: '#f3e5f5', text: '#6a1b9a', dot: '#8e24aa', label: 'Completed'             },
}
const getStatus = (s) => STATUS_CONFIG[s] || { bg: '#f5f5f5', text: '#616161', dot: '#9e9e9e', label: s || 'Unknown' }

function StatusBadge({ status }) {
  const cfg = getStatus(status)
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

// ── Parse delivery date string (e.g. "Apr 22, 2026") → Date ───
function parseDeliveryDate(str) {
  if (!str) return null
  const d = new Date(str)
  if (!isNaN(d)) return d
  return null
}

// ── Build calendar columns from schedule lines ─────────────────
function buildCalendarCols(lines) {
  const seen = new Map()
  lines.forEach(line => {
    const d = parseDeliveryDate(line.deliveryDate)
    if (!d) return
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (!seen.has(key)) {
      seen.set(key, {
        date:       d,
        dateNum:    d.getDate(),
        dayAbbr:    DAY_ABBR[d.getDay()],
        monthLabel: MONTH_NAMES[d.getMonth()],
        year:       d.getFullYear(),
        monthKey:   `${d.getFullYear()}-${d.getMonth()}`,
        isSunday:   d.getDay() === 0,
        key,
      })
    }
  })
  return Array.from(seen.values()).sort((a, b) => a.date - b.date)
}

// ── Group calendar cols by month for colspan headers ───────────
function groupByMonth(cols) {
  const groups = []
  let cur = null
  cols.forEach(col => {
    if (!cur || cur.monthKey !== col.monthKey) {
      cur = { monthKey: col.monthKey, label: `${col.monthLabel} ${col.year}`, count: 0 }
      groups.push(cur)
    }
    cur.count++
  })
  return groups
}

// ── Map each schedule line to calendar col key ─────────────────
function mapLineToColKey(line) {
  const d = parseDeliveryDate(line.deliveryDate)
  if (!d) return null
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

// ── Calendar Grid ──────────────────────────────────────────────
function CalendarGrid({ item, lines, calCols, monthGroups }) {
  const colMap = useMemo(() => {
    const m = {}
    lines.forEach(line => {
      const k = mapLineToColKey(line)
      if (k) m[k] = line
    })
    return m
  }, [lines])

  const totalDelivery  = lines.reduce((s, l) => s + (Number(l.deliverySchedule) || 0), 0)
  const totalConfirmed = lines.reduce((s, l) => s + (Number(l.confirmedQty)     || 0), 0)
  const isFullyConfirmed =
  item.status === 'Confirmed' ||
  item.status === 'Completed' ||
  (totalConfirmed > 0 && totalConfirmed >= totalDelivery) ||
  (Number(item.confirmQty) > 0 && Number(item.confirmQty) >= Number(item.poQty))

  return (
    <div className="w-full overflow-x-auto">
      <table className="border-collapse text-[12px] w-full" style={{ tableLayout: 'auto' }}>
        <thead className="sticky top-0 z-10">
          {/* ── Row 1: fixed headers + month groups ── */}
          <tr className="bg-white">
            <th
              rowSpan={2}
              className="text-center font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] sticky left-0 bg-white z-20 text-[11px] uppercase tracking-wider text-[#6a6d70] whitespace-nowrap"
            >
              Item
            </th>
            <th
              rowSpan={2}
              className="text-center font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] text-[11px] uppercase tracking-wider text-[#6a6d70] whitespace-nowrap"
            >
              SAP Code
            </th>
            <th
              rowSpan={2}
              className="text-center font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] text-[11px] uppercase tracking-wider text-[#6a6d70]"
            >
              Description
            </th>
            <th
              rowSpan={2}
              className="text-center font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] text-[11px] uppercase tracking-wider text-[#6a6d70] whitespace-nowrap"
            >
              HSN Code
            </th>
            <th
              rowSpan={2}
              className="text-center font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] text-[11px] uppercase tracking-wider text-[#6a6d70] whitespace-nowrap"
            >
              Total Qty
            </th>

            {/* Month group headers */}
            {monthGroups.map(mg => (
              <th
                key={mg.monthKey}
                colSpan={mg.count}
                className="text-center text-[11px] font-bold py-1.5 border-b border-r border-[#e5e5e5] text-[#0a6ed1]"
                style={{ background: '#f0f7ff' }}
              >
                {mg.label}
              </th>
            ))}

            <th
              rowSpan={2}
              className="text-center font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] text-[11px] uppercase tracking-wider text-[#107e3e] whitespace-nowrap"
              style={{ background: '#e8f5ec' }}
            >
              Total
            </th>
            <th
              rowSpan={2}
              className="text-center font-semibold py-2.5 px-3 border-b border-[#e5e5e5] text-[11px] uppercase tracking-wider text-[#1565c0] whitespace-nowrap"
              style={{ background: '#e3f2fd' }}
            >
              Confirmed
            </th>
          </tr>

          {/* ── Row 2: date + day-of-week per col ── */}
          <tr style={{ background: '#fafbfc' }}>
            {calCols.map((cd) => (
              <th
                key={cd.key}
                className="border-b border-r border-[#e5e5e5] text-center px-2 py-1.5"
                style={{ background: cd.isSunday ? '#fff1f0' : '#f8fbff' }}
              >
                <div className={`text-[12px] font-bold leading-snug ${cd.isSunday ? 'text-[#cc1c14]' : 'text-[#32363a]'}`}>
                  {cd.dateNum}
                </div>
                <div className={`text-[9px] font-semibold leading-snug uppercase ${cd.isSunday ? 'text-[#cc1c14]' : 'text-[#6a6d70]'}`}>
                  {cd.dayAbbr}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          <tr className="border-b border-[#f0f0f0]">
            {/* Item No — green bg if fully confirmed */}
            <td
              className="py-3 px-3 border-r border-[#f0f0f0] sticky left-0 z-10 text-center transition-colors"
              style={{ background: isFullyConfirmed ? '#e8f5e9' : '#ffffff' }}
            >
              <div
                className="text-[13px] font-bold"
                style={{ color: isFullyConfirmed ? '#2e7d32' : '#32363a' }}
              >
                {item.itemNo}
              </div>
            </td>

            {/* SAP Code */}
            <td className="py-3 px-3 border-r border-[#f0f0f0] font-semibold text-[#0a6ed1] text-[12px] text-center whitespace-nowrap">
              {item.materialNumber}
            </td>

            {/* Description */}
            <td className="py-3 px-3 border-r border-[#f0f0f0] text-[#32363a] text-[12px] text-center">
              {item.materialName}
            </td>

            {/* HSN Code */}
            <td className="py-3 px-3 border-r border-[#f0f0f0] text-[#32363a] text-[12px] text-center whitespace-nowrap">
              {item.hsnCode || '—'}
            </td>

            {/* Total Qty */}
            <td className="py-3 px-3 border-r border-[#f0f0f0] text-center font-bold text-[#32363a] text-[12px] whitespace-nowrap">
              {Number(item.deliverySchedule || 0).toLocaleString()}
              {item.deliveryUnit && (
                <span className="ml-1 text-[10px] text-[#6a6d70] font-normal">{item.deliveryUnit}</span>
              )}
            </td>

            {/* Date cells */}
            {calCols.map((cd) => {
              const line         = colMap[cd.key]

              const confirmedQty = line ? (Number(line.confirmedQty)     || 0) : 0
              const deliveryQty  = line ? (Number(line.deliverySchedule) || 0) : 0
              const unit         = line ? (line.unit || item.deliveryUnit || '') : ''
              const hasData      = !!line

              // green = confirmed, red = not confirmed, transparent = no data
              let cellBg, cellText, cellBorder
              if (!hasData) {
                cellBg = 'transparent'; cellText = '#d9d9d9'; cellBorder = 'none'
              } else if (isFullyConfirmed) {
                cellBg = '#e8f5e9'; cellText = '#2e7d32'; cellBorder = '1.5px solid #a5d6a7'
              } else {
                cellBg = '#fce8e6'; cellText = '#cc1c14'; cellBorder = '1.5px solid #ef9a9a'
              }

              // show confirmed qty if available, else scheduled qty
              const shownQty = confirmedQty > 0 ? confirmedQty : deliveryQty

              return (
                <td
                  key={cd.key}
                  className="border-r border-[#f0f0f0] p-1.5 text-center"
                  style={{ background: cd.isSunday && !hasData ? '#fff8f8' : 'transparent' }}
                >
                  {hasData ? (
                    <div
                      className="date-cell rounded-lg py-2 px-2 mx-auto flex flex-col items-center gap-0.5 cursor-default"
                      style={{ background: cellBg, border: cellBorder, minWidth: 52 }}
                    >
                      {/* Qty + unit */}
                      <span className="flex items-baseline gap-0.5 justify-center">
                        <span className="text-[12px] font-bold tabular-nums leading-none" style={{ color: cellText }}>
                          {shownQty.toLocaleString()}
                        </span>
                        {unit && (
                          <span className="text-[9px] font-semibold uppercase leading-none" style={{ color: cellText, opacity: 0.7 }}>
                            {unit}
                          </span>
                        )}
                      </span>
                      {/* Icon */}
                      {isFullyConfirmed? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={cellText} strokeWidth="3" strokeLinecap="round">
                          <path d="M5 13l4 4L19 7"/>
                        </svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={cellText} strokeWidth="2.5" strokeLinecap="round">
                          <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
                        </svg>
                      )}
                    </div>
                  ) : (
                    <span className="block text-[10px] text-[#d9d9d9] py-2 text-center">—</span>
                  )}
                </td>
              )
            })}

            {/* Row total */}
            <td
              className="py-3 px-3 border-r border-[#f0f0f0] text-center font-bold tabular-nums text-[13px]"
              style={{ background: '#e8f5ec', color: '#107e3e' }}
            >
              {totalDelivery.toLocaleString()}
            </td>

            {/* Row confirmed */}
            <td
              className="py-3 px-3 text-center font-bold tabular-nums text-[13px]"
              style={{ background: '#e3f2fd', color: '#1565c0' }}
            >
              {totalConfirmed.toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function POlineitem() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginId, loginType, loading: userLoading } = useUser();
  authConfig.loginId   = loginId;
  authConfig.loginType = loginType;

  const { agreement, item: drilledItem } = location.state || {}

  const [scheduleLines, setScheduleLines] = useState([])
  const [linesLoading,  setLinesLoading]  = useState(false)
  const [linesError,    setLinesError]    = useState(null)

  useEffect(() => {
    if (userLoading) return;
    if (!loginId || !loginType) return;
    if (!drilledItem || !agreement) return
    let cancelled = false
    setLinesLoading(true)
    setLinesError(null)
    purchaseOrderApi
      .getLineItems(agreement.poNo, drilledItem.ebelp)
      .then(lines => { if (!cancelled) setScheduleLines(lines) })
      .catch(err  => { if (!cancelled) setLinesError(err.message) })
      .finally(()  => { if (!cancelled) setLinesLoading(false) })
    return () => { cancelled = true }
  }, [userLoading, loginId, loginType, drilledItem, agreement])

  const calCols     = useMemo(() => buildCalendarCols(scheduleLines), [scheduleLines])
  const monthGroups = useMemo(() => groupByMonth(calCols), [calCols])

  // ── Fallback ──
  if (!drilledItem || !agreement) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-64 text-[#6a6d70]">
          <span className="text-[14px]">No item data. Please go back and select an item.</span>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-5 h-10 text-[14px] font-semibold text-[#0a6ed1] bg-[#ebf5ff] rounded-lg hover:bg-[#d9ecff] transition-all"
          >
            ← Go Back
          </button>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <style>{`
        @keyframes fadeIn       { from { opacity: 0; transform: translateY(8px);  } to { opacity: 1; transform: translateY(0);  } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0);  } }
        .anim-fade    { animation: fadeIn        0.35s ease-out both; }
        .anim-slide-r { animation: slideInRight  0.35s ease-out both; }

        .date-cell {
          transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
        }
        .date-cell:hover {
          transform: translateY(-2px) scale(1.04);
          box-shadow: 0 4px 12px rgba(0,0,0,0.10);
          filter: brightness(0.96);
          z-index: 1;
          position: relative;
        }

        @media (max-width: 640px) {
          .col-desc { display: none; }
          .col-hsn  { display: none; }
        }
      `}</style>

      <div className="flex flex-col bg-[#f5f6f7]" style={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

        {/* ── Top bar ── */}
        <div className="bg-white border-b border-[#e5e5e5] px-4 sm:px-8 lg:px-12 py-5 flex-shrink-0 anim-fade">

          {/* Material info */}
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="text-left">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-[14px] text-[#0a6ed1] hover:underline mb-5 hover:-translate-x-0.5 transition-transform"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
              Back to Items
            </button>
            
              <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">Material Number</div>
              <h2 className="text-[22px] sm:text-[26px] font-bold text-[#0a6ed1] tracking-tight">{drilledItem.materialNumber}</h2>
              <div className="text-[14px] text-[#6a6d70] mt-1">{drilledItem.materialName}</div>
              
            </div>

            {/* PO meta */}
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">Purchase Order</div>
              <div className="text-[16px] font-bold text-[#32363a]">{agreement.poNo}</div>
              <div className="text-[13px] text-[#6a6d70] mt-0.5">{agreement.vendor}</div>
              <div className="text-[13px] text-[#6a6d70]">{agreement.plantDesc} ({agreement.plant})</div>
              <div className="mt-2.5"><StatusBadge status={drilledItem.status} /></div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 text-[11px] text-[#6a6d70] flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#e8f5e9', border: '1.5px solid #a5d6a7' }} />
              Confirmed
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#fce8e6', border: '1.5px solid #ef9a9a' }} />
              Pending confirmation
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#fff1f0', border: '1px solid #ffd6d6' }} />
              Sunday
            </div>
          </div>
        </div>

        {/* ── Grid area ── */}
        <div
          className="flex-1 px-4 sm:px-8 lg:px-12 py-5 anim-slide-r overflow-auto"
          style={{ animationDelay: '.08s' }}
        >
          {linesLoading ? (
            <div className="flex items-center justify-center h-40 gap-2 text-[13px] text-[#6a6d70]">
              <div className="w-5 h-5 border-2 border-[#e5e5e5] border-t-[#0a6ed1] rounded-full animate-spin"/>
              Loading schedule lines…
            </div>
          ) : linesError ? (
            <div className="flex items-center gap-2 text-[13px] text-[#cc1c14] bg-[#fce8e6] px-4 py-3 rounded-lg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
              {linesError}
            </div>
          ) : scheduleLines.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-[#6a6d70]">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-30">
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              <span className="text-[14px]">No schedule lines found</span>
            </div>
          ) : (
            <div className="rounded-xl border border-[#e5e5e5] bg-white shadow-sm overflow-hidden">
              <CalendarGrid
                item={drilledItem}
                lines={scheduleLines}
                calCols={calCols}
                monthGroups={monthGroups}
              />
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}