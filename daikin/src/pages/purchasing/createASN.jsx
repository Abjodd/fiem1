import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import PageLayout from '../../layouts/PageLayout.jsx'
import { createAsnService, authConfig } from '../../services/CreateAsn.js'
import { postCreateAsn } from '../../services/CreateAsnPost.js'
import { useUser } from '../../context/UserContext.jsx'
// ═══════════════════════════════════════════════════════════════
// CONSTANTS
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

// Mock upload — replace with real endpoint when available
async function uploadAttachment(asnDraftId, file, kind = 'general') {
  await new Promise(r => setTimeout(r, 100))
  return {
    id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    name: file.name,
    size: file.size,
    kind,
  }
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
// SHARED FIELD HELPERS — MODULE SCOPE (fixes focus/cursor loss bug)
// ═══════════════════════════════════════════════════════════════
function Field({ label, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1 min-w-0 ${className}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af] whitespace-nowrap">
        {label}
      </span>
      {children}
    </div>
  )
}

function ReadonlyVal({ value, accent }) {
  return (
    <span className={`text-[13px] font-semibold truncate ${accent ? 'text-[#0a6ed1]' : 'text-[#32363a]'}`}>
      {value}
    </span>
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
    setRows(
      item.batches && item.batches.length > 0
        ? item.batches.map(b => ({ ...b }))
        : []
    )
    setError(null)
  }, [open, item])

  if (!open || !item) return null

  const target = parseFloat(item.avlAsnQty || 0)
  const total = rows.reduce((s, r) => s + parseFloat(r.quantity || 0), 0)
  const remaining = target - total
  const isMatch = Math.abs(remaining) < 0.0001 && rows.length > 0
  const isOver = total > target

  const addRow = () => {
    setRows([...rows, { id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, batchCode: '', quantity: '' }])
    setError(null)
  }

  const removeRow = (id) => {
    setRows(rows.filter(r => r.id !== id))
    setError(null)
  }

  const updateRow = (id, field, value) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r))
    setError(null)
  }

  const handleSave = () => {
    if (rows.length === 0) {
      onSave(item.itemNo, [])
      onClose()
      return
    }
    const missing = rows.find(r => !r.batchCode || !r.quantity || parseFloat(r.quantity) <= 0)
    if (missing) {
      setError('Every batch row needs a Batch/Heat Code and a positive Quantity.')
      return
    }
    if (!isMatch) {
      setError(
        isOver
          ? `Sum of batch quantities (${total}) exceeds Avl. ASN Qty (${target}) by ${(total - target).toFixed(2)} ${item.totalUnit}.`
          : `Sum of batch quantities (${total}) is less than Avl. ASN Qty (${target}). Short by ${remaining.toFixed(2)} ${item.totalUnit}.`
      )
      return
    }
    onSave(item.itemNo, rows.map(r => ({ ...r, quantity: parseFloat(r.quantity) })))
    onClose()
  }

  const meterPct = target > 0 ? Math.min(100, (total / target) * 100) : 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-3 anim-fade"
      style={{ background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[640px] max-h-[90vh] flex flex-col overflow-hidden anim-pop"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 sm:px-6 py-4 border-b border-[#e5e5e5] bg-gradient-to-b from-[#fafbfc] to-white flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">Split Batch</div>
            <div className="text-[16px] font-bold text-[#32363a] truncate">
              <span className="text-[#0a6ed1]">{item.materialNumber}</span>
              <span className="text-[#6a6d70] font-medium mx-2">·</span>
              <span>{item.materialName}</span>
            </div>
            <div className="text-[12px] text-[#6a6d70] mt-0.5">
              Item {item.itemNo} &middot; Avl. ASN Qty: <strong className="text-[#32363a]">{target} {item.totalUnit}</strong>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6a6d70] hover:text-[#cc1c14] hover:bg-[#fce8e6] transition-all flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 sm:px-6 pt-4 pb-2 flex items-center gap-3">
          <div className="flex-1 h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${isOver ? 'bg-[#cc1c14]' : isMatch ? 'bg-[#107e3e]' : 'bg-[#0a6ed1]'}`}
              style={{ width: `${meterPct}%` }}
            />
          </div>
          <div className="text-[13px] tabular-nums whitespace-nowrap">
            <span className={`font-bold ${isOver ? 'text-[#cc1c14]' : isMatch ? 'text-[#107e3e]' : 'text-[#32363a]'}`}>
              {total.toFixed(2)}
            </span>
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
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" className="mx-auto mb-2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M8 12h8" />
                </svg>
                No data. Click <strong>+ Add Row</strong> below to create a batch.
              </div>
            ) : (
              rows.map((r, i) => (
                <div key={r.id} className="flex items-center px-3 py-2 border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc]">
                  <div className="w-8 flex-shrink-0">
                    <button
                      onClick={() => removeRow(r.id)}
                      className="w-6 h-6 flex items-center justify-center rounded-full text-[#cc1c14] hover:bg-[#fce8e6] transition-all"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex-1 px-2">
                    <input
                      type="text"
                      value={r.batchCode}
                      onChange={e => updateRow(r.id, 'batchCode', e.target.value)}
                      placeholder={`Batch ${i + 1}`}
                      className="w-full h-9 px-2.5 text-[13px] border border-[#d9d9d9] rounded bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all"
                    />
                  </div>
                  <div className="w-28 px-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={r.quantity}
                      onChange={e => updateRow(r.id, 'quantity', e.target.value)}
                      placeholder="0"
                      className="w-full h-9 px-2.5 text-[13px] text-right tabular-nums border border-[#d9d9d9] rounded bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all"
                    />
                  </div>
                  <div className="w-8 flex-shrink-0 text-[11px] text-[#94a3b8] text-center">{item.totalUnit}</div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between mt-3">
            <button
              onClick={addRow}
              className="flex items-center gap-1.5 px-3 h-9 text-[13px] font-semibold text-[#0a6ed1] bg-[#ebf5ff] border border-[#0a6ed1] rounded-lg hover:bg-[#d9ecff] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="px-5 sm:px-6 py-3 border-t border-[#e5e5e5] flex justify-end gap-2 bg-[#fafbfc]">
          <button onClick={onClose} className="h-10 px-5 text-[14px] font-semibold text-[#32363a] bg-white border border-[#d9d9d9] rounded-lg hover:bg-[#f5f6f7] hover:scale-[1.02] active:scale-[0.98] transition-all">Close</button>
          <button onClick={handleSave} className="flex items-center gap-2 h-10 px-5 text-[14px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
            </svg>
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
  }[kind] || { ring: '#0a6ed1', soft: '#ebf5ff', icon: null }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-3 anim-fade"
      style={{ background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(2px)' }}
      onClick={onSecondary || onPrimary}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[480px] overflow-hidden anim-pop" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: palette.soft, color: palette.ring }}>
            {palette.icon}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-[18px] font-bold text-[#32363a] tracking-tight">{title}</h3>
            {message && <p className="text-[13.5px] text-[#6a6d70] mt-1 leading-relaxed">{message}</p>}
          </div>
        </div>
        {details && (
          <div className="px-6 pb-2">
            <div className="bg-[#fafbfc] border border-[#e5e5e5] rounded-lg px-4 py-3 text-[13px] text-[#32363a] space-y-1.5">{details}</div>
          </div>
        )}
        <div className="px-6 py-4 border-t border-[#e5e5e5] flex justify-end gap-2 bg-[#fafbfc]">
          {secondaryLabel && (
            <button onClick={onSecondary} className="h-10 px-5 text-[14px] font-semibold text-[#32363a] bg-white border border-[#d9d9d9] rounded-lg hover:bg-[#f5f6f7] hover:scale-[1.02] active:scale-[0.98] transition-all">{secondaryLabel}</button>
          )}
          <button onClick={onPrimary} className="h-10 px-5 text-[14px] font-semibold text-white rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md" style={{ background: palette.ring }}>{primaryLabel || 'OK'}</button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MOBILE ITEM CARD
// ═══════════════════════════════════════════════════════════════
function MobileItemCard({ item, isSelected, onToggle, onUpdate, onSplitBatch, pdirRefs }) {
  const [expanded, setExpanded] = useState(false)
  const batchCount = item.batches?.length || 0
  const batchSum = (item.batches || []).reduce((s, b) => s + parseFloat(b.quantity || 0), 0)
  const target = parseFloat(item.avlAsnQty || 0)
  const batchBalanced = batchCount > 0 && Math.abs(batchSum - target) < 0.0001

  return (
    <div className={`rounded-xl border mb-3 overflow-hidden transition-colors ${isSelected ? 'bg-[#ebf5ff] border-[#0a6ed1]' : 'bg-white border-[#e5e5e5]'}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <input type="checkbox" checked={isSelected} onChange={onToggle} className="accent-[#0a6ed1] w-4 h-4 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[#0a6ed1] font-semibold text-[13px]">{item.materialNumber}</div>
          <div className="text-[#6a6d70] text-[12px] truncate">{item.materialName}</div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="px-2 py-0.5 bg-[#ebf5ff] text-[#0a6ed1] rounded-full text-[11px] font-bold">Item {item.itemNo}</span>
          <span className="px-2 py-0.5 bg-[#f0f4f8] text-[#32363a] rounded text-[11px] font-semibold">{item.storageLocation}</span>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-[#6a6d70] flex-shrink-0 p-1" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      <div className="flex border-t border-[#f0f0f0] text-center">
        {[
          { label: 'Avl. ASN', value: `${item.avlAsnQty} ${item.totalUnit}` },
          { label: 'Net Price', value: `₹${item.netPrice}` },
          { label: 'Shipment', value: item.shipmentDate },
        ].map((s, i) => (
          <div key={i} className={`flex-1 py-2 ${i < 2 ? 'border-r border-[#f0f0f0]' : ''}`}>
            <div className="text-[10px] text-[#9ca3af] font-semibold uppercase tracking-wide">{s.label}</div>
            <div className="text-[12px] text-[#32363a] font-bold mt-0.5">{s.value}</div>
          </div>
        ))}
      </div>

      {expanded && (
        <div className="border-t border-[#f0f0f0] bg-[#fafbfc] px-4 py-4">
          <button
            onClick={() => onSplitBatch(item)}
            className="w-full flex items-center justify-between gap-2 mb-4 px-3 h-10 text-[13px] font-semibold text-[#0a6ed1] bg-[#ebf5ff] border border-[#0a6ed1] rounded-lg hover:bg-[#d9ecff] hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3v12M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9c0 6-12 0-12 12" />
              </svg>
              Split Batch
            </span>
            {batchCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${batchBalanced ? 'bg-[#e8f5ec] text-[#107e3e]' : 'bg-[#fef7e6] text-[#b45309]'}`}>
                {batchCount} {batchCount === 1 ? 'batch' : 'batches'}{!batchBalanced ? ' · unbalanced' : ''}
              </span>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { label: 'Sch. Line', value: item.schLine },
              { label: 'Total Qty', value: `${item.totalQty} ${item.totalUnit}` },
              { label: 'Conf. Qty', value: `${item.confQty} ${item.confUnit}` },
              { label: 'Delivered', value: `${item.deliveredQty} ${item.deliveredUnit}` },
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
            <label className="block text-[12px] font-semibold text-[#374151] mb-1">Avl. ASN Qty</label>
            <input type="text" value={item.avlAsnQty} onChange={e => onUpdate('avlAsnQty', e.target.value)} className="w-full h-10 rounded-lg border border-[#d9d9d9] bg-white px-3 text-[14px] outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
          </div>
          <div className="mb-3">
            <label className="block text-[12px] font-semibold text-[#374151] mb-1">FG Stock</label>
            <input
              type="number"
              min="0"
              step="any"
              value={item.fgStock}
              onChange={e => onUpdate('fgStock', e.target.value)}
              placeholder="0"
              className={`w-full h-10 rounded-lg border bg-white px-3 text-[14px] outline-none focus:ring-2 transition-all ${
                item.fgStock !== '' && parseFloat(item.fgStock) <= parseFloat(item.avlAsnQty || 0)
                  ? 'border-[#cc1c14] focus:border-[#cc1c14] focus:ring-[#cc1c14]/20'
                  : 'border-[#d9d9d9] focus:border-[#0a6ed1] focus:ring-[#0a6ed1]/20'
              }`}
            />
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

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1">Type of Packaging</label>
              <select value={item.packagingType} onChange={e => onUpdate('packagingType', e.target.value)} className="w-full h-10 rounded-lg border border-[#d9d9d9] bg-white px-2 text-[13px] outline-none focus:border-[#0a6ed1]">
                <option value="">Select</option>
                <option value="Box">Box</option>
                <option value="Bag">Bag</option>
                <option value="Drum">Drum</option>
                <option value="Pallet">Pallet</option>
                <option value="Container">Container</option>
                <option value="Crate">Crate</option>
                <option value="Bundle">Bundle</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1">Total Qty / Packaging</label>
              <input type="text" value={item.qtyPerPackaging} onChange={e => onUpdate('qtyPerPackaging', e.target.value)} placeholder="0" className="w-full h-10 rounded-lg border border-[#d9d9d9] bg-white px-3 text-[14px] outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 text-center transition-all" />
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-[12px] font-semibold text-[#374151] mb-1">PDIR No.</label>
            <select value={item.pdirNo} onChange={e => onUpdate('pdirNo', e.target.value)} className="w-full h-10 rounded-lg border border-[#d9d9d9] bg-white px-2 text-[13px] outline-none focus:border-[#0a6ed1]">
              <option value="">Select</option>
              {pdirRefs.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2.5 border border-[#e5e5e5]">
            <span className="text-[13px] font-semibold text-[#374151]">Tax Mismatch</span>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-[#6a6d70]">{item.taxMismatch ? 'YES' : 'NO'}</span>
              <button onClick={() => onUpdate('taxMismatch', !item.taxMismatch)} className={`relative w-11 h-6 rounded-full transition-colors ${item.taxMismatch ? 'bg-[#107e3e]' : 'bg-[#d9d9d9]'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${item.taxMismatch ? 'translate-x-5' : 'translate-x-0.5'}`}></span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// DESKTOP ITEM CARD
// ═══════════════════════════════════════════════════════════════
function DesktopItemCard({ item, isSelected, onToggle, onUpdate, onSplitBatch, pdirRefs }) {
  const bc = item.batches?.length || 0
  const bsum = (item.batches || []).reduce((s, b) => s + parseFloat(b.quantity || 0), 0)
  const balanced = bc > 0 && Math.abs(bsum - parseFloat(item.avlAsnQty || 0)) < 0.0001

  const inputCls = "h-8 px-2 text-[12px] border border-[#d9d9d9] rounded bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-1 focus:ring-[#0a6ed1]/20 transition-all w-full"
  const selectCls = "h-8 px-1.5 text-[12px] border border-[#d9d9d9] rounded bg-white focus:outline-none focus:border-[#0a6ed1] transition-all w-full"

  return (
    <div className={`rounded-xl border transition-all mb-3 overflow-hidden ${isSelected ? 'border-[#0a6ed1] bg-[#f5f9ff]' : 'border-[#e5e5e5] bg-white hover:border-[#c5d8f0]'}`}>

      {/* CARD HEADER */}
      <div className={`flex items-center gap-3 px-4 py-3 border-b ${isSelected ? 'border-[#cce0f5] bg-[#ebf5ff]' : 'border-[#f0f0f0] bg-[#fafbfc]'}`}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="accent-[#0a6ed1] w-4 h-4 flex-shrink-0 cursor-pointer"
        />
        <span className="flex-shrink-0 px-2.5 py-1 bg-[#0a6ed1] text-white rounded-md text-[11px] font-bold tracking-wide">
          Item {item.itemNo}
        </span>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-[13px] font-bold text-[#0a6ed1] flex-shrink-0">{item.materialNumber}</span>
          <span className="text-[#6a6d70] text-[12px] truncate">{item.materialName}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="px-2 py-0.5 bg-[#f0f4f8] text-[#32363a] rounded text-[11px] font-semibold">{item.storageLocation}</span>
          <span className="text-[11px] text-[#6a6d70]">Sch. <strong className="text-[#0a6ed1]">{item.schLine}</strong></span>
          <span className="text-[11px] text-[#6a6d70]">Ship: <strong className="text-[#32363a]">{item.shipmentDate}</strong></span>
          <span className="text-[11px] text-[#6a6d70]">SPQ: <strong className="text-[#32363a]">{item.spq}</strong></span>
        </div>
      </div>

      {/* FIELD GRID */}
      <div className="px-4 py-3 space-y-3">

        {/* ROW 1 */}
        <div className="grid grid-cols-8 gap-3">
          <Field label="Total Qty">
            <ReadonlyVal value={`${item.totalQty} ${item.totalUnit}`} accent />
          </Field>
          <Field label="Conf. Qty">
            <ReadonlyVal value={`${item.confQty} ${item.confUnit}`} />
          </Field>
          <Field label="Delivered Qty">
            <ReadonlyVal value={`${item.deliveredQty} ${item.deliveredUnit}`} />
          </Field>
          <Field label="ASN Created">
            <ReadonlyVal value={item.asnCreated} />
          </Field>
          <Field label="Avl. ASN Qty">
            <input
              type="text"
              value={item.avlAsnQty}
              onChange={e => onUpdate('avlAsnQty', e.target.value)}
              className={inputCls + ' font-semibold text-[#0a6ed1]'}
            />
          </Field>
          <Field label="FG Stock">
            <input
              type="number"
              min="0"
              step="any"
              value={item.fgStock}
              onChange={e => onUpdate('fgStock', e.target.value)}
              placeholder="0"
              className={
                inputCls +
                (item.fgStock !== '' && parseFloat(item.fgStock) <= parseFloat(item.avlAsnQty || 0)
                  ? ' border-[#cc1c14] ring-1 ring-[#cc1c14]/30'
                  : '')
              }
            />
            {item.fgStock !== '' && parseFloat(item.fgStock) <= parseFloat(item.avlAsnQty || 0) && (
              <span className="text-[10px] text-[#cc1c14] font-semibold leading-tight">
                Must be &gt; {item.avlAsnQty}
              </span>
            )}
          </Field>
          <Field label="Net Price">
            <ReadonlyVal value={item.netPrice} />
          </Field>
          <Field label="Supplier Net Price">
            <input
              type="text"
              value={item.supplierNetPrice}
              onChange={e => onUpdate('supplierNetPrice', e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        {/* ROW 2 */}
        <div className="grid grid-cols-7 gap-3">
          <Field label="Material Expiry">
            <input
              type="date"
              value={item.materialExpiry}
              onChange={e => onUpdate('materialExpiry', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Tax Mismatch">
            <div className="flex items-center gap-2 h-8">
              <button
                onClick={() => onUpdate('taxMismatch', !item.taxMismatch)}
                className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${item.taxMismatch ? 'bg-[#107e3e]' : 'bg-[#d9d9d9]'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${item.taxMismatch ? 'translate-x-5' : 'translate-x-0.5'}`}></span>
              </button>
              <span className={`text-[11px] font-bold ${item.taxMismatch ? 'text-[#107e3e]' : 'text-[#9ca3af]'}`}>{item.taxMismatch ? 'YES' : 'NO'}</span>
            </div>
          </Field>
          <Field label="Packing Material Type">
            <select value={item.packingMaterialType} onChange={e => onUpdate('packingMaterialType', e.target.value)} className={selectCls}>
              <option value="">Select</option>
              <option value="Trolley">Trolley</option>
              <option value="Pallet">Pallet</option>
              <option value="Carton">Carton</option>
              <option value="Crate">Crate</option>
            </select>
          </Field>
          <Field label="Packing Material Qty">
            <input
              type="text"
              value={item.packingMaterialQty}
              onChange={e => onUpdate('packingMaterialQty', e.target.value)}
              className={inputCls + ' text-center'}
            />
          </Field>
          <Field label="Type of Packaging">
            <select value={item.packagingType} onChange={e => onUpdate('packagingType', e.target.value)} className={selectCls}>
              <option value="">Select</option>
              <option value="Box">Box</option>
              <option value="Bag">Bag</option>
              <option value="Drum">Drum</option>
              <option value="Pallet">Pallet</option>
              <option value="Container">Container</option>
              <option value="Crate">Crate</option>
              <option value="Bundle">Bundle</option>
            </select>
          </Field>
          <Field label="Total Qty / Packaging">
            <input
              type="text"
              value={item.qtyPerPackaging}
              onChange={e => onUpdate('qtyPerPackaging', e.target.value)}
              placeholder="0"
              className={inputCls + ' text-center'}
            />
          </Field>
          <Field label="PDIR No.">
            <select value={item.pdirNo} onChange={e => onUpdate('pdirNo', e.target.value)} className={selectCls}>
              <option value="">Select</option>
              {pdirRefs.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* ROW 3 — Split Batch */}
        <div className="flex items-center gap-3 pt-1 border-t border-[#f0f0f0]">
          <button
            onClick={() => onSplitBatch(item)}
            className={`flex items-center gap-2 px-4 h-8 text-[12px] font-semibold rounded-lg border transition-all hover:scale-[1.02] active:scale-[0.98] ${
              bc > 0
                ? balanced
                  ? 'text-[#107e3e] bg-[#e8f5ec] border-[#107e3e]'
                  : 'text-[#b45309] bg-[#fef7e6] border-[#b45309]'
                : 'text-white bg-[#0a6ed1] border-[#0a6ed1] hover:bg-[#085caf]'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="6" r="3" />
              <circle cx="18" cy="18" r="3" />
              <path d="M6 15V6M6 6h12M18 9v6" />
            </svg>
            Split Batch{bc > 0 ? ` (${bc})` : ' +'}
          </button>

          {bc > 0 && (
            <span className={`text-[12px] font-semibold ${balanced ? 'text-[#107e3e]' : 'text-[#b45309]'}`}>
              {balanced
                ? `✓ ${bc} batch${bc > 1 ? 'es' : ''} — balanced`
                : `⚠ ${bc} batch${bc > 1 ? 'es' : ''} — quantities unbalanced`}
            </span>
          )}
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

  const handleSelect = async (e) => {
    const files = Array.from(e.target.files)
    for (const file of files) {
      if (!isAllowedFile(file)) {
        onUpload(null, `"${file.name}" is not allowed. Only PDF / Excel (.pdf, .xls, .xlsx).`)
        continue
      }
      try {
        const att = await uploadAttachment('draft', file, kind)
        onUpload(att)
      } catch (err) { console.error(err) }
    }
    e.target.value = ''
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    for (const file of files) {
      if (!isAllowedFile(file)) {
        onUpload(null, `"${file.name}" is not allowed. Only PDF / Excel (.pdf, .xls, .xlsx).`)
        continue
      }
      const att = await uploadAttachment('draft', file, kind)
      onUpload(att)
    }
  }

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5]">
        <div>
          <h3 className="text-[18px] font-bold text-[#32363a]">
            {kind === 'pdir' ? 'PDIR Attachments' : 'General Attachments'} ({items.length})
          </h3>
        </div>
        <button onClick={() => inputRef.current?.click()} className="flex items-center gap-1.5 px-4 h-9 text-[14px] font-semibold text-[#0a6ed1] bg-[#ebf5ff] border border-[#0a6ed1] rounded-lg hover:bg-[#d9ecff] hover:scale-[1.02] active:scale-[0.98] transition-all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          Add
        </button>
        <input ref={inputRef} type="file" multiple accept=".pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleSelect} className="hidden" />
      </div>

      {items.length === 0 ? (
        <div onDragOver={e => e.preventDefault()} onDrop={handleDrop} className="py-20 flex flex-col items-center text-center">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" className="mb-4">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
          <h4 className="text-[18px] font-semibold text-[#32363a] mb-1">No files found.</h4>
          <p className="text-[13px] text-[#6a6d70]">Drop files or use the "+" button for pending upload</p>
        </div>
      ) : (
        <div className="divide-y divide-[#f0f0f0]">
          {items.map(att => (
            <div key={att.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#fafbfc]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#ebf5ff] flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a6ed1" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-[#32363a]">{att.name}</div>
                  <div className="text-[12px] text-[#6a6d70]">{(att.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
              <button onClick={() => onRemove(att.id)} className="w-8 h-8 flex items-center justify-center text-[#cc1c14] hover:bg-[#fce8e6] rounded transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
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
export default function CreateASN({ agreement: propAgreement }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginId, loginType, loading: userLoading } = useUser()
  authConfig.loginId   = loginId
  authConfig.loginType = loginType

  // agreement + pdirRefs come from PurchaseOrder.jsx navigate state
  const agreementFromState = location.state?.agreement || propAgreement
  const poNo = agreementFromState?.poNo || agreementFromState?.id || ''

  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState('info')
  const [attachmentsSubTab, setAttachmentsSubTab] = useState('general')

  // Invoice fields
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [totalPacking, setTotalPacking] = useState('')

  // Filter fields (local — filter already-loaded items)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [materialSearch, setMaterialSearch] = useState('')
  const [storageSearch, setStorageSearch] = useState('')

  // Data state
  const [header, setHeader] = useState(agreementFromState || null)
  const [items, setItems] = useState([])
  const [pdirRefs, setPdirRefs] = useState(location.state?.pdirRefs || [])
  const [selectedItemNos, setSelectedItemNos] = useState([])

  // Loading state
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)

  // Attachments
  const [generalAttachments, setGeneralAttachments] = useState([])
  const [pdirAttachments, setPdirAttachments] = useState([])

  // Modals
  const [splitBatchItem, setSplitBatchItem] = useState(null)
  const [modal, setModal] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // ── Fetch items + PDIR on mount ──
  useEffect(() => {
    if (userLoading) return
    if (!loginId || !loginType) return
    if (!poNo) return
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    createAsnService.getCreateAsnPageData(poNo)
      .then(({ header: fetchedHeader, items: fetchedItems, pdirRefs: fetchedPdir }) => {
        if (cancelled) return
        setHeader(fetchedHeader)
        setItems(fetchedItems)
        // Only override pdirRefs if not already passed via navigate state
        if (!location.state?.pdirRefs || location.state.pdirRefs.length === 0) {
          setPdirRefs(fetchedPdir)
        }
      })
      .catch(err => { if (!cancelled) setLoadError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [userLoading, loginId, loginType, poNo])

  // ── Local filter (client-side on loaded items) ──
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const storageTerms = storageSearch.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
      const matchStorage = storageTerms.length === 0 ||
        storageTerms.some(t => (item.storageLocation || '').toLowerCase().includes(t))

      const matchMaterial = !materialSearch.trim() ||
        item.materialNumber.toLowerCase().includes(materialSearch.toLowerCase()) ||
        item.materialName.toLowerCase().includes(materialSearch.toLowerCase())

      const matchFrom = !fromDate || item.shipmentDateIso >= fromDate
      const matchTo = !toDate || item.shipmentDateIso <= toDate

      return matchStorage && matchMaterial && matchFrom && matchTo
    })
  }, [items, storageSearch, materialSearch, fromDate, toDate])

  const allSelected = filteredItems.length > 0 && filteredItems.every(i => selectedItemNos.includes(i.itemNo))
  const someSelected = selectedItemNos.length > 0 && !allSelected

  const toggleAll = () => {
    if (allSelected) setSelectedItemNos([])
    else setSelectedItemNos(filteredItems.map(i => i.itemNo))
  }
  const toggleOne = (itemNo) => {
    if (selectedItemNos.includes(itemNo)) setSelectedItemNos(selectedItemNos.filter(n => n !== itemNo))
    else setSelectedItemNos([...selectedItemNos, itemNo])
  }
  const updateItem = (itemNo, field, value) => {
    setItems(items.map(i => i.itemNo === itemNo ? { ...i, [field]: value } : i))
  }

  const handleSplitBatchSave = (itemNo, batches) => {
    setItems(items.map(i => i.itemNo === itemNo ? { ...i, batches } : i))
  }

  const handleGo = () => {
    // filters applied reactively via filteredItems useMemo — nothing extra needed
    // optionally re-fetch from API here if server-side filtering is preferred
  }

  const handleClear = () => {
    setFromDate(''); setToDate(''); setMaterialSearch(''); setStorageSearch('')
  }

  const validateBeforeCreate = () => {
    const errors = []
    if (selectedItemNos.length === 0) errors.push('Select at least one item to create ASN.')
    if (!invoiceNumber) errors.push('Invoice Number is required.')
    if (!invoiceAmount) errors.push('Invoice Amount is required.')
    if (generalAttachments.length === 0) errors.push('At least one General Attachment is required.')

    const selectedItems = items.filter(i => selectedItemNos.includes(i.itemNo))
    selectedItems.forEach(it => {
      if (it.batches && it.batches.length > 0) {
        const sum = it.batches.reduce((s, b) => s + parseFloat(b.quantity || 0), 0)
        const target = parseFloat(it.avlAsnQty || 0)
        if (Math.abs(sum - target) > 0.0001) {
          errors.push(`Item ${it.itemNo} (${it.materialNumber}): batch quantity sum (${sum}) does not match Avl. ASN Qty (${target}).`)
        }
        const bad = it.batches.find(b => !b.batchCode || !b.quantity)
        if (bad) errors.push(`Item ${it.itemNo}: incomplete batch row(s). Each row needs Batch/Heat Code and Quantity.`)
      }

      const fgVal = parseFloat(it.fgStock)
      const asnVal = parseFloat(it.avlAsnQty || 0)
      if (it.fgStock === '' || isNaN(fgVal)) {
        errors.push(`Item ${it.itemNo} (${it.materialNumber}): FG Stock is required.`)
      } else if (fgVal <= asnVal) {
        errors.push(`Item ${it.itemNo} (${it.materialNumber}): FG Stock (${fgVal}) must be greater than Avl. ASN Qty (${asnVal}).`)
      }
    })
    return errors
  }

  const handleCreate = () => {
    const errors = validateBeforeCreate()
    if (errors.length > 0) {
      setModal({
        kind: 'error',
        title: 'Cannot create ASN',
        message: 'Please resolve the following issues and try again:',
        details: (<ul className="list-disc pl-5 space-y-1">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>),
        primaryLabel: 'OK',
        onPrimary: () => setModal(null),
      })
      return
    }

    const selectedItems = items.filter(i => selectedItemNos.includes(i.itemNo))
    setModal({
      kind: 'confirm',
      title: 'Create ASN?',
      message: 'Please review the details below before submitting.',
      details: (
        <div className="space-y-1.5">
          <div className="flex justify-between"><span className="text-[#6a6d70]">PO Number</span><strong>{poNo}</strong></div>
          <div className="flex justify-between"><span className="text-[#6a6d70]">Invoice Number</span><strong>{invoiceNumber}</strong></div>
          <div className="flex justify-between"><span className="text-[#6a6d70]">Invoice Amount</span><strong>₹ {invoiceAmount}</strong></div>
          <div className="flex justify-between"><span className="text-[#6a6d70]">Items selected</span><strong>{selectedItems.length}</strong></div>
          <div className="flex justify-between"><span className="text-[#6a6d70]">PDIR attachments</span><strong>{pdirAttachments.length}</strong></div>
          <div className="flex justify-between"><span className="text-[#6a6d70]">General attachments</span><strong>{generalAttachments.length}</strong></div>
        </div>
      ),
      primaryLabel: 'Yes, Create',
      secondaryLabel: 'Cancel',
      onPrimary: doCreate,
      onSecondary: () => setModal(null),
    })
  }

  const doCreate = async () => {
    setSubmitting(true)
    setModal(null)
    try {
      const selectedItems = items.filter(i => selectedItemNos.includes(i.itemNo))
      const result = await postCreateAsn({
        poNo,
        invoice:       { number: invoiceNumber, date: invoiceDate, amount: invoiceAmount, totalPacking },
        selectedItems,
        header:        header || {},
      })
      setModal({
        kind: 'success',
        title: 'ASN created successfully',
        message: 'Your ASN has been submitted and is now available in the system.',
        details: (
          <div className="space-y-1.5">
            <div className="flex justify-between"><span className="text-[#6a6d70]">ASN Number</span><strong className="text-[#0a6ed1]">{result.AsnNum}</strong></div>
            <div className="flex justify-between"><span className="text-[#6a6d70]">PO Number</span><strong>{result.Po_No}</strong></div>
            <div className="flex justify-between"><span className="text-[#6a6d70]">Invoice No.</span><strong>{result.InvoiceNum}</strong></div>
            <div className="flex justify-between"><span className="text-[#6a6d70]">Items</span><strong>{selectedItems.length}</strong></div>
          </div>
        ),
        primaryLabel: 'Done',
        onPrimary: () => { setModal(null); navigate(-1) },
      })
    } catch (err) {
      setModal({
        kind: 'error',
        title: 'Failed to create ASN',
        message: err.message || 'Something went wrong while submitting. Please try again.',
        primaryLabel: 'OK',
        onPrimary: () => setModal(null),
      })
    } finally {
      setSubmitting(false)
    }
  }

  const calcInvoiceValue = () => {
    return items
      .filter(i => selectedItemNos.includes(i.itemNo))
      .reduce((sum, i) => sum + (parseFloat(i.avlAsnQty || 0) * parseFloat(i.supplierNetPrice || 0)), 0)
      .toFixed(2)
  }

  const totalAttachments = generalAttachments.length + pdirAttachments.length

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
          <button
            onClick={handleCreate}
            disabled={submitting || loading}
            className="flex items-center gap-2 px-5 h-10 text-[14px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Creating…</>
            ) : (
              <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>Create</>
            )}
          </button>
        </div>

        {/* ─── AGREEMENT INFO ─── */}
        <div className="bg-white border-b border-[#e5e5e5] px-8 py-5 anim-slide-up">
          <div className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">Purchase Order</div>
          <h2 className="text-[24px] font-bold text-[#0a6ed1] tracking-tight">{poNo}</h2>
          {header && (
            <div className="text-[14px] text-[#6a6d70] mt-1">
              Plant: {header.plantDesc} ({header.plant})
              {header.buyerName && <span className="ml-4">Buyer: {header.buyerName}</span>}
            </div>
          )}
        </div>

        {/* ─── LOADING / ERROR ─── */}
        {loading && (
          <div className="flex items-center justify-center py-16 bg-white border-b border-[#e5e5e5]">
            <div className="w-8 h-8 border-2 border-[#0a6ed1] border-t-transparent rounded-full animate-spin mr-3" />
            <span className="text-[14px] text-[#6a6d70]">Loading items…</span>
          </div>
        )}
        {loadError && !loading && (
          <div className="flex items-center justify-center gap-3 py-10 bg-white border-b border-[#e5e5e5]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cc1c14" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
            <span className="text-[14px] text-[#cc1c14]">{loadError}</span>
          </div>
        )}

        {/* ─── TABS ─── */}
        {!loading && !loadError && (
          <>
            <div className="bg-white px-8 pt-5 border-b border-[#e5e5e5]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('attachments')}
                  className={`relative flex flex-col items-center pb-3 border-b-2 transition-colors ${activeTab === 'attachments' ? 'border-[#0a6ed1]' : 'border-transparent'}`}
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-1.5 transition-all ${activeTab === 'attachments' ? 'bg-[#0a6ed1] shadow-md' : 'bg-white border-2 border-[#0a6ed1]'}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'attachments' ? 'white' : '#0a6ed1'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.49" />
                    </svg>
                  </div>
                  {/* red asterisk — disappears once any attachment is uploaded */}
                  {totalAttachments === 0 && (
                    <span className="absolute -top-1 right-0 text-[#cc1c14] text-[14px] font-bold leading-none">*</span>
                  )}
                  {totalAttachments > 0 && (
                    <span className="absolute -top-1 right-1 min-w-[18px] h-[18px] bg-[#0a6ed1] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {totalAttachments}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('attachments')}
                  className={`relative flex flex-col items-center pb-3 border-b-2 transition-colors ${activeTab === 'attachments' ? 'border-[#0a6ed1]' : 'border-transparent'}`}
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-1.5 transition-all ${activeTab === 'attachments' ? 'bg-[#0a6ed1] shadow-md' : 'bg-white border-2 border-[#0a6ed1]'}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'attachments' ? 'white' : '#0a6ed1'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.49" />
                    </svg>
                  </div>
                  {totalAttachments > 0 && (
                    <span className="absolute -top-1 right-1 min-w-[18px] h-[18px] bg-[#0a6ed1] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {totalAttachments}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* ─── TAB CONTENT ─── */}
            {activeTab === 'info' ? (
              <div className="anim-fade">
                {/* Invoice + Selected Materials */}
                <div className="px-8 py-6 grid grid-cols-12 gap-6">
                  <div className="col-span-12 xl:col-span-4">
                    <div className="bg-white border border-[#e5e5e5] rounded-xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h3 className="text-[18px] font-bold text-[#32363a]">Invoice Details</h3>
                          <p className="text-[13px] text-[#6a6d70] mt-0.5">Enter invoice information</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-[#0a6ed1]/10 flex items-center justify-center">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a6ed1" strokeWidth="2">
                            <path d="M4 4h16v16H4z" /><path d="M8 9h8M8 13h5" />
                          </svg>
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
                          <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Invoice Amount <span className="text-[#cc1c14]">*</span></label>
                          <input type="text" value={invoiceAmount} onChange={e => setInvoiceAmount(e.target.value)} placeholder="₹ 0.00" className="w-full h-10 rounded-lg border border-[#d9d9d9] bg-white px-3 text-[14px] outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
                        </div>
                        <div>
                          <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Invoice Value (Vendor)</label>
                          <div className="h-10 rounded-lg border border-dashed border-[#cfd8e3] bg-[#f8fafc] flex items-center px-3 text-[#6a6d70] text-[13px] italic">
                            Auto-calculated: ₹ {calcInvoiceValue()}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Total Packing</label>
                          <input type="text" value={totalPacking} onChange={e => setTotalPacking(e.target.value)} placeholder="0" className="w-full h-10 rounded-lg border border-[#d9d9d9] bg-white px-3 text-[14px] outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-12 xl:col-span-8">
                    <div className="bg-white border border-[#e5e5e5] rounded-xl shadow-sm overflow-hidden h-full">
                      <div className="px-6 py-4 border-b border-[#e5e5e5] flex items-center justify-between">
                        <div>
                          <h3 className="text-[18px] font-bold text-[#32363a]">Selected Materials</h3>
                          <p className="text-[13px] text-[#6a6d70] mt-0.5">{selectedItemNos.length} of {items.length} items selected</p>
                        </div>
                        <span className="px-3 py-1 bg-[#ebf5ff] text-[#0a6ed1] rounded-full text-[12px] font-semibold">{selectedItemNos.length} selected</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[13px] min-w-[800px]">
                          <thead>
                            <tr className="bg-[#fafbfc] border-b border-[#e5e5e5] text-[#6a6d70]">
                              <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">Material</th>
                              <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">Description</th>
                              <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">Net Price</th>
                              <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">Qty</th>
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
                                  <td className="py-3 px-4 text-[#0a6ed1] font-semibold">{item.materialNumber}</td>
                                  <td className="py-3 px-4 text-[#32363a]">{item.materialName}</td>
                                  <td className="py-3 px-4 text-[#32363a]">{item.netPrice}</td>
                                  <td className="py-3 px-4 text-[#32363a]">{item.avlAsnQty} {item.totalUnit}</td>
                                  <td className="py-3 px-4 text-[#32363a]">{item.spq}</td>
                                  <td className="py-3 px-4">
                                    {bc === 0 ? (
                                      <span className="text-[12px] text-[#9ca3af]">—</span>
                                    ) : (
                                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${balanced ? 'bg-[#e8f5ec] text-[#107e3e]' : 'bg-[#fef7e6] text-[#b45309]'}`}>
                                        {bc} · {balanced ? 'balanced' : 'unbalanced'}
                                      </span>
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

                {/* Filter row */}
                <div className="px-4 md:px-8 py-5 bg-white border-t border-[#e5e5e5] grid grid-cols-2 md:grid-cols-12 gap-4 items-end">
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
                  <div className="col-span-2 md:col-span-3">
                    <label className="block text-[12px] text-[#6a6d70] mb-1.5 font-semibold">Enter Storage Location (comma-separated)</label>
                    <div className="relative">
                      <input type="text" value={storageSearch} onChange={e => setStorageSearch(e.target.value)} placeholder="e.g. RM01, RM02" className="w-full h-10 pl-3 pr-10 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-3 top-3 text-[#6a6d70]"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
                    </div>
                  </div>
                </div>

                {/* ─── ITEMS ─── */}
                <div className="px-4 md:px-8 pb-8 bg-white">
                  {isMobile ? (
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
                        <MobileItemCard
                          key={item.itemNo}
                          item={item}
                          isSelected={selectedItemNos.includes(item.itemNo)}
                          onToggle={() => toggleOne(item.itemNo)}
                          onUpdate={(field, val) => updateItem(item.itemNo, field, val)}
                          onSplitBatch={(it) => setSplitBatchItem(it)}
                          pdirRefs={pdirRefs}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              ref={el => { if (el) el.indeterminate = someSelected }}
                              onChange={toggleAll}
                              className="accent-[#0a6ed1] w-4 h-4"
                            />
                            <span className="text-[13px] font-semibold text-[#374151]">Select All</span>
                          </label>
                          <span className="text-[13px] text-[#6a6d70]">{filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}</span>
                        </div>
                        {selectedItemNos.length > 0 && (
                          <span className="px-3 py-1 bg-[#ebf5ff] text-[#0a6ed1] rounded-full text-[12px] font-semibold">
                            {selectedItemNos.length} selected
                          </span>
                        )}
                      </div>

                      {filteredItems.length === 0 && (
                        <div className="py-16 text-center text-[#6a6d70] text-[14px] border border-dashed border-[#d9d9d9] rounded-xl">
                          No items available. Adjust filters and click Go.
                        </div>
                      )}

                      {filteredItems.map(item => (
                        <DesktopItemCard
                          key={item.itemNo}
                          item={item}
                          isSelected={selectedItemNos.includes(item.itemNo)}
                          onToggle={() => toggleOne(item.itemNo)}
                          onUpdate={(field, val) => updateItem(item.itemNo, field, val)}
                          onSplitBatch={(it) => setSplitBatchItem(it)}
                          pdirRefs={pdirRefs}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ─── ATTACHMENTS TAB ─── */
              <div className="anim-fade px-4 md:px-8 py-6">
                <div className="flex items-center gap-2 mb-4 border-b border-[#e5e5e5]">
                  <button
                    onClick={() => setAttachmentsSubTab('general')}
                    className={`relative px-5 h-11 text-[14px] font-semibold rounded-t-lg transition-all -mb-px border-b-2 ${attachmentsSubTab === 'general' ? 'text-[#0a6ed1] bg-[#ebf5ff] border-[#0a6ed1]' : 'text-[#6a6d70] bg-transparent border-transparent hover:text-[#0a6ed1]'}`}
                  >
                    General Attachments
                    {generalAttachments.length > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 bg-[#0a6ed1] text-white rounded-full text-[10px] font-bold">{generalAttachments.length}</span>
                    )}
                  </button>
                  <button
                    onClick={() => setAttachmentsSubTab('pdir')}
                    className={`relative px-5 h-11 text-[14px] font-semibold rounded-t-lg transition-all -mb-px border-b-2 ${attachmentsSubTab === 'pdir' ? 'text-[#0a6ed1] bg-[#ebf5ff] border-[#0a6ed1]' : 'text-[#6a6d70] bg-transparent border-transparent hover:text-[#0a6ed1]'}`}
                  >
                    PDIR Attachment
                    {pdirAttachments.length > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 bg-[#107e3e] text-white rounded-full text-[10px] font-bold">{pdirAttachments.length}</span>
                    )}
                  </button>
                </div>

                {attachmentsSubTab === 'general' ? (
                  <AttachmentsPanel
                    kind="general"
                    items={generalAttachments}
                    onUpload={(att, errMsg) => {
                      if (errMsg) { setModal({ kind: 'error', title: 'Upload rejected', message: errMsg, primaryLabel: 'OK', onPrimary: () => setModal(null) }); return }
                      setGeneralAttachments(prev => [...prev, att])
                    }}
                    onRemove={(id) => setGeneralAttachments(prev => prev.filter(a => a.id !== id))}
                  />
                ) : (
                  <AttachmentsPanel
                    kind="pdir"
                    items={pdirAttachments}
                    onUpload={(att, errMsg) => {
                      if (errMsg) { setModal({ kind: 'error', title: 'Upload rejected', message: errMsg, primaryLabel: 'OK', onPrimary: () => setModal(null) }); return }
                      setPdirAttachments(prev => [...prev, att])
                    }}
                    onRemove={(id) => setPdirAttachments(prev => prev.filter(a => a.id !== id))}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>

      <SplitBatchModal
        open={!!splitBatchItem}
        item={splitBatchItem}
        onClose={() => setSplitBatchItem(null)}
        onSave={handleSplitBatchSave}
      />

      <ConfirmationModal
        open={!!modal}
        kind={modal?.kind}
        title={modal?.title}
        message={modal?.message}
        details={modal?.details}
        primaryLabel={modal?.primaryLabel}
        secondaryLabel={modal?.secondaryLabel}
        onPrimary={modal?.onPrimary}
        onSecondary={modal?.onSecondary}
      />
    </PageLayout>
  )
}