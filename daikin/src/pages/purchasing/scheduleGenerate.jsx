import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import PageLayout from '../../layouts/PageLayout.jsx'
import { scheduleGenerateApi, generateDays, authConfig } from '../../services/ScheduleGenerate.js'
import { useUser } from '../../context/UserContext.jsx'



const formatSapDate = (v) => {
  const s = String(v ?? '').trim()
  if (s.length !== 8) return s
  return `${s.slice(6, 8)}.${s.slice(4, 6)}.${s.slice(0, 4)}`
}
const withKeys = (arr) => arr.map(it => ({ ...it, _key: `${it.itemNo}-${it.sapCode}` }))


function F4SupplierPicker({ onSelect, onClose }) {
  const [suppliers, setSuppliers] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [search,    setSearch]    = useState('')

  useEffect(() => {
    let cancelled = false
    scheduleGenerateApi.fetchAllSuppliers()
      .then(list => { if (!cancelled) { setSuppliers(list); setLoading(false) } })
      .catch(err  => { if (!cancelled) { setError(err.message || 'Failed to load suppliers'); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  const filtered = suppliers.filter(s => {
    const q = search.toLowerCase()
    return s.lifnr.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  })

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[480px] overflow-hidden flex flex-col"
        style={{ maxHeight: '75vh', animation: 'modalIn .2s ease-out both' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0a6ed1] to-[#085caf] px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-[15px] font-bold text-white">Select Supplier</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Search bar */}
        <div className="px-4 py-3 border-b border-[#e5e5e5] flex-shrink-0 bg-[#fafbfc]">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by code or name…"
              className="w-full h-9 pl-9 pr-3 text-[13px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/15 transition-all"
            />
          </div>
        </div>

        {/* Table header */}
        <div className="flex items-center px-4 py-2 bg-[#f5f6f7] border-b border-[#e5e5e5] flex-shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6a6d70] w-[110px]">Supplier Code</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6a6d70] flex-1">Supplier Name</span>
        </div>

        {/* Rows */}
        <div className="overflow-y-auto flex-1">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-[#6a6d70]">
              <div className="w-4 h-4 border-2 border-[#0a6ed1]/30 border-t-[#0a6ed1] rounded-full animate-spin" />
              Loading suppliers…
            </div>
          )}
          {!loading && error && (
            <div className="flex items-center justify-center py-10 text-[13px] text-[#cc1c14]">{error}</div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="flex items-center justify-center py-10 text-[13px] text-[#9e9e9e]">No suppliers found</div>
          )}
          {!loading && !error && filtered.map((s, idx) => (
            <button
              key={s.lifnr}
              onClick={() => onSelect(s.lifnr)}
              className={`w-full flex items-center px-4 py-3 text-left transition-colors hover:bg-[#ebf5ff] active:bg-[#d6ecff]
                ${idx !== 0 ? 'border-t border-[#f0f0f0]' : ''}`}
            >
              <span className="w-[110px] flex-shrink-0">
                <span className="inline-block px-2 py-0.5 rounded-md bg-[#ebf5ff] text-[#0a6ed1] text-[12px] font-bold tracking-wider">
                  {s.lifnr}
                </span>
              </span>
              <span className="flex-1 text-[13px] text-[#32363a] font-medium truncate">{s.name}</span>
              <svg className="ml-2 flex-shrink-0 text-[#c0c2c4]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          ))}
        </div>

        {/* Footer count */}
        {!loading && !error && (
          <div className="px-4 py-2.5 border-t border-[#e5e5e5] bg-[#fafbfc] flex-shrink-0">
            <span className="text-[11px] text-[#9e9e9e]">
              {filtered.length} of {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SUPPLIER CODE POPUP
// ═══════════════════════════════════════════════════════════════
function SupplierPopup({ onSubmit, onCancel, canCancel, disabled }) {
  const navigate = useNavigate()
  const [code,    setCode]    = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showF4,  setShowF4]  = useState(false)

  const handleSubmit = async () => {
    if (!code.trim()) { setError('Please enter a supplier code.'); return }
    setLoading(true); setError('')
    try {
      const supp = await scheduleGenerateApi.fetchSupplier(code.trim())
      if (!supp) { setError(`Supplier "${code}" not found.`); setLoading(false); return }
      onSubmit(supp)
    } catch (err) { setError(err.message || 'Failed to load supplier'); setLoading(false) }
  }

  const handleF4Select = async (lifnr) => {
    setShowF4(false)
    setCode(lifnr)
    setError('')
    setLoading(true)
    try {
      const supp = await scheduleGenerateApi.fetchSupplier(lifnr)
      if (!supp) { setError(`Supplier "${lifnr}" not found.`); setLoading(false); return }
      onSubmit(supp)
    } catch (err) { setError(err.message || 'Failed to load supplier'); setLoading(false) }
  }

  const handleCancel = () => {
    if (canCancel) { onCancel() } else { navigate(-1) }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center px-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={canCancel ? onCancel : undefined}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] overflow-hidden"
          style={{ animation: 'modalIn .22s ease-out both' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-[#0a6ed1] to-[#085caf] px-6 py-5 flex items-start justify-between">
            <div>
              <h2 className="text-[18px] font-bold text-white">Schedule Generate</h2>
              <p className="text-[13px] text-white/80 mt-1">Enter or select a supplier code to load Schedule Agreements</p>
            </div>
            {canCancel && (
              <button
                onClick={onCancel}
                className="mt-0.5 w-7 h-7 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-all flex-shrink-0"
                title="Cancel"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>

          <div className="px-6 py-6">
            <label className="block text-[13px] font-semibold text-[#32363a] mb-2">
              Supplier Code <span className="text-[#cc1c14]">*</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  autoFocus
                  type="text"
                  value={code}
                  onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
                  onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
                  placeholder="e.g. FS859"
                  className="w-full h-11 px-4 text-[15px] font-semibold border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all tracking-wider uppercase pr-3"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowF4(true)}
                disabled={loading || disabled}
                title="Open supplier value help (F4)"
                className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-lg border border-[#0a6ed1] bg-white text-[#0a6ed1] hover:bg-[#ebf5ff] active:bg-[#d6ecff] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-[#9e9e9e]">
              Type a code manually or click <span className="font-semibold text-[#0a6ed1]">⧉</span> to browse all suppliers
            </p>
            {error && (
              <div className="mt-3 flex items-center gap-1.5 text-[13px] text-[#cc1c14] bg-[#fce8e6] px-3 py-2 rounded-lg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                {error}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-[#e5e5e5] flex items-center justify-between">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-4 h-10 text-[14px] font-semibold text-[#6a6d70] hover:text-[#32363a] hover:bg-[#f5f6f7] rounded-lg transition-all disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || disabled}
              className="flex items-center gap-2 px-6 h-10 text-[14px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] transition-all shadow-md disabled:opacity-60"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {loading ? 'Loading…' : 'Load Agreements'}
            </button>
          </div>
        </div>
      </div>

      {showF4 && (
        <F4SupplierPicker
          onSelect={handleF4Select}
          onClose={() => setShowF4(false)}
        />
      )}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// DAY COUNT POPUP
// ═══════════════════════════════════════════════════════════════
function DayCountPopup({ onSubmit, onCancel }) {
  const [days, setDays] = useState('')
  const n = parseInt(days, 10)
  const valid = n >= 1 && n <= 31

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[340px]"
        style={{ animation: 'modalIn .22s ease-out both' }}>
        <div className="px-6 py-4 border-b border-[#e5e5e5]">
          <h3 className="text-[15px] font-bold text-[#32363a]">No. of Days</h3>
          <p className="text-[12px] text-[#6a6d70] mt-0.5">Quantity divided equally across valid working days</p>
        </div>
        <div className="px-6 py-5">
          <input
            autoFocus
            type="number"
            min="1"
            max="31"
            value={days}
            onChange={e => setDays(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && valid) onSubmit(n) }}
            placeholder="e.g. 5"
            className="w-full h-11 px-4 text-[16px] font-bold text-center border border-[#0a6ed1] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all"
          />
        </div>
        <div className="px-6 py-4 border-t border-[#e5e5e5] flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 h-9 text-[13px] font-semibold text-[#6a6d70] hover:bg-[#f5f6f7] rounded-lg transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => valid && onSubmit(n)}
            disabled={!valid}
            className="px-5 h-9 text-[13px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] transition-all shadow-md disabled:opacity-50"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Status helpers ────────────────────────────────────────────
const STATUS_STYLE = {
  'Approved':          'text-[#107e3e] bg-[#e8f5ec]',
  'Sent for approval': 'text-[#0a6ed1] bg-[#ebf5ff]',
  'In Draft':          'text-[#e76500] bg-[#fff3e8]',
  'Not Generated':     'text-[#6a6d70] bg-[#f5f6f7]',
}
const STATUS_DOT = {
  'Approved':          '#107e3e',
  'Sent for approval': '#0a6ed1',
  'In Draft':          '#e76500',
  'Not Generated':     '#6a6d70',
}
const getStatusStyle = s => STATUS_STYLE[s] || 'text-[#b45309] bg-[#fef7e6]'
const getStatusDot   = s => STATUS_DOT[s]   || '#b45309'

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ScheduleGenerate() {
  const navigate = useNavigate()
  const location = useLocation()

  const [supplier,          setSupplier]          = useState(null)
  const [agreement,         setAgreement]         = useState(null)
  const [items,             setItems]             = useState([])
  const [fromDate,          setFromDate]          = useState('')
  const [toDate,            setToDate]            = useState('')
  const [selectedItems,     setSelectedItems]     = useState(new Set())
  const [showDayPopup,      setShowDayPopup]      = useState(false)
  const [showSupplierPopup, setShowSupplierPopup] = useState(
    () => !location.state?.restoreData?.supplier
  )
  const [busy,              setBusy]              = useState(false)
  const [busyLabel,         setBusyLabel]         = useState('')

  const { user, loginId, loginType, loading: userLoading } = useUser()
  const isApprover = user?.Groups?.includes('Approver') || false

  // Sidebar state (approver only)
  const [sidebarCollapsed,    setSidebarCollapsed]    = useState(false)
  const [mobileSidebarOpen,   setMobileSidebarOpen]   = useState(false)
  const [agreements,          setAgreements]          = useState([])
  const [selectedAgreementId, setSelectedAgreementId] = useState(null)
  const [sidebarLoading,      setSidebarLoading]      = useState(false)
  const [sidebarError,        setSidebarError]        = useState(null)
  const [searchQuery,         setSearchQuery]         = useState('')
  const [selectedPlants,      setSelectedPlants]      = useState([])
  const [filterOpen,          setFilterOpen]          = useState(false)
  const filterRef = useRef(null)

  useEffect(() => {
    if (isApprover) setShowSupplierPopup(false)
  }, [isApprover])

  useEffect(() => {
    if (userLoading) return
    if (!loginId || !loginType) return
    authConfig.loginId   = loginId
    authConfig.loginType = loginType
  }, [userLoading, loginId, loginType])

  useEffect(() => {
    const ret     = location.state?.returnData
    const restore = location.state?.restoreData
    if (!ret && !restore) return
    if (restore?.supplier && restore?.agreement) {
  setSupplier(restore.supplier)
  setAgreement(restore.agreement)
  setSelectedAgreementId(restore.agreement.id)
  setShowSupplierPopup(false)
  if (ret) {
    const { savedLines, pendingIndicator } = ret
    const baseItems = restore.agreement.items.map(it => ({ ...it }))
    setItems(withKeys(baseItems.map(it => {
      const saved = savedLines?.find(sl => sl.itemNo === it.itemNo)
      if (!saved) return it
      return {
        ...it,
        days:       [...saved.days],
        frozenDays: saved.frozenDays ?? it.frozenDays,
        status:     'In Draft',
        ...(pendingIndicator ? { indicator: pendingIndicator } : {}),
      }
    })))
  } else {
    setItems(withKeys(restore.agreement.items.map(it => ({ ...it }))))
    setSelectedItems(new Set())
  }
}
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.state?.returnData, location.state?.restoreData]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSupplierSubmit = supp => {
    setShowSupplierPopup(false)
    setSupplier(supp)
    if (supp.agreements.length > 0) {
      const ag = supp.agreements[0]
      setAgreement(ag)
      setItems(withKeys(ag.items.map(it => ({ ...it }))))
      setSelectedItems(new Set())
    }
  }

  const handleChangeSupplier = () => {
    setSupplier(null)
    setAgreement(null)
    setItems([])
    setSelectedItems(new Set())
    setShowSupplierPopup(true)
  }

  // ── Approver sidebar logic ──
  useEffect(() => {
    if (!isApprover) return
    if (userLoading || !loginId || !loginType) return
    let cancelled = false
    setSidebarLoading(true)
    setSidebarError(null)
    scheduleGenerateApi.listAgreements({ search: searchQuery, plants: selectedPlants })
      .then(data => { if (!cancelled) setAgreements(data) })
      .catch(err  => { if (!cancelled) setSidebarError(err.message) })
      .finally(()  => { if (!cancelled) setSidebarLoading(false) })
    return () => { cancelled = true }
  }, [isApprover, userLoading, loginId, loginType, searchQuery, selectedPlants])

  useEffect(() => {
    if (!isApprover) return
    if (!selectedAgreementId && agreements.length > 0) {
      const first = agreements[0]
      handleSelectAgreement(first.id, first.lifnr, first.vendor, first)
    }
  }, [isApprover, agreements, selectedAgreementId])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterOpen && filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [filterOpen])

  const handleSelectAgreement = async (id, lifnr, vendorName, agInfo) => {
  setSelectedAgreementId(id)
  setMobileSidebarOpen(false)
  setItems([])
  setSelectedItems(new Set())
  setBusy(true)
  setBusyLabel('Loading items…')
  try {
    const details = await scheduleGenerateApi.getAgreementDetails(id, lifnr, isApprover)
    if (details) {
      setSupplier({ code: lifnr, name: vendorName, agreements: [details] })
      setAgreement(agInfo || { id })
      setItems(withKeys(details.items || []))
    }
  } catch (err) {
    console.error(err)
    setSidebarError(err.message)
  } finally {
    setBusy(false)
    setBusyLabel('')
  }
}
  const toggleItem = key => setSelectedItems(prev => {
  const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n
})
const toggleAll = () =>
  setSelectedItems(selectedItems.size === items.length
    ? new Set()
    : new Set(items.map(i => i._key)))

const selArr     = Array.from(selectedItems)
const allHaveW   = selArr.length > 0 && selArr.every(k => items.find(i => i._key === k)?.indicator === 'W')
const allHaveD   = selArr.length > 0 && selArr.every(k => items.find(i => i._key === k)?.indicator === 'D')
const anyHaveD   = selArr.some(k => items.find(i => i._key === k)?.indicator === 'D')
const anyHaveW   = selArr.some(k => items.find(i => i._key === k)?.indicator === 'W')
const anyHaveInd = selArr.some(k => items.find(i => i._key === k)?.indicator)

  const weekDisabled = selArr.length === 0 || anyHaveD || busy
  const dayDisabled  = selArr.length === 0 || anyHaveW || busy
  const editDisabled = selArr.length === 0 || !anyHaveInd || busy

  const openScheduleLines = (selectedKeys, editable, title, mode, pendingIndicator, overrideItems) => {
  const itemsForLines = (overrideItems ?? items).filter(it => selectedKeys.includes(it._key))
  navigate('/purchasing/schedule-lines', {
    state: {
      selectedItemNos: itemsForLines.map(it => it.itemNo),
      editable,
      title,
      mode,
      pendingIndicator,
      agreementId:   agreement.id,
      supplierCode:  supplier.code,
      supplierName:  supplier.name,
      plantName:     agreement.plantName,
      companyCode:   agreement.companyCode,
      agreementDate: formatSapDate(agreement.date),
      itemsData:     itemsForLines,
      supplierFull:  supplier,
      agreementFull: { ...agreement, items },
    },
  })
}
  const handleWeek = () => {
  if (weekDisabled) return
  const itemsWithDays = items
    .filter(it => selArr.includes(it._key))
    .map(it => ({ ...it, days: generateDays(it.totalQuantity, 'week', null), indicator: 'W' }))
  openScheduleLines(selArr, true, 'Schedule Lines — Week', 'WEEKLY', 'W', itemsWithDays)
}

  const handleDayClick = () => { if (!dayDisabled) setShowDayPopup(true) }

 const handleDayGenerate = (dayCount) => {
  setShowDayPopup(false)
  const itemsWithDays = items
    .filter(it => selArr.includes(it._key))
    .map(it => ({ ...it, days: generateDays(it.totalQuantity, 'day', dayCount), indicator: 'D' }))
  navigate('/purchasing/schedule-lines', {
    state: {
      selectedItemNos:  itemsWithDays.map(it => it.itemNo),
      editable:         true,
      title:            `Schedule Lines — Day (${dayCount})`,
      mode:             'DAILY',
      dayCount,
      pendingIndicator: 'D',
      agreementId:      agreement.id,
      supplierCode:     supplier.code,
      supplierName:     supplier.name,
      plantName:        agreement.plantName,
      companyCode:      agreement.companyCode,
      agreementDate:    agreement.date,
      itemsData:        itemsWithDays,
      supplierFull:     supplier,
      agreementFull:    agreement,
    },
  })
}

  const handleEdit = async () => {
  if (editDisabled || busy) return
  const editableKeys = selArr.filter(k => items.find(i => i._key === k)?.indicator)
  if (editableKeys.length === 0) return
  setBusy(true)
  setBusyLabel('Loading…')
  try {
    const editableNos = editableKeys.map(k => items.find(i => i._key === k)?.itemNo)
    const dayMap = await scheduleGenerateApi.fetchItemDays(agreement.id, supplier.code, editableNos)
    const mergedItems = items.map(it => {
      if (!editableKeys.includes(it._key)) return it
      const key     = String(it.itemNo).trim().replace(/^0+/, '')
      const fetched = dayMap[key]
      if (!fetched) return it
      return { ...it, days: fetched.days, frozenDays: fetched.frozenDays ?? it.frozenDays }
    })
    openScheduleLines(editableKeys, true, 'Edit Schedule Lines', '', undefined, mergedItems)
  } catch (err) {
    console.error('Failed to load schedule lines for edit:', err)
    alert(`Failed to load saved data: ${err.message}`)
  } finally {
    setBusy(false)
    setBusyLabel('')
  }
}

  const handleSendForApproval = async () => {
  if (selArr.length === 0 || busy) return
  setBusy(true); setBusyLabel('Sending…')
  try {
    const selectedItemData = items.filter(it => selArr.includes(it._key))
    await scheduleGenerateApi.sendForApproval(agreement.id, supplier.code, selectedItemData)
    setItems(prev => prev.map(it => {
      if (!selectedItems.has(it._key)) return it
      if (it.status === 'In Draft') return { ...it, status: 'Sent for approval' }
      return it
    }))
  } catch (err) {
    console.error('sendForApproval error:', err)
    alert(`Send for approval failed: ${err.message}`)
  } finally {
    setBusy(false); setBusyLabel('')
  }
}

const handleApprove = async () => {
  if (selArr.length === 0 || busy) return
  setBusy(true); setBusyLabel('Saving…')
  try {
    const selectedItemData = items.filter(it => selArr.includes(it._key))
    await scheduleGenerateApi.approveSchedule(agreement.id, supplier.code, selectedItemData)
    setItems(prev => prev.map(it => {
      if (!selectedItems.has(it._key)) return it
      if (it.status === 'In Draft')          return { ...it, status: 'Sent for approval' }
      if (it.status === 'Sent for approval') return { ...it, status: 'Approved' }
      return it
    }))
  } catch (err) {
    console.error('approveSet error:', err)
    alert(`Approval failed: ${err.message}`)
  } finally {
    setBusy(false); setBusyLabel('')
  }
}

  const handleViewItem = async (e, item) => {
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    setBusyLabel('Loading…')
    try {
      const dayMap = await scheduleGenerateApi.fetchItemDaysApprover(agreement.id, supplier.code, [item.itemNo])
      const key = String(item.itemNo).trim().replace(/^0+/, '')
      const fetched = dayMap[key]
      const mergedItem = fetched ? { ...item, days: fetched.days, frozenDays: fetched.frozenDays ?? item.frozenDays } : item
      openScheduleLines([item._key], false, 'View Schedule Lines', '', undefined, [mergedItem])
    } catch (err) {
      console.error('Failed to load schedule lines for view:', err)
      alert(`Failed to load data: ${err.message}`)
    } finally {
      setBusy(false)
      setBusyLabel('')
    }
  }

  // ── Shared table JSX ──────────────────────────────────────────
  const ItemsTable = () => (
    <div className="rounded-xl border border-[#e5e5e5] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] border-collapse" style={{ minWidth: '800px' }}>
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-b from-[#fafbfc] to-[#f5f6f7] text-[#6a6d70]">
              <th className="py-3 px-3 border-b border-r border-[#e5e5e5] w-10 text-center">
                <input
                  type="checkbox"
                  checked={selectedItems.size === items.length && items.length > 0}
                  onChange={toggleAll}
                  className="accent-[#0a6ed1] w-4 h-4 cursor-pointer"
                />
              </th>
              {['Item No.', 'SAP Code', 'Description', 'HSN Code',
                'Total Monthly Schedule', 'Unit Price', 'Indicator', 'Status', ...(isApprover ? [''] : [])].map((h, i) => (
                <th key={i}
                  className="text-center font-semibold py-3 px-3 border-b border-r border-[#e5e5e5] uppercase tracking-wider text-[10px] sm:text-[11px] last:border-r-0">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="row-stagger">
            {items.map(item => {
              const checked = selectedItems.has(item._key)
              return (
                <tr key={item._key} onClick={() => toggleItem(item._key)}
                  className={`border-b border-[#f0f0f0] transition-colors cursor-pointer
                    ${checked ? 'bg-[#ebf5ff]' : 'hover:bg-[#ebf5ff]/40'}`}>
                  <td className="py-3 px-3 text-center border-r border-[#f0f0f0]" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={checked} onChange={() => toggleItem(item._key)}
                      className="accent-[#0a6ed1] w-4 h-4 cursor-pointer" />
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-[#32363a] border-r border-[#f0f0f0]">{item.itemNo}</td>
                  <td className="py-3 px-3 text-center font-semibold text-[#0a6ed1] border-r border-[#f0f0f0]">{item.sapCode}</td>
                  <td className="py-3 px-3 text-center text-[#32363a] font-medium border-r border-[#f0f0f0]">{item.description}</td>
                  <td className="py-3 px-3 text-center text-[#32363a] border-r border-[#f0f0f0]">{item.hsnCode}</td>
                  <td className="py-3 px-3 text-center font-bold text-[#32363a] tabular-nums border-r border-[#f0f0f0]">{item.totalQuantity.toLocaleString()}</td>
                  <td className="py-3 px-3 text-center font-semibold tabular-nums border-r border-[#f0f0f0]">{item.unitPrice.toFixed(2)}</td>
                  <td className="py-3 px-3 text-center border-r border-[#f0f0f0]">
                    {item.indicator
                      ? <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[12px] font-bold
                          ${item.indicator === 'W' ? 'bg-[#ebf5ff] text-[#0a6ed1]' : 'bg-[#fff3e8] text-[#e76500]'}`}>
                          {item.indicator}
                        </span>
                      : <span className="text-[#d9d9d9]">—</span>}
                  </td>
                  <td className="py-3 px-3 text-center border-r border-[#f0f0f0] last:border-r-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${getStatusStyle(item.status)}`}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getStatusDot(item.status) }} />
                      {item.status}
                    </span>
                  </td>
                  {isApprover && (
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleViewItem(e, item)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-[#6a6d70] hover:text-[#0a6ed1] hover:bg-[#ebf5ff] transition-colors"
                        title="View Schedule Lines"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M9 18l6-6-6-6"/>
                        </svg>
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )

  // ── Sidebar content (approver only) ──────────────────────────
  const SidebarContent = () => {
    const plants = Array.from(new Set(agreements.map(a => a.plant))).sort()
    return (
      <>
        <div className="px-4 py-4 border-b border-[#e5e5e5] flex-shrink-0">
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-semibold text-[#32363a]">Pending Approval</h3>
              <span className="text-[12px] text-[#6a6d70] bg-[#f5f6f7] px-2.5 py-1 rounded-full font-medium">
                {agreements.length}
              </span>
            </div>
          )}
          {sidebarCollapsed ? (
            <div className="flex justify-center">
              <button onClick={() => setSidebarCollapsed(false)} className="w-9 h-9 flex items-center justify-center text-[#6a6d70] hover:text-[#0a6ed1] rounded-lg hover:bg-[#f0f7ff] transition-all">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
                </svg>
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full h-10 pl-3.5 pr-16 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all"
              />
              <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="w-7 h-7 flex items-center justify-center text-[#6a6d70] hover:text-[#cc1c14] rounded transition-all">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                )}
                <div className="w-7 h-7 flex items-center justify-center text-[#6a6d70]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {sidebarError && !sidebarCollapsed && (
            <div className="px-4 py-3 text-[13px] text-[#cc1c14] bg-[#fce8e6] border-b border-[#fad6d3]">{sidebarError}</div>
          )}
          {sidebarLoading && agreements.length === 0 ? (
            <div className="px-4 py-12 text-center text-[13px] text-[#6a6d70]">Loading…</div>
          ) : sidebarCollapsed ? (
            agreements.map(a => {
              const isSelected = a.id === selectedAgreementId
              return (
                <button
                  key={a.id} onClick={() => handleSelectAgreement(a.id, a.lifnr, a.vendor, a)} title={`${a.vendor} (${a.id})`}
                  className={`w-full flex items-center justify-center py-3 border-b border-[#e5e5e5] transition-all border-l-[3px] ${isSelected ? 'bg-[#ebf5ff] border-l-[#0a6ed1]' : 'hover:bg-[#f5f6f7] border-l-transparent'}`}
                >
                  <span className={`text-[11px] font-bold ${isSelected ? 'text-[#0a6ed1]' : 'text-[#6a6d70]'}`}>{a.id.slice(-3)}</span>
                </button>
              )
            })
          ) : (
            <>
              {agreements.map(a => {
                const isSelected = a.id === selectedAgreementId
                return (
                  <button
                    key={a.id} onClick={() => handleSelectAgreement(a.id, a.lifnr, a.vendor, a)}
                    className={`w-full text-left px-4 py-3.5 border-b border-[#e5e5e5] transition-all border-l-[3px] ${isSelected ? 'bg-[#ebf5ff] border-l-[#0a6ed1]' : 'hover:bg-[#f5f6f7] border-l-transparent'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[14px] font-bold text-[#0a6ed1]">{a.id}</span>
                    </div>
                    <div className="text-[12px] text-[#32363a] font-semibold mb-1 leading-tight truncate">
                      {a.vendor} <span className="text-[#6a6d70] font-normal">({a.lifnr})</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#6a6d70]">
                      <span>{a.plant}</span>
                      <span>{formatSapDate(a.date)}</span>
                    </div>
                  </button>
                )
              })}
              {agreements.length === 0 && !sidebarLoading && (
                <div className="px-4 py-12 text-center text-[13px] text-[#6a6d70]">
                  No agreements pending approval.
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
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18l-7 9v6l-4-2v-4L3 4z"/></svg>
              {selectedPlants.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#cc1c14] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">{selectedPlants.length}</span>
              )}
            </button>
            {filterOpen && (
              <div className="absolute bottom-11 left-0 w-60 bg-white border border-[#d9d9d9] rounded-lg shadow-xl z-50">
                <div className="px-3.5 py-2.5 border-b border-[#e5e5e5] flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-[#32363a]">Filter by Plant</span>
                  {selectedPlants.length > 0 && (
                    <button onClick={() => setSelectedPlants([])} className="text-[12px] text-[#0a6ed1] hover:underline">Clear</button>
                  )}
                </div>
                <div className="max-h-[200px] overflow-y-auto py-1.5">
                  {plants.length === 0 ? (
                    <div className="px-3.5 py-2 text-[12px] text-[#6a6d70]">No plants available</div>
                  ) : plants.map(p => (
                    <label key={p} className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#f5f6f7] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPlants.includes(p)}
                        onChange={e => setSelectedPlants(prev => e.target.checked ? [...prev, p] : prev.filter(x => x !== p))}
                        className="accent-[#0a6ed1] w-4 h-4"
                      />
                      <span className="text-[13px] text-[#32363a]">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-9 h-9 flex items-center justify-center text-[#6a6d70] hover:bg-[#f5f6f7] rounded-lg transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease' }}>
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
        </div>
      </>
    )
  }

  // ── Shared header + action bar + table ───────────────────────
  const MainContent = () => (
    <main className="bg-white" style={{ minHeight: isApprover ? 'calc(100vh - 220px)' : 'calc(100vh - 104px)' }}>

      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-10 pt-5 pb-4 border-b border-[#e5e5e5] bg-gradient-to-b from-[#fafbfc] to-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">Schedule Agreement</div>
            <h1 className="text-[22px] sm:text-[26px] font-bold text-[#0a6ed1] tracking-tight">{agreement.id}</h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3 flex-wrap justify-end">
            <span className="text-[14px] font-semibold text-[#32363a] bg-white px-4 py-2 rounded-lg border border-[#e5e5e5] shadow-sm">
              {formatSapDate(agreement.date)}
            </span>
            {!isApprover && (
              <button
                onClick={handleChangeSupplier}
                className="h-9 px-3 text-[12px] font-semibold text-[#0a6ed1] border border-[#0a6ed1] rounded-lg hover:bg-[#ebf5ff] active:bg-[#d6ecff] transition-all flex items-center gap-1.5 shadow-sm"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Change Supplier
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[13px]">
          {[
            { l: 'Vendor Code',  v: supplier.code },
            { l: 'Vendor Name',  v: supplier.name },
            { l: 'Plant',        v: agreement.plantName },
            { l: 'Company Code', v: agreement.companyCode },
          ].map(({ l, v }) => (
            <div key={l}>
              <span className="text-[#6a6d70] text-[11px] uppercase tracking-wider font-semibold">{l}</span>
              <div className="text-[#32363a] font-semibold mt-0.5">{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Action bar */}
      <div className="px-4 sm:px-6 lg:px-10 py-3 border-b border-[#e5e5e5] bg-[#fafbfc]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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

          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {!isApprover && (
              <>
                <div className="flex items-center border border-[#d9d9d9] rounded-lg overflow-hidden bg-white">
                  <button
                    onClick={handleWeek} disabled={weekDisabled}
                    className={`flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold transition-all disabled:opacity-40
                      ${allHaveW ? 'bg-[#0a6ed1] text-white' : 'text-[#32363a] hover:bg-[#f5f6f7]'}`}
                    title={anyHaveD ? 'Selected items are locked to Day mode' : ''}
                  >
                    <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${allHaveW ? 'border-white' : 'border-[#0a6ed1]'}`}>
                      {allHaveW && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    Week
                  </button>
                  <div className="w-px h-4 bg-[#d9d9d9]" />
                  <button
                    onClick={handleDayClick} disabled={dayDisabled}
                    className={`flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold transition-all disabled:opacity-40
                      ${allHaveD ? 'bg-[#0a6ed1] text-white' : 'text-[#32363a] hover:bg-[#f5f6f7]'}`}
                    title={anyHaveW ? 'Selected items are locked to Week mode' : ''}
                  >
                    <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${allHaveD ? 'border-white' : 'border-[#0a6ed1]'}`}>
                      {allHaveD && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    Day
                  </button>
                </div>
                <button
                  onClick={handleEdit} disabled={editDisabled}
                  className="h-8 px-3 text-[12px] font-semibold text-white bg-[#e76500] rounded-lg hover:bg-[#c55600] transition-all shadow-sm disabled:opacity-40"
                  title={selArr.length > 0 && !anyHaveInd ? 'Assign Week or Day indicator first' : ''}
                >
                  Edit
                </button>
                <button
                  onClick={handleSendForApproval}
                  disabled={selArr.length === 0 || busy || selArr.some(k => items.find(i => i._key === k)?.status !== 'In Draft')}
                  className="h-8 px-3 text-[12px] font-semibold text-white bg-[#107e3e] rounded-lg hover:bg-[#0d6633] transition-all shadow-sm disabled:opacity-40"
                  title={selArr.some(k => items.find(i => i._key === k)?.status !== 'In Draft') ? 'Can only send items that are In Draft' : ''}
                >
                  {busy && busyLabel === 'Sending…' ? 'Sending…' : 'Send for approval'}
                </button>
              </>
            )}
            {isApprover && (
              <button
                onClick={handleApprove}
                disabled={selArr.length === 0 || busy || selArr.some(k => { const s = items.find(i => i._key === k)?.status; return s === 'Not Generated' || s === 'In Draft' || s === 'Approved' })}
                className="h-8 px-3 text-[12px] font-semibold text-white bg-[#107e3e] rounded-lg hover:bg-[#0d6633] transition-all shadow-sm disabled:opacity-40"
              >
                {busy && busyLabel === 'Saving…' ? 'Saving…' : 'Approve'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="px-4 sm:px-6 lg:px-10 py-4">
        {ItemsTable()}
      </div>
    </main>
  )

  // ══════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════
  return (
    <PageLayout>
      <style>{`
        @keyframes fadeIn  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes modalIn { from { opacity:0; transform:scale(0.94) translateY(-8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .row-stagger > * { animation: fadeIn .3s ease-out both; }
        .row-stagger > *:nth-child(1) { animation-delay: .02s; }
        .row-stagger > *:nth-child(2) { animation-delay: .05s; }
        .row-stagger > *:nth-child(3) { animation-delay: .08s; }
        .row-stagger > *:nth-child(4) { animation-delay: .11s; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
      `}</style>

      {showSupplierPopup && (
        <SupplierPopup
          onSubmit={handleSupplierSubmit}
          onCancel={() => setShowSupplierPopup(false)}
          canCancel={!!supplier}
          disabled={userLoading}
        />
      )}

      {showDayPopup && (
        <DayCountPopup
          onSubmit={handleDayGenerate}
          onCancel={() => setShowDayPopup(false)}
        />
      )}

      {busy && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
          <div className="bg-white rounded-xl shadow-2xl px-8 py-6 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-[#0a6ed1]/30 border-t-[#0a6ed1] rounded-full animate-spin" />
            <span className="text-[14px] font-semibold text-[#32363a]">{busyLabel}</span>
          </div>
        </div>
      )}

      {isApprover ? (
        // ── APPROVER LAYOUT ──────────────────────────────────────
        <div className="flex h-[calc(100vh-104px)] bg-[#f5f6f7] overflow-hidden">

          {/* Mobile backdrop */}
          {mobileSidebarOpen && (
            <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
          )}

          {/* Mobile sidebar */}
          <aside
            data-sidebar
            className={`fixed top-[104px] left-0 h-[calc(100vh-104px)] w-[300px] bg-white border-r border-[#e5e5e5] flex flex-col z-50 md:hidden ${mobileSidebarOpen ? 'flex' : 'hidden'}`}
          >
            {SidebarContent()}
          </aside>

          {/* Desktop sidebar */}
          <aside
            data-sidebar
            className={`hidden md:flex overflow-hidden flex-col bg-white border-r border-[#e5e5e5] flex-shrink-0 sticky top-[104px] ${sidebarCollapsed ? 'w-[56px]' : 'w-[300px] lg:w-[340px]'}`}
            style={{ transition: 'width 0.25s ease' }}
          >
            {SidebarContent()}
          </aside>

          {/* Main content area */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#f5f6f7] relative">

            {/* Mobile top bar */}
            <div className="md:hidden bg-white border-b border-[#e5e5e5] px-4 py-3 flex items-center sticky top-0 z-30">
              <button onClick={() => setMobileSidebarOpen(true)} className="p-1.5 -ml-1.5 text-[#6a6d70] hover:bg-[#f5f6f7] rounded-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
              <h2 className="ml-2 text-[15px] font-bold text-[#32363a]">Pending Approval</h2>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-auto">
              {!supplier && (
                <div className="h-[calc(100vh-200px)] flex items-center justify-center">
                  <div className="text-center text-[#6a6d70]">
                    <svg className="mx-auto mb-3 opacity-30" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                    <p className="text-[13px]">Select an agreement from the sidebar.</p>
                  </div>
                </div>
              )}
              {supplier && !agreement && (
                <div className="flex items-center justify-center h-[calc(100vh-200px)] text-[#6a6d70]">
                  No agreements found for supplier <span className="font-semibold ml-1">{supplier.code}</span>.
                </div>
              )}
              {supplier && agreement && MainContent()}
            </div> {/* end overflow-auto */}
          </div> {/* end flex-1 main column */}
        </div> 

      ) : (
        // ── NON-APPROVER LAYOUT ──────────────────────────────────
        <div className="bg-[#f5f6f7] min-h-[calc(100vh-104px)]">
          {!supplier && (
            <div className="flex items-center justify-center h-[calc(100vh-104px)]">
              <div className="text-center text-[#6a6d70]">
                <svg className="mx-auto mb-3 opacity-30" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <p className="text-[13px]">Enter a supplier code to get started.</p>
              </div>
            </div>
          )}
          {supplier && !agreement && (
            <div className="flex items-center justify-center h-[calc(100vh-200px)] text-[#6a6d70]">
              No agreements found for supplier <span className="font-semibold ml-1">{supplier.code}</span>.
            </div>
          )}
          {supplier && agreement && MainContent()}
        </div>
      )}
    </PageLayout>
  )
}