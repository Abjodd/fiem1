import { useState, useMemo, useRef, useEffect } from 'react'
import PageLayout from '../../layouts/PageLayout.jsx'
import { asnApi } from '../../services/Advanceshipment.js'

// ═══════════════════════════════════════════════════════════════
// TABS CONFIG
// ═══════════════════════════════════════════════════════════════
const TABS = [
  {
    key: 'general',
    label: 'General Data',
    color: '#0a6ed1',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : '#0a6ed1'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
      </svg>
    ),
  },
  {
    key: 'items',
    label: 'Items',
    color: '#107e3e',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : '#107e3e'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    key: 'shipment',
    label: 'Shipment',
    color: '#e76500',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : '#e76500'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 3v5h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    key: 'attachments',
    label: 'Attachments',
    color: '#cc1c14',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : '#cc1c14'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
      </svg>
    ),
  },
]

// ═══════════════════════════════════════════════════════════════
// CANCEL DIALOG
// ═══════════════════════════════════════════════════════════════
function CancelConfirmDialog({ asnId, onConfirm, onDismiss, loading }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center px-4" onClick={onDismiss}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 anim-scale" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#fce8e6] flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cc1c14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h3 className="text-[16px] font-bold text-[#32363a]">Cancel ASN?</h3>
        </div>
        <p className="text-[14px] text-[#6a6d70] mb-5">
          ASN <span className="font-semibold text-[#32363a]">{asnId}</span> will be permanently deleted. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onDismiss} disabled={loading}
            className="flex-1 h-9 text-[13px] font-semibold text-[#32363a] border border-[#d9d9d9] rounded-lg hover:bg-[#f5f6f7] transition-all disabled:opacity-50">
            Go Back
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 h-9 text-[13px] font-semibold text-white bg-[#cc1c14] rounded-lg hover:bg-[#a81610] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25" /><path d="M21 12a9 9 0 00-9-9" />
                </svg>
                Cancelling…
              </>
            ) : 'Yes, Cancel ASN'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function AdvanceShippingNote() {
  const [asns, setAsns] = useState([])
  const [asn, setAsn] = useState(null)
  const [selectedAsnId, setSelectedAsnId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [downloadingFile, setDownloadingFile] = useState(null) // track which file is downloading

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlants, setSelectedPlants] = useState([])
  const [filterOpen, setFilterOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('items')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  const filterRef = useRef(null)

  // ── Fetch list ──
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    asnApi.listAsns({ search: searchQuery, plants: selectedPlants })
      .then(data => { if (!cancelled) setAsns(data) })
      .catch(err => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [searchQuery, selectedPlants])

  // ── Auto-select first ASN ──
  useEffect(() => {
    if (!selectedAsnId && asns.length > 0) setSelectedAsnId(asns[0].id)
  }, [asns, selectedAsnId])

  // ── Fetch ASN detail + attachments ──
  useEffect(() => {
    let cancelled = false
    if (!selectedAsnId) { setAsn(null); return }

    asnApi.getAsn(selectedAsnId)
      .then(async (data) => {
        if (cancelled || !data) return
        // fetch attachments separately, don't block on failure
        try {
          data.attachments = await asnApi.getAttachments(data.asnNum, data.fisYear)
        } catch (e) {
          console.error('Attachments fetch failed:', e)
          data.attachments = []
        }
        if (!cancelled) { setAsn(data); setActiveTab('items') }
      })
      .catch(err => { if (!cancelled) console.error('ASN detail fetch failed:', err) })
    return () => { cancelled = true }
  }, [selectedAsnId])

  // ── Close filter on outside click ──
  useEffect(() => {
    const h = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // ── Close mobile sidebar on outside click ──
  useEffect(() => {
    if (!mobileSidebarOpen) return
    const h = (e) => {
      if (!e.target.closest('[data-sidebar]') && !e.target.closest('[data-sidebar-toggle]'))
        setMobileSidebarOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [mobileSidebarOpen])

  const plants = useMemo(() => {
    const map = new Map()
    asns.forEach(a => { if (a.plant) map.set(a.plant, a.plantName) })
    return Array.from(map, ([code, name]) => ({ code, name }))
  }, [asns])

  const togglePlant = (plant) =>
    setSelectedPlants(prev => prev.includes(plant) ? prev.filter(p => p !== plant) : [...prev, plant])

  const handleSelectAsn = (id) => { setSelectedAsnId(id); setMobileSidebarOpen(false) }

  const handlePrint = async () => {
    if (!asn) return
    try { await asnApi.printAsn(asn.id) } catch (err) { console.error(err) }
  }

  const handleCancelClick = () => setCancelDialogOpen(true)

  const handleCancelConfirm = async () => {
    if (!asn) return
    setCancelLoading(true)
    try {
      await asnApi.cancelAsn(asn.id)
      setAsns(prev => prev.filter(a => a.id !== asn.id))
      setAsn(null)
      setSelectedAsnId(null)
      setCancelDialogOpen(false)
    } catch (err) {
      console.error(err)
    } finally {
      setCancelLoading(false)
    }
  }

  const handleCancelDismiss = () => { if (!cancelLoading) setCancelDialogOpen(false) }

  // ── Download handler — passes full attachment object ──
  const handleDownload = async (attachment) => {
    if (downloadingFile === attachment.name) return // already in progress
    setDownloadingFile(attachment.name)
    try {
      await asnApi.downloadAttachment(asn.asnNum, asn.fisYear, attachment)
    } catch (err) {
      console.error('Download failed:', err)
      alert(`Could not download "${attachment.name}". Please try again.`)
    } finally {
      setDownloadingFile(null)
    }
  }

  const statusStyle = (statusColor) => {
    if (statusColor === 'blue') return 'text-[#0a6ed1] bg-[#ebf5ff]'
    if (statusColor === 'red') return 'text-[#cc1c14] bg-[#fce8e6]'
    return 'text-[#107e3e] bg-[#e8f5ec]'
  }

  // ═══════════════════════════════════════════════════════════════
  // SIDEBAR
  // ═══════════════════════════════════════════════════════════════
  const SidebarContent = () => (
    <>
      <div className="px-4 py-4 border-b border-[#e5e5e5] flex-shrink-0">
        {!sidebarCollapsed && (
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-semibold text-[#32363a]">Advance Shipping Notes</h3>
            <span className="text-[12px] text-[#6a6d70] bg-[#f5f6f7] px-2.5 py-1 rounded-full">{asns.length}</span>
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
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
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
        {loading ? (
          <div className="flex items-center justify-center py-12 text-[#6a6d70] text-[13px]">
            <svg className="animate-spin mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25" /><path d="M21 12a9 9 0 00-9-9" />
            </svg>
            Loading…
          </div>
        ) : error ? (
          <div className="px-4 py-8 text-center text-[13px] text-[#cc1c14]">{error}</div>
        ) : sidebarCollapsed ? (
          asns.map((a) => {
            const isSelected = a.id === selectedAsnId
            return (
              <button key={a.id} onClick={() => handleSelectAsn(a.id)} title={a.id}
                className={`w-full flex items-center justify-center py-3 border-b border-[#e5e5e5] transition-all duration-200 border-l-[3px] ${isSelected ? 'bg-[#ebf5ff] border-l-[#0a6ed1]' : 'hover:bg-[#f5f6f7] border-l-transparent'}`}
              >
                <span className={`text-[11px] font-bold ${isSelected ? 'text-[#0a6ed1]' : 'text-[#6a6d70]'}`}>{a.id.slice(0, 4)}</span>
              </button>
            )
          })
        ) : (
          <>
            {asns.map((a) => {
              const isSelected = a.id === selectedAsnId
              return (
                <button key={a.id} onClick={() => handleSelectAsn(a.id)}
                  className={`w-full text-left px-5 py-3.5 border-b border-[#e5e5e5] transition-all duration-200 border-l-[3px] pl-[17px] ${isSelected ? 'bg-[#ebf5ff] border-l-[#0a6ed1] shadow-sm' : 'hover:bg-[#f5f6f7] hover:translate-x-0.5 border-l-transparent'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[14px] font-semibold text-[#0a6ed1]">{a.id}</span>
                    <span className="text-[14px] font-bold text-[#32363a]">{a.amount.toFixed(2)}</span>
                  </div>
                  <div className="text-[12px] text-[#6a6d70] font-medium mb-1">{a.currency}</div>
                  <div className="text-[13px] text-[#6a6d70] mb-1">{a.baseDocument}</div>
                  <div className="flex items-center justify-between text-[13px] text-[#6a6d70]">
                    <span>{a.plant} / {a.date}</span>
                    {a.status && (
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusStyle(a.statusColor)}`}>
                        {a.status}
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-[#6a6d70] mt-0.5">{a.vendor}</div>
                </button>
              )
            })}
            {asns.length === 0 && (
              <div className="px-4 py-12 text-center text-[13px] text-[#6a6d70] anim-fade">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 opacity-40">
                  <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
                </svg>
                No ASNs found
              </div>
            )}
          </>
        )}
      </div>

      <div className="border-t border-[#e5e5e5] px-3 py-2.5 flex items-center justify-between flex-shrink-0" ref={filterRef}>
        <div className="relative">
          <button onClick={() => setFilterOpen(!filterOpen)}
            className={`relative w-9 h-9 flex items-center justify-center rounded-lg transition-all hover:scale-105 ${selectedPlants.length > 0 ? 'bg-[#ebf5ff] text-[#0a6ed1]' : 'text-[#0a6ed1] hover:bg-[#f0f7ff]'}`}
            title="Filter by plant"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18l-7 9v6l-4-2v-4L3 4z" /></svg>
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
                    <span className="text-[#32363a]"><span className="font-medium">{p.code}</span> — <span className="text-[#6a6d70]">{p.name}</span></span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
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

  // ═══════════════════════════════════════════════════════════════
  // TAB RENDERERS
  // ═══════════════════════════════════════════════════════════════
  const renderGeneralData = () => {
    if (!asn) return null
    const g = asn.generalData
    return (
      <div className="anim-fade px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 max-w-2xl">
          {[
            { label: 'Supplier Invoice', value: g.supplierInvoice },
            { label: 'Invoice Amount', value: g.invoiceAmount.toFixed(2) },
            { label: 'Base Document', value: g.baseDocument, highlight: true },
            { label: 'Invoice Date', value: g.invoiceDate },
          ].map(({ label, value, highlight }) => (
            <div key={label}>
              <div className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1.5">{label}</div>
              <div className={`text-[15px] font-semibold ${highlight ? 'text-[#0a6ed1]' : 'text-[#32363a]'}`}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderItems = () => {
    if (!asn) return null
    return (
      <div className="anim-fade px-4 sm:px-6 lg:px-10 py-6">
        <div className="overflow-x-auto rounded-xl border border-[#e5e5e5] shadow-sm mb-6">
          <table className="w-full text-[14px]" style={{ minWidth: '700px' }}>
            <thead>
              <tr className="bg-gradient-to-b from-[#fafbfc] to-[#f5f6f7] border-b border-[#e5e5e5] text-[#6a6d70]">
                {['Delivery Date', 'Material', 'Quantity', 'Amount', 'HSN/SAC', 'IGST', 'CGST', 'SGST/UTGST'].map(h => (
                  <th key={h} className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="row-stagger">
              {asn.items.map((item, idx) => (
                <tr key={idx} className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc] transition-colors duration-200">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-[#32363a] font-medium">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#6a6d70] flex-shrink-0">
                        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                      {item.deliveryDate}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-[#32363a] font-semibold">{item.material}</td>
                  <td className="py-4 px-4">
                    <span className="font-bold text-[15px] text-[#32363a]">{item.quantity}</span>{' '}
                    <span className="text-[#6a6d70] text-[13px]">{item.unit}</span>
                  </td>
                  <td className="py-4 px-4 font-semibold text-[#32363a]">{item.amount.toFixed(2)}</td>
                  <td className="py-4 px-4 text-[#32363a]">{item.hsnSac}</td>
                  <td className="py-4 px-4 text-[#32363a]">{item.igst.toFixed(2)}</td>
                  <td className="py-4 px-4 text-[#32363a]">{item.cgst.toFixed(2)}</td>
                  <td className="py-4 px-4 text-[#32363a]">{item.sgstUtgst.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Tax summary */}
        <div className="flex justify-end">
          <div className="w-full sm:w-[320px] rounded-xl border border-[#e5e5e5] shadow-sm overflow-hidden">
            <div className="bg-gradient-to-b from-[#fafbfc] to-[#f5f6f7] px-5 py-3 border-b border-[#e5e5e5]">
              <span className="text-[13px] font-semibold text-[#32363a] uppercase tracking-wider">Tax Summary</span>
            </div>
            {[
              { label: 'Taxable Value', value: asn.taxSummary.taxableValue },
              { label: 'IGST', value: asn.taxSummary.igst },
              { label: 'CGST', value: asn.taxSummary.cgst },
              { label: 'SGST/UTGST', value: asn.taxSummary.sgstUtgst },
              { label: 'Un-Planned Cost', value: asn.taxSummary.unPlannedCost },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-5 py-2.5 border-b border-[#f0f0f0] text-[14px]">
                <span className="text-[#6a6d70]">{label}</span>
                <span className="text-[#32363a] font-medium">{value.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#0a6ed1] text-[14px]">
              <span className="text-white font-semibold">Total Amount</span>
              <span className="text-white font-bold text-[16px]">{asn.taxSummary.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderShipment = () => {
    if (!asn) return null
    const s = asn.shipment
    const fields = [
      { label: 'Tracking No.', value: s.trackingNo, highlight: true },
      { label: 'Transport Mode', value: s.transportMode },
      { label: 'Driver Name', value: s.driverName },
      { label: 'Vehicle Reg. No. / Docket', value: s.vehicleRegNo },
      { label: 'Contact Number', value: s.contactNumber },
      { label: 'Creation Date', value: s.creationDate },
      { label: 'Transporter Name', value: s.transporterName },
      { label: 'Creation Time', value: s.creationTime },
    ]
    return (
      <div className="anim-fade px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <div className="rounded-xl border border-[#e5e5e5] shadow-sm overflow-hidden max-w-3xl">
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {fields.map(({ label, value, highlight }, idx) => (
              <div key={label}
                className={`flex flex-col px-5 py-4 border-b border-[#f0f0f0] ${idx % 2 === 1 ? 'sm:border-l border-[#f0f0f0]' : ''} last:border-b-0 hover:bg-[#fafbfc] transition-colors`}
              >
                <span className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">{label}</span>
                <span className={`text-[15px] font-semibold ${highlight ? 'text-[#0a6ed1]' : 'text-[#32363a]'}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderAttachments = () => {
    if (!asn) return null
    return (
      <div className="anim-fade px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <h3 className="text-[15px] font-semibold text-[#32363a] mb-4">
          Attachments ({asn.attachments.length})
        </h3>
        {asn.attachments.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-[#6a6d70]">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 opacity-40">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
            No attachments
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-w-lg">
            {asn.attachments.map((att, idx) => {
              const isDownloading = downloadingFile === att.name
              return (
                <button key={idx} onClick={() => handleDownload(att)} disabled={isDownloading}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-[#e5e5e5] bg-white hover:bg-[#f5f6f7] hover:border-[#0a6ed1] hover:shadow-md transition-all duration-200 group text-left disabled:opacity-60"
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-[#fce8e6] rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                    {isDownloading ? (
                      <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cc1c14" strokeWidth="2">
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25" /><path d="M21 12a9 9 0 00-9-9" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cc1c14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-[#0a6ed1] group-hover:underline truncate">{att.name}</div>
                    <div className="text-[12px] text-[#6a6d70] mt-0.5">
                      {isDownloading ? 'Downloading…' : `${att.type} Document`}
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className="text-[#6a6d70] group-hover:text-[#0a6ed1] group-hover:translate-y-0.5 transition-all flex-shrink-0">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const tabContent = { general: renderGeneralData, items: renderItems, shipment: renderShipment, attachments: renderAttachments }

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
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
        .sidebar-transition { transition: width 0.25s ease; }
      `}</style>

      {cancelDialogOpen && asn && (
        <CancelConfirmDialog asnId={asn.id} onConfirm={handleCancelConfirm} onDismiss={handleCancelDismiss} loading={cancelLoading} />
      )}

      <div className="bg-white border-b border-[#e5e5e5] px-4 sm:px-6 lg:px-10 py-2 text-[13px] text-[#6a6d70] flex flex-wrap gap-x-6 gap-y-1">
        <span><span className="font-semibold text-[#32363a]">Company Code:</span> DSAL (FIEM Industries Limited)</span>
        <span><span className="font-semibold text-[#32363a]">Supplier Name:</span> Kunstocom(India) Ltd</span>
        <span className="ml-auto"><span className="font-semibold text-[#32363a]">Supplier Location:</span> NEEMRANA(alwar)</span>
      </div>

      <div className="bg-[#f5f6f7] min-h-[calc(100vh-136px)]">
        <div className="flex" style={{ minHeight: 'calc(100vh - 260px)' }}>

          {mobileSidebarOpen && (
            <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
          )}

          <aside data-sidebar
            className={`fixed top-0 left-0 h-full w-[300px] bg-white border-r border-[#e5e5e5] flex flex-col z-50 md:hidden anim-drawer ${mobileSidebarOpen ? 'flex' : 'hidden'}`}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e5] bg-[#fafbfc]">
              <span className="text-[14px] font-semibold text-[#32363a]">Advance Shipping Notes</span>
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

          <main className="flex-1 bg-white overflow-y-auto anim-slide-r min-w-0">
            {asn ? (
              <>
                <div className="px-4 sm:px-6 lg:px-10 pt-5 sm:pt-7 pb-5 border-b border-[#e5e5e5] bg-gradient-to-b from-[#fafbfc] to-white">
                  <div className="flex items-center gap-3 mb-4 md:hidden">
                    <button data-sidebar-toggle onClick={() => setMobileSidebarOpen(true)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#d9d9d9] text-[#6a6d70] hover:text-[#0a6ed1] hover:border-[#0a6ed1] transition-all">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M3 6h18M3 12h18M3 18h18" />
                      </svg>
                    </button>
                    <span className="text-[13px] text-[#6a6d70]">ASNs</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1.5">ASN — {asn.id}</div>
                      <div className="flex items-baseline gap-4">
                        <h2 className="text-[22px] sm:text-[26px] font-bold text-[#32363a] tracking-tight">{asn.id}</h2>
                        <span className="text-[22px] sm:text-[26px] font-bold text-[#32363a]">{asn.amount.toFixed(2)}</span>
                        <span className="text-[14px] text-[#6a6d70] self-end pb-1">{asn.currency}</span>
                      </div>
                      <div className="text-[14px] text-[#6a6d70] mt-1">Plant: {asn.plantName} ({asn.plant})</div>
                    </div>
                    <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                      <span className="hidden sm:block text-[13px] text-[#6a6d70]">{asn.date}</span>
                      {asn.status === 'Confirmed' && (
                        <button onClick={handleCancelClick}
                          className="flex items-center gap-1.5 px-3 sm:px-4 h-9 text-[13px] font-semibold text-[#cc1c14] bg-white border border-[#cc1c14] rounded-lg hover:bg-[#fce8e6] hover:scale-[1.02] active:scale-[0.98] transition-all">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
                          </svg>
                          Cancel ASN
                        </button>
                      )}
                      <button onClick={handlePrint}
                        className="flex items-center gap-1.5 px-3 sm:px-4 h-9 text-[13px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 6 2 18 2 18 9" />
                          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                          <rect x="6" y="14" width="12" height="8" />
                        </svg>
                        Print
                      </button>
                    </div>
                  </div>
                </div>

                <div className="px-4 sm:px-6 lg:px-10 pt-6 pb-0 border-b border-[#e5e5e5] bg-white">
                  <div className="flex items-end gap-6 sm:gap-10 overflow-x-auto">
                    {TABS.map((tab) => {
                      const isActive = activeTab === tab.key
                      return (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                          className={`flex flex-col items-center pb-3 border-b-2 transition-all duration-200 flex-shrink-0 ${isActive ? 'border-[#0a6ed1]' : 'border-transparent hover:border-[#d9d9d9]'}`}
                        >
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-1.5 shadow-sm transition-all duration-200 ${isActive ? 'shadow-md scale-110' : 'hover:scale-105'}`}
                            style={{ backgroundColor: isActive ? tab.color : '#f0f4f8' }}>
                            {tab.icon(isActive)}
                          </div>
                          <span className={`text-[13px] font-semibold whitespace-nowrap transition-colors ${isActive ? 'text-[#0a6ed1]' : 'text-[#6a6d70] hover:text-[#32363a]'}`}>
                            {tab.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div key={activeTab}>{tabContent[activeTab]?.()}</div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-[#6a6d70] anim-fade">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-30">
                  <rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 3v5h-7V8z" />
                  <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                <span className="text-[14px]">Select an ASN from the list</span>
              </div>
            )}
          </main>
        </div>
      </div>
    </PageLayout>
  )
}