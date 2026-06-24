import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import PageLayout from '../../layouts/PageLayout.jsx'
import { createAsnApi, authConfig } from '../../services/CreateAsnSch.js'
import { uploadAllAttachments } from '../../services/UploadAttachment.js'
import { useUser } from '../../context/UserContext.jsx'

// ═══════════════════════════════════════════════════════════════
// FILE / ATTACHMENT HELPERS
// ═══════════════════════════════════════════════════════════════
const ALLOWED_EXTENSIONS = ['pdf', 'xls', 'xlsx']
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]
const isAllowedFile = (file) => {
  const ext = file.name.split('.').pop()?.toLowerCase()
  return ALLOWED_EXTENSIONS.includes(ext) || ALLOWED_MIME_TYPES.includes(file.type)
}

// ═══════════════════════════════════════════════════════════════
// MOBILE HOOK
// ═══════════════════════════════════════════════════════════════
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])
  return isMobile
}

// ═══════════════════════════════════════════════════════════════
// SHARED FIELD HELPERS — MODULE SCOPE
// ═══════════════════════════════════════════════════════════════
function Field({ label, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1 min-w-0 ${className}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af] whitespace-nowrap">{label}</span>
      {children}
    </div>
  )
}

function ReadonlyVal({ value, accent }) {
  return (
    <span className={`text-[13px] font-semibold truncate ${accent ? 'text-[#0a6ed1]' : 'text-[#32363a]'}`}>{value}</span>
  )
}
function getAvlAsnQtyError(item) {
  const avl = parseFloat(item.avlAsnQty || 0)
  const created = parseFloat(item.asnCreated || 0)
  const total = parseFloat(item.totalQty || 0)
  if (isNaN(avl) || isNaN(created) || isNaN(total)) return null
  if (avl < 0) return 'Cannot be negative.'
  if (created + avl > total) return `exceeds Total Qty (${total}).`
  return null
}
// ═══════════════════════════════════════════════════════════════
// TAX MISMATCH TOGGLE
// ═══════════════════════════════════════════════════════════════
function TaxMismatchToggle({ value, onChange, compact = false, disabled = false }) {
  return (
    <div
      className={`flex rounded-lg overflow-hidden border border-[#d9d9d9] ${compact ? 'h-8' : ''} ${disabled ? 'opacity-40' : ''}`}
      style={{ minWidth: compact ? 72 : 88 }}
    >
      <button
        type="button"
        onClick={() => !disabled && onChange(true)}
        disabled={disabled}
        className={`flex-1 text-[11px] font-bold transition-all px-3 ${value ? 'bg-[#107e3e] text-white' : 'bg-white text-[#9ca3af] hover:bg-[#f0f0f0]'} disabled:cursor-not-allowed`}
      >YES</button>
      <button
        type="button"
        onClick={() => !disabled && onChange(false)}
        disabled={disabled}
        className={`flex-1 text-[11px] font-bold border-l border-[#d9d9d9] transition-all px-3 ${!value ? 'bg-[#cc1c14] text-white' : 'bg-white text-[#9ca3af] hover:bg-[#f0f0f0]'} disabled:cursor-not-allowed`}
      >NO</button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SPLIT BATCH MODAL
// ═══════════════════════════════════════════════════════════════
function SplitBatchModal({ open, item, onClose, onSave }) {
  const [rows, setRows] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open || !item) return
    setRows(item.batches && item.batches.length > 0 ? item.batches.map(b => ({ ...b })) : [])
    setError(null)
  }, [open, item])

  if (!open || !item) return null

  const target = parseFloat(item.avlAsnQty || 0)
  const total = rows.reduce((s, r) => s + parseFloat(r.quantity || 0), 0)
  const remaining = target - total
  const isMatch = Math.abs(remaining) < 0.0001 && rows.length > 0
  const isOver = total > target

  const addRow = () => {
    const maxBatches = parseInt(item.packingMaterialQty, 10)
    if (!isNaN(maxBatches) && rows.length >= maxBatches) {
      setError(`Maximum ${maxBatches} batch rows allowed (matches Packing Material Qty).`)
      return
    }
    setRows([...rows, { id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, batchCode: '', quantity: '' }])
    setError(null)
  }
  const removeRow = (id) => { setRows(rows.filter(r => r.id !== id)); setError(null) }
  const updateRow = (id, field, value) => { setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r)); setError(null) }

  const handleSave = () => {
    if (rows.length === 0) { onSave(item.itemNo, []); onClose(); return }
    const missing = rows.find(r => !r.batchCode || !r.quantity || parseFloat(r.quantity) <= 0)
    if (missing) { setError('Every batch row needs a Batch/Heat Code and a positive Quantity.'); return }
    if (!isMatch) {
      setError(isOver
        ? `Sum of batch quantities (${total}) exceeds Permissible ASN Qty (${target}) by ${(total - target).toFixed(2)} ${item.totalUnit}.`
        : `Sum of batch quantities (${total}) is less than Permissible ASN Qty (${target}). Short by ${remaining.toFixed(2)} ${item.totalUnit}.`)
      return
    }
    onSave(item.itemNo, rows.map(r => ({ ...r, quantity: parseFloat(r.quantity) })))
    onClose()
  }

  const meterPct = target > 0 ? Math.min(100, (total / target) * 100) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 anim-fade" style={{ background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(2px)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[640px] max-h-[90vh] flex flex-col overflow-hidden anim-pop" onClick={e => e.stopPropagation()}>
        <div className="px-5 sm:px-6 py-4 border-b border-[#e5e5e5] bg-gradient-to-b from-[#fafbfc] to-white flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">Split Batch</div>
            <div className="text-[16px] font-bold text-[#32363a] truncate">
              <span className="text-[#0a6ed1]">{item.materialNumber}</span>
              <span className="text-[#6a6d70] font-medium mx-2">·</span>
              <span>{item.materialName}</span>
            </div>
            <div className="text-[12px] text-[#6a6d70] mt-0.5">
              Item {item.itemNo} &middot; Permissible ASN Qty: <strong className="text-[#32363a]">{target} {item.totalUnit}</strong>
              {item.packingMaterialQty && <> &middot; Max batches: <strong className="text-[#32363a]">{item.packingMaterialQty}</strong></>}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6a6d70] hover:text-[#cc1c14] hover:bg-[#fce8e6] transition-all flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-5 sm:px-6 pt-4 pb-2 flex items-center gap-3">
          <div className="flex-1 h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-300 ${isOver ? 'bg-[#cc1c14]' : isMatch ? 'bg-[#107e3e]' : 'bg-[#0a6ed1]'}`} style={{ width: `${meterPct}%` }} />
          </div>
          <div className="text-[13px] tabular-nums whitespace-nowrap">
            <span className={`font-bold ${isOver ? 'text-[#cc1c14]' : isMatch ? 'text-[#107e3e]' : 'text-[#32363a]'}`}>{total.toFixed(2)}</span>
            <span className="text-[#94a3b8] mx-1">/</span>
            <span className="text-[#6a6d70] font-semibold">{target.toFixed(2)} {item.totalUnit}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-3 min-h-0">
          <div className="rounded-lg border border-[#e5e5e5] overflow-hidden">
            <div className="flex items-center bg-[#fafbfc] border-b border-[#e5e5e5] text-[#6a6d70] text-[11px] uppercase tracking-wider font-semibold px-3 py-2.5">
              <div className="w-8 flex-shrink-0"></div>
              <div className="flex-1 px-2">Batch / Heat Code</div>
              <div className="w-28 px-2 text-right">Quantity</div>
              <div className="w-8 flex-shrink-0"></div>
            </div>
            {rows.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-[#6a6d70]">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" className="mx-auto mb-2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 12h8" /></svg>
                No data. Click <strong>+ Add Row</strong> below to create a batch.
              </div>
            ) : rows.map((r, i) => (
              <div key={r.id} className="flex items-center px-3 py-2 border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc]">
                <div className="w-8 flex-shrink-0">
                  <button onClick={() => removeRow(r.id)} className="w-6 h-6 flex items-center justify-center rounded-full text-[#cc1c14] hover:bg-[#fce8e6] transition-all">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                  </button>
                </div>
                <div className="flex-1 px-2">
                  <input type="text" value={r.batchCode} onChange={e => updateRow(r.id, 'batchCode', e.target.value)} placeholder={`Batch ${i + 1}`} className="w-full h-9 px-2.5 text-[13px] border border-[#d9d9d9] rounded bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
                </div>
                <div className="w-28 px-2">
                  <input type="number" min="0" step="any" value={r.quantity} onChange={e => updateRow(r.id, 'quantity', e.target.value)} onWheel={e => e.target.blur()} placeholder="0" className="w-full h-9 px-2.5 text-[13px] text-right tabular-nums border border-[#d9d9d9] rounded bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
                </div>
                <div className="w-8 flex-shrink-0 text-[11px] text-[#94a3b8] text-center">{item.totalUnit}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-3">
            <button onClick={addRow} className="flex items-center gap-1.5 px-3 h-9 text-[13px] font-semibold text-[#0a6ed1] bg-[#ebf5ff] border border-[#0a6ed1] rounded-lg hover:bg-[#d9ecff] hover:scale-[1.02] active:scale-[0.98] transition-all">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
              Add Row
            </button>
            {rows.length > 0 && !error && (
              isMatch ? (
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#107e3e]">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" /></svg>
                  Quantities balance
                </span>
              ) : isOver ? (
                <span className="text-[12px] font-semibold text-[#cc1c14]">Over by {(total - target).toFixed(2)}</span>
              ) : (
                <span className="text-[12px] font-semibold text-[#b45309]">{remaining.toFixed(2)} {item.totalUnit} remaining</span>
              )
            )}
          </div>
          {error && (
            <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-[#fce8e6] text-[#cc1c14] rounded-lg text-[12.5px] font-medium anim-fade">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="px-5 sm:px-6 py-3 border-t border-[#e5e5e5] flex justify-end gap-2 bg-[#fafbfc]">
          <button onClick={onClose} className="h-10 px-5 text-[14px] font-semibold text-[#32363a] bg-white border border-[#d9d9d9] rounded-lg hover:bg-[#f5f6f7] hover:scale-[1.02] active:scale-[0.98] transition-all">Close</button>
          <button onClick={handleSave} className="flex items-center gap-2 h-10 px-5 text-[14px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /></svg>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CONFIRMATION MODAL
// ═══════════════════════════════════════════════════════════════
function ConfirmationModal({ open, kind, title, message, details, primaryLabel, secondaryLabel, onPrimary, onSecondary }) {
  if (!open) return null
  const palette = {
    success: { ring: '#107e3e', soft: '#e8f5ec', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg> },
    error:   { ring: '#cc1c14', soft: '#fce8e6', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg> },
    confirm: { ring: '#0a6ed1', soft: '#ebf5ff', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg> },
    warning: { ring: '#b45309', soft: '#fef7e6', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg> },
  }[kind] || { ring: '#0a6ed1', soft: '#ebf5ff', icon: null }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 anim-fade" style={{ background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(2px)' }} onClick={onSecondary || onPrimary}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[480px] overflow-hidden anim-pop" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: palette.soft, color: palette.ring }}>{palette.icon}</div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-[18px] font-bold text-[#32363a] tracking-tight">{title}</h3>
            {message && <p className="text-[13.5px] text-[#6a6d70] mt-1 leading-relaxed">{message}</p>}
          </div>
        </div>
        {details && <div className="px-6 pb-2"><div className="bg-[#fafbfc] border border-[#e5e5e5] rounded-lg px-4 py-3 text-[13px] text-[#32363a] space-y-1.5">{details}</div></div>}
        <div className="px-6 py-4 border-t border-[#e5e5e5] flex justify-end gap-2 bg-[#fafbfc]">
          {secondaryLabel && <button onClick={onSecondary} className="h-10 px-5 text-[14px] font-semibold text-[#32363a] bg-white border border-[#d9d9d9] rounded-lg hover:bg-[#f5f6f7] hover:scale-[1.02] active:scale-[0.98] transition-all">{secondaryLabel}</button>}
          <button onClick={onPrimary} className="h-10 px-5 text-[14px] font-semibold text-white rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md" style={{ background: palette.ring }}>{primaryLabel || 'OK'}</button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MOBILE ITEM CARD
// ═══════════════════════════════════════════════════════════════
function MobileItemCard({ item, isSelected, onToggle, onUpdate, onSplitBatch, packagingTypes, pdirOptions, originalQty }) {
  const [expanded, setExpanded] = useState(false)
  const isZeroQty = originalQty === 0
  // const isZeroQty = parseFloat(item.avlAsnQty || 0) === 0
  const batchCount = item.batches?.length || 0
  const batchSum = (item.batches || []).reduce((s, b) => s + parseFloat(b.quantity || 0), 0)
  const target = parseFloat(item.avlAsnQty || 0)
  const batchBalanced = batchCount > 0 && Math.abs(batchSum - target) < 0.0001

  return (
    <div className={`rounded-xl border mb-3 overflow-hidden transition-colors ${isZeroQty ? 'bg-[#fafbfc] border-[#e5e5e5] opacity-60' : isSelected ? 'bg-[#ebf5ff] border-[#0a6ed1]' : 'bg-white border-[#e5e5e5]'}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <input type="checkbox" checked={isSelected} onChange={isZeroQty ? undefined : onToggle} disabled={isZeroQty} className="accent-[#0a6ed1] w-4 h-4 flex-shrink-0 disabled:cursor-not-allowed disabled:opacity-40" />
        <div className="flex-1 min-w-0">
          <div className="text-[#0a6ed1] font-semibold text-[13px]">{item.materialNumber}</div>
          <div className="text-[#6a6d70] text-[12px] truncate">{item.materialName}</div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="px-2 py-0.5 bg-[#ebf5ff] text-[#0a6ed1] rounded-full text-[11px] font-bold">Item {item.ebelp} / Sch {item.schLine}</span>
          {isZeroQty && <span className="px-2 py-0.5 bg-[#fce8e6] text-[#cc1c14] rounded text-[11px] font-semibold">No qty</span>}
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-[#6a6d70] flex-shrink-0 p-1" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><path d="M6 9l6 6 6-6" /></svg>
        </button>
      </div>

      <div className="flex border-t border-[#f0f0f0] text-center">
        {[
          { label: 'Permissible ASN', value: `${item.avlAsnQty} ${item.totalUnit}` },
          { label: 'Net Price', value: `₹${item.netPrice}` },
          { label: 'Shipment', value: item.shipmentDate },
        ].map((s, i) => (
          <div key={i} className={`flex-1 py-2 ${i < 2 ? 'border-r border-[#f0f0f0]' : ''}`}>
            <div className="text-[10px] text-[#9ca3af] font-semibold uppercase tracking-wide">{s.label}</div>
            <div className={`text-[12px] font-bold mt-0.5 ${i === 0 && isZeroQty ? 'text-[#cc1c14]' : 'text-[#32363a]'}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {expanded && (
        <div className="border-t border-[#f0f0f0] bg-[#fafbfc] px-4 py-4">
          <button
            onClick={() => onSplitBatch(item)} disabled={isZeroQty}
            className={`w-full flex items-center justify-between gap-2 mb-4 px-3 h-10 text-[13px] font-semibold rounded-lg border transition-all ${isZeroQty ? 'opacity-40 cursor-not-allowed text-[#6a6d70] bg-[#f5f5f5] border-[#d9d9d9]' : 'text-[#0a6ed1] bg-[#ebf5ff] border-[#0a6ed1] hover:bg-[#d9ecff] hover:scale-[1.01] active:scale-[0.99]'}`}
          >
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v12M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9c0 6-12 0-12 12" /></svg>
              Split Batch
            </span>
            {batchCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${batchBalanced ? 'bg-[#e8f5ec] text-[#107e3e]' : 'bg-[#fef7e6] text-[#b45309]'}`}>
                {batchCount} {batchCount === 1 ? 'batch' : 'batches'}{!batchBalanced ? ' · unbalanced' : ''}
              </span>
            )}
          </button>
          {!isZeroQty && parseInt(item.packingMaterialQty, 10) > 0 && batchCount === 0 && isSelected && (
              <p className="text-[11px] font-semibold text-[#cc1c14] mt-1">
                ⚠ Split batch required before creating ASN
              </p>
            )}

          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { label: 'Sch Line', value: `${item.ebelp} / ${item.schLine}` },
              { label: 'Total Qty', value: `${item.totalQty} ${item.totalUnit}` },
              { label: 'Conf. Qty', value: `${item.confQty} ${item.confUnit}` },
              { label: 'Delivered Qty (Menge)', value: `${item.deliveredQty} ${item.deliveredUnit}` },
              { label: 'ASN Created', value: item.asnCreated },
              { label: 'SPQ', value: item.spq },
            ].map((d, i) => (
              <div key={i} className="bg-white rounded-lg px-3 py-2 border border-[#e5e5e5]">
                <div className="text-[10px] text-[#9ca3af] font-semibold uppercase tracking-wide">{d.label}</div>
                <div className="text-[13px] text-[#32363a] font-semibold mt-0.5">{d.value}</div>
              </div>
            ))}
          </div>

          <div className="mb-3">
          <label className="block text-[12px] font-semibold text-[#374151] mb-1">
            Permissible ASN Qty
          </label>
          <input
            type="text"
            value={item.avlAsnQty}
            onChange={e => onUpdate('avlAsnQty', e.target.value)}
            disabled={isZeroQty}
            className={`w-full h-10 rounded-lg border bg-white px-3 text-[14px] outline-none focus:ring-2 transition-all disabled:bg-[#f5f5f5] disabled:cursor-not-allowed ${
              getAvlAsnQtyError(item)
                ? 'border-[#cc1c14] focus:border-[#cc1c14] focus:ring-[#cc1c14]/20'
                : 'border-[#d9d9d9] focus:border-[#0a6ed1] focus:ring-[#0a6ed1]/20'
            }`}
          />
          {getAvlAsnQtyError(item) && (
            <p className="text-[11px] text-[#cc1c14] font-semibold mt-1">
              {getAvlAsnQtyError(item)}
            </p>
          )}
        </div>
          <div className="mb-3">
            <label className="block text-[12px] font-semibold text-[#374151] mb-1">FG Stock</label>
            <input type="number" min="0" step="any" value={item.fgStock} onChange={e => onUpdate('fgStock', e.target.value)} onWheel={e => e.target.blur()} placeholder="0"
              className={`w-full h-10 rounded-lg border bg-white px-3 text-[14px] outline-none focus:ring-2 transition-all ${item.fgStock !== '' && parseFloat(item.fgStock) <= parseFloat(item.avlAsnQty || 0) ? 'border-[#cc1c14] focus:border-[#cc1c14] focus:ring-[#cc1c14]/20' : 'border-[#d9d9d9] focus:border-[#0a6ed1] focus:ring-[#0a6ed1]/20'}`} />
            {item.fgStock !== '' && parseFloat(item.fgStock) <= parseFloat(item.avlAsnQty || 0) && (
              <p className="text-[11px] text-[#cc1c14] font-semibold mt-1">Must be greater than {item.avlAsnQty}</p>
            )}
          </div>
          <div className="mb-3">
            <label className="block text-[12px] font-semibold text-[#374151] mb-1">Supplier Net Price</label>
            <input type="text" value={item.supplierNetPrice} onChange={e => onUpdate('supplierNetPrice', e.target.value)} className="w-full h-10 rounded-lg border border-[#d9d9d9] bg-white px-3 text-[14px] outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
          </div>
          <div className="mb-3">
            <label className="block text-[12px] font-semibold text-[#374151] mb-1">Material Expiry</label>
            <input type="date" value={item.materialExpiry} onChange={e => onUpdate('materialExpiry', e.target.value)} className="w-full h-10 rounded-lg border border-[#d9d9d9] bg-white px-3 text-[14px] outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1">Packing Type</label>
              <select value={item.packingMaterialType} onChange={e => onUpdate('packingMaterialType', e.target.value)} className="w-full h-10 rounded-lg border border-[#d9d9d9] bg-white px-2 text-[13px] outline-none focus:border-[#0a6ed1]">
                <option value="">Select</option>
                <option value="Trolley">Trolley</option>
                <option value="Pallet">Pallet</option>
                <option value="Carton">Carton</option>
                <option value="Crate">Crate</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1">Packing Qty</label>
              <input type="text" value={item.packingMaterialQty} onChange={e => onUpdate('packingMaterialQty', e.target.value)} className="w-full h-10 rounded-lg border border-[#d9d9d9] bg-white px-3 text-[14px] outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 text-center transition-all" />
            </div>
          </div>
          
          <div className="mb-3">
            <label className="block text-[12px] font-semibold text-[#374151] mb-1">PDIR No.</label>
            <select value={item.pdirNo} onChange={e => onUpdate('pdirNo', e.target.value)} className="w-full h-10 rounded-lg border border-[#d9d9d9] bg-white px-2 text-[13px] outline-none focus:border-[#0a6ed1]">
              <option value="">Select</option>
              {(pdirOptions || []).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2.5 border border-[#e5e5e5]">
            <span className="text-[13px] font-semibold text-[#374151]">Tax Mismatch</span>
            <TaxMismatchToggle value={item.taxMismatch} onChange={val => onUpdate('taxMismatch', val)} disabled={isZeroQty} />
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// DESKTOP ITEM CARD
// ═══════════════════════════════════════════════════════════════
function DesktopItemCard({ item, isSelected, onToggle, onUpdate, onSplitBatch, packagingTypes, pdirOptions, originalQty }) {
  const isZeroQty = originalQty === 0
  const bc = item.batches?.length || 0
  const bsum = (item.batches || []).reduce((s, b) => s + parseFloat(b.quantity || 0), 0)
  const balanced = bc > 0 && Math.abs(bsum - parseFloat(item.avlAsnQty || 0)) < 0.0001

  const inputCls = "h-8 px-2 text-[12px] border border-[#d9d9d9] rounded bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-1 focus:ring-[#0a6ed1]/20 transition-all w-full"
  const selectCls = "h-8 px-1.5 text-[12px] border border-[#d9d9d9] rounded bg-white focus:outline-none focus:border-[#0a6ed1] transition-all w-full"

  return (
    <div className={`rounded-xl border transition-all mb-3 overflow-hidden ${isZeroQty ? 'border-[#e5e5e5] bg-[#fafbfc] opacity-60' : isSelected ? 'border-[#0a6ed1] bg-[#f5f9ff]' : 'border-[#e5e5e5] bg-white hover:border-[#c5d8f0]'}`}>
      <div className={`flex items-center gap-3 px-4 py-3 border-b ${isZeroQty ? 'border-[#f0f0f0] bg-[#fafbfc]' : isSelected ? 'border-[#cce0f5] bg-[#ebf5ff]' : 'border-[#f0f0f0] bg-[#fafbfc]'}`}>
        <input type="checkbox" checked={isSelected} onChange={isZeroQty ? undefined : onToggle} disabled={isZeroQty} className="accent-[#0a6ed1] w-4 h-4 flex-shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40" title={isZeroQty ? 'No deliverable qty — cannot include in ASN' : undefined} />
        <span className="flex-shrink-0 px-2.5 py-1 bg-[#0a6ed1] text-white rounded-md text-[11px] font-bold tracking-wide">Item {item.ebelp}</span>
        <span className="flex-shrink-0 px-2 py-1 bg-[#e8f5ec] text-[#107e3e] rounded text-[11px] font-bold">Sch {item.schLine}</span>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-[13px] font-bold text-[#0a6ed1] flex-shrink-0">{item.materialNumber}</span>
          <span className="text-[#6a6d70] text-[12px] truncate">{item.materialName}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isZeroQty && <span className="px-2 py-0.5 bg-[#fce8e6] text-[#cc1c14] rounded text-[11px] font-semibold">No qty available</span>}
          <span className="text-[11px] text-[#6a6d70]">Ship: <strong className="text-[#32363a]">{item.shipmentDate}</strong></span>
          <span className="text-[11px] text-[#6a6d70]">SPQ: <strong className="text-[#32363a]">{item.spq}</strong></span>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* ROW 1 */}
        <div className="grid grid-cols-8 gap-3">
          <Field label="Total Qty"><ReadonlyVal value={`${item.totalQty} ${item.totalUnit}`} accent /></Field>
          <Field label="Conf. Qty"><ReadonlyVal value={`${item.confQty} ${item.confUnit}`} /></Field>
          <Field label="Delivered Qty"><ReadonlyVal value={`${item.deliveredQty} ${item.deliveredUnit}`} /></Field>
          <Field label="ASN Created"><ReadonlyVal value={item.asnCreated} /></Field>
          <Field label="Permissible ASN Qty">
            <input
              type="text"
              value={item.avlAsnQty}
              onChange={e => onUpdate('avlAsnQty', e.target.value)}
              disabled={isZeroQty}
              className={
                inputCls +
                ' font-semibold text-[#0a6ed1] disabled:bg-[#f5f5f5] disabled:cursor-not-allowed' +
                (getAvlAsnQtyError(item) ? ' border-[#cc1c14] ring-1 ring-[#cc1c14]/30' : '')
              }
            />
            {getAvlAsnQtyError(item) && (
              <span className="text-[10px] text-[#cc1c14] font-semibold leading-tight">
                {getAvlAsnQtyError(item)}
              </span>
            )}
          </Field>
          <Field label="FG Stock">
            <input type="number" min="0" step="any" value={item.fgStock} onChange={e => onUpdate('fgStock', e.target.value)} onWheel={e => e.target.blur()} placeholder="0" disabled={isZeroQty}
              className={inputCls + ' disabled:bg-[#f5f5f5] disabled:cursor-not-allowed' + (item.fgStock !== '' && parseFloat(item.fgStock) <= parseFloat(item.avlAsnQty || 0) ? ' border-[#cc1c14] ring-1 ring-[#cc1c14]/30' : '')} />
            {item.fgStock !== '' && parseFloat(item.fgStock) <= parseFloat(item.avlAsnQty || 0) && (
              <span className="text-[10px] text-[#cc1c14] font-semibold leading-tight">Must be &gt; {item.avlAsnQty}</span>
            )}
          </Field>
          <Field label="Net Price"><ReadonlyVal value={item.netPrice} /></Field>
          <Field label="Supplier Net Price">
            <input type="text" value={item.supplierNetPrice} onChange={e => onUpdate('supplierNetPrice', e.target.value)} disabled={isZeroQty} className={inputCls + ' disabled:bg-[#f5f5f5] disabled:cursor-not-allowed'} />
          </Field>
        </div>

        {/* ROW 2 */}
        <div className="grid grid-cols-7 gap-3">
          <Field label="Material Expiry">
            <input type="date" value={item.materialExpiry} onChange={e => onUpdate('materialExpiry', e.target.value)} disabled={isZeroQty} className={inputCls + ' disabled:bg-[#f5f5f5] disabled:cursor-not-allowed'} />
          </Field>
          <Field label="Tax Mismatch">
            <TaxMismatchToggle value={item.taxMismatch} onChange={val => onUpdate('taxMismatch', val)} compact disabled={isZeroQty} />
          </Field>
          <Field label="Type of Packaging">
            <select value={item.packagingType} onChange={e => onUpdate('packagingType', e.target.value)} disabled={isZeroQty} className={selectCls + ' disabled:bg-[#f5f5f5] disabled:cursor-not-allowed'}>
              <option value="">Select</option>
              {packagingTypes.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
            </select>
          </Field>
          <Field label="Packing Material Qty" className="max-w-[120px]">
            <input type="text" value={item.packingMaterialQty} onChange={e => onUpdate('packingMaterialQty', e.target.value)} placeholder="0" disabled={isZeroQty} className={inputCls + ' text-center disabled:bg-[#f5f5f5] disabled:cursor-not-allowed'} />
          </Field>
          <Field label="PDIR No.">
            <select value={item.pdirNo} onChange={e => onUpdate('pdirNo', e.target.value)} disabled={isZeroQty} className={selectCls + ' disabled:bg-[#f5f5f5] disabled:cursor-not-allowed'}>
              <option value="">Select</option>
              {(pdirOptions || []).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        </div>

        {/* ROW 3 — Split Batch */}
        <div className="flex items-center gap-3 pt-1 border-t border-[#f0f0f0]">
          {(() => {
            const maxBatches = parseInt(item.packingMaterialQty, 10)
            const batchDisabled = isZeroQty || !item.packingMaterialQty || isNaN(maxBatches) || maxBatches < 1
            return (
              <>
                <button
                  onClick={() => !batchDisabled && onSplitBatch(item)} disabled={batchDisabled}
                  className={`flex items-center gap-2 px-4 h-8 text-[12px] font-semibold rounded-lg border transition-all ${batchDisabled ? 'opacity-40 cursor-not-allowed text-[#6a6d70] bg-[#f5f5f5] border-[#d9d9d9]' : bc > 0 ? balanced ? 'text-[#107e3e] bg-[#e8f5ec] border-[#107e3e] hover:scale-[1.02] active:scale-[0.98]' : 'text-[#b45309] bg-[#fef7e6] border-[#b45309] hover:scale-[1.02] active:scale-[0.98]' : 'text-white bg-[#0a6ed1] border-[#0a6ed1] hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98]'}`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v12M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9c0 6-12 0-12 12" /></svg>
                  Split Batch{bc > 0 ? ` (${bc}/${maxBatches || '?'})` : ' +'}
                </button>
                {!isZeroQty && batchDisabled && <span className="text-[11px] text-[#9ca3af]">Enter Packing Material Qty to enable split</span>}
                {isZeroQty && <span className="text-[11px] text-[#9ca3af]">No deliverable qty — row excluded from ASN</span>}
                {!batchDisabled && bc > 0 && (
                  <span className={`text-[12px] font-semibold ${balanced ? 'text-[#107e3e]' : 'text-[#b45309]'}`}>
                    {balanced ? `✓ ${bc} batch${bc > 1 ? 'es' : ''} — balanced` : `⚠ ${bc} batch${bc > 1 ? 'es' : ''} — quantities unbalanced`}
                  </span>
                )}
              </>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ATTACHMENTS PANEL
// ═══════════════════════════════════════════════════════════════
function AttachmentsPanel({ kind, items, onUpload, onRemove }) {
  const inputRef = useRef(null)

  const handleSelect = (e) => {
    const files = Array.from(e.target.files)
    for (const file of files) {
      if (!isAllowedFile(file)) { onUpload(null, `"${file.name}" is not allowed. Only PDF / Excel (.pdf, .xls, .xlsx).`); continue }
      onUpload({
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        name: file.name,
        size: file.size,
        kind,
        _file: file,
      })
    }
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    for (const file of files) {
      if (!isAllowedFile(file)) { onUpload(null, `"${file.name}" is not allowed. Only PDF / Excel (.pdf, .xls, .xlsx).`); continue }
      onUpload({
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        name: file.name,
        size: file.size,
        kind,
        _file: file,
      })
    }
  }

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5]">
        <div>
          <h3 className="text-[18px] font-bold text-[#32363a]">{kind === 'pdir' ? 'PDIR Attachments' : 'General Attachments'} ({items.length})</h3>
          <p className="text-[12px] text-[#6a6d70] mt-0.5">Files will be uploaded to SAP after ASN is created</p>
        </div>
        <button onClick={() => inputRef.current?.click()} className="flex items-center gap-1.5 px-4 h-9 text-[14px] font-semibold text-[#0a6ed1] bg-[#ebf5ff] border border-[#0a6ed1] rounded-lg hover:bg-[#d9ecff] hover:scale-[1.02] active:scale-[0.98] transition-all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          Add
        </button>
        <input ref={inputRef} type="file" multiple accept=".pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleSelect} className="hidden" />
      </div>
      {items.length === 0 ? (
        <div onDragOver={e => e.preventDefault()} onDrop={handleDrop} className="py-20 flex flex-col items-center text-center">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" className="mb-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
          <h4 className="text-[18px] font-semibold text-[#32363a] mb-1">No files added yet.</h4>
          <p className="text-[13px] text-[#6a6d70]">Drop files here or click Add. They will be uploaded when you create the ASN.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#f0f0f0]">
          {items.map(att => (
            <div key={att.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#fafbfc]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#ebf5ff] flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a6ed1" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-[#32363a]">{att.name}</div>
                  <div className="text-[12px] text-[#6a6d70]">{(att.size / 1024).toFixed(1)} KB · Pending upload</div>
                </div>
              </div>
              <button onClick={() => onRemove(att.id)} className="w-8 h-8 flex items-center justify-center text-[#cc1c14] hover:bg-[#fce8e6] rounded transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function CreateASN2({ agreement: propAgreement }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginId, loginType, loading: userLoading } = useUser()
  authConfig.loginId   = loginId
  authConfig.loginType = loginType
  const agreement = location.state?.agreement || propAgreement
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState('items')
  const [attachmentsSubTab, setAttachmentsSubTab] = useState('general')

  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [totalPacking, setTotalPacking] = useState('')

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  // const [storageSearch, setStorageSearch] = useState('')
  const [materialSearch, setMaterialSearch] = useState('')

  const [items, setItems] = useState([])
  const [itemsLoading, setItemsLoading] = useState(false)
  const [itemsError, setItemsError] = useState(null)
  const [selectedItemNos, setSelectedItemNos] = useState([])
  const [pdirOptions, setPdirOptions] = useState([])
  const [packagingTypes] = useState(['Box', 'Bag', 'Drum', 'Pallet', 'Container', 'Crate', 'Bundle'])

  const [generalAttachments, setGeneralAttachments] = useState([])
  const [pdirAttachments, setPdirAttachments] = useState([])

  const [splitBatchItem, setSplitBatchItem] = useState(null)
  const [modal, setModal] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [originalQties, setOriginalQties] = useState({})

  // useEffect(() => {
  //   if (userLoading) return
  //   if (!loginId || !loginType) return
  //   if (!agreement?.id) return
  //   setItemsLoading(true)
  //   setItemsError(null)
  //   Promise.all([
  //     createAsnApi.getEligibleItems({ scheduleNo: agreement.id }),
  //     createAsnApi.getPdirRefNos(agreement.id),
  //   ])
  //     .then(([asnItems, pdirNos]) => { setItems(asnItems); setPdirOptions(pdirNos) })
  //     .catch(err => setItemsError(err.message))
  //     .finally(() => setItemsLoading(false))
  // }, [userLoading, loginId, loginType, agreement?.id])

  // Fields the user can edit — preserve these across re-fetches
const USER_EDITABLE_FIELDS = [
  'avlAsnQty', 'fgStock', 'supplierNetPrice', 'materialExpiry',
  'taxMismatch', 'packingMaterialType', 'packingMaterialQty',
  'packagingType', 'qtyPerPackaging', 'pdirNo', 'batches',
]

useEffect(() => {
  if (userLoading) return
  if (!loginId || !loginType) return
  if (!agreement?.id) return
  setItemsLoading(true)
  setItemsError(null)
  Promise.all([
    createAsnApi.getEligibleItems({ scheduleNo: agreement.id }),
    createAsnApi.getPdirRefNos(agreement.id),
  ])
    .then(([asnItems, pdirNos]) => {
      setItems(prev => {
        const prevMap = Object.fromEntries(prev.map(i => [i.itemNo, i]))
        return asnItems.map(freshItem => {
          const existing = prevMap[freshItem.itemNo]
          if (!existing) return freshItem
          const preserved = {}
          USER_EDITABLE_FIELDS.forEach(f => { preserved[f] = existing[f] })
          return { ...freshItem, ...preserved }
        })
      })
      // ADD THIS BLOCK:
      setOriginalQties(prev => {
        const next = { ...prev }
        asnItems.forEach(i => {
          if (!(i.itemNo in next)) next[i.itemNo] = parseFloat(i.avlAsnQty || 0)
        })
        return next
      })
      setPdirOptions(pdirNos)
    })
    .catch(err => setItemsError(err.message))
    .finally(() => setItemsLoading(false))
}, [userLoading, loginId, loginType, agreement?.id])

  const selectableItems = useMemo(() =>items.filter(i => (originalQties[i.itemNo] ?? parseFloat(i.avlAsnQty || 0)) > 0),[items, originalQties])
  const allSelected = selectableItems.length > 0 && selectedItemNos.length === selectableItems.length
  const someSelected = selectedItemNos.length > 0 && !allSelected

  const toggleAll = () => { if (allSelected) setSelectedItemNos([]); else setSelectedItemNos(selectableItems.map(i => i.itemNo)) }
  const toggleOne = (itemNo) => {
    const item = items.find(i => i.itemNo === itemNo)
    if (!item || parseFloat(item.avlAsnQty || 0) === 0) return
    if (selectedItemNos.includes(itemNo)) setSelectedItemNos(selectedItemNos.filter(n => n !== itemNo))
    else setSelectedItemNos([...selectedItemNos, itemNo])
  }
  const updateItem = (itemNo, field, value) => setItems(items.map(i => i.itemNo === itemNo ? { ...i, [field]: value } : i))
  const handleSplitBatchSave = (itemNo, batches) => setItems(items.map(i => i.itemNo === itemNo ? { ...i, batches } : i))

const handleGo = async () => {
  if (!agreement?.id) return
  setItemsLoading(true)
  setItemsError(null)
  try {
    const asnItems = await createAsnApi.getEligibleItems({
      scheduleNo: agreement.id, fromDate, toDate
    })
    setItems(prev => {
      const prevMap = Object.fromEntries(prev.map(i => [i.itemNo, i]))
      return asnItems.map(freshItem => {
        const existing = prevMap[freshItem.itemNo]
        if (!existing) return freshItem
        const preserved = {}
        USER_EDITABLE_FIELDS.forEach(f => { preserved[f] = existing[f] })
        return { ...freshItem, ...preserved }
      })
    })

      setOriginalQties(prev => {
      const next = { ...prev }
      asnItems.forEach(i => {
        if (!(i.itemNo in next)) next[i.itemNo] = parseFloat(i.avlAsnQty || 0)
      })
      return next
    })
    setSelectedItemNos(prev => prev.filter(no => asnItems.some(i => i.itemNo === no)))
  } catch (err) { setItemsError(err.message) }
  finally { setItemsLoading(false) }
}
  const handleClear = () => { setFromDate(''); setToDate(''); setMaterialSearch('') }

  const calcInvoiceValue = () =>
    items.filter(i => selectedItemNos.includes(i.itemNo))
      .reduce((sum, i) => sum + (parseFloat(i.avlAsnQty || 0) * parseFloat(i.supplierNetPrice || 0)), 0)
      .toFixed(2)

  const validateBeforeCreate = () => {
    const errors = []
    if (selectedItemNos.length === 0) errors.push('Select at least one item to create ASN.')
    if (!invoiceNumber) errors.push('Invoice Number is required.')
    if (generalAttachments.length === 0) errors.push('At least one General Attachment is required.')
    
    const selectedItems = items.filter(i => selectedItemNos.includes(i.itemNo))
    selectedItems.forEach(it => {
      const avl = parseFloat(it.avlAsnQty || 0)
      if (avl === 0) { errors.push(`Item ${it.ebelp} / Sch ${it.schLine} (${it.materialNumber}): Available ASN Qty is 0.`); return }
      const avlErr = getAvlAsnQtyError(it)
      if (avlErr) errors.push(`Item ${it.ebelp} / Sch ${it.schLine} (${it.materialNumber}): ${avlErr}`)
      const fgVal = parseFloat(it.fgStock)
      if (it.fgStock === '' || isNaN(fgVal)) errors.push(`Item ${it.ebelp} / Sch ${it.schLine} (${it.materialNumber}): FG Stock is required.`)
      else if (fgVal <= avl) errors.push(`Item ${it.ebelp} / Sch ${it.schLine} (${it.materialNumber}): FG Stock (${fgVal}) must be greater than Avl. ASN Qty (${avl}).`)
      if (it.batches && it.batches.length > 0) {
        const sum = it.batches.reduce((s, b) => s + parseFloat(b.quantity || 0), 0)
        if (Math.abs(sum - avl) > 0.0001) errors.push(`Item ${it.ebelp} / Sch ${it.schLine} (${it.materialNumber}): batch quantity sum (${sum}) does not match Permissible ASN Qty (${avl}).`)
        const bad = it.batches.find(b => !b.batchCode || !b.quantity)
        if (bad) errors.push(`Item ${it.ebelp} / Sch ${it.schLine}: incomplete batch row.`)
      }
    })
    return errors
  }

  const handleCreate = () => {
    const errors = validateBeforeCreate()
    if (errors.length > 0) {
      setModal({ kind: 'error', title: 'Cannot create ASN', message: 'Please resolve the following issues and try again:', details: (<ul className="list-disc pl-5 space-y-1">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>), primaryLabel: 'OK', onPrimary: () => setModal(null) })
      return
    }
    const selectedItems = items.filter(i => selectedItemNos.includes(i.itemNo))
    const totalFiles = generalAttachments.length + pdirAttachments.length
    setModal({
      kind: 'confirm', title: 'Create ASN?', message: 'Please review the details below before submitting.',
      details: (
        <div className="space-y-1.5">
          <div className="flex justify-between"><span className="text-[#6a6d70]">Agreement</span><strong>{agreement.id}</strong></div>
          <div className="flex justify-between"><span className="text-[#6a6d70]">Invoice Number</span><strong>{invoiceNumber}</strong></div>
          <div className="flex justify-between"><span className="text-[#6a6d70]">Invoice Amount</span><strong>₹ {calcInvoiceValue()}</strong></div>
          <div className="flex justify-between"><span className="text-[#6a6d70]">Items selected</span><strong>{selectedItems.length}</strong></div>
          <div className="flex justify-between"><span className="text-[#6a6d70]">PDIR attachments</span><strong>{pdirAttachments.length}</strong></div>
          <div className="flex justify-between"><span className="text-[#6a6d70]">General attachments</span><strong>{generalAttachments.length}</strong></div>
        </div>
      ),
      primaryLabel: 'Yes, Create', secondaryLabel: 'Cancel', onPrimary: doCreate, onSecondary: () => setModal(null),
    })
  }

  const doCreate = async () => {
    setModal(null)
    setSubmitting(true)
    try {
      const selectedItems = items.filter(i => selectedItemNos.includes(i.itemNo))
      const result = await createAsnApi.submitAsn({
        scheduleNo: agreement.id, plant: agreement.plant,
        invoiceNumber, invoiceDate, invoiceAmount: calcInvoiceValue(), totalPacking,
        items: selectedItems,
        generalAttachmentIds: generalAttachments.map(a => a.id),
        pdirAttachmentIds: pdirAttachments.map(a => a.id),
      })

      const asnNum  = result.asnNum  || ''
      const fisYear = result.fisYear || String(new Date().getFullYear())

      // ← upload attachments after ASN is created
      let uploadResult = { uploaded: 0, failed: [] }
      const totalFiles = generalAttachments.length + pdirAttachments.length
      if (totalFiles > 0 && asnNum) {
        uploadResult = await uploadAllAttachments({
          asnNum,
          fisYear,
          generalAttachments,
          pdirAttachments,
        })
      }

      const someUploadsFailed = uploadResult.failed.length > 0
      setModal({
        kind: someUploadsFailed ? 'warning' : 'success',
        title: someUploadsFailed ? 'ASN created — some attachments failed' : 'ASN created successfully',
        message: someUploadsFailed
          ? `ASN ${asnNum} was created but ${uploadResult.failed.length} file(s) could not be uploaded. You may need to attach them manually.`
          : 'Your ASN has been submitted and all attachments uploaded successfully.',
        details: (
          <div className="space-y-1.5">
            <div className="flex justify-between"><span className="text-[#6a6d70]">ASN Number</span><strong className="text-[#0a6ed1]">{asnNum}{fisYear ? '/' + fisYear : ''}</strong></div>
            <div className="flex justify-between"><span className="text-[#6a6d70]">Agreement</span><strong>{agreement.id}</strong></div>
            <div className="flex justify-between"><span className="text-[#6a6d70]">Items</span><strong>{selectedItems.length}</strong></div>
          {totalFiles > 0 && (
              <div className="flex justify-between">
                <span className="text-[#6a6d70]">Attachments uploaded</span>
                <strong className={uploadResult.failed.length > 0 ? 'text-[#b45309]' : 'text-[#107e3e]'}>
                  {uploadResult.uploaded} / {totalFiles}
                </strong>
              </div>
            )}
            {uploadResult.failed.length > 0 && (
              <div className="pt-1 border-t border-[#e5e5e5]">
                <div className="text-[11px] text-[#cc1c14] font-semibold mb-1">Failed uploads:</div>
                {uploadResult.failed.map((f, i) => (
                  <div key={i} className="text-[11px] text-[#cc1c14]">• {f.name}: {f.error}</div>
                ))}
              </div>
            )}
          </div>
        ),
        primaryLabel: 'Done', onPrimary: () => { setModal(null); navigate(-1) },
      })
    } catch (err) {
      setModal({ kind: 'error', title: 'Failed to create ASN', message: err.message || 'Something went wrong. Please try again.', primaryLabel: 'OK', onPrimary: () => setModal(null) })
    } finally { setSubmitting(false) }
  }

  const totalAttachments = generalAttachments.length + pdirAttachments.length

  const filteredItems = useMemo(() => {
    const available = items.filter(i => (originalQties[i.itemNo] ?? parseFloat(i.avlAsnQty || 0)) > 0)
    if (!materialSearch.trim()) return available
    const q = materialSearch.trim().toUpperCase()
    return available.filter(i => i.materialNumber.toUpperCase().includes(q) || i.materialName.toUpperCase().includes(q))
  }, [items, materialSearch, originalQties])

  return (
    <PageLayout>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .anim-fade { animation: fadeIn 0.35s ease-out both; }
        .anim-slide-up { animation: slideUp 0.4s ease-out both; }
        .anim-pop { animation: popIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) both; }
      `}</style>

      <div className="bg-[#f5f6f7] min-h-[calc(100vh-104px)] anim-fade">

        {/* ─── HEADER STRIP ─── */}
        <div className="bg-white border-b border-[#e5e5e5] px-8 py-3 flex items-center justify-between">
          <h1 className="text-[18px] font-bold text-[#32363a] tracking-tight">Create ASN</h1>
          <button onClick={handleCreate} disabled={submitting} className="flex items-center gap-2 px-5 h-10 text-[14px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Creating…</> : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>Create</>}
          </button>
        </div>

        {/* ─── AGREEMENT INFO ─── */}
        <div className="bg-white border-b border-[#e5e5e5] px-8 py-5 anim-slide-up">
          <div className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">Schedule Agreement</div>
          <h2 className="text-[24px] font-bold text-[#0a6ed1] tracking-tight">{agreement?.id}</h2>
          <div className="text-[14px] text-[#6a6d70] mt-1">Plant: ({agreement?.plant})</div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            ALWAYS-VISIBLE: Invoice Details + Selected Materials
        ═══════════════════════════════════════════════════════ */}
        <div className="px-8 py-6 grid grid-cols-12 gap-6 bg-[#f5f6f7]">
          {/* Invoice Details */}
          <div className="col-span-12 xl:col-span-4">
            <div className="bg-white border border-[#e5e5e5] rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-[18px] font-bold text-[#32363a]">Invoice Details</h3>
                  <p className="text-[13px] text-[#6a6d70] mt-0.5">Enter invoice information</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#0a6ed1]/10 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a6ed1" strokeWidth="2"><path d="M4 4h16v16H4z" /><path d="M8 9h8M8 13h5" /></svg>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Invoice Number <span className="text-[#cc1c14]">*</span></label>
                  <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="Enter invoice number" className="w-full h-10 rounded-lg border border-[#d9d9d9] bg-white px-3 text-[14px] outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Invoice Date</label>
                  <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full h-10 rounded-lg border border-[#d9d9d9] bg-white px-3 text-[14px] outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Invoice Amount (auto)</label>
                  <div className="h-10 rounded-lg border border-dashed border-[#cfd8e3] bg-[#f8fafc] flex items-center px-3 text-[#32363a] text-[13px] font-semibold">₹ {calcInvoiceValue()}</div>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Invoice Value (Vendor)</label>
                  <div className="h-10 rounded-lg border border-dashed border-[#cfd8e3] bg-[#f8fafc] flex items-center px-3 text-[#6a6d70] text-[13px] italic">₹ {calcInvoiceValue()}</div>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Total Packing</label>
                  <input type="text" value={totalPacking} onChange={e => setTotalPacking(e.target.value)} placeholder="0" className="w-full h-10 rounded-lg border border-[#d9d9d9] bg-white px-3 text-[14px] outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
                </div>
              </div>
            </div>
          </div>

          {/* Selected Materials */}
          <div className="col-span-12 xl:col-span-8">
            <div className="bg-white border border-[#e5e5e5] rounded-xl shadow-sm overflow-hidden h-full">
              <div className="px-6 py-4 border-b border-[#e5e5e5] flex items-center justify-between">
                <div>
                  <h3 className="text-[18px] font-bold text-[#32363a]">Selected Materials</h3>
                  <p className="text-[13px] text-[#6a6d70] mt-0.5">{selectedItemNos.length} of {selectableItems.length} selectable items chosen</p>
                </div>
                <span className="px-3 py-1 bg-[#ebf5ff] text-[#0a6ed1] rounded-full text-[12px] font-semibold">{selectedItemNos.length} selected</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] min-w-[800px]">
                  <thead>
                    <tr className="bg-[#fafbfc] border-b border-[#e5e5e5] text-[#6a6d70]">
                      <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">Item / Sch</th>
                      <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">Material</th>
                      <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">Net Price</th>
                      <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">Permissible ASN Qty</th>
                      <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">SPQ</th>
                      <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">Batches</th>
                      <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItemNos.length === 0 && (
                      <tr><td colSpan={7} className="py-12 text-center text-[#6a6d70] text-[14px]">No materials selected. Pick items from the table below.</td></tr>
                    )}
                    {items.filter(i => selectedItemNos.includes(i.itemNo)).map(item => {
                      const bc = item.batches?.length || 0
                      const bsum = (item.batches || []).reduce((s, b) => s + parseFloat(b.quantity || 0), 0)
                      const balanced = bc > 0 && Math.abs(bsum - parseFloat(item.avlAsnQty || 0)) < 0.0001
                      return (
                        <tr key={item.itemNo} className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc]">
                          <td className="py-3 px-4 font-semibold text-[#0a6ed1]">{item.ebelp} / {item.schLine}</td>
                          <td className="py-3 px-4"><div className="text-[#0a6ed1] font-semibold">{item.materialNumber}</div><div className="text-[#6a6d70] text-[12px]">{item.materialName}</div></td>
                          <td className="py-3 px-4 text-[#32363a]">{item.netPrice}</td>
                          <td className="py-3 px-4 text-[#32363a]">{item.avlAsnQty} {item.totalUnit}</td>
                          <td className="py-3 px-4 text-[#32363a]">{item.spq}</td>
                          <td className="py-3 px-4">
                            {bc === 0 ? <span className="text-[12px] text-[#9ca3af]">—</span> : (
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${balanced ? 'bg-[#e8f5ec] text-[#107e3e]' : 'bg-[#fef7e6] text-[#b45309]'}`}>{bc} · {balanced ? 'balanced' : 'unbalanced'}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[#32363a] font-semibold">{(parseFloat(item.avlAsnQty || 0) * parseFloat(item.supplierNetPrice || 0)).toFixed(2)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            TAB BAR
        ═══════════════════════════════════════════════════════ */}
        <div className="bg-white border-t border-b border-[#e5e5e5] px-8 pt-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('items')}
              className={`relative flex items-center gap-2 px-5 h-11 text-[14px] font-semibold rounded-t-lg transition-all -mb-px border-b-2 ${activeTab === 'items' ? 'text-[#0a6ed1] bg-[#ebf5ff] border-[#0a6ed1]' : 'text-[#6a6d70] bg-transparent border-transparent hover:text-[#0a6ed1] hover:bg-[#f5f9ff]'}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <path d="M12 11v6M9 14h6" />
              </svg>
              Create ASN
              {selectedItemNos.length > 0 && (
                <span className="ml-0.5 min-w-[18px] h-[18px] bg-[#0a6ed1] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">{selectedItemNos.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('attachments')}
              className={`relative flex items-center gap-2 px-5 h-11 text-[14px] font-semibold rounded-t-lg transition-all -mb-px border-b-2 ${activeTab === 'attachments' ? 'text-[#0a6ed1] bg-[#ebf5ff] border-[#0a6ed1]' : 'text-[#6a6d70] bg-transparent border-transparent hover:text-[#0a6ed1] hover:bg-[#f5f9ff]'}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.49" />
              </svg>
              Attachments
              {generalAttachments.length === 0 && <span className="text-[#cc1c14] text-[16px] font-bold leading-none -mt-1">*</span>}
              {totalAttachments > 0 && <span className="ml-0.5 min-w-[18px] h-[18px] bg-[#0a6ed1] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">{totalAttachments}</span>}
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            TAB CONTENT
        ═══════════════════════════════════════════════════════ */}
        {activeTab === 'items' ? (
          <div className="anim-fade">
            {/* Filter row */}
            <div className="px-4 md:px-8 py-5 bg-white border-b border-[#e5e5e5] grid grid-cols-2 md:grid-cols-12 gap-4 items-end">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-[12px] text-[#6a6d70] mb-1.5 font-semibold">Shipment From Date</label>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} max={toDate || undefined} className="w-full h-10 pl-3 pr-2 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-[12px] text-[#6a6d70] mb-1.5 font-semibold">To Date</label>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} min={fromDate || undefined} className="w-full h-10 pl-3 pr-2 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
              </div>
              <div className="col-span-1 md:col-span-1 flex gap-2">
                <button onClick={handleGo} className="h-10 px-4 text-[14px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm w-full">Go</button>
              </div>
              <div className="col-span-1 md:col-span-1">
                <button onClick={handleClear} className="h-10 px-4 text-[14px] font-semibold text-[#cc1c14] bg-[#fce8e6] border border-[#fce8e6] rounded-lg hover:bg-[#fad6d3] transition-all w-full">Clear</button>
              </div>
              <div className="col-span-2 md:col-span-3">
                <label className="block text-[12px] text-[#6a6d70] mb-1.5 font-semibold">Enter Materials</label>
                <div className="relative">
                  <input type="text" value={materialSearch} onChange={e => setMaterialSearch(e.target.value)} placeholder="Search materials" className="w-full h-10 pl-3 pr-10 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-3 top-3 text-[#6a6d70]"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
                </div>
              </div>
            </div>

            {/* Items list */}
            <div className="px-4 md:px-8 pb-8 bg-white">
              {itemsError && (
                <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-[#fce8e6] text-[#cc1c14] rounded-lg text-[13px]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                  {itemsError}
                </div>
              )}
              {itemsLoading && (
                <div className="flex items-center justify-center py-12 gap-2 text-[#6a6d70] text-[13px]">
                  <div className="w-5 h-5 border-2 border-[#e5e5e5] border-t-[#0a6ed1] rounded-full animate-spin"/>
                  Loading items…
                </div>
              )}
              {!itemsLoading && isMobile ? (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[14px] font-bold text-[#32363a]">Items ({filteredItems.length})</span>
                    <label className="flex items-center gap-2 text-[13px] font-semibold text-[#0a6ed1] cursor-pointer">
                      <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected }} onChange={toggleAll} className="accent-[#0a6ed1] w-4 h-4" />
                      Select All
                    </label>
                  </div>
                  {filteredItems.length === 0 && <div className="py-12 text-center text-[#6a6d70] text-[14px]">No items available</div>}
                  {filteredItems.map(item => (
                    <MobileItemCard key={item.itemNo} item={item} isSelected={selectedItemNos.includes(item.itemNo)} onToggle={() => toggleOne(item.itemNo)} onUpdate={(field, val) => updateItem(item.itemNo, field, val)} onSplitBatch={(it) => setSplitBatchItem(it)} packagingTypes={packagingTypes} pdirOptions={pdirOptions} originalQty={originalQties[item.itemNo] ?? parseFloat(item.avlAsnQty || 0)} />
                  ))}
                </div>
              ) : !itemsLoading && (
                <div className="pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected }} onChange={toggleAll} className="accent-[#0a6ed1] w-4 h-4" />
                        <span className="text-[13px] font-semibold text-[#374151]">Select All</span>
                      </label>
                      <span className="text-[13px] text-[#6a6d70]">{filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}</span>
                    </div>
                    {selectedItemNos.length > 0 && <span className="px-3 py-1 bg-[#ebf5ff] text-[#0a6ed1] rounded-full text-[12px] font-semibold">{selectedItemNos.length} selected</span>}
                  </div>
                  {filteredItems.length === 0 && <div className="py-16 text-center text-[#6a6d70] text-[14px] border border-dashed border-[#d9d9d9] rounded-xl">No items available. Adjust filters and click Go.</div>}
                  {filteredItems.map(item => (
                    <DesktopItemCard key={item.itemNo} item={item} isSelected={selectedItemNos.includes(item.itemNo)} onToggle={() => toggleOne(item.itemNo)} onUpdate={(field, val) => updateItem(item.itemNo, field, val)} onSplitBatch={(it) => setSplitBatchItem(it)} packagingTypes={packagingTypes} pdirOptions={pdirOptions} originalQty={originalQties[item.itemNo] ?? parseFloat(item.avlAsnQty || 0)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ─── ATTACHMENTS TAB ─── */
          <div className="anim-fade px-4 md:px-8 py-6">
            <div className="flex items-center gap-2 mb-4 border-b border-[#e5e5e5]">
              <button onClick={() => setAttachmentsSubTab('general')} className={`relative flex items-center gap-1 px-5 h-11 text-[14px] font-semibold rounded-t-lg transition-all -mb-px border-b-2 ${attachmentsSubTab === 'general' ? 'text-[#0a6ed1] bg-[#ebf5ff] border-[#0a6ed1]' : 'text-[#6a6d70] bg-transparent border-transparent hover:text-[#0a6ed1]'}`}>
                General Attachments
                {generalAttachments.length === 0 && <span className="text-[#cc1c14] text-[16px] font-bold leading-none -mt-1">*</span>}
                {generalAttachments.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-[#0a6ed1] text-white rounded-full text-[10px] font-bold">{generalAttachments.length}</span>}
              </button>
              <button onClick={() => setAttachmentsSubTab('pdir')} className={`relative px-5 h-11 text-[14px] font-semibold rounded-t-lg transition-all -mb-px border-b-2 ${attachmentsSubTab === 'pdir' ? 'text-[#0a6ed1] bg-[#ebf5ff] border-[#0a6ed1]' : 'text-[#6a6d70] bg-transparent border-transparent hover:text-[#0a6ed1]'}`}>
                PDIR Attachment
                {pdirAttachments.length > 0 && <span className="ml-2 px-1.5 py-0.5 bg-[#107e3e] text-white rounded-full text-[10px] font-bold">{pdirAttachments.length}</span>}
              </button>
            </div>
            {attachmentsSubTab === 'general' ? (
              <AttachmentsPanel kind="general" items={generalAttachments}
                onUpload={(att, errMsg) => { if (errMsg) { setModal({ kind: 'error', title: 'Upload rejected', message: errMsg, primaryLabel: 'OK', onPrimary: () => setModal(null) }); return } setGeneralAttachments(prev => [...prev, att]) }}
                onRemove={(id) => setGeneralAttachments(prev => prev.filter(a => a.id !== id))} />
            ) : (
              <AttachmentsPanel kind="pdir" items={pdirAttachments}
                onUpload={(att, errMsg) => { if (errMsg) { setModal({ kind: 'error', title: 'Upload rejected', message: errMsg, primaryLabel: 'OK', onPrimary: () => setModal(null) }); return } setPdirAttachments(prev => [...prev, att]) }}
                onRemove={(id) => setPdirAttachments(prev => prev.filter(a => a.id !== id))} />
            )}
          </div>
        )}
      </div>

      <SplitBatchModal open={!!splitBatchItem} item={splitBatchItem} onClose={() => setSplitBatchItem(null)} onSave={handleSplitBatchSave} />
      <ConfirmationModal open={!!modal} kind={modal?.kind} title={modal?.title} message={modal?.message} details={modal?.details} primaryLabel={modal?.primaryLabel} secondaryLabel={modal?.secondaryLabel} onPrimary={modal?.onPrimary} onSecondary={modal?.onSecondary} />
    </PageLayout>
  )
}