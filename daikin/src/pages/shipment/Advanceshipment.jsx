import { useState, useMemo, useRef, useEffect } from 'react'
import PageLayout from '../../layouts/PageLayout.jsx'

// ═══════════════════════════════════════════════════════════════
// DUMMY DATA (currently in use)
// ═══════════════════════════════════════════════════════════════
const ADVANCE_SHIPPING_NOTES = [
  {
    id: '2600000045/2026',
    amount: 968.80,
    currency: 'INR',
    baseDocument: 'PO: 7000037139',
    plant: 'NMR',
    plantName: 'FIEM Industries Limited - NMR',
    date: 'May 06, 2026',
    status: 'Tagged',
    statusColor: 'red',
    vendor: 'Kunstocom(India) Ltd',
    generalData: {
      supplierInvoice: 'GH12',
      baseDocument: 'PO : 7000037139',
      invoiceAmount: 968.80,
      invoiceDate: 'May 06, 2026',
    },
    items: [
      {
        deliveryDate: '19.05.2026',
        material: 'DISCH.GRILLE 1P302790-1 G',
        quantity: 10,
        unit: 'NOS',
        amount: 968.80,
        hsnSac: '84159000',
        igst: 0.00,
        cgst: 87.19,
        sgstUtgst: 87.19,
      },
    ],
    taxSummary: {
      taxableValue: 968.80,
      igst: 0.00,
      cgst: 87.19,
      sgstUtgst: 87.19,
      unPlannedCost: 0.00,
      totalAmount: 1143.18,
    },
    shipment: {
      trackingNo: '1000001175',
      driverName: 'SDH',
      contactNumber: '6787897678',
      transporterName: 'BNE',
      transportMode: 'By Road',
      vehicleRegNo: 'UP67',
      creationDate: '06.05.2026',
      creationTime: '14:13:58',
    },
    attachments: [
      { name: 'Shipment Number 254.pdf', type: 'PDF' },
    ],
  },
  {
    id: '2600000078/2026',
    amount: 50.00,
    currency: 'INR',
    baseDocument: 'SA: 5501000409',
    plant: 'SR01',
    plantName: 'Sri City FG',
    date: 'May 06, 2026',
    status: 'Confirmed',
    statusColor: 'red',
    vendor: 'Kunstocom(India) Ltd',
    generalData: {
      supplierInvoice: 'INV-0044',
      baseDocument: 'SA : 5501000409',
      invoiceAmount: 50.00,
      invoiceDate: 'May 06, 2026',
    },
    items: [
      {
        deliveryDate: '20.05.2026',
        material: 'Fan Blade Assembly A1',
        quantity: 1,
        unit: 'NOS',
        amount: 50.00,
        hsnSac: '84159000',
        igst: 0.00,
        cgst: 0.90,
        sgstUtgst: 0.90,
      },
    ],
    taxSummary: {
      taxableValue: 50.00,
      igst: 0.00,
      cgst: 0.90,
      sgstUtgst: 0.90,
      unPlannedCost: 0.00,
      totalAmount: 11.80,
    },
    shipment: {
      trackingNo: '1000001177',
      driverName: 'RKS',
      contactNumber: '9876543210',
      transporterName: 'DHL',
      transportMode: 'By Road',
      vehicleRegNo: 'TN22',
      creationDate: '06.05.2026',
      creationTime: '10:30:00',
    },
    attachments: [],
  },
  {
    id: '2600000044/2026',
    amount: 10.00,
    currency: 'INR',
    baseDocument: 'SA: 5501000407',
    plant: 'SR01',
    plantName: 'Sri City FG',
    date: 'May 06, 2026',
    status: 'Tagged',
    statusColor: 'red',
    vendor: 'Kunstocom(India) Ltd',
    generalData: {
      supplierInvoice: 'INV-0044',
      baseDocument: 'SA : 5501000407',
      invoiceAmount: 10.00,
      invoiceDate: 'May 06, 2026',
    },
    items: [
      {
        deliveryDate: '20.05.2026',
        material: 'Fan Blade Assembly A1',
        quantity: 1,
        unit: 'NOS',
        amount: 10.00,
        hsnSac: '84159000',
        igst: 0.00,
        cgst: 0.90,
        sgstUtgst: 0.90,
      },
    ],
    taxSummary: {
      taxableValue: 10.00,
      igst: 0.00,
      cgst: 0.90,
      sgstUtgst: 0.90,
      unPlannedCost: 0.00,
      totalAmount: 11.80,
    },
    shipment: {
      trackingNo: '1000001176',
      driverName: 'RKS',
      contactNumber: '9876543210',
      transporterName: 'DHL',
      transportMode: 'By Road',
      vehicleRegNo: 'TN22',
      creationDate: '06.05.2026',
      creationTime: '10:30:00',
    },
    attachments: [],
  },
  {
    id: '2600000042/2026',
    amount: 193.76,
    currency: 'INR',
    baseDocument: 'PO: 7000037139',
    plant: 'NMR',
    plantName: 'FIEM Industries Limited - NMR',
    date: 'May 06, 2026',
    status: 'Tagged',
    statusColor: 'red',
    vendor: 'Kunstocom(India) Ltd',
    generalData: {
      supplierInvoice: 'INV-0042',
      baseDocument: 'PO : 7000037139',
      invoiceAmount: 193.76,
      invoiceDate: 'May 06, 2026',
    },
    items: [
      {
        deliveryDate: '15.05.2026',
        material: 'Compressor Housing CFF',
        quantity: 2,
        unit: 'NOS',
        amount: 193.76,
        hsnSac: '8415',
        igst: 0.00,
        cgst: 17.44,
        sgstUtgst: 17.44,
      },
    ],
    taxSummary: {
      taxableValue: 193.76,
      igst: 0.00,
      cgst: 17.44,
      sgstUtgst: 17.44,
      unPlannedCost: 0.00,
      totalAmount: 228.64,
    },
    shipment: {
      trackingNo: '1000001174',
      driverName: 'VKR',
      contactNumber: '9812345678',
      transporterName: 'Bluedart',
      transportMode: 'By Road',
      vehicleRegNo: 'RJ14',
      creationDate: '06.05.2026',
      creationTime: '09:45:22',
    },
    attachments: [
      { name: 'Invoice_0042.pdf', type: 'PDF' },
      { name: 'Quality_Certificate.pdf', type: 'PDF' },
    ],
  },
  {
    id: '2600000041/2026',
    amount: 72.00,
    currency: 'INR',
    baseDocument: 'SA: 5501000365',
    plant: 'NM01',
    plantName: 'Neemrana Plant',
    date: 'Apr 30, 2026',
    status: 'Open',
    statusColor: 'green',
    vendor: 'Kunstocom(India) Ltd',
    generalData: {
      supplierInvoice: 'INV-0041',
      baseDocument: 'SA : 5501000365',
      invoiceAmount: 72.00,
      invoiceDate: 'Apr 30, 2026',
    },
    items: [
      {
        deliveryDate: '10.05.2026',
        material: 'Refrigerant Line Kit B2',
        quantity: 4,
        unit: 'NOS',
        amount: 72.00,
        hsnSac: '8415',
        igst: 6.48,
        cgst: 0.00,
        sgstUtgst: 0.00,
      },
    ],
    taxSummary: {
      taxableValue: 72.00,
      igst: 6.48,
      cgst: 0.00,
      sgstUtgst: 0.00,
      unPlannedCost: 0.00,
      totalAmount: 78.48,
    },
    shipment: {
      trackingNo: '1000001173',
      driverName: 'PKS',
      contactNumber: '9011234567',
      transporterName: 'GATI',
      transportMode: 'By Road',
      vehicleRegNo: 'HR26',
      creationDate: '30.04.2026',
      creationTime: '16:20:10',
    },
    attachments: [
      { name: 'Packing_List_41.pdf', type: 'PDF' },
    ],
  },
]

// ═══════════════════════════════════════════════════════════════
// API STRUCTURE — for future backend integration
// ═══════════════════════════════════════════════════════════════
const API_BASE_URL = '/api/v1'
const USE_MOCK = true

const asnApi = {
  async listAsns({ search = '', plants = [] } = {}) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 100))
      return ADVANCE_SHIPPING_NOTES.filter(a => {
        const q = search.trim().toLowerCase()
        const matchSearch = !q ||
          a.id.toLowerCase().includes(q) ||
          a.plantName.toLowerCase().includes(q) ||
          a.plant.toLowerCase().includes(q) ||
          a.baseDocument.toLowerCase().includes(q)
        const matchPlant = plants.length === 0 || plants.includes(a.plant)
        return matchSearch && matchPlant
      })
    }
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (plants.length) params.set('plants', plants.join(','))
    const res = await fetch(`${API_BASE_URL}/asn?${params}`)
    if (!res.ok) throw new Error('Failed to fetch ASNs')
    return res.json()
  },

  async getAsn(id) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 100))
      return ADVANCE_SHIPPING_NOTES.find(a => a.id === id) || null
    }
    const res = await fetch(`${API_BASE_URL}/asn/${encodeURIComponent(id)}`)
    if (!res.ok) throw new Error('Failed to fetch ASN')
    return res.json()
  },

  async printAsn(id) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 200))
      return { success: true, id }
    }
    const res = await fetch(`${API_BASE_URL}/asn/${encodeURIComponent(id)}/print`, { method: 'POST' })
    if (!res.ok) throw new Error('Failed to print ASN')
    return res.json()
  },

  async downloadAttachment(asnId, fileName) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 150))
      return { success: true, url: `#mock-download/${fileName}` }
    }
    const res = await fetch(`${API_BASE_URL}/asn/${encodeURIComponent(asnId)}/attachments/${encodeURIComponent(fileName)}`)
    if (!res.ok) throw new Error('Failed to download attachment')
    return res.json()
  },
}

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
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    ),
  },
  {
    key: 'items',
    label: 'Items',
    color: '#107e3e',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : '#107e3e'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    key: 'shipment',
    label: 'Shipment',
    color: '#e76500',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : '#e76500'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="1" />
        <path d="M16 8h4l3 3v5h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
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
// COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function AdvanceShippingNote() {
  const [asns, setAsns] = useState([])
  const [asn, setAsn] = useState(null)
  const [selectedAsnId, setSelectedAsnId] = useState('2600000045/2026')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlants, setSelectedPlants] = useState([])
  const [filterOpen, setFilterOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('items')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const filterRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    asnApi.listAsns({ search: searchQuery, plants: selectedPlants })
      .then(data => { if (!cancelled) setAsns(data) })
      .catch(err => console.error(err))
    return () => { cancelled = true }
  }, [searchQuery, selectedPlants])

  useEffect(() => {
    let cancelled = false
    if (!selectedAsnId) { setAsn(null); return }
    asnApi.getAsn(selectedAsnId)
      .then(data => { if (!cancelled) { setAsn(data); setActiveTab('items') } })
      .catch(err => console.error(err))
    return () => { cancelled = true }
  }, [selectedAsnId])

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

  const plants = useMemo(() => {
    const map = new Map()
    ADVANCE_SHIPPING_NOTES.forEach(a => map.set(a.plant, a.plantName))
    return Array.from(map, ([code, name]) => ({ code, name }))
  }, [])

  const togglePlant = (plant) => {
    if (selectedPlants.includes(plant)) setSelectedPlants(selectedPlants.filter(p => p !== plant))
    else setSelectedPlants([...selectedPlants, plant])
  }

  const handleSelectAsn = (id) => {
    setSelectedAsnId(id)
    setMobileSidebarOpen(false)
  }

  const handlePrint = async () => {
    if (!asn) return
    try { await asnApi.printAsn(asn.id) } catch (err) { console.error(err) }
  }

  const statusStyle = (statusColor) =>
    statusColor === 'red'
      ? 'text-[#cc1c14] bg-[#fce8e6]'
      : 'text-[#107e3e] bg-[#e8f5ec]'

  // ── Sidebar inner content ──
  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="px-4 py-4 border-b border-[#e5e5e5] flex-shrink-0">
        {!sidebarCollapsed && (
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-semibold text-[#32363a]">Advance Shipping Notes</h3>
            <span className="text-[12px] text-[#6a6d70] bg-[#f5f6f7] px-2.5 py-1 rounded-full">
              {asns.length} of {ADVANCE_SHIPPING_NOTES.length}
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

      {/* ASN list */}
      <div className="flex-1 overflow-y-auto min-h-0 row-stagger">
        {sidebarCollapsed ? (
          asns.map((a) => {
            const isSelected = a.id === selectedAsnId
            return (
              <button key={a.id} onClick={() => handleSelectAsn(a.id)} title={a.id}
                className={`w-full flex items-center justify-center py-3 border-b border-[#e5e5e5] transition-all duration-200 border-l-[3px] ${isSelected ? 'bg-[#ebf5ff] border-l-[#0a6ed1]' : 'hover:bg-[#f5f6f7] border-l-transparent'}`}
              >
                <span className={`text-[11px] font-bold ${isSelected ? 'text-[#0a6ed1]' : 'text-[#6a6d70]'}`}>
                  {a.id.slice(0, 4)}
                </span>
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

      {/* Footer: filter + collapse toggle */}
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

  // ── Tab content renderers ──
  const renderGeneralData = () => {
    if (!asn) return null
    const g = asn.generalData
    return (
      <div className="anim-fade px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 max-w-2xl">
          <div>
            <div className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1.5">Supplier Invoice</div>
            <div className="text-[15px] font-semibold text-[#32363a]">{g.supplierInvoice}</div>
          </div>
          <div>
            <div className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1.5">Invoice Amount</div>
            <div className="text-[15px] font-semibold text-[#32363a]">{g.invoiceAmount.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1.5">Base Document</div>
            <div className="text-[15px] font-semibold text-[#0a6ed1]">{g.baseDocument}</div>
          </div>
          <div>
            <div className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1.5">Invoice Date</div>
            <div className="text-[15px] font-semibold text-[#32363a]">{g.invoiceDate}</div>
          </div>
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
                <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">Delivery Date</th>
                <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">Material</th>
                <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">Quantity</th>
                <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">Amount</th>
                <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">HSN/SAC</th>
                <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">IGST</th>
                <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">CGST</th>
                <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">SGST/UTGST</th>
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
              <div
                key={label}
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
            {asn.attachments.map((att, idx) => (
              <button
                key={idx}
                onClick={() => asnApi.downloadAttachment(asn.id, att.name)}
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-[#e5e5e5] bg-white hover:bg-[#f5f6f7] hover:border-[#0a6ed1] hover:shadow-md transition-all duration-200 group text-left"
              >
                <div className="w-10 h-10 flex items-center justify-center bg-[#fce8e6] rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cc1c14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-[#0a6ed1] group-hover:underline truncate">{att.name}</div>
                  <div className="text-[12px] text-[#6a6d70] mt-0.5">{att.type} Document</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#6a6d70] group-hover:text-[#0a6ed1] group-hover:translate-y-0.5 transition-all flex-shrink-0">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  const tabContent = {
    general: renderGeneralData,
    items: renderItems,
    shipment: renderShipment,
    attachments: renderAttachments,
  }

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

      {/* Top context bar */}
      <div className="bg-white border-b border-[#e5e5e5] px-4 sm:px-6 lg:px-10 py-2 text-[13px] text-[#6a6d70] flex flex-wrap gap-x-6 gap-y-1">
        <span><span className="font-semibold text-[#32363a]">Company Code:</span> DSAL (FIEM Industries Limited)</span>
        <span><span className="font-semibold text-[#32363a]">Supplier Name:</span> Kunstocom(India) Ltd</span>
        <span className="ml-auto"><span className="font-semibold text-[#32363a]">Supplier Location:</span> NEEMRANA(alwar)</span>
      </div>

      <div className="bg-[#f5f6f7] min-h-[calc(100vh-136px)]">
        <div className="flex" style={{ minHeight: 'calc(100vh - 260px)' }}>

          {/* Mobile overlay */}
          {mobileSidebarOpen && (
            <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
          )}

          {/* Mobile sidebar drawer */}
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

          {/* Desktop sidebar */}
          <aside data-sidebar
            className={`hidden md:flex overflow-hidden flex-col bg-white border-r border-[#e5e5e5] sidebar-transition anim-slide-l flex-shrink-0 h-screen sticky top-0 ${sidebarCollapsed ? 'w-[56px]' : 'w-[300px] lg:w-[340px]'}`}
          >
            <SidebarContent />
          </aside>

          {/* Right pane */}
          <main className="flex-1 bg-white overflow-y-auto anim-slide-r min-w-0">
            {asn && (
              <>
                {/* Header */}
                <div className="px-4 sm:px-6 lg:px-10 pt-5 sm:pt-7 pb-5 border-b border-[#e5e5e5] bg-gradient-to-b from-[#fafbfc] to-white">
                  {/* Mobile hamburger */}
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
                      <div className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1.5">
                        ASN — {asn.id}
                      </div>
                      <div className="flex items-baseline gap-4">
                        <h2 className="text-[22px] sm:text-[26px] font-bold text-[#32363a] tracking-tight">{asn.id}</h2>
                        <span className="text-[22px] sm:text-[26px] font-bold text-[#32363a]">{asn.amount.toFixed(2)}</span>
                        <span className="text-[14px] text-[#6a6d70] self-end pb-1">{asn.currency}</span>
                      </div>
                      <div className="text-[14px] text-[#6a6d70] mt-1">Plant: {asn.plantName} ({asn.plant})</div>
                    </div>
                    <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                      <span className="hidden sm:block text-[13px] text-[#6a6d70]">{asn.date}</span>
                      <button
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 px-3 sm:px-4 h-9 text-[13px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md"
                      >
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

                {/* Tabs */}
                <div className="px-4 sm:px-6 lg:px-10 pt-6 pb-0 border-b border-[#e5e5e5] bg-white">
                  <div className="flex items-end gap-6 sm:gap-10 overflow-x-auto">
                    {TABS.map((tab) => {
                      const isActive = activeTab === tab.key
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          className={`flex flex-col items-center pb-3 border-b-2 transition-all duration-200 flex-shrink-0 ${isActive ? 'border-[#0a6ed1]' : 'border-transparent hover:border-[#d9d9d9]'}`}
                        >
                          <div
                            className={`w-11 h-11 rounded-full flex items-center justify-center mb-1.5 shadow-sm transition-all duration-200 ${isActive ? 'shadow-md scale-110' : 'hover:scale-105'}`}
                            style={{ backgroundColor: isActive ? tab.color : '#f0f4f8' }}
                          >
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

                {/* Tab content */}
                <div key={activeTab}>
                  {tabContent[activeTab]?.()}
                </div>
              </>
            )}

            {!asn && (
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