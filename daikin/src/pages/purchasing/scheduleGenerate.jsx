import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import PageLayout from '../../layouts/PageLayout.jsx'
import { scheduleGenerateApi, generateDays, authConfig } from '../../services/ScheduleGenerate.js'
import { useUser } from '../../context/UserContext.jsx'

// const SS_KEY = 'scheduleGenerate_state'

// function loadSession() {
//   try {
//     const raw = sessionStorage.getItem(SS_KEY)
//     return raw ? JSON.parse(raw) : null
//   } catch { return null }
// }
// function saveSession(data) {
//   try { sessionStorage.setItem(SS_KEY, JSON.stringify(data)) } catch {}
// }
// function clearSession() {
//   try { sessionStorage.removeItem(SS_KEY) } catch {}
// }

// ═══════════════════════════════════════════════════════════════
// F4 SUPPLIER PICKER  (value help modal)
// ═══════════════════════════════════════════════════════════════
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
              {/* Code pill */}
              <span className="w-[110px] flex-shrink-0">
                <span className="inline-block px-2 py-0.5 rounded-md bg-[#ebf5ff] text-[#0a6ed1] text-[12px] font-bold tracking-wider">
                  {s.lifnr}
                </span>
              </span>
              {/* Name */}
              <span className="flex-1 text-[13px] text-[#32363a] font-medium truncate">{s.name}</span>
              {/* Arrow */}
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
// SUPPLIER CODE POPUP  (with F4 icon)
// ═══════════════════════════════════════════════════════════════
function SupplierPopup({ onSubmit, onCancel, canCancel, disabled }) {
  const [code,       setCode]       = useState('')
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [showF4,     setShowF4]     = useState(false)

  const handleSubmit = async () => {
    if (!code.trim()) { setError('Please enter a supplier code.'); return }
    setLoading(true); setError('')
    try {
      const supp = await scheduleGenerateApi.fetchSupplier(code.trim())
      if (!supp) { setError(`Supplier "${code}" not found.`); setLoading(false); return }
      onSubmit(supp)
    } catch (err) { setError(err.message || 'Failed to load supplier'); setLoading(false) }
  }

  // User picks from F4 picker → set code then auto-submit
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
          {/* Modal header */}
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

            {/* Input row with F4 button */}
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

              {/* F4 value help button */}
              <button
                type="button"
                onClick={() => setShowF4(true)}
                disabled={loading || disabled}
                title="Open supplier value help (F4)"
                className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-lg border border-[#0a6ed1] bg-white text-[#0a6ed1] hover:bg-[#ebf5ff] active:bg-[#d6ecff] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Copy/value-help icon */}
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
            </div>

            {/* F4 hint text */}
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
            {/* Keyboard shortcut hint */}
            <span className="text-[11px] text-[#9e9e9e] hidden sm:inline">Press Enter to load</span>
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

      {/* F4 picker rendered on top (z-300 > z-200) */}
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

// ── Status helpers ───────────────────────────────────────────
const STATUS_STYLE = {
  'Generated':     'text-[#107e3e] bg-[#e8f5ec]',
  'In Approval':   'text-[#0a6ed1] bg-[#ebf5ff]',
  'In Draft':      'text-[#e76500] bg-[#fff3e8]',
  'Not Generated': 'text-[#6a6d70] bg-[#f5f6f7]',
}
const STATUS_DOT = {
  'Generated':     '#107e3e',
  'In Approval':   '#0a6ed1',
  'In Draft':      '#e76500',
  'Not Generated': '#6a6d70',
}
const getStatusStyle = s => STATUS_STYLE[s] || 'text-[#b45309] bg-[#fef7e6]'
const getStatusDot   = s => STATUS_DOT[s]   || '#b45309'

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ScheduleGenerate() {
  const navigate = useNavigate()
  const location = useLocation()
  // const session = loadSession()

  // const [supplier,          setSupplier]          = useState(session?.supplier  ?? null)
  // const [agreement,         setAgreement]         = useState(session?.agreement ?? null)
  // const [items,             setItems]             = useState(session?.items     ?? [])
  const [supplier, setSupplier] = useState(null)
  const [agreement, setAgreement] = useState(null)
  const [items, setItems] = useState([])
  const [fromDate,          setFromDate]          = useState('')
  const [toDate,            setToDate]            = useState('')
  const [selectedItems,     setSelectedItems]     = useState(new Set())
  const [showDayPopup,      setShowDayPopup]      = useState(false)
  // const [showSupplierPopup, setShowSupplierPopup] = useState(!session?.supplier)
  const [showSupplierPopup, setShowSupplierPopup] = useState(true)
  const [busy,              setBusy]              = useState(false)
  const [busyLabel,         setBusyLabel]         = useState('')

  const { loginId, loginType, loading: userLoading } = useUser()

  useEffect(() => {
    if (userLoading) return
    if (!loginId || !loginType) return
    authConfig.loginId   = loginId
    authConfig.loginType = loginType
  }, [userLoading, loginId, loginType])

  // useEffect(() => {
  //   if (supplier) saveSession({ supplier, agreement, items })
  // }, [supplier, agreement, items])

  useEffect(() => {
    const ret = location.state?.returnData
    if (!ret) return
    const { savedLines, pendingIndicator } = ret
    setItems(prev => {
      const next = prev.map(it => {
        const saved = savedLines.find(sl => sl.itemNo === it.itemNo)
        if (!saved) return it
        return {
          ...it,
          days:      [...saved.days],
          frozenDays: saved.frozenDays ?? it.frozenDays,
          status:    'In Draft',
          ...(pendingIndicator ? { indicator: pendingIndicator } : {}),
        }
      })
      // saveSession({ supplier, agreement, items: next })
      return next
    })
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.state?.returnData]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (location.state?.preserveSupplier) {
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state?.preserveSupplier]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSupplierSubmit = supp => {
    setShowSupplierPopup(false)
    setSupplier(supp)
    if (supp.agreements.length > 0) {
      const ag = supp.agreements[0]
      setAgreement(ag)
      const newItems = ag.items.map(it => ({ ...it }))
      setItems(newItems)
      setSelectedItems(new Set())
      // saveSession({ supplier: supp, agreement: ag, items: newItems })
    }
  }

  const handleChangeSupplier = () => {
    // clearSession()
    setSupplier(null)
    setAgreement(null)
    setItems([])
    setSelectedItems(new Set())
    setShowSupplierPopup(true)
  }

  const toggleItem = itemNo => setSelectedItems(prev => {
    const n = new Set(prev); n.has(itemNo) ? n.delete(itemNo) : n.add(itemNo); return n
  })
  const toggleAll = () =>
    setSelectedItems(selectedItems.size === items.length
      ? new Set()
      : new Set(items.map(i => i.itemNo)))

  const selArr     = Array.from(selectedItems)
  const allHaveW   = selArr.length > 0 && selArr.every(no => items.find(i => i.itemNo === no)?.indicator === 'W')
  const allHaveD   = selArr.length > 0 && selArr.every(no => items.find(i => i.itemNo === no)?.indicator === 'D')
  const anyHaveD   = selArr.some(no => items.find(i => i.itemNo === no)?.indicator === 'D')
  const anyHaveW   = selArr.some(no => items.find(i => i.itemNo === no)?.indicator === 'W')
  const anyHaveInd = selArr.some(no => items.find(i => i.itemNo === no)?.indicator)

  const weekDisabled = selArr.length === 0 || anyHaveD || busy
  const dayDisabled  = selArr.length === 0 || anyHaveW || busy
  const editDisabled = selArr.length === 0 || !anyHaveInd || busy

  const openScheduleLines = (selectedItemNos, editable, title, mode, pendingIndicator, overrideItems) => {
    const itemsForLines = (overrideItems ?? items).filter(it => selectedItemNos.includes(it.itemNo))
    navigate('/purchasing/schedule-lines', {
      state: {
        selectedItemNos,
        editable,
        title,
        mode,
        pendingIndicator,
        agreementId:   agreement.id,
        supplierCode:  supplier.code,
        supplierName:  supplier.name,
        plantName:     agreement.plantName,
        companyCode:   agreement.companyCode,
        agreementDate: agreement.date,
        itemsData:     itemsForLines,
      },
    })
  }

  const handleWeek = async () => {
    if (weekDisabled) return
    setBusy(true); setBusyLabel('Generating…')
    try {
      const selectedItemData = items.filter(it => selArr.includes(it.itemNo))
      const itemsWithDays = selectedItemData.map(it => ({
        ...it,
        days: generateDays(it.totalQuantity, 'week', null),
        indicator: 'W',
      }))
      const serverItems = await scheduleGenerateApi.generateWeekSchedule(
        agreement.id, supplier.code, itemsWithDays,
      )
      const mergedItems = items.map(it => {
        const srv = serverItems.find(s => s.itemNo === it.itemNo)
        return srv ? { ...it, ...srv, indicator: 'W' } : it
      })
      setItems(mergedItems)
      // saveSession({ supplier, agreement, items: mergedItems })
      openScheduleLines(selArr, false, 'Schedule Lines — Week', 'WEEKLY', 'W', mergedItems)
    } catch (err) {
      console.error('weekSet error:', err)
      alert(`Failed to generate week schedule: ${err.message}`)
    } finally {
      setBusy(false); setBusyLabel('')
    }
  }

  const handleDayClick = () => { if (!dayDisabled) setShowDayPopup(true) }

  const handleDayGenerate = async dayCount => {
    setShowDayPopup(false)
    setBusy(true); setBusyLabel('Generating…')
    try {
      const selectedItemData = items.filter(it => selArr.includes(it.itemNo))
      const itemsWithDays = selectedItemData.map(it => ({
        ...it,
        days: generateDays(it.totalQuantity, 'day', dayCount),
        indicator: 'D',
      }))
      const serverItems = await scheduleGenerateApi.generateDaySchedule(
        agreement.id, supplier.code, itemsWithDays, dayCount,
      )
      const mergedItems = items.map(it => {
        const srv = serverItems.find(s => s.itemNo === it.itemNo)
        return srv ? { ...it, ...srv, indicator: 'D' } : it
      })
      setItems(mergedItems)
      // saveSession({ supplier, agreement, items: mergedItems })
      navigate('/purchasing/schedule-lines', {
        state: {
          selectedItemNos:  selArr,
          editable:         false,
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
          itemsData:        mergedItems.filter(it => selArr.includes(it.itemNo)),
        },
      })
    } catch (err) {
      console.error('daySet error:', err)
      alert(`Failed to generate day schedule: ${err.message}`)
    } finally {
      setBusy(false); setBusyLabel('')
    }
  }

  const handleEdit = () => {
    if (editDisabled) return
    openScheduleLines(
      selArr.filter(no => items.find(i => i.itemNo === no)?.indicator),
      true, 'Edit Schedule Lines', '', undefined,
    )
  }

  const handleApprove = async () => {
    if (selArr.length === 0 || busy) return
    setBusy(true); setBusyLabel('Saving…')
    try {
      const selectedItemData = items.filter(it => selArr.includes(it.itemNo))
      await scheduleGenerateApi.approveSchedule(agreement.id, supplier.code, selectedItemData)
      setItems(prev => {
        const next = prev.map(it => {
          if (!selectedItems.has(it.itemNo)) return it
          if (it.status === 'In Draft')    return { ...it, status: 'In Approval' }
          if (it.status === 'In Approval') return { ...it, status: 'Generated' }
          return it
        })
        // saveSession({ supplier, agreement, items: next })
        return next
      })
    } catch (err) {
      console.error('approveSet error:', err)
      alert(`Approval failed: ${err.message}`)
    } finally {
      setBusy(false); setBusyLabel('')
    }
  }

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

      {!supplier && (
        <div className="bg-[#f5f6f7] min-h-[calc(100vh-104px)] flex items-center justify-center">
          <div className="text-center text-[#6a6d70]">
            <svg className="mx-auto mb-3 opacity-30" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p className="text-[13px]">Enter a supplier code to get started.</p>
          </div>
        </div>
      )}

      {supplier && agreement && (
        <div className="bg-[#f5f6f7] min-h-[calc(100vh-104px)]">
          <main className="bg-white" style={{ minHeight: 'calc(100vh - 220px)' }}>

            {/* ── Header ── */}
            <div className="px-4 sm:px-6 lg:px-10 pt-5 pb-4 border-b border-[#e5e5e5] bg-gradient-to-b from-[#fafbfc] to-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">
                    Schedule Agreement
                  </div>
                  <h1 className="text-[22px] sm:text-[26px] font-bold text-[#0a6ed1] tracking-tight">
                    {agreement.id}
                  </h1>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3 flex-wrap justify-end">
                  <span className="text-[14px] font-semibold text-[#32363a] bg-white px-4 py-2 rounded-lg border border-[#e5e5e5] shadow-sm">
                    {agreement.date}
                  </span>
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

            {/* ── Action bar ── */}
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
                  <div className="flex items-center border border-[#d9d9d9] rounded-lg overflow-hidden bg-white">
                    <button
                      onClick={handleWeek}
                      disabled={weekDisabled}
                      className={`flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold transition-all disabled:opacity-40
                        ${allHaveW ? 'bg-[#0a6ed1] text-white' : 'text-[#32363a] hover:bg-[#f5f6f7]'}`}
                      title={anyHaveD ? 'Selected items are locked to Day mode' : ''}
                    >
                      <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center
                        ${allHaveW ? 'border-white' : 'border-[#0a6ed1]'}`}>
                        {allHaveW && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      Week
                    </button>
                    <div className="w-px h-4 bg-[#d9d9d9]" />
                    <button
                      onClick={handleDayClick}
                      disabled={dayDisabled}
                      className={`flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold transition-all disabled:opacity-40
                        ${allHaveD ? 'bg-[#0a6ed1] text-white' : 'text-[#32363a] hover:bg-[#f5f6f7]'}`}
                      title={anyHaveW ? 'Selected items are locked to Week mode' : ''}
                    >
                      <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center
                        ${allHaveD ? 'border-white' : 'border-[#0a6ed1]'}`}>
                        {allHaveD && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      Day
                    </button>
                  </div>

                  <button
                    onClick={handleEdit}
                    disabled={editDisabled}
                    className="h-8 px-3 text-[12px] font-semibold text-white bg-[#e76500] rounded-lg hover:bg-[#c55600] transition-all shadow-sm disabled:opacity-40"
                    title={selArr.length > 0 && !anyHaveInd ? 'Assign Week or Day indicator first' : ''}
                  >
                    Edit
                  </button>

                  <button
                    onClick={handleApprove}
                    disabled={selArr.length === 0 || busy}
                    className="h-8 px-3 text-[12px] font-semibold text-white bg-[#107e3e] rounded-lg hover:bg-[#0d6633] transition-all shadow-sm disabled:opacity-40"
                  >
                    {busy && busyLabel === 'Saving…' ? 'Saving…' : 'Approve'}
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
                          <input
                            type="checkbox"
                            checked={selectedItems.size === items.length && items.length > 0}
                            onChange={toggleAll}
                            className="accent-[#0a6ed1] w-4 h-4 cursor-pointer"
                          />
                        </th>
                        {['Item No.', 'SAP Code', 'Description', 'HSN Code',
                          'Total Monthly Schedule', 'Unit Price', 'Indicator', 'Status'].map(h => (
                          <th key={h}
                            className="text-center font-semibold py-3 px-3 border-b border-r border-[#e5e5e5] uppercase tracking-wider text-[10px] sm:text-[11px] last:border-r-0">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="row-stagger">
                      {items.map(item => {
                        const checked = selectedItems.has(item.itemNo)
                        return (
                          <tr key={item.itemNo} onClick={() => toggleItem(item.itemNo)}
                            className={`border-b border-[#f0f0f0] transition-colors cursor-pointer
                              ${checked ? 'bg-[#ebf5ff]' : 'hover:bg-[#ebf5ff]/40'}`}>
                            <td className="py-3 px-3 text-center border-r border-[#f0f0f0]"
                              onClick={e => e.stopPropagation()}>
                              <input type="checkbox" checked={checked}
                                onChange={() => toggleItem(item.itemNo)}
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
      )}

      {supplier && !agreement && (
        <div className="flex items-center justify-center h-64 text-[#6a6d70]">
          No agreements found for supplier <span className="font-semibold ml-1">{supplier.code}</span>.
        </div>
      )}
    </PageLayout>
  )
}