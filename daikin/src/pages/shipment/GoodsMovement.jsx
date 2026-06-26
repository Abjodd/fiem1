import { useState, useMemo, useRef, useEffect } from 'react'
import PageLayout from '../../layouts/PageLayout.jsx'
import CreateMovement from './createMovement.jsx'
import { goodsMovementApi, authConfig } from '../../services/GoodsMovement.js'
import { useNavigate } from 'react-router-dom'
import { generateShipmentNote } from '../../utils/generateShipmentNote.js'
import {
  FilePlus, Truck, ClipboardCheck, LogIn, PackageCheck, Clock,
  ChevronLeft, ChevronRight, RefreshCw, X, Menu, Printer, Search,
  ShieldCheck, HardHat, CalendarDays, Car, Phone, User,
  Hash, Banknote, Edit3, ExternalLink, Save, PlayCircle, AlertTriangle,
} from 'lucide-react'
import { useUser } from '../../context/UserContext.jsx'


// ═══════════════════════════════════════════════════════════════
// STATUS CHECK HELPERS
// Uses exact StatusText from SAP (case-insensitive)
// ═══════════════════════════════════════════════════════════════
const isUpdatableStatus = (status) => {
  if (!status) return false
  const s = status.toLowerCase()
  return s === 'shipped' || s === 'in transit'
}
const isYetToShipStatus = (status) => {
  if (!status) return false
  const s = status.toLowerCase()
  return s === 'yet to ship' || s === 'created'
}

// ═══════════════════════════════════════════════════════════════
// TABS CONFIG
// ═══════════════════════════════════════════════════════════════
const BASE_TABS = [
  { key: 'timeline', label: 'Timeline', color: '#0a6ed1', icon: (a) => <Clock size={20} color={a ? 'white' : '#0a6ed1'} strokeWidth={2} /> },
  { key: 'asn', label: 'ASN', color: '#107e3e', icon: (a) => <ClipboardCheck size={20} color={a ? 'white' : '#107e3e'} strokeWidth={2} /> },
]
const UPDATE_TAB = {
  key: 'update', label: 'Update Shipment', color: '#e76500',
  icon: (a) => <Edit3 size={20} color={a ? 'white' : '#e76500'} strokeWidth={2} />,
}

// ═══════════════════════════════════════════════════════════════
// TIMELINE STEP CONFIG  (gate_reporting removed)
// ═══════════════════════════════════════════════════════════════
const TIMELINE_STEPS = [
  { key: 'created',       label: 'Created',         Icon: FilePlus     },
  { key: 'shipped',       label: 'Shipped',         Icon: Truck        },
  { key: 'gate_entry',    label: 'Gate Entry (IN)', Icon: LogIn        },
  { key: 'goods_received',label: 'Goods Received',  Icon: PackageCheck },
  { key: 'completed',     label: 'Completed',       Icon: PackageCheck },
]

// ═══════════════════════════════════════════════════════════════
// STATUS STYLE HELPERS
// ═══════════════════════════════════════════════════════════════
const statusStyle = (c) => ({ green:'text-[#107e3e] bg-[#e8f5ec]', blue:'text-[#0a6ed1] bg-[#ebf5ff]', orange:'text-[#e76500] bg-[#fff3e8]', red:'text-[#cc1c14] bg-[#fce8e6]', gray:'text-[#6a6d70] bg-[#f5f6f7]' }[c] || 'text-[#6a6d70] bg-[#f5f6f7]')
const statusDotColor = (c) => ({ green:'#107e3e', blue:'#0a6ed1', orange:'#e76500', red:'#cc1c14', gray:'#6a6d70' }[c] || '#6a6d70')

// ═══════════════════════════════════════════════════════════════
// SIDEBAR CONTENT
// ═══════════════════════════════════════════════════════════════
function SidebarContent({
  trackings, totalCount, selectedId, searchQuery, sidebarCollapsed,
  onSelectTracking, onSearchChange, onToggleCollapse,
}) {
  return (
    <>
      <div className="px-4 py-4 border-b border-[#e5e5e5]">
        {!sidebarCollapsed && (
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-semibold text-[#32363a]">Tracking Number List</h3>
            <span className="text-[12px] text-[#6a6d70] bg-[#f5f6f7] px-2.5 py-1 rounded-full">
              {trackings.length} of {totalCount}
            </span>
          </div>
        )}
        {sidebarCollapsed ? (
          <div className="flex justify-center">
            <button className="w-9 h-9 flex items-center justify-center text-[#6a6d70] hover:text-[#0a6ed1] rounded-lg hover:bg-[#f0f7ff] transition-all">
              <Search size={15} />
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tracking number"
              className="w-full h-10 pl-3.5 pr-16 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all duration-200"
            />
            <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
              {searchQuery && (
                <button onClick={() => onSearchChange('')} className="w-7 h-7 flex items-center justify-center text-[#6a6d70] hover:text-[#cc1c14] rounded transition-all hover:scale-110">
                  <X size={15} />
                </button>
              )}
              <button onClick={() => onSearchChange(searchQuery)} className="w-7 h-7 flex items-center justify-center text-[#6a6d70] hover:text-[#0a6ed1] rounded transition-all hover:scale-110">
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 row-stagger">
        {sidebarCollapsed ? (
          trackings.map((t) => {
            const isSelected = t.id === selectedId
            return (
              <button key={t.id} onClick={() => onSelectTracking(t.id)} title={t.id}
                className={`w-full flex items-center justify-center py-3 border-b border-[#e5e5e5] transition-all duration-200 border-l-[3px] ${isSelected ? 'bg-[#ebf5ff] border-l-[#0a6ed1]' : 'hover:bg-[#f5f6f7] border-l-transparent'}`}>
                <span className={`text-[11px] font-bold ${isSelected ? 'text-[#0a6ed1]' : 'text-[#6a6d70]'}`}>
                  {t.trackingNo.slice(-4)}
                </span>
              </button>
            )
          })
        ) : (
          <>
            {trackings.map((t) => {
              const isSelected = t.id === selectedId
              return (
                <button key={t.id} onClick={() => onSelectTracking(t.id)}
  className={`w-full text-left px-4 py-3.5 border-b border-[#e5e5e5] transition-all duration-200 border-l-[3px] ${isSelected ? 'bg-[#ebf5ff] border-l-[#0a6ed1] shadow-sm' : 'hover:bg-[#f5f6f7] border-l-transparent'}`}>
  <div className="flex items-center justify-between mb-1">
    <span className="text-[14px] font-bold text-[#0a6ed1]">{t.id}</span>
  </div>
  <div className="flex items-center justify-between text-[12px] text-[#6a6d70] mb-1">
    <span>{t.transportMode}</span>
    <span>{t.date}</span>
  </div>
  <div className="flex items-center justify-between">
    <span className="text-[12px] text-[#6a6d70]">Plant: {t.plant}</span>
    {t.status && (
      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusStyle(t.statusColor)}`}>
        {t.status}
      </span>
    )}
  </div>
</button>
              )
            })}
            {trackings.length === 0 && (
              <div className="px-4 py-12 text-center text-[13px] text-[#6a6d70] anim-fade">
                <Search size={36} className="mx-auto mb-2 opacity-40" />
                No trackings found
              </div>
            )}
          </>
        )}
      </div>
      <div className="border-t border-[#e5e5e5] px-3 py-2.5 flex items-center justify-end flex-shrink-0">

        <button onClick={onToggleCollapse}
          className="hidden md:flex w-9 h-9 items-center justify-center rounded-lg text-[#6a6d70] hover:text-[#0a6ed1] hover:bg-[#f0f7ff] transition-all hover:scale-105"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <ChevronLeft size={17} style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease' }} />
        </button>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function GoodsMovement() {
  const { loginId, loginType, loading: userLoading } = useUser()
  authConfig.loginId   = loginId
  authConfig.loginType = loginType
  const navigate = useNavigate()
  const [trackings, setTrackings] = useState([])
  const [tracking, setTracking] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('timeline')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [timelinePage, setTimelinePage] = useState(0)
  const [showCreateMovement, setShowCreateMovement] = useState(false)
  const [editTrackingData, setEditTrackingData] = useState(null)

  // Update modal (In Transit / Shipped)
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [updateForm, setUpdateForm] = useState({ asn: '', asnId: '', vehicleNumber: '', invoiceNumber: '' })
  const [updateSaving, setUpdateSaving] = useState(false)
  const [updateError, setUpdateError] = useState('')

  const [asnLookupOpen, setAsnLookupOpen] = useState(false)
  const [asnLookupSearch, setAsnLookupSearch] = useState('')
  const [asnLookupResults, setAsnLookupResults] = useState([])

  const [startWarningOpen, setStartWarningOpen] = useState(false)
  const [shipmentDetailsOpen, setShipmentDetailsOpen] = useState(false)
  const [shipmentDetailsForm, setShipmentDetailsForm] = useState({ date: '', time: '', etaDate: '' })
  const [shipmentDetailsSubmitting, setShipmentDetailsSubmitting] = useState(false)
  const [shipmentDetailsError, setShipmentDetailsError] = useState('')

  // Success popup after start shipment
  const [shipSuccessMsg, setShipSuccessMsg] = useState('')

  const [totalCount, setTotalCount] = useState(0)
  const [printLoading, setPrintLoading] = useState(false)

  // Read ?track= param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const trackParam = params.get('track')
    if (trackParam) { setSelectedId(trackParam); setSearchQuery(trackParam) }
  }, [])

  // ── Load tracking list ──────────────────────────────────────
  useEffect(() => {
    if (userLoading) return
    if (!loginId || !loginType) return

    let cancelled = false
    goodsMovementApi.listTrackings({ search: searchQuery })
      .then(data => {
        if (!cancelled) {
          setTrackings(data)
          setTotalCount(prev => searchQuery ? prev : data.length)
          if (data.length && !selectedId) setSelectedId(data[0].id)
        }
      })
      .catch(err => console.error(err))
    return () => { cancelled = true }
  }, [userLoading, loginId, loginType, searchQuery])

  // ── Load detail on selection ────────────────────────────────
  useEffect(() => {
    let cancelled = false
    if (!selectedId) { setTracking(null); return }
    goodsMovementApi.getTracking(selectedId)
      .then(data => { if (!cancelled) { setTracking(data); setActiveTab('timeline') } })
      .catch(err => console.error(err))
    return () => { cancelled = true }
  }, [selectedId])

  // ── Close mobile sidebar on outside click ──────────────────
  useEffect(() => {
    if (!mobileSidebarOpen) return
    const handler = (e) => {
      if (!e.target.closest('[data-sidebar]') && !e.target.closest('[data-sidebar-toggle]')) setMobileSidebarOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [mobileSidebarOpen])

  // ── ASN lookup (for In Transit update modal) ────────────────
  useEffect(() => {
    if (!asnLookupOpen || !tracking) return
    let cancelled = false
    goodsMovementApi.searchAsns({ trackNo: tracking.trackingNo, search: asnLookupSearch })
      .then(data => { if (!cancelled) setAsnLookupResults(data) })
      .catch(err => console.error(err))
    return () => { cancelled = true }
  }, [asnLookupOpen, asnLookupSearch, tracking])

  // ── Pre-fill shipment details ──────────────────────────────
  useEffect(() => {
    if (!shipmentDetailsOpen) return
    const now = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds()
    const ampm = h >= 12 ? 'PM' : 'AM'
    const timeStr = `${pad(h % 12 || 12)}:${pad(m)}:${pad(s)} ${ampm}`
    setShipmentDetailsForm({
      date: dateStr, time: timeStr,
      etaDate: tracking?.etaDate ? (() => { try { const d = new Date(tracking.etaDate); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` } catch { return dateStr } })() : dateStr,
    })
    setShipmentDetailsError('')
  }, [shipmentDetailsOpen])

  // ── Escape key ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (asnLookupOpen) setAsnLookupOpen(false)
        else if (updateModalOpen) closeUpdateModal()
        else if (shipmentDetailsOpen) setShipmentDetailsOpen(false)
        else if (startWarningOpen) setStartWarningOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [updateModalOpen, asnLookupOpen, startWarningOpen, shipmentDetailsOpen])

  const handleSelectTracking = (id) => { setSelectedId(id); setMobileSidebarOpen(false); setTimelinePage(0) }
  const handleCreateMovement = () => { setEditTrackingData(null); setShowCreateMovement(true) }

  // Edit for "Yet to Ship" — opens CreateMovement with pre-filled data
  const handleEditMovement = () => { if (!tracking) return; setEditTrackingData(tracking); setShowCreateMovement(true) }

  const handleCancelMovement = async () => {
    if (!tracking) return
    try { await goodsMovementApi.cancelTracking(tracking.id) } catch (err) { console.error(err) }
  }

  // ── PRINT ──────────────────────────────────────────────────
  const handlePrint = async () => {
    if (!tracking || printLoading) return
    setPrintLoading(true)
    try {
      await generateShipmentNote(tracking)
    } catch (err) {
      console.error('Print failed:', err)
      alert('Failed to generate Shipment Note. Please try again.')
    } finally {
      setPrintLoading(false)
    }
  }

  // ── Start Shipment flow ────────────────────────────────────
  const handleStartShipmentClick = () => setStartWarningOpen(true)
  const handleWarningOk = () => { setStartWarningOpen(false); setShipmentDetailsOpen(true) }

  const handleShipmentDetailsSubmit = async () => {
    if (!shipmentDetailsForm.date || !shipmentDetailsForm.time || !shipmentDetailsForm.etaDate) {
      setShipmentDetailsError('All fields are required.'); return
    }
    setShipmentDetailsSubmitting(true); setShipmentDetailsError('')
    try {
      await goodsMovementApi.startShipment(tracking.id, shipmentDetailsForm)
      setShipmentDetailsOpen(false)
      setShipSuccessMsg(`Tracking number ${tracking.id} has been shipped successfully`)
      goodsMovementApi.getTracking(tracking.id)
        .then(data => setTracking(data))
        .catch(err => console.error(err))
      goodsMovementApi.listTrackings({ search: searchQuery })
        .then(data => setTrackings(data))
        .catch(err => console.error(err))
    } catch (err) {
      console.error(err); setShipmentDetailsError('Failed to start shipment. Please try again.')
    } finally { setShipmentDetailsSubmitting(false) }
  }

  // ── In-Transit Update modal ────────────────────────────────
  const openUpdateModal = () => {
    if (!tracking) return
    const firstAsn = tracking.asns?.[0]
    setUpdateForm({
      asn:           firstAsn?.asnId || '',
      asnId:         firstAsn?.asnId || '',
      vehicleNumber: tracking.vehicleRegNo || '',
      invoiceNumber: firstAsn?.invoiceNumber || '',
    })
    setUpdateError(''); setUpdateModalOpen(true)
  }
  const closeUpdateModal = () => { setUpdateModalOpen(false); setUpdateError('') }

  const handleUpdateSave = async () => {
    if (!tracking) return
    if (!updateForm.asn.trim() || !updateForm.vehicleNumber.trim() || !updateForm.invoiceNumber.trim()) {
      setUpdateError('Please fill all the fields before saving.'); return
    }
    setUpdateSaving(true); setUpdateError('')
    try {
      await goodsMovementApi.updateInTransitShipment(
        tracking.trackingNo,
        updateForm.asnId || updateForm.asn,
        { vehicleNumber: updateForm.vehicleNumber, invoiceNumber: updateForm.invoiceNumber }
      )
      const updated = await goodsMovementApi.getTracking(tracking.id)
      setTracking(updated)
      setUpdateModalOpen(false)
    } catch (err) {
      console.error(err); setUpdateError('Failed to save. Please try again.')
    } finally { setUpdateSaving(false) }
  }

  const handlePickAsn = (row) => {
    setUpdateForm(f => ({
      ...f,
      asn:           row.asnId,
      asnId:         row.asnId,
      invoiceNumber: f.invoiceNumber || row.invoiceNumber,
      vehicleNumber: f.vehicleNumber || row.transporter,
    }))
    setAsnLookupOpen(false); setAsnLookupSearch('')
  }

  const tabs = useMemo(() => {
    if (!tracking) return BASE_TABS
    return isUpdatableStatus(tracking.status) ? [...BASE_TABS, UPDATE_TAB] : BASE_TABS
  }, [tracking])

  const filteredTrackings = useMemo(() =>
    searchQuery
      ? trackings.filter(t => t.id.toLowerCase().includes(searchQuery.toLowerCase()) || t.trackingNo.toLowerCase().includes(searchQuery.toLowerCase()))
      : trackings
  , [trackings, searchQuery])

  const sidebarProps = {
    trackings: filteredTrackings, totalCount, selectedId, searchQuery, sidebarCollapsed,
    onSelectTracking: handleSelectTracking,
    onSearchChange: setSearchQuery,
    onToggleCollapse: () => setSidebarCollapsed(c => !c),
  }

  // ── Timeline tab ───────────────────────────────────────────
  const renderTimeline = () => {
    if (!tracking) return null
    const steps = TIMELINE_STEPS.map(s => {
      const found = tracking.timeline.find(t => t.key === s.key)
      return { ...s, completed: found?.completed || false, timestamp: found?.timestamp || null }
    })
    const lastCompletedIdx = steps.reduce((acc, s, i) => s.completed ? i : acc, -1)
    return (
      <div className="anim-fade px-4 sm:px-6 lg:px-10 py-8">
        <div className="relative flex items-start justify-between max-w-4xl">
          <div className="absolute top-[28px] left-[44px] right-[44px] h-[3px] bg-[#e5e5e5] z-0" />
          {lastCompletedIdx >= 0 && (
            <div className="absolute top-[28px] left-[44px] h-[3px] bg-[#107e3e] z-0 transition-all duration-700"
              style={{ width: `calc(${(lastCompletedIdx / (steps.length - 1)) * 100}% * (1 - ${88 / ((steps.length - 1) * 200)}))` }} />
          )}
          {steps.map((step, idx) => {
            const { Icon } = step; const isCompleted = step.completed; const isActive = idx === lastCompletedIdx
            return (
              <div key={step.key} className="relative flex flex-col items-center z-10" style={{ width: `${100 / steps.length}%` }}>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center border-[3px] transition-all duration-300 shadow-sm ${isCompleted ? 'bg-[#107e3e] border-[#107e3e] shadow-[0_0_0_4px_rgba(16,126,62,0.15)]' : 'bg-white border-[#d9d9d9]'} ${isActive ? 'scale-110 shadow-[0_0_0_6px_rgba(16,126,62,0.18)]' : ''}`}>
                  <Icon size={22} color={isCompleted ? 'white' : '#b0b3b8'} strokeWidth={1.8} />
                </div>
                <div className="mt-3 text-center px-1">
                  <div className={`text-[12px] font-semibold ${isCompleted ? 'text-[#32363a]' : 'text-[#b0b3b8]'} leading-tight`}>{step.label}</div>
                  {step.timestamp && <div className="text-[11px] text-[#6a6d70] mt-1 leading-tight">{step.timestamp}</div>}
                </div>
              </div>
            )
          })}
          <div className="absolute -right-8 top-[14px] flex items-center gap-1">
            <span className="text-[12px] text-[#6a6d70] font-medium">{timelinePage + 1}</span>
            <button onClick={() => setTimelinePage(p => Math.min(p + 1, 0))} className="w-6 h-6 flex items-center justify-center rounded text-[#0a6ed1] hover:bg-[#f0f7ff] transition-all">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── ASN tab ────────────────────────────────────────────────
  const renderAsn = () => {
    if (!tracking) return null
    return (
      <div className="anim-fade px-4 sm:px-6 lg:px-10 py-6">
        <div className="overflow-x-auto rounded-xl border border-[#e5e5e5] shadow-sm">
          <table className="w-full text-[14px]" style={{ minWidth: '750px' }}>
            <thead><tr className="bg-gradient-to-b from-[#fafbfc] to-[#f5f6f7] border-b border-[#e5e5e5] text-[#6a6d70]">
              <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">ASN</th>
              <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">Total Line Items</th>
              <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">IBD Number</th>
              <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">Plant</th>
              <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">Storage Location</th>
              <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">Invoice Number</th>
              <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">Invoice Amount</th>
              <th className="text-left font-semibold py-3.5 px-4 text-[13px] uppercase tracking-wider">Invoice Date</th>
            </tr></thead>
            <tbody className="row-stagger">
              {tracking.asns.map((asn, idx) => (
                <tr key={idx} className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc] transition-colors duration-200">
                  <td className="py-4 px-4">
                    <span
                      className="text-[#0a6ed1] font-semibold hover:underline cursor-pointer"
                      onClick={() => navigate(`/shipment/advance-shipping-note?asn=${asn.asnId}`)}
                    >
                      {asn.asnId}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-[#32363a]">{asn.totalLineItems}</td>
                  <td className="py-4 px-4 text-[#32363a] font-medium">{asn.ibdNumber}</td>
                  <td className="py-4 px-4"><span className="text-[#32363a] font-semibold">{asn.plant}</span></td>
                  <td className="py-4 px-4 text-[#32363a]">{asn.storageLocation}</td>
                  <td className="py-4 px-4 text-[#32363a] font-medium">{asn.invoiceNumber}</td>
                  <td className="py-4 px-4 font-semibold text-[#32363a]">{asn.invoiceAmount.toFixed(2)}</td>
                  <td className="py-4 px-4 text-[#32363a]">{asn.invoiceDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ── Update Shipment tab (In Transit / Shipped) ─────────────
  const renderUpdate = () => {
    if (!tracking) return null
    return (
      <div className="anim-fade px-4 sm:px-6 lg:px-10 py-8">
        <div className="max-w-2xl">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[#fff3e8] border border-[#ffd9b3] mb-6">
            <Edit3 size={18} className="text-[#e76500] flex-shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              <div className="text-[14px] font-semibold text-[#32363a]">Shipment is in transit</div>
              <div className="text-[13px] text-[#6a6d70] mt-0.5">You can update the ASN, vehicle and invoice details until the shipment reaches the gate.</div>
            </div>
          </div>
          <div className="rounded-xl border border-[#e5e5e5] bg-white shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[15px] font-semibold text-[#32363a]">Current Shipment Details</h4>
              <button onClick={openUpdateModal} className="flex items-center gap-1.5 px-3 h-9 text-[13px] font-semibold text-white bg-[#e76500] rounded-lg hover:bg-[#c55600] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md">
                <Edit3 size={14} /> Edit Details
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold">ASN</div><div className="text-[14px] font-semibold text-[#0a6ed1] mt-1">{tracking.asns?.[0]?.asnId || '—'}</div></div>
              <div><div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold">Vehicle Number</div><div className="text-[14px] font-semibold text-[#32363a] mt-1">{tracking.vehicleRegNo || '—'}</div></div>
              <div><div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold">Invoice Number</div><div className="text-[14px] font-semibold text-[#32363a] mt-1">{tracking.asns?.[0]?.invoiceNumber || '—'}</div></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const tabContent = { timeline: renderTimeline, asn: renderAsn, update: renderUpdate }

  if (showCreateMovement) {
    return <CreateMovement
  editData={editTrackingData}
  onBack={(newTrackingId) => {
    setShowCreateMovement(false)
    setEditTrackingData(null)
    goodsMovementApi.listTrackings({ search: searchQuery })
      .then(data => {
        setTrackings(data)
        if (newTrackingId) setSelectedId(newTrackingId)
      })
      .catch(err => console.error(err))
  }}
/>
  }

  return (
    <PageLayout>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideInLeft{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideInRight{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        @keyframes slideInDrawer{from{transform:translateX(-100%)}to{transform:translateX(0)}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.94) translateY(-8px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes overlayIn{from{opacity:0}to{opacity:1}}
        .anim-fade{animation:fadeIn .35s ease-out both}
        .anim-slide-l{animation:slideInLeft .3s ease-out both}
        .anim-slide-r{animation:slideInRight .35s ease-out both}
        .anim-scale{animation:scaleIn .25s ease-out both}
        .anim-drawer{animation:slideInDrawer .28s ease-out both}
        .anim-modal{animation:modalIn .22s ease-out both}
        .anim-overlay{animation:overlayIn .18s ease-out both}
        .row-stagger>*{animation:fadeIn .4s ease-out both}
        .row-stagger>*:nth-child(1){animation-delay:.02s}.row-stagger>*:nth-child(2){animation-delay:.06s}
        .row-stagger>*:nth-child(3){animation-delay:.10s}.row-stagger>*:nth-child(4){animation-delay:.14s}
        .row-stagger>*:nth-child(5){animation-delay:.18s}
        .sidebar-transition{transition:width .25s ease}
      `}</style>

      {/* Top context bar */}
      <div className="bg-white border-b border-[#e5e5e5] px-4 sm:px-6 lg:px-10 py-2 text-[13px] text-[#6a6d70] flex flex-wrap gap-x-6 gap-y-1">
        <span><span className="font-semibold text-[#32363a]">Supplier Name:</span> {tracking?.vendorName || 'Kunstocom(India) Ltd'}</span>
        <span className="ml-auto"><span className="font-semibold text-[#32363a]">Supplier Location:</span> NEEMRANA(alwar)</span>
      </div>

      <div className="bg-[#f5f6f7] min-h-[calc(100vh-136px)]">
        <div className="flex" style={{ minHeight: 'calc(100vh - 260px)' }}>

          {mobileSidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileSidebarOpen(false)} />}

          {/* Mobile sidebar drawer */}
          <aside data-sidebar className={`fixed top-0 left-0 h-full w-[300px] bg-white border-r border-[#e5e5e5] flex flex-col z-50 md:hidden anim-drawer ${mobileSidebarOpen ? 'flex' : 'hidden'}`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e5] bg-[#fafbfc]">
              <span className="text-[14px] font-semibold text-[#32363a]">Tracking Number List</span>
              <button onClick={() => setMobileSidebarOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6a6d70] hover:text-[#cc1c14] hover:bg-[#fce8e6] transition-all"><X size={16} /></button>
            </div>
            <SidebarContent {...sidebarProps} />
          </aside>

          {/* Desktop sidebar */}
          <aside data-sidebar className={`hidden md:flex overflow-hidden flex-col bg-white border-r border-[#e5e5e5] sidebar-transition anim-slide-l flex-shrink-0 h-screen sticky top-0 ${sidebarCollapsed ? 'w-[56px]' : 'w-[300px] lg:w-[340px]'}`}>

            <SidebarContent {...sidebarProps} />
          </aside>

          {/* Right pane */}
          <main className="flex-1 bg-white overflow-y-auto anim-slide-r min-w-0 pb-28">
            {tracking && (
              <>
                {/* Header */}
                <div className="px-4 sm:px-6 lg:px-10 pt-5 sm:pt-7 pb-5 border-b border-[#e5e5e5] bg-gradient-to-b from-[#fafbfc] to-white">
                  <div className="flex items-center gap-3 mb-4 md:hidden">
                    <button data-sidebar-toggle onClick={() => setMobileSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#d9d9d9] text-[#6a6d70] hover:text-[#0a6ed1] hover:border-[#0a6ed1] transition-all"><Menu size={16} /></button>
                    <span className="text-[13px] text-[#6a6d70]">Trackings</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1.5">Tracking Number — {tracking.id}</div>
                      <div className="flex items-baseline gap-4 flex-wrap">
                        <h2 className="text-[22px] sm:text-[26px] font-bold text-[#32363a] tracking-tight">{tracking.id}</h2>
                        <span className={`text-[14px] font-bold px-3 py-1 rounded-full ${statusStyle(tracking.statusColor)}`}>
                          <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ backgroundColor: statusDotColor(tracking.statusColor) }} />
                          {tracking.status}
                        </span>
                      </div>
                      <div className="text-[14px] text-[#6a6d70] mt-1">Plant: {tracking.plantName} ({tracking.plant})</div>
                    </div>
                    <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                      <span className="hidden sm:block text-[13px] text-[#6a6d70]">{tracking.date}</span>
                      <button onClick={handlePrint} disabled={printLoading}
                        className="flex items-center gap-1.5 px-3 sm:px-4 h-9 text-[13px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md disabled:opacity-60">
                        {printLoading ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Printer size={15} />}
                        Print
                      </button>
                    </div>
                  </div>

                  {/* Info fields */}
                  <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-3">
                    {[
                      { Icon: Truck,          label: 'Transporter',              value: tracking.transporter           },
                      { Icon: CalendarDays,   label: 'ETA Date',                 value: tracking.etaDate               },
                      { Icon: User,           label: 'Driver Name',              value: tracking.driverName            },
                      { Icon: ShieldCheck,    label: 'Safety Equipments',        value: tracking.safetyEquipments      },
                      { Icon: Phone,          label: 'Contact',                  value: tracking.contact               },
                      { Icon: HardHat,        label: 'Safety Guard for Material',value: tracking.safetyGuardForMaterial},
                      { Icon: Car,            label: 'Transportation Mode',      value: tracking.transportationMode    },
                      { Icon: Hash,           label: 'Vehicle Reg. No. / Docket',value: tracking.vehicleRegNo          },
                      { Icon: ClipboardCheck, label: 'Pollution Certificate',    value: tracking.pollutionCertificateApplicable },
                      { Icon: Banknote,       label: 'Total ASN Amount',         value: tracking.totalAsnAmount.toFixed(2) },
                    ].map(({ Icon, label, value }) => (
                      <div key={label} className="flex items-start gap-2">
                        <Icon size={14} className="text-[#6a6d70] mt-[3px] flex-shrink-0" strokeWidth={1.8} />
                        <div>
                          <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold">{label}</div>
                          <div className="text-[13px] font-semibold text-[#32363a] mt-0.5">{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tabs */}
                <div className="px-4 sm:px-6 lg:px-10 pt-6 pb-0 border-b border-[#e5e5e5] bg-white">
                  <div className="flex items-end gap-6 sm:gap-10 overflow-x-auto">
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.key
                      return (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                          className={`flex flex-col items-center pb-3 border-b-2 transition-all duration-200 flex-shrink-0 ${isActive ? 'border-[#0a6ed1]' : 'border-transparent hover:border-[#d9d9d9]'}`}>
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-1.5 shadow-sm transition-all duration-200 ${isActive ? 'shadow-md scale-110' : 'hover:scale-105'}`}
                            style={{ backgroundColor: isActive ? tab.color : '#f0f4f8' }}>{tab.icon(isActive)}</div>
                          <span className={`text-[13px] font-semibold whitespace-nowrap transition-colors ${isActive ? 'text-[#0a6ed1]' : 'text-[#6a6d70] hover:text-[#32363a]'}`}>{tab.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div key={`${tracking.id}-${activeTab}`}>{tabContent[activeTab]?.()}</div>
              </>
            )}
            {!tracking && (
              <div className="flex flex-col items-center justify-center h-64 text-[#6a6d70] anim-fade">
                <Truck size={48} className="mb-3 opacity-30" strokeWidth={1.5} />
                <span className="text-[14px]">Select a tracking number from the list</span>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e5e5] px-6 py-3 flex justify-between items-center z-30 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
  <button onClick={handleCreateMovement} className="flex items-center gap-2 px-4 h-9 text-[13px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md">
    <FilePlus size={15} /> Create
  </button>

  <div className="flex items-center gap-3">
    {tracking && isYetToShipStatus(tracking.status) && (
      <>
        <button onClick={handleStartShipmentClick} className="flex items-center gap-2 px-4 h-9 text-[13px] font-semibold text-white bg-[#107e3e] rounded-lg hover:bg-[#0d6633] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md"><PlayCircle size={15} /> Start Shipment</button>
        <button onClick={handleEditMovement} className="flex items-center gap-2 px-4 h-9 text-[13px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md"><Edit3 size={15} /> Edit</button>
        <button onClick={handleCancelMovement} className="flex items-center gap-2 px-4 h-9 text-[13px] font-semibold text-[#cc1c14] border border-[#cc1c14] bg-white rounded-lg hover:bg-[#fce8e6] hover:scale-[1.02] active:scale-[0.98] transition-all"><X size={15} /> Cancel</button>
      </>
    )}
  </div>
</div>

      {/* Ship Success Popup */}
      {shipSuccessMsg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 anim-overlay">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShipSuccessMsg('')} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[400px] p-8 flex flex-col items-center gap-4 anim-modal">
            <div className="w-16 h-16 rounded-full bg-[#e8f5e9] flex items-center justify-center">
              <Truck size={32} className="text-[#107e3e]" strokeWidth={1.8} />
            </div>
            <h4 className="text-[16px] font-bold text-[#32363a] text-center">Shipment Started</h4>
            <p className="text-[14px] text-[#6a6d70] text-center leading-relaxed">{shipSuccessMsg}</p>
            <button onClick={() => setShipSuccessMsg('')}
              className="mt-2 px-8 h-10 text-[14px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md">
              OK
            </button>
          </div>
        </div>
      )}

      {/* Update Shipment Modal (In Transit) */}
      {updateModalOpen && tracking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 anim-overlay">
          <div className="absolute inset-0 bg-black/40" onClick={closeUpdateModal} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[560px] anim-modal">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5]">
              <div><div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold">Tracking No</div><div className="text-[16px] font-bold text-[#32363a] mt-0.5">{tracking.id}</div></div>
              <button onClick={closeUpdateModal} className="w-9 h-9 flex items-center justify-center rounded-lg text-[#6a6d70] hover:text-[#cc1c14] hover:bg-[#fce8e6] transition-all"><X size={17} /></button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-[13px] font-semibold text-[#32363a] mb-1.5">ASN <span className="text-[#cc1c14]">*</span></label>
                <div className="relative">
                  <input type="text" value={updateForm.asn} onChange={(e) => setUpdateForm(f => ({ ...f, asn: e.target.value, asnId: e.target.value }))} placeholder="Enter or pick an ASN"
                    className="w-full h-11 pl-3.5 pr-11 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
                  <button type="button" onClick={() => setAsnLookupOpen(true)} title="Pick ASN"
                    className="absolute right-1.5 top-1.5 w-8 h-8 flex items-center justify-center rounded-md text-[#0a6ed1] hover:bg-[#ebf5ff] transition-all"><ExternalLink size={15} /></button>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#32363a] mb-1.5">Vehicle Number / Transporter <span className="text-[#cc1c14]">*</span></label>
                <input type="text" value={updateForm.vehicleNumber} onChange={(e) => setUpdateForm(f => ({ ...f, vehicleNumber: e.target.value }))} placeholder="e.g. MH70AA4444"
                  className="w-full h-11 px-3.5 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#32363a] mb-1.5">Invoice Number <span className="text-[#cc1c14]">*</span></label>
                <input type="text" value={updateForm.invoiceNumber} onChange={(e) => setUpdateForm(f => ({ ...f, invoiceNumber: e.target.value }))} placeholder="e.g. INB867"
                  className="w-full h-11 px-3.5 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
              </div>
              {updateError && <div className="text-[13px] text-[#cc1c14] bg-[#fce8e6] border border-[#f5b3ae] rounded-lg px-3 py-2">{updateError}</div>}
            </div>
            <div className="px-6 py-4 border-t border-[#e5e5e5] flex items-center justify-end gap-2">
              <button onClick={closeUpdateModal} disabled={updateSaving} className="px-4 h-9 text-[13px] font-semibold text-[#0a6ed1] hover:bg-[#ebf5ff] rounded-lg transition-all disabled:opacity-60">Cancel</button>
              <button onClick={handleUpdateSave} disabled={updateSaving} className="flex items-center gap-1.5 px-4 h-9 text-[13px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100">
                <Save size={14} /> {updateSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASN Value-Help Dialog */}
      {asnLookupOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 anim-overlay">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAsnLookupOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[680px] anim-modal flex flex-col" style={{ maxHeight: '80vh' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5]">
              <h4 className="text-[15px] font-bold text-[#32363a]">Select ASN</h4>
              <button onClick={() => setAsnLookupOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-lg text-[#6a6d70] hover:text-[#cc1c14] hover:bg-[#fce8e6] transition-all"><X size={17} /></button>
            </div>
            <div className="px-6 py-3 border-b border-[#e5e5e5]"><div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6a6d70]" />
              <input type="text" value={asnLookupSearch} onChange={(e) => setAsnLookupSearch(e.target.value)} placeholder="Search ASN or invoice"
                className="w-full h-10 pl-9 pr-3 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
            </div></div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-[13px]">
                <thead className="sticky top-0 bg-gradient-to-b from-[#fafbfc] to-[#f5f6f7] border-b border-[#e5e5e5]">
                  <tr className="text-[#6a6d70]">
                    <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">ASN</th>
                    <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">Invoice No</th>
                    <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">Transporter</th>
                  </tr>
                </thead>
                <tbody className="row-stagger">
                  {asnLookupResults.map((row) => (
                    <tr key={row.asnId} onClick={() => handlePickAsn(row)} className="border-b border-[#f0f0f0] hover:bg-[#ebf5ff] cursor-pointer transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#0a6ed1]">{row.asnId}</td>
                      <td className="py-3 px-4 text-[#32363a]">{row.invoiceNumber}</td>
                      <td className="py-3 px-4 text-[#32363a]">{row.transporter}</td>
                    </tr>
                  ))}
                  {asnLookupResults.length === 0 && (
                    <tr><td colSpan={3} className="py-12 text-center text-[#6a6d70]">
                      <Search size={32} className="mx-auto mb-2 opacity-40" /><div className="text-[13px]">No ASNs found</div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-[#e5e5e5] flex items-center justify-end">
              <button onClick={() => setAsnLookupOpen(false)} className="px-4 h-9 text-[13px] font-semibold text-[#0a6ed1] hover:bg-[#ebf5ff] rounded-lg transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Start Shipment Warning */}
      {startWarningOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 anim-overlay">
          <div className="absolute inset-0 bg-black/40" onClick={() => setStartWarningOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[440px] anim-modal">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[#e5e5e5]">
              <div className="w-9 h-9 rounded-full bg-[#fff3e8] flex items-center justify-center flex-shrink-0"><AlertTriangle size={18} className="text-[#e76500]" /></div>
              <h4 className="text-[15px] font-bold text-[#32363a]">Warning</h4>
            </div>
            <div className="px-6 py-5"><p className="text-[14px] text-[#32363a] leading-relaxed">Please note that once you start the shipment, you'll not be able to modify the document.</p></div>
            <div className="px-6 py-4 border-t border-[#e5e5e5] flex items-center justify-end gap-2">
              <button onClick={() => setStartWarningOpen(false)} className="px-4 h-9 text-[13px] font-semibold text-[#0a6ed1] hover:bg-[#ebf5ff] rounded-lg transition-all">Cancel</button>
              <button onClick={handleWarningOk} className="px-5 h-9 text-[13px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md">OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Shipment Details Dialog */}
      {shipmentDetailsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 anim-overlay">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShipmentDetailsOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[380px] anim-modal">
            <div className="px-6 py-4 border-b border-[#e5e5e5] text-center"><h4 className="text-[16px] font-bold text-[#32363a]">Shipment Details</h4></div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#32363a] mb-1.5">Date: <span className="text-[#cc1c14]">*</span></label>
                <input type="date" value={shipmentDetailsForm.date} onChange={(e) => setShipmentDetailsForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full h-10 px-3 text-[14px] border border-[#0a6ed1] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#32363a] mb-1.5">Time: <span className="text-[#cc1c14]">*</span></label>
                <div className="relative">
                  <input type="text" value={shipmentDetailsForm.time} onChange={(e) => setShipmentDetailsForm(f => ({ ...f, time: e.target.value }))} placeholder="HH:MM:SS AM/PM"
                    className="w-full h-10 pl-3 pr-10 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6a6d70" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#32363a] mb-1.5">ETA (Delivery Date): <span className="text-[#cc1c14]">*</span></label>
                <div className="relative">
                  <input type="date" value={shipmentDetailsForm.etaDate} onChange={(e) => setShipmentDetailsForm(f => ({ ...f, etaDate: e.target.value }))}
                    className="w-full h-10 pl-3 pr-10 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all" />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><CalendarDays size={15} className="text-[#6a6d70]" /></div>
                </div>
              </div>
              {shipmentDetailsError && <div className="text-[13px] text-[#cc1c14] bg-[#fce8e6] border border-[#f5b3ae] rounded-lg px-3 py-2">{shipmentDetailsError}</div>}
            </div>
            <div className="px-6 py-4 border-t border-[#e5e5e5] flex items-center justify-end gap-2">
              <button onClick={() => setShipmentDetailsOpen(false)} disabled={shipmentDetailsSubmitting} className="px-4 h-9 text-[13px] font-semibold text-[#0a6ed1] hover:bg-[#ebf5ff] rounded-lg transition-all disabled:opacity-60">Cancel</button>
              <button onClick={handleShipmentDetailsSubmit} disabled={shipmentDetailsSubmitting}
                className="px-5 h-9 text-[13px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100">
                {shipmentDetailsSubmitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}