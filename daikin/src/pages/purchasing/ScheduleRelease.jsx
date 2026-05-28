import { useState, useMemo, useRef, useEffect } from 'react'

import PageLayout from '../../layouts/PageLayout.jsx'
import CreateASN from './createASN.jsx'
import { scheduleReleaseApi } from '../../services/Schedulerelease.js'

// ── date helpers that drive the UI date inputs (stay in page) ──
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
const parseDeliveryDate = (s) => new Date(s)

export default function ScheduleRelease() {
  const [showCreateAsn, setShowCreateAsn] = useState(false)

  const [agreements, setAgreements] = useState([])
  const [agreement, setAgreement] = useState(null)
  const [selectedAgreementId, setSelectedAgreementId] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlants, setSelectedPlants] = useState([])
  const [filterOpen, setFilterOpen] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [storageSearch, setStorageSearch] = useState('')
  const filterRef = useRef(null)

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // loading + error
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [scheduleLines, setScheduleLines] = useState([])
  const [linesLoading, setLinesLoading] = useState(false)

  // ── load agreement list ──
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    scheduleReleaseApi.listAgreements({ search: searchQuery, plants: selectedPlants })
      .then(data => { if (!cancelled) setAgreements(data) })
      .catch(err => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [searchQuery, selectedPlants])

  // ── auto-select first agreement ──
  useEffect(() => {
    if (!selectedAgreementId && agreements.length > 0) {
      setSelectedAgreementId(agreements[0].id)
    }
  }, [agreements, selectedAgreementId])

  // ── load selected agreement detail ──
  useEffect(() => {
    let cancelled = false
    if (!selectedAgreementId) { setAgreement(null); return }
    scheduleReleaseApi.getAgreement(selectedAgreementId)
      .then(data => { if (!cancelled) setAgreement(data) })
      .catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [selectedAgreementId])

  // load schedule lines when an item is drilled into
useEffect(() => {
  let cancelled = false
  if (!selectedItem || !agreement) { setScheduleLines([]); return }
  const item = agreement.items.find(i => i.itemNo === selectedItem.itemNo)
  if (!item) { setScheduleLines([]); return }
  setLinesLoading(true)
  scheduleReleaseApi.getScheduleLines(
    agreement.id,
    item.itemNo,
    item.materialNumber,
    item.deliveryUnit
  )
    .then(lines => { if (!cancelled) setScheduleLines(lines) })
    .catch(err => { if (!cancelled) console.error(err) })
    .finally(() => { if (!cancelled) setLinesLoading(false) })
  return () => { cancelled = true }
}, [selectedItem, agreement])

  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!mobileSidebarOpen) return
    const handler = (e) => {
      if (!e.target.closest('[data-sidebar]') && !e.target.closest('[data-sidebar-toggle]')) {
        setMobileSidebarOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [mobileSidebarOpen])

  const drilledItem =
    selectedItem && agreement
      ? agreement.items.find(i => i.itemNo === selectedItem.itemNo)
      : null

  // plants list built from fetched agreements
  const plants = useMemo(() => {
    const map = new Map()
    agreements.forEach((a) => { if (a.plant) map.set(a.plant, a.plantName) })
    return Array.from(map, ([code, name]) => ({ code, name }))
  }, [agreements])

  const dateError = useMemo(() => {
    if (!fromDate || !toDate) return null
    const f = parseDdmmyyyy(fromDate)
    const t = parseDdmmyyyy(toDate)
    if (!f || !t) return null
    return f > t ? 'From Date must be earlier than To Date' : null
  }, [fromDate, toDate])

  const filteredItems = useMemo(() => {
    if (!agreement) return []
    const storageTerms = storageSearch.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    const fromObj = parseDdmmyyyy(fromDate)
    const toObj = parseDdmmyyyy(toDate)
    return agreement.items.filter(item => {
      const matchStorage = storageTerms.length === 0 ||
        storageTerms.some(t => item.storageLocation.toLowerCase().includes(t))
      const matchDate = true
      return matchStorage && matchDate
    })
  }, [agreement, storageSearch, fromDate, toDate, dateError])

  const handleClearFilters = () => {
    setFromDate('')
    setToDate('')
    setStorageSearch('')
  }

  const handleSelectAgreement = (id) => {
    setSelectedAgreementId(id)
    setSelectedItem(null)
    setMobileSidebarOpen(false)
  }

  const togglePlant = (plant) => {
    if (selectedPlants.includes(plant)) setSelectedPlants(selectedPlants.filter(p => p !== plant))
    else setSelectedPlants([...selectedPlants, plant])
  }

  const handleCreateAsn = () => {
    navigate('/purchasing/create-asn', { state: { agreement } })
  }

  const handleConfirm = async () => {
    if (!agreement) return
    try {
      await scheduleReleaseApi.confirmAgreement(agreement.id)
    } catch (err) {
      console.error(err)
    }
  }

  if (showCreateAsn) {
    return <CreateASN />
  }

  // ── Sidebar inner content ──
  const SidebarContent = () => (
    <>
      <div className="px-4 py-4 border-b border-[#e5e5e5] flex-shrink-0">
        {!sidebarCollapsed && (
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-semibold text-[#32363a]">Schedule Agreements</h3>
            <span className="text-[12px] text-[#6a6d70] bg-[#f5f6f7] px-2.5 py-1 rounded-full">
              {agreements.length}
            </span>
          </div>
        )}
        {sidebarCollapsed ? (
          <div className="flex justify-center">
            <button className="w-9 h-9 flex items-center justify-center text-[#6a6d70] hover:text-[#0a6ed1] rounded-lg hover:bg-[#f0f7ff] transition-all">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID or plant"
              className="w-full h-10 pl-3.5 pr-16 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all duration-200"
            />
            <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="w-7 h-7 flex items-center justify-center text-[#6a6d70] hover:text-[#cc1c14] rounded transition-all hover:scale-110">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
              <button className="w-7 h-7 flex items-center justify-center text-[#6a6d70] hover:text-[#0a6ed1] rounded transition-all hover:scale-110">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 row-stagger">
        {error && !sidebarCollapsed && (
          <div className="px-4 py-3 text-[13px] text-[#cc1c14] bg-[#fce8e6] border-b border-[#fad6d3]">
            {error}
          </div>
        )}
        {loading && agreements.length === 0 ? (
          <div className="px-4 py-12 text-center text-[13px] text-[#6a6d70]">Loading…</div>
        ) : sidebarCollapsed ? (
          agreements.map((a) => {
            const isSelected = a.id === selectedAgreementId
            return (
              <button key={a.id} onClick={() => handleSelectAgreement(a.id)} title={a.id}
                className={`w-full flex items-center justify-center py-3 border-b border-[#e5e5e5] transition-all duration-200 border-l-[3px] ${isSelected ? 'bg-[#ebf5ff] border-l-[#0a6ed1]' : 'hover:bg-[#f5f6f7] border-l-transparent'}`}
              >
                <span className={`text-[11px] font-bold ${isSelected ? 'text-[#0a6ed1]' : 'text-[#6a6d70]'}`}>
                  {a.id.slice(-3)}
                </span>
              </button>
            )
          })
        ) : (
          <>
            {agreements.map((a) => {
              const isSelected = a.id === selectedAgreementId
              return (
                <button key={a.id} onClick={() => handleSelectAgreement(a.id)}
                  className={`w-full text-left px-5 py-3.5 border-b border-[#e5e5e5] transition-all duration-200 border-l-[3px] pl-[17px] ${isSelected ? 'bg-[#ebf5ff] border-l-[#0a6ed1] shadow-sm' : 'hover:bg-[#f5f6f7] hover:translate-x-0.5 border-l-transparent'}`}
                >
                  <div className="text-[14px] font-semibold text-[#0a6ed1] mb-1">{a.id}</div>
                  <div className="flex items-center justify-between text-[13px] text-[#6a6d70]">
                    <span>Plant: {a.plant}</span>
                    <span>{a.date}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px] text-[#6a6d70] mt-1">
                    <span>{a.plantName}</span>
                    <span className="px-2 py-0.5 bg-[#f0f0f0] rounded text-[11px] font-medium">{a.type}</span>
                  </div>
                </button>
              )
            })}
            {agreements.length === 0 && !loading && (
              <div className="px-4 py-12 text-center text-[13px] text-[#6a6d70] anim-fade">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 opacity-40">
                  <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
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
            className={`relative w-9 h-9 flex items-center justify-center rounded-lg transition-all hover:scale-105 ${selectedPlants.length > 0 ? 'bg-[#ebf5ff] text-[#0a6ed1]' : 'text-[#0a6ed1] hover:bg-[#f0f7ff]'}`}
            title="Filter by plant"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 4h18l-7 9v6l-4-2v-4L3 4z" />
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
                  <button onClick={() => setSelectedPlants([])} className="text-[12px] text-[#0a6ed1] hover:underline">Clear</button>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {plants.map((p) => (
                  <label key={p.code} className="flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-[#f5f6f7] cursor-pointer text-[13px] transition-colors">
                    <input type="checkbox" checked={selectedPlants.includes(p.code)} onChange={() => togglePlant(p.code)} className="accent-[#0a6ed1] w-4 h-4" />
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
          className="hidden md:flex w-9 h-9 items-center justify-center rounded-lg text-[#6a6d70] hover:text-[#0a6ed1] hover:bg-[#f0f7ff] transition-all hover:scale-105"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease' }}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>
    </>
  )

  return (
    <PageLayout>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideInDrawer { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        .anim-fade { animation: fadeIn 0.35s ease-out both; }
        .anim-slide-l { animation: slideInLeft 0.3s ease-out both; }
        .anim-slide-r { animation: slideInRight 0.35s ease-out both; }
        .anim-scale { animation: scaleIn 0.25s ease-out both; }
        .anim-drawer { animation: slideInDrawer 0.28s ease-out both; }
        .row-stagger > * { animation: fadeIn 0.4s ease-out both; }
        .row-stagger > *:nth-child(1) { animation-delay: 0.02s; }
        .row-stagger > *:nth-child(2) { animation-delay: 0.06s; }
        .row-stagger > *:nth-child(3) { animation-delay: 0.10s; }
        .row-stagger > *:nth-child(4) { animation-delay: 0.14s; }
        .row-stagger > *:nth-child(5) { animation-delay: 0.18s; }
        .row-stagger > *:nth-child(6) { animation-delay: 0.22s; }
        .sidebar-transition { transition: width 0.25s ease; }
      `}</style>

      <div className="bg-[#f5f6f7] min-h-[calc(100vh-104px)]">
        {!selectedItem ? (
          <div className="flex" style={{ minHeight: 'calc(100vh - 220px)' }}>
            {mobileSidebarOpen && (
              <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
            )}
            <aside data-sidebar
              className={`fixed top-0 left-0 h-full w-[300px] bg-white border-r border-[#e5e5e5] flex flex-col z-50 md:hidden anim-drawer ${mobileSidebarOpen ? 'flex' : 'hidden'}`}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e5] bg-[#fafbfc]">
                <span className="text-[14px] font-semibold text-[#32363a]">Schedule Agreements</span>
                <button onClick={() => setMobileSidebarOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6a6d70] hover:text-[#cc1c14] hover:bg-[#fce8e6] transition-all">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <SidebarContent />
            </aside>
            <aside data-sidebar
              className={`hidden md:flex overflow-hidden flex-col bg-white border-r border-[#e5e5e5] sidebar-transition anim-slide-l flex-shrink-0 h-screen sticky top-0 ${sidebarCollapsed ? 'w-[56px]' : 'w-[300px] lg:w-[340px]'}`}
            >
              <SidebarContent />
            </aside>

            <main className="flex-1 bg-white overflow-hidden flex flex-col anim-slide-r min-w-0">
              {agreement && (
                <>
                  <div className="px-4 sm:px-6 lg:px-10 pt-5 sm:pt-7 pb-5 sm:pb-6 border-b border-[#e5e5e5] bg-gradient-to-b from-[#fafbfc] to-white flex-shrink-0">
                    <div className="flex items-center gap-3 mb-4 md:hidden">
                      <button data-sidebar-toggle onClick={() => setMobileSidebarOpen(true)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#d9d9d9] text-[#6a6d70] hover:text-[#0a6ed1] hover:border-[#0a6ed1] transition-all">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M3 6h18M3 12h18M3 18h18" />
                        </svg>
                      </button>
                      <span className="text-[13px] text-[#6a6d70]">Agreements</span>
                    </div>
                    <div className="flex items-start justify-between mb-4 sm:mb-5">
                      <div>
                        <div className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1.5">
                          Schedule Agreement
                        </div>
                        <h2 className="text-[20px] sm:text-[24px] font-bold text-[#0a6ed1] tracking-tight">{agreement.id}</h2>
                      </div>
                      <span className="text-[13px] sm:text-[14px] text-[#6a6d70] bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-[#e5e5e5] shadow-sm whitespace-nowrap ml-3">
                        {agreement.date}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 text-[14px]">
                      <div>
                        <div className="text-[#6a6d70] text-[12px] uppercase tracking-wider mb-1 font-semibold">Vendor</div>
                        <div className="text-[#32363a] font-medium">{agreement.vendor}</div>
                      </div>
                      <div>
                        <div className="text-[#6a6d70] text-[12px] uppercase tracking-wider mb-1 font-semibold">Plant</div>
                        <div className="text-[#32363a] font-medium">{agreement.plantName} ({agreement.plant})</div>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 sm:px-6 lg:px-10 pt-5 sm:pt-6 flex-shrink-0">
                    <div className="inline-flex flex-col items-center pb-2.5 border-b-2 border-[#0a6ed1]">
                      <div className="w-10 h-10 rounded-full bg-[#0a6ed1] flex items-center justify-center mb-1.5 shadow-md transition-transform hover:scale-110">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 11l3 3L22 4" />
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                      </div>
                      <span className="text-[13px] text-[#0a6ed1] font-semibold">Items</span>
                    </div>
                  </div>

                  <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 border-b border-[#e5e5e5] flex-shrink-0">
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 items-start sm:items-end">
                      <div className="w-full sm:w-auto sm:min-w-[160px] sm:flex-1 sm:max-w-[200px]">
                        <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">Delivery From Date</label>
                        <input type="date" value={ddmmyyyyToIso(fromDate)}
                          onChange={(e) => setFromDate(isoToDdmmyyyy(e.target.value))}
                          max={toDate ? ddmmyyyyToIso(toDate) : undefined}
                          className={`w-full h-10 pl-3 pr-2 text-[14px] border rounded-lg bg-white focus:outline-none focus:ring-2 transition-all duration-200 ${dateError ? 'border-[#cc1c14] focus:border-[#cc1c14] focus:ring-[#cc1c14]/20' : 'border-[#d9d9d9] focus:border-[#0a6ed1] focus:ring-[#0a6ed1]/20'}`}
                        />
                      </div>
                      <div className="w-full sm:w-auto sm:min-w-[160px] sm:flex-1 sm:max-w-[200px]">
                        <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">To Date</label>
                        <input type="date" value={ddmmyyyyToIso(toDate)}
                          onChange={(e) => setToDate(isoToDdmmyyyy(e.target.value))}
                          min={fromDate ? ddmmyyyyToIso(fromDate) : undefined}
                          className={`w-full h-10 pl-3 pr-2 text-[14px] border rounded-lg bg-white focus:outline-none focus:ring-2 transition-all duration-200 ${dateError ? 'border-[#cc1c14] focus:border-[#cc1c14] focus:ring-[#cc1c14]/20' : 'border-[#d9d9d9] focus:border-[#0a6ed1] focus:ring-[#0a6ed1]/20'}`}
                        />
                      </div>
                      <div className="w-full sm:flex-[2]">
                        <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">
                          Enter Storage Location (comma-separated)
                        </label>
                        <div className="relative">
                          <input type="text" value={storageSearch}
                            onChange={(e) => setStorageSearch(e.target.value)}
                            placeholder="e.g. RM01, RM02"
                            className="w-full h-10 pl-3.5 pr-10 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all duration-200"
                          />
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-3 top-3 text-[#6a6d70]">
                            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
                          </svg>
                        </div>
                      </div>
                      <div className="w-full sm:w-auto sm:self-end">
                        <button onClick={handleClearFilters}
                          className="w-full sm:w-auto h-10 px-5 text-[14px] font-semibold text-[#cc1c14] bg-[#fce8e6] border border-[#fce8e6] rounded-lg hover:bg-[#fad6d3] hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap">
                          Clear
                        </button>
                      </div>
                    </div>
                    {dateError && (
                      <div className="mt-2 flex items-center gap-1.5 text-[13px] text-[#cc1c14] anim-fade">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                        </svg>
                        {dateError}
                      </div>
                    )}
                  </div>

                  <div className="px-4 sm:px-6 lg:px-10 pt-4 sm:pt-6 pb-0 overflow-hidden flex flex-col" style={{ height: '40vh' }}>
                    <div className="rounded-xl border border-[#e5e5e5] shadow-sm flex flex-col overflow-hidden flex-1">
                      <table className="w-full text-[14px] flex-shrink-0" style={{ minWidth: '640px' }}>
                        <thead>
                          <tr className="bg-gradient-to-b from-[#fafbfc] to-[#f5f6f7] border-b border-[#e5e5e5] text-[#6a6d70]">
                            <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">Item No.</th>
                            <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">Material</th>
                            <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">HSN Code</th>
                            <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">Storage</th>
                            <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">Delivery</th>
                            <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">Delivered</th>
                            <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">Unit Price</th>
                            <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">Status</th>
                            <th className="w-10"></th>
                          </tr>
                        </thead>
                      </table>
                      <div className="flex-1 overflow-y-auto min-h-0">
                        <table className="w-full text-[14px]" style={{ minWidth: '640px' }}>
                          <tbody className="row-stagger">
                            {filteredItems.length === 0 && (
                              <tr>
                                <td colSpan={9} className="py-12 text-center text-[14px] text-[#6a6d70]">
                                  No items match the current filters
                                </td>
                              </tr>
                            )}
                            {filteredItems.map((item) => (
                              <tr key={item.itemNo}
                                onClick={() => setSelectedItem({ agreementId: agreement.id, itemNo: item.itemNo })}
                                className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#ebf5ff] cursor-pointer transition-all duration-200 group"
                              >
                                <td className="py-3.5 px-4 text-[#32363a] font-semibold">{item.itemNo}</td>
                                <td className="py-3.5 px-4">
                                  <div className="text-[#32363a] font-medium">{item.materialName}</div>
                                  <div className="text-[#0a6ed1] font-medium text-[13px]">{item.materialNumber}</div>
                                </td>
                                <td className="py-3.5 px-4 text-[#32363a]">{item.hsnCode}</td>
                                <td className="py-3.5 px-4">
                                  <span className="px-2.5 py-1 bg-[#f0f4f8] text-[#32363a] rounded-md text-[13px] font-semibold">
                                    {item.storageLocation}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-[#32363a]">
                                  <span className="font-semibold">{item.deliverySchedule}</span>{" "}
                                  <span className="text-[#6a6d70] text-[13px]">{item.deliveryUnit}</span>
                                </td>
                                <td className="py-3.5 px-4 text-[#32363a]">
                                  {item.deliveredQty} <span className="text-[#6a6d70] text-[13px]">{item.deliveredUnit}</span>
                                </td>
                                <td className="py-3.5 px-4 text-[#32363a] font-semibold">{item.unitPrice}</td>
                                <td className="py-3.5 px-4">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#e8f5ec] text-[#107e3e] rounded-full text-[13px] font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#107e3e] animate-pulse"></span>
                                    {item.status}
                                  </span>
                                </td>
                                <td className="py-3.5 px-3">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#0a6ed1] group-hover:translate-x-1.5 transition-transform duration-200">
                                    <path d="M9 18l6-6-6-6" />
                                  </svg>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-5 border-t border-[#e5e5e5] flex items-center justify-between gap-3 flex-shrink-0 bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
                    <button onClick={handleCreateAsn}
                      className="flex items-center gap-2 px-4 sm:px-5 h-11 text-[14px] font-semibold text-[#0a6ed1] bg-[#ebf5ff] border border-[#0a6ed1] rounded-lg hover:bg-[#d9ecff] hover:scale-[1.02] active:scale-[0.98] transition-all">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      Create ASN
                    </button>
                    <button onClick={handleConfirm}
                      className="flex items-center gap-2 px-4 sm:px-6 h-11 text-[14px] font-semibold text-white bg-[#0a6ed1] border border-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 11l3 3L22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                      Confirm
                    </button>
                  </div>
                </>
              )}
              {!agreement && !loading && (
                <div className="flex flex-col items-center justify-center h-64 text-[#6a6d70] anim-fade">
                  <span className="text-[14px]">Select an agreement from the list</span>
                </div>
              )}
            </main>
          </div>
        ) : (
          <main className="bg-white anim-fade" style={{ minHeight: 'calc(100vh - 220px)' }}>
            {drilledItem && (
              <>
                <div className="px-4 sm:px-6 lg:px-10 py-5 sm:py-7 border-b border-[#e5e5e5] bg-gradient-to-b from-[#fafbfc] to-white">
                  <button onClick={() => setSelectedItem(null)}
                    className="flex items-center gap-1.5 text-[14px] text-[#0a6ed1] hover:underline mb-5 hover:-translate-x-0.5 transition-transform">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                    Back to Items
                  </button>
                  <div className="text-center">
                    <div className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1.5">
                      Material Number
                    </div>
                    <h2 className="text-[22px] sm:text-[26px] font-bold text-[#0a6ed1] tracking-tight">{drilledItem.materialNumber}</h2>
                    <div className="text-[14px] text-[#6a6d70] mt-1.5">{drilledItem.materialName}</div>
                  </div>
                </div>
                <div className="px-4 sm:px-6 lg:px-10 py-5 sm:py-7">
                  <div className="overflow-x-auto rounded-xl border border-[#e5e5e5] shadow-sm">
                    <table className="w-full text-[14px]" style={{ minWidth: '480px' }}>
                      <thead>
                        <tr className="bg-gradient-to-b from-[#fafbfc] to-[#f5f6f7] border-b border-[#e5e5e5] text-[#6a6d70]">
                          <th className="text-left font-semibold py-3.5 px-4 w-[15%] text-[13px] uppercase tracking-wider">Sch. Line</th>
                          <th className="text-left font-semibold py-3.5 px-4 w-[25%] text-[13px] uppercase tracking-wider">Delivery Date</th>
                          <th className="text-left font-semibold py-3.5 px-4 w-[30%] text-[13px] uppercase tracking-wider">Delivery Schedule</th>
                          <th className="text-left font-semibold py-3.5 px-4 w-[30%] text-[13px] uppercase tracking-wider">Confirmed Qty</th>
                        </tr>
                      </thead>
                      <tbody className="row-stagger">
                        {scheduleLines.map((line, idx) => (
                          <tr key={`${line.schLineNo}-${idx}`} className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc] transition-colors duration-200">
                            <td className="py-4 px-4">
                              <span className="inline-flex items-center justify-center w-8 h-8 bg-[#ebf5ff] text-[#0a6ed1] rounded-full text-[13px] font-bold transition-transform hover:scale-110">
                                {line.schLineNo}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-[#32363a] font-medium">
                              <div className="flex items-center gap-2">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#6a6d70] flex-shrink-0">
                                  <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                                </svg>
                                {line.deliveryDate}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-[#32363a]">
                              <span className="font-bold text-[15px]">{line.deliverySchedule}</span>{' '}
                              <span className="text-[#6a6d70] text-[13px]">{line.unit}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#e8f5ec] text-[#107e3e] rounded-md text-[13px] font-semibold">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <path d="M5 13l4 4L19 7" />
                                </svg>
                                {line.confirmedQty} {line.unit}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </main>
        )}
      </div>
    </PageLayout>
  )
}