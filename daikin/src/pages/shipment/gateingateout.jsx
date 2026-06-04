import { useState, useEffect } from 'react'
import PageLayout from '../../layouts/PageLayout.jsx'
import { gateEntryApi } from '../../services/Gateingateout.js'

const TABS = [
  { key: 'timeline', label: 'Timeline', icon: (a) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a?'white':'#0a6ed1'} strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>, color: '#0a6ed1' },
  { key: 'asn', label: 'ASN', icon: (a) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a?'white':'#107e3e'} strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>, color: '#107e3e' },
  { key: 'summary', label: 'Summary', icon: (a) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a?'white':'#cc1c14'} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/></svg>, color: '#cc1c14' },
]

const TIMELINE_STEPS = [
  { key: 'created', label: 'Created', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6M9 15h6"/></svg> },
  { key: 'shipped', label: 'Shipped', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
  { key: 'gate_reporting', label: 'Gate Reporting', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> },
  { key: 'gate_entry_in', label: 'Gate Entry (IN)', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg> },
  { key: 'goods_received', label: 'Goods Received', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg> },
  { key: 'gate_entry_out', label: 'Gate Entry (Out)', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg> },
]

const canGateReport = (s) => { const l = (s||'').toLowerCase(); return l.includes('shipped') || l.includes('transit') }
const canGateIn = (s) => { const l = (s||'').toLowerCase(); return l.includes('gate reported') || l.includes('gate reporting') || l.includes('reached') }

// ═══════════════════════════════════════════════════════════════
// TRACKING POPUP — no hardcoded data
// ═══════════════════════════════════════════════════════════════
function TrackingPopup({ onSubmit }) {
  const [combined, setCombined] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    const parts = combined.trim().split('/')
    if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
      setError('Please enter in the format: TrackingNumber/Year (e.g. 000000000001/2024)')
      return
    }
    const trackNo = parts[0].trim()
    const year = parts[1].trim()
    setLoading(true); setError('')
    try {
      const data = await gateEntryApi.getTracking(trackNo, year)
      if (!data) { setError('Tracking not found.'); setLoading(false); return }
      let summaryItems = []
      try { summaryItems = await gateEntryApi.getAsnData(trackNo, year) } catch {}
      onSubmit({ ...data, summaryItems })
    } catch (err) { setError(err.message || 'Failed to fetch'); setLoading(false) }
  }

  const handleKeyDown = e => { if (e.key === 'Enter') handleSubmit() }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[440px] overflow-hidden" style={{ animation: 'modalIn .22s ease-out both' }}>
        <div className="bg-gradient-to-r from-[#0a6ed1] to-[#085caf] px-6 py-5">
          <h2 className="text-[18px] font-bold text-white">Gate In / Gate Out</h2>
          <p className="text-[13px] text-white/80 mt-1">Enter tracking number and year</p>
        </div>
        <div className="px-6 py-6">
          <label className="block text-[13px] font-semibold text-[#32363a] mb-2">
            Tracking Number / Year <span className="text-[#cc1c14]">*</span>
          </label>
          <input
            autoFocus
            type="text"
            value={combined}
            placeholder="e.g. 000000000001/2024"
            onChange={e => { setCombined(e.target.value); setError('') }}
            onKeyDown={handleKeyDown}
            className="w-full h-11 px-4 text-[15px] font-semibold border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all tracking-wider"
          />
          <p className="text-[11px] text-[#6a6d70] mt-1.5">Format: TrackingNumber/Year</p>
          {error && (
            <div className="flex items-center gap-1.5 text-[13px] text-[#cc1c14] bg-[#fce8e6] px-3 py-2 rounded-lg mt-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>{error}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-[#e5e5e5] flex justify-end">
          <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-6 h-10 text-[14px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] transition-all shadow-md disabled:opacity-60">
            {loading && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {loading ? 'Loading…' : 'Load Tracking'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ASN ITEMS POPUP (click ASN number)
// ═══════════════════════════════════════════════════════════════
function AsnItemsPopup({ asnNum, fisYear, onClose }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    gateEntryApi.getAsnItems(asnNum, fisYear).then(setItems).catch(() => setItems([])).finally(() => setLoading(false))
  }, [asnNum, fisYear])
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[560px] overflow-hidden" style={{ animation: 'modalIn .2s ease-out both' }} onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-[#e5e5e5] flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-[#32363a]">ASN Details</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f5f6f7] text-[#6a6d70]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="overflow-x-auto max-h-[400px]">
          {loading ? <div className="py-12 text-center text-[13px] text-[#6a6d70]"><div className="w-5 h-5 border-2 border-[#e5e5e5] border-t-[#0a6ed1] rounded-full animate-spin mx-auto mb-2" />Loading…</div>
          : items.length === 0 ? <div className="py-12 text-center text-[13px] text-[#6a6d70]">No items</div>
          : <table className="w-full text-[13px]">
              <thead><tr className="bg-[#f5f6f7] border-b border-[#e5e5e5] text-[#6a6d70]">
                {['Material', 'Material Desc.', 'Quantity', 'Price', 'HSN Code'].map(h => <th key={h} className="text-left font-semibold py-3 px-4 text-[11px] uppercase tracking-wider">{h}</th>)}
              </tr></thead>
              <tbody>{items.map((it, i) => (
                <tr key={i} className="border-b border-[#f0f0f0] hover:bg-[#fafbfc]">
                  <td className="py-3 px-4 font-semibold text-[#0a6ed1]">{it.material}</td>
                  <td className="py-3 px-4 text-[#32363a]">{it.materialDesc}</td>
                  <td className="py-3 px-4 text-[#32363a]">{it.quantity.toFixed(3)} <span className="text-[#6a6d70]">{it.unit}</span></td>
                  <td className="py-3 px-4 font-semibold text-[#32363a]">{it.price.toFixed(2)} <span className="text-[#6a6d70] text-[11px]">{it.currency}</span></td>
                  <td className="py-3 px-4 text-[#32363a]">{it.hsnCode}</td>
                </tr>
              ))}</tbody>
            </table>}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SUCCESS DIALOG
// ═══════════════════════════════════════════════════════════════
function SuccessDialog({ message, onClose }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" style={{ animation: 'modalIn .2s ease-out both' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#e6f4ea] flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#107e3e" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
          </div>
          <div><div className="text-[15px] font-bold text-[#107e3e]">Success</div><div className="text-[13px] text-[#32363a] mt-1">{message}</div></div>
        </div>
        <div className="flex justify-end mt-4"><button onClick={onClose} className="px-5 h-9 text-[13px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] transition-all">OK</button></div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
export default function GateInGateOut() {
  const [tracking, setTracking] = useState(null)
  const [showLookup, setShowLookup] = useState(true)
  const [activeTab, setActiveTab] = useState('timeline')
  const [successMsg, setSuccessMsg] = useState('')
  const [successOpen, setSuccessOpen] = useState(false)
  const [gateRepLoading, setGateRepLoading] = useState(false)
  const [gateInLoading, setGateInLoading] = useState(false)
  const [asnPopup, setAsnPopup] = useState(null) // { asnNum, fisYear }

  const handleLoaded = (data) => { setTracking(data); setShowLookup(false); setActiveTab('timeline') }
  const handleReset = () => { setShowLookup(true) }

  const refreshTracking = async () => {
    if (!tracking) return
    try {
      const data = await gateEntryApi.getTracking(tracking.trackingNo, tracking.year)
      let summaryItems = []
      try { summaryItems = await gateEntryApi.getAsnData(tracking.trackingNo, tracking.year) } catch {}
      setTracking({ ...data, summaryItems })
    } catch {}
  }

  const handleGateReporting = async () => {
    if (!tracking) return; setGateRepLoading(true)
    try {
      await gateEntryApi.processGateReporting(tracking.trackingNo, tracking.year)
      setSuccessMsg('Gate reporting processed successfully.'); setSuccessOpen(true)
      await refreshTracking()
    } catch (err) { console.error(err) } finally { setGateRepLoading(false) }
  }

  const handleGateIn = async () => {
    if (!tracking) return; setGateInLoading(true)
    try {
      const result = await gateEntryApi.processGateIn(tracking.trackingNo, tracking.year)
      setSuccessMsg(`Gate In processed. Gate Number: ${result.GateNo || '—'}`)
      setSuccessOpen(true); await refreshTracking()
    } catch (err) { console.error(err) } finally { setGateInLoading(false) }
  }

  // ── Timeline ──
  const renderTimeline = () => {
    if (!tracking) return null
    const steps = TIMELINE_STEPS.map(s => { const f = tracking.timeline.find(t => t.key === s.key); return { ...s, completed: f?.completed || false, timestamp: f?.timestamp || null } })
    const lastIdx = steps.reduce((a, s, i) => s.completed ? i : a, -1)
    return (
      <div className="anim-fade px-4 sm:px-6 lg:px-10 py-8">
        <div className="hidden sm:block"><div className="relative flex items-start justify-between">
          <div className="absolute top-[26px] left-[40px] right-[40px] h-[2px] bg-[#e5e5e5] z-0" />
          {lastIdx > 0 && <div className="absolute top-[26px] left-[40px] h-[2px] bg-[#107e3e] z-0 transition-all duration-700" style={{ width: `calc(${(lastIdx / (steps.length - 1)) * 100}% - 0px)` }} />}
          {steps.map((step, idx) => (
            <div key={step.key} className="relative flex flex-col items-center z-10" style={{ width: `${100 / steps.length}%` }}>
              <div className={`w-[52px] h-[52px] rounded-full flex items-center justify-center border-2 transition-all ${step.completed ? 'bg-[#107e3e] border-[#107e3e] text-white shadow-md' : 'bg-white border-[#d9d9d9] text-[#d9d9d9]'} ${idx === lastIdx ? 'scale-110 ring-4 ring-[#107e3e]/15' : ''}`}>
                {step.icon}
              </div>
              <div className="mt-2.5 text-center px-1">
                <div className={`text-[11px] font-semibold ${step.completed ? 'text-[#32363a]' : 'text-[#d9d9d9]'}`}>{step.label}</div>
                {step.timestamp && <div className="text-[10px] text-[#6a6d70] mt-0.5">{step.timestamp}</div>}
              </div>
            </div>
          ))}
        </div></div>
        <div className="sm:hidden relative pl-10">
          <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-[#e5e5e5]" />
          {lastIdx >= 0 && <div className="absolute left-[19px] top-2 w-[2px] bg-[#107e3e] transition-all duration-700" style={{ height: `calc(${((lastIdx + 0.5) / steps.length) * 100}%)` }} />}
          <div className="space-y-5">{steps.map((step, idx) => (
            <div key={step.key} className="relative flex items-start gap-3">
              <div className={`absolute -left-10 w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 ${step.completed ? 'bg-[#107e3e] border-[#107e3e] text-white' : 'bg-white border-[#d9d9d9] text-[#d9d9d9]'}`}>{step.icon}</div>
              <div><div className={`text-[13px] font-semibold ${step.completed ? 'text-[#32363a]' : 'text-[#d9d9d9]'}`}>{step.label}</div>{step.timestamp && <div className="text-[11px] text-[#6a6d70]">{step.timestamp}</div>}</div>
            </div>
          ))}</div>
        </div>
      </div>
    )
  }

  // ── ASN tab (matches Image 2) ──
  const renderAsn = () => {
    if (!tracking) return null
    return (
      <div className="anim-fade px-4 sm:px-6 lg:px-10 py-6">
        <div className="overflow-x-auto rounded-xl border border-[#e5e5e5] shadow-sm">
          <table className="w-full text-[13px]" style={{ minWidth: '700px' }}>
            <thead><tr className="bg-[#f5f6f7] border-b border-[#e5e5e5] text-[#6a6d70]">
              {['ASN', 'Total Line Items', 'IBD Number', '103 Doc Number', 'Plant', 'Invoice Number', 'Invoice Date'].map(h => (
                <th key={h} className="text-left font-semibold py-3 px-4 text-[11px] uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody>{tracking.asns.map((asn, idx) => (
              <tr key={idx} className="border-b border-[#f0f0f0] hover:bg-[#fafbfc] transition-colors">
                <td className="py-3.5 px-4"><button onClick={() => setAsnPopup({ asnNum: asn.asnNum, fisYear: asn.asnYear })} className="text-[#0a6ed1] font-semibold hover:underline">{asn.asnId}</button></td>
                <td className="py-3.5 px-4 text-[#32363a]">{asn.totalLineItems}</td>
                <td className="py-3.5 px-4 text-[#32363a] font-medium">{asn.ibdNumber}</td>
                <td className="py-3.5 px-4 text-[#32363a]">{asn.doc103Number || '—'}</td>
                <td className="py-3.5 px-4"><span className="font-semibold text-[#32363a] bg-[#f0f4ff] px-2 py-0.5 rounded text-[11px]">{asn.plant}</span></td>
                <td className="py-3.5 px-4 text-[#32363a] font-medium">{asn.invoiceNumber}</td>
                <td className="py-3.5 px-4 text-[#32363a]">{asn.invoiceDate}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    )
  }

  // ── Summary tab (matches Image 4 — material items) ──
  const renderSummary = () => {
    if (!tracking) return null
    const items = tracking.summaryItems || []
    return (
      <div className="anim-fade px-4 sm:px-6 lg:px-10 py-6">
        <div className="overflow-x-auto rounded-xl border border-[#e5e5e5] shadow-sm">
          <table className="w-full text-[13px]" style={{ minWidth: '500px' }}>
            <thead><tr className="bg-[#f5f6f7] border-b border-[#e5e5e5] text-[#6a6d70]">
              {['Material', 'Quantity', 'Price (Unit Price)', 'HSN Code'].map(h => (
                <th key={h} className="text-left font-semibold py-3 px-4 text-[11px] uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody>{items.length === 0 ? (
              <tr><td colSpan={4} className="py-12 text-center text-[13px] text-[#6a6d70]">No items</td></tr>
            ) : items.map((it, i) => (
              <tr key={i} className="border-b border-[#f0f0f0] hover:bg-[#fafbfc]">
                <td className="py-3.5 px-4"><div className="font-bold text-[#32363a]">{it.materialDesc}</div><div className="text-[11px] text-[#6a6d70] mt-0.5">{it.material}</div></td>
                <td className="py-3.5 px-4 text-[#32363a] font-medium">{it.quantity.toFixed(3)} <span className="text-[#6a6d70]">{it.unit}</span></td>
                <td className="py-3.5 px-4 font-semibold text-[#32363a]">{it.price.toFixed(2)}</td>
                <td className="py-3.5 px-4 text-[#32363a]">{it.hsnCode}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    )
  }

  const tabContent = { timeline: renderTimeline, asn: renderAsn, summary: renderSummary }
  const t = tracking

  return (
    <PageLayout>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.94) translateY(-8px)}to{opacity:1;transform:scale(1) translateY(0)}}
        .anim-fade{animation:fadeIn .3s ease-out both}
      `}</style>

      {showLookup && <TrackingPopup onSubmit={handleLoaded} />}
      {asnPopup && <AsnItemsPopup asnNum={asnPopup.asnNum} fisYear={asnPopup.fisYear} onClose={() => setAsnPopup(null)} />}
      {successOpen && <SuccessDialog message={successMsg} onClose={() => setSuccessOpen(false)} />}

      {/* Supplier bar */}
      <div className="bg-white border-b border-[#e5e5e5] px-4 sm:px-6 lg:px-10 py-2 text-[13px] text-[#6a6d70]">
        Company Code: <strong className="text-[#32363a]">DSAL (Daikin Airconditioning India Private Limited)</strong>
      </div>

      <div className="bg-[#f5f6f7] min-h-[calc(100vh-136px)]">
        {t ? (
          <main className="bg-white min-h-[calc(100vh-170px)] pb-20 anim-fade">

            {/* Tracking Number subtitle */}
            <div className="text-center py-3 text-[14px] text-[#32363a] font-medium border-b border-[#e5e5e5]">
              Tracking Number — {t.id}
            </div>

            {/* Header — matches Image 1 layout */}
            <div className="px-4 sm:px-6 lg:px-10 pt-5 pb-5 border-b border-[#e5e5e5]">
              <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                <div>
                  <h2 className="text-[22px] sm:text-[26px] font-bold text-[#32363a] tracking-tight">{t.id}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[18px] font-bold" style={{ color: t.statusColor === 'green' ? '#107e3e' : t.statusColor === 'orange' ? '#e76500' : t.statusColor === 'blue' ? '#0a6ed1' : '#cc1c14' }}>{t.status}</span>
                  <button onClick={handleReset} className="flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold text-[#6a6d70] border border-[#d9d9d9] rounded-lg hover:border-[#0a6ed1] hover:text-[#0a6ed1] transition-all">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                    Change Tracking
                  </button>
                </div>
              </div>

              {/* Info — left labels, right values (matches SAP layout) */}
              <div className="flex flex-wrap gap-x-16 gap-y-1 text-[13px]">
                <div className="flex-1 min-w-[280px] space-y-1">
                  <div className="text-[#6a6d70]">Transporter: <span className="font-semibold text-[#32363a]">{t.transporter}</span></div>
                  <div className="text-[#6a6d70]">Name: <span className="font-semibold text-[#32363a]">{t.driverName}</span></div>
                  <div className="text-[#6a6d70]">Contact: <span className="font-semibold text-[#32363a]">{t.contact}</span></div>
                  <div className="text-[#6a6d70]">Vendor: <span className="font-semibold text-[#32363a]">{t.vendor}</span></div>
                  <div className="text-[#6a6d70]">Pollution Certificate Applicable: <span className="font-semibold text-[#32363a]">{t.pollutionCertApplicable}</span></div>
                  <div className="text-[#6a6d70]">Safety Equipments: <span className="font-semibold text-[#32363a]">{t.safetyEquipments}</span></div>
                  <div className="text-[#6a6d70]">Safety Guard for Material: <span className="font-semibold text-[#32363a]">{t.safetyGuardForMaterial}</span></div>
                </div>
                <div className="min-w-[200px] space-y-1 text-right">
                  <div className="text-[#6a6d70]">Mode: <span className="font-semibold text-[#32363a]">{t.transportMode}</span></div>
                  <div className="text-[#6a6d70]">Date: <span className="font-semibold text-[#32363a]">{t.date}</span></div>
                  <div className="text-[#6a6d70]">Truck Number: <span className="font-semibold text-[#32363a]">{t.vehicleRegNo}</span></div>
                  <div className="text-[#6a6d70]">Eway Bill: <span className="font-semibold text-[#32363a]">{t.ewayBillNo || '—'}</span></div>
                  <div className="text-[#6a6d70]">Eway Bill Date: <span className="font-semibold text-[#32363a]">{t.ewayBillDate || '—'}</span></div>
                  <div className="text-[#6a6d70]">Total ASN Amount: <span className="font-bold text-[#32363a]">{t.totalAsnAmount.toFixed(2)}</span></div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-4 sm:px-6 lg:px-10 pt-5 pb-0 border-b border-[#e5e5e5] bg-white">
              <div className="flex items-end gap-6 sm:gap-10 overflow-x-auto">
                {TABS.map(tab => {
                  const isActive = activeTab === tab.key
                  return (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex flex-col items-center pb-3 border-b-2 transition-all flex-shrink-0 ${isActive ? 'border-[#0a6ed1]' : 'border-transparent hover:border-[#d9d9d9]'}`}>
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-1.5 shadow-sm transition-all ${isActive ? 'shadow-md scale-110' : ''}`} style={{ backgroundColor: isActive ? tab.color : '#f0f4f8' }}>{tab.icon(isActive)}</div>
                      <span className={`text-[13px] font-semibold whitespace-nowrap ${isActive ? 'text-[#0a6ed1]' : 'text-[#6a6d70]'}`}>{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div key={activeTab}>{tabContent[activeTab]?.()}</div>
          </main>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-[#6a6d70] anim-fade">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-30"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            <span className="text-[14px]">Enter tracking details to load</span>
          </div>
        )}
      </div>

      {/* Bottom bar — gate reporting / gate in */}
      {t && (canGateReport(t.status) || canGateIn(t.status)) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#e5e5e5] px-4 sm:px-6 py-3 flex items-center gap-2 z-30 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          {canGateReport(t.status) && (
            <button onClick={handleGateReporting} disabled={gateRepLoading} className="flex items-center gap-2 px-4 h-9 text-[13px] font-semibold text-white bg-[#e76500] rounded-lg hover:bg-[#b45309] transition-all shadow-sm disabled:opacity-60">
              {gateRepLoading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}
              {gateRepLoading ? 'Processing…' : 'Gate Reporting'}
            </button>
          )}
          {canGateIn(t.status) && (
            <button onClick={handleGateIn} disabled={gateInLoading} className="flex items-center gap-2 px-4 h-9 text-[13px] font-semibold text-white bg-[#107e3e] rounded-lg hover:bg-[#0b5e2e] transition-all shadow-sm disabled:opacity-60">
              {gateInLoading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>}
              {gateInLoading ? 'Processing…' : 'Gate In'}
            </button>
          )}
        </div>
      )}
    </PageLayout>
  )
}