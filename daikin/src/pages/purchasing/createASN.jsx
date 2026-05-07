import { useState, useRef, useEffect } from 'react'
import PageLayout from '../../layouts/PageLayout.jsx'

// ═══════════════════════════════════════════════════════════════
// DUMMY DATA
// ═══════════════════════════════════════════════════════════════
const DEFAULT_AGREEMENT = {
    id: '5501000407',
    plant: 'SR01',
    vendor: 'Kunstocom(India) Ltd',
}

const DEFAULT_ITEMS = [
    {
        itemNo: '10',
        schLine: '2',
        materialName: 'xcvbnm',
        materialNumber: '234010000451',
        storageLocation: 'RM01',
        shipmentDate: 'Apr 24, 2026',
        materialExpiry: '',
        totalQty: '100.00',
        totalUnit: 'NO',
        confQty: '100.00',
        confUnit: 'NO',
        deliveredQty: '1.00',
        deliveredUnit: 'NO',
        asnCreated: '1.00',
        avlAsnQty: '99.00',
        netPrice: '10.00',
        supplierNetPrice: '10.00',
        taxMismatch: false,
        packingMaterialType: '',
        packingMaterialQty: '1',
        spq: '100.000',
        pdirNo: '',
    },
    {
        itemNo: '20',
        schLine: '1',
        materialName: 'CFF End plate Assy',
        materialNumber: '234010000452',
        storageLocation: 'RM01',
        shipmentDate: 'Apr 22, 2026',
        materialExpiry: '',
        totalQty: '100.00',
        totalUnit: 'KG',
        confQty: '100.00',
        confUnit: 'KG',
        deliveredQty: '0.00',
        deliveredUnit: 'KG',
        asnCreated: '0.00',
        avlAsnQty: '100.00',
        netPrice: '70.23',
        supplierNetPrice: '70.23',
        taxMismatch: false,
        packingMaterialType: '',
        packingMaterialQty: '1',
        spq: '1000.000',
        pdirNo: '',
    },
]

// ═══════════════════════════════════════════════════════════════
// API STRUCTURE
// ═══════════════════════════════════════════════════════════════
const API_BASE_URL = '/api/v1'
const USE_MOCK = true
const ALLOWED_EXTENSIONS = ['pdf', 'xls', 'xlsx']
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]
const isAllowedFile = (file) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    return ALLOWED_EXTENSIONS.includes(ext) || ALLOWED_MIME_TYPES.includes(file.type)
}

const createAsnApi = {
    async getEligibleItems({ agreementId, fromDate, toDate, materials, storage } = {}) {
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 100))
            return DEFAULT_ITEMS
        }
        const params = new URLSearchParams()
        if (fromDate) params.set('fromDate', fromDate)
        if (toDate) params.set('toDate', toDate)
        if (materials) params.set('materials', materials)
        if (storage) params.set('storage', storage)
        const res = await fetch(`${API_BASE_URL}/asn/eligible-items/${agreementId}?${params}`)
        if (!res.ok) throw new Error('Failed to load items')
        return res.json()
    },

    async submitAsn(payload) {
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 200))
            return { asnId: `ASN-${Date.now()}`, ...payload }
        }
        const res = await fetch(`${API_BASE_URL}/asn`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to create ASN')
        return res.json()
    },

    async uploadAttachment(asnDraftId, file) {
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 100))
            return { id: `att-${Date.now()}`, name: file.name, size: file.size }
        }
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch(`${API_BASE_URL}/asn/${asnDraftId}/attachments`, { method: 'POST', body: fd })
        if (!res.ok) throw new Error('Failed to upload')
        return res.json()
    },
}

// ═══════════════════════════════════════════════════════════════
// MOBILE HOOK
// ═══════════════════════════════════════════════════════════════
function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < breakpoint)
        window.addEventListener('resize', handler)
        return () => window.removeEventListener('resize', handler)
    }, [breakpoint])
    return isMobile
}

// ═══════════════════════════════════════════════════════════════
// MOBILE ITEM CARD  (same colors/fonts as desktop)
// ═══════════════════════════════════════════════════════════════
function MobileItemCard({ item, isSelected, onToggle, onUpdate }) {
    const [expanded, setExpanded] = useState(false)

    return (
        <div className={`rounded-xl border mb-3 overflow-hidden transition-colors ${isSelected ? 'bg-[#ebf5ff] border-[#0a6ed1]' : 'bg-white border-[#e5e5e5]'}`}>
            {/* Top row */}
            <div className="flex items-center gap-3 px-4 py-3">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onToggle}
                    className="accent-[#0a6ed1] w-4 h-4 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                    <div className="text-[#0a6ed1] font-semibold text-[13px]">{item.materialNumber}</div>
                    <div className="text-[#6a6d70] text-[12px] truncate">{item.materialName}</div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="px-2 py-0.5 bg-[#ebf5ff] text-[#0a6ed1] rounded-full text-[11px] font-bold">Item {item.itemNo}</span>
                    <span className="px-2 py-0.5 bg-[#f0f4f8] text-[#32363a] rounded text-[11px] font-semibold">{item.storageLocation}</span>
                </div>
                <button
                    onClick={() => setExpanded(e => !e)}
                    className="text-[#6a6d70] flex-shrink-0 p-1"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </button>
            </div>

            {/* Quick stats */}
            <div className="flex border-t border-[#f0f0f0] text-center">
                {[
                    { label: 'Avl. ASN', value: `${item.avlAsnQty} ${item.totalUnit}` },
                    { label: 'Net Price', value: `₹${item.netPrice}` },
                    { label: 'Shipment', value: item.shipmentDate },
                ].map((s, i) => (
                    <div key={i} className={`flex-1 py-2 ${i < 2 ? 'border-r border-[#f0f0f0]' : ''}`}>
                        <div className="text-[10px] text-[#9ca3af] font-semibold uppercase tracking-wide">{s.label}</div>
                        <div className="text-[12px] text-[#32363a] font-bold mt-0.5">{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Expanded editable fields */}
            {expanded && (
                <div className="border-t border-[#f0f0f0] bg-[#fafbfc] px-4 py-4">
                    {/* Read-only grid */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {[
                            { label: 'Sch. Line', value: item.schLine },
                            { label: 'Total Qty', value: `${item.totalQty} ${item.totalUnit}` },
                            { label: 'Conf. Qty', value: `${item.confQty} ${item.confUnit}` },
                            { label: 'Delivered', value: `${item.deliveredQty} ${item.deliveredUnit}` },
                            { label: 'ASN Created', value: item.asnCreated },
                            { label: 'SPQ', value: item.spq },
                        ].map((d, i) => (
                            <div key={i} className="bg-white rounded-lg px-3 py-2 border border-[#e5e5e5]">
                                <div className="text-[10px] text-[#9ca3af] font-semibold uppercase tracking-wide">{d.label}</div>
                                <div className="text-[13px] text-[#32363a] font-semibold mt-0.5">{d.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Editable: Avl ASN Qty */}
                    <div className="mb-3">
                        <label className="block text-[12px] font-semibold text-[#374151] mb-1">Avl. ASN Qty</label>
                        <input
                            type="text"
                            value={item.avlAsnQty}
                            onChange={e => onUpdate('avlAsnQty', e.target.value)}
                            className="w-full h-10 rounded-lg border border-[#d9d9d9] bg-white px-3 text-[14px] outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all"
                        />
                    </div>

                    {/* Editable: Supplier Net Price */}
                    <div className="mb-3">
                        <label className="block text-[12px] font-semibold text-[#374151] mb-1">Supplier Net Price</label>
                        <input
                            type="text"
                            value={item.supplierNetPrice}
                            onChange={e => onUpdate('supplierNetPrice', e.target.value)}
                            className="w-full h-10 rounded-lg border border-[#d9d9d9] bg-white px-3 text-[14px] outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all"
                        />
                    </div>

                    {/* Editable: Material Expiry */}
                    <div className="mb-3">
                        <label className="block text-[12px] font-semibold text-[#374151] mb-1">Material Expiry</label>
                        <input
                            type="date"
                            value={item.materialExpiry}
                            onChange={e => onUpdate('materialExpiry', e.target.value)}
                            className="w-full h-10 rounded-lg border border-[#d9d9d9] bg-white px-3 text-[14px] outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all"
                        />
                    </div>

                    {/* Packing row */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="block text-[12px] font-semibold text-[#374151] mb-1">Packing Type</label>
                            <select
                                value={item.packingMaterialType}
                                onChange={e => onUpdate('packingMaterialType', e.target.value)}
                                className="w-full h-10 rounded-lg border border-[#d9d9d9] bg-white px-2 text-[13px] outline-none focus:border-[#0a6ed1]"
                            >
                                <option value="">Select</option>
                                <option value="Trolley">Trolley</option>
                                <option value="Pallet">Pallet</option>
                                <option value="Carton">Carton</option>
                                <option value="Crate">Crate</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-[#374151] mb-1">Packing Qty</label>
                            <input
                                type="text"
                                value={item.packingMaterialQty}
                                onChange={e => onUpdate('packingMaterialQty', e.target.value)}
                                className="w-full h-10 rounded-lg border border-[#d9d9d9] bg-white px-3 text-[14px] outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 text-center transition-all"
                            />
                        </div>
                    </div>

                    {/* PDIR */}
                    <div className="mb-3">
                        <label className="block text-[12px] font-semibold text-[#374151] mb-1">PDIR No.</label>
                        <select
                            value={item.pdirNo}
                            onChange={e => onUpdate('pdirNo', e.target.value)}
                            className="w-full h-10 rounded-lg border border-[#d9d9d9] bg-white px-2 text-[13px] outline-none focus:border-[#0a6ed1]"
                        >
                            <option value="">Select</option>
                            <option value="PDIR-001">PDIR-001</option>
                            <option value="PDIR-002">PDIR-002</option>
                        </select>
                    </div>

                    {/* Tax Mismatch */}
                    <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2.5 border border-[#e5e5e5]">
                        <span className="text-[13px] font-semibold text-[#374151]">Tax Mismatch</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[12px] font-bold text-[#6a6d70]">{item.taxMismatch ? 'YES' : 'NO'}</span>
                            <button
                                onClick={() => onUpdate('taxMismatch', !item.taxMismatch)}
                                className={`relative w-11 h-6 rounded-full transition-colors ${item.taxMismatch ? 'bg-[#107e3e]' : 'bg-[#d9d9d9]'}`}
                            >
                                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${item.taxMismatch ? 'translate-x-5' : 'translate-x-0.5'}`}></span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function CreateASN({ agreement = DEFAULT_AGREEMENT, onClose }) {
    const isMobile = useIsMobile()
    const [activeTab, setActiveTab] = useState('info') // 'info' | 'attachments'

    // Invoice form
    const [invoiceNumber, setInvoiceNumber] = useState('')
    const [invoiceDate, setInvoiceDate] = useState('')
    const [invoiceAmount, setInvoiceAmount] = useState('')
    const [invoiceValueVendor, setInvoiceValueVendor] = useState('')
    const [totalPacking, setTotalPacking] = useState('')

    // Filters above items table
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [materialSearch, setMaterialSearch] = useState('')
    const [storageSearch, setStorageSearch] = useState('')

    // Items
    const [items, setItems] = useState(DEFAULT_ITEMS)
    const [selectedItemNos, setSelectedItemNos] = useState([])

    // Attachments
    const [attachments, setAttachments] = useState([])
    const fileInputRef = useRef(null)

    const allSelected = items.length > 0 && selectedItemNos.length === items.length
    const someSelected = selectedItemNos.length > 0 && !allSelected

    const toggleAll = () => {
        if (allSelected) setSelectedItemNos([])
        else setSelectedItemNos(items.map(i => i.itemNo))
    }

    const toggleOne = (itemNo) => {
        if (selectedItemNos.includes(itemNo)) setSelectedItemNos(selectedItemNos.filter(n => n !== itemNo))
        else setSelectedItemNos([...selectedItemNos, itemNo])
    }

    const updateItem = (itemNo, field, value) => {
        setItems(items.map(i => i.itemNo === itemNo ? { ...i, [field]: value } : i))
    }

    const handleGo = async () => {
        try {
            const data = await createAsnApi.getEligibleItems({
                agreementId: agreement.id, fromDate, toDate, materials: materialSearch, storage: storageSearch,
            })
            setItems(data)
        } catch (err) { console.error(err) }
    }

    const handleClear = () => {
        setFromDate('')
        setToDate('')
        setMaterialSearch('')
        setStorageSearch('')
    }

    const handleCreate = async () => {
        if (selectedItemNos.length === 0) {
            alert('Select at least one item to create ASN')
            return
        }
        if (!invoiceNumber || !invoiceAmount) {
            alert('Invoice Number and Invoice Amount are required')
            return
        }
        try {
            const payload = {
                agreementId: agreement.id,
                invoice: { number: invoiceNumber, date: invoiceDate, amount: invoiceAmount, valueVendor: invoiceValueVendor, totalPacking },
                items: items.filter(i => selectedItemNos.includes(i.itemNo)),
                attachmentIds: attachments.map(a => a.id),
            }
            const result = await createAsnApi.submitAsn(payload)
            alert(`ASN created: ${result.asnId}`)
        } catch (err) { console.error(err); alert('Failed to create ASN') }
    }

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files)
        for (const file of files) {
            if (!isAllowedFile(file)) {
                alert(`"${file.name}" is not allowed. Only PDF and Excel files (.pdf, .xls, .xlsx) are accepted.`)
                continue
            }
            try {
                const att = await createAsnApi.uploadAttachment('draft', file)
                setAttachments(prev => [...prev, att])
            } catch (err) { console.error(err) }
        }
        e.target.value = ''
    }

    const removeAttachment = (id) => setAttachments(attachments.filter(a => a.id !== id))

    // Auto-calc invoice value (vendor) = sum of (avlAsnQty * supplierNetPrice) for selected
    const calcInvoiceValue = () => {
        return items
            .filter(i => selectedItemNos.includes(i.itemNo))
            .reduce((sum, i) => sum + (parseFloat(i.avlAsnQty || 0) * parseFloat(i.supplierNetPrice || 0)), 0)
            .toFixed(2)
    }

    return (
        <PageLayout>
            <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .anim-fade { animation: fadeIn 0.35s ease-out both; }
        .anim-slide-up { animation: slideUp 0.4s ease-out both; }
      `}</style>

            <div className="bg-[#f5f6f7] min-h-[calc(100vh-104px)] anim-fade">
                {/* ─── HEADER STRIP ─── */}
                <div className="bg-white border-b border-[#e5e5e5] px-8 py-3 flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-1.5 text-[14px] text-[#0a6ed1] hover:underline hover:-translate-x-0.5 transition-transform"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                        Back
                    </button>
                    <h1 className="text-[18px] font-bold text-[#32363a] tracking-tight">Create ASN</h1>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-5 h-10 text-[14px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        Create
                    </button>
                </div>

                {/* ─── AGREEMENT INFO ─── */}
                <div className="bg-white border-b border-[#e5e5e5] px-8 py-5 anim-slide-up">
                    <div className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">Schedule Agreement</div>
                    <h2 className="text-[24px] font-bold text-[#0a6ed1] tracking-tight">{agreement.id}</h2>
                    <div className="text-[14px] text-[#6a6d70] mt-1">Plant: ({agreement.plant})</div>
                </div>

                {/* ─── TABS ─── */}
                <div className="bg-white px-8 pt-5 border-b border-[#e5e5e5]">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`flex flex-col items-center pb-3 border-b-2 transition-colors ${activeTab === 'info' ? 'border-[#0a6ed1]' : 'border-transparent'}`}
                        >
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-1.5 transition-all ${activeTab === 'info' ? 'bg-[#0a6ed1] shadow-md' : 'bg-white border-2 border-[#0a6ed1]'}`}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'info' ? 'white' : '#0a6ed1'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 16v-4M12 8h.01" />
                                </svg>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('attachments')}
                            className={`flex flex-col items-center pb-3 border-b-2 transition-colors ${activeTab === 'attachments' ? 'border-[#0a6ed1]' : 'border-transparent'}`}
                        >
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-1.5 transition-all ${activeTab === 'attachments' ? 'bg-[#0a6ed1] shadow-md' : 'bg-white border-2 border-[#0a6ed1]'}`}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'attachments' ? 'white' : '#0a6ed1'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.49" />
                                </svg>
                            </div>
                        </button>
                    </div>
                </div>

                {/* ─── TAB CONTENT ─── */}
                {activeTab === 'info' ? (
                    <div className="anim-fade">
                        {/* Invoice + Materials */}
                        <div className="px-8 py-6 grid grid-cols-12 gap-6">
                            {/* Invoice form */}
                            <div className="col-span-12 xl:col-span-4">
                                <div className="bg-white border border-[#e5e5e5] rounded-xl p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-5">
                                        <div>
                                            <h3 className="text-[18px] font-bold text-[#32363a]">Invoice Details</h3>
                                            <p className="text-[13px] text-[#6a6d70] mt-0.5">Enter invoice information</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-lg bg-[#0a6ed1]/10 flex items-center justify-center">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a6ed1" strokeWidth="2">
                                                <path d="M4 4h16v16H4z" />
                                                <path d="M8 9h8M8 13h5" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Invoice Number <span className="text-[#cc1c14]">*</span></label>
                                            <input
                                                type="text"
                                                value={invoiceNumber}
                                                onChange={e => setInvoiceNumber(e.target.value)}
                                                placeholder="Enter invoice number"
                                                className="w-full h-10 rounded-lg border border-[#d9d9d9] bg-white px-3 text-[14px] outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Invoice Date</label>
                                            <input
                                                type="date"
                                                value={invoiceDate}
                                                onChange={e => setInvoiceDate(e.target.value)}
                                                className="w-full h-10 rounded-lg border border-[#d9d9d9] bg-white px-3 text-[14px] outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Invoice Amount <span className="text-[#cc1c14]">*</span></label>
                                            <input
                                                type="text"
                                                value={invoiceAmount}
                                                onChange={e => setInvoiceAmount(e.target.value)}
                                                placeholder="₹ 0.00"
                                                className="w-full h-10 rounded-lg border border-[#d9d9d9] bg-white px-3 text-[14px] outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Invoice Value (Vendor)</label>
                                            <div className="h-10 rounded-lg border border-dashed border-[#cfd8e3] bg-[#f8fafc] flex items-center px-3 text-[#6a6d70] text-[13px] italic">
                                                Auto-calculated: ₹ {calcInvoiceValue()}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Total Packing</label>
                                            <input
                                                type="text"
                                                value={totalPacking}
                                                onChange={e => setTotalPacking(e.target.value)}
                                                placeholder="0"
                                                className="w-full h-10 rounded-lg border border-[#d9d9d9] bg-white px-3 text-[14px] outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Selected materials summary */}
                            <div className="col-span-12 xl:col-span-8">
                                <div className="bg-white border border-[#e5e5e5] rounded-xl shadow-sm overflow-hidden h-full">
                                    <div className="px-6 py-4 border-b border-[#e5e5e5] flex items-center justify-between">
                                        <div>
                                            <h3 className="text-[18px] font-bold text-[#32363a]">Selected Materials</h3>
                                            <p className="text-[13px] text-[#6a6d70] mt-0.5">{selectedItemNos.length} of {items.length} items selected</p>
                                        </div>
                                        <span className="px-3 py-1 bg-[#ebf5ff] text-[#0a6ed1] rounded-full text-[12px] font-semibold">
                                            {selectedItemNos.length} selected
                                        </span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-[13px] min-w-[700px]">
                                            <thead>
                                                <tr className="bg-[#fafbfc] border-b border-[#e5e5e5] text-[#6a6d70]">
                                                    <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">Material</th>
                                                    <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">Description</th>
                                                    <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">Net Price</th>
                                                    <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">Qty</th>
                                                    <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">SPQ</th>
                                                    <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">EDI Tags</th>
                                                    <th className="text-left font-semibold py-3 px-4 text-[12px] uppercase tracking-wider">Value</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedItemNos.length === 0 && (
                                                    <tr>
                                                        <td colSpan={7} className="py-12 text-center text-[#6a6d70] text-[14px]">
                                                            No materials selected. Pick items from the table below.
                                                        </td>
                                                    </tr>
                                                )}
                                                {items.filter(i => selectedItemNos.includes(i.itemNo)).map(item => (
                                                    <tr key={item.itemNo} className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc]">
                                                        <td className="py-3 px-4 text-[#0a6ed1] font-semibold">{item.materialNumber}</td>
                                                        <td className="py-3 px-4 text-[#32363a]">{item.materialName}</td>
                                                        <td className="py-3 px-4 text-[#32363a]">{item.netPrice}</td>
                                                        <td className="py-3 px-4 text-[#32363a]">{item.avlAsnQty} {item.totalUnit}</td>
                                                        <td className="py-3 px-4 text-[#32363a]">{item.spq}</td>
                                                        <td className="py-3 px-4 text-[#32363a]">0</td>
                                                        <td className="py-3 px-4 text-[#32363a] font-semibold">
                                                            {(parseFloat(item.avlAsnQty || 0) * parseFloat(item.supplierNetPrice || 0)).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filter row — stacks vertically on mobile */}
                        <div className="px-4 md:px-8 py-5 bg-white border-t border-[#e5e5e5] grid grid-cols-2 md:grid-cols-12 gap-4 items-end">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-[12px] text-[#6a6d70] mb-1.5 font-semibold">Shipment From Date</label>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={e => setFromDate(e.target.value)}
                                    max={toDate || undefined}
                                    className="w-full h-10 pl-3 pr-2 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all"
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-[12px] text-[#6a6d70] mb-1.5 font-semibold">To Date</label>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={e => setToDate(e.target.value)}
                                    min={fromDate || undefined}
                                    className="w-full h-10 pl-3 pr-2 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all"
                                />
                            </div>
                            <div className="col-span-1 md:col-span-1 flex gap-2">
                                <button
                                    onClick={handleGo}
                                    className="h-10 px-4 text-[14px] font-semibold text-white bg-[#0a6ed1] rounded-lg hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm w-full"
                                >
                                    Go
                                </button>
                            </div>
                            <div className="col-span-1 md:col-span-1">
                                <button
                                    onClick={handleClear}
                                    className="h-10 px-4 text-[14px] font-semibold text-[#cc1c14] bg-[#fce8e6] border border-[#fce8e6] rounded-lg hover:bg-[#fad6d3] transition-all w-full"
                                >
                                    Clear
                                </button>
                            </div>
                            <div className="col-span-2 md:col-span-3">
                                <label className="block text-[12px] text-[#6a6d70] mb-1.5 font-semibold">Enter Materials</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={materialSearch}
                                        onChange={e => setMaterialSearch(e.target.value)}
                                        placeholder="Search materials"
                                        className="w-full h-10 pl-3 pr-10 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all"
                                    />
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-3 top-3 text-[#6a6d70]">
                                        <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
                                    </svg>
                                </div>
                            </div>
                            <div className="col-span-2 md:col-span-3">
                                <label className="block text-[12px] text-[#6a6d70] mb-1.5 font-semibold">Enter Storage Location (comma-separated)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={storageSearch}
                                        onChange={e => setStorageSearch(e.target.value)}
                                        placeholder="e.g. RM01, RM02"
                                        className="w-full h-10 pl-3 pr-10 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all"
                                    />
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-3 top-3 text-[#6a6d70]">
                                        <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Items — desktop table OR mobile cards */}
                        <div className="px-4 md:px-8 pb-8 bg-white">
                            {isMobile ? (
                                /* ── MOBILE CARD LIST ── */
                                <div className="pt-2">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[14px] font-bold text-[#32363a]">Items ({items.length})</span>
                                        <label className="flex items-center gap-2 text-[13px] font-semibold text-[#0a6ed1] cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                ref={el => { if (el) el.indeterminate = someSelected }}
                                                onChange={toggleAll}
                                                className="accent-[#0a6ed1] w-4 h-4"
                                            />
                                            Select All
                                        </label>
                                    </div>
                                    {items.length === 0 && (
                                        <div className="py-12 text-center text-[#6a6d70] text-[14px]">No items available</div>
                                    )}
                                    {items.map(item => (
                                        <MobileItemCard
                                            key={item.itemNo}
                                            item={item}
                                            isSelected={selectedItemNos.includes(item.itemNo)}
                                            onToggle={() => toggleOne(item.itemNo)}
                                            onUpdate={(field, val) => updateItem(item.itemNo, field, val)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                /* ── DESKTOP TABLE ── */
                                <div className="overflow-x-auto rounded-xl border border-[#e5e5e5] shadow-sm">
                                    <table className="w-full text-[13px] min-w-[2200px]">
                                        <thead>
                                            <tr className="bg-gradient-to-b from-[#fafbfc] to-[#f5f6f7] border-b border-[#e5e5e5] text-[#6a6d70]">
                                                <th className="py-3 px-3 w-10">
                                                    <input
                                                        type="checkbox"
                                                        checked={allSelected}
                                                        ref={el => { if (el) el.indeterminate = someSelected }}
                                                        onChange={toggleAll}
                                                        className="accent-[#0a6ed1] w-4 h-4"
                                                    />
                                                </th>
                                                {[
                                                    'Item', 'Sch. Line', 'Material', 'Storage', 'Shipment Date', 'Material Expiry', 'Total Qty', 'Conf. Qty', 'Delivered Qty', 'ASN Created', 'Avl. ASN Qty', 'Net Price', 'Supplier Net Price', 'Tax Mismatch', 'Packing Material Type', 'Packing Material Qty', 'SPQ', 'PDIR No.',
                                                ].map(h => (
                                                    <th key={h} className="text-left font-semibold py-3 px-3 text-[12px] uppercase tracking-wider whitespace-nowrap">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.length === 0 && (
                                                <tr><td colSpan={19} className="py-12 text-center text-[#6a6d70] text-[14px]">No items available</td></tr>
                                            )}
                                            {items.map(item => {
                                                const isSelected = selectedItemNos.includes(item.itemNo)
                                                return (
                                                    <tr key={item.itemNo} className={`border-b border-[#f0f0f0] last:border-b-0 transition-colors ${isSelected ? 'bg-[#ebf5ff]' : 'hover:bg-[#fafbfc]'}`}>
                                                        <td className="py-3 px-3">
                                                            <input type="checkbox" checked={isSelected} onChange={() => toggleOne(item.itemNo)} className="accent-[#0a6ed1] w-4 h-4" />
                                                        </td>
                                                        <td className="py-3 px-3 text-[#32363a] font-semibold">{item.itemNo}</td>
                                                        <td className="py-3 px-3">
                                                            <span className="inline-flex items-center justify-center w-7 h-7 bg-[#ebf5ff] text-[#0a6ed1] rounded-full text-[12px] font-bold">{item.schLine}</span>
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <div className="text-[#0a6ed1] font-semibold">{item.materialNumber}</div>
                                                            <div className="text-[#6a6d70] text-[12px]">{item.materialName}</div>
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <span className="px-2 py-0.5 bg-[#f0f4f8] text-[#32363a] rounded text-[12px] font-semibold">{item.storageLocation}</span>
                                                        </td>
                                                        <td className="py-3 px-3 text-[#32363a]">{item.shipmentDate}</td>
                                                        <td className="py-3 px-3">
                                                            <input
                                                                type="date"
                                                                value={item.materialExpiry}
                                                                onChange={e => updateItem(item.itemNo, 'materialExpiry', e.target.value)}
                                                                className="w-32 h-8 px-2 text-[12px] border border-[#d9d9d9] rounded bg-white focus:outline-none focus:border-[#0a6ed1]"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-3 text-[#0a6ed1] font-semibold">{item.totalQty} {item.totalUnit}</td>
                                                        <td className="py-3 px-3 text-[#32363a]">{item.confQty} {item.confUnit}</td>
                                                        <td className="py-3 px-3 text-[#32363a]">{item.deliveredQty} {item.deliveredUnit}</td>
                                                        <td className="py-3 px-3 text-[#32363a]">{item.asnCreated}</td>
                                                        <td className="py-3 px-3">
                                                            <input
                                                                type="text"
                                                                value={item.avlAsnQty}
                                                                onChange={e => updateItem(item.itemNo, 'avlAsnQty', e.target.value)}
                                                                className="w-20 h-8 px-2 text-[13px] border border-[#d9d9d9] rounded bg-white focus:outline-none focus:border-[#0a6ed1] font-semibold text-[#32363a]"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-3 text-[#32363a]">{item.netPrice}</td>
                                                        <td className="py-3 px-3">
                                                            <input
                                                                type="text"
                                                                value={item.supplierNetPrice}
                                                                onChange={e => updateItem(item.itemNo, 'supplierNetPrice', e.target.value)}
                                                                className="w-20 h-8 px-2 text-[13px] border border-[#d9d9d9] rounded bg-white focus:outline-none focus:border-[#0a6ed1] text-[#32363a]"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <button
                                                                onClick={() => updateItem(item.itemNo, 'taxMismatch', !item.taxMismatch)}
                                                                className={`relative w-11 h-6 rounded-full transition-colors ${item.taxMismatch ? 'bg-[#107e3e]' : 'bg-[#d9d9d9]'}`}
                                                            >
                                                                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${item.taxMismatch ? 'translate-x-5' : 'translate-x-0.5'}`}></span>
                                                            </button>
                                                            <span className="ml-2 text-[12px] font-semibold text-[#6a6d70]">{item.taxMismatch ? 'YES' : 'NO'}</span>
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <select
                                                                value={item.packingMaterialType}
                                                                onChange={e => updateItem(item.itemNo, 'packingMaterialType', e.target.value)}
                                                                className="w-32 h-8 px-2 text-[12px] border border-[#d9d9d9] rounded bg-white focus:outline-none focus:border-[#0a6ed1]"
                                                            >
                                                                <option value="">Select</option>
                                                                <option value="Trolley">Trolley</option>
                                                                <option value="Pallet">Pallet</option>
                                                                <option value="Carton">Carton</option>
                                                                <option value="Crate">Crate</option>
                                                            </select>
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <input
                                                                type="text"
                                                                value={item.packingMaterialQty}
                                                                onChange={e => updateItem(item.itemNo, 'packingMaterialQty', e.target.value)}
                                                                className="w-16 h-8 px-2 text-[13px] border border-[#d9d9d9] rounded bg-white focus:outline-none focus:border-[#0a6ed1] text-center"
                                                            />
                                                        </td>
                                                        <td className="py-3 px-3 text-[#32363a]">{item.spq}</td>
                                                        <td className="py-3 px-3">
                                                            <select
                                                                value={item.pdirNo}
                                                                onChange={e => updateItem(item.itemNo, 'pdirNo', e.target.value)}
                                                                className="w-28 h-8 px-2 text-[12px] border border-[#d9d9d9] rounded bg-white focus:outline-none focus:border-[#0a6ed1]"
                                                            >
                                                                <option value="">Select</option>
                                                                <option value="PDIR-001">PDIR-001</option>
                                                                <option value="PDIR-002">PDIR-002</option>
                                                            </select>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // ─── ATTACHMENTS TAB ───
                    <div className="anim-fade px-8 py-6">
                        <div className="bg-white border border-[#e5e5e5] rounded-xl shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5]">
                                <h3 className="text-[18px] font-bold text-[#32363a]">Attachments ({attachments.length})</h3>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-1.5 px-4 h-9 text-[14px] font-semibold text-[#0a6ed1] bg-[#ebf5ff] border border-[#0a6ed1] rounded-lg hover:bg-[#d9ecff] hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                        <path d="M12 5v14M5 12h14" />
                                    </svg>
                                    Add
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept=".pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>

                            {attachments.length === 0 ? (
                                <div
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={e => {
                                        e.preventDefault()
                                        const files = Array.from(e.dataTransfer.files)
                                        files.forEach(async file => {
                                            if (!isAllowedFile(file)) {
                                                alert(`"${file.name}" is not allowed. Only PDF and Excel files (.pdf, .xls, .xlsx) are accepted.`)
                                                return
                                            }
                                            const att = await createAsnApi.uploadAttachment('draft', file)
                                            setAttachments(prev => [...prev, att])
                                        })
                                    }}
                                    className="py-20 flex flex-col items-center text-center"
                                >
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" className="mb-4">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <path d="M14 2v6h6" />
                                    </svg>
                                    <h4 className="text-[18px] font-semibold text-[#32363a] mb-1">No files found.</h4>
                                    <p className="text-[13px] text-[#6a6d70]">Drop files or use the "+" button for pending upload</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-[#f0f0f0]">
                                    {attachments.map(att => (
                                        <div key={att.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#fafbfc]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-[#ebf5ff] flex items-center justify-center">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a6ed1" strokeWidth="2">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                        <path d="M14 2v6h6" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div className="text-[14px] font-semibold text-[#32363a]">{att.name}</div>
                                                    <div className="text-[12px] text-[#6a6d70]">{(att.size / 1024).toFixed(1)} KB</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeAttachment(att.id)}
                                                className="w-8 h-8 flex items-center justify-center text-[#cc1c14] hover:bg-[#fce8e6] rounded transition-colors"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </PageLayout>
    )
}