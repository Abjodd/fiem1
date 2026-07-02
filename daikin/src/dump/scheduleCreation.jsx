import { useState, useMemo, useEffect } from 'react'

import Popup from '../layouts/popup.jsx'
import { scheduleGenerateApi, _MOCK_STORE } from './scheduleGenerate.jsx'

// ═══════════════════════════════════════════════════════════════
// DUMMY DATA — existing schedule lines (per agreement+material+vendor)
// Key format: `${agreementId}::${materialNumber}::${vendorId}`
// ═══════════════════════════════════════════════════════════════
const EXISTING_SCHEDULES = {
  '5501000392::3P5012::V003': {
    category: 'D',
    lines: [
      { id: 'L1', deliveryDate: 'May 10, 2026', scheduledQuantity: 500, asnCreated: true },
      { id: 'L2', deliveryDate: 'May 20, 2026', scheduledQuantity: 600, asnCreated: false },
      { id: 'L3', deliveryDate: 'May 30, 2026', scheduledQuantity: 400, asnCreated: false },
    ],
  },
}

const HEADER_APPROVALS = {}

// ═══════════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════════
const API_BASE_URL = '/api/v1'
const USE_MOCK = true

const scheduleCreationApi = {
  async getContext(agreementId, itemNo) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 100))
      const sa = _MOCK_STORE.find(a => a.id === agreementId)
      if (!sa) return null
      const item = sa.items.find(i => i.itemNo === itemNo)
      if (!item) return null

      const vendorsWithSchedules = (item.vendorAllocations || []).map(v => {
        const key = `${agreementId}::${item.materialNumber}::${v.vendorId}`
        const existing = EXISTING_SCHEDULES[key] || { category: 'D', lines: [] }
        return {
          ...v,
          category: existing.category,
          lines: existing.lines.map(l => ({ ...l })),
        }
      })

      const approvalKey = `${agreementId}::${item.materialNumber}`
      return {
        agreement: {
          id: sa.id,
          plantName: sa.plantName,
          companyCode: sa.companyCode,
          date: sa.date,
        },
        item: {
          itemNo: item.itemNo,
          materialNumber: item.materialNumber,
          materialName: item.materialName,
          hsnCode: item.hsnCode,
          storageLocation: item.storageLocation,
          deliverySchedule: item.deliverySchedule,
          scheduledQuantity: item.scheduledQuantity,
          unitPrice: item.unitPrice,
          status: item.status,
        },
        vendors: vendorsWithSchedules,
        approvalStatus: HEADER_APPROVALS[approvalKey] || null,
      }
    }
    const res = await fetch(`${API_BASE_URL}/scheduling-agreements/${agreementId}/items/${itemNo}/schedule-creation`)
    if (!res.ok) throw new Error('Failed to fetch context')
    return res.json()
  },

  async saveSchedules(payload) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 250))
      payload.vendors.forEach(v => {
        const key = `${payload.agreementId}::${payload.materialNumber}::${v.vendorId}`
        EXISTING_SCHEDULES[key] = {
          category: v.category,
          lines: v.lines.map((l, i) => ({
            id: l.id || `L${Date.now()}-${i}`,
            deliveryDate: l.deliveryDate,
            scheduledQuantity: Number(l.scheduledQuantity) || 0,
            asnCreated: l.asnCreated || false,
          })),
        }
      })

      const sa = _MOCK_STORE.find(a => a.id === payload.agreementId)
      if (sa) {
        const item = sa.items.find(i => i.itemNo === payload.itemNo)
        if (item) {
          let totalScheduled = 0
          item.vendorAllocations.forEach(v => {
            const key = `${payload.agreementId}::${item.materialNumber}::${v.vendorId}`
            const sched = EXISTING_SCHEDULES[key]
            if (sched) {
              totalScheduled += sched.lines.reduce((s, l) => s + Number(l.scheduledQuantity || 0), 0)
            }
          })
          item.scheduledQuantity = totalScheduled
          item.status = totalScheduled > 0 ? 'Generated' : 'Not Generated'
        }
      }

      return { ok: true, savedAt: new Date().toISOString() }
    }
    const res = await fetch(`${API_BASE_URL}/schedule-creation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Failed to save schedules')
    return res.json()
  },

  async setApproval({ agreementId, materialNumber, status }) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 100))
      HEADER_APPROVALS[`${agreementId}::${materialNumber}`] = status
      return { ok: true }
    }
    const res = await fetch(`${API_BASE_URL}/schedule-creation/approval`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agreementId, materialNumber, status }),
    })
    if (!res.ok) throw new Error('Failed to set approval')
    return res.json()
  },
}

// ═══════════════════════════════════════════════════════════════
// DATE HELPERS
// ═══════════════════════════════════════════════════════════════
const isoToDisplay = (iso) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return ''
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[Number(m) - 1]} ${d}, ${y}`
}
const displayToIso = (display) => {
  if (!display) return ''
  const months = { Jan:'01', Feb:'02', Mar:'03', Apr:'04', May:'05', Jun:'06', Jul:'07', Aug:'08', Sep:'09', Oct:'10', Nov:'11', Dec:'12' }
  const m = display.match(/^(\w{3})\s+(\d{1,2}),\s+(\d{4})$/)
  if (!m) return ''
  return `${m[3]}-${months[m[1]]}-${m[2].padStart(2, '0')}`
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ScheduleCreation({ agreementId, itemNo, onClose }) {
  const [ctx, setCtx] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [selectedVendorId, setSelectedVendorId] = useState(null)
  const [vendorState, setVendorState] = useState({})
  const [approval, setApproval] = useState(null)
  const [vendorErrors, setVendorErrors] = useState({})
  const [toast, setToast] = useState(null)

  // ── Load context ──
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    scheduleCreationApi.getContext(agreementId, itemNo).then(data => {
      if (cancelled || !data) return
      setCtx(data)
      setApproval(data.approvalStatus)
      const initial = {}
      data.vendors.forEach(v => {
        initial[v.vendorId] = {
          category: v.category,
          lines: v.lines.map(l => ({ ...l })),
          dirty: false,
        }
      })
      setVendorState(initial)
      if (data.vendors.length > 0) setSelectedVendorId(data.vendors[0].vendorId)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [agreementId, itemNo])

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(t)
  }, [toast])

  // ── Computed values ──
  const vendorTotals = useMemo(() => {
    const totals = {}
    Object.entries(vendorState).forEach(([vid, vs]) => {
      totals[vid] = vs.lines.reduce((s, l) => s + (Number(l.scheduledQuantity) || 0), 0)
    })
    return totals
  }, [vendorState])

  const selectedVendor = useMemo(() => {
    if (!ctx || !selectedVendorId) return null
    return ctx.vendors.find(v => v.vendorId === selectedVendorId) || null
  }, [ctx, selectedVendorId])

  const selectedVs = selectedVendorId ? (vendorState[selectedVendorId] || { category: 'D', lines: [] }) : null

  // ── Mutations ──
  const updateVendor = (vendorId, updater) => {
    setVendorState(prev => ({
      ...prev,
      [vendorId]: { ...updater(prev[vendorId]), dirty: true },
    }))
    setVendorErrors(prev => ({ ...prev, [vendorId]: null }))
  }

  const handleAddLine = () => {
    if (!selectedVendor || !selectedVs) return
    const currentTotal = vendorTotals[selectedVendor.vendorId] || 0
    if (currentTotal >= selectedVendor.allocatedQuantity) {
      setVendorErrors(prev => ({
        ...prev,
        [selectedVendor.vendorId]: `Quantity limit exceeded. Allocated quantity (${selectedVendor.allocatedQuantity}) is already fully scheduled.`,
      }))
      return
    }
    updateVendor(selectedVendor.vendorId, (state) => ({
      ...state,
      lines: [
        ...state.lines,
        { id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, deliveryDate: '', scheduledQuantity: '', asnCreated: false, isNew: true },
      ],
    }))
  }

  const handleDeleteLine = () => {
    if (!selectedVendor) return
    updateVendor(selectedVendor.vendorId, (state) => {
      const lines = [...state.lines]
      for (let i = lines.length - 1; i >= 0; i--) {
        if (!lines[i].asnCreated) { lines.splice(i, 1); break }
      }
      return { ...state, lines }
    })
  }

  const handleDeleteRow = (lineId) => {
    if (!selectedVendor) return
    updateVendor(selectedVendor.vendorId, (state) => {
      const target = state.lines.find(l => l.id === lineId)
      if (target?.asnCreated) return state
      return { ...state, lines: state.lines.filter(l => l.id !== lineId) }
    })
  }

  const handleLineChange = (lineId, field, value) => {
    if (!selectedVendor) return
    updateVendor(selectedVendor.vendorId, (state) => ({
      ...state,
      lines: state.lines.map(l => {
        if (l.id !== lineId || l.asnCreated) return l
        return { ...l, [field]: value }
      }),
    }))
  }

  const handleCategoryChange = (category) => {
    if (!selectedVendor) return
    updateVendor(selectedVendor.vendorId, (state) => ({ ...state, category }))
  }

  // ── Approval ──
  const handleApprove = async () => {
    await scheduleCreationApi.setApproval({ agreementId, materialNumber: ctx.item.materialNumber, status: 'approved' })
    setApproval('approved')
    setToast({ type: 'success', msg: 'Approved at header level' })
  }

  const handleReject = async () => {
    await scheduleCreationApi.setApproval({ agreementId, materialNumber: ctx.item.materialNumber, status: 'rejected' })
    setApproval('rejected')
    setToast({ type: 'success', msg: 'Rejected at header level' })
  }

  // ── Validation ──
  const validateAllVendors = () => {
    const errors = {}
    let firstErr = null
    ctx.vendors.forEach(v => {
      const vs = vendorState[v.vendorId]
      if (!vs || vs.lines.length === 0) return
      const total = vs.lines.reduce((s, l) => s + (Number(l.scheduledQuantity) || 0), 0)
      const invalidLine = vs.lines.find(l => !l.deliveryDate || !l.scheduledQuantity || Number(l.scheduledQuantity) <= 0)
      if (invalidLine) {
        errors[v.vendorId] = `${v.vendorName}: every line must have a delivery date and a positive scheduled quantity.`
        if (!firstErr) firstErr = errors[v.vendorId]
        return
      }
      if (total !== v.allocatedQuantity) {
        const diff = v.allocatedQuantity - total
        errors[v.vendorId] = diff > 0
          ? `${v.vendorName}: scheduled (${total}) < allocated (${v.allocatedQuantity}). Short by ${diff}.`
          : `${v.vendorName}: scheduled (${total}) > allocated (${v.allocatedQuantity}) by ${-diff}.`
        if (!firstErr) firstErr = errors[v.vendorId]
      }
    })
    return { errors, firstErr }
  }

  const handleSave = async () => {
    const { errors, firstErr } = validateAllVendors()
    if (firstErr) {
      setVendorErrors(errors)
      setToast({ type: 'error', msg: firstErr })
      const firstErrVendorId = Object.keys(errors)[0]
      if (firstErrVendorId) setSelectedVendorId(firstErrVendorId)
      return
    }
    setSaving(true)
    try {
      await scheduleCreationApi.saveSchedules({
        agreementId,
        itemNo: ctx.item.itemNo,
        materialNumber: ctx.item.materialNumber,
        vendors: ctx.vendors.map(v => ({
          vendorId: v.vendorId,
          category: vendorState[v.vendorId].category,
          lines: vendorState[v.vendorId].lines.map(l => ({
            id: l.id?.startsWith('new-') ? undefined : l.id,
            deliveryDate: l.deliveryDate,
            scheduledQuantity: Number(l.scheduledQuantity),
            asnCreated: l.asnCreated || false,
          })),
        })),
      })
      setToast({ type: 'success', msg: 'Schedules saved successfully' })
      setTimeout(() => { onClose?.(true) }, 700)
    } catch (err) {
      setToast({ type: 'error', msg: err.message || 'Failed to save' })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => onClose?.(false)

  // ── Loading ──
  if (loading || !ctx) {
    return (
      <Popup>
        <div className="bg-[#f5f6f7] min-h-[calc(100vh-104px)] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-[#6a6d70]">
            <div className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#0a6ed1] rounded-full animate-spin" />
            <span className="text-[14px]">Loading schedule creation…</span>
          </div>
        </div>
      </Popup>
    )
  }

  const hasAnyDirty = Object.values(vendorState).some(v => v.dirty)
  const selectedTotal = selectedVendorId ? (vendorTotals[selectedVendorId] || 0) : 0
  const selectedAllocated = selectedVendor?.allocatedQuantity || 0
  const selectedRemaining = selectedAllocated - selectedTotal
  const isMatch = selectedTotal === selectedAllocated && selectedTotal > 0
  const isOver = selectedTotal > selectedAllocated
  const meterPct = Math.min(100, selectedAllocated > 0 ? (selectedTotal / selectedAllocated) * 100 : 0)
  const currentErr = selectedVendorId ? vendorErrors[selectedVendorId] : null

  return (
    <Popup>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes toastIn { from { opacity: 0; transform: translate(-50%, 16px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .anim-fade { animation: fadeIn 0.35s ease-out both; }
        .anim-slide-up { animation: slideInUp 0.4s ease-out both; }
      `}</style>

      {/* ─── PAGE WRAPPER ─── */}
      <div className="bg-[#f5f6f7] min-h-[calc(100vh-104px)]">
        <main className="bg-white anim-fade" style={{ minHeight: 'calc(100vh - 152px)' }}>

          {/* ─── PAGE HEADER ─── */}
          {/* Removed the duplicate back-nav button that was here — Popup already provides it in the sticky top bar */}
          <div className="px-4 sm:px-6 lg:px-10 pt-6 pb-5 border-b border-[#e5e5e5]">
            <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">
              Schedule Creation
            </div>
            <h1 className="text-[20px] sm:text-[24px] font-bold text-[#32363a] tracking-tight leading-snug">
              Allocate <span className="text-[#0a6ed1]">{ctx.item.materialName}</span>
            </h1>
            <p className="text-[13px] text-[#6a6d70] mt-1 max-w-2xl">
              Select a vendor from the dropdown, then create schedule lines. Total scheduled quantity must equal the vendor's allocated quantity.
            </p>
          </div>

          {/* ─── HEADER CARD ─── */}
          <div className="px-4 sm:px-6 lg:px-10 pt-5 sm:pt-6">
            <div className="rounded-xl border border-[#e5e5e5] shadow-sm bg-white p-5 sm:p-6 anim-slide-up">

              {/* Top row: Agreement | Material | Vendor dropdown | Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 mb-5">

                {/* Agreement (read-only) */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold">Agreement</label>
                    <span title="Auto-populated, cannot be changed" className="inline-flex items-center text-[#94a3b8]">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </span>
                  </div>
                  <div className="h-10 flex items-center px-3 bg-[#f5f6f7] border border-[#e5e5e5] rounded-lg text-[14px] font-bold text-[#0a6ed1] tabular-nums select-none">
                    {ctx.agreement.id}
                  </div>
                  <div className="text-[11px] text-[#94a3b8] mt-0.5">Auto-populated · read-only</div>
                </div>

                {/* Material (read-only) */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold">Material</label>
                    <span title="Auto-populated, cannot be changed" className="inline-flex items-center text-[#94a3b8]">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </span>
                  </div>
                  <div className="h-10 flex items-center px-3 bg-[#f5f6f7] border border-[#e5e5e5] rounded-lg text-[14px] font-bold text-[#32363a] tabular-nums select-none">
                    {ctx.item.materialNumber}
                  </div>
                  <div className="text-[11px] text-[#6a6d70] mt-0.5">{ctx.item.materialName}</div>
                </div>

                {/* Vendor DROPDOWN */}
                <div>
                  <label className="block text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">Vendor</label>
                  <div className="relative">
                    <select
                      value={selectedVendorId || ''}
                      onChange={(e) => setSelectedVendorId(e.target.value)}
                      className="w-full h-10 pl-3 pr-9 text-[14px] font-semibold text-[#32363a] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all appearance-none cursor-pointer"
                      style={{ backgroundColor: '#fffde7' }}
                    >
                      {ctx.vendors.map(v => (
                        <option key={v.vendorId} value={v.vendorId}>{v.vendorName}</option>
                      ))}
                    </select>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className="absolute right-3 top-3 text-[#6a6d70] pointer-events-none">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                  <div className="text-[11px] text-[#94a3b8] mt-0.5">Selection from production plan</div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">Quantity</label>
                  <div className="h-10 flex items-center px-3 bg-[#f5f6f7] border border-[#e5e5e5] rounded-lg text-[14px] font-bold text-[#32363a] tabular-nums select-none">
                    {selectedVendor ? selectedVendor.allocatedQuantity.toLocaleString() : '—'}
                  </div>
                  <div className="text-[11px] text-[#94a3b8] mt-0.5">Fetched from backend</div>
                </div>
              </div>

              {/* Bottom row: Approve/Reject | vendor summary pills */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4 border-t border-[#f0f0f0]">

                {/* Approve / Reject */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold mr-1">Approve</span>
                  {approval === 'approved' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e8f5ec] text-[#107e3e] rounded-lg text-[13px] font-semibold">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>
                      Approved
                    </span>
                  ) : approval === 'rejected' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#fce8e6] text-[#cc1c14] rounded-lg text-[13px] font-semibold">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      Rejected
                    </span>
                  ) : (
                    <>
                      <button onClick={handleApprove}
                        className="flex items-center gap-1.5 px-4 h-9 text-[13px] font-semibold text-white bg-[#107e3e] border border-[#107e3e] rounded-lg hover:bg-[#0d6633] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>
                        Approve
                      </button>
                      <button onClick={handleReject}
                        className="flex items-center gap-1.5 px-4 h-9 text-[13px] font-semibold text-[#cc1c14] bg-[#fce8e6] border border-[#cc1c14] rounded-lg hover:bg-[#fad6d3] hover:scale-[1.02] active:scale-[0.98] transition-all">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        Reject
                      </button>
                    </>
                  )}
                  <span className="text-[11px] text-[#94a3b8] ml-1">Header-level approval</span>
                </div>

                {/* All-vendor mini summary pills */}
                <div className="sm:ml-auto flex flex-wrap gap-2">
                  {ctx.vendors.map(v => {
                    const t = vendorTotals[v.vendorId] || 0
                    const matched = t === v.allocatedQuantity && t > 0
                    const over = t > v.allocatedQuantity
                    const isActive = v.vendorId === selectedVendorId
                    return (
                      <button key={v.vendorId} onClick={() => setSelectedVendorId(v.vendorId)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold border transition-all ${
                          isActive
                            ? 'border-[#0a6ed1] bg-[#ebf5ff] text-[#0a6ed1]'
                            : 'border-[#e5e5e5] bg-[#fafbfc] text-[#6a6d70] hover:border-[#0a6ed1] hover:text-[#0a6ed1]'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${over ? 'bg-[#cc1c14]' : matched ? 'bg-[#107e3e]' : 'bg-[#b45309]'}`} />
                        {v.vendorName}: {t.toLocaleString()}/{v.allocatedQuantity.toLocaleString()}
                        {vendorErrors[v.vendorId] && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#cc1c14" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ─── SELECTED VENDOR SCHEDULE BLOCK ─── */}
          {selectedVendor && selectedVs && (
            <div className="px-4 sm:px-6 lg:px-10 pt-5 pb-6 anim-fade">
              <div className={`rounded-xl border shadow-sm bg-white overflow-hidden transition-colors ${
                isOver ? 'border-[#cc1c14]/40' : isMatch ? 'border-[#107e3e]/40' : 'border-[#e5e5e5]'
              }`}>

                {/* Block head */}
                <div className="px-5 sm:px-6 py-4 bg-gradient-to-b from-[#fafbfc] to-white border-b border-[#e5e5e5] flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#ebf5ff] flex items-center justify-center text-[#0a6ed1] font-bold text-[14px]">
                      {selectedVendor.vendorName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold">Vendor</div>
                      <div className="text-[15px] font-semibold text-[#32363a]">
                        {selectedVendor.vendorName}
                        <span className="ml-2 text-[11px] font-mono font-semibold text-[#0a6ed1] bg-[#ebf5ff] px-1.5 py-0.5 rounded">{selectedVendor.vendorId}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold">Scheduled / Allocated</div>
                      <div className="text-[15px] tabular-nums">
                        <span className={`font-bold ${isOver ? 'text-[#cc1c14]' : isMatch ? 'text-[#107e3e]' : 'text-[#32363a]'}`}>
                          {selectedTotal.toLocaleString()}
                        </span>
                        <span className="text-[#94a3b8] mx-1">/</span>
                        <span className="text-[#6a6d70] font-semibold">{selectedAllocated.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="w-32 h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${isOver ? 'bg-[#cc1c14]' : isMatch ? 'bg-[#107e3e]' : 'bg-[#0a6ed1]'}`}
                        style={{ width: `${meterPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Block body */}
                <div className="p-5 sm:p-6">
                  {/* Category */}
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <label className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold">Category</label>
                    <select
                      value={selectedVs.category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="h-9 pl-3 pr-8 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all cursor-pointer"
                    >
                      <option value="D">D — Date wise</option>
                      <option value="W">W — Week wise</option>
                    </select>
                    <span className="ml-auto text-[12px] text-[#6a6d70]">
                      {selectedVs.lines.length} {selectedVs.lines.length === 1 ? 'line' : 'lines'}
                    </span>
                  </div>

                  {/* Lines table */}
                  <div className="rounded-lg border border-[#e5e5e5] overflow-hidden mb-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-[14px]" style={{ minWidth: '520px' }}>
                        <thead>
                          <tr className="bg-[#fafbfc] border-b border-[#e5e5e5] text-[#6a6d70]">
                            <th className="text-left font-semibold py-2.5 px-3 text-[12px] uppercase tracking-wider w-[60px]">#</th>
                            <th className="text-left font-semibold py-2.5 px-3 text-[12px] uppercase tracking-wider">Delivery Date</th>
                            <th className="text-right font-semibold py-2.5 px-3 text-[12px] uppercase tracking-wider">Scheduled Quantity</th>
                            <th className="text-center font-semibold py-2.5 px-3 text-[12px] uppercase tracking-wider w-[80px]">Lock</th>
                            <th className="w-[40px]"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedVs.lines.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-[13px] text-[#6a6d70]">
                                No schedule lines yet. Click <strong>Add line</strong> below.
                              </td>
                            </tr>
                          )}
                          {selectedVs.lines.map((line, idx) => {
                            const locked = line.asnCreated
                            return (
                              <tr key={line.id} className={`border-b border-[#f0f0f0] last:border-b-0 ${locked ? 'bg-[#fafbfc]' : ''}`}>
                                <td className="py-2 px-3 text-[#6a6d70] font-semibold tabular-nums text-center">{idx + 1}</td>
                                <td className="py-2 px-3">
                                  <input
                                    type="date"
                                    value={displayToIso(line.deliveryDate)}
                                    onChange={(e) => handleLineChange(line.id, 'deliveryDate', isoToDisplay(e.target.value))}
                                    disabled={locked}
                                    className={`w-full h-9 px-2.5 text-[13px] border rounded-md transition-all ${
                                      locked
                                        ? 'bg-[#f5f6f7] text-[#94a3b8] border-[#e5e5e5] cursor-not-allowed'
                                        : 'bg-white border-[#d9d9d9] focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20'
                                    }`}
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    placeholder="0"
                                    value={line.scheduledQuantity}
                                    onChange={(e) => handleLineChange(line.id, 'scheduledQuantity', e.target.value)}
                                    disabled={locked}
                                    className={`w-full h-9 px-2.5 text-[13px] text-right tabular-nums border rounded-md transition-all ${
                                      locked
                                        ? 'bg-[#f5f6f7] text-[#94a3b8] border-[#e5e5e5] cursor-not-allowed'
                                        : 'bg-white border-[#d9d9d9] focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20'
                                    }`}
                                  />
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {locked ? (
                                    <span title="ASN created — locked" className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#f0f0f0] text-[#6a6d70] rounded text-[11px] font-bold tracking-wider">
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                      </svg>
                                      ASN
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-[#94a3b8]">—</span>
                                  )}
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <button
                                    onClick={() => handleDeleteRow(line.id)}
                                    disabled={locked}
                                    title={locked ? 'ASN created — cannot delete' : 'Delete this line'}
                                    className={`w-7 h-7 inline-flex items-center justify-center rounded transition-all ${
                                      locked
                                        ? 'text-[#cbd5e1] cursor-not-allowed'
                                        : 'text-[#94a3b8] hover:text-[#cc1c14] hover:bg-[#fce8e6]'
                                    }`}
                                  >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M18 6L6 18M6 6l12 12"/>
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                    <button onClick={handleAddLine}
                      className="flex items-center gap-1.5 px-3 h-9 text-[13px] font-semibold text-[#107e3e] bg-[#e8f5ec] border border-[#107e3e]/30 rounded-lg hover:bg-[#d4ebda] hover:border-[#107e3e] hover:scale-[1.02] active:scale-[0.98] transition-all">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Add line
                    </button>
                    <button
                      onClick={handleDeleteLine}
                      disabled={selectedVs.lines.length === 0 || selectedVs.lines.every(l => l.asnCreated)}
                      className="flex items-center gap-1.5 px-3 h-9 text-[13px] font-semibold text-[#cc1c14] bg-[#fce8e6] border border-[#cc1c14]/30 rounded-lg hover:bg-[#fad6d3] hover:border-[#cc1c14] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Delete line
                    </button>

                    {/* Status banner */}
                    <div className="sm:ml-auto">
                      {currentErr ? (
                        <div className="flex items-start gap-1.5 px-3 py-1.5 bg-[#fce8e6] text-[#cc1c14] rounded-lg text-[12.5px] font-medium">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                          </svg>
                          <span>{currentErr}</span>
                        </div>
                      ) : isOver ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fce8e6] text-[#cc1c14] rounded-lg text-[12.5px] font-medium">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                          Exceeds allocated by {(selectedTotal - selectedAllocated).toLocaleString()}
                        </div>
                      ) : isMatch ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e8f5ec] text-[#107e3e] rounded-lg text-[12.5px] font-medium">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>
                          Fully scheduled — {selectedAllocated.toLocaleString()} units
                        </div>
                      ) : selectedRemaining > 0 && selectedVs.lines.length > 0 ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fef7e6] text-[#b45309] rounded-lg text-[12.5px] font-medium">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                          </svg>
                          {selectedRemaining.toLocaleString()} units remaining
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── FOOTER ─── */}
          <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-5 border-t border-[#e5e5e5] flex items-center justify-end gap-3 sticky bottom-0 bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center gap-2 px-5 h-11 text-[14px] font-semibold text-[#cc1c14] bg-[#fce8e6] border border-[#fce8e6] rounded-lg hover:bg-[#fad6d3] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasAnyDirty}
              className="flex items-center gap-2 px-6 h-11 text-[14px] font-semibold text-white bg-[#107e3e] border border-[#107e3e] rounded-lg hover:bg-[#0d6633] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  Save
                </>
              )}
            </button>
          </div>

        </main>
      </div>

      {/* ─── TOAST ─── */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full shadow-xl flex items-center gap-2.5 text-[14px] font-medium ${
            toast.type === 'success' ? 'bg-[#107e3e] text-white' : 'bg-[#cc1c14] text-white'
          }`}
          style={{ animation: 'toastIn 0.3s ease-out both' }}
        >
          {toast.type === 'success' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          )}
          {toast.msg}
        </div>
      )}
    </Popup>
  )
}