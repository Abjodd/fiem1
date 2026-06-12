import { useState, useMemo, useEffect } from 'react'
import PageLayout from '../../layouts/PageLayout.jsx'
import {
  FileText, Package, Truck, Printer, Search, X, Menu, ChevronLeft,
  Hash, Calendar, Building2, MapPin, Globe, FileBadge, Tag,
} from 'lucide-react'

// ── Mock Data ──
const MOCK_DOCUMENTS = [
  {
    id: 'DC2611070870',
    documentDate: '05.06.2026',
    plantCode: '1007',
    documentNo: '2400001873',
    postingDate: '05.06.2026',
    status: 'Return Not Started',
    generalData: {
      poNo: '5500007282',
      vendCode: '14867',
      poDate: '26/06/26',
      vehicleNo: '',
      grNo: '5001106216',
      orgInv: '25-26/666',
      ewayBillNo: '',
      date: '9/10/2025',
    },
    consignee: {
      name: 'B P Industries',
      address: '169, SECTOR 6, IMT MANASER, ,Gurgaon-122050',
      stateCode: '6',
      state: 'Haryana',
      country: 'India',
      gstin: '06AAXFBS545J1ZX',
    },
    items: [
      {
        itemNo: '10', itemCode: '12000030', itemDesc: 'BMC Lacquor', hsnCode: '32089030',
        quantity: 60, uom: 'L', ratePerUnit: 240, total: 14400, disc: '', otherCharges: '',
        taxableValue: 14400, cgstRate: 9, cgstAmount: 1296, sgstRate: 9, sgstAmount: 1296,
        igstRate: 0, igstAmount: 0,
      },
    ],
    remarks: 'REJ AG INV NO-25-26/666/BP IND / LINE REJ',
    totalValueInWords: 'Sixteen Thousand Nine hundred ninety two rupees',
    cgst: 1296, sgst: 1296, igst: 0, totalValue: 14400, grandTotal: 16992,
  },
  {
    id: 'DC2611070888',
    documentDate: '03.06.2026',
    plantCode: '1007',
    documentNo: '2400001850',
    postingDate: '03.06.2026',
    status: 'Return Not Started',
    generalData: {
      poNo: '5500007100',
      vendCode: '14820',
      poDate: '15/06/26',
      vehicleNo: 'HR26AB1234',
      grNo: '5001106100',
      orgInv: '25-26/500',
      ewayBillNo: 'EWB123456',
      date: '8/10/2025',
    },
    consignee: {
      name: 'Sharma Enterprises',
      address: '45, Industrial Area, Phase 2, Chandigarh-160002',
      stateCode: '3',
      state: 'Punjab',
      country: 'India',
      gstin: '03BBBPS1234H1ZX',
    },
    items: [
      {
        itemNo: '10', itemCode: '11000020', itemDesc: 'Epoxy Resin 500ml', hsnCode: '39071000',
        quantity: 120, uom: 'EA', ratePerUnit: 180, total: 21600, disc: '', otherCharges: '',
        taxableValue: 21600, cgstRate: 9, cgstAmount: 1944, sgstRate: 9, sgstAmount: 1944,
        igstRate: 0, igstAmount: 0,
      },
      {
        itemNo: '20', itemCode: '11000025', itemDesc: 'Hardener 250ml', hsnCode: '39071100',
        quantity: 120, uom: 'EA', ratePerUnit: 90, total: 10800, disc: '', otherCharges: '',
        taxableValue: 10800, cgstRate: 9, cgstAmount: 972, sgstRate: 9, sgstAmount: 972,
        igstRate: 0, igstAmount: 0,
      },
    ],
    remarks: 'QUALITY REJECTION - DAMAGED GOODS',
    totalValueInWords: 'Thirty Eight Thousand Two hundred thirty two rupees',
    cgst: 2916, sgst: 2916, igst: 0, totalValue: 32400, grandTotal: 38232,
  },
  {
    id: 'DC2611070912',
    documentDate: '01.06.2026',
    plantCode: '1009',
    documentNo: '2400001900',
    postingDate: '01.06.2026',
    status: 'Return Started',
    generalData: {
      poNo: '5500007350',
      vendCode: '14900',
      poDate: '01/06/26',
      vehicleNo: 'DL01XY5678',
      grNo: '5001106350',
      orgInv: '25-26/800',
      ewayBillNo: 'EWB789012',
      date: '5/10/2025',
    },
    consignee: {
      name: 'Patel Trading Co.',
      address: 'Plot 12, GIDC Estate, Vadodara-390010',
      stateCode: '24',
      state: 'Gujarat',
      country: 'India',
      gstin: '24CCCPT9876G1ZX',
    },
    items: [
      {
        itemNo: '10', itemCode: '13000010', itemDesc: 'Polyurethane Coating', hsnCode: '32091000',
        quantity: 200, uom: 'KG', ratePerUnit: 320, total: 64000, disc: '', otherCharges: '',
        taxableValue: 64000, cgstRate: 18, cgstAmount: 11520, sgstRate: 18, sgstAmount: 11520,
        igstRate: 0, igstAmount: 0,
      },
    ],
    remarks: 'REJ DAMAGED IN TRANSIT - CLAIM RAISED',
    totalValueInWords: 'Eighty Seven Thousand Forty rupees',
    cgst: 11520, sgst: 11520, igst: 0, totalValue: 64000, grandTotal: 87040,
  },
]

// ── Number to words (Indian numbering system) ──
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

const numToWordsBelow1000 = (n) => {
  if (n === 0) return ''
  if (n < 20) return ONES[n]
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '')
  return ONES[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + numToWordsBelow1000(n % 100) : '')
}

const amountToWords = (amount) => {
  const rounded = Math.round(amount)
  if (rounded === 0) return 'Zero Rupees'
  const crore = Math.floor(rounded / 1e7)
  const lakh = Math.floor((rounded % 1e7) / 1e5)
  const thousand = Math.floor((rounded % 1e5) / 1e3)
  const rest = rounded % 1e3

  const parts = []
  if (crore) parts.push(numToWordsBelow1000(crore) + ' Crore')
  if (lakh) parts.push(numToWordsBelow1000(lakh) + ' Lakh')
  if (thousand) parts.push(numToWordsBelow1000(thousand) + ' Thousand')
  if (rest) parts.push(numToWordsBelow1000(rest))

  return parts.join(' ') + ' Rupees'
}

// ── Status helpers ──
const isPrintEnabled = (status) => {
  if (!status) return false
  const s = status.toLowerCase()
  return s.includes('return started') && !s.includes('not started')
}
const statusStyle = (printOk) =>
  printOk ? 'text-[#107e3e] bg-[#e8f5ec]' : 'text-[#e76500] bg-[#fff3e8]'
const statusDotColor = (printOk) => (printOk ? '#107e3e' : '#e76500')

// ── Tabs config (matches Goods Movement icon-pill style) ──
const TABS = [
  { key: 'general',   label: 'General Data', color: '#0a6ed1', icon: (a) => <FileText size={20} color={a ? 'white' : '#0a6ed1'} strokeWidth={2} /> },
  { key: 'consignee', label: 'Consignee',     color: '#107e3e', icon: (a) => <Building2 size={20} color={a ? 'white' : '#107e3e'} strokeWidth={2} /> },
  { key: 'items',     label: 'Items',         color: '#e76500', icon: (a) => <Package size={20} color={a ? 'white' : '#e76500'} strokeWidth={2} /> },
]

// ═══════════════════════════════════════════════════════════════
// SIDEBAR — extracted for stable identity (avoids focus loss bug)
// ═══════════════════════════════════════════════════════════════
function SidebarContent({
  documents, totalCount, selectedId, searchQuery, sidebarCollapsed,
  onSelectDocument, onSearchChange, onToggleCollapse,
}) {
  return (
    <>
      <div className="px-4 py-4 border-b border-[#e5e5e5]">
        {!sidebarCollapsed && (
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-semibold text-[#32363a]">Return Documents</h3>
            <span className="text-[12px] text-[#6a6d70] bg-[#f5f6f7] px-2.5 py-1 rounded-full">
              {documents.length} of {totalCount}
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
              placeholder="Search by ID or doc no."
              className="w-full h-10 pl-3.5 pr-9 text-[14px] border border-[#d9d9d9] rounded-lg bg-white focus:outline-none focus:border-[#0a6ed1] focus:ring-2 focus:ring-[#0a6ed1]/20 transition-all duration-200"
            />
            <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
              {searchQuery && (
                <button onClick={() => onSearchChange('')} className="w-7 h-7 flex items-center justify-center text-[#6a6d70] hover:text-[#cc1c14] rounded transition-all hover:scale-110">
                  <X size={15} />
                </button>
              )}
              <Search size={14} className="absolute right-1.5 top-1.5 text-[#9ca3af] pointer-events-none opacity-0" />
            </div>
            {!searchQuery && (
              <Search size={14} className="absolute right-3 top-3 text-[#9ca3af] pointer-events-none" />
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto row-stagger">
        {sidebarCollapsed ? (
          documents.map((doc) => {
            const isSelected = doc.id === selectedId
            return (
              <button
                key={doc.id}
                onClick={() => onSelectDocument(doc.id)}
                title={doc.id}
                className={`w-full flex items-center justify-center py-3 border-b border-[#e5e5e5] transition-all duration-200 border-l-[3px] ${isSelected ? 'bg-[#ebf5ff] border-l-[#0a6ed1]' : 'hover:bg-[#f5f6f7] border-l-transparent'}`}
              >
                <span className={`text-[11px] font-bold ${isSelected ? 'text-[#0a6ed1]' : 'text-[#6a6d70]'}`}>
                  {doc.id.slice(-3)}
                </span>
              </button>
            )
          })
        ) : (
          <>
            {documents.map((doc) => {
              const isSelected = doc.id === selectedId
              const printOk = isPrintEnabled(doc.status)
              return (
                <button
                  key={doc.id}
                  onClick={() => onSelectDocument(doc.id)}
                  className={`w-full text-left px-5 py-3.5 border-b border-[#e5e5e5] transition-all duration-200 border-l-[3px] pl-[17px] ${isSelected ? 'bg-[#ebf5ff] border-l-[#0a6ed1] shadow-sm' : 'hover:bg-[#f5f6f7] hover:translate-x-0.5 border-l-transparent'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[14px] font-semibold text-[#0a6ed1]">{doc.id}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusStyle(printOk)}`}>
                      {printOk ? 'Started' : 'Not Started'}
                    </span>
                  </div>
                  <div className="text-[13px] text-[#6a6d70] mb-1">Doc: {doc.documentNo}</div>
                  <div className="flex items-center justify-between text-[13px] text-[#6a6d70]">
                    <span>Plant {doc.plantCode}</span>
                    <span>{doc.documentDate}</span>
                  </div>
                </button>
              )
            })}
            {documents.length === 0 && (
              <div className="px-4 py-12 text-center text-[13px] text-[#6a6d70] anim-fade">
                <Search size={36} className="mx-auto mb-2 opacity-40" />
                No documents found
              </div>
            )}
          </>
        )}
      </div>

      <div className="border-t border-[#e5e5e5] px-3 py-2.5 flex items-center justify-end">
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex w-9 h-9 items-center justify-center rounded-lg text-[#6a6d70] hover:text-[#0a6ed1] hover:bg-[#f0f7ff] transition-all hover:scale-105"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft size={17} style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease' }} />
        </button>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// Info field — for header info grid (icon + label + value)
// ═══════════════════════════════════════════════════════════════
function InfoField({ Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="text-[#6a6d70] mt-[3px] flex-shrink-0" strokeWidth={1.8} />
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold">{label}</div>
        <div className="text-[13px] font-semibold text-[#32363a] mt-0.5 break-words">{value || '—'}</div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ReturnPOMatdoc() {
  const [selectedId, setSelectedId] = useState(MOCK_DOCUMENTS[0].id)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('general')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [printLoading, setPrintLoading] = useState(false)

  const selectedDoc = useMemo(
    () => MOCK_DOCUMENTS.find((d) => d.id === selectedId) || null,
    [selectedId]
  )

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_DOCUMENTS
    const q = searchQuery.trim().toUpperCase()
    return MOCK_DOCUMENTS.filter(
      (d) => d.id.toUpperCase().includes(q) || d.documentNo.includes(q) || d.plantCode.includes(q)
    )
  }, [searchQuery])

  // Close mobile sidebar on outside click
  useEffect(() => {
    if (!mobileSidebarOpen) return
    const handler = (e) => {
      if (!e.target.closest('[data-sidebar]') && !e.target.closest('[data-sidebar-toggle]')) setMobileSidebarOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [mobileSidebarOpen])

  // Reset to first tab whenever doc changes
  useEffect(() => {
    setActiveTab('general')
  }, [selectedId])

  const handleSelectDocument = (id) => {
    setSelectedId(id)
    setMobileSidebarOpen(false)
  }

  const handlePrint = () => {
    if (!selectedDoc || !isPrintEnabled(selectedDoc.status) || printLoading) return
    setPrintLoading(true)
    setTimeout(() => {
      window.print()
      setPrintLoading(false)
    }, 300)
  }

  const sidebarProps = {
    documents: filteredDocs,
    totalCount: MOCK_DOCUMENTS.length,
    selectedId,
    searchQuery,
    sidebarCollapsed,
    onSelectDocument: handleSelectDocument,
    onSearchChange: setSearchQuery,
    onToggleCollapse: () => setSidebarCollapsed((c) => !c),
  }

  const doc = selectedDoc
  const printOk = doc ? isPrintEnabled(doc.status) : false

  // ── General Data tab ──
  const renderGeneral = () => {
    if (!doc) return null
    return (
      <div className="anim-fade px-4 sm:px-6 lg:px-10 py-6">
        <div className="rounded-xl border border-[#e5e5e5] shadow-sm overflow-hidden bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#e5e5e5]">
            <div className="px-6 py-5 grid grid-cols-2 gap-x-4 gap-y-4">
              <InfoField Icon={Hash}     label="PO No."       value={doc.generalData.poNo} />
              <InfoField Icon={Tag}      label="Vend Code"    value={doc.generalData.vendCode} />
              <InfoField Icon={Calendar} label="PO Date"      value={doc.generalData.poDate} />
              <InfoField Icon={Truck}    label="Vehicle No."  value={doc.generalData.vehicleNo} />
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-x-4 gap-y-4">
              <InfoField Icon={FileBadge} label="GR No."        value={doc.generalData.grNo} />
              <InfoField Icon={FileText}  label="Org Inv"       value={doc.generalData.orgInv} />
              <InfoField Icon={Hash}      label="Eway Bill No." value={doc.generalData.ewayBillNo} />
              <InfoField Icon={Calendar}  label="Date"          value={doc.generalData.date} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Consignee tab ──
  const renderConsignee = () => {
    if (!doc) return null
    return (
      <div className="anim-fade px-4 sm:px-6 lg:px-10 py-6">
        <div className="rounded-xl border border-[#e5e5e5] shadow-sm overflow-hidden bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#e5e5e5]">
            <div className="px-6 py-5 grid grid-cols-1 gap-y-4">
              <InfoField Icon={Building2} label="Name"       value={doc.consignee.name} />
              <InfoField Icon={MapPin}    label="Address"    value={doc.consignee.address} />
              <InfoField Icon={Hash}      label="State Code" value={doc.consignee.stateCode} />
            </div>
            <div className="px-6 py-5 grid grid-cols-1 gap-y-4">
              <InfoField Icon={MapPin}    label="State"   value={doc.consignee.state} />
              <InfoField Icon={Globe}     label="Country" value={doc.consignee.country} />
              <InfoField Icon={FileBadge} label="GSTIN"   value={doc.consignee.gstin} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Items tab ──
  const renderItems = () => {
    if (!doc) return null
    return (
      <div className="anim-fade px-4 sm:px-6 lg:px-10 py-6 space-y-4">
        {/* Items table */}
        <div className="overflow-x-auto rounded-xl border border-[#e5e5e5] shadow-sm">
          <table className="w-full text-[13px]" style={{ minWidth: '1150px', borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-gradient-to-b from-[#fafbfc] to-[#f5f6f7] border-b border-[#e5e5e5] text-[#6a6d70]">
                <th rowSpan={2} className="text-center font-semibold py-3.5 px-4 text-[12px] uppercase tracking-wider whitespace-nowrap border-r border-[#ececec] align-middle">Item No.</th>
                <th rowSpan={2} className="text-center font-semibold py-3.5 px-4 text-[12px] uppercase tracking-wider whitespace-nowrap border-r border-[#ececec] align-middle">Item Code &amp; Description</th>
                <th rowSpan={2} className="text-center font-semibold py-3.5 px-4 text-[12px] uppercase tracking-wider whitespace-nowrap border-r border-[#ececec] align-middle">HSN/SAC</th>
                <th rowSpan={2} className="text-center font-semibold py-3.5 px-4 text-[12px] uppercase tracking-wider whitespace-nowrap border-r border-[#ececec] align-middle">Quantity</th>
                <th rowSpan={2} className="text-center font-semibold py-3.5 px-4 text-[12px] uppercase tracking-wider whitespace-nowrap border-r border-[#ececec] align-middle">UOM</th>
                <th rowSpan={2} className="text-center font-semibold py-3.5 px-4 text-[12px] uppercase tracking-wider whitespace-nowrap border-r border-[#ececec] align-middle">Rate/Unit</th>
                <th rowSpan={2} className="text-center font-semibold py-3.5 px-4 text-[12px] uppercase tracking-wider whitespace-nowrap border-r border-[#ececec] align-middle">Total</th>
                <th rowSpan={2} className="text-center font-semibold py-3.5 px-4 text-[12px] uppercase tracking-wider whitespace-nowrap border-r border-[#ececec] align-middle">Disc.</th>
                <th rowSpan={2} className="text-center font-semibold py-3.5 px-4 text-[12px] uppercase tracking-wider whitespace-nowrap border-r border-[#ececec] align-middle">Other Chgs.</th>
                <th rowSpan={2} className="text-center font-semibold py-3.5 px-4 text-[12px] uppercase tracking-wider whitespace-nowrap border-r border-[#e5e5e5] align-middle">Taxable Value</th>
                <th className="text-center font-semibold py-1.5 px-4 text-[12px] uppercase tracking-wider whitespace-nowrap" colSpan={2}>CGST</th>
                <th className="text-center font-semibold py-1.5 px-4 text-[12px] uppercase tracking-wider whitespace-nowrap border-l border-[#e5e5e5]" colSpan={2}>SGST</th>
                <th className="text-center font-semibold py-1.5 px-4 text-[12px] uppercase tracking-wider whitespace-nowrap border-l border-[#e5e5e5]" colSpan={2}>IGST</th>
              </tr>
              <tr className="bg-gradient-to-b from-[#fafbfc] to-[#f5f6f7] border-b border-[#e5e5e5] text-[#6a6d70]">
                <th className="text-center font-semibold py-1.5 px-4 text-[11px] uppercase tracking-wider whitespace-nowrap border-r border-[#ececec]">Rate %</th>
                <th className="text-center font-semibold py-1.5 px-4 text-[11px] uppercase tracking-wider whitespace-nowrap border-r border-[#e5e5e5]">Amount</th>
                <th className="text-center font-semibold py-1.5 px-4 text-[11px] uppercase tracking-wider whitespace-nowrap border-r border-[#ececec]">Rate %</th>
                <th className="text-center font-semibold py-1.5 px-4 text-[11px] uppercase tracking-wider whitespace-nowrap border-r border-[#e5e5e5]">Amount</th>
                <th className="text-center font-semibold py-1.5 px-4 text-[11px] uppercase tracking-wider whitespace-nowrap border-r border-[#ececec]">Rate %</th>
                <th className="text-center font-semibold py-1.5 px-4 text-[11px] uppercase tracking-wider whitespace-nowrap">Amount</th>
              </tr>
            </thead>
            <tbody className="row-stagger">
              {doc.items.map((item, idx) => (
                <tr key={idx} className="border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafbfc] transition-colors duration-200">
                  <td className="py-4 px-4 font-semibold text-[#32363a] border-r border-[#f0f0f0] text-center">{item.itemNo}</td>
                  <td className="py-4 px-4 border-r border-[#f0f0f0] text-center">
                    <div className="text-[#0a6ed1] font-semibold text-[13px]">{item.itemCode}</div>
                    <div className="text-[#32363a] text-[13px]">{item.itemDesc}</div>
                  </td>
                  <td className="py-4 px-4 text-[#32363a] border-r border-[#f0f0f0] text-center">{item.hsnCode}</td>
                  <td className="py-4 px-4 text-[#32363a] font-semibold border-r border-[#f0f0f0] text-center">{item.quantity}</td>
                  <td className="py-4 px-4 text-[#6a6d70] border-r border-[#f0f0f0] text-center">{item.uom}</td>
                  <td className="py-4 px-4 text-[#32363a] border-r border-[#f0f0f0] text-center">{item.ratePerUnit}</td>
                  <td className="py-4 px-4 font-semibold text-[#32363a] border-r border-[#f0f0f0] text-center">{item.total.toLocaleString('en-IN')}</td>
                  <td className="py-4 px-4 text-[#6a6d70] border-r border-[#f0f0f0] text-center">{item.disc || '—'}</td>
                  <td className="py-4 px-4 text-[#6a6d70] border-r border-[#f0f0f0] text-center">{item.otherCharges || '—'}</td>
                  <td className="py-4 px-4 font-semibold text-[#32363a] border-r border-[#e5e5e5] text-center">{item.taxableValue.toLocaleString('en-IN')}</td>
                  <td className="py-4 px-4 text-[#32363a] border-r border-[#ececec] text-center">{item.cgstRate}</td>
                  <td className="py-4 px-4 text-[#32363a] border-r border-[#e5e5e5] text-center">{item.cgstAmount.toLocaleString('en-IN')}</td>
                  <td className="py-4 px-4 text-[#32363a] border-r border-[#ececec] text-center">{item.sgstRate}</td>
                  <td className="py-4 px-4 text-[#32363a] border-r border-[#e5e5e5] text-center">{item.sgstAmount.toLocaleString('en-IN')}</td>
                  <td className="py-4 px-4 text-[#32363a] border-r border-[#ececec] text-center">{item.igstRate}</td>
                  <td className="py-4 px-4 text-[#32363a] text-center">{item.igstAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Remarks + Summary */}
        <div className="rounded-xl border border-[#e5e5e5] shadow-sm overflow-hidden bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#e5e5e5]">
            <div className="px-5 py-5 space-y-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold">Remarks</div>
                <div className="text-[13px] font-semibold text-[#32363a] mt-1">{doc.remarks}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold">Total Value (in words)</div>
                <div className="text-[13px] font-semibold text-[#32363a] italic mt-1">{amountToWords(doc.grandTotal)}</div>
              </div>
            </div>
            <div className="px-5 py-5">
              <div className="flex flex-col gap-2 text-[13px] max-w-[280px] sm:ml-auto">
                <div className="flex items-center justify-between">
                  <span className="text-[#6a6d70] font-semibold">CGST</span>
                  <span className="text-[#32363a] font-semibold">{doc.cgst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6a6d70] font-semibold">SGST</span>
                  <span className="text-[#32363a] font-semibold">{doc.sgst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6a6d70] font-semibold">IGST</span>
                  <span className="text-[#32363a] font-semibold">{doc.igst}</span>
                </div>
                <div className="border-t border-[#e5e5e5] my-1" />
                <div className="flex items-center justify-between">
                  <span className="text-[#6a6d70] font-semibold">Total Value</span>
                  <span className="text-[#32363a] font-semibold">{doc.totalValue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between bg-[#ebf5ff] px-3 py-2 rounded-lg">
                  <span className="text-[#0a6ed1] font-bold text-[14px]">Grand Total</span>
                  <span className="text-[#0a6ed1] font-bold text-[14px]">{doc.grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const tabContent = { general: renderGeneral, consignee: renderConsignee, items: renderItems }

  return (
    <PageLayout>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideInLeft{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideInRight{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideInDrawer{from{transform:translateX(-100%)}to{transform:translateX(0)}}
        .anim-fade{animation:fadeIn .35s ease-out both}
        .anim-slide-l{animation:slideInLeft .3s ease-out both}
        .anim-slide-r{animation:slideInRight .35s ease-out both}
        .anim-drawer{animation:slideInDrawer .28s ease-out both}
        .row-stagger>*{animation:fadeIn .4s ease-out both}
        .row-stagger>*:nth-child(1){animation-delay:.02s}.row-stagger>*:nth-child(2){animation-delay:.06s}
        .row-stagger>*:nth-child(3){animation-delay:.10s}.row-stagger>*:nth-child(4){animation-delay:.14s}
        .row-stagger>*:nth-child(5){animation-delay:.18s}
        .sidebar-transition{transition:width .25s ease}
      `}</style>

    

      <div className="bg-[#f5f6f7]">
        <div className="flex" style={{ height: 'calc(100vh - 96px)' }}>

          {mobileSidebarOpen && (
            <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
          )}

          {/* Mobile sidebar drawer */}
          <aside data-sidebar className={`fixed top-0 left-0 h-full w-[300px] bg-white border-r border-[#e5e5e5] flex flex-col z-50 md:hidden anim-drawer ${mobileSidebarOpen ? 'flex' : 'hidden'}`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e5] bg-[#fafbfc]">
              <span className="text-[14px] font-semibold text-[#32363a]">Return Documents</span>
              <button onClick={() => setMobileSidebarOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6a6d70] hover:text-[#cc1c14] hover:bg-[#fce8e6] transition-all">
                <X size={16} />
              </button>
            </div>
            <SidebarContent {...sidebarProps} />
          </aside>

          {/* Desktop sidebar — independent scroll */}
          <aside data-sidebar className={`hidden md:flex flex-col bg-white border-r border-[#e5e5e5] sidebar-transition anim-slide-l flex-shrink-0 h-full overflow-y-auto ${sidebarCollapsed ? 'w-[56px]' : 'w-[300px] lg:w-[340px]'}`}>
            <SidebarContent {...sidebarProps} />
          </aside>

          {/* Right pane — independent scroll, header+tabs sticky */}
          <main className="flex-1 bg-white overflow-y-auto anim-slide-r min-w-0 h-full">
            {doc && (
              <>
                {/* Sticky header + tabs */}
                <div className="sticky top-0 z-20 bg-white">
                  <div className="px-4 sm:px-6 lg:px-10 pt-5 sm:pt-7 pb-5 border-b border-[#e5e5e5] bg-gradient-to-b from-[#fafbfc] to-white">
                  <div className="flex items-center gap-3 mb-4 md:hidden">
                    <button data-sidebar-toggle onClick={() => setMobileSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#d9d9d9] text-[#6a6d70] hover:text-[#0a6ed1] hover:border-[#0a6ed1] transition-all">
                      <Menu size={16} />
                    </button>
                    <span className="text-[13px] text-[#6a6d70]">Return Documents</span>
                  </div>

                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="min-w-0">
                      <div className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1.5">Delivery Challan No.</div>
                      <h2 className="text-[22px] sm:text-[26px] font-bold text-[#32363a] tracking-tight break-all">{doc.id}</h2>
                    </div>

                    <div className="flex items-center gap-3 ml-3 flex-shrink-0 relative group">
                      <span className={`text-[13px] sm:text-[14px] font-bold px-3 py-1 rounded-full whitespace-nowrap ${statusStyle(printOk)}`}>
                        <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ backgroundColor: statusDotColor(printOk) }} />
                        {doc.status}
                      </span>
                      <button
                        onClick={handlePrint}
                        disabled={!printOk || printLoading}
                        className={`flex items-center gap-1.5 px-3 sm:px-4 h-9 text-[13px] font-semibold rounded-lg transition-all shadow-md ${
                          printOk
                            ? 'text-white bg-[#0a6ed1] hover:bg-[#085caf] hover:scale-[1.02] active:scale-[0.98]'
                            : 'text-[#b0b0b0] bg-[#f0f0f0] cursor-not-allowed shadow-none'
                        }`}
                      >
                        {printLoading ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Printer size={15} />
                        )}
                        Print
                      </button>
                      {!printOk && (
                        <div className="absolute top-full right-0 mt-2 px-3 py-1.5 bg-[#32363a] text-white text-[11px] rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                          Print available only when Return Started
                          <div className="absolute bottom-full right-4 border-4 border-transparent border-b-[#32363a]" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info fields — bigger, only the 4 key fields */}
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-5">
                    {[
                      { Icon: Building2, label: 'Plant Code',   value: doc.plantCode },
                      { Icon: Calendar,  label: 'Document Date', value: doc.documentDate },
                      { Icon: Hash,      label: 'Document No',   value: doc.documentNo },
                      { Icon: Calendar,  label: 'Posting Date',  value: doc.postingDate },
                    ].map(({ Icon, label, value }) => (
                      <div key={label} className="flex items-start gap-2.5">
                        <Icon size={18} className="text-[#6a6d70] mt-[2px] flex-shrink-0" strokeWidth={1.8} />
                        <div className="min-w-0">
                          <div className="text-[12px] uppercase tracking-wider text-[#6a6d70] font-semibold">{label}</div>
                          <div className="text-[17px] sm:text-[19px] font-bold text-[#32363a] mt-1 break-words">{value || '—'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  </div>
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
                            className={`w-11 h-11 rounded-full flex items-center justify-center mb-1.5 transition-all duration-200 ${isActive ? '' : 'hover:scale-105'}`}
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

                </div>

                <div key={`${doc.id}-${activeTab}`}>{tabContent[activeTab]?.()}</div>
              </>
            )}

            {!doc && (
              <div className="flex flex-col items-center justify-center h-64 text-[#6a6d70] anim-fade">
                <FileText size={48} className="mb-3 opacity-30" strokeWidth={1.5} />
                <span className="text-[14px]">Select a document from the list</span>
              </div>
            )}
          </main> 
        </div>
      </div>
    </PageLayout>
  )
}