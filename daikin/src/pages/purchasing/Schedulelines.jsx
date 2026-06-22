// src/pages/purchasing/ScheduleLinesPage.jsx
// Route: /purchasing/schedule-lines

import { useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PageLayout from '../../layouts/PageLayout.jsx'
import { scheduleGenerateApi } from '../../services/ScheduleGenerate.js'

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_ABBR    = ['SUN','MON','TUE','WED','THU','FRI','SAT']

const GOVT_HOLIDAYS_MD = new Set(['01-26', '08-15', '10-02'])

// ═══════════════════════════════════════════════════════════════
// DATE HELPERS
// ═══════════════════════════════════════════════════════════════
function isBlocked(date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return GOVT_HOLIDAYS_MD.has(`${mm}-${dd}`)
}

function isSunday(date)  { return date.getDay() === 0 }
function isHoliday(date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return GOVT_HOLIDAYS_MD.has(`${mm}-${dd}`)
}

function nextValidDayInMonth(date) {
  const d = new Date(date)
  const month = d.getMonth()
  while ((isSunday(d) || isBlocked(d)) && d.getMonth() === month) {
    d.setDate(d.getDate() + 1)
  }
  return d.getMonth() === month ? d : null
}

// ═══════════════════════════════════════════════════════════════
// CALENDAR DAYS
// ═══════════════════════════════════════════════════════════════
function buildCalendarDays() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const year    = today.getFullYear()
  const month   = today.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()
  const days    = []

  for (let d = 1; d <= lastDay; d++) {
    const date   = new Date(year, month, d)
    const isPast = date < today
    days.push({
      date,
      dateNum:    d,
      dayAbbr:    DAY_ABBR[date.getDay()],
      monthLabel: MONTH_NAMES[month],
      year,
      isSunday:   isSunday(date),
      isHoliday:  isHoliday(date),
      blocked:    isBlocked(date),
      blockedSunday: isSunday(date),
      isPast,
    })
  }
  return days
}

// ═══════════════════════════════════════════════════════════════
// ALLOCATION LOGIC
// ═══════════════════════════════════════════════════════════════
function allocateByDay(totalQty, dayCount, calDays) {
  const validIndices = []
  for (let i = 0; i < calDays.length && validIndices.length < dayCount; i++) {
    if (!calDays[i].blocked && !calDays[i].blockedSunday && !calDays[i].isPast) validIndices.push(i)
  }
  const slots  = validIndices.length
  if (slots === 0) return Array(calDays.length).fill(0)
  const base   = Math.floor(totalQty / slots)
  const rem    = totalQty % slots
  const result = Array(calDays.length).fill(0)
  validIndices.forEach((ci, i) => { result[ci] = base + (i < rem ? 1 : 0) })
  return result
}

function allocateByWeek(totalQty, calDays) {
  if (calDays.length === 0) return []
  const firstNonPast = calDays.find(cd => !cd.isPast)
  if (!firstNonPast) return Array(calDays.length).fill(0)

  const startDate = firstNonPast.date
  const year      = startDate.getFullYear()
  const month     = startDate.getMonth()
  const monthEnd  = new Date(year, month + 1, 0)

  const anchorDates = []
  let cursor = new Date(startDate)
  while (cursor <= monthEnd) {
    const valid = nextValidDayInMonth(new Date(cursor))
    if (valid && valid <= monthEnd && valid.getMonth() === month) {
      anchorDates.push(new Date(valid))
    }
    cursor.setDate(cursor.getDate() + 7)
  }

  if (anchorDates.length === 0) return Array(calDays.length).fill(0)
  const slots  = anchorDates.length
  const base   = Math.floor(totalQty / slots)
  const rem    = totalQty % slots
  const result = Array(calDays.length).fill(0)
  anchorDates.forEach((ad, i) => {
    const ci = calDays.findIndex(cd =>
      cd.date.getFullYear() === ad.getFullYear() &&
      cd.date.getMonth()    === ad.getMonth()    &&
      cd.date.getDate()     === ad.getDate()
    )
    if (ci !== -1) result[ci] = base + (i < rem ? 1 : 0)
  })
  return result
}

function buildInitialLines(itemsData, mode, dayCount, calDays) {
  return itemsData.map(it => {
    let days
    if (mode === 'WEEKLY') {
      days = allocateByWeek(it.totalQuantity, calDays)
    } else if (mode === 'DAILY') {
      days = allocateByDay(it.totalQuantity, dayCount || 5, calDays)
    } else {
      days = it.days
        ? [...it.days].slice(0, calDays.length)
            .concat(Array(Math.max(0, calDays.length - (it.days.length || 0))).fill(0))
        : Array(calDays.length).fill(0)
    }
    return {
      ...it,
      days,
      forecast: it.forecast ? [...it.forecast] : [0, 0, 0],
    }
  })
}

// ═══════════════════════════════════════════════════════════════
// SCHEDULE GRID
// Includes read-only Indicator column after Total Qty
// ═══════════════════════════════════════════════════════════════
function ScheduleGrid({ lines, editable, calDays, onChange }) {
  const handleCellChange = (li, di, val) => {
    if (!onChange) return
    const isCellBlocked = calDays[di]?.blocked || (calDays[di]?.blockedSunday && !editable)
    if (isCellBlocked) return
    onChange(prev => prev.map((l, i) => {
      if (i !== li) return l
      const days = [...l.days]
      days[di] = Math.max(0, parseInt(val) || 0)
      return { ...l, days }
    }))
  }

  return (
    <table className="border-collapse text-[12px]" style={{ minWidth: `${440 + calDays.length * 42}px` }}>
      <thead className="sticky top-0 z-10">

        {/* ── Row 1: Month label ── */}
        <tr className="bg-white">
          <th rowSpan={2}
            className="text-left font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] sticky left-0 bg-white z-20 text-[11px] uppercase tracking-wider text-[#6a6d70]"
            style={{ minWidth: 80 }}>Item</th>
          <th rowSpan={2}
            className="text-left font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] text-[11px] uppercase tracking-wider text-[#6a6d70]"
            style={{ minWidth: 85 }}>SAP Code</th>
          <th rowSpan={2}
            className="text-left font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] text-[11px] uppercase tracking-wider text-[#6a6d70]"
            style={{ minWidth: 155 }}>Description</th>
          <th rowSpan={2}
            className="text-left font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] text-[11px] uppercase tracking-wider text-[#6a6d70]"
            style={{ minWidth: 90 }}>HSN Code</th>
          <th rowSpan={2}
            className="text-center font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] text-[11px] uppercase tracking-wider text-[#6a6d70]"
            style={{ minWidth: 80 }}>Total Qty</th>

          {/* ── Indicator column header ── */}
          <th rowSpan={2}
            className="text-center font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] text-[11px] uppercase tracking-wider text-[#6a6d70]"
            style={{ minWidth: 72 }}>Indicator</th>

          {calDays.length > 0 && (
            <th
              colSpan={calDays.length}
              className="text-center text-[11px] font-bold py-1.5 border-b border-r border-[#e5e5e5] text-[#0a6ed1]"
              style={{ background: '#f0f7ff' }}
            >
              {calDays[0].monthLabel} {calDays[0].year}
            </th>
          )}

          <th rowSpan={2}
            className="text-center font-semibold py-2.5 px-2 border-b border-r border-[#e5e5e5] text-[11px] uppercase tracking-wider text-[#107e3e]"
            style={{ minWidth: 68, background: '#e8f5ec' }}>Total</th>

          <th colSpan={3}
            className="text-center text-[11px] font-bold py-1.5 border-b border-[#e5e5e5] text-[#b45309]"
            style={{ background: '#fef7e6' }}>Forecast</th>
        </tr>

        {/* ── Row 2: Date + day-of-week ── */}
        <tr style={{ background: '#fafbfc' }}>
          {calDays.map((cd, i) => {
            const bg = cd.isSunday
              ? '#fff1f0'
              : cd.isHoliday
                ? '#fff7e6'
                : '#f8fbff'
            return (
              <th
                key={i}
                className="border-b border-r border-[#e5e5e5] text-center px-0 py-1"
                style={{ minWidth: 42, background: bg }}
                title={
                  cd.isPast    ? 'Past date (editable)'
                  : cd.isHoliday ? 'Government Holiday'
                  : cd.isSunday  ? 'Sunday — blocked'
                  : ''
                }
              >
                <div className={`text-[11px] font-bold leading-snug
                  ${cd.isSunday ? 'text-[#cc1c14]' : 'text-[#32363a]'}`}>
                  {cd.dateNum}
                </div>
                <div className={`text-[9px] font-semibold leading-snug uppercase
                  ${cd.isSunday  ? 'text-[#cc1c14]'
                  : cd.isHoliday ? 'text-[#e76500]'
                  : 'text-[#6a6d70]'}`}>
                  {cd.isHoliday && !cd.isPast ? 'HOL' : cd.dayAbbr}
                </div>
              </th>
            )
          })}
          {['N1','N2','N3'].map(n => (
            <th
              key={n}
              className="text-center font-semibold py-2 px-1 border-b border-r border-[#e5e5e5] text-[10px] text-[#b45309]"
              style={{ minWidth: 42, background: '#fef7e6' }}
            >
              {n}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {lines.map((line, li) => {
          const allocated = (line.days || []).reduce((s, v) => s + v, 0)
          const over      = allocated > line.totalQuantity
          const full      = allocated === line.totalQuantity && allocated > 0
          const ind       = line.indicator || ''

          return (
            <tr
              key={line.itemNo}
              className={`border-b border-[#f0f0f0] transition-colors ${over ? 'bg-[#fff5f5]' : 'hover:bg-[#fafbfc]'}`}
            >
              {/* Item + allocation */}
              <td className={`py-2 px-3 border-r border-[#f0f0f0] sticky left-0 z-10
                ${over ? 'bg-[#fff5f5]' : full ? 'bg-[#f0fff4]' : 'bg-white'}`}>
                <div className="text-[12px] font-bold text-[#32363a]">{line.itemNo}</div>
                <div className={`text-[10px] mt-0.5 tabular-nums font-semibold
                  ${over ? 'text-[#cc1c14]' : full ? 'text-[#107e3e]' : 'text-[#6a6d70]'}`}>
                  {allocated.toLocaleString()} / {line.totalQuantity.toLocaleString()}
                  {over && <span className="ml-1">(+{(allocated - line.totalQuantity).toLocaleString()})</span>}
                </div>
              </td>

              <td className="py-2 px-3 border-r border-[#f0f0f0] font-semibold text-[#0a6ed1]">{line.sapCode}</td>
              <td className="py-2 px-3 border-r border-[#f0f0f0] text-[#32363a]">{line.description}</td>
              <td className="py-2 px-3 border-r border-[#f0f0f0] text-[#32363a]">{line.hsnCode}</td>
              <td className="py-2 px-3 border-r border-[#f0f0f0] text-center font-bold text-[#32363a]">
                {line.totalQuantity.toLocaleString()}
              </td>

              {/* ── Indicator cell (read-only) ── */}
              <td className="py-2 px-3 border-r border-[#f0f0f0] text-center">
                {ind ? (
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[12px] font-bold
                    ${ind === 'W' ? 'bg-[#ebf5ff] text-[#0a6ed1]' : 'bg-[#fff3e8] text-[#e76500]'}`}>
                    {ind}
                  </span>
                ) : (
                  <span className="text-[#d9d9d9] text-[13px]">—</span>
                )}
              </td>

              {/* Day cells */}
              {calDays.map((cd, di) => {
                const val = (line.days || [])[di] ?? 0
                const isCellBlocked = cd.blocked || (cd.blockedSunday && !editable)

                if (isCellBlocked) {
                  return (
                    <td
                      key={di}
                      className="border-r border-[#f0f0f0] p-0 text-center"
                      style={{ background: cd.blockedSunday ? '#fff1f0' : '#fff7e6' }}
                    >
                      <span className="block text-[10px] text-[#e0d0d0] py-2">—</span>
                    </td>
                  )
                }

                return (
                  <td
                    key={di}
                    className="border-r border-[#f0f0f0] p-0 text-center"
                  >
                    {editable ? (
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min="0"
                        value={val}
                        onChange={e => {
                          const v = e.target.value.replace(/[^0-9]/g, '')
                          handleCellChange(li, di, v === '' ? 0 : v)
                        }}
                        onFocus={e => e.target.select()}
                        className="cell-input"
                      />
                    ) : (
                      <span className={`text-[11px] tabular-nums block py-1.5
                        ${val > 0 ? 'font-bold text-[#32363a]' : 'text-[#d9d9d9]'}`}>
                        {val || 0}
                      </span>
                    )}
                  </td>
                )
              })}

              {/* Row total */}
              <td className={`py-2 px-3 border-r border-[#f0f0f0] text-center font-bold tabular-nums text-[12px]
                ${over ? 'text-[#cc1c14] bg-[#fce8e6]' : full ? 'text-[#107e3e] bg-[#e8f5ec]' : 'text-[#32363a] bg-[#f0fff4]'}`}>
                {allocated.toLocaleString()}
              </td>

              {/* Forecast */}
              {(line.forecast || [0, 0, 0]).map((f, fi) => (
                <td
                  key={fi}
                  className="py-2 px-2 border-r border-[#f0f0f0] text-center text-[11px] text-[#b45309]"
                  style={{ background: '#fffdf5' }}
                >
                  {f || ''}
                </td>
              ))}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function ScheduleLinesPage() {
  const navigate  = useNavigate()
  const { state } = useLocation()

  const {
    selectedItemNos  = [],
    itemsData        = [],
    editable         = false,
    title            = 'Schedule Lines',
    mode             = '',
    dayCount         = 5,
    pendingIndicator,
    agreementId      = '',
    supplierCode     = '',
    supplierName     = '',
    plantName        = '',
    companyCode      = '',
    agreementDate    = '',
    supplierFull     = null,
    agreementFull    = null,
  } = state || {}

  const calDays = useMemo(() => buildCalendarDays(), [])

  const [lines, setLines] = useState(() =>
    buildInitialLines(itemsData, mode, dayCount, calDays)
  )
  const [saving, setSaving] = useState(false)

  const displayLines = lines

  const overLines = displayLines.filter(l =>
    (l.days || []).reduce((s, v) => s + v, 0) > l.totalQuantity
  )
  const canSave = !saving && overLines.length === 0

  // ── Save ──
  // Capture the backend result and pass it back as savedLines so
  // ScheduleGenerate uses the backend's indicator, not a frontend guess.
  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      let savedLines

      if (mode === 'WEEKLY') {
        savedLines = await scheduleGenerateApi.generateWeekSchedule(agreementId, supplierCode, displayLines)
      } else if (mode === 'DAILY') {
        savedLines = await scheduleGenerateApi.generateDaySchedule(agreementId, supplierCode, displayLines, dayCount)
      } else {
        savedLines = await scheduleGenerateApi.saveScheduleLines(agreementId, supplierCode, displayLines)
      }

      navigate('/purchasing/schedule-generate', {
        state: {
          returnData: {
            // Backend response — carries indicator set by backend
            savedLines,
          },
          restoreData: {
            supplier:  supplierFull,
            agreement: agreementFull,
          },
        },
      })
    } catch (err) {
      console.error(err)
      setSaving(false)
    }
  }

  // ── Close (X) ──
  const handleClose = () => {
    navigate('/purchasing/schedule-generate', {
      state: {
        restoreData: {
          supplier:  supplierFull,
          agreement: agreementFull,
        },
      },
    })
  }

  const baseTitle  = title.replace(/\s*[—–-]\s*(Week|Day).*$/i, '').trim() || 'Schedule Lines'
  const dayLabel   = mode === 'DAILY'  ? `Day · ${dayCount}` : ''
  const weekLabel  = mode === 'WEEKLY' ? 'Week' : ''
  const modeLabel  = dayLabel || weekLabel
  const modeBg     = mode === 'WEEKLY' ? 'bg-[#ebf5ff] text-[#0a6ed1]' : mode === 'DAILY' ? 'bg-[#fff3e8] text-[#e76500]' : ''

  return (
    <PageLayout>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .sl-fade { animation: fadeIn .28s ease-out both; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
        .cell-input {
          width: 100%; height: 28px; text-align: center;
          font-size: 11px; font-weight: 600;
          border: 0; background: transparent;
          transition: background .15s, box-shadow .15s;
        }
        .cell-input:focus {
          background: #ebf5ff; outline: none;
          box-shadow: inset 0 0 0 1.5px #0a6ed1;
          border-radius: 4px;
        }
      `}</style>

      <div className="flex flex-col bg-[#f5f6f7]" style={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

        {/* ── Top bar ── */}
        <div className="bg-white border-b border-[#e5e5e5] px-4 sm:px-8 lg:px-12 py-4 flex-shrink-0 sl-fade">

          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[22px] sm:text-[24px] font-bold text-[#32363a] tracking-tight">{baseTitle}</h1>
                {modeLabel && (
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider ${modeBg}`}>
                    {modeLabel}
                  </span>
                )}
                {editable && (
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider bg-[#fff3e8] text-[#e76500]">
                    Editing
                  </span>
                )}
              </div>
              <div className="mt-1 text-[12px] text-[#6a6d70]">
                {displayLines.length} item{displayLines.length !== 1 ? 's' : ''}
                {agreementId  && <> · <span className="font-semibold text-[#32363a]">{agreementId}</span></>}
                {supplierName && <> · {supplierName}</>}
              </div>
            </div>

            <div className="flex items-start gap-4">
              {/* Legend */}
              <div className="flex items-center gap-3 text-[11px] text-[#6a6d70] flex-wrap mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm inline-block"
                    style={{ background: '#fff1f0', border: '1px solid #ffd6d6' }} />
                  Sunday
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm inline-block"
                    style={{ background: '#fff7e6', border: '1px solid #ffe7ba' }} />
                  Govt. Holiday
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm inline-block"
                    style={{ background: '#e8f5ec', border: '1px solid #b7e2c4' }} />
                  Fully allocated
                </div>
              </div>

              <button
                onClick={handleClose}
                disabled={saving}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f5f6f7] text-[#6a6d70] hover:text-[#32363a] transition-all flex-shrink-0 disabled:opacity-50"
                title="Back to Schedule Agreement"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#f0f0f0] grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
            {[
              { l: 'Vendor Code',  v: supplierCode },
              { l: 'Vendor Name',  v: supplierName },
              { l: 'Plant',        v: plantName },
              { l: 'Company Code', v: companyCode },
            ].map(({ l, v }) => (
              <div key={l}>
                <span className="text-[#6a6d70] text-[10px] uppercase tracking-wider font-semibold">{l}</span>
                <div className="text-[#32363a] font-semibold mt-0.5 text-[12px]">{v || '—'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Grid area ── */}
        <div
          className="flex-1 overflow-hidden px-4 sm:px-8 lg:px-12 py-4 sl-fade flex flex-col min-h-0"
          style={{ animationDelay: '.05s' }}
        >
          <div className="flex-1 overflow-auto rounded-xl border border-[#e5e5e5] bg-white shadow-sm min-h-0">
            <ScheduleGrid
              lines={displayLines}
              editable={editable}
              calDays={calDays}
              onChange={editable ? setLines : undefined}
            />
          </div>
        </div>

        {/* ── Sticky bottom bar ── */}
        <div className="flex-shrink-0 bg-white border-t border-[#e5e5e5] shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
          {overLines.length > 0 && (
            <div className="flex items-center gap-2 px-6 py-2.5 bg-[#fce8e6] border-b border-[#f5c6c2]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#cc1c14" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
              <span className="text-[12px] text-[#cc1c14] font-semibold">
                {overLines.length} item{overLines.length > 1 ? 's' : ''} exceed Total Qty — reduce allocation before saving
              </span>
            </div>
          )}
          <div className="flex items-center justify-end px-4 sm:px-8 lg:px-12 py-3">
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="flex items-center gap-2 px-7 h-10 text-[14px] font-semibold text-white bg-[#107e3e] rounded-lg hover:bg-[#0d6633] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

      </div>
    </PageLayout>
  )
}