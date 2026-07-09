import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../../../layouts/PageLayout.jsx'
import { scheduleReleaseApi, authConfig } from '../../../services/Purchasing/ScheduleRelease/Schedulerelease.js'
import { useUser } from '../../../context/UserContext.jsx'


// ── date helpers ──
const ddmmyyyyToIso = (s) => {
  if (!s) return ''
  const parts = s.split('.')
  if (parts.length !== 3) return ''
  const [d, m, y] = parts
  if (!d || !m || !y) return ''
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}
const isoToDdmmyyyy = (s) => {
  if (!s) return ''
  const [y, m, d] = s.split('-')
  if (!y || !m || !d) return ''
  return `${d}.${m}.${y}`
}
const parseDdmmyyyy = (s) => {
  const iso = ddmmyyyyToIso(s)
  return iso ? new Date(iso) : null
}

// ── status config ──
const STATUS_CONFIG = {
  'Confirmation Required': { bg: '#fff3e0', text: '#e65100', dot: '#ff9800', label: 'Confirmation Required' },
  'Partially Confirmed':   { bg: '#e3f2fd', text: '#1565c0', dot: '#1976d2', label: 'Partially Confirmed'   },
  'Confirmed':             { bg: '#e8f5e9', text: '#2e7d32', dot: '#43a047', label: 'Confirmed'             },
  'Completed':             { bg: '#f3e5f5', text: '#6a1b9a', dot: '#8e24aa', label: 'Completed'             },
}
const getStatus = (s) => STATUS_CONFIG[s] || { bg: '#f5f5f5', text: '#616161', dot: '#9e9e9e', label: s || 'Unknown' }

// ── button logic ──
// ASN button disabled only when ALL items are 'Confirmation Required'
const asnDisabled = (items) =>
  items.length > 0 && items.every(i => i.status === 'Confirmation Required')

// Confirm button enabled when at least one item is 'Partially Confirmed' or 'Confirmation Required'
const canConfirm = (items) =>
  items.length > 0 && items.some(i => i.status === 'Partially Confirmed' || i.status === 'Confirmation Required')

// ── Status Badge ──
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

// ═══════════════════════════════════════════════════════════════
// CONFIRM VIEW
// ═══════════════════════════════════════════════════════════════
function ConfirmView({ agreement, onBack, onSuccess }) {
  const today      = new Date().toISOString().slice(0, 10)
  const defaultTo  = new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [fromDate,        setFromDate]        = useState(today)
  const [toDate,          setToDate]          = useState(defaultTo)
  const [storageLocation, setStorageLocation] = useState('')
  const [materialFilter,  setMaterialFilter]  = useState('')
  const [rows,            setRows]            = useState([])
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState(null)
  const [selected,        setSelected]        = useState(new Set())
  const [submitting,      setSubmitting]      = useState(false)
  const [submitted,       setSubmitted]       = useState(false)
  const [confirmModal,    setConfirmModal]    = useState(false)

  const fetchData = async (fDate, tDate, sloc) => {
    setLoading(true); setError(null)
    try {
      const data = await scheduleReleaseApi.getConfirmData({
        scheduleNo:      agreement.id,
        fromDate:        fDate,
        toDate:          tDate,
        storageLocation: sloc?.trim() || '',
      })
      setRows(data)
      setSelected(new Set())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch on mount
  useEffect(() => {
    fetchData(today, defaultTo, '')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleGo = () => fetchData(fromDate, toDate, storageLocation)

  const handleClear = () => {
    setFromDate(today); setToDate(defaultTo)
    setStorageLocation(''); setMaterialFilter('')
    setRows([]); setSelected(new Set()); setError(null)
  }

  // Filter by material (client-side)
  const filteredRows = useMemo(() => {
    if (!materialFilter.trim()) return rows
    const terms = materialFilter.trim().toUpperCase().split(/\s+/)
    return rows.filter(r =>
      terms.some(t =>
        (r.materialNo   || '').toUpperCase().includes(t) ||
        (r.materialDesc || '').toUpperCase().includes(t)
      )
    )
  }, [rows, materialFilter])

  const allSelected = filteredRows.length > 0 && filteredRows.every(r => selected.has(r.scheduleLine))
  const toggleAll   = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(filteredRows.map((_, idx) => String(idx))))
  }
  const toggleRow = (key) => {
    const s = new Set(selected)
    s.has(key) ? s.delete(key) : s.add(key)
    setSelected(s)
  }

  const handleSubmitClick = () => {
    if (selected.size === 0) return
    setConfirmModal(true)
  }

  const handleSubmit = async () => {
    setConfirmModal(false)
    setSubmitting(true)
    try {
      const selectedRows = filteredRows.filter((r, idx) => selected.has(String(idx)))
      await scheduleReleaseApi.submitConfirm(agreement.id, selectedRows)
      setSubmitted(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Success screen — clicking "Back" triggers parent re-fetch via onSuccess
  if (submitted) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 anim-fade">
      <div className="w-14 h-14 rounded-full bg-[#e8f5e9] flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2.5">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
      </div>
      <div className="text-[16px] font-semibold text-[#2e7d32]">Confirmed successfully</div>
      <button
        onClick={onSuccess}
        className="px-5 h-10 text-[14px] font-semibold text-[#0a6ed1] bg-[#ebf5ff] rounded-lg hover:bg-[#d9ecff] transition-all"
      >
        ← Back to Agreement
      </button>
    </div>
  )

  return (
    <main className="bg-white anim-fade" style={{ minHeight: 'calc(100vh - 220px)' }}>
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-10 py-5 border-b border-[#e5e5e5] bg-gradient-to-b from-[#fafbfc] to-white">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[14px] text-[#0a6ed1] hover:underline mb-4 hover:-translate-x-0.5 transition-transform"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Back to Items
        </button>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">Schedule Agreement</div>
            <h2 className="text-[22px] font-bold text-[#0a6ed1]">{agreement.id}</h2>
            <div className="text-[13px] text-[#6a6d70] mt-1">
              {agreement.vendor} · {agreement.plantName} ({agreement.plant})
            </div>
          </div>
          <div className="text-[13px] text-[#6a6d70] bg-white border border-[#e5e5e5] px-3 py-2 rounded-lg shadow-sm">
            {agreement.date}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 sm:px-6 lg:px-10 py-4 border-b border-[#e5e5e5] bg-[#fafbfc]">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6a6d70] mb-1.5">
              Shipment From Date
            </label>
            <input
              type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="h-9 px-3 text-[13px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all w-[160px]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6a6d70] mb-1.5">
              To Date
            </label>
            <input
              type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="h-9 px-3 text-[13px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all w-[160px]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6a6d70] mb-1.5">
              Enter Materials (space-separated)
            </label>
            <div className="relative">
              <input
                type="text" value={materialFilter} onChange={e => setMaterialFilter(e.target.value)}
                placeholder="Materials (Separated by Space)"
                className="h-9 pl-3 pr-9 text-[13px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all w-[240px]"
              />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" className="absolute right-3 top-2.5">
                <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
              </svg>
            </div>
          </div>
          <button
            onClick={handleGo} disabled={loading}
            className="h-9 px-5 text-[13px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>}
            Go
          </button>
          <button
            onClick={handleClear}
            className="h-9 px-4 text-[13px] font-semibold text-[#cc1c14] bg-[#fce8e6] rounded-lg hover:bg-[#fad6d3] transition-all"
          >
            Clear
          </button>
        </div>
        {error && (
          <div className="mt-3 flex items-center gap-2 text-[13px] text-[#cc1c14] bg-[#fce8e6] px-3 py-2 rounded-lg">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
            {error}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="px-4 sm:px-6 lg:px-10 py-5 flex-1">
        <div className="rounded-xl border border-[#e5e5e5] shadow-sm overflow-x-auto">
          <table className="w-full text-[13px]" style={{ minWidth: '760px', borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-gradient-to-b from-[#fafbfc] to-[#f5f6f7] border-b border-[#e5e5e5] text-[#6a6d70]">
                <th className="py-3 px-3 w-10">
                  <input
                    type="checkbox" checked={allSelected} onChange={toggleAll}
                    className="w-4 h-4 accent-[#0a6ed1] cursor-pointer"
                  />
                </th>
                {['Item', 'Schedule Line', 'Material', 'Storage Loc.', 'Delivery Schedule', 'Confirmed Qty', 'ASN Qty', 'Delivery Date', 'Dispatch Date'].map(h => (
                  <th key={h} className="text-left font-semibold py-3 px-3 text-[11px] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-[13px] text-[#6a6d70]">
                    <div className="w-5 h-5 border-2 border-[#e5e5e5] border-t-[#0a6ed1] rounded-full animate-spin"/>
                    Loading…
                  </div>
                </td></tr>
              ) : filteredRows.length === 0 ? (
                <tr><td colSpan={10} className="py-12 text-center text-[13px] text-[#6a6d70]">No data</td></tr>
              ) : filteredRows.map((r, idx) => {
                const key = String(idx)
                const isSelected = selected.has(key)
                return (
                  <tr
                    key={key}
                    onClick={() => toggleRow(key)}
                    className={`border-b border-[#f0f0f0] last:border-b-0 cursor-pointer transition-colors ${isSelected ? 'bg-[#ebf5ff]' : 'hover:bg-[#fafbfc]'}`}
                  >
                    <td className="py-3 px-3" onClick={e => { e.stopPropagation(); toggleRow(key) }}>
                      <input
                        type="checkbox" checked={isSelected} onChange={() => toggleRow(key)}
                        className="w-4 h-4 accent-[#0a6ed1] cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#32363a]">{r.itemNo || '—'}</td>
                    <td className="py-3 px-3 text-[#32363a]">{r.scheduleLine || '—'}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#0a6ed1] text-[12px]">{r.materialNo || '—'}</div>
                      <div className="text-[#6a6d70] text-[11px] truncate max-w-[160px]">{r.materialDesc || ''}</div>
                    </td>
                    <td className="py-3 px-3 text-[#32363a]">{r.storageLocation || '—'}</td>
                    <td className="py-3 px-3 font-semibold text-[#32363a]">
                      {r.requiredQty || '—'} <span className="text-[#6a6d70] font-normal text-[11px]">{r.uom}</span>
                    </td>
                    <td className="py-3 px-3 text-[#32363a]">{r.confirmedQty || '—'}</td>
                    <td className="py-3 px-3 text-[#32363a]">{r.asnQty || '—'}</td>
                    <td className="py-3 px-3 text-[#32363a]">{r.deliveryDate || '—'}</td>
                    <td className="py-3 px-3 text-[#32363a]">{r.dispatchDate || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Modal */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-3"
          style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(2px)' }}
          onClick={() => setConfirmModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-[#ebf5ff]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a6ed1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h3 className="text-[18px] font-bold text-[#32363a]">Confirm selected lines?</h3>
                <p className="text-[13.5px] text-[#6a6d70] mt-1 leading-relaxed">
                  You are about to confirm <strong>{selected.size}</strong> schedule line{selected.size !== 1 ? 's' : ''} for agreement <strong>{agreement.id}</strong>.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#e5e5e5] flex justify-end gap-2 bg-[#fafbfc]">
              <button
                onClick={() => setConfirmModal(false)}
                className="h-10 px-5 text-[14px] font-semibold text-[#32363a] bg-white border border-[#d9d9d9] rounded-lg hover:bg-[#f5f6f7] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="h-10 px-5 text-[14px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] transition-all shadow-md"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 sm:px-6 lg:px-10 py-4 border-t border-[#e5e5e5] flex items-center justify-between bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
        <span className="text-[13px] text-[#6a6d70]">{selected.size} of {filteredRows.length} selected</span>
        <button
          onClick={handleSubmitClick}
          disabled={selected.size === 0 || submitting}
          className="flex items-center gap-2 px-6 h-10 text-[14px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          Submit
        </button>
      </div>
    </main>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
export default function ScheduleRelease() {
  const navigate = useNavigate()
  const { loginId, loginType, loading: userLoading } = useUser()
  authConfig.loginId   = loginId
  authConfig.loginType = loginType

  const [agreements,          setAgreements]          = useState([])
  const [agreement,           setAgreement]           = useState(null)
  const [selectedAgreementId, setSelectedAgreementId] = useState(null)
  const [showConfirmView,     setShowConfirmView]     = useState(false)
  const [searchQuery,         setSearchQuery]         = useState('')
  const [selectedPlants,      setSelectedPlants]      = useState([])
  const [filterOpen,          setFilterOpen]          = useState(false)
  const [fromDate,            setFromDate]            = useState('')
  const [toDate,              setToDate]              = useState('')
  const filterRef             = useRef(null)
  const [sidebarCollapsed,    setSidebarCollapsed]    = useState(false)
  const [mobileSidebarOpen,   setMobileSidebarOpen]   = useState(false)
  const [loading,             setLoading]             = useState(false)
  const [error,               setError]               = useState(null)

  // ── Load agreement list ──
  useEffect(() => {
  if (userLoading) return
  if (!loginId || !loginType) return

  let cancelled = false
  setLoading(true)
  setError(null)
  scheduleReleaseApi.listAgreements({ search: searchQuery, plants: selectedPlants })
    .then(data  => { if (!cancelled) setAgreements(data) })
    .catch(err  => { if (!cancelled) setError(err.message) })
    .finally(() => { if (!cancelled) setLoading(false) })
  return () => { cancelled = true }
}, [userLoading, loginId, loginType, searchQuery, selectedPlants])

  // ── Auto-select first agreement ──
  useEffect(() => {
    if (!selectedAgreementId && agreements.length > 0) setSelectedAgreementId(agreements[0].id)
  }, [agreements, selectedAgreementId])

  // ── Load agreement detail ──
  useEffect(() => {
    let cancelled = false
    if (!selectedAgreementId) { setAgreement(null); return }
    scheduleReleaseApi.getAgreement(selectedAgreementId)
      .then(data => { if (!cancelled) setAgreement(data) })
      .catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [selectedAgreementId])

  // ── Close filter popover on outside click ──
  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Close mobile sidebar on outside click ──
  useEffect(() => {
    if (!mobileSidebarOpen) return
    const handler = (e) => {
      if (!e.target.closest('[data-sidebar]') && !e.target.closest('[data-sidebar-toggle]'))
        setMobileSidebarOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [mobileSidebarOpen])

  const plants = useMemo(() => {
    const map = new Map()
    agreements.forEach(a => { if (a.plant) map.set(a.plant, a.plantName) })
    return Array.from(map, ([code, name]) => ({ code, name }))
  }, [agreements])

  const dateError = useMemo(() => {
    if (!fromDate || !toDate) return null
    const f = parseDdmmyyyy(fromDate), t = parseDdmmyyyy(toDate)
    if (!f || !t) return null
    return f > t ? 'From Date must be earlier than To Date' : null
  }, [fromDate, toDate])

  // Filter items by delivery date if entered
  const filteredItems = useMemo(() => {
    if (!agreement) return []
    if (!fromDate && !toDate) return agreement.items
    return agreement.items.filter(item => {
      if (!item.deliverySchedule) return true
      return true // date filtering on items is display-level; SAP handles it server-side
    })
  }, [agreement, fromDate, toDate, dateError])

  const handleSelectAgreement = (id) => {
    setSelectedAgreementId(id)
    setShowConfirmView(false)
    setMobileSidebarOpen(false)
  }

  const togglePlant = (plant) => {
    setSelectedPlants(
      selectedPlants.includes(plant)
        ? selectedPlants.filter(p => p !== plant)
        : [...selectedPlants, plant]
    )
  }

  // Create ASN: only pass items whose status is NOT 'Confirmation Required'
  const handleCreateAsn = () => {
    if (!agreement) return
    const eligibleItems = agreement.items.filter(i => i.status !== 'Confirmation Required')
    navigate('/purchasing/ScheduleRelease/create-asn2', {
      state: {
        agreement: {
          ...agreement,
          items: eligibleItems,
        },
      },
    })
  }

  const handleConfirm = () => setShowConfirmView(true)

  // Called after confirm success — closes confirm view and re-fetches agreement
  const handleConfirmSuccess = () => {
    setShowConfirmView(false)
    const id = selectedAgreementId
    setSelectedAgreementId(null)
    setTimeout(() => setSelectedAgreementId(id), 0)
  }

  // ── Navigate to line item detail page ──
  const handleItemClick = (item) => {
    navigate('/purchasing/ScheduleRelease/sr-lineitem', {
      state: { agreement, item },
    })
  }

  // ── Sidebar content ──
  const SidebarContent = () => (
    <>
      <div className="px-4 py-4 border-b border-[#e5e5e5] flex-shrink-0">
        {!sidebarCollapsed && (
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-semibold text-[#32363a]">Schedule Agreements</h3>
            <span className="text-[12px] text-[#6a6d70] bg-[#f5f6f7] px-2.5 py-1 rounded-full font-medium">
              {agreements.length}
            </span>
          </div>
        )}
        {sidebarCollapsed ? (
          <div className="flex justify-center">
            <button className="w-9 h-9 flex items-center justify-center text-[#6a6d70] hover:text-[#0a6ed1] rounded-lg hover:bg-[#f0f7ff] transition-all">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
              </svg>
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by ID or plant"
              className="w-full h-10 pl-3.5 pr-16 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all"
            />
            <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="w-7 h-7 flex items-center justify-center text-[#6a6d70] hover:text-[#cc1c14] rounded transition-all"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              )}
              <button className="w-7 h-7 flex items-center justify-center text-[#6a6d70] hover:text-[#0a6ed1] rounded transition-all">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {error && !sidebarCollapsed && (
          <div className="px-4 py-3 text-[13px] text-[#cc1c14] bg-[#fce8e6] border-b border-[#fad6d3]">{error}</div>
        )}
        {loading && agreements.length === 0 ? (
          <div className="px-4 py-12 text-center text-[13px] text-[#6a6d70]">Loading…</div>
        ) : sidebarCollapsed ? (
          agreements.map(a => {
            const isSelected = a.id === selectedAgreementId
            return (
              <button
                key={a.id} onClick={() => handleSelectAgreement(a.id)} title={a.id}
                className={`w-full flex items-center justify-center py-3 border-b border-[#e5e5e5] transition-all border-l-[3px] ${isSelected ? 'bg-[#ebf5ff] border-l-[#0a6ed1]' : 'hover:bg-[#f5f6f7] border-l-transparent'}`}
              >
                <span className={`text-[11px] font-bold ${isSelected ? 'text-[#0a6ed1]' : 'text-[#6a6d70]'}`}>
                  {a.id.slice(-3)}
                </span>
              </button>
            )
          })
        ) : (
          <>
            {agreements.map(a => {
              const isSelected = a.id === selectedAgreementId
              return (
                <button
                  key={a.id} onClick={() => handleSelectAgreement(a.id)}
                  className={`w-full text-left px-4 py-3.5 border-b border-[#e5e5e5] transition-all border-l-[3px] ${isSelected ? 'bg-[#ebf5ff] border-l-[#0a6ed1]' : 'hover:bg-[#f5f6f7] border-l-transparent'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[14px] font-bold text-[#0a6ed1]">{a.id}</span>
                    <span className="text-[11px] text-[#6a6d70] bg-[#f0f0f0] px-2 py-0.5 rounded font-medium">{a.type}</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px] text-[#6a6d70]">
                    <span>{a.plant} · {a.plantName}</span>
                    <span>{a.date}</span>
                  </div>
                </button>
              )
            })}
            {agreements.length === 0 && !loading && (
              <div className="px-4 py-12 text-center text-[13px] text-[#6a6d70] anim-fade">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 opacity-40">
                  <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
                </svg>
                No agreements found
              </div>
            )}
          </>
        )}
      </div>

      <div className="border-t border-[#e5e5e5] px-3 py-2.5 flex items-center justify-between flex-shrink-0" ref={filterRef}>
        <div className="relative">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`relative w-9 h-9 flex items-center justify-center rounded-lg transition-all ${selectedPlants.length > 0 ? 'bg-[#ebf5ff] text-[#0a6ed1]' : 'text-[#0a6ed1] hover:bg-[#f0f7ff]'}`}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 4h18l-7 9v6l-4-2v-4L3 4z"/>
            </svg>
            {selectedPlants.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#cc1c14] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {selectedPlants.length}
              </span>
            )}
          </button>
          {filterOpen && (
            <div className="absolute bottom-11 left-0 w-60 bg-white border border-[#d9d9d9] rounded-lg shadow-xl z-50 anim-scale">
              <div className="px-3.5 py-2.5 border-b border-[#e5e5e5] flex items-center justify-between">
                <span className="text-[13px] font-semibold text-[#32363a]">Filter by Plant</span>
                {selectedPlants.length > 0 && (
                  <button onClick={() => setSelectedPlants([])} className="text-[12px] text-[#0a6ed1] hover:underline">
                    Clear
                  </button>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {plants.map(p => (
                  <label
                    key={p.code}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-[#f5f6f7] cursor-pointer text-[13px] transition-colors"
                  >
                    <input
                      type="checkbox" checked={selectedPlants.includes(p.code)} onChange={() => togglePlant(p.code)}
                      className="accent-[#0a6ed1] w-4 h-4"
                    />
                    <span className="text-[#32363a]">
                      <span className="font-medium">{p.code}</span> — <span className="text-[#6a6d70]">{p.name}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden md:flex w-9 h-9 items-center justify-center rounded-lg text-[#6a6d70] hover:text-[#0a6ed1] hover:bg-[#f0f7ff] transition-all"
        >
          <svg
            width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round"
            style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease' }}
          >
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
      </div>
    </>
  )

  return (
    <PageLayout>
      <style>{`
        @keyframes fadeIn      { from { opacity: 0; transform: translateY(8px);   } to { opacity: 1; transform: translateY(0);    } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0);    } }
        @keyframes slideInRight{ from { opacity: 0; transform: translateX(12px);  } to { opacity: 1; transform: translateX(0);    } }
        @keyframes scaleIn     { from { opacity: 0; transform: scale(0.96);       } to { opacity: 1; transform: scale(1);         } }
        @keyframes slideInDrawer { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        .anim-fade     { animation: fadeIn        0.35s ease-out both; }
        .anim-slide-l  { animation: slideInLeft   0.3s  ease-out both; }
        .anim-slide-r  { animation: slideInRight  0.35s ease-out both; }
        .anim-scale    { animation: scaleIn       0.25s ease-out both; }
        .anim-drawer   { animation: slideInDrawer 0.28s ease-out both; }
        .row-stagger > * { animation: fadeIn 0.4s ease-out both; }
        .row-stagger > *:nth-child(1) { animation-delay: 0.02s; }
        .row-stagger > *:nth-child(2) { animation-delay: 0.06s; }
        .row-stagger > *:nth-child(3) { animation-delay: 0.10s; }
        .row-stagger > *:nth-child(4) { animation-delay: 0.14s; }
        .row-stagger > *:nth-child(5) { animation-delay: 0.18s; }
        .sidebar-transition { transition: width 0.25s ease; }
        .btn-disabled-asn   { opacity: 0.45; cursor: not-allowed; filter: grayscale(0.3); }
      `}</style>

      <div className="bg-[#f5f6f7] min-h-[calc(100vh-104px)]">

        {/* ── CONFIRM VIEW ── */}
        {showConfirmView && agreement && (
          <ConfirmView
            agreement={agreement}
            onBack={()  => setShowConfirmView(false)}
            onSuccess={handleConfirmSuccess}
          />
        )}

        {/* ── MAIN LIST VIEW ── */}
        {!showConfirmView && (
          <div className="flex" style={{ minHeight: 'calc(100vh - 220px)' }}>

            {/* Mobile overlay */}
            {mobileSidebarOpen && (
              <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
            )}

            {/* Mobile sidebar drawer */}
            <aside
              data-sidebar
              className={`fixed top-0 left-0 h-full w-[300px] bg-white border-r border-[#e5e5e5] flex flex-col z-50 md:hidden anim-drawer ${mobileSidebarOpen ? 'flex' : 'hidden'}`}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e5] bg-[#fafbfc]">
                <span className="text-[14px] font-semibold text-[#32363a]">Schedule Agreements</span>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6a6d70] hover:text-[#cc1c14] hover:bg-[#fce8e6] transition-all"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <SidebarContent />
            </aside>

            {/* Desktop sidebar */}
            <aside
              data-sidebar
              className={`hidden md:flex overflow-hidden flex-col bg-white border-r border-[#e5e5e5] sidebar-transition anim-slide-l flex-shrink-0 h-screen sticky top-0 ${sidebarCollapsed ? 'w-[56px]' : 'w-[300px] lg:w-[340px]'}`}
            >
              <SidebarContent />
            </aside>

            <main className="flex-1 bg-white overflow-hidden flex flex-col anim-slide-r min-w-0">
              {agreement ? (
                <>
                  {/* Agreement header */}
                  <div className="px-4 sm:px-6 lg:px-10 pt-5 pb-5 border-b border-[#e5e5e5] bg-gradient-to-b from-[#fafbfc] to-white flex-shrink-0">
                    <div className="flex items-center gap-3 mb-4 md:hidden">
                      <button
                        data-sidebar-toggle onClick={() => setMobileSidebarOpen(true)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#d9d9d9] text-[#6a6d70] hover:text-[#0a6ed1] hover:border-[#0a6ed1] transition-all"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M3 6h18M3 12h18M3 18h18"/>
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1.5">Schedule Agreement</div>
                        <h2 className="text-[20px] sm:text-[24px] font-bold text-[#0a6ed1] tracking-tight">{agreement.id}</h2>
                      </div>
                      <span className="text-[13px] text-[#6a6d70] bg-white px-3 py-2 rounded-lg border border-[#e5e5e5] shadow-sm whitespace-nowrap ml-3">
                        {agreement.date}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[14px]">
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">Vendor</div>
                        <div className="text-[#32363a] font-medium">{agreement.vendor}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">Plant</div>
                        <div className="text-[#32363a] font-medium">{agreement.plantName} ({agreement.plant})</div>
                      </div>
                    </div>
                  </div>

                  {/* Tab */}
                  <div className="px-4 sm:px-6 lg:px-10 pt-5 flex-shrink-0">
                    <div className="inline-flex flex-col items-center pb-2.5 border-b-2 border-[#0a6ed1]">
                      <div className="w-10 h-10 rounded-full bg-[#0a6ed1] flex items-center justify-center mb-1.5 shadow-md">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                          <path d="M9 11l3 3L22 4"/>
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                        </svg>
                      </div>
                      <span className="text-[13px] text-[#0a6ed1] font-semibold">Items</span>
                    </div>
                  </div>

                  {/* Date filters */}
                  <div className="px-4 sm:px-6 lg:px-10 py-4 border-b border-[#e5e5e5] flex-shrink-0">
                    <div className="flex flex-wrap gap-3 items-end">
                      <div>
                        <label className="block text-[12px] text-[#6a6d70] mb-1.5 font-semibold">Delivery From Date</label>
                        <input
                          type="date" value={ddmmyyyyToIso(fromDate)}
                          onChange={e => setFromDate(isoToDdmmyyyy(e.target.value))}
                          className={`w-full h-9 pl-3 pr-2 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 transition-all ${dateError ? 'border-[#cc1c14] focus:ring-[#cc1c14]/20' : 'border-[#d9d9d9] focus:border-[#0a6ed1] focus:ring-[#0a6ed1]/20'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] text-[#6a6d70] mb-1.5 font-semibold">To Date</label>
                        <input
                          type="date" value={ddmmyyyyToIso(toDate)}
                          onChange={e => setToDate(isoToDdmmyyyy(e.target.value))}
                          className={`w-full h-9 pl-3 pr-2 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 transition-all ${dateError ? 'border-[#cc1c14] focus:ring-[#cc1c14]/20' : 'border-[#d9d9d9] focus:border-[#0a6ed1] focus:ring-[#0a6ed1]/20'}`}
                        />
                      </div>
                      <button
                        onClick={() => { setFromDate(''); setToDate('') }}
                        className="h-9 px-4 text-[13px] font-semibold text-[#cc1c14] bg-[#fce8e6] rounded-lg hover:bg-[#fad6d3] transition-all self-end"
                      >
                        Clear
                      </button>
                    </div>
                    {dateError && (
                      <div className="mt-2 flex items-center gap-1.5 text-[13px] text-[#cc1c14] anim-fade">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                        </svg>
                        {dateError}
                      </div>
                    )}
                  </div>

                  {/* Items table */}
                  <div className="px-4 sm:px-6 lg:px-10 pt-4 pb-0 overflow-hidden flex flex-col" style={{ height: '40vh' }}>
                    <div className="rounded-xl border border-[#e5e5e5] shadow-sm overflow-auto flex-1">
                      <table className="w-full text-[13px]" style={{ minWidth: '640px', borderCollapse: 'collapse' }}>
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-gradient-to-b from-[#fafbfc] to-[#f5f6f7] border-b border-[#e5e5e5] text-[#6a6d70]">
                            {['Item No.', 'Material', 'HSN Code', 'Delivery Schedule', 'Delivered Quantity', 'Unit Price', 'Status', ''].map((h, i) => (
                              <th
                                key={i}
                                className={`font-semibold py-3.5 px-4 text-[11px] uppercase tracking-wider ${i === 7 ? 'w-10' : 'text-left'}`}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="row-stagger">
                          {filteredItems.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-12 text-center text-[13px] text-[#6a6d70]">No items</td>
                            </tr>
                          ) : filteredItems.map(item => (
                            <tr
                              key={item.itemNo}
                              onClick={() => handleItemClick(item)}
                              className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#ebf5ff] cursor-pointer transition-colors group"
                            >
                              <td className="py-3.5 px-4 font-semibold text-[#32363a]">{item.itemNo}</td>
                              <td className="py-3.5 px-4">
                                <div className="text-[#32363a] font-medium text-[13px]">{item.materialName}</div>
                                <div className="text-[#0a6ed1] text-[12px] font-medium">{item.materialNumber}</div>
                              </td>
                              <td className="py-3.5 px-4 text-[#32363a]">{item.hsnCode}</td>
                              <td className="py-3.5 px-4">
  <span className="font-semibold text-[#32363a]">{item.deliverySchedule}</span>{' '}
  <span className="text-[#6a6d70] text-[12px]">{item.deliveryUnit}</span>
</td>

<td className="py-3.5 px-4 text-[#32363a]">
  {item.deliveredQty}{' '}
  <span className="text-[#6a6d70] text-[12px]">{item.deliveredUnit}</span>
</td>
                              <td className="py-3.5 px-4 font-semibold text-[#32363a]">{item.unitPrice}</td>
                              <td className="py-3.5 px-4"><StatusBadge status={item.status} /></td>
                              <td className="py-3.5 px-3">
                                <svg
                                  width="15" height="15" viewBox="0 0 24 24" fill="none"
                                  stroke="currentColor" strokeWidth="2.5"
                                  className="text-[#0a6ed1] group-hover:translate-x-1 transition-transform"
                                >
                                  <path d="M9 18l6-6-6-6"/>
                                </svg>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="px-4 sm:px-6 lg:px-10 py-4 border-t border-[#e5e5e5] flex items-center justify-between gap-3 flex-shrink-0 bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">

                    {/* Create ASN button */}
                    <div className="relative group">
                      <button
                        onClick={asnDisabled(agreement.items) ? undefined : handleCreateAsn}
                        className={`flex items-center gap-2 px-4 sm:px-5 h-11 text-[14px] font-semibold text-[#0a6ed1] bg-[#ebf5ff] border border-[#0a6ed1] rounded-lg transition-all select-none ${asnDisabled(agreement.items) ? 'btn-disabled-asn' : 'hover:bg-[#d9ecff] hover:scale-[1.02] active:scale-[0.98]'}`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M12 5v14M5 12h14"/>
                        </svg>
                        Create ASN
                      </button>
                      {asnDisabled(agreement.items) && (
                        <div className="absolute bottom-full left-0 mb-2 px-3 py-1.5 bg-[#32363a] text-white text-[12px] rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                          All items need confirmation before creating ASN
                          <div className="absolute top-full left-4 border-4 border-transparent border-t-[#32363a]"/>
                        </div>
                      )}
                    </div>

                    {/* Confirm button */}
                    <button
                      onClick={canConfirm(agreement.items) ? handleConfirm : undefined}
                      disabled={!canConfirm(agreement.items)}
                      className={`flex items-center gap-2 px-4 sm:px-6 h-11 text-[14px] font-semibold text-white bg-[#0a6ed1] border border-[#0a6ed1] rounded-lg transition-all shadow-md ${canConfirm(agreement.items) ? 'hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98]' : 'opacity-40 cursor-not-allowed'}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M9 11l3 3L22 4"/>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                      </svg>
                      Confirm
                    </button>
                  </div>
                </>
              ) : (
                !loading && (
                  <div className="flex flex-col items-center justify-center h-64 text-[#6a6d70] anim-fade">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-30">
                      <path d="M9 11l3 3L22 4"/>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                    </svg>
                    <span className="text-[14px]">Select an agreement from the list</span>
                  </div>
                )
              )}
            </main>
          </div>
        )}
      </div>
    </PageLayout>
  )
}