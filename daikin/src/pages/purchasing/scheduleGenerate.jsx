import { useState } from 'react'
import PageLayout from '../../layouts/PageLayout.jsx'
import { scheduleGenerateApi, generateDays } from '../../services/ScheduleGenerate.js'

// ═══════════════════════════════════════════════════════════════
// SUPPLIER CODE POPUP
// ═══════════════════════════════════════════════════════════════
function SupplierPopup({ onSubmit }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!code.trim()) { setError('Please enter a supplier code.'); return }
    setLoading(true); setError('')
    try {
      const supp = await scheduleGenerateApi.fetchSupplier(code.trim())
      if (!supp) { setError(`Supplier "${code}" not found.`); setLoading(false); return }
      onSubmit(supp)
    } catch (err) { setError(err.message || 'Failed'); setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] overflow-hidden" style={{ animation: 'modalIn .22s ease-out both' }}>
        <div className="bg-gradient-to-r from-[#0a6ed1] to-[#085caf] px-6 py-5">
          <h2 className="text-[18px] font-bold text-white">Schedule Generate</h2>
          <p className="text-[13px] text-white/80 mt-1">Enter the supplier code to load Schedule Agreements</p>
        </div>
        <div className="px-6 py-6">
          <label className="block text-[13px] font-semibold text-[#32363a] mb-2">Supplier Code <span className="text-[#cc1c14]">*</span></label>
          <input autoFocus type="text" value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
            placeholder="e.g. FS859"
            className="w-full h-11 px-4 text-[15px] font-semibold border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all tracking-wider uppercase" />
          <div className="mt-2 text-[11px] text-[#6a6d70]">Available: <span className="font-semibold text-[#0a6ed1]">FS859</span>, <span className="font-semibold text-[#0a6ed1]">FS833</span>, <span className="font-semibold text-[#0a6ed1]">FS827</span></div>
          {error && <div className="mt-3 flex items-center gap-1.5 text-[13px] text-[#cc1c14] bg-[#fce8e6] px-3 py-2 rounded-lg"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>{error}</div>}
        </div>
        <div className="px-6 py-4 border-t border-[#e5e5e5] flex justify-end">
          <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-6 h-10 text-[14px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] transition-all shadow-md disabled:opacity-60">
            {loading && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {loading ? 'Loading…' : 'Load Agreements'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// DAY COUNT POPUP
// ═══════════════════════════════════════════════════════════════
function DayCountPopup({ onSubmit, onCancel }) {
  const [days, setDays] = useState('')
  const n = parseInt(days, 10)
  const valid = n >= 1 && n <= 30
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[340px]" style={{ animation: 'modalIn .22s ease-out both' }}>
        <div className="px-6 py-4 border-b border-[#e5e5e5]">
          <h3 className="text-[15px] font-bold text-[#32363a]">No. of Days</h3>
          <p className="text-[12px] text-[#6a6d70] mt-0.5">Quantity divided equally across these many days</p>
        </div>
        <div className="px-6 py-5">
          <input autoFocus type="number" min="1" max="30" value={days} onChange={e => setDays(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && valid) onSubmit(n) }}
            placeholder="e.g. 5"
            className="w-full h-11 px-4 text-[16px] font-bold text-center border border-[#0a6ed1] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
        </div>
        <div className="px-6 py-4 border-t border-[#e5e5e5] flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 h-9 text-[13px] font-semibold text-[#6a6d70] hover:bg-[#f5f6f7] rounded-lg transition-all">Cancel</button>
          <button onClick={() => valid && onSubmit(n)} disabled={!valid} className="px-5 h-9 text-[13px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] transition-all shadow-md disabled:opacity-50">Generate</button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SCHEDULE LINES GRID
// ═══════════════════════════════════════════════════════════════
const DAYS = Array.from({ length: 30 }, (_, i) => i + 1)

function ScheduleGrid({ lines, editable, onChange }) {
  const handleCellChange = (lineIdx, dayIdx, value) => {
    if (!onChange) return
    const newLines = lines.map((l, i) => {
      if (i !== lineIdx) return l
      const newDays = [...l.days]
      newDays[dayIdx] = Math.max(0, parseInt(value) || 0)
      return { ...l, days: newDays, total: newDays.reduce((s, v) => s + v, 0) }
    })
    onChange(newLines)
  }

  return (
    <div className="overflow-auto">
      <table className="border-collapse text-[12px]" style={{ minWidth: '1800px' }}>
        <thead className="sticky top-0 z-10">
          <tr className="bg-gradient-to-b from-[#fafbfc] to-[#f5f6f7] text-[#6a6d70]">
            <th className="text-left font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] whitespace-nowrap sticky left-0 bg-[#f5f6f7] z-20" style={{ minWidth: 60 }}>Item</th>
            <th className="text-left font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] whitespace-nowrap" style={{ minWidth: 80 }}>Sap Code</th>
            <th className="text-left font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] whitespace-nowrap" style={{ minWidth: 140 }}>Description</th>
            <th className="text-left font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] whitespace-nowrap" style={{ minWidth: 85 }}>HSN Code</th>
            <th className="text-center font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] whitespace-nowrap" style={{ minWidth: 80 }}>Total Qty</th>
            <th colSpan={30} className="text-center font-semibold py-1 px-0 border-b border-r border-[#e5e5e5] bg-[#ebf5ff] text-[#0a6ed1]">Firm</th>
            <th className="text-center font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] whitespace-nowrap bg-[#e8f5ec] text-[#107e3e]" style={{ minWidth: 70 }}>Total</th>
            <th colSpan={3} className="text-center font-semibold py-1 px-0 border-b border-[#e5e5e5] bg-[#fef7e6] text-[#b45309]">Forecast</th>
          </tr>
          <tr className="bg-[#fafbfc] text-[#6a6d70]">
            <th className="border-b border-r border-[#e5e5e5] sticky left-0 bg-[#fafbfc] z-20" />
            <th className="border-b border-r border-[#e5e5e5]" />
            <th className="border-b border-r border-[#e5e5e5]" />
            <th className="border-b border-r border-[#e5e5e5]" />
            <th className="border-b border-r border-[#e5e5e5]" />
            {DAYS.map(d => (
              <th key={d} className="text-center font-semibold py-1.5 px-0 border-b border-r border-[#e5e5e5] text-[10px] bg-[#f8fbff]" style={{ minWidth: 38 }}>{d}</th>
            ))}
            <th className="border-b border-r border-[#e5e5e5] bg-[#e8f5ec]" />
            {['N1', 'N2', 'N3'].map(n => (
              <th key={n} className="text-center font-semibold py-1.5 px-2 border-b border-r border-[#e5e5e5] text-[10px] bg-[#fef7e6]" style={{ minWidth: 38 }}>{n}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map((line, li) => {
            const allocated = line.days.reduce((s, v) => s + v, 0)
            const over = allocated > line.totalQuantity
            const pct = Math.min(100, Math.round((allocated / line.totalQuantity) * 100))
            return (
            <tr key={line.itemNo} className={`border-b border-[#f0f0f0] transition-colors ${over ? 'bg-[#fff5f5]' : 'hover:bg-[#fafbfc]'}`}>
              <td className={`py-2 px-3 border-r border-[#f0f0f0] font-semibold sticky left-0 z-20 ${over ? 'bg-[#fff5f5]' : 'bg-white text-[#32363a]'}`}>
                <div className="text-[#32363a]">{line.itemNo}</div>
                {/* Counter bar */}
                <div className="mt-1 w-full">
                  <div className="w-full h-1.5 bg-[#e5e5e5] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-200 ${over ? 'bg-[#cc1c14]' : pct === 100 ? 'bg-[#107e3e]' : 'bg-[#0a6ed1]'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className={`text-[9px] mt-0.5 tabular-nums font-semibold ${over ? 'text-[#cc1c14]' : pct === 100 ? 'text-[#107e3e]' : 'text-[#6a6d70]'}`}>
                    {allocated.toLocaleString()} / {line.totalQuantity.toLocaleString()}
                    {over && <span> (+{(allocated - line.totalQuantity).toLocaleString()})</span>}
                  </div>
                </div>
              </td>
              <td className="py-2 px-3 border-r border-[#f0f0f0] text-[#0a6ed1] font-semibold">{line.sapCode}</td>
              <td className="py-2 px-3 border-r border-[#f0f0f0] text-[#32363a]">{line.description}</td>
              <td className="py-2 px-3 border-r border-[#f0f0f0] text-[#32363a]">{line.hsnCode}</td>
              <td className="py-2 px-3 border-r border-[#f0f0f0] text-center font-bold text-[#32363a]">{line.totalQuantity}</td>
              {DAYS.map((_, di) => (
                <td key={di} className="py-1 px-0 border-r border-[#f0f0f0] text-center">
                  {editable ? (
                    <input type="number" min="0"
                      value={line.days[di] ?? 0}
                      onChange={e => handleCellChange(li, di, e.target.value)}
                      className="w-full h-7 text-center text-[11px] font-semibold border-0 bg-transparent focus:bg-[#ebf5ff] focus:outline-none focus:ring-1 focus:ring-[#0a6ed1] rounded transition-all tabular-nums"
                    />
                  ) : (
                    <span className={`text-[11px] tabular-nums ${line.days[di] > 0 ? 'font-bold text-[#32363a]' : 'text-[#d9d9d9]'}`}>
                      {line.days[di] ?? 0}
                    </span>
                  )}
                </td>
              ))}
              <td className={`py-2 px-3 border-r border-[#f0f0f0] text-center font-bold ${over ? 'text-[#cc1c14] bg-[#fce8e6]' : 'text-[#107e3e] bg-[#f0fff4]'}`}>{allocated}</td>
              {(line.forecast || [0, 0, 0]).map((f, fi) => (
                <td key={fi} className="py-2 px-2 border-r border-[#f0f0f0] text-center text-[11px] text-[#b45309] bg-[#fffdf5]">{f || ''}</td>
              ))}
            </tr>
          )})}

        </tbody>
      </table>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SCHEDULE GRID POPUP — wraps grid in a full modal
// ═══════════════════════════════════════════════════════════════
function ScheduleGridPopup({ lines, editable, title, onSave, onCancel, saving }) {
  const [editLines, setEditLines] = useState(
    lines.map(l => ({ ...l, days: [...l.days], forecast: l.forecast ? [...l.forecast] : [0, 0, 0] }))
  )

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col"
        style={{ width: 'min(98vw, 1400px)', height: '80vh', animation: 'modalIn .22s ease-out both' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5] flex-shrink-0">
          <div>
            <h2 className="text-[15px] font-bold text-[#32363a]">{title}</h2>
            <p className="text-[12px] text-[#6a6d70] mt-0.5">{editLines.length} item{editLines.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onCancel} disabled={saving}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f5f6f7] text-[#6a6d70] transition-all disabled:opacity-50">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Scrollable grid — constrained, not edge-to-edge */}
        <div className="flex-1 overflow-hidden px-4 py-3">
          <div className="h-full overflow-auto rounded-xl border border-[#e5e5e5]">
            <ScheduleGrid
              lines={editable ? editLines : lines}
              editable={editable}
              onChange={editable ? setEditLines : undefined}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 rounded-b-2xl overflow-hidden">
          {/* Exceed warning banner */}
          {editable && (() => {
            const overLines = editLines.filter(l => l.days.reduce((s, v) => s + v, 0) > l.totalQuantity)
            return overLines.length > 0 ? (
              <div className="flex items-center gap-2 px-6 py-2.5 bg-[#fce8e6] border-t border-[#f5c6c2]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#cc1c14" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                <span className="text-[12px] text-[#cc1c14] font-semibold">
                  {overLines.length} item{overLines.length > 1 ? 's' : ''} exceed Total Qty — reduce allocation before saving
                </span>
              </div>
            ) : null
          })()}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e5e5e5] bg-[#fafbfc]">
            <button onClick={onCancel} disabled={saving}
              className="px-5 h-9 text-[13px] font-semibold text-[#cc1c14] bg-[#fce8e6] rounded-lg hover:bg-[#fad6d3] transition-all disabled:opacity-50">
              Cancel
            </button>
            <button
              onClick={() => {
                const active = editable ? editLines : lines
                const anyOver = active.some(l => l.days.reduce((s, v) => s + v, 0) > l.totalQuantity)
                if (!anyOver) onSave(active)
              }}
              disabled={saving || (editable && editLines.some(l => l.days.reduce((s, v) => s + v, 0) > l.totalQuantity))}
              className="flex items-center gap-2 px-5 h-9 text-[13px] font-semibold text-white bg-[#107e3e] rounded-lg hover:bg-[#0d6633] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
              {saving && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// STATUS HELPERS
// ═══════════════════════════════════════════════════════════════
const STATUS_STYLE = { 'Generated': 'text-[#107e3e] bg-[#e8f5ec]', 'In Approval': 'text-[#0a6ed1] bg-[#ebf5ff]', 'In Draft': 'text-[#e76500] bg-[#fff3e8]' }
const STATUS_DOT   = { 'Generated': '#107e3e', 'In Approval': '#0a6ed1', 'In Draft': '#e76500' }
const getStatusStyle = s => STATUS_STYLE[s] || 'text-[#b45309] bg-[#fef7e6]'
const getStatusDot   = s => STATUS_DOT[s]   || '#b45309'

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ScheduleGenerate() {
  const [supplier, setSupplier]         = useState(null)
  const [agreement, setAgreement]       = useState(null)
  const [items, setItems]               = useState([])
  const [fromDate, setFromDate]         = useState('')
  const [toDate, setToDate]             = useState('')
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [showDayPopup, setShowDayPopup] = useState(false)
  const [gridPopup, setGridPopup]       = useState(null) // { lines, editable, title }
  const [saving, setSaving]             = useState(false)

  // ── Supplier submit ──
  const handleSupplierSubmit = supp => {
    setSupplier(supp)
    if (supp.agreements.length > 0) {
      const ag = supp.agreements[0]
      setAgreement(ag)
      setItems(ag.items.map(it => ({ ...it })))
      setSelectedItems(new Set())
      setGridPopup(null)
    }
  }

  // ── Selection ──
  const toggleItem = itemNo => setSelectedItems(prev => { const n = new Set(prev); n.has(itemNo) ? n.delete(itemNo) : n.add(itemNo); return n })
  const toggleAll  = () => setSelectedItems(selectedItems.size === items.length ? new Set() : new Set(items.map(i => i.itemNo)))

  // ── Derived button states ──
  // Selected items grouped by existing indicator
  const selArr = Array.from(selectedItems)
  const selWithIndicator = selArr.filter(no => items.find(i => i.itemNo === no)?.indicator)
  const allHaveW   = selArr.length > 0 && selArr.every(no => items.find(i => i.itemNo === no)?.indicator === 'W')
  const allHaveD   = selArr.length > 0 && selArr.every(no => items.find(i => i.itemNo === no)?.indicator === 'D')
  const anyHaveD   = selArr.some(no => items.find(i => i.itemNo === no)?.indicator === 'D')
  const anyHaveW   = selArr.some(no => items.find(i => i.itemNo === no)?.indicator === 'W')
  const anyHaveInd = selArr.some(no => items.find(i => i.itemNo === no)?.indicator)

  // Week disabled: nothing selected, OR any selected item already locked to D
  const weekDisabled = selArr.length === 0 || anyHaveD
  // Day disabled: nothing selected, OR any selected item already locked to W
  const dayDisabled  = selArr.length === 0 || anyHaveW
  // Edit disabled: nothing selected, OR none of selected have an indicator assigned
  const editDisabled = selArr.length === 0 || !anyHaveInd

  // ── Build lines for selected items ──
  const buildLines = (mode, dayCount) => {
    return items
      .filter(it => selectedItems.has(it.itemNo))
      .map(it => {
        const days = generateDays(it.totalQuantity, mode, dayCount)
        return { ...it, days, total: days.reduce((s, v) => s + v, 0), forecast: [0, 0, 0] }
      })
  }

  // ── Week: open popup only — indicator assigned on Save ──
  const handleWeek = () => {
    if (weekDisabled) return
    const lines = buildLines('week', 0)
    setGridPopup({ lines, editable: false, title: 'Schedule Lines — Week', pendingIndicator: 'W' })
  }

  // ── Day: show day-count input, then open popup — indicator assigned on Save ──
  const handleDayClick = () => { if (!dayDisabled) setShowDayPopup(true) }

  const handleDayGenerate = dayCount => {
    setShowDayPopup(false)
    const lines = buildLines('day', dayCount)
    setGridPopup({ lines, editable: false, title: `Schedule Lines — Day (${dayCount})`, pendingIndicator: 'D' })
  }

  // ── Edit: open editable popup for selected items that have indicator ──
  const handleEdit = () => {
    if (editDisabled) return
    const lines = items
      .filter(it => selectedItems.has(it.itemNo) && it.indicator)
      .map(it => {
        // Use existing days if already generated (non-zero), else generate default
        const hasData = it.days && it.days.some(v => v > 0)
        const days = hasData ? [...it.days] : generateDays(it.totalQuantity, it.indicator === 'W' ? 'week' : 'day', 5)
        return { ...it, days, total: days.reduce((s, v) => s + v, 0), forecast: [0, 0, 0] }
      })
    setGridPopup({ lines, editable: true, title: 'Edit Schedule Lines' })
  }

  // ── Save from popup ──
  const handlePopupSave = async savedLines => {
    setSaving(true)
    try {
      await scheduleGenerateApi.saveScheduleLines(agreement.id, savedLines)
      const pendingInd = gridPopup?.pendingIndicator // 'W' | 'D' | undefined
      setItems(prev => prev.map(it => {
        const saved = savedLines.find(sl => sl.itemNo === it.itemNo)
        if (!saved) return it
        return {
          ...it,
          days: [...saved.days],
          status: 'In Draft',
          ...(pendingInd ? { indicator: pendingInd } : {}),
        }
      }))
      setGridPopup(null)
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  // ── Approve ──
  const handleApprove = async () => {
    if (selArr.length === 0) return
    setSaving(true)
    try {
      await scheduleGenerateApi.approveSchedule(agreement.id, selArr)
      setItems(prev => prev.map(it => {
        if (!selectedItems.has(it.itemNo)) return it
        if (it.status === 'In Draft')    return { ...it, status: 'In Approval' }
        if (it.status === 'In Approval') return { ...it, status: 'Generated' }
        return it
      }))
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  // ── Supplier popup ──
  if (!supplier) {
    return (
      <PageLayout>
        <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.94) translateY(-8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
        <div className="bg-[#f5f6f7] min-h-[calc(100vh-104px)] flex items-center justify-center">
          <SupplierPopup onSubmit={handleSupplierSubmit} />
        </div>
      </PageLayout>
    )
  }

  if (!agreement) return <PageLayout><div className="flex items-center justify-center h-64 text-[#6a6d70]">No agreements found.</div></PageLayout>

  return (
    <PageLayout>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.94) translateY(-8px)}to{opacity:1;transform:scale(1) translateY(0)}}
        .anim-fade{animation:fadeIn .3s ease-out both}
        .row-stagger>*{animation:fadeIn .3s ease-out both}
        .row-stagger>*:nth-child(1){animation-delay:.02s}.row-stagger>*:nth-child(2){animation-delay:.05s}
        .row-stagger>*:nth-child(3){animation-delay:.08s}.row-stagger>*:nth-child(4){animation-delay:.11s}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
      `}</style>

      {/* Day count popup — z-[400] sits above grid popup */}
      {showDayPopup && <DayCountPopup onSubmit={handleDayGenerate} onCancel={() => setShowDayPopup(false)} />}

      {/* Grid popup */}
      {gridPopup && (
        <ScheduleGridPopup
          lines={gridPopup.lines}
          editable={gridPopup.editable}
          title={gridPopup.title}
          onSave={handlePopupSave}
          onCancel={() => setGridPopup(null)}
          saving={saving}
        />
      )}

      <div className="bg-[#f5f6f7] min-h-[calc(100vh-104px)]">
        <main className="bg-white" style={{ minHeight: 'calc(100vh - 220px)' }}>

          {/* ── Header ── */}
          <div className="px-4 sm:px-6 lg:px-10 pt-5 pb-4 border-b border-[#e5e5e5] bg-gradient-to-b from-[#fafbfc] to-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">Schedule Agreement</div>
                <h1 className="text-[22px] sm:text-[26px] font-bold text-[#0a6ed1] tracking-tight">{agreement.id}</h1>
              </div>
              <span className="text-[14px] font-semibold text-[#32363a] bg-white px-4 py-2 rounded-lg border border-[#e5e5e5] shadow-sm flex-shrink-0 ml-3">{agreement.date}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[13px]">
              {[
                { l: 'Vendor Code',   v: supplier.code },
                { l: 'Vendor Name',   v: supplier.name },
                { l: 'Plant',         v: agreement.plantName },
                { l: 'Company Code',  v: agreement.companyCode },
              ].map(({ l, v }) => (
                <div key={l}>
                  <span className="text-[#6a6d70] text-[11px] uppercase tracking-wider font-semibold">{l}</span>
                  <div className="text-[#32363a] font-semibold mt-0.5">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Action bar ── */}
          <div className="px-4 sm:px-6 lg:px-10 py-3 border-b border-[#e5e5e5] bg-[#fafbfc]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-[#6a6d70] font-semibold uppercase whitespace-nowrap">Delivery From</label>
                  <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                    className="h-8 pl-2 pr-1 text-[12px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] transition-all" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-[#6a6d70] font-semibold uppercase whitespace-nowrap">To</label>
                  <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                    className="h-8 pl-2 pr-1 text-[12px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] transition-all" />
                </div>
                <button onClick={() => { setFromDate(''); setToDate('') }}
                  className="h-8 px-3 text-[12px] font-semibold text-[#cc1c14] bg-[#fce8e6] rounded-lg hover:bg-[#fad6d3] transition-all">
                  Clear
                </button>
              </div>

              {/* Week / Day / Edit / Approve */}
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">

                {/* Week/Day toggle group */}
                <div className="flex items-center border border-[#d9d9d9] rounded-lg overflow-hidden bg-white">
                  <button onClick={handleWeek} disabled={weekDisabled}
                    className={`flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold transition-all disabled:opacity-40 ${allHaveW ? 'bg-[#0a6ed1] text-white' : 'text-[#32363a] hover:bg-[#f5f6f7]'}`}
                    title={anyHaveD ? 'Selected items are locked to Day mode' : ''}>
                    <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${allHaveW ? 'border-white' : 'border-[#0a6ed1]'}`}>
                      {allHaveW && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    Week
                  </button>
                  <div className="w-px h-4 bg-[#d9d9d9]" />
                  <button onClick={handleDayClick} disabled={dayDisabled}
                    className={`flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold transition-all disabled:opacity-40 ${allHaveD ? 'bg-[#0a6ed1] text-white' : 'text-[#32363a] hover:bg-[#f5f6f7]'}`}
                    title={anyHaveW ? 'Selected items are locked to Week mode' : ''}>
                    <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${allHaveD ? 'border-white' : 'border-[#0a6ed1]'}`}>
                      {allHaveD && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    Day
                  </button>
                </div>

                <button onClick={handleEdit} disabled={editDisabled}
                  className="h-8 px-3 text-[12px] font-semibold text-white bg-[#e76500] rounded-lg hover:bg-[#c55600] transition-all shadow-sm disabled:opacity-40"
                  title={selArr.length > 0 && !anyHaveInd ? 'Assign Week or Day indicator first' : ''}>
                  Edit
                </button>

                <button onClick={handleApprove} disabled={selArr.length === 0}
                  className="h-8 px-3 text-[12px] font-semibold text-white bg-[#107e3e] rounded-lg hover:bg-[#0d6633] transition-all shadow-sm disabled:opacity-40">
                  Approve
                </button>
              </div>
            </div>
          </div>

          {/* ── Items Table ── */}
          <div className="px-4 sm:px-6 lg:px-10 py-4">
            <div className="rounded-xl border border-[#e5e5e5] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] border-collapse" style={{ minWidth: '800px' }}>
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gradient-to-b from-[#fafbfc] to-[#f5f6f7] text-[#6a6d70]">
                      <th className="py-3 px-3 border-b border-r border-[#e5e5e5] w-10 text-center">
                        <input type="checkbox"
                          checked={selectedItems.size === items.length && items.length > 0}
                          onChange={toggleAll}
                          className="accent-[#0a6ed1] w-4 h-4 cursor-pointer" />
                      </th>
                      {['Item No.', 'Sap Code', 'Description', 'HSN Code', 'Total Monthly Schedule', 'Unit Price', 'Indicator', 'Status'].map(h => (
                        <th key={h} className="text-center font-semibold py-3 px-3 border-b border-r border-[#e5e5e5] uppercase tracking-wider text-[10px] sm:text-[11px] last:border-r-0">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="row-stagger">
                    {items.map(item => {
                      const checked = selectedItems.has(item.itemNo)
                      return (
                        <tr key={item.itemNo} className={`border-b border-[#f0f0f0] transition-colors ${checked ? 'bg-[#ebf5ff]' : 'hover:bg-[#fafbfc]'}`}>
                          <td className="py-3 px-3 text-center border-r border-[#f0f0f0]">
                            <input type="checkbox" checked={checked} onChange={() => toggleItem(item.itemNo)} className="accent-[#0a6ed1] w-4 h-4 cursor-pointer" />
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-[#32363a] border-r border-[#f0f0f0]">{item.itemNo}</td>
                          <td className="py-3 px-3 text-center font-semibold text-[#0a6ed1] border-r border-[#f0f0f0]">{item.sapCode}</td>
                          <td className="py-3 px-3 text-center text-[#32363a] font-medium border-r border-[#f0f0f0]">{item.description}</td>
                          <td className="py-3 px-3 text-center text-[#32363a] border-r border-[#f0f0f0]">{item.hsnCode}</td>
                          <td className="py-3 px-3 text-center font-bold text-[#32363a] tabular-nums border-r border-[#f0f0f0]">{item.totalQuantity.toLocaleString()}</td>
                          <td className="py-3 px-3 text-center font-semibold tabular-nums border-r border-[#f0f0f0]">{item.unitPrice.toFixed(2)}</td>
                          <td className="py-3 px-3 text-center border-r border-[#f0f0f0]">
                            {item.indicator
                              ? <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[12px] font-bold ${item.indicator === 'W' ? 'bg-[#ebf5ff] text-[#0a6ed1]' : 'bg-[#fff3e8] text-[#e76500]'}`}>{item.indicator}</span>
                              : <span className="text-[#d9d9d9]">—</span>}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${getStatusStyle(item.status)}`}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getStatusDot(item.status) }} />
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </main>
      </div>
    </PageLayout>
  )
}