import { useState, useEffect } from 'react'
import PageLayout from '../../layouts/PageLayout.jsx'
import {
  FilePlus,
  Truck,
  ClipboardCheck,
  LogIn,
  PackageCheck,
  Clock,
  RefreshCw,
  X,
  Menu,
  Search,
  ShieldCheck,
  HardHat,
  CalendarDays,
  Car,
  Phone,
  User,
  MapPin,
  Hash,
  Banknote,
  LogOut,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  QrCode,
  AlertTriangle,
  Radio,
  Layers,
  BarChart3,
  Package,
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════
// DUMMY DATA (currently in use)
// ═══════════════════════════════════════════════════════════════
const GATE_TRACKINGS = [
  {
    id: '1000001160/2026',
    trackingNo: '1000001160',
    transportMode: 'By Road',
    date: 'May 01, 2026',
    plant: 'NMR',
    plantName: 'FIEM Industries Limited - NMR',
    status: 'Gate Reported',
    statusColor: 'orange',
    transporter: 'Raj',
    driverName: 'Raj',
    contact: '7819271929',
    transportationMode: 'By Road',
    pollutionCertificateApplicable: 'Yes',
    totalAsnAmount: 1937.60,
    safetyEquipments: 'Yes',
    safetyGuardForMaterial: 'Yes',
    vehicleRegNo: 'UP 23 5647',
    ewayBillNo: '',
    ewayBillDate: '',
    vendor: '0000401122,Kunstocom(India) Ltd',
    timeline: [
      { key: 'created', label: 'Created', completed: true, timestamp: '01.05.2026 09:00' },
      { key: 'shipped', label: 'Shipped', completed: true, timestamp: '01.05.2026 10:00' },
      { key: 'gate_reporting', label: 'Gate Reporting', completed: true, timestamp: '01.05.2026 11:30' },
      { key: 'gate_entry_in', label: 'Gate Entry (IN)', completed: false, timestamp: null },
      { key: 'goods_received', label: 'Goods Received', completed: false, timestamp: null },
      { key: 'gate_entry_out', label: 'Gate Entry (Out)', completed: false, timestamp: null },
    ],
    asns: [
      {
        asnId: '2600000060...',
        totalLineItems: 2,
        ibdNumber: '85015560',
        plant: 'NMR',
        storageLocation: 'RM01',
        invoiceNumber: 'INV-0060',
        invoiceAmount: 1937.60,
        invoiceDate: 'May 01, 2026',
      },
    ],
    summary: {
      gateEntryNumber: '',
      referenceDocNumber: '',
      gateInDate: '',
      gateInTime: '',
    },
  },
  {
    id: '1000001161/2026',
    trackingNo: '1000001161',
    transportMode: 'By Road',
    date: 'May 02, 2026',
    plant: 'SR01',
    plantName: 'Sri City FG',
    status: 'Gate Entry (IN)',
    statusColor: 'blue',
    transporter: 'DHL',
    driverName: 'Suresh',
    contact: '9876543210',
    transportationMode: 'By Road',
    pollutionCertificateApplicable: 'Yes',
    totalAsnAmount: 520.00,
    safetyEquipments: 'Yes',
    safetyGuardForMaterial: 'No',
    vehicleRegNo: 'TN 22 AB 1234',
    ewayBillNo: '456789123456',
    ewayBillDate: 'May 02, 2026',
    vendor: '0000401123,XYZ Pvt Ltd',
    timeline: [
      { key: 'created', label: 'Created', completed: true, timestamp: '02.05.2026 08:00' },
      { key: 'shipped', label: 'Shipped', completed: true, timestamp: '02.05.2026 09:30' },
      { key: 'gate_reporting', label: 'Gate Reporting', completed: true, timestamp: '02.05.2026 11:00' },
      { key: 'gate_entry_in', label: 'Gate Entry (IN)', completed: true, timestamp: '02.05.2026 12:00' },
      { key: 'goods_received', label: 'Goods Received', completed: false, timestamp: null },
      { key: 'gate_entry_out', label: 'Gate Entry (Out)', completed: false, timestamp: null },
    ],
    asns: [
      {
        asnId: '2600000061...',
        totalLineItems: 1,
        ibdNumber: '85015561',
        plant: 'SR01',
        storageLocation: 'WH01',
        invoiceNumber: 'INV-0061',
        invoiceAmount: 520.00,
        invoiceDate: 'May 02, 2026',
      },
    ],
    summary: {
      gateEntryNumber: '1500000775',
      referenceDocNumber: '5001085625',
      gateInDate: 'May 02, 2026',
      gateInTime: '12:00 PM',
    },
  },
  {
    id: '1000001162/2026',
    trackingNo: '1000001162',
    transportMode: 'By Road',
    date: 'May 03, 2026',
    plant: 'NM01',
    plantName: 'Neemrana Plant',
    status: 'Goods Received',
    statusColor: 'green',
    transporter: 'GATI',
    driverName: 'Mohan',
    contact: '9012345678',
    transportationMode: 'By Road',
    pollutionCertificateApplicable: 'No',
    totalAsnAmount: 340.50,
    safetyEquipments: 'Yes',
    safetyGuardForMaterial: 'Yes',
    vehicleRegNo: 'HR 26 CD 5678',
    ewayBillNo: '123456789012',
    ewayBillDate: 'May 03, 2026',
    vendor: '0000401124,ABC Components Ltd',
    timeline: [
      { key: 'created', label: 'Created', completed: true, timestamp: '03.05.2026 07:30' },
      { key: 'shipped', label: 'Shipped', completed: true, timestamp: '03.05.2026 08:45' },
      { key: 'gate_reporting', label: 'Gate Reporting', completed: true, timestamp: '03.05.2026 10:00' },
      { key: 'gate_entry_in', label: 'Gate Entry (IN)', completed: true, timestamp: '03.05.2026 10:30' },
      { key: 'goods_received', label: 'Goods Received', completed: true, timestamp: '03.05.2026 12:00' },
      { key: 'gate_entry_out', label: 'Gate Entry (Out)', completed: false, timestamp: null },
    ],
    asns: [
      {
        asnId: '2600000062...',
        totalLineItems: 3,
        ibdNumber: '85015562',
        plant: 'NM01',
        storageLocation: 'SL01',
        invoiceNumber: 'INV-0062',
        invoiceAmount: 340.50,
        invoiceDate: 'May 03, 2026',
      },
    ],
    summary: {
      gateEntryNumber: '1500000776',
      referenceDocNumber: '5001085626',
      gateInDate: 'May 03, 2026',
      gateInTime: '10:30 AM',
    },
  },
]

// ═══════════════════════════════════════════════════════════════
// API STRUCTURE — for future backend integration
// ═══════════════════════════════════════════════════════════════
const API_BASE_URL = '/api/v1'
const USE_MOCK = true

const gateApi = {
  async listTrackings({ search = '' } = {}) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 100))
      return GATE_TRACKINGS.filter(t => {
        const q = search.trim().toLowerCase()
        return !q ||
          t.id.toLowerCase().includes(q) ||
          t.trackingNo.toLowerCase().includes(q) ||
          t.plant.toLowerCase().includes(q) ||
          t.plantName.toLowerCase().includes(q)
      })
    }
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    const res = await fetch(`${API_BASE_URL}/gate-trackings?${params}`)
    if (!res.ok) throw new Error('Failed to fetch gate trackings')
    return res.json()
  },

  async getTracking(id) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 100))
      return GATE_TRACKINGS.find(t => t.id === id) || null
    }
    const res = await fetch(`${API_BASE_URL}/gate-trackings/${encodeURIComponent(id)}`)
    if (!res.ok) throw new Error('Failed to fetch tracking')
    return res.json()
  },

  async searchByTrackingNumber(trackingNumber) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 150))
      const found = GATE_TRACKINGS.find(
        t => t.id === trackingNumber ||
          t.trackingNo === trackingNumber ||
          t.id.startsWith(trackingNumber)
      )
      return found || null
    }
    const res = await fetch(`${API_BASE_URL}/gate-trackings/search/${encodeURIComponent(trackingNumber)}`)
    if (!res.ok) throw new Error('Not found')
    return res.json()
  },

  async processGateReporting(id) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
      return { success: true, message: 'Gate reporting processed successfully' }
    }
    const res = await fetch(`${API_BASE_URL}/gate-trackings/${encodeURIComponent(id)}/gate-reporting`, { method: 'POST' })
    if (!res.ok) throw new Error('Failed to process gate reporting')
    return res.json()
  },

  async processGateIn(id) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
      return {
        success: true,
        gateEntryNumber: '1500000774',
        referenceDocNumber: '5001085624',
        message: 'Gate In processed and gate entry number 1500000774 generated successfully for Reference document Number :5001085624.',
      }
    }
    const res = await fetch(`${API_BASE_URL}/gate-trackings/${encodeURIComponent(id)}/gate-in`, { method: 'POST' })
    if (!res.ok) throw new Error('Failed to process gate in')
    return res.json()
  },
}

// ═══════════════════════════════════════════════════════════════
// TIMELINE STEP CONFIG
// ═══════════════════════════════════════════════════════════════
const TIMELINE_STEPS = [
  { key: 'created', label: 'Created', Icon: FilePlus },
  { key: 'shipped', label: 'Shipped', Icon: Truck },
  { key: 'gate_reporting', label: 'Gate Reporting', Icon: MapPin },
  { key: 'gate_entry_in', label: 'Gate Entry (IN)', Icon: LogIn },
  { key: 'goods_received', label: 'Goods Received', Icon: PackageCheck },
  { key: 'gate_entry_out', label: 'Gate Entry (Out)', Icon: LogOut },
]

// ═══════════════════════════════════════════════════════════════
// TABS CONFIG
// ═══════════════════════════════════════════════════════════════
const TABS = [
  { key: 'timeline', label: 'Timeline', Icon: Clock },
  { key: 'asn', label: 'ASN', Icon: ClipboardCheck },
  { key: 'summary', label: 'Summary', Icon: CheckCircle2 },
]

// ═══════════════════════════════════════════════════════════════
// STATUS STYLE HELPERS
// ═══════════════════════════════════════════════════════════════
const statusStyle = (statusColor) => {
  const map = {
    green: { bg: 'rgba(16,126,62,0.1)', text: '#107e3e', dot: '#107e3e' },
    blue: { bg: 'rgba(10,110,209,0.1)', text: '#0a6ed1', dot: '#0a6ed1' },
    orange: { bg: 'rgba(231,101,0,0.1)', text: '#e76500', dot: '#e76500' },
    red: { bg: 'rgba(204,28,20,0.1)', text: '#cc1c14', dot: '#cc1c14' },
    gray: { bg: 'rgba(106,109,112,0.1)', text: '#6a6d70', dot: '#6a6d70' },
  }
  return map[statusColor] || map.gray
}

// ═══════════════════════════════════════════════════════════════
// STATUS HELPERS for action buttons
// ═══════════════════════════════════════════════════════════════
const canGateReport = (status) => {
  if (!status) return false
  const s = status.toLowerCase()
  return s === 'shipped' || s === 'in transit'
}

const canGateIn = (status) => {
  if (!status) return false
  const s = status.toLowerCase()
  return s === 'gate reported' || s === 'gate reporting'
}

// ═══════════════════════════════════════════════════════════════
// GATE ENTRY DIALOG — redesigned to match LogisticsPro reference
// ═══════════════════════════════════════════════════════════════
function GateEntryDialog({ onClose, onFound }) {
  const [trackingInput, setTrackingInput] = useState('')
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!trackingInput.trim()) {
      setError('Please enter a tracking number.')
      return
    }
    setSearching(true)
    setError('')
    try {
      const result = await gateApi.searchByTrackingNumber(trackingInput.trim())
      if (!result) {
        setError('No tracking found for the entered number.')
        setSearching(false)
        return
      }
      onFound(result)
      onClose()
    } catch (err) {
      setError('Failed to search. Please try again.')
      setSearching(false)
    }
  }

  return (
    <div className="lp-overlay fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0d1b4b]/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className="lp-modal relative z-10 w-full max-w-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Modal Header */}
        <div className="lp-modal-header flex items-center gap-3 px-6 py-5 bg-[#f8f9fc] border-b border-[#e8eaf0]">
          <div className="w-10 h-10 rounded-xl bg-[#1a2980] flex items-center justify-center flex-shrink-0">
            <Radio size={18} color="white" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <div className="text-[16px] font-bold text-[#0d1b4b] tracking-tight">Gate Entry</div>
            <div className="text-[12px] text-[#6b7280] font-medium mt-0.5">Manual Access Authorization</div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6b7280] hover:text-[#0d1b4b] hover:bg-[#e8eaf0] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-6 space-y-5">
          {/* Tracking Number Input */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#6b7280] mb-2">
              Tracking Number
            </label>
            <div className="relative">
              <input
                type="text"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Number/Year"
                autoFocus
                className="lp-input w-full h-12 px-4 pr-12 text-[14px] font-medium text-[#0d1b4b] border border-[#d1d5db] rounded-xl bg-white placeholder-[#9ca3af] focus:outline-none focus:border-[#1a2980] focus:ring-3 focus:ring-[#1a2980]/10 transition-all"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#9ca3af] hover:text-[#1a2980] transition-colors">
                <QrCode size={18} />
              </button>
            </div>
            <p className="mt-2 text-[12px] text-[#6b7280] flex items-center gap-1.5">
              <span className="inline-block w-4 h-4 rounded-full border border-[#9ca3af] flex items-center justify-center text-[9px] font-bold text-[#6b7280] flex-shrink-0">i</span>
              Please enter the exact tracking ID provided in the shipment document.
            </p>
          </div>

          {/* Gate Camera Preview */}
          <div className="relative rounded-xl overflow-hidden h-[120px] bg-[#1a2332]">
            {/* Simulated gate image — industrial stripes */}
            <div className="absolute inset-0 flex">
              {[...Array(16)].map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-full"
                  style={{
                    background: i % 2 === 0
                      ? 'linear-gradient(180deg, #2a3a4a 0%, #1a2332 100%)'
                      : 'linear-gradient(180deg, #c8a820 0%, #a08010 100%)',
                    opacity: i % 2 === 0 ? 1 : 0.7,
                  }}
                />
              ))}
            </div>
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1b4b]/60 via-transparent to-[#0d1b4b]/20" />
            {/* Gate label */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-lg">
                <MapPin size={11} color="#1a2980" strokeWidth={2.5} />
                <span className="text-[11px] font-bold text-[#0d1b4b] tracking-wider uppercase">Gate North-04</span>
              </div>
            </div>
          </div>

          {/* Warning banner */}
          <div className="flex items-center gap-3 bg-[#fffbeb] border border-[#fcd34d] rounded-xl px-4 py-3">
            <AlertTriangle size={16} color="#d97706" strokeWidth={2} className="flex-shrink-0" />
            <span className="text-[12px] font-medium text-[#92400e]">
              Ensure vehicle is positioned at the sensor before submission.
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-[#fef2f2] border border-[#fca5a5] rounded-xl px-4 py-3">
              <X size={14} color="#dc2626" className="flex-shrink-0 mt-0.5" />
              <span className="text-[12px] font-medium text-[#dc2626]">{error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#f8f9fc] border-t border-[#e8eaf0] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="h-10 px-5 text-[13px] font-semibold text-[#6b7280] bg-white border border-[#d1d5db] rounded-xl hover:bg-[#f3f4f6] hover:text-[#374151] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={searching}
            className="lp-btn-primary h-10 px-6 text-[13px] font-bold text-white bg-[#1a2980] rounded-xl hover:bg-[#0f1e6e] active:scale-[0.98] transition-all shadow-lg shadow-[#1a2980]/30 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {searching ? 'Searching…' : 'Submit Entry'}
          </button>
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
    <div className="lp-overlay fixed inset-0 z-[70] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[#0d1b4b]/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className="lp-modal relative bg-white rounded-2xl shadow-2xl w-full max-w-[440px] overflow-hidden">
        <div className="px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={20} color="#16a34a" />
            </div>
            <div>
              <div className="text-[15px] font-bold text-[#15803d] mb-1.5">Success</div>
              <div className="text-[13px] text-[#374151] leading-relaxed">{message}</div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-[#f8f9fc] border-t border-[#e8eaf0] flex justify-end">
          <button
            onClick={onClose}
            className="lp-btn-primary h-9 px-6 text-[13px] font-bold text-white bg-[#1a2980] rounded-xl hover:bg-[#0f1e6e] transition-all shadow-md"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// STATUS BADGE
// ═══════════════════════════════════════════════════════════════
function StatusBadge({ status, statusColor, size = 'sm' }) {
  const style = statusStyle(statusColor)
  const isLg = size === 'lg'
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${isLg ? 'text-[13px] px-3 py-1' : 'text-[11px] px-2 py-0.5'}`}
      style={{ background: style.bg, color: style.text }}
    >
      <span
        className={`rounded-full flex-shrink-0 ${isLg ? 'w-2 h-2' : 'w-1.5 h-1.5'}`}
        style={{ background: style.dot }}
      />
      {status}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function GateInGateOut() {
  const [trackings, setTrackings] = useState([])
  const [tracking, setTracking] = useState(null)
  const [selectedId, setSelectedId] = useState('1000001160/2026')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('timeline')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [timelinePage, setTimelinePage] = useState(0)

  const [gateEntryOpen, setGateEntryOpen] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [successOpen, setSuccessOpen] = useState(false)
  const [gateReportLoading, setGateReportLoading] = useState(false)
  const [gateInLoading, setGateInLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    gateApi.listTrackings({ search: searchQuery })
      .then(data => { if (!cancelled) setTrackings(data) })
      .catch(err => console.error(err))
    return () => { cancelled = true }
  }, [searchQuery])

  useEffect(() => {
    let cancelled = false
    if (!selectedId) { setTracking(null); return }
    gateApi.getTracking(selectedId)
      .then(data => { if (!cancelled) { setTracking(data); setActiveTab('timeline') } })
      .catch(err => console.error(err))
    return () => { cancelled = true }
  }, [selectedId])

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

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (gateEntryOpen) setGateEntryOpen(false)
        else if (successOpen) setSuccessOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [gateEntryOpen, successOpen])

  const handleSelectTracking = (id) => {
    setSelectedId(id)
    setMobileSidebarOpen(false)
    setTimelinePage(0)
  }

  const handleGateEntryFound = (found) => {
    setSelectedId(found.id)
    setTrackings(prev => {
      const exists = prev.find(t => t.id === found.id)
      if (exists) return prev
      return [found, ...prev]
    })
  }

  const handleGateReporting = async () => {
    if (!tracking) return
    setGateReportLoading(true)
    try {
      await gateApi.processGateReporting(tracking.id)
      setSuccessMsg('Gate reporting processed successfully')
      setSuccessOpen(true)
      setTracking(prev => prev ? {
        ...prev,
        status: 'Gate Reported',
        statusColor: 'orange',
        timeline: prev.timeline.map(t =>
          t.key === 'gate_reporting' ? { ...t, completed: true, timestamp: new Date().toLocaleString() } : t
        ),
      } : prev)
    } catch (err) {
      console.error(err)
    } finally {
      setGateReportLoading(false)
    }
  }

  const handleGateIn = async () => {
    if (!tracking) return
    setGateInLoading(true)
    try {
      const result = await gateApi.processGateIn(tracking.id)
      setSuccessMsg(
        `Gate In processed and gate entry number ${result.gateEntryNumber} generated successfully for Reference document Number :${result.referenceDocNumber}.`
      )
      setSuccessOpen(true)
      setTracking(prev => prev ? {
        ...prev,
        status: 'Gate Entry (IN)',
        statusColor: 'blue',
        timeline: prev.timeline.map(t =>
          t.key === 'gate_entry_in' ? { ...t, completed: true, timestamp: new Date().toLocaleString() } : t
        ),
        summary: {
          ...prev.summary,
          gateEntryNumber: result.gateEntryNumber,
          referenceDocNumber: result.referenceDocNumber,
          gateInDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }),
          gateInTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        },
      } : prev)
    } catch (err) {
      console.error(err)
    } finally {
      setGateInLoading(false)
    }
  }

  // ── Sidebar inner content ──
  const SidebarContent = () => (
    <>
      {/* Sidebar header */}
      <div className="px-4 py-4 border-b border-[#e8eaf0]">
        {!sidebarCollapsed && (
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-bold text-[#0d1b4b] uppercase tracking-wider">Tracking Number List</h3>
            <span className="text-[11px] font-bold text-[#6b7280] bg-[#f3f4f6] px-2 py-0.5 rounded-full">
              {trackings.length}/{GATE_TRACKINGS.length}
            </span>
          </div>
        )}
        {sidebarCollapsed ? (
          <div className="flex justify-center">
            <button className="w-9 h-9 flex items-center justify-center text-[#9ca3af] hover:text-[#1a2980] rounded-lg hover:bg-[#f0f4ff] transition-all">
              <Search size={15} />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tracking number"
              className="w-full h-10 pl-9 pr-9 text-[13px] border border-[#e5e7eb] rounded-xl bg-[#f9fafb] text-[#0d1b4b] placeholder-[#9ca3af] focus:outline-none focus:border-[#1a2980] focus:bg-white focus:ring-2 focus:ring-[#1a2980]/10 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-[#9ca3af] hover:text-[#dc2626] rounded transition-all">
                <X size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {sidebarCollapsed ? (
          trackings.map((t) => {
            const isSelected = t.id === selectedId
            const st = statusStyle(t.statusColor)
            return (
              <button key={t.id} onClick={() => handleSelectTracking(t.id)} title={t.id}
                className={`w-full flex items-center justify-center py-3.5 border-b border-[#f0f1f5] transition-all border-l-[3px] ${isSelected ? 'bg-[#f0f4ff] border-l-[#1a2980]' : 'hover:bg-[#f9fafb] border-l-transparent'}`}
              >
                <span className={`text-[10px] font-bold ${isSelected ? 'text-[#1a2980]' : 'text-[#9ca3af]'}`}>
                  {t.trackingNo.slice(-4)}
                </span>
              </button>
            )
          })
        ) : (
          <>
            {trackings.map((t) => {
              const isSelected = t.id === selectedId
              const st = statusStyle(t.statusColor)
              return (
                <button key={t.id} onClick={() => handleSelectTracking(t.id)}
                  className={`w-full text-left px-4 py-4 border-b border-[#f0f1f5] transition-all border-l-[3px] ${isSelected ? 'bg-[#f0f4ff] border-l-[#1a2980]' : 'hover:bg-[#f9fafb] border-l-transparent'}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[13px] font-bold ${isSelected ? 'text-[#1a2980]' : 'text-[#374151]'}`}>{t.id}</span>
                  </div>
                  <div className="text-[12px] text-[#9ca3af] mb-2">{t.transportMode} · {t.date}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#6b7280]">Plant: {t.plant}</span>
                    <StatusBadge status={t.status} statusColor={t.statusColor} />
                  </div>
                </button>
              )
            })}
            {trackings.length === 0 && (
              <div className="px-4 py-12 text-center">
                <Search size={32} className="mx-auto mb-2 text-[#d1d5db]" />
                <div className="text-[13px] text-[#9ca3af]">No trackings found</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Collapse toggle */}
      <div className="border-t border-[#e8eaf0] px-3 py-2.5 flex items-center justify-end">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg text-[#9ca3af] hover:text-[#1a2980] hover:bg-[#f0f4ff] transition-all"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft size={16}
            style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease' }}
          />
        </button>
      </div>
    </>
  )

  // ── Timeline tab ──
  const renderTimeline = () => {
    if (!tracking) return null
    const steps = TIMELINE_STEPS.map(s => {
      const found = tracking.timeline.find(t => t.key === s.key)
      return { ...s, completed: found?.completed || false, timestamp: found?.timestamp || null }
    })
    const lastCompletedIdx = steps.reduce((acc, s, i) => s.completed ? i : acc, -1)

    return (
      <div className="lp-fade px-4 sm:px-6 lg:px-10 py-8">
        {/* Desktop timeline */}
        <div className="hidden sm:block">
          <div className="relative flex items-start justify-between">
            {/* Track */}
            <div className="absolute top-[28px] left-[44px] right-[44px] h-[2px] bg-[#e5e7eb] z-0 rounded-full" />
            {lastCompletedIdx > 0 && (
              <div
                className="absolute top-[28px] left-[44px] h-[2px] bg-[#1a2980] z-0 rounded-full transition-all duration-700"
                style={{ width: `calc(${(lastCompletedIdx / (steps.length - 1)) * 100}% - 0px)` }}
              />
            )}
            {steps.map((step, idx) => {
              const { Icon } = step
              const isCompleted = step.completed
              const isActive = idx === lastCompletedIdx
              return (
                <div key={step.key} className="relative flex flex-col items-center z-10" style={{ width: `${100 / steps.length}%` }}>
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300
                      ${isCompleted
                        ? 'bg-[#1a2980] shadow-lg shadow-[#1a2980]/25'
                        : 'bg-white border-2 border-[#e5e7eb]'
                      }
                      ${isActive ? 'scale-110 ring-4 ring-[#1a2980]/15' : ''}
                    `}
                  >
                    <Icon size={22} color={isCompleted ? 'white' : '#d1d5db'} strokeWidth={1.8} />
                  </div>
                  <div className="mt-3 text-center px-1">
                    <div className={`text-[12px] font-semibold leading-tight ${isCompleted ? 'text-[#0d1b4b]' : 'text-[#d1d5db]'}`}>
                      {step.label}
                    </div>
                    {step.timestamp && (
                      <div className="text-[11px] text-[#9ca3af] mt-1 leading-tight">{step.timestamp}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile timeline — vertical */}
        <div className="sm:hidden relative pl-10">
          <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-[#e5e7eb] rounded-full" />
          {lastCompletedIdx >= 0 && (
            <div
              className="absolute left-[19px] top-2 w-[2px] bg-[#1a2980] rounded-full transition-all duration-700"
              style={{ height: `calc(${((lastCompletedIdx + 0.5) / steps.length) * 100}%)` }}
            />
          )}
          <div className="space-y-6">
            {steps.map((step, idx) => {
              const { Icon } = step
              const isCompleted = step.completed
              const isActive = idx === lastCompletedIdx
              return (
                <div key={step.key} className="relative flex items-start gap-4">
                  <div
                    className={`absolute -left-10 w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-300 z-10
                      ${isCompleted
                        ? 'bg-[#1a2980] border-[#1a2980] shadow-md shadow-[#1a2980]/20'
                        : 'bg-white border-[#e5e7eb]'
                      }
                      ${isActive ? 'scale-110' : ''}
                    `}
                  >
                    <Icon size={16} color={isCompleted ? 'white' : '#d1d5db'} strokeWidth={1.8} />
                  </div>
                  <div className="min-h-[40px] flex flex-col justify-center pb-1">
                    <div className={`text-[13px] font-semibold ${isCompleted ? 'text-[#0d1b4b]' : 'text-[#d1d5db]'}`}>
                      {step.label}
                    </div>
                    {step.timestamp && (
                      <div className="text-[11px] text-[#9ca3af] mt-0.5">{step.timestamp}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── ASN tab ──
  const renderAsn = () => {
    if (!tracking) return null
    return (
      <div className="lp-fade px-4 sm:px-6 lg:px-10 py-6">
        <div className="overflow-x-auto rounded-2xl border border-[#e8eaf0] shadow-sm">
          <table className="w-full text-[14px]" style={{ minWidth: '750px' }}>
            <thead>
              <tr className="bg-[#f8f9fc] border-b border-[#e8eaf0]">
                {['ASN', 'Total Line Items', 'IBD Number', 'Plant', 'Storage Location', 'Invoice Number', 'Invoice Amount', 'Invoice Date'].map(h => (
                  <th key={h} className="text-left font-bold py-3.5 px-4 text-[11px] uppercase tracking-wider text-[#9ca3af]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tracking.asns.map((asn, idx) => (
                <tr key={idx} className="border-b border-[#f3f4f6] last:border-b-0 hover:bg-[#f8f9fc] transition-colors">
                  <td className="py-4 px-4">
                    <span className="text-[#1a2980] font-semibold hover:underline cursor-pointer">{asn.asnId}</span>
                  </td>
                  <td className="py-4 px-4 text-[#374151]">{asn.totalLineItems}</td>
                  <td className="py-4 px-4 text-[#374151] font-medium">{asn.ibdNumber}</td>
                  <td className="py-4 px-4">
                    <span className="font-bold text-[#0d1b4b] bg-[#f0f4ff] px-2 py-0.5 rounded-lg text-[12px]">{asn.plant}</span>
                  </td>
                  <td className="py-4 px-4 text-[#374151]">{asn.storageLocation}</td>
                  <td className="py-4 px-4 text-[#374151] font-medium">{asn.invoiceNumber}</td>
                  <td className="py-4 px-4 font-bold text-[#0d1b4b]">{asn.invoiceAmount.toFixed(2)}</td>
                  <td className="py-4 px-4 text-[#374151]">{asn.invoiceDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ── Summary tab ──
  const renderSummary = () => {
    if (!tracking) return null
    const s = tracking.summary
    return (
      <div className="lp-fade px-4 sm:px-6 lg:px-10 py-6">
        <div className="max-w-2xl">
          <div className="rounded-2xl border border-[#e8eaf0] bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-[#f8f9fc] border-b border-[#e8eaf0] flex items-center gap-2">
              <CheckCircle2 size={16} color="#1a2980" />
              <h4 className="text-[14px] font-bold text-[#0d1b4b]">Gate Entry Summary</h4>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { label: 'Gate Entry Number', value: s?.gateEntryNumber || '—' },
                { label: 'Reference Document Number', value: s?.referenceDocNumber || '—' },
                { label: 'Gate In Date', value: s?.gateInDate || '—' },
                { label: 'Gate In Time', value: s?.gateInTime || '—' },
                { label: 'Tracking Number', value: tracking.id },
                { label: 'Status', value: tracking.status },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 rounded-xl bg-[#f8f9fc] border border-[#f0f1f5]">
                  <div className="text-[10px] uppercase tracking-widest text-[#9ca3af] font-bold mb-1">{label}</div>
                  <div className="text-[14px] font-bold text-[#0d1b4b]">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const tabContent = { timeline: renderTimeline, asn: renderAsn, summary: renderSummary }

  return (
    <PageLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

        * { font-family: 'DM Sans', sans-serif; }

        @keyframes lpFade { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes lpSlideL { from { opacity:0; transform:translateX(-10px); } to { opacity:1; transform:translateX(0); } }
        @keyframes lpSlideR { from { opacity:0; transform:translateX(10px); } to { opacity:1; transform:translateX(0); } }
        @keyframes lpModal { from { opacity:0; transform:scale(0.95) translateY(-6px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes lpOverlay { from { opacity:0; } to { opacity:1; } }
        @keyframes lpDrawer { from { transform:translateX(-100%); } to { transform:translateX(0); } }

        .lp-fade { animation: lpFade 0.3s ease-out both; }
        .lp-slide-l { animation: lpSlideL 0.3s ease-out both; }
        .lp-slide-r { animation: lpSlideR 0.3s ease-out both; }
        .lp-modal { animation: lpModal 0.2s ease-out both; }
        .lp-overlay { animation: lpOverlay 0.15s ease-out both; }
        .lp-drawer { animation: lpDrawer 0.25s ease-out both; }

        .sidebar-transition { transition: width 0.25s ease; }

        .lp-input:focus { box-shadow: 0 0 0 3px rgba(26,41,128,0.08); }
        .lp-btn-primary:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(26,41,128,0.35); }
        .lp-btn-primary:not(:disabled):active { transform: translateY(0); }

        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
      `}</style>

      <div className="bg-[#f3f4f8] min-h-[calc(100vh-136px)]">
        <div className="flex" style={{ minHeight: 'calc(100vh - 136px)' }}>

          {/* Mobile overlay */}
          {mobileSidebarOpen && (
            <div className="fixed inset-0 bg-[#0d1b4b]/40 backdrop-blur-[1px] z-40 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
          )}

          {/* Mobile sidebar drawer */}
          <aside data-sidebar
            className={`fixed top-0 left-0 h-full w-[300px] bg-white border-r border-[#e8eaf0] flex flex-col z-50 md:hidden lp-drawer ${mobileSidebarOpen ? 'flex' : 'hidden'}`}
          >
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#e8eaf0] bg-[#f8f9fc]">
              <span className="text-[13px] font-bold text-[#0d1b4b] uppercase tracking-wider">Tracking Number List</span>
              <button onClick={() => setMobileSidebarOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-[#dc2626] hover:bg-[#fef2f2] transition-all">
                <X size={15} />
              </button>
            </div>
            <SidebarContent />
          </aside>

          {/* Desktop sidebar */}
          <aside data-sidebar
            className={`hidden md:flex flex-col bg-white border-r border-[#e8eaf0] sidebar-transition lp-slide-l flex-shrink-0 ${sidebarCollapsed ? 'w-[56px]' : 'w-[300px] lg:w-[340px]'}`}
          >
            <SidebarContent />
          </aside>

          {/* Right pane */}
          <main className="flex-1 bg-white overflow-y-auto lp-slide-r min-w-0 pb-24">
            {tracking && (
              <>
                {/* Header */}
                <div className="px-4 sm:px-6 lg:px-10 pt-6 pb-5 border-b border-[#e8eaf0] bg-white">
                  {/* Mobile hamburger */}
                  <div className="flex items-center gap-3 mb-4 md:hidden">
                    <button data-sidebar-toggle onClick={() => setMobileSidebarOpen(true)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#e5e7eb] text-[#6b7280] hover:text-[#1a2980] hover:border-[#1a2980] transition-all">
                      <Menu size={16} />
                    </button>
                    <span className="text-[13px] text-[#9ca3af]">Trackings</span>
                  </div>

                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-widest text-[#9ca3af] mb-2">
                        Tracking Number — {tracking.id}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap mb-1.5">
                        <h2 className="text-[24px] sm:text-[28px] font-bold text-[#0d1b4b] tracking-tight">{tracking.id}</h2>
                        <StatusBadge status={tracking.status} statusColor={tracking.statusColor} size="lg" />
                      </div>
                      <div className="text-[13px] text-[#6b7280] font-medium">
                        {tracking.plantName} <span className="text-[#d1d5db]">·</span> <span className="font-bold text-[#374151]">{tracking.plant}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays size={13} color="#9ca3af" />
                      <span className="hidden sm:block text-[13px] text-[#9ca3af] font-medium">{tracking.date}</span>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {[
                      { Icon: Truck, label: 'Transporter', value: tracking.transporter },
                      { Icon: User, label: 'Driver Name', value: tracking.driverName },
                      { Icon: Phone, label: 'Contact', value: tracking.contact },
                      { Icon: Hash, label: 'Vendor', value: tracking.vendor },
                      { Icon: ShieldCheck, label: 'Pollution Cert.', value: tracking.pollutionCertificateApplicable },
                      { Icon: HardHat, label: 'Safety Equip.', value: tracking.safetyEquipments },
                      { Icon: Car, label: 'Safety Guard', value: tracking.safetyGuardForMaterial },
                      { Icon: Car, label: 'Mode', value: tracking.transportationMode },
                      { Icon: Hash, label: 'Truck Number', value: tracking.vehicleRegNo },
                      { Icon: Banknote, label: 'Eway Bill', value: tracking.ewayBillNo || '—' },
                      { Icon: CalendarDays, label: 'Eway Bill Date', value: tracking.ewayBillDate || '—' },
                      { Icon: Banknote, label: 'Total ASN Amt', value: tracking.totalAsnAmount.toFixed(2) },
                    ].map(({ Icon, label, value }) => (
                      <div key={label} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#f8f9fc] border border-[#f0f1f5]">
                        <div className="w-7 h-7 rounded-lg bg-[#e8eaf0] flex items-center justify-center flex-shrink-0">
                          <Icon size={13} color="#6b7280" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] leading-tight">{label}</div>
                          <div className="text-[12px] font-bold text-[#0d1b4b] mt-0.5 truncate">{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tabs */}
                <div className="px-4 sm:px-6 lg:px-10 pt-5 pb-0 border-b border-[#e8eaf0] bg-white">
                  <div className="flex items-end gap-1 overflow-x-auto">
                    {TABS.map((tab) => {
                      const isActive = activeTab === tab.key
                      const { Icon } = tab
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          className={`relative flex items-center gap-2 px-4 py-3 rounded-t-xl text-[13px] font-semibold transition-all duration-200 flex-shrink-0 border border-b-0
                            ${isActive
                              ? 'bg-white text-[#1a2980] border-[#e8eaf0] shadow-sm'
                              : 'text-[#9ca3af] border-transparent hover:text-[#374151] hover:bg-[#f8f9fc]'
                            }
                          `}
                        >
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isActive ? 'bg-[#1a2980]' : 'bg-[#f0f1f5]'}`}>
                            <Icon size={13} color={isActive ? 'white' : '#9ca3af'} strokeWidth={2} />
                          </div>
                          {tab.label}
                          {isActive && (
                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1a2980] rounded-t-full" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Tab content */}
                <div key={`${tracking.id}-${activeTab}`} className="bg-white">
                  {tabContent[activeTab]?.()}
                </div>
              </>
            )}

            {!tracking && (
              <div className="flex flex-col items-center justify-center h-64 text-[#d1d5db] lp-fade">
                <LogIn size={48} className="mb-3" strokeWidth={1.5} />
                <span className="text-[14px] font-medium text-[#9ca3af]">Select a tracking number from the list</span>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ─────────── Bottom action bar ─────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#e8eaf0] px-4 sm:px-6 py-3.5 flex items-center gap-2.5 z-30 shadow-[0_-4px_20px_rgba(13,27,75,0.08)] flex-wrap">
        <button
          onClick={() => setGateEntryOpen(true)}
          className="lp-btn-primary flex items-center gap-2 px-4 h-10 text-[13px] font-bold text-white bg-[#1a2980] rounded-xl transition-all shadow-md"
        >
          <LogIn size={15} />
          Gate Entry
        </button>

        {tracking && canGateReport(tracking.status) && (
          <button
            onClick={handleGateReporting}
            disabled={gateReportLoading}
            className="flex items-center gap-2 px-4 h-10 text-[13px] font-bold text-white bg-[#d97706] rounded-xl hover:bg-[#b45309] transition-all shadow-md shadow-[#d97706]/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <MapPin size={15} />
            {gateReportLoading ? 'Processing…' : 'Gate Reporting'}
          </button>
        )}

        {tracking && canGateIn(tracking.status) && (
          <button
            onClick={handleGateIn}
            disabled={gateInLoading}
            className="flex items-center gap-2 px-4 h-10 text-[13px] font-bold text-white bg-[#15803d] rounded-xl hover:bg-[#166534] transition-all shadow-md shadow-[#15803d]/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <CheckCircle2 size={15} />
            {gateInLoading ? 'Processing…' : 'Gate In'}
          </button>
        )}
      </div>

      {/* ─────────── Gate Entry Dialog ─────────── */}
      {gateEntryOpen && (
        <GateEntryDialog
          onClose={() => setGateEntryOpen(false)}
          onFound={handleGateEntryFound}
        />
      )}

      {/* ─────────── Success Dialog ─────────── */}
      {successOpen && (
        <SuccessDialog
          message={successMsg}
          onClose={() => setSuccessOpen(false)}
        />
      )}
    </PageLayout>
  )
}