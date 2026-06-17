import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import PageLayout from '../../layouts/PageLayout.jsx'
import { createMovementApi, authConfig } from '../../services/CreateMovement.js'
import { useUser } from '../../context/UserContext.jsx'
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
  CheckCircle2,
  Plus,
  Trash2,
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════
// TRANSPORT MODE OPTIONS
// ═══════════════════════════════════════════════════════════════
const TRANSPORT_MODES = [
  { value: 'By Road',         label: 'By Road',         Icon: Truck     },
  { value: 'By Air',          label: 'By Air',          Icon: Plane     },
  { value: 'By Ship',         label: 'By Ship',         Icon: Ship      },
  { value: 'By Rail',         label: 'By Rail',         Icon: Train     },
  { value: 'By Courier',      label: 'By Courier',      Icon: Package   },
  { value: 'By Hand',         label: 'By Hand',         Icon: Hand      },
  { value: 'Tie-up Supplier', label: 'Tie-up Supplier', Icon: Handshake },
]

// ═══════════════════════════════════════════════════════════════
// INITIAL FORM STATE
// asnNums: array of { asnId, asnYear } — supports multiple ASNs
// ═══════════════════════════════════════════════════════════════
const INITIAL_FORM = {
  asnNums: [],                  // [{ asnId, asnYear, invoiceNumber, plant, invoiceAmount, currency }]
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

// ── Helper: map editData (tracking object from goodsMovementApi) → form ──
const trackingToForm = (t) => {
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
    asnNums: (t.asns || []).map((a) => ({
      asnId:         a.asnId,
      asnYear:       a.asnYear || '',
      invoiceNumber: a.invoiceNumber || '',
      plant:         a.plant || '',
      invoiceAmount: a.invoiceAmount || 0,
      currency:      a.currency || '',
    })),
    transportMode:  t.transportationMode || t.transportMode || 'By Road',
    ewayBillNo:     t.ewayBillNo   || '',
    ewayBillDate:   ewayBillDateVal,
    lrNum:          t.invoiceNum   || '',
    transporterName: t.transporter || '',
    driverName:     t.driverName   || '',
    contactNumber:  t.contact      || '',
    vehicleRegNo:   t.vehicleRegNo || '',
    finaltranspoterName: t.finalTransporterName || '',
    pollutionCertificateApplicable: t.pollutionCertificateApplicable === 'Yes' || t.pollutionCertificateApplicable === true,
    safetyEquipments: t.safetyEquipments === 'Yes' || t.safetyEquipments === true,
    safetyGuardForMaterial: t.safetyGuardForMaterial === 'Yes' || t.safetyGuardForMaterial === true,
  }
}

// ═══════════════════════════════════════════════════════════════
// REUSABLE: Field Row
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
// REUSABLE: Toggle Switch (Yes / No)
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
// SUCCESS POPUP
// ═══════════════════════════════════════════════════════════════
const SuccessPopup = ({ trackingId, onOk }) => (
  <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 anim-overlay">
    <div className="absolute inset-0 bg-black/40" />
    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[400px] p-8 flex flex-col items-center gap-4 anim-modal">
      <div className="w-16 h-16 rounded-full bg-[#e8f5e9] flex items-center justify-center">
        <CheckCircle2 size={36} className="text-[#107e3e]" strokeWidth={1.8} />
      </div>
      <h4 className="text-[17px] font-bold text-[#32363a] text-center">Movement Created Successfully</h4>
      <p className="text-[14px] text-[#6a6d70] text-center leading-relaxed">
        Movement has been generated for tracking ID
        <span className="font-semibold text-[#0a6ed1] block mt-1">{trackingId}</span>
      </p>
      <button
        onClick={onOk}
        className="mt-2 px-8 h-10 text-[14px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md"
      >
        OK
      </button>
    </div>
  </div>
)

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// Props:
//   editData   — tracking object to pre-fill (null = create mode)
//   onBack     — callback to return to previous page
//   onNavigateToTracking(trackingId) — called after successful create
//                to open GoodsMovement detail with the new tracking ID
// ═══════════════════════════════════════════════════════════════
export default function CreateMovement({ editData = null, onBack = null, onNavigateToTracking = null }) {
  const { loginId, loginType, loading: userLoading } = useUser()
  authConfig.loginId   = loginId
  authConfig.loginType = loginType
  const isEditMode = !!editData

  const navigate = (() => {
    try { return require('react-router-dom').useNavigate() } catch { return null }
  })()

  const goBack = () => {
    if (onBack) { onBack(); return }
    if (navigate) navigate(-1)
    else window.history.back()
  }

  const goToTracking = (trackingId) => {
    if (onNavigateToTracking) { onNavigateToTracking(trackingId); return }
    // Fallback: navigate with react-router state if available
    if (navigate) navigate(`/goods-movement?trackingId=${encodeURIComponent(trackingId)}`)
    else goBack()
  }

  // ── Form state ──────────────────────────────────────────────
  const [form, setForm]               = useState(() => editData ? trackingToForm(editData) : INITIAL_FORM)
  const [errors, setErrors]           = useState({})
  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState('')

  // ── Success popup ───────────────────────────────────────────
  const [successTrackingId, setSuccessTrackingId] = useState(null)

  // ── ASN value-help dialog ───────────────────────────────────
  const [asnLookupOpen, setAsnLookupOpen]       = useState(false)
  const [asnLookupSearch, setAsnLookupSearch]   = useState('')
  const [asnLookupResults, setAsnLookupResults] = useState([])
  const [asnLookupLoading, setAsnLookupLoading] = useState(false)
  const searchRef = useRef('')

  // Re-initialise form when editData changes
  useEffect(() => {
    if (editData) {
      setForm(trackingToForm(editData))
      setErrors({})
      setSubmitError('')
    }
  }, [editData?.id])

  // Load ASN lookup list
  useEffect(() => {
    if (userLoading) return
    if (!loginId || !loginType) return
    if (!asnLookupOpen) return
    let cancelled = false
    setAsnLookupLoading(true)
    createMovementApi.searchAsns({ search: asnLookupSearch })
      .then((data) => { if (!cancelled) { setAsnLookupResults(data); setAsnLookupLoading(false) } })
      .catch((err) => { console.error(err); if (!cancelled) setAsnLookupLoading(false) })
    return () => { cancelled = true }
  }, [userLoading, loginId, loginType, asnLookupOpen, asnLookupSearch])

  // Close dialog on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (asnLookupOpen) setAsnLookupOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [asnLookupOpen])

  const updateField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }))
  }

  // ── Validation ──────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.asnNums || form.asnNums.length === 0)
      e.asnNums = 'At least one ASN is required'
    if (!form.transportMode)
      e.transportMode = 'Transport Mode is required'
    if (!form.transporterName.trim())
      e.transporterName = 'Transporter Name is required'
    if (!form.driverName.trim())
      e.driverName = 'Driver Name is required'
    if (!form.contactNumber.trim())
      e.contactNumber = 'Contact Number is required'
    else if (!/^\d{7,15}$/.test(form.contactNumber.trim()))
      e.contactNumber = 'Enter a valid contact number (7–15 digits)'
    if (!form.vehicleRegNo.trim())
      e.vehicleRegNo = 'Vehicle Reg. No. is required'
    if (form.ewayBillNo && form.ewayBillNo.trim().length > 0 && form.ewayBillNo.trim().length !== 12)
      e.ewayBillNo = 'Eway Bill No. must be exactly 12 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitError('')
    if (!validate()) return
    setSubmitting(true)
    try {
      if (isEditMode) {
        await createMovementApi.updateMovement(editData.id, form)
        goBack()
      } else {
        const result = await createMovementApi.createMovement(form)
        // Show success popup with the new tracking ID
        setSuccessTrackingId(result.trackingId)
      }
    } catch (err) {
      console.error(err)
      setSubmitError(`Failed to ${isEditMode ? 'update' : 'create'} movement. Please try again.`)
    } finally {
      setSubmitting(false)
    }
  }

  // Called when user clicks OK on success popup
  const handleSuccessOk = () => {
    setSuccessTrackingId(null)
    goToTracking(successTrackingId)
  }

  const handleReset = () => {
    setForm(editData ? trackingToForm(editData) : INITIAL_FORM)
    setErrors({})
    setSubmitError('')
  }

  // ── ASN pick: fetch FixedBin, then add to asnNums list ──────
  const handlePickAsn = async (row) => {
    // Prevent duplicate
    if (form.asnNums.some((a) => a.asnId === row.asnId && a.asnYear === row.asnYear)) {
      setAsnLookupOpen(false)
      setAsnLookupSearch('')
      return
    }

    // Fire FixedBin call in background (per spec: happens after ASN selection)
    try {
      createMovementApi.getFixedBin(row.asnId, row.asnYear).catch((err) =>
        console.warn('FixedBin fetch failed (non-blocking):', err)
      )
    } catch { /* non-blocking */ }

    const newAsn = {
      asnId:         row.asnId,
      asnYear:       row.asnYear,
      invoiceNumber: row.invoiceNumber || '',
      plant:         row.plant         || '',
      invoiceAmount: row.invoiceAmount || 0,
      currency:      row.currency      || '',
    }

    setForm((f) => ({
      ...f,
      asnNums: [...f.asnNums, newAsn],
    }))
    if (errors.asnNums) setErrors((e) => ({ ...e, asnNums: null }))

    setAsnLookupOpen(false)
    setAsnLookupSearch('')
  }

  const handleRemoveAsn = (asnId, asnYear) => {
    setForm((f) => ({
      ...f,
      asnNums: f.asnNums.filter((a) => !(a.asnId === asnId && a.asnYear === asnYear)),
    }))
  }

  const clearEwayDate = () => updateField('ewayBillDate', '')

  const selectedTransport = useMemo(
    () => TRANSPORT_MODES.find((m) => m.value === form.transportMode) || TRANSPORT_MODES[0],
    [form.transportMode]
  )

  return (
    <PageLayout>
      <style>{`
        @keyframes fadeIn    { from { opacity: 0; transform: translateY(8px);  } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modalIn   { from { opacity: 0; transform: scale(0.94) translateY(-8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
        .anim-fade     { animation: fadeIn    0.35s ease-out both; }
        .anim-slide-up { animation: slideInUp 0.35s ease-out both; }
        .anim-modal    { animation: modalIn   0.22s ease-out both; }
        .anim-overlay  { animation: overlayIn 0.18s ease-out both; }
        .row-stagger > * { animation: fadeIn 0.4s ease-out both; }
        .row-stagger > *:nth-child(1)  { animation-delay: 0.04s; }
        .row-stagger > *:nth-child(2)  { animation-delay: 0.08s; }
        .row-stagger > *:nth-child(3)  { animation-delay: 0.12s; }
        .row-stagger > *:nth-child(4)  { animation-delay: 0.16s; }
        .row-stagger > *:nth-child(5)  { animation-delay: 0.20s; }
        .row-stagger > *:nth-child(6)  { animation-delay: 0.24s; }
        .row-stagger > *:nth-child(7)  { animation-delay: 0.28s; }
        .row-stagger > *:nth-child(8)  { animation-delay: 0.32s; }
        .row-stagger > *:nth-child(9)  { animation-delay: 0.36s; }
        .row-stagger > *:nth-child(10) { animation-delay: 0.40s; }
        .row-stagger > *:nth-child(11) { animation-delay: 0.44s; }
        .row-stagger > *:nth-child(12) { animation-delay: 0.48s; }
        .row-stagger > *:nth-child(13) { animation-delay: 0.52s; }
      `}</style>

      {/* Top context bar */}
      <div className="bg-white border-b border-[#e5e5e5] px-4 sm:px-6 lg:px-10 py-2 text-[13px] text-[#6a6d70] flex flex-wrap gap-x-6 gap-y-1">
        <span><span className="font-semibold text-[#32363a]">Supplier Name:</span> Kunstocom(India) Ltd</span>
        <span className="ml-auto"><span className="font-semibold text-[#32363a]">Supplier Location:</span> NEEMRANA(alwar)</span>
      </div>

      {/* Page header */}
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

            {/* ── ASN Number(s) — multi-select via dialog ─────── */}
            <FieldRow label="ASN Num." required error={errors.asnNums}>
              <div className="space-y-2">
                {/* Selected ASN chips */}
                {form.asnNums.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2 bg-[#f5f6f7] rounded-lg border border-[#e5e5e5]">
                    {form.asnNums.map((a) => (
                      <span
                        key={`${a.asnId}-${a.asnYear}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#ebf5ff] border border-[#c0daf7] rounded-md text-[12px] font-semibold text-[#0a6ed1]"
                      >
                        {a.asnId}
                        {a.asnYear && <span className="text-[#6a6d70] font-normal">/{a.asnYear}</span>}
                        <button
                          type="button"
                          onClick={() => handleRemoveAsn(a.asnId, a.asnYear)}
                          className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-[#cc1c14] hover:text-white text-[#6a6d70] transition-all"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add ASN button */}
                <button
                  type="button"
                  onClick={() => setAsnLookupOpen(true)}
                  className={`flex items-center gap-2 h-10 px-3 w-full text-[14px] border rounded-lg transition-all ${
                    errors.asnNums
                      ? 'border-[#cc1c14] text-[#cc1c14] bg-[#fff9f9] hover:bg-[#fce8e6]'
                      : 'border-[#d9d9d9] text-[#0a6ed1] bg-white hover:border-[#0a6ed1] hover:bg-[#f0f7ff]'
                  }`}
                >
                  <Plus size={15} />
                  <span>{form.asnNums.length > 0 ? 'Add another ASN' : 'Pick ASN'}</span>
                  <ExternalLink size={13} className="ml-auto opacity-60" />
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
                  {TRANSPORT_MODES.map((m) => (
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

            {/* Eway Bill No. — must be 12 chars */}
            <FieldRow label="Eway Bill No." error={errors.ewayBillNo}>
              <input
                type="text"
                value={form.ewayBillNo}
                onChange={(e) => updateField('ewayBillNo', e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="12-digit Eway Bill Number"
                maxLength={12}
                className={`w-full h-10 px-3 text-[14px] border rounded-lg bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.ewayBillNo
                    ? 'border-[#cc1c14] focus:border-[#cc1c14] focus:ring-[#cc1c14]/20'
                    : 'border-[#d9d9d9] focus:border-[#0a6ed1] focus:ring-[#0a6ed1]/20'
                }`}
              />
              {form.ewayBillNo.length > 0 && (
                <div className={`mt-1 text-[11px] ${form.ewayBillNo.length === 12 ? 'text-[#107e3e]' : 'text-[#6a6d70]'}`}>
                  {form.ewayBillNo.length}/12 characters
                </div>
              )}
            </FieldRow>

            {/* LR No. */}
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

            {/* Final Transporter Name */}
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

      {/* ─────────────── ASN Value-Help Dialog ─────────────── */}
      {asnLookupOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 anim-overlay">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAsnLookupOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[720px] anim-modal flex flex-col" style={{ maxHeight: '80vh' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5]">
              <h4 className="text-[15px] font-bold text-[#32363a]">Select ASN</h4>
              <button
                onClick={() => setAsnLookupOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-[#6a6d70] hover:text-[#cc1c14] hover:bg-[#fce8e6] transition-all"
              >
                <X size={17} />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b border-[#e5e5e5]">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6a6d70]" />
                <input
                  type="text"
                  value={asnLookupSearch}
                  onChange={(e) => setAsnLookupSearch(e.target.value)}
                  placeholder="Search by ASN, invoice number or plant"
                  autoFocus
                  className="w-full h-10 pl-9 pr-3 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all"
                />
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto">
              {asnLookupLoading ? (
                <div className="py-12 flex flex-col items-center gap-2 text-[#6a6d70]">
                  <div className="w-6 h-6 border-2 border-[#0a6ed1] border-t-transparent rounded-full animate-spin" />
                  <div className="text-[13px]">Loading ASNs…</div>
                </div>
              ) : (
                <table className="w-full text-[13px]">
                  <thead className="sticky top-0 bg-gradient-to-b from-[#fafbfc] to-[#f5f6f7] border-b border-[#e5e5e5]">
                    <tr className="text-[#6a6d70]">
                      <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">ASN</th>
                      <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">Year</th>
                      <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">Plant</th>
                      <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">Invoice No</th>
                      <th className="text-right font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="row-stagger">
                    {asnLookupResults.map((row) => {
                      const alreadyAdded = form.asnNums.some(
                        (a) => a.asnId === row.asnId && a.asnYear === row.asnYear
                      )
                      return (
                        <tr
                          key={`${row.asnId}-${row.asnYear}`}
                          onClick={() => !alreadyAdded && handlePickAsn(row)}
                          className={`border-b border-[#f0f0f0] transition-colors ${
                            alreadyAdded
                              ? 'opacity-40 cursor-not-allowed bg-[#f5f6f7]'
                              : 'hover:bg-[#ebf5ff] cursor-pointer'
                          }`}
                        >
                          <td className="py-3 px-4 font-semibold text-[#0a6ed1]">{row.asnId}</td>
                          <td className="py-3 px-4 text-[#6a6d70]">{row.asnYear}</td>
                          <td className="py-3 px-4 text-[#32363a] font-medium">{row.plant}</td>
                          <td className="py-3 px-4 text-[#32363a]">{row.invoiceNumber}</td>
                          <td className="py-3 px-4 text-right font-semibold text-[#32363a]">
                            {row.currency && <span className="text-[#6a6d70] font-normal mr-1">{row.currency}</span>}
                            {Number(row.invoiceAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )
                    })}
                    {asnLookupResults.length === 0 && !asnLookupLoading && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-[#6a6d70]">
                          <Search size={32} className="mx-auto mb-2 opacity-40" />
                          <div className="text-[13px]">No ASNs found</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-[#e5e5e5] flex items-center justify-between">
              <div className="text-[12px] text-[#6a6d70]">
                {asnLookupResults.length > 0 && `${asnLookupResults.length} result${asnLookupResults.length !== 1 ? 's' : ''}`}
              </div>
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

      {/* ─────────────── Success Popup ─────────────── */}
      {successTrackingId && (
        <SuccessPopup
          trackingId={successTrackingId}
          onOk={handleSuccessOk}
        />
      )}
    </PageLayout>
  )
}