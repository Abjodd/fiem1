import { useState, useMemo, useEffect, useCallback } from 'react'
import PageLayout from '../../layouts/PageLayout.jsx'

// ═══════════════════════════════════════════════════════════════
// MOCK DATA — replace with OData service when ready
// ═══════════════════════════════════════════════════════════════
const MOCK_SUPPLIERS = {
  'FS859': {
    code: 'FS859',
    name: 'The Supreme Industries Ltd',
    agreements: [
      {
        id: '5501000391',
        date: '01.08.2026',
        companyCode: 'DSAL',
        plant: 'NM01',
        plantName: 'FIEM-NMR (NMR)',
        items: [
          { itemNo: '10', sapCode: '3p566', description: 'flare cap', hsnCode: '84159000', totalQuantity: 2000, unitPrice: 0.78, indicator: '', status: 'Not Generated' },
          { itemNo: '20', sapCode: '3p567', description: 'FLARE CAP PACKAGING', hsnCode: '84159000', totalQuantity: 1000, unitPrice: 0.65, indicator: '', status: 'Not Generated' },
          { itemNo: '30', sapCode: '3p568', description: 'FLARE CAP PACKAGING', hsnCode: '84159000', totalQuantity: 2500, unitPrice: 0.65, indicator: '', status: 'Not Generated' },
        ],
      },
    ],
  },
  'FS833': {
    code: 'FS833',
    name: 'Ravi Industries',
    agreements: [
      {
        id: '5501000405',
        date: '05.08.2026',
        companyCode: 'DSAL',
        plant: 'SR01',
        plantName: 'Sri City FG',
        items: [
          { itemNo: '10', sapCode: '3P6201', description: 'Compressor mount bracket', hsnCode: '73269099', totalQuantity: 600, unitPrice: 4.10, indicator: '', status: 'Not Generated' },
          { itemNo: '20', sapCode: '3P6202', description: 'Motor housing plate', hsnCode: '73269099', totalQuantity: 1200, unitPrice: 2.85, indicator: '', status: 'Not Generated' },
        ],
      },
    ],
  },
  'FS827': {
    code: 'FS827',
    name: 'Salim Enterprises',
    agreements: [
      {
        id: '5501000407',
        date: '18.07.2026',
        companyCode: 'DSAL',
        plant: 'NM01',
        plantName: 'FIEM-NMR (NMR)',
        items: [
          { itemNo: '10', sapCode: '3P7104', description: 'Drain pan assembly', hsnCode: '84159000', totalQuantity: 800, unitPrice: 2.40, indicator: '', status: 'Not Generated' },
        ],
      },
    ],
  },
}

// ═══════════════════════════════════════════════════════════════
// API STRUCTURE — for future OData integration
// ═══════════════════════════════════════════════════════════════
const USE_MOCK = true

export const scheduleGenerateApi = {
  // GET SupplierHelpSet or similar
  async fetchSupplier(code) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 200))
      return MOCK_SUPPLIERS[code] || null
    }
    // const data = await odata(`/SupplierSet('${code}')?$expand=AgreementNav`)
    // return mapSupplier(data.d)
  },

  // GET ScheduleAgreementSet(id)?$expand=ItemNav
  async fetchAgreement(supplierId, agreementId) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 150))
      const supp = MOCK_SUPPLIERS[supplierId]
      return supp?.agreements.find(a => a.id === agreementId) || null
    }
    // const data = await odata(`/ScheduleAgreementSet('${agreementId}')?$expand=ItemNav`)
    // return mapAgreement(data.d)
  },

  // POST ScheduleLineSet — save generated schedule lines
  async saveScheduleLines(agreementId, lines) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
      return { success: true }
    }
    // return odataWrite('/ScheduleLineSet', { AgreementId: agreementId, Lines: lines })
  },

  // POST ApproveSet — send for approval
  async approveSchedule(agreementId, itemNos) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
      return { success: true }
    }
    // return odataWrite('/ApproveSet', { AgreementId: agreementId, Items: itemNos })
  },
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const DAYS = Array.from({ length: 30 }, (_, i) => i + 1)

function generateScheduleForItem(item, mode, dayCount) {
  const total = item.totalQuantity
  const days = new Array(30).fill(0)

  if (mode === 'week') {
    // Divide by 4 weeks, place on days 1, 8, 15, 22
    const weekDays = [0, 7, 14, 21] // indices for days 1, 8, 15, 22
    const perWeek = Math.floor(total / 4)
    const remainder = total - perWeek * 4
    weekDays.forEach((d, i) => {
      days[d] = perWeek + (i < remainder ? 1 : 0)
    })
  } else {
    // Day mode: divide by dayCount, place on consecutive days
    const n = Math.min(dayCount, 30)
    const perDay = Math.floor(total / n)
    const remainder = total - perDay * n
    for (let i = 0; i < n; i++) {
      days[i] = perDay + (i < remainder ? 1 : 0)
    }
  }

  return {
    itemNo: item.itemNo,
    sapCode: item.sapCode,
    description: item.description,
    hsnCode: item.hsnCode,
    totalQuantity: item.totalQuantity,
    days,
    total: days.reduce((s, v) => s + v, 0),
    forecast: [0, 0, 0],
  }
}

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
      const supp = await scheduleGenerateApi.fetchSupplier(code.trim().toUpperCase())
      if (!supp) { setError(`Supplier "${code}" not found.`); setLoading(false); return }
      onSubmit(supp)
    } catch (err) {
      setError(err.message || 'Failed to fetch supplier')
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSubmit() }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] anim-modal overflow-hidden">
        <div className="bg-gradient-to-r from-[#0a6ed1] to-[#085caf] px-6 py-5">
          <h2 className="text-[18px] font-bold text-white">Schedule Generate</h2>
          <p className="text-[13px] text-white/80 mt-1">Enter the supplier code to load Schedule Agreements</p>
        </div>
        <div className="px-6 py-6">
          <label className="block text-[13px] font-semibold text-[#32363a] mb-2">Supplier Code <span className="text-[#cc1c14]">*</span></label>
          <input
            autoFocus type="text" value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. FS859"
            className="w-full h-11 px-4 text-[15px] font-semibold border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all tracking-wider uppercase"
          />
          <div className="mt-2 text-[11px] text-[#6a6d70]">
            Available: <span className="font-semibold text-[#0a6ed1]">FS859</span>, <span className="font-semibold text-[#0a6ed1]">FS833</span>, <span className="font-semibold text-[#0a6ed1]">FS827</span>
          </div>
          {error && (
            <div className="mt-3 flex items-center gap-1.5 text-[13px] text-[#cc1c14] bg-[#fce8e6] px-3 py-2 rounded-lg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              {error}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-[#e5e5e5] flex justify-end">
          <button onClick={handleSubmit} disabled={loading}
            className="flex items-center gap-2 px-6 h-10 text-[14px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md disabled:opacity-60">
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
  const handleSubmit = () => {
    const n = parseInt(days, 10)
    if (!n || n < 1 || n > 30) return
    onSubmit(n)
  }
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[340px] anim-modal">
        <div className="px-6 py-4 border-b border-[#e5e5e5]">
          <h3 className="text-[15px] font-bold text-[#32363a]">No. of Days</h3>
          <p className="text-[12px] text-[#6a6d70] mt-0.5">Total quantity will be divided equally across these days</p>
        </div>
        <div className="px-6 py-5">
          <input autoFocus type="number" min="1" max="30" value={days}
            onChange={e => setDays(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
            placeholder="e.g. 5"
            className="w-full h-11 px-4 text-[16px] font-bold text-center border border-[#0a6ed1] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
        </div>
        <div className="px-6 py-4 border-t border-[#e5e5e5] flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 h-9 text-[13px] font-semibold text-[#6a6d70] hover:bg-[#f5f6f7] rounded-lg transition-all">Cancel</button>
          <button onClick={handleSubmit} disabled={!days || parseInt(days) < 1}
            className="px-5 h-9 text-[13px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] transition-all shadow-md disabled:opacity-50">
            Generate
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SCHEDULE LINES GRID
// ═══════════════════════════════════════════════════════════════
function ScheduleGrid({ lines, editable, onChange, onCancel, onSave, saving }) {
  const handleCellChange = (lineIdx, dayIdx, value) => {
    if (!onChange) return
    const newLines = lines.map((l, i) => {
      if (i !== lineIdx) return l
      const newDays = [...l.days]
      newDays[dayIdx] = Math.max(0, parseInt(value) || 0)
      const total = newDays.reduce((s, v) => s + v, 0)
      return { ...l, days: newDays, total }
    })
    onChange(newLines)
  }

  return (
    <div className="anim-fade">
      <div className="rounded-xl border border-[#e5e5e5] shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 bg-[#fafbfc] border-b border-[#e5e5e5] flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[#32363a]">
            {editable ? 'Schedule Line Editable' : 'Schedule Lines'} — {lines.length} item{lines.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="overflow-auto" style={{ maxHeight: '45vh' }}>
          <table className="border-collapse text-[12px]" style={{ minWidth: '1800px' }}>
            <thead className="sticky top-0 z-10">
              <tr className="bg-gradient-to-b from-[#fafbfc] to-[#f5f6f7] text-[#6a6d70]">
                <th className="text-left font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] whitespace-nowrap sticky left-0 bg-[#f5f6f7] z-20" style={{ minWidth: 60 }}>Item</th>
                <th className="text-left font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] whitespace-nowrap" style={{ minWidth: 80 }}>Sap Code</th>
                <th className="text-left font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] whitespace-nowrap" style={{ minWidth: 140 }}>Description</th>
                <th className="text-left font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] whitespace-nowrap" style={{ minWidth: 85 }}>HSN Code</th>
                <th className="text-center font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] whitespace-nowrap" style={{ minWidth: 80 }}>Total Qty</th>
                {/* Firm days 1-30 */}
                <th colSpan={30} className="text-center font-semibold py-1 px-0 border-b border-r border-[#e5e5e5] bg-[#ebf5ff] text-[#0a6ed1]">
                  Firm
                </th>
                <th className="text-center font-semibold py-2.5 px-3 border-b border-r border-[#e5e5e5] whitespace-nowrap bg-[#e8f5ec] text-[#107e3e]" style={{ minWidth: 70 }}>Total</th>
                <th colSpan={3} className="text-center font-semibold py-1 px-0 border-b border-[#e5e5e5] bg-[#fef7e6] text-[#b45309]">
                  Forecast
                </th>
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
              {lines.map((line, li) => (
                <tr key={line.itemNo} className="border-b border-[#f0f0f0] hover:bg-[#fafbfc] transition-colors">
                  <td className="py-2 px-3 border-r border-[#f0f0f0] font-semibold text-[#32363a] sticky left-0 bg-white z-20">{line.itemNo}</td>
                  <td className="py-2 px-3 border-r border-[#f0f0f0] text-[#0a6ed1] font-semibold">{line.sapCode}</td>
                  <td className="py-2 px-3 border-r border-[#f0f0f0] text-[#32363a]">{line.description}</td>
                  <td className="py-2 px-3 border-r border-[#f0f0f0] text-[#32363a]">{line.hsnCode}</td>
                  <td className="py-2 px-3 border-r border-[#f0f0f0] text-center font-bold text-[#32363a]">{line.totalQuantity}</td>
                  {DAYS.map((_, di) => (
                    <td key={di} className="py-1 px-0 border-r border-[#f0f0f0] text-center">
                      {editable ? (
                        <input type="number" min="0"
                          value={line.days[di] || ''}
                          onChange={e => handleCellChange(li, di, e.target.value)}
                          className="w-full h-7 text-center text-[11px] font-semibold border-0 bg-transparent focus:bg-[#ebf5ff] focus:outline-none focus:ring-1 focus:ring-[#0a6ed1] rounded transition-all tabular-nums"
                        />
                      ) : (
                        <span className={`text-[11px] tabular-nums ${line.days[di] > 0 ? 'font-bold text-[#32363a]' : 'text-[#d9d9d9]'}`}>
                          {line.days[di] || ''}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="py-2 px-3 border-r border-[#f0f0f0] text-center font-bold text-[#107e3e] bg-[#f0fff4]">{line.total}</td>
                  {line.forecast.map((f, fi) => (
                    <td key={fi} className="py-2 px-2 border-r border-[#f0f0f0] text-center text-[11px] text-[#b45309] bg-[#fffdf5]">{f || ''}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 mt-4">
        <button onClick={onCancel} disabled={saving}
          className="px-5 h-9 text-[13px] font-semibold text-[#cc1c14] bg-[#fce8e6] rounded-lg hover:bg-[#fad6d3] transition-all disabled:opacity-50">
          Cancel
        </button>
        <button onClick={onSave} disabled={saving}
          className="flex items-center gap-2 px-5 h-9 text-[13px] font-semibold text-white bg-[#107e3e] rounded-lg hover:bg-[#0d6633] transition-all shadow-md disabled:opacity-50">
          {saving && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ScheduleGenerate() {
  // ── Supplier popup ──
  const [supplier, setSupplier] = useState(null)

  // ── Agreement ──
  const [agreement, setAgreement] = useState(null)
  const [items, setItems] = useState([])

  // ── Filters ──
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // ── Selection ──
  const [selectedItems, setSelectedItems] = useState(new Set())

  // ── Schedule mode ──
  const [showDayPopup, setShowDayPopup] = useState(false)

  // ── Generated schedule lines ──
  const [scheduleLines, setScheduleLines] = useState([])
  const [scheduleMode, setScheduleMode] = useState(null) // 'week' | 'day'

  // ── Edit mode ──
  const [editLines, setEditLines] = useState([])
  const [editMode, setEditMode] = useState(false)

  // ── Saving ──
  const [saving, setSaving] = useState(false)

  // ── When supplier selected, load first agreement ──
  const handleSupplierSubmit = (supp) => {
    setSupplier(supp)
    if (supp.agreements.length > 0) {
      const ag = supp.agreements[0]
      setAgreement(ag)
      setItems(ag.items.map(it => ({ ...it })))
      setSelectedItems(new Set())
      setScheduleLines([])
      setScheduleMode(null)
      setEditMode(false)
    }
  }

  // ── Toggle item selection ──
  const toggleItem = (itemNo) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      next.has(itemNo) ? next.delete(itemNo) : next.add(itemNo)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(items.map(it => it.itemNo)))
    }
  }

  // ── Generate: Week ──
  const handleWeek = () => {
    if (selectedItems.size === 0) return
    const selected = items.filter(it => selectedItems.has(it.itemNo))
    const lines = selected.map(it => generateScheduleForItem(it, 'week', 0))
    setScheduleLines(lines)
    setScheduleMode('week')
    setEditMode(false)
    // Update indicator on items
    setItems(prev => prev.map(it => selectedItems.has(it.itemNo) ? { ...it, indicator: 'W' } : it))
  }

  // ── Generate: Day ──
  const handleDayClick = () => {
    if (selectedItems.size === 0) return
    setShowDayPopup(true)
  }

  const handleDayGenerate = (dayCount) => {
    setShowDayPopup(false)
    const selected = items.filter(it => selectedItems.has(it.itemNo))
    const lines = selected.map(it => generateScheduleForItem(it, 'day', dayCount))
    setScheduleLines(lines)
    setScheduleMode('day')
    setEditMode(false)
    setItems(prev => prev.map(it => selectedItems.has(it.itemNo) ? { ...it, indicator: 'D' } : it))
  }

  // ── Edit ──
  const handleEdit = () => {
    if (selectedItems.size === 0) return
    // If schedule already generated for selected items, use those. Otherwise generate fresh
    const selected = items.filter(it => selectedItems.has(it.itemNo))
    const existing = scheduleLines.filter(sl => selectedItems.has(sl.itemNo))
    if (existing.length > 0) {
      setEditLines(existing.map(l => ({ ...l, days: [...l.days], forecast: [...l.forecast] })))
    } else {
      // Default: generate day=5 for editing
      setEditLines(selected.map(it => generateScheduleForItem(it, 'day', 5)))
    }
    setEditMode(true)
  }

  // ── Save schedule ──
  const handleSaveSchedule = async () => {
    setSaving(true)
    try {
      await scheduleGenerateApi.saveScheduleLines(agreement.id, scheduleLines)
      // Update status to In Draft
      setItems(prev => prev.map(it => {
        const inSchedule = scheduleLines.find(sl => sl.itemNo === it.itemNo)
        return inSchedule ? { ...it, status: 'In Draft' } : it
      }))
      setScheduleLines([])
      setScheduleMode(null)
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const handleCancelSchedule = () => {
    setScheduleLines([])
    setScheduleMode(null)
  }

  // ── Save edit ──
  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      await scheduleGenerateApi.saveScheduleLines(agreement.id, editLines)
      setItems(prev => prev.map(it => {
        const inEdit = editLines.find(el => el.itemNo === it.itemNo)
        return inEdit ? { ...it, status: 'In Draft' } : it
      }))
      setEditMode(false)
      setEditLines([])
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const handleCancelEdit = () => {
    setEditMode(false)
    setEditLines([])
  }

  // ── Approve ──
  const handleApprove = async () => {
    if (selectedItems.size === 0) return
    setSaving(true)
    try {
      await scheduleGenerateApi.approveSchedule(agreement.id, Array.from(selectedItems))
      setItems(prev => prev.map(it => {
        if (!selectedItems.has(it.itemNo)) return it
        if (it.status === 'In Draft') return { ...it, status: 'In Approval' }
        if (it.status === 'In Approval') return { ...it, status: 'Generated' }
        return it
      }))
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  // ── Clear filters ──
  const handleClear = () => { setFromDate(''); setToDate('') }

  // ── Status style ──
  const statusStyle = (status) => {
    switch (status) {
      case 'Generated':     return 'text-[#107e3e] bg-[#e8f5ec]'
      case 'In Approval':   return 'text-[#0a6ed1] bg-[#ebf5ff]'
      case 'In Draft':      return 'text-[#e76500] bg-[#fff3e8]'
      default:              return 'text-[#b45309] bg-[#fef7e6]'
    }
  }

  const statusDot = (status) => {
    switch (status) {
      case 'Generated':     return '#107e3e'
      case 'In Approval':   return '#0a6ed1'
      case 'In Draft':      return '#e76500'
      default:              return '#b45309'
    }
  }

  // ── Show supplier popup if no supplier ──
  if (!supplier) {
    return (
      <PageLayout>
        <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.94) translateY(-8px)}to{opacity:1;transform:scale(1) translateY(0)}}.anim-modal{animation:modalIn .22s ease-out both}`}</style>
        <div className="bg-[#f5f6f7] min-h-[calc(100vh-104px)] flex items-center justify-center">
          <SupplierPopup onSubmit={handleSupplierSubmit} />
        </div>
      </PageLayout>
    )
  }

  if (!agreement) {
    return <PageLayout><div className="flex items-center justify-center h-64 text-[#6a6d70]">No agreements found for this supplier.</div></PageLayout>
  }

  return (
    <PageLayout>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.94) translateY(-8px)}to{opacity:1;transform:scale(1) translateY(0)}}
        .anim-fade{animation:fadeIn .3s ease-out both}
        .anim-modal{animation:modalIn .22s ease-out both}
        .row-stagger>*{animation:fadeIn .3s ease-out both}
        .row-stagger>*:nth-child(1){animation-delay:.02s}.row-stagger>*:nth-child(2){animation-delay:.05s}
        .row-stagger>*:nth-child(3){animation-delay:.08s}.row-stagger>*:nth-child(4){animation-delay:.11s}
        .row-stagger>*:nth-child(5){animation-delay:.14s}
      `}</style>

      {showDayPopup && <DayCountPopup onSubmit={handleDayGenerate} onCancel={() => setShowDayPopup(false)} />}

      <div className="bg-[#f5f6f7] min-h-[calc(100vh-104px)]">
        <main className="bg-white" style={{ minHeight: 'calc(100vh - 220px)' }}>

          {/* ── Header ── */}
          <div className="px-4 sm:px-6 lg:px-10 pt-5 pb-4 border-b border-[#e5e5e5] bg-gradient-to-b from-[#fafbfc] to-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">Schedule Agreement</div>
                <h1 className="text-[22px] sm:text-[26px] font-bold text-[#0a6ed1] tracking-tight">{agreement.id}</h1>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                <span className="text-[14px] font-semibold text-[#32363a] bg-white px-4 py-2 rounded-lg border border-[#e5e5e5] shadow-sm">{agreement.date}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[13px]">
              <div>
                <span className="text-[#6a6d70] text-[11px] uppercase tracking-wider font-semibold">Vendor Code</span>
                <div className="text-[#32363a] font-semibold mt-0.5">{supplier.code}</div>
              </div>
              <div>
                <span className="text-[#6a6d70] text-[11px] uppercase tracking-wider font-semibold">Vendor Name</span>
                <div className="text-[#32363a] font-semibold mt-0.5">{supplier.name}</div>
              </div>
              <div>
                <span className="text-[#6a6d70] text-[11px] uppercase tracking-wider font-semibold">Plant</span>
                <div className="text-[#32363a] font-semibold mt-0.5">{agreement.plantName}</div>
              </div>
              <div>
                <span className="text-[#6a6d70] text-[11px] uppercase tracking-wider font-semibold">Company Code</span>
                <div className="text-[#32363a] font-semibold mt-0.5">{agreement.companyCode}</div>
              </div>
            </div>
          </div>

          {/* ── Action bar: Edit / Approve + Filters + Week/Day ── */}
          <div className="px-4 sm:px-6 lg:px-10 py-4 border-b border-[#e5e5e5] bg-[#fafbfc]">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">

              {/* Filters */}
              <div className="flex flex-wrap items-end gap-3 flex-1">
                <div className="w-[170px]">
                  <label className="block text-[11px] text-[#6a6d70] mb-1 font-semibold uppercase tracking-wider">Delivery From Date</label>
                  <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                    className="w-full h-9 pl-3 pr-2 text-[13px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
                </div>
                <div className="w-[170px]">
                  <label className="block text-[11px] text-[#6a6d70] mb-1 font-semibold uppercase tracking-wider">To Date</label>
                  <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                    className="w-full h-9 pl-3 pr-2 text-[13px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
                </div>
                <button onClick={handleClear} className="h-9 px-4 text-[13px] font-semibold text-[#cc1c14] bg-[#fce8e6] rounded-lg hover:bg-[#fad6d3] transition-all">Clear</button>
              </div>

              {/* Week/Day + Edit/Approve */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Week / Day radio buttons */}
                <div className="flex items-center border border-[#d9d9d9] rounded-lg overflow-hidden bg-white">
                  <button onClick={handleWeek} disabled={selectedItems.size === 0}
                    className={`flex items-center gap-1.5 px-3 h-9 text-[12px] font-semibold transition-all disabled:opacity-40 ${scheduleMode === 'week' ? 'bg-[#0a6ed1] text-white' : 'text-[#32363a] hover:bg-[#f5f6f7]'}`}>
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${scheduleMode === 'week' ? 'border-white' : 'border-[#0a6ed1]'}`}>
                      {scheduleMode === 'week' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    Week
                  </button>
                  <div className="w-px h-5 bg-[#d9d9d9]" />
                  <button onClick={handleDayClick} disabled={selectedItems.size === 0}
                    className={`flex items-center gap-1.5 px-3 h-9 text-[12px] font-semibold transition-all disabled:opacity-40 ${scheduleMode === 'day' ? 'bg-[#0a6ed1] text-white' : 'text-[#32363a] hover:bg-[#f5f6f7]'}`}>
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${scheduleMode === 'day' ? 'border-white' : 'border-[#0a6ed1]'}`}>
                      {scheduleMode === 'day' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    Day
                  </button>
                </div>

                <button onClick={handleEdit} disabled={selectedItems.size === 0}
                  className="h-9 px-4 text-[13px] font-semibold text-white bg-[#e76500] rounded-lg hover:bg-[#c55600] transition-all shadow-sm disabled:opacity-40">
                  Edit
                </button>
                <button onClick={handleApprove} disabled={selectedItems.size === 0}
                  className="h-9 px-4 text-[13px] font-semibold text-white bg-[#107e3e] rounded-lg hover:bg-[#0d6633] transition-all shadow-sm disabled:opacity-40">
                  Approve
                </button>
              </div>
            </div>
          </div>

          {/* ── Items Table ── */}
          <div className="px-4 sm:px-6 lg:px-10 py-4">
            <div className="rounded-xl border border-[#e5e5e5] shadow-sm overflow-hidden">
              <div className="overflow-auto">
                <table className="w-full text-[13px] border-collapse" style={{ minWidth: '900px' }}>
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gradient-to-b from-[#fafbfc] to-[#f5f6f7] text-[#6a6d70]">
                      <th className="py-3 px-3 border-b border-r border-[#e5e5e5] w-10 text-center">
                        <input type="checkbox" checked={selectedItems.size === items.length && items.length > 0}
                          onChange={toggleAll} className="accent-[#0a6ed1] w-4 h-4 cursor-pointer" />
                      </th>
                      <th className="text-center font-semibold py-3 px-3 border-b border-r border-[#e5e5e5] uppercase tracking-wider text-[11px]">Item No.</th>
                      <th className="text-center font-semibold py-3 px-3 border-b border-r border-[#e5e5e5] uppercase tracking-wider text-[11px]">Sap Code</th>
                      <th className="text-center font-semibold py-3 px-3 border-b border-r border-[#e5e5e5] uppercase tracking-wider text-[11px]">Description</th>
                      <th className="text-center font-semibold py-3 px-3 border-b border-r border-[#e5e5e5] uppercase tracking-wider text-[11px]">HSN Code</th>
                      <th className="text-center font-semibold py-3 px-3 border-b border-r border-[#e5e5e5] uppercase tracking-wider text-[11px]">Total Monthly Schedule</th>
                      <th className="text-center font-semibold py-3 px-3 border-b border-r border-[#e5e5e5] uppercase tracking-wider text-[11px]">Unit Price</th>
                      <th className="text-center font-semibold py-3 px-3 border-b border-r border-[#e5e5e5] uppercase tracking-wider text-[11px]">Indicator</th>
                      <th className="text-center font-semibold py-3 px-3 border-b border-[#e5e5e5] uppercase tracking-wider text-[11px]">Status</th>
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
                          <td className="py-3 px-3 text-center font-semibold text-[#32363a] tabular-nums border-r border-[#f0f0f0]">{item.unitPrice.toFixed(2)}</td>
                          <td className="py-3 px-3 text-center border-r border-[#f0f0f0]">
                            {item.indicator ? (
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[12px] font-bold ${item.indicator === 'W' ? 'bg-[#ebf5ff] text-[#0a6ed1]' : 'bg-[#fff3e8] text-[#e76500]'}`}>{item.indicator}</span>
                            ) : <span className="text-[#d9d9d9]">—</span>}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusStyle(item.status)}`}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusDot(item.status) }} />
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

          {/* ── Schedule Lines Grid (generated) ── */}
          {scheduleLines.length > 0 && !editMode && (
            <div className="px-4 sm:px-6 lg:px-10 pb-6">
              <ScheduleGrid
                lines={scheduleLines}
                editable={false}
                onCancel={handleCancelSchedule}
                onSave={handleSaveSchedule}
                saving={saving}
              />
            </div>
          )}

          {/* ── Edit Grid ── */}
          {editMode && editLines.length > 0 && (
            <div className="px-4 sm:px-6 lg:px-10 pb-6">
              <ScheduleGrid
                lines={editLines}
                editable={true}
                onChange={setEditLines}
                onCancel={handleCancelEdit}
                onSave={handleSaveEdit}
                saving={saving}
              />
            </div>
          )}

        </main>
      </div>
    </PageLayout>
  )
}