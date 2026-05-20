import { useState, useEffect, useMemo } from 'react'
import PageLayout from '../../layouts/PageLayout.jsx'
import {
  ChevronLeft,
  ExternalLink,
  CalendarDays,
  X,
  Save,
  Search,
  Truck,
  Plane,
  Ship,
  Train,
  Package,
  Hand,
  Handshake,
  AlertCircle,
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════
// DUMMY DATA
// ═══════════════════════════════════════════════════════════════
const ASN_LOOKUP = [
  { asnId: '2600000044', ibdNumber: '85015550', plant: 'SR01', invoiceNumber: 'INV-0044', invoiceAmount: 10.00 },
  { asnId: '2600000045', ibdNumber: '85015549', plant: 'NMR',  invoiceNumber: 'GH12',     invoiceAmount: 968.80 },
  { asnId: '2600000046', ibdNumber: '85015551', plant: 'NMR',  invoiceNumber: 'INV-0046', invoiceAmount: 540.20 },
  { asnId: '2600000047', ibdNumber: '85015552', plant: 'NM01', invoiceNumber: 'INV-0047', invoiceAmount: 1250.00 },
  { asnId: '2600000048', ibdNumber: '85015553', plant: 'SR01', invoiceNumber: 'INV-0048', invoiceAmount: 320.50 },
]

// ═══════════════════════════════════════════════════════════════
// TRANSPORT MODE OPTIONS
// ═══════════════════════════════════════════════════════════════
const TRANSPORT_MODES = [
  { value: 'By Road',             label: 'By Road',             Icon: Truck },
  { value: 'By Air',              label: 'By Air',              Icon: Plane },
  { value: 'By Ship',             label: 'By Ship',             Icon: Ship },
  { value: 'By Rail',             label: 'By Rail',             Icon: Train },
  { value: 'By Courier',          label: 'By Courier',          Icon: Package },
  { value: 'By Hand',             label: 'By Hand',             Icon: Hand },
  { value: 'Tie-up Supplier',     label: 'Tie-up Supplier',     Icon: Handshake },
]

// ═══════════════════════════════════════════════════════════════
// API STRUCTURE — for future backend integration
// ═══════════════════════════════════════════════════════════════
const API_BASE_URL = '/api/v1'
const USE_MOCK = true

const createMovementApi = {
  async searchAsns({ search = '' } = {}) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 80))
      const q = search.trim().toLowerCase()
      return ASN_LOOKUP.filter(a =>
        !q ||
        a.asnId.toLowerCase().includes(q) ||
        a.ibdNumber.toLowerCase().includes(q) ||
        a.plant.toLowerCase().includes(q) ||
        a.invoiceNumber.toLowerCase().includes(q)
      )
    }
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    const res = await fetch(`${API_BASE_URL}/asn-lookup?${params}`)
    if (!res.ok) throw new Error('Failed to fetch ASN lookup')
    return res.json()
  },

  async createMovement(payload) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 400))
      const newId = `100000${Math.floor(1000 + Math.random() * 9000)}/2026`
      return { success: true, trackingId: newId, payload }
    }
    const res = await fetch(`${API_BASE_URL}/shipment-tracking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Failed to create movement')
    return res.json()
  },

  async updateMovement(id, payload) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 400))
      return { success: true, trackingId: id, payload }
    }
    const res = await fetch(`${API_BASE_URL}/shipment-tracking/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Failed to update movement')
    return res.json()
  },
}

// ═══════════════════════════════════════════════════════════════
// FORM FIELDS CONFIG
// ═══════════════════════════════════════════════════════════════
const INITIAL_FORM = {
  asnNum: '',
  transportMode: 'By Road',
  ewayBillNo: '',
  ewayBillDate: '',
  lrNum: '',
  transporterName: '',
  driverName: '',
  contactNumber: '',
  vehicleRegNo: '',
  finaltranspoterName: '',
  pollutionCertificateApplicable: false,
  safetyEquipments: false,
  safetyGuardForMaterial: false,
}

// Helper to convert tracking data into form shape when editing
const trackingToForm = (t) => {
  // Convert ewayBillDate string (e.g. "Nov 13, 2025") to YYYY-MM-DD for input[type=date]
  let ewayBillDateVal = ''
  if (t.ewayBillDate) {
    try {
      const d = new Date(t.ewayBillDate)
      if (!isNaN(d)) {
        const pad = (n) => String(n).padStart(2, '0')
        ewayBillDateVal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
      }
    } catch { /* ignore */ }
  }

  return {
    asnNum: t.asns?.[0]?.asnId?.replace('...', '') || '',
    transportMode: t.transportationMode || t.transportMode || 'By Road',
    ewayBillNo: t.ewayBillNo || '',
    ewayBillDate: ewayBillDateVal,
    lrNum: t.lrNum || '',
    transporterName: t.transporter || '',
    driverName: t.driverName || '',
    contactNumber: t.contact || '',
    vehicleRegNo: t.vehicleRegNo || '',
    finaltranspoterName: t.finalTransporterName || '',
    pollutionCertificateApplicable: t.pollutionCertificateApplicable === 'Yes' || t.pollutionCertificateApplicable === true,
    safetyEquipments: t.safetyEquipments === 'Yes' || t.safetyEquipments === true,
    safetyGuardForMaterial: t.safetyGuardForMaterial === 'Yes' || t.safetyGuardForMaterial === true,
  }
}

// ═══════════════════════════════════════════════════════════════
// REUSABLE FIELD ROW
// ═══════════════════════════════════════════════════════════════
const FieldRow = ({ label, required, children, error }) => (
  <div className="grid grid-cols-12 gap-3 sm:gap-4 items-start py-2.5">
    <label className="col-span-12 sm:col-span-5 lg:col-span-4 text-[13px] sm:text-[14px] font-medium text-[#32363a] sm:text-right pt-2.5">
      {label}
      {required && <span className="text-[#cc1c14] ml-0.5">*</span>}
      <span className="hidden sm:inline">:</span>
    </label>
    <div className="col-span-12 sm:col-span-7 lg:col-span-6">
      {children}
      {error && (
        <div className="flex items-center gap-1 mt-1 text-[12px] text-[#cc1c14]">
          <AlertCircle size={12} />
          {error}
        </div>
      )}
    </div>
  </div>
)

// ═══════════════════════════════════════════════════════════════
// REUSABLE TOGGLE SWITCH (Yes / No)
// ═══════════════════════════════════════════════════════════════
const ToggleSwitch = ({ value, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    className={`relative inline-flex items-center h-8 w-[74px] rounded-full transition-all duration-200 border ${
      value
        ? 'bg-[#107e3e] border-[#107e3e]'
        : 'bg-[#6a6d70] border-[#6a6d70]'
    } shadow-sm hover:scale-[1.02] active:scale-[0.98]`}
  >
    <span className={`absolute text-[11px] font-bold text-white tracking-wider transition-all ${
      value ? 'left-3' : 'right-3'
    }`}>
      {value ? 'YES' : 'NO'}
    </span>
    <span
      className={`inline-block w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
        value ? 'translate-x-[44px]' : 'translate-x-[2px]'
      }`}
    />
  </button>
)

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// Props:
//   editData  — tracking object to pre-fill (null = create mode)
//   onBack    — callback to return to GoodsMovement (replaces navigate(-1))
// ═══════════════════════════════════════════════════════════════
export default function CreateMovement({ editData = null, onBack = null }) {
  const isEditMode = !!editData

  // Prefer the onBack prop; fall back to react-router if available
  const navigate = (() => {
    try { return require('react-router-dom').useNavigate() } catch { return null }
  })()

  const goBack = () => {
    if (onBack) { onBack(); return }
    if (navigate) navigate(-1)
    else window.history.back()
  }

  const [form, setForm] = useState(() => editData ? trackingToForm(editData) : INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // ASN value-help dialog
  const [asnLookupOpen, setAsnLookupOpen] = useState(false)
  const [asnLookupSearch, setAsnLookupSearch] = useState('')
  const [asnLookupResults, setAsnLookupResults] = useState([])

  // Re-initialise form if editData changes (e.g. user navigates to a different tracking)
  useEffect(() => {
    if (editData) {
      setForm(trackingToForm(editData))
      setErrors({})
      setSubmitError('')
    }
  }, [editData?.id])

  // Load ASN lookup
  useEffect(() => {
    if (!asnLookupOpen) return
    let cancelled = false
    createMovementApi.searchAsns({ search: asnLookupSearch })
      .then(data => { if (!cancelled) setAsnLookupResults(data) })
      .catch(err => console.error(err))
    return () => { cancelled = true }
  }, [asnLookupOpen, asnLookupSearch])

  // Close dialog on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && asnLookupOpen) setAsnLookupOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [asnLookupOpen])

  const updateField = (key, value) => {
    setForm(f => ({ ...f, [key]: value }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }))
  }

  const validate = () => {
    const e = {}
    if (!form.asnNum.trim()) e.asnNum = 'ASN Number is required'
    if (!form.transportMode) e.transportMode = 'Transport Mode is required'
    if (!form.transporterName.trim()) e.transporterName = 'Transporter Name is required'
    if (!form.driverName.trim()) e.driverName = 'Driver Name is required'
    if (!form.contactNumber.trim()) e.contactNumber = 'Contact Number is required'
    else if (!/^\d{7,15}$/.test(form.contactNumber.trim())) e.contactNumber = 'Enter a valid contact number'
    if (!form.vehicleRegNo.trim()) e.vehicleRegNo = 'Vehicle Reg. No. is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    setSubmitError('')
    if (!validate()) return
    setSubmitting(true)
    try {
      if (isEditMode) {
        const result = await createMovementApi.updateMovement(editData.id, form)
        console.log('Updated:', result)
      } else {
        const result = await createMovementApi.createMovement(form)
        console.log('Created:', result)
      }
      goBack()
    } catch (err) {
      console.error(err)
      setSubmitError(`Failed to ${isEditMode ? 'update' : 'create'} movement. Please try again.`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setForm(editData ? trackingToForm(editData) : INITIAL_FORM)
    setErrors({})
    setSubmitError('')
  }

  const handlePickAsn = (row) => {
    updateField('asnNum', row.asnId)
    setAsnLookupOpen(false)
    setAsnLookupSearch('')
  }

  const clearEwayDate = () => updateField('ewayBillDate', '')

  const selectedTransport = useMemo(
    () => TRANSPORT_MODES.find(m => m.value === form.transportMode) || TRANSPORT_MODES[0],
    [form.transportMode]
  )

  return (
    <PageLayout>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.94) translateY(-8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
        .anim-fade { animation: fadeIn 0.35s ease-out both; }
        .anim-slide-up { animation: slideInUp 0.35s ease-out both; }
        .anim-scale { animation: scaleIn 0.25s ease-out both; }
        .anim-modal { animation: modalIn 0.22s ease-out both; }
        .anim-overlay { animation: overlayIn 0.18s ease-out both; }
        .row-stagger > * { animation: fadeIn 0.4s ease-out both; }
        .row-stagger > *:nth-child(1) { animation-delay: 0.04s; }
        .row-stagger > *:nth-child(2) { animation-delay: 0.08s; }
        .row-stagger > *:nth-child(3) { animation-delay: 0.12s; }
        .row-stagger > *:nth-child(4) { animation-delay: 0.16s; }
        .row-stagger > *:nth-child(5) { animation-delay: 0.20s; }
        .row-stagger > *:nth-child(6) { animation-delay: 0.24s; }
        .row-stagger > *:nth-child(7) { animation-delay: 0.28s; }
        .row-stagger > *:nth-child(8) { animation-delay: 0.32s; }
        .row-stagger > *:nth-child(9) { animation-delay: 0.36s; }
        .row-stagger > *:nth-child(10) { animation-delay: 0.40s; }
        .row-stagger > *:nth-child(11) { animation-delay: 0.44s; }
      `}</style>

      {/* Top context bar */}
      <div className="bg-white border-b border-[#e5e5e5] px-4 sm:px-6 lg:px-10 py-2 text-[13px] text-[#6a6d70] flex flex-wrap gap-x-6 gap-y-1">
        <span><span className="font-semibold text-[#32363a]">Company Code:</span> DSAL (Daikin Airconditioning India Private Limited)</span>
        <span><span className="font-semibold text-[#32363a]">Supplier Name:</span> Kunstocom(India) Ltd</span>
        <span className="ml-auto"><span className="font-semibold text-[#32363a]">Supplier Location:</span> NEEMRANA(alwar)</span>
      </div>

      {/* Page header bar with back + title */}
      <div className="bg-white border-b border-[#e5e5e5] px-4 sm:px-6 lg:px-10 py-3 flex items-center gap-3 anim-fade">
        <button
          onClick={goBack}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#d9d9d9] text-[#6a6d70] hover:text-[#0a6ed1] hover:border-[#0a6ed1] hover:bg-[#f0f7ff] transition-all"
          title="Back"
        >
          <ChevronLeft size={17} />
        </button>
        <h2 className="flex-1 text-center text-[16px] sm:text-[18px] font-bold text-[#32363a] tracking-tight">
          {isEditMode ? 'Change Movement' : 'Create Movement'}
        </h2>
        <div className="w-9" />
      </div>

      {/* Form area */}
      <div className="bg-[#f5f6f7] min-h-[calc(100vh-220px)] pb-24">
        <div className="max-w-[920px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 anim-slide-up">
          <div className="bg-white rounded-xl border border-[#e5e5e5] shadow-sm p-5 sm:p-8 row-stagger">

            {/* Tracking Number — read-only in edit mode */}
            {isEditMode && (
              <FieldRow label="Tracking Number">
                <input
                  type="text"
                  value={editData.id}
                  readOnly
                  className="w-full h-10 px-3 text-[14px] border border-[#d9d9d9] rounded-lg bg-[#f5f6f7] text-[#32363a] cursor-not-allowed"
                />
              </FieldRow>
            )}

            {/* ASN Num — value-help */}
            <FieldRow label="ASN Num." required error={errors.asnNum}>
              <div className="relative">
                <input
                  type="text"
                  value={form.asnNum}
                  onChange={(e) => updateField('asnNum', e.target.value)}
                  placeholder="Enter or pick an ASN"
                  className={`w-full h-10 pl-3 pr-11 text-[14px] border rounded-lg bg-white focus:outline-none focus:ring-2 transition-all ${
                    errors.asnNum
                      ? 'border-[#cc1c14] focus:border-[#cc1c14] focus:ring-[#cc1c14]/20'
                      : 'border-[#d9d9d9] focus:border-[#0a6ed1] focus:ring-[#0a6ed1]/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setAsnLookupOpen(true)}
                  title="Pick ASN"
                  className="absolute right-1 top-1 w-8 h-8 flex items-center justify-center rounded-md text-[#0a6ed1] hover:bg-[#ebf5ff] transition-all"
                >
                  <ExternalLink size={15} />
                </button>
              </div>
            </FieldRow>

            {/* Transport Mode */}
            <FieldRow label="Transport Mode" required error={errors.transportMode}>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <selectedTransport.Icon size={15} className="text-[#6a6d70]" strokeWidth={1.8} />
                </div>
                <select
                  value={form.transportMode}
                  onChange={(e) => updateField('transportMode', e.target.value)}
                  className="w-full h-10 pl-9 pr-9 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all appearance-none cursor-pointer"
                >
                  {TRANSPORT_MODES.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path d="M1 1L5 5L9 1" stroke="#6a6d70" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </FieldRow>

            {/* Eway Bill No. */}
            <FieldRow label="Eway Bill No.">
              <input
                type="text"
                value={form.ewayBillNo}
                onChange={(e) => updateField('ewayBillNo', e.target.value)}
                placeholder="Enter Eway Bill Number"
                className="w-full h-10 px-3 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all"
              />
            </FieldRow>

            <FieldRow label="LR No.">
              <input
                type="text"
                value={form.lrNum}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 30)
                  updateField('lrNum', value)
                }}
                placeholder="Enter LR Number"
                maxLength={30}
                className="w-full h-10 px-3 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all"
              />
            </FieldRow>

            

            {/* Eway Bill Date */}
            <FieldRow label="Eway Bill Date">
              <div className="relative">
                <input
                  type="date"
                  value={form.ewayBillDate}
                  onChange={(e) => updateField('ewayBillDate', e.target.value)}
                  className="w-full h-10 pl-3 pr-16 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                  <CalendarDays size={15} className="text-[#6a6d70] mr-1" />
                  {form.ewayBillDate && (
                    <button
                      type="button"
                      onClick={clearEwayDate}
                      title="Clear date"
                      className="w-7 h-7 flex items-center justify-center rounded-md text-[#cc1c14] hover:bg-[#fce8e6] transition-all"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </FieldRow>

            {/* Transporter Name */}
            <FieldRow label="Transporter Name" required error={errors.transporterName}>
              <input
                type="text"
                value={form.transporterName}
                onChange={(e) => updateField('transporterName', e.target.value)}
                placeholder="e.g. BNE, DHL, Bluedart"
                className={`w-full h-10 px-3 text-[14px] border rounded-lg bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.transporterName
                    ? 'border-[#cc1c14] focus:border-[#cc1c14] focus:ring-[#cc1c14]/20'
                    : 'border-[#d9d9d9] focus:border-[#0a6ed1] focus:ring-[#0a6ed1]/20'
                }`}
              />
            </FieldRow>

            {/* Driver Name */}
            <FieldRow label="Driver Name" required error={errors.driverName}>
              <input
                type="text"
                value={form.driverName}
                onChange={(e) => updateField('driverName', e.target.value)}
                placeholder="Enter driver's name"
                className={`w-full h-10 px-3 text-[14px] border rounded-lg bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.driverName
                    ? 'border-[#cc1c14] focus:border-[#cc1c14] focus:ring-[#cc1c14]/20'
                    : 'border-[#d9d9d9] focus:border-[#0a6ed1] focus:ring-[#0a6ed1]/20'
                }`}
              />
            </FieldRow>

            {/* Contact Number */}
            <FieldRow label="Contact Number" required error={errors.contactNumber}>
              <input
                type="tel"
                value={form.contactNumber}
                onChange={(e) => updateField('contactNumber', e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit phone number"
                maxLength={15}
                className={`w-full h-10 px-3 text-[14px] border rounded-lg bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.contactNumber
                    ? 'border-[#cc1c14] focus:border-[#cc1c14] focus:ring-[#cc1c14]/20'
                    : 'border-[#d9d9d9] focus:border-[#0a6ed1] focus:ring-[#0a6ed1]/20'
                }`}
              />
            </FieldRow>

            <FieldRow label="Final Transporter Name">
              <input
                type="text"
                value={form.finaltranspoterName}
                onChange={(e) => updateField('finaltranspoterName', e.target.value)}
                placeholder="Enter final transporter name (if different)"
                className="w-full h-10 px-3 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all"
              />
            </FieldRow>

            {/* Vehicle Reg. No. / Docket */}
            <FieldRow label="Vehicle Reg. No. / Docket" required error={errors.vehicleRegNo}>
              <input
                type="text"
                value={form.vehicleRegNo}
                onChange={(e) => updateField('vehicleRegNo', e.target.value.toUpperCase())}
                placeholder="e.g. UP67 AB 1234"
                className={`w-full h-10 px-3 text-[14px] border rounded-lg bg-white focus:outline-none focus:ring-2 transition-all uppercase ${
                  errors.vehicleRegNo
                    ? 'border-[#cc1c14] focus:border-[#cc1c14] focus:ring-[#cc1c14]/20'
                    : 'border-[#d9d9d9] focus:border-[#0a6ed1] focus:ring-[#0a6ed1]/20'
                }`}
              />
            </FieldRow>

            {/* Pollution Certificate */}
            <FieldRow label="Pollution Certificate Applicable" required>
              <ToggleSwitch
                value={form.pollutionCertificateApplicable}
                onChange={(v) => updateField('pollutionCertificateApplicable', v)}
              />
            </FieldRow>

            {/* Safety Equipments */}
            <FieldRow label="Safety Equipments (Shoes, PPE, ARM Cover, Cap)" required>
              <ToggleSwitch
                value={form.safetyEquipments}
                onChange={(v) => updateField('safetyEquipments', v)}
              />
            </FieldRow>

            {/* Safety Guard for Material */}
            <FieldRow label="Safety Guard for Material" required>
              <ToggleSwitch
                value={form.safetyGuardForMaterial}
                onChange={(v) => updateField('safetyGuardForMaterial', v)}
              />
            </FieldRow>

            {/* Submit error banner */}
            {submitError && (
              <div className="mt-4 mx-auto max-w-md text-[13px] text-[#cc1c14] bg-[#fce8e6] border border-[#f5b3ae] rounded-lg px-3 py-2 flex items-center gap-2 anim-fade">
                <AlertCircle size={14} />
                {submitError}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e5e5] px-6 py-3 flex items-center justify-end gap-3 z-30 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        <button
          onClick={handleReset}
          disabled={submitting}
          className="px-4 h-9 text-[13px] font-semibold text-[#6a6d70] hover:text-[#32363a] hover:bg-[#f5f6f7] rounded-lg transition-all disabled:opacity-60"
        >
          Reset
        </button>
        <button
          onClick={goBack}
          disabled={submitting}
          className="px-4 h-9 text-[13px] font-semibold text-[#0a6ed1] border border-[#0a6ed1] bg-white rounded-lg hover:bg-[#ebf5ff] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center gap-2 px-5 h-9 text-[13px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Save size={15} />
          {submitting ? 'Submitting…' : 'Submit'}
        </button>
      </div>

      {/* ─────────── ASN Value-Help Dialog ─────────── */}
      {asnLookupOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 anim-overlay">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAsnLookupOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[680px] anim-modal flex flex-col" style={{ maxHeight: '80vh' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5]">
              <h4 className="text-[15px] font-bold text-[#32363a]">Select ASN</h4>
              <button onClick={() => setAsnLookupOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-[#6a6d70] hover:text-[#cc1c14] hover:bg-[#fce8e6] transition-all">
                <X size={17} />
              </button>
            </div>

            <div className="px-6 py-3 border-b border-[#e5e5e5]">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6a6d70]" />
                <input
                  type="text"
                  value={asnLookupSearch}
                  onChange={(e) => setAsnLookupSearch(e.target.value)}
                  placeholder="Search ASN, IBD, plant or invoice"
                  className="w-full h-10 pl-9 pr-3 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-[13px]">
                <thead className="sticky top-0 bg-gradient-to-b from-[#fafbfc] to-[#f5f6f7] border-b border-[#e5e5e5]">
                  <tr className="text-[#6a6d70]">
                    <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">ASN</th>
                    <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">IBD Number</th>
                    <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">Plant</th>
                    <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">Invoice No</th>
                    <th className="text-right font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="row-stagger">
                  {asnLookupResults.map((row) => (
                    <tr key={row.asnId}
                      onClick={() => handlePickAsn(row)}
                      className="border-b border-[#f0f0f0] hover:bg-[#ebf5ff] cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-[#0a6ed1]">{row.asnId}</td>
                      <td className="py-3 px-4 text-[#32363a]">{row.ibdNumber}</td>
                      <td className="py-3 px-4 text-[#32363a] font-medium">{row.plant}</td>
                      <td className="py-3 px-4 text-[#32363a]">{row.invoiceNumber}</td>
                      <td className="py-3 px-4 text-right font-semibold text-[#32363a]">{row.invoiceAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                  {asnLookupResults.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[#6a6d70]">
                        <Search size={32} className="mx-auto mb-2 opacity-40" />
                        <div className="text-[13px]">No ASNs found</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-3 border-t border-[#e5e5e5] flex items-center justify-end">
              <button
                onClick={() => setAsnLookupOpen(false)}
                className="px-4 h-9 text-[13px] font-semibold text-[#0a6ed1] hover:bg-[#ebf5ff] rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}