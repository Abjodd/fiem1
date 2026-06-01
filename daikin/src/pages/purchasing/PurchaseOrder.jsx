// src/pages/purchasing/PurchaseOrder.jsx
import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../../layouts/PageLayout.jsx'
import { purchaseOrderApi, sapDateToIso } from '../../services/PurchaseOrder.js'

// ─── DATE HELPERS (UI-only: drive date inputs) ──────────────────
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
const parseDisplayDate = (s) => (s ? new Date(s) : null)

// ─── COMPONENT ──────────────────────────────────────────────────
export default function PurchaseOrder() {
  const navigate = useNavigate()

  // list
  const [agreements, setAgreements] = useState([])
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState(null)

  // selected
  const [selectedAgreementId, setSelectedAgreementId] = useState(null)
  const [agreement, setAgreement] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState(null)

  // drilled item
  const [selectedItem, setSelectedItem] = useState(null)

  // search / filter
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlants, setSelectedPlants] = useState([])
  const [filterOpen, setFilterOpen] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [storageSearch, setStorageSearch] = useState('')
  const filterRef = useRef(null)

  // sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // ── Load list ──
  useEffect(() => {
    let cancelled = false
    setListLoading(true)
    setListError(null)
    purchaseOrderApi.listHeaders()
      .then(data => { if (!cancelled) setAgreements(data) })
      .catch(err => { if (!cancelled) setListError(err.message) })
      .finally(() => { if (!cancelled) setListLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Select first id
  useEffect(() => {
      if (!selectedAgreementId && agreements.length > 0) {
        setSelectedAgreementId(agreements[0].id)
      }
    }, [agreements, selectedAgreementId])

      // ── load selected agreement detail ──
      useEffect(() => {
        let cancelled = false
        if (!selectedAgreementId) { setAgreement(null); return }
        purchaseOrderApi.getAsnHeader(selectedAgreementId)
          .then(data => { if (!cancelled) setAgreement(data) })
          .catch(err => { if (!cancelled) setError(err.message) })
        return () => { cancelled = true }
      }, [selectedAgreementId])

  // ── Close filter on outside click ──
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
      if (!e.target.closest('[data-sidebar]') && !e.target.closest('[data-sidebar-toggle]')) {
        setMobileSidebarOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [mobileSidebarOpen])

  // ── Derived ──
  const drilledItem =
    selectedItem && agreement
      ? agreement.items.find(i => i.itemNo === selectedItem.itemNo)
      : null

  const plants = useMemo(() => {
    const map = new Map()
    agreements.forEach(a => map.set(a.plant, a.plantName))
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
        storageTerms.some(t => (item.storageLocation || '').toLowerCase().includes(t))
      const matchDate = !fromObj || !toObj || dateError
        ? true
        : (() => {
          const d = parseDisplayDate(item.deliveryDate)
          return d ? d >= fromObj && d <= toObj : true
        })()
      return matchStorage && matchDate
    })
  }, [agreement, storageSearch, fromDate, toDate, dateError])

  // ── Handlers ──
  const handleSelectAgreement = (id) => {
    setSelectedAgreementId(id)
    setSelectedItem(null)
    setMobileSidebarOpen(false)
  }

  const togglePlant = (plant) => {
    setSelectedPlants(prev =>
      prev.includes(plant) ? prev.filter(p => p !== plant) : [...prev, plant]
    )
  }

  const handleClearFilters = () => {
    setFromDate('')
    setToDate('')
    //setStorageSearch('')
  }

  const handleCreateAsn = async () => {
    if (!agreement) return
    try {
      const [asnHeader, pdirRefs] = await Promise.all([
        purchaseOrderApi.getAsnHeader(agreement.poNo),
        purchaseOrderApi.getPdirRefs(agreement.poNo),
      ])
      navigate('/purchasing/create-asn', { state: { agreement: asnHeader, pdirRefs } })
    } catch (err) {
      console.error('Create ASN error:', err)
    }
  }

  const handleConfirm = async () => {
    if (!agreement) return
    try {
      const confirmLines = await purchaseOrderApi.getConfirmLines(agreement.poNo)
      navigate('/purchasing/confirm-po', { state: { agreement, confirmLines } })
    } catch (err) {
      console.error('Confirm error:', err)
    }
  }

  // ── Sidebar inner content ──
  const SidebarContent = () => (
    <>
      <div className="px-4 py-4 border-b border-[#e5e5e5] flex-shrink-0">
        {!sidebarCollapsed && (
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-semibold text-[#32363a]">Purchase Order</h3>
            <span className="text-[12px] text-[#6a6d70] bg-[#f5f6f7] px-2.5 py-1 rounded-full">
              {filteredAgreements.length} of {agreements.length}
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
        {listLoading && (
          <div className="px-4 py-12 text-center text-[13px] text-[#6a6d70]">
            <div className="w-8 h-8 border-2 border-[#0a6ed1] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading...
          </div>
        )}
        {listError && (
          <div className="px-4 py-6 text-center text-[13px] text-[#cc1c14]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
            {listError}
          </div>
        )}
        {!listLoading && !listError && (
          sidebarCollapsed ? (
            filteredAgreements.map((a) => {
              const isSelected = a.id === selectedAgreementId
              return (
                <button key={a.id} onClick={() => handleSelectAgreement(a.id)} title={a.id}
                  className={`w-full flex items-center justify-center py-3 border-b border-[#e5e5e5] transition-all duration-200 border-l-[3px] ${isSelected ? 'bg-[#ebf5ff] border-l-[#0a6ed1]' : 'hover:bg-[#f5f6f7] border-l-transparent'}`}>
                  <span className={`text-[11px] font-bold ${isSelected ? 'text-[#0a6ed1]' : 'text-[#6a6d70]'}`}>{a.id.slice(-3)}</span>
                </button>
              )
            })
          ) : (
            <>
              {filteredAgreements.map((a) => {
                const isSelected = a.id === selectedAgreementId
                return (
                  <button key={a.id} onClick={() => handleSelectAgreement(a.id)}
                    className={`w-full text-left px-5 py-3.5 border-b border-[#e5e5e5] transition-all duration-200 border-l-[3px] pl-[17px] ${isSelected ? 'bg-[#ebf5ff] border-l-[#0a6ed1] shadow-sm' : 'hover:bg-[#f5f6f7] hover:translate-x-0.5 border-l-transparent'}`}>
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
              {filteredAgreements.length === 0 && (
                <div className="px-4 py-12 text-center text-[13px] text-[#6a6d70] anim-fade">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 opacity-40">
                    <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
                  </svg>
                  No agreements found
                </div>
              )}
            </>
          )
        )}
      </div>

      <div className="border-t border-[#e5e5e5] px-3 py-2.5 flex items-center justify-between flex-shrink-0" ref={filterRef}>
        <div className="relative">
          <button onClick={() => setFilterOpen(!filterOpen)}
            className={`relative w-9 h-9 flex items-center justify-center rounded-lg transition-all hover:scale-105 ${selectedPlants.length > 0 ? 'bg-[#ebf5ff] text-[#0a6ed1]' : 'text-[#0a6ed1] hover:bg-[#f0f7ff]'}`}
            title="Filter by plant">
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
        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden md:flex w-9 h-9 items-center justify-center rounded-lg text-[#6a6d70] hover:text-[#0a6ed1] hover:bg-[#f0f7ff] transition-all hover:scale-105"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease' }}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>
    </>
  )

  // ── Render ──
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

            {/* Mobile backdrop */}
            {mobileSidebarOpen && (
              <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
            )}

            {/* Mobile sidebar drawer */}
            <aside data-sidebar
              className={`fixed top-0 left-0 h-full w-[300px] bg-white border-r border-[#e5e5e5] flex flex-col z-50 md:hidden anim-drawer ${mobileSidebarOpen ? 'flex' : 'hidden'}`}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e5] bg-[#fafbfc]">
                <span className="text-[14px] font-semibold text-[#32363a]">Purchase Order</span>
                <button onClick={() => setMobileSidebarOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6a6d70] hover:text-[#cc1c14] hover:bg-[#fce8e6] transition-all">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <SidebarContent />
            </aside>

            {/* Desktop sidebar */}
            <aside data-sidebar
              className={`hidden md:flex overflow-hidden flex-col bg-white border-r border-[#e5e5e5] sidebar-transition anim-slide-l flex-shrink-0 h-screen sticky top-0 ${sidebarCollapsed ? 'w-[56px]' : 'w-[300px] lg:w-[340px]'}`}>
              <SidebarContent />
            </aside>

            {/* Main pane */}
            <main className="flex-1 bg-white overflow-hidden flex flex-col anim-slide-r min-w-0">

              {/* Detail loading */}
              {detailLoading && (
                <div className="flex-1 flex items-center justify-center py-20">
                  <div className="w-10 h-10 border-2 border-[#0a6ed1] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Detail error */}
              {!detailLoading && detailError && (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-[#cc1c14] gap-2">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                  </svg>
                  <p className="text-[14px]">{detailError}</p>
                </div>
              )}

              {/* No selection */}
              {!detailLoading && !detailError && !agreement && (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-[#6a6d70] gap-3">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-30">
                    <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  <p className="text-[14px]">Select a purchase order</p>
                </div>
              )}

              {!detailLoading && !detailError && agreement && (
                <>
                  {/* Header */}
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
                        <div className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1.5">Purchase Order</div>
                        <h2 className="text-[20px] sm:text-[24px] font-bold text-[#0a6ed1] tracking-tight">{agreement.poNo}</h2>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 text-[14px]">
                      <div>
                        <div className="text-[#6a6d70] text-[12px] uppercase tracking-wider mb-1 font-semibold">Buyer</div>
                        <div className="text-[#32363a] font-medium">{agreement.buyerName || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[#6a6d70] text-[12px] uppercase tracking-wider mb-1 font-semibold">Plant</div>
                        <div className="text-[#32363a] font-medium">{agreement.plantDesc} ({agreement.plant})</div>
                      </div>
                      <div>
                        <div className="text-[#6a6d70] text-[12px] uppercase tracking-wider mb-1 font-semibold">Purchase Group</div>
                        <div className="text-[#32363a] font-medium">{agreement.purchaseGroupDesc || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[#6a6d70] text-[12px] uppercase tracking-wider mb-1 font-semibold">Currency</div>
                        <div className="text-[#32363a] font-medium">{agreement.currency}</div>
                      </div>
                    </div>
                  </div>

                  {/* Tab indicator */}
                  <div className="px-4 sm:px-6 lg:px-10 pt-5 sm:pt-6 flex-shrink-0">
                    <div className="inline-flex flex-col items-center pb-2.5 border-b-2 border-[#0a6ed1]">
                      <div className="w-10 h-10 rounded-full bg-[#0a6ed1] flex items-center justify-center mb-1.5 shadow-md transition-transform hover:scale-110">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                      </div>
                      <span className="text-[13px] text-[#0a6ed1] font-semibold">Items</span>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 border-b border-[#e5e5e5] flex-shrink-0">
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 items-start sm:items-center">
                      <div className="w-full sm:w-auto sm:min-w-[160px] sm:flex-1 sm:max-w-[200px]">
                        <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">Delivery From Date</label>
                        <input type="date"
                          value={ddmmyyyyToIso(fromDate)}
                          onChange={(e) => setFromDate(isoToDdmmyyyy(e.target.value))}
                          max={toDate ? ddmmyyyyToIso(toDate) : undefined}
                          className={`w-full h-10 pl-3 pr-2 text-[14px] border rounded-lg bg-white focus:outline-none focus:ring-2 transition-all duration-200 ${dateError ? 'border-[#cc1c14] focus:border-[#cc1c14] focus:ring-[#cc1c14]/20' : 'border-[#d9d9d9] focus:border-[#0a6ed1] focus:ring-[#0a6ed1]/20'}`}
                        />
                      </div>
                      <div className="w-full sm:w-auto sm:min-w-[160px] sm:flex-1 sm:max-w-[200px]">
                        <label className="block text-[13px] text-[#6a6d70] mb-1.5 font-semibold">To Date</label>
                        <input type="date"
                          value={ddmmyyyyToIso(toDate)}
                          onChange={(e) => setToDate(isoToDdmmyyyy(e.target.value))}
                          min={fromDate ? ddmmyyyyToIso(fromDate) : undefined}
                          className={`w-full h-10 pl-3 pr-2 text-[14px] border rounded-lg bg-white focus:outline-none focus:ring-2 transition-all duration-200 ${dateError ? 'border-[#cc1c14] focus:border-[#cc1c14] focus:ring-[#cc1c14]/20' : 'border-[#d9d9d9] focus:border-[#0a6ed1] focus:ring-[#0a6ed1]/20'}`}
                        />
                      </div>
                      {/* Clear button — vertically centered via items-center on the parent row,
                          with a top label spacer so it sits flush with the inputs */}
                      <div className="w-full sm:w-auto sm:self-auto flex flex-col">
                        <span className="hidden sm:block text-[13px] mb-1.5 select-none opacity-0 pointer-events-none font-semibold">Clear</span>
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

                  {/* Items table — single table with sticky thead for perfect column alignment */}
                  <div className="px-4 sm:px-6 lg:px-10 pt-4 sm:pt-6 pb-0 overflow-hidden flex flex-col" style={{ height: '40vh' }}>
                    <div className="rounded-xl border border-[#e5e5e5] shadow-sm overflow-auto flex-1">
                      <table className="w-full text-[14px]" style={{ minWidth: '640px', borderCollapse: 'collapse' }}>
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-gradient-to-b from-[#fafbfc] to-[#f5f6f7] border-b border-[#e5e5e5] text-[#6a6d70]">
                            <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider w-[90px]">Item No.</th>
                            <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider w-[100px]">Material</th>
                            <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider w-[110px]">HSN Code</th>
                            <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider w-[100px]">PO Qty</th>
                            <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider w-[110px]">ASN Created</th>
                            <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider w-[110px]">Unit Price</th>
                            <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider w-[120px]">Status</th>
                            <th className="w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="row-stagger">
                          {filteredItems.length === 0 && (
                            <tr>
                              <td colSpan={8} className="py-12 text-center text-[14px] text-[#6a6d70]">
                                No items match the current filters
                              </td>
                            </tr>
                          )}
                          {filteredItems.map((item, idx) => (
                            <tr key={`${item.itemNo}-${idx}`}
                              onClick={() => setSelectedItem({ poNo: agreement.poNo, itemNo: item.itemNo })}
                              className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#ebf5ff] cursor-pointer transition-all duration-200 group">
                              <td className="py-3.5 px-4 text-[#32363a] font-semibold">{item.itemNo}</td>
                              <td className="py-3.5 px-4">
                                <div className="text-[#32363a] font-medium">{item.materialName}</div>
                                <div className="text-[#0a6ed1] font-medium text-[13px]">{item.materialNumber}</div>
                              </td>
                              <td className="py-3.5 px-4 text-[#32363a]">{item.hsnCode}</td>
                              <td className="py-3.5 px-4 text-[#32363a]">
                                <span className="font-semibold">{item.poQty}</span>{' '}
                                <span className="text-[#6a6d70] text-[13px]">{item.deliveryUnit}</span>
                              </td>
                              <td className="py-3.5 px-4 text-[#32363a]">
                                {item.deliveredQty} <span className="text-[#6a6d70] text-[13px]">{item.deliveryUnit}</span>
                              </td>
                              <td className="py-3.5 px-4 text-[#32363a] font-semibold">{item.unitPrice}</td>
                              <td className="py-3.5 px-4">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#e8f5ec] text-[#107e3e] rounded-full text-[13px] font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#107e3e] animate-pulse"></span>
                                  {item.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-3">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                  className="text-[#0a6ed1] group-hover:translate-x-1.5 transition-transform duration-200">
                                  <path d="M9 18l6-6-6-6" />
                                </svg>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Footer actions */}
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
                        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                      Confirm
                    </button>
                  </div>
                </>
              )}
            </main>
          </div>
        ) : (
          /* Drilled item view */
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
                    <div className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1.5">Material Number</div>
                    <h2 className="text-[22px] sm:text-[26px] font-bold text-[#0a6ed1] tracking-tight">{drilledItem.materialNumber}</h2>
                    <div className="text-[14px] text-[#6a6d70] mt-1.5">{drilledItem.materialName}</div>
                  </div>
                </div>

                {/* Item detail fields */}
                <div className="px-4 sm:px-6 lg:px-10 py-5 sm:py-7">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-[#fafbfc] rounded-xl border border-[#e5e5e5]">
                    {[
                      ['HSN Code', drilledItem.hsnCode],
                      // ['Storage Location', drilledItem.storageLocation || '—'],
                      ['PO Qty', `${drilledItem.poQty} ${drilledItem.deliveryUnit}`],
                      ['ASN Created', `${drilledItem.deliveredQty} ${drilledItem.deliveryUnit}`],
                      ['Unit Price', `${drilledItem.unitPrice} ${drilledItem.currency}`],
                      ['IGST %', drilledItem.igstPer || '0'],
                      ['Ship Date', drilledItem.shipDate || '—'],
                      ['Dispatch Date', drilledItem.dispdate || '—'],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">{label}</div>
                        <div className="text-[14px] font-medium text-[#32363a]">{val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Schedule lines — populated only if fetched separately */}
                  {drilledItem.scheduleLines?.length > 0 && (
                    <div className="overflow-x-auto rounded-xl border border-[#e5e5e5] shadow-sm">
                      <table className="w-full text-[14px]" style={{ minWidth: '480px' }}>
                        <thead>
                          <tr className="bg-gradient-to-b from-[#fafbfc] to-[#f5f6f7] border-b border-[#e5e5e5] text-[#6a6d70]">
                            <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">Sch. Line</th>
                            <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">Delivery Date</th>
                            <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">Scheduled Qty</th>
                            <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">Confirmed Qty</th>
                          </tr>
                        </thead>
                        <tbody className="row-stagger">
                          {drilledItem.scheduleLines.map((line, idx) => (
                            <tr key={`${line.schLineNo}-${idx}`} className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc] transition-colors duration-200">
                              <td className="py-4 px-4">
                                <span className="inline-flex items-center justify-center w-8 h-8 bg-[#ebf5ff] text-[#0a6ed1] rounded-full text-[13px] font-bold">
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
                  )}
                </div>
              </>
            )}
          </main>
        )}
      </div>
    </PageLayout>
  )
}