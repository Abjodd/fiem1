import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import PageLayout from '../../../layouts/PageLayout.jsx'
import { useUser } from '../../../context/UserContext.jsx'

// ─── DATE HELPERS ──────────────────────────────────────────────
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

import { importPOApi } from '../../../services/Purchasing/ImportPO/ImportPO.js'

// ═══════════════════════════════════════════════════════════════
// SIDEBAR CONTENT
// ═══════════════════════════════════════════════════════════════
function SidebarContent({
  sidebarCollapsed,
  searchQuery, setSearchQuery,
  filteredAgreements, agreements,
  selectedAgreementId, handleSelectAgreement,
  listLoading, listError,
  filterRef, filterOpen, setFilterOpen,
  selectedPlants, setSelectedPlants,
  plants, togglePlant,
  setSidebarCollapsed,
  selectedBtnRef,
}) {
  return (
    <>
      <div className="px-4 py-4 border-b border-[#e5e5e5] flex-shrink-0">
        {!sidebarCollapsed && (
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-semibold text-[#32363a]">Import Purchase Orders</h3>
            <span className="text-[12px] text-[#6a6d70] bg-[#f5f6f7] px-2.5 py-1 rounded-full font-medium">
              {filteredAgreements.length} of {agreements.length}
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
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by ID or plant"
              className="w-full h-10 pl-3.5 pr-16 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all"
            />
            <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="w-7 h-7 flex items-center justify-center text-[#6a6d70] hover:text-[#cc1c14] rounded transition-all">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
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
        {listLoading && agreements.length === 0 && (
          <div className="px-4 py-12 text-center text-[13px] text-[#6a6d70]">
            <div className="w-8 h-8 border-2 border-[#0a6ed1] border-t-transparent rounded-full animate-spin mx-auto mb-2"/>
            Loading…
          </div>
        )}
        {listError && (
          <div className="px-4 py-3 text-[13px] text-[#cc1c14] bg-[#fce8e6] border-b border-[#fad6d3]">{listError}</div>
        )}
        {!listLoading && !listError && (
          sidebarCollapsed ? (
            filteredAgreements.map(a => {
              const isSelected = a.id === selectedAgreementId
              return (
                <button key={a.id} ref={isSelected ? selectedBtnRef : null}
                  onClick={() => handleSelectAgreement(a.id)} title={a.id}
                  className={`w-full flex items-center justify-center py-3 border-b border-[#e5e5e5] transition-all border-l-[3px] ${isSelected ? 'bg-[#ebf5ff] border-l-[#0a6ed1]' : 'hover:bg-[#f5f6f7] border-l-transparent'}`}>
                  <span className={`text-[11px] font-bold ${isSelected ? 'text-[#0a6ed1]' : 'text-[#6a6d70]'}`}>{a.id.slice(-3)}</span>
                </button>
              )
            })
          ) : (
            <>
              {filteredAgreements.map(a => {
                const isSelected = a.id === selectedAgreementId
                return (
                  <button key={a.id} ref={isSelected ? selectedBtnRef : null}
                    onClick={() => handleSelectAgreement(a.id)}
                    className={`w-full text-left px-4 py-3.5 border-b border-[#e5e5e5] transition-all border-l-[3px] ${isSelected ? 'bg-[#ebf5ff] border-l-[#0a6ed1]' : 'hover:bg-[#f5f6f7] border-l-transparent'}`}>
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
              {filteredAgreements.length === 0 && (
                <div className="px-4 py-12 text-center text-[13px] text-[#6a6d70] anim-fade">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 opacity-40">
                    <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
                  </svg>
                  No import purchase orders found
                </div>
              )}
            </>
          )
        )}
      </div>

      <div className="border-t border-[#e5e5e5] px-3 py-2.5 flex items-center justify-between flex-shrink-0" ref={filterRef}>
        <div className="relative">
          <button onClick={() => setFilterOpen(o => !o)}
            className={`relative w-9 h-9 flex items-center justify-center rounded-lg transition-all ${selectedPlants.length > 0 ? 'bg-[#ebf5ff] text-[#0a6ed1]' : 'text-[#0a6ed1] hover:bg-[#f0f7ff]'}`}
            title="Filter by plant">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18l-7 9v6l-4-2v-4L3 4z"/></svg>
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
                {plants.map(p => (
                  <label key={p.code} className="flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-[#f5f6f7] cursor-pointer text-[13px] transition-colors">
                    <input type="checkbox" checked={selectedPlants.includes(p.code)} onChange={() => togglePlant(p.code)} className="accent-[#0a6ed1] w-4 h-4"/>
                    <span className="text-[#32363a]"><span className="font-medium">{p.code}</span> — <span className="text-[#6a6d70]">{p.name}</span></span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <button onClick={() => setSidebarCollapsed(c => !c)}
          className="hidden md:flex w-9 h-9 items-center justify-center rounded-lg text-[#6a6d70] hover:text-[#0a6ed1] hover:bg-[#f0f7ff] transition-all"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease' }}>
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ImportPurchaseOrder() {
  const { loginId, loginType, loading: userLoading } = useUser()

  const [agreements,          setAgreements]          = useState([])
  const [listLoading,         setListLoading]         = useState(false)
  const [listError,           setListError]           = useState(null)
  const [selectedAgreementId, setSelectedAgreementId] = useState(() => sessionStorage.getItem('ipo_selected_id') || null)
  const [agreement,           setAgreement]           = useState(null)
  const [detailLoading,       setDetailLoading]       = useState(false)
  const [detailError,         setDetailError]         = useState(null)
  const [searchQuery,         setSearchQuery]         = useState('')
  const [selectedPlants,      setSelectedPlants]      = useState([])
  const [filterOpen,          setFilterOpen]          = useState(false)
  const [fromDate,            setFromDate]            = useState('')
  const [toDate,              setToDate]              = useState('')
  const filterRef      = useRef(null)
  const selectedBtnRef = useRef(null)
  const [sidebarCollapsed,  setSidebarCollapsed]  = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    if (userLoading) return
    setListLoading(true)
    setListError(null)
    importPOApi.listHeaders()
      .then(data => {
        setAgreements(data)
        setListLoading(false)
      })
      .catch(err => {
        console.error(err)
        setListError('Failed to load import purchase orders')
        setListLoading(false)
      })
  }, [userLoading])

  useEffect(() => {
    if (!selectedAgreementId && agreements.length > 0) {
      const saved = sessionStorage.getItem('ipo_selected_id')
      const exists = saved && agreements.some(a => a.id === saved)
      setSelectedAgreementId(exists ? saved : agreements[0].id)
    }
  }, [agreements, selectedAgreementId])

  useEffect(() => {
    if (selectedAgreementId) sessionStorage.setItem('ipo_selected_id', selectedAgreementId)
  }, [selectedAgreementId])

  useEffect(() => {
    if (!selectedAgreementId) { setAgreement(null); return }
    setDetailLoading(true)
    setDetailError(null)
    
    const foundHeader = agreements.find(a => a.id === selectedAgreementId)
    if (!foundHeader) {
      setDetailError('Import purchase order not found')
      setDetailLoading(false)
      return
    }

    importPOApi.getLineItems(selectedAgreementId)
      .then(items => {
        setAgreement({ ...foundHeader, items })
        setDetailLoading(false)
      })
      .catch(err => {
        console.error(err)
        setDetailError('Failed to load line items')
        setDetailLoading(false)
      })
  }, [selectedAgreementId, agreements])

  useEffect(() => {
    if (selectedBtnRef.current) {
      selectedBtnRef.current.scrollIntoView({ block: 'nearest', behavior: agreements.length > 0 ? 'smooth' : 'auto' })
    }
  }, [selectedAgreementId, agreements])

  useEffect(() => {
    const handler = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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

  const filteredAgreements = useMemo(() => {
    return agreements.filter(a => {
      const q = searchQuery.trim().toLowerCase()
      const matchSearch = !q ||
        a.id.toLowerCase().includes(q) ||
        (a.plantName || '').toLowerCase().includes(q) ||
        (a.plant || '').toLowerCase().includes(q) ||
        (a.vendor || '').toLowerCase().includes(q)
      const matchPlant = selectedPlants.length === 0 || selectedPlants.includes(a.plant)
      return matchSearch && matchPlant
    })
  }, [agreements, searchQuery, selectedPlants])

  const dateError = useMemo(() => {
    if (!fromDate || !toDate) return null
    const f = parseDdmmyyyy(fromDate), t = parseDdmmyyyy(toDate)
    if (!f || !t) return null
    return f > t ? 'From Date must be earlier than To Date' : null
  }, [fromDate, toDate])

  const filteredItems = useMemo(() => {
    if (!agreement) return []
    let items = agreement.items

    const f = parseDdmmyyyy(fromDate)
    const t = parseDdmmyyyy(toDate)

    if (f || t) {
      items = items.filter(item => {
        const itemDate = parseDdmmyyyy(item.deliveryFromDate)
        if (!itemDate) return true

        if (f && itemDate < f) return false
        if (t && itemDate > t) return false
        return true
      })
    }
    return items
  }, [agreement, fromDate, toDate])

  const handleSelectAgreement = useCallback((id) => {
    setSelectedAgreementId(id)
    setMobileSidebarOpen(false)
  }, [])

  const togglePlant = useCallback((plant) => {
    setSelectedPlants(prev => prev.includes(plant) ? prev.filter(p => p !== plant) : [...prev, plant])
  }, [])

  const sidebarProps = {
    sidebarCollapsed, searchQuery, setSearchQuery,
    filteredAgreements, agreements, selectedAgreementId, handleSelectAgreement,
    listLoading, listError, filterRef, filterOpen, setFilterOpen,
    selectedPlants, setSelectedPlants, plants, togglePlant,
    setSidebarCollapsed, selectedBtnRef,
  }

  return (
    <PageLayout>
      <style>{`
        @keyframes fadeIn        { from { opacity: 0; transform: translateY(8px);   } to { opacity: 1; transform: translateY(0);  } }
        @keyframes slideInLeft   { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0);  } }
        @keyframes slideInRight  { from { opacity: 0; transform: translateX(12px);  } to { opacity: 1; transform: translateX(0);  } }
        @keyframes scaleIn       { from { opacity: 0; transform: scale(0.96);       } to { opacity: 1; transform: scale(1);       } }
        @keyframes slideInDrawer { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        .anim-fade      { animation: fadeIn        0.35s ease-out both; }
        .anim-slide-l   { animation: slideInLeft   0.3s  ease-out both; }
        .anim-slide-r   { animation: slideInRight  0.35s ease-out both; }
        .anim-scale     { animation: scaleIn       0.25s ease-out both; }
        .anim-drawer    { animation: slideInDrawer 0.28s ease-out both; }
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
        <div className="flex" style={{ minHeight: 'calc(100vh - 220px)' }}>

          {mobileSidebarOpen && (
            <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileSidebarOpen(false)}/>
          )}

          <aside data-sidebar
            className={`fixed top-0 left-0 h-full w-[300px] bg-white border-r border-[#e5e5e5] flex flex-col z-50 md:hidden anim-drawer ${mobileSidebarOpen ? 'flex' : 'hidden'}`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e5] bg-[#fafbfc]">
              <span className="text-[14px] font-semibold text-[#32363a]">Import Purchase Orders</span>
              <button onClick={() => setMobileSidebarOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6a6d70] hover:text-[#cc1c14] hover:bg-[#fce8e6] transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <SidebarContent {...sidebarProps}/>
          </aside>

          <aside data-sidebar
            className={`hidden md:flex overflow-hidden flex-col bg-white border-r border-[#e5e5e5] sidebar-transition anim-slide-l flex-shrink-0 h-screen sticky top-0 ${sidebarCollapsed ? 'w-[56px]' : 'w-[300px] lg:w-[340px]'}`}>
            <SidebarContent {...sidebarProps}/>
          </aside>

          <main className="flex-1 bg-white overflow-hidden flex flex-col anim-slide-r min-w-0">
            {detailLoading && (
              <div className="flex-1 flex items-center justify-center py-20">
                <div className="w-10 h-10 border-2 border-[#0a6ed1] border-t-transparent rounded-full animate-spin"/>
              </div>
            )}

            {!detailLoading && detailError && (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-[#cc1c14] gap-2">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                <p className="text-[14px]">{detailError}</p>
              </div>
            )}

            {!detailLoading && !detailError && !agreement && (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-[#6a6d70] gap-3">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-30">
                  <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                <p className="text-[14px]">Select an import purchase order</p>
              </div>
            )}

            {!detailLoading && !detailError && agreement && (
              <>
                {/* IPO Header */}
                <div className="px-4 sm:px-6 lg:px-10 pt-5 sm:pt-7 pb-5 border-b border-[#e5e5e5] bg-gradient-to-b from-[#fafbfc] to-white flex-shrink-0">
                  <div className="flex items-center gap-3 mb-4 md:hidden">
                    <button data-sidebar-toggle onClick={() => setMobileSidebarOpen(true)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#d9d9d9] text-[#6a6d70] hover:text-[#0a6ed1] hover:border-[#0a6ed1] transition-all">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M3 6h18M3 12h18M3 18h18"/>
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1.5">Import Purchase Order</div>
                      <h2 className="text-[20px] sm:text-[24px] font-bold text-[#0a6ed1] tracking-tight">{agreement.poNo}</h2>
                    </div>
                    <span className="text-[13px] text-[#6a6d70] bg-white px-3 py-2 rounded-lg border border-[#e5e5e5] shadow-sm whitespace-nowrap ml-3">
                      {agreement.date}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[14px]">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">Vendor</div>
                      <div className="text-[#32363a] font-medium">{agreement.vendor || '—'}</div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">Plant</div>
                      <div className="text-[#32363a] font-medium">{agreement.plantDesc} ({agreement.plant})</div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">Buyer</div>
                      <div className="text-[#32363a] font-medium">{agreement.buyerName || '—'}</div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">Currency</div>
                      <div className="text-[#32363a] font-medium">{agreement.currency || '—'}</div>
                    </div>
                  </div>
                </div>

                {/* Tab indicator */}
                <div className="px-4 sm:px-6 lg:px-10 pt-5 flex-shrink-0">
                  <div className="inline-flex flex-col items-center pb-2.5 border-b-2 border-[#0a6ed1]">
                    <div className="w-10 h-10 rounded-full bg-[#0a6ed1] flex items-center justify-center mb-1.5 shadow-md">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
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
                      <input type="date" value={ddmmyyyyToIso(fromDate)} onChange={e => setFromDate(isoToDdmmyyyy(e.target.value))}
                        className={`w-full h-9 pl-3 pr-2 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 transition-all ${dateError ? 'border-[#cc1c14] focus:ring-[#cc1c14]/20' : 'border-[#d9d9d9] focus:border-[#0a6ed1] focus:ring-[#0a6ed1]/20'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] text-[#6a6d70] mb-1.5 font-semibold">To Date</label>
                      <input type="date" value={ddmmyyyyToIso(toDate)} onChange={e => setToDate(isoToDdmmyyyy(e.target.value))}
                        className={`w-full h-9 pl-3 pr-2 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 transition-all ${dateError ? 'border-[#cc1c14] focus:ring-[#cc1c14]/20' : 'border-[#d9d9d9] focus:border-[#0a6ed1] focus:ring-[#0a6ed1]/20'}`}
                      />
                    </div>
                    <button onClick={() => { setFromDate(''); setToDate('') }}
                      className="h-9 px-4 text-[13px] font-semibold text-[#cc1c14] bg-[#fce8e6] rounded-lg hover:bg-[#fad6d3] transition-all self-end">
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

                {/* ── Items table (no status col, no chevron, no row nav) ── */}
                <div className="px-4 sm:px-6 lg:px-10 pt-4 pb-6 overflow-hidden flex flex-col flex-1">
                  <div className="rounded-xl border border-[#e5e5e5] shadow-sm overflow-auto w-full max-h-full">
                    <table className="w-full text-[13px]" style={{ minWidth: '700px', borderCollapse: 'collapse' }}>
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-gradient-to-b from-[#fafbfc] to-[#f5f6f7] border-b border-[#e5e5e5] text-[#6a6d70]">
                          {/* Item No. | Material | HSN Code | PO Qty | Delivered Qty | Balance Qty | Unit Price */}
                          {['Item No.', 'Material', 'HSN Code', 'PO Qty', 'Delivered Qty', 'Balance Qty', 'Unit Price'].map((h, i) => (
                            <th key={i} className="text-left font-semibold py-3.5 px-4 text-[11px] uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="row-stagger">
                        {filteredItems.length === 0 ? (
                          <tr><td colSpan={7} className="py-12 text-center text-[13px] text-[#6a6d70]">No items found</td></tr>
                        ) : filteredItems.map((item, idx) => (
                          <tr key={`${item.itemNo}-${idx}`}
                            className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc] transition-colors">

                            {/* Item No. */}
                            <td className="py-3.5 px-4 font-semibold text-[#32363a]">{item.itemNo}</td>

                            {/* Material — code only */}
                            <td className="py-3.5 px-4 text-[#32363a] font-medium text-[13px]">
                              {item.materialNumber}
                            </td>

                            {/* HSN Code */}
                            <td className="py-3.5 px-4 text-[#32363a]">{item.hsnCode || '—'}</td>

                            {/* PO Qty */}
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-[#32363a]">{item.poQty}</span>{' '}
                              <span className="text-[#6a6d70] text-[12px]">{item.deliveryUnit}</span>
                            </td>

                            {/* Delivered Qty */}
                            <td className="py-3.5 px-4">
                              <span className="text-[#32363a]">{item.deliveredQty}</span>{' '}
                              <span className="text-[#6a6d70] text-[12px]">{item.deliveryUnit}</span>
                            </td>

                            {/* Balance Qty (renamed from Confirmed Qty, sits next to Delivered Qty) */}
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-[#32363a]">{item.balanceQty}</span>{' '}
                              <span className="text-[#6a6d70] text-[12px]">{item.deliveryUnit}</span>
                            </td>

                            {/* Unit Price */}
                            <td className="py-3.5 px-4 font-semibold text-[#32363a]">
                              {item.unitPrice && item.unitPrice !== '0.00'
                                ? `${item.unitPrice} ${agreement.currency || ''}`
                                : '—'}
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
        </div>
      </div>
    </PageLayout>
  )
}