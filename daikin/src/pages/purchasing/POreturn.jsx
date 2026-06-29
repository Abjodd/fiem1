import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import PageLayout from '../../layouts/PageLayout.jsx'
import { poReturnApi, authConfig, isPrintEnabled } from '../../services/poReturn.js'
import { useUser } from '../../context/UserContext.jsx'
import {
  FileText, Package, Truck, Printer, Search, X, Menu, ChevronLeft,
  Hash, Calendar, Building2, MapPin, Globe, FileBadge, Tag,
} from 'lucide-react'

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
const statusStyle = (printOk) =>
  printOk ? 'text-[#107e3e] bg-[#e8f5ec]' : 'text-[#e76500] bg-[#fff3e8]'
const statusDotColor = (printOk) => (printOk ? '#107e3e' : '#e76500')

const TABS = [
  { key: 'general',   label: 'General Data', color: '#0a6ed1', icon: (a) => <FileText size={20} color={a ? 'white' : '#0a6ed1'} strokeWidth={2} /> },
  { key: 'consignee', label: 'Consignee',     color: '#107e3e', icon: (a) => <Building2 size={20} color={a ? 'white' : '#107e3e'} strokeWidth={2} /> },
  { key: 'items',     label: 'Items',         color: '#e76500', icon: (a) => <Package size={20} color={a ? 'white' : '#e76500'} strokeWidth={2} /> },
]

// ═══════════════════════════════════════════════════════════════
// PRINT TEMPLATE — renders into a portal, visible only on print
// ═══════════════════════════════════════════════════════════════
function DeliveryChallanPrint({ doc }) {
  if (!doc) return null

  const fmt = (n) =>
    n == null || n === ''
      ? ''
      : Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const totals = doc.items.reduce(
    (acc, it) => ({
      qty: acc.qty + (it.quantity || 0),
      disc: acc.disc + (Number(it.disc) || 0),
      taxable: acc.taxable + (it.taxableValue || 0),
      cgst: acc.cgst + (it.cgstAmount || 0),
      sgst: acc.sgst + (it.sgstAmount || 0),
      igst: acc.igst + (it.igstAmount || 0),
    }),
    { qty: 0, disc: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0 }
  )

  const printStyles = `
    @media print {
      /* Hide the app shell; show only our challan */
      body > #root { display: none !important; }
      body > .dc-print-portal { display: block !important; }

      @page { size: A4 portrait; margin: 8mm 10mm; }

      * { box-sizing: border-box; }

      .dc-page {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 9pt;
        color: #000;
        width: 100%;
      }
      .dc-outer { border: 1.5px solid #000; width: 100%; }

      /* header */
      .dc-header { display: flex; border-bottom: 1px solid #000; }
      .dc-logo-block {
        width: 155px; flex-shrink: 0; padding: 6px 8px;
        border-right: 1px solid #000;
        display: flex; flex-direction: column;
        align-items: flex-start; justify-content: center; gap: 4px;
      }
      .dc-logo-block img { width: 110px; height: auto; }
      .dc-logo-tagline { font-size: 7.5pt; font-weight: bold; letter-spacing: 0.5px; }
      .dc-title-block {
        flex: 1; text-align: center; padding: 6px 10px;
        border-right: 1px solid #000;
        display: flex; flex-direction: column; justify-content: center;
      }
      .dc-title-main { font-size: 13pt; font-weight: bold; letter-spacing: 0.3px; }
      .dc-title-co   { font-size: 11pt; font-weight: bold; }
      .dc-title-sub  { font-size: 7.5pt; margin-top: 2px; }
      .dc-title-addr { font-size: 7.5pt; }
      .dc-doc-info-block {
        width: 200px; flex-shrink: 0; padding: 5px 8px;
        font-size: 8pt; display: flex; flex-direction: column;
        gap: 3px; justify-content: center;
      }
      .dc-doc-info-block .orig { font-weight: bold; font-size: 8.5pt; text-align: right; margin-bottom: 4px; }
      .dc-dir { display: flex; gap: 3px; }
      .dc-dir .lbl { font-weight: bold; white-space: nowrap; }

      /* gstin */
      .dc-gstin { border-bottom: 1px solid #000; text-align: center; padding: 3px; font-size: 8pt; font-weight: bold; }

      /* consignee */
      .dc-consignee-section { display: flex; border-bottom: 1px solid #000; }
      .dc-consignee-block { flex: 1; padding: 5px 8px; border-right: 1px solid #000; font-size: 8.5pt; }
      .dc-cons-label { font-weight: bold; font-size: 8.5pt; text-decoration: underline; margin-bottom: 3px; }
      .dc-cf { margin-bottom: 2px; }
      .dc-cf .lbl { font-weight: bold; }
      .dc-po-block { width: 260px; flex-shrink: 0; padding: 5px 8px; font-size: 8.5pt; }
      .dc-po-row { display: flex; gap: 5px; margin-bottom: 3px; align-items: baseline; }
      .dc-po-row .lbl { font-weight: bold; white-space: nowrap; }

      /* items table */
      .dc-tbl { width: 100%; border-collapse: collapse; font-size: 7.5pt; }
      .dc-tbl th, .dc-tbl td { border: 1px solid #000; padding: 3px 4px; vertical-align: middle; }
      .dc-tbl thead th { font-weight: bold; text-align: center; }
      .dc-tbl tbody td { text-align: center; }
      .dc-tbl tbody td.left { text-align: left; }
      .dc-tbl tfoot td { font-weight: bold; text-align: center; }
      .dc-right { text-align: right !important; }
      .dc-bold  { font-weight: bold; }

      /* bottom */
      .dc-bottom { display: flex; border-top: 1px solid #000; }
      .dc-remarks { flex: 1; padding: 5px 8px; font-size: 8.5pt; border-right: 1px solid #000; }
      .dc-remarks .lbl { font-weight: bold; }
      .dc-totals { width: 200px; flex-shrink: 0; padding: 5px 8px; font-size: 8.5pt; }
      .dc-tr { display: flex; justify-content: space-between; margin-bottom: 2px; }
      .dc-tr .lbl { font-weight: bold; }
      .dc-grand { display: flex; justify-content: space-between; font-weight: bold; font-size: 9.5pt; border-top: 1px solid #000; padding-top: 3px; margin-top: 2px; }

      /* words */
      .dc-words { border-top: 1px solid #000; padding: 4px 8px; font-size: 8.5pt; }
      .dc-words .lbl { font-weight: bold; }

      /* signatory */
      .dc-sign { display: flex; border-top: 1px solid #000; min-height: 55px; }
      .dc-sign-left { flex: 1; padding: 5px 8px; font-size: 8pt; border-right: 1px solid #000; }
      .dc-sign-right { width: 200px; flex-shrink: 0; padding: 5px 8px; font-size: 8pt; text-align: right; display: flex; flex-direction: column; justify-content: space-between; }
      .dc-sign-right .co { font-weight: bold; }

      /* disclaimer */
      .dc-disc { border-top: 1px solid #000; padding: 4px 8px; font-size: 7.5pt; font-weight: bold; }

      /* reg footer */
      .dc-reg { border-top: 1px solid #000; padding: 4px 8px; font-size: 7pt; text-align: center; }

      .dc-pgnum { text-align: right; font-size: 7.5pt; padding-right: 4px; }
    }
  `

  return createPortal(
    <>
      <style>{printStyles}</style>
      <div className="dc-print-portal" style={{ display: 'none' }}>
        <div className="dc-page">
          <div className="dc-outer">

            {/* HEADER */}
            <div className="dc-header">
              <div className="dc-logo-block">
                {/* Put your logo at public/fiem-logo.png  — or change the src below */}
                <img src="/fiem-logo.png" alt="Fiem Industries" />
                <div className="dc-logo-tagline">LIGHT UP THE WORLD</div>
              </div>
              <div className="dc-title-block">
                <div className="dc-title-main">DELIVERY CHALLAN CUM REJECTION NOTE</div>
                <div className="dc-title-co">FIEM INDUSTRIES LIMITED</div>
                <div className="dc-title-sub">AUTOMOTIVE LIGHTING EQUIPEMENTS &amp; PLASTIC MOULDED PARTS</div>
                <div className="dc-title-addr">Plot No.1915, HSIDC, Phase-V-Rai Distt. Sonepat-131029</div>
                <div className="dc-title-addr">Phone: 01302367905,06</div>
              </div>
              <div className="dc-doc-info-block">
                <div className="orig">ORIGINAL FOR CONSIGNEE</div>
                <div className="dc-dir"><span className="lbl">Delivery Challan No. :</span> <span>{doc.id}</span></div>
                <div className="dc-dir"><span className="lbl">Document Date:</span> <span>{doc.documentDate}</span></div>
                <div className="dc-dir"><span className="lbl">Plant Code:</span> <span>{doc.plantCode}</span></div>
                <div className="dc-dir"><span className="lbl">Document No:</span> <span>{doc.documentNo}</span></div>
                <div className="dc-dir"><span className="lbl">Posting Date:</span> <span>{doc.postingDate}</span></div>
              </div>
            </div>

            {/* GSTIN */}
            <div className="dc-gstin">
              GSTIN: 06AAACF1034E1ZD &nbsp;&nbsp; CIN: L36999DL1989PLC034928
            </div>

            {/* CONSIGNEE + PO */}
            <div className="dc-consignee-section">
              <div className="dc-consignee-block">
                <div className="dc-cons-label">Name and Address of Consignee</div>
                <div className="dc-cf"><span className="lbl">Name: </span>{doc.consignee.name}</div>
                <div className="dc-cf" style={{ marginTop: 4 }}><span className="lbl">Address: </span>{doc.consignee.address}</div>
                <div className="dc-cf" style={{ marginTop: 6 }}>
                  <span className="lbl">State Code: </span>{doc.consignee.stateCode}&nbsp;&nbsp;
                  <span className="lbl">State: </span>{doc.consignee.state}&nbsp;&nbsp;
                  <span className="lbl">Country: </span>{doc.consignee.country}
                </div>
                <div className="dc-cf"><span className="lbl">GSTIN: </span>{doc.consignee.gstin}</div>
              </div>
              <div className="dc-po-block">
                <div className="dc-po-row">
                  <span className="lbl">PO No.:</span><span>{doc.generalData.poNo}</span>
                  <span className="lbl" style={{ marginLeft: 8 }}>PO Date:</span><span>{doc.generalData.poDate}</span>
                </div>
                <div className="dc-po-row"><span className="lbl">Vend Code:</span><span>{doc.generalData.vendCode}</span></div>
                <div className="dc-po-row"><span className="lbl">Vehicle No:</span><span>{doc.generalData.vehicleNo || ''}</span></div>
                <div className="dc-po-row">
                  <span className="lbl">GR No.:</span><span>{doc.generalData.grNo}</span>
                  <span className="lbl" style={{ marginLeft: 8 }}>Org Inv</span><span>{doc.generalData.orgInv}</span>
                </div>
                <div className="dc-po-row">
                  <span className="lbl">Eway Bill No. :</span><span>{doc.generalData.ewayBillNo || ''}</span>
                  <span className="lbl" style={{ marginLeft: 8 }}>Date :</span><span>{doc.generalData.date}</span>
                </div>
              </div>
            </div>

            {/* ITEMS TABLE */}
            <table className="dc-tbl">
              <thead>
                <tr>
                  <th rowSpan={2} style={{ width: 28 }}>Sr. No</th>
                  <th rowSpan={2} style={{ width: 110 }}>Item Code &amp;<br />Item Description</th>
                  <th rowSpan={2} style={{ width: 62 }}>HSN/SAC<br />Code</th>
                  <th rowSpan={2} style={{ width: 32 }}>Qty</th>
                  <th rowSpan={2} style={{ width: 28 }}>UOM</th>
                  <th rowSpan={2} style={{ width: 42 }}>Rate<br />Per<br />Unit</th>
                  <th rowSpan={2} style={{ width: 52 }}>Total</th>
                  <th rowSpan={2} style={{ width: 34 }}>Disc.</th>
                  <th rowSpan={2} style={{ width: 44 }}>Other<br />Charges</th>
                  <th rowSpan={2} style={{ width: 56 }}>Taxable<br />Value</th>
                  <th colSpan={2}>CGST</th>
                  <th colSpan={2}>SGST</th>
                  <th colSpan={2}>IGST</th>
                </tr>
                <tr>
                  <th style={{ width: 32 }}>Rate%</th>
                  <th style={{ width: 50 }}>Amount</th>
                  <th style={{ width: 32 }}>Rate%</th>
                  <th style={{ width: 50 }}>Amount</th>
                  <th style={{ width: 32 }}>Rate%</th>
                  <th style={{ width: 50 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {doc.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.itemNo}</td>
                    <td className="left">
                      <div className="dc-bold">{item.itemCode}</div>
                      <div>{item.itemDesc}</div>
                    </td>
                    <td>{item.hsnCode}</td>
                    <td>{item.quantity}</td>
                    <td>{item.uom}</td>
                    <td className="dc-right">{fmt(item.ratePerUnit)}</td>
                    <td className="dc-right">{fmt(item.total)}</td>
                    <td>{item.disc || ''}</td>
                    <td>{item.otherCharges || ''}</td>
                    <td className="dc-right">{fmt(item.taxableValue)}</td>
                    <td>{item.cgstRate}.00</td>
                    <td className="dc-right">{fmt(item.cgstAmount)}</td>
                    <td>{item.sgstRate}.00</td>
                    <td className="dc-right">{fmt(item.sgstAmount)}</td>
                    <td>{item.igstRate}.00</td>
                    <td className="dc-right">{item.igstAmount ? fmt(item.igstAmount) : ''}</td>
                  </tr>
                ))}
                {/* filler rows */}
                {Array.from({ length: Math.max(0, 5 - doc.items.length) }).map((_, i) => (
                  <tr key={`blank-${i}`} style={{ height: 18 }}>
                    {Array.from({ length: 16 }).map((__, j) => <td key={j}>&nbsp;</td>)}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td></td>
                  <td>Total</td>
                  <td></td>
                  <td>{totals.qty}</td>
                  <td></td><td></td><td></td>
                  <td className="dc-right">{totals.disc ? fmt(totals.disc) : '0.00'}</td>
                  <td></td>
                  <td className="dc-right">{fmt(totals.taxable)}</td>
                  <td></td>
                  <td className="dc-right">{fmt(totals.cgst)}</td>
                  <td></td>
                  <td className="dc-right">{fmt(totals.sgst)}</td>
                  <td></td>
                  <td className="dc-right">{totals.igst ? fmt(totals.igst) : '0.00'}</td>
                </tr>
              </tfoot>
            </table>

            {/* REMARKS + TOTALS */}
            <div className="dc-bottom">
              <div className="dc-remarks">
                <span className="lbl">Remarks : </span>{doc.remarks}
              </div>
              <div className="dc-totals">
                <div className="dc-tr"><span className="lbl">Total Value:</span><span>{fmt(doc.totalValue)}</span></div>
                <div className="dc-tr"><span className="lbl">CGST:</span><span>{fmt(doc.cgst)}</span></div>
                <div className="dc-tr"><span className="lbl">SGST:</span><span>{fmt(doc.sgst)}</span></div>
                <div className="dc-tr"><span className="lbl">IGST:</span><span>{fmt(doc.igst)}</span></div>
                <div className="dc-grand"><span>Grand Total:</span><span>{fmt(doc.grandTotal)}</span></div>
              </div>
            </div>

            {/* AMOUNT IN WORDS */}
            <div className="dc-words">
              <span className="lbl">Total Value(in Words): </span>
              {doc.totalValueInWords || amountToWords(doc.grandTotal)}
            </div>

            {/* SIGNATORY */}
            <div className="dc-sign">
              <div className="dc-sign-left"></div>
              <div className="dc-sign-right">
                <div className="co">For FIEM INDUSTRIES LIMITED</div>
                <div>Authorised Signatory</div>
              </div>
            </div>

            {/* DISCLAIMER */}
            <div className="dc-disc">
              SUPPLIER NEED TO ISSUE CREDIT NOTE WITHIN MONTH OF THE RECEIPT OF THIS DELIVERY CHALLAN AND SEND THE SAME TO FIEM.
            </div>

            {/* REGISTERED OFFICE */}
            <div className="dc-reg">
              * Registered office: Unit No. 1A &amp; 1C, First Floor, Commercial Towers, Hotel JW Marriott,
              Aerocity, New Delhi-110037 Tel: +91-9821795327/28/29/30<br />
              Email:info@fiemindustries.com, Website:www.fiemindustries.com, CIN:L36999DL1989PLC034928
            </div>

            <div className="dc-pgnum">1 of 1</div>

          </div>{/* dc-outer */}
        </div>{/* dc-page */}
      </div>
    </>,
    document.body
  )
}

// ═══════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════
function SidebarContent({
  documents, totalCount, selectedId, searchQuery, sidebarCollapsed,
  onSelectDocument, onSearchChange, onToggleCollapse, selectedBtnRef,
  listLoading, listError,
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
            </div>
            {!searchQuery && (
              <Search size={14} className="absolute right-3 top-3 text-[#9ca3af] pointer-events-none" />
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto row-stagger">
        {listLoading && documents.length === 0 && (
          <div className="px-4 py-12 text-center text-[13px] text-[#6a6d70]">
            <div className="w-8 h-8 border-2 border-[#0a6ed1] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading…
          </div>
        )}
        {listError && (
          <div className="px-4 py-3 text-[13px] text-[#cc1c14] bg-[#fce8e6] border-b border-[#fad6d3]">{listError}</div>
        )}
        {!listLoading && !listError && (
          sidebarCollapsed ? (
            documents.map((doc) => {
              const isSelected = doc.id === selectedId
              return (
                <button
                  key={doc.id}
                  ref={isSelected ? selectedBtnRef : null}
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
                    ref={isSelected ? selectedBtnRef : null}
                    onClick={() => onSelectDocument(doc.id)}
                    className={`w-full text-left px-5 py-3.5 border-b border-[#e5e5e5] transition-all duration-200 border-l-[3px] pl-[17px] ${isSelected ? 'bg-[#ebf5ff] border-l-[#0a6ed1] shadow-sm' : 'hover:bg-[#f5f6f7] hover:translate-x-0.5 border-l-transparent'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[14px] font-bold text-[#0a6ed1]">{doc.id}</span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${statusStyle(printOk)}`}>
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
          )
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

function InfoField({ label, value }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">{label}</div>
      <div className="text-[#32363a] font-medium break-words text-[13px]">{value || '—'}</div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ReturnPOMatdoc() {
  const { loginId, loginType, loading: userLoading } = useUser()
  authConfig.loginId = loginId
  authConfig.loginType = loginType

  const [documents, setDocuments] = useState([])
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState(null)

  const [selectedId, setSelectedId] = useState(() => sessionStorage.getItem('dc_selected_id') || null)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('general')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [printLoading, setPrintLoading] = useState(false)
  const selectedBtnRef = useRef(null)

  // ── fetch sidebar list ──
  useEffect(() => {
    if (userLoading) return
    if (!loginId || !loginType) return

    let cancelled = false
    setListLoading(true); setListError(null)
    poReturnApi.listHeaders()
      .then((data) => { if (!cancelled) setDocuments(data) })
      .catch((err) => { if (!cancelled) setListError(err.message) })
      .finally(() => { if (!cancelled) setListLoading(false) })
    return () => { cancelled = true }
  }, [userLoading, loginId, loginType])

  // ── pick a default selection once list loads ──
  useEffect(() => {
    if (!selectedId && documents.length > 0) {
      const saved = sessionStorage.getItem('dc_selected_id')
      const exists = saved && documents.some((d) => d.id === saved)
      setSelectedId(exists ? saved : documents[0].id)
    }
  }, [documents, selectedId])

  useEffect(() => {
    if (selectedId) sessionStorage.setItem('dc_selected_id', selectedId)
  }, [selectedId])

  // ── fetch full document detail on selection ──
  useEffect(() => {
    let cancelled = false
    if (!selectedId) { setSelectedDoc(null); return }
    setDetailLoading(true); setDetailError(null)
    poReturnApi.getDocumentDetail(selectedId)
      .then((data) => { if (!cancelled) setSelectedDoc(data) })
      .catch((err) => { if (!cancelled) setDetailError(err.message) })
      .finally(() => { if (!cancelled) setDetailLoading(false) })
    return () => { cancelled = true }
  }, [selectedId])

  useEffect(() => {
    if (selectedBtnRef.current) {
      selectedBtnRef.current.scrollIntoView({ block: 'nearest', behavior: documents.length > 0 ? 'smooth' : 'auto' })
    }
  }, [selectedId, documents])

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return documents
    const q = searchQuery.trim().toUpperCase()
    return documents.filter(
      (d) => d.id.toUpperCase().includes(q) || d.documentNo.toUpperCase().includes(q) || d.plantCode.includes(q)
    )
  }, [documents, searchQuery])

  useEffect(() => {
    if (!mobileSidebarOpen) return
    const handler = (e) => {
      if (!e.target.closest('[data-sidebar]') && !e.target.closest('[data-sidebar-toggle]')) setMobileSidebarOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [mobileSidebarOpen])

  useEffect(() => { setActiveTab('general') }, [selectedId])

  const handleSelectDocument = (id) => {
    setSelectedId(id)
    setMobileSidebarOpen(false)
  }

  // ── PRINT HANDLER ──
  // The DeliveryChallanPrint portal is always rendered (when printOk).
  // On click we just call window.print(); the @media print CSS hides the app
  // and shows the challan automatically.
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
    totalCount: documents.length,
    selectedId,
    searchQuery,
    sidebarCollapsed,
    onSelectDocument: handleSelectDocument,
    onSearchChange: setSearchQuery,
    onToggleCollapse: () => setSidebarCollapsed((c) => !c),
    selectedBtnRef,
    listLoading,
    listError,
  }

  const doc = selectedDoc
  const printOk = doc ? isPrintEnabled(doc.status) : false

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

  const renderItems = () => {
    if (!doc) return null
    return (
      <div className="anim-fade px-4 sm:px-6 lg:px-10 py-6 space-y-4">
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

        <div className="rounded-xl border border-[#e5e5e5] shadow-sm overflow-hidden bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#e5e5e5]">
            <div className="px-5 py-5 space-y-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold">Remarks</div>
                <div className="text-[13px] font-semibold text-[#32363a] mt-1">{doc.remarks}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold">Total Value (in words)</div>
                <div className="text-[13px] font-semibold text-[#32363a] italic mt-1">{doc.totalValueInWords || amountToWords(doc.grandTotal)}</div>
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

      {/* ── PRINT PORTAL — always mounted when a printable doc is selected ── */}
      {printOk && <DeliveryChallanPrint doc={doc} />}

      <div className="bg-[#f5f6f7]">
        <div className="flex" style={{ height: 'calc(100vh - 96px)' }}>

          {mobileSidebarOpen && (
            <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
          )}

          <aside data-sidebar className={`fixed top-0 left-0 h-full w-[300px] bg-white border-r border-[#e5e5e5] flex flex-col z-50 md:hidden anim-drawer ${mobileSidebarOpen ? 'flex' : 'hidden'}`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e5] bg-[#fafbfc]">
              <span className="text-[14px] font-semibold text-[#32363a]">Return Documents</span>
              <button onClick={() => setMobileSidebarOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6a6d70] hover:text-[#cc1c14] hover:bg-[#fce8e6] transition-all">
                <X size={16} />
              </button>
            </div>
            <SidebarContent {...sidebarProps} />
          </aside>

          <aside data-sidebar className={`hidden md:flex flex-col bg-white border-r border-[#e5e5e5] sidebar-transition anim-slide-l flex-shrink-0 h-full overflow-y-auto ${sidebarCollapsed ? 'w-[56px]' : 'w-[300px] lg:w-[340px]'}`}>
            <SidebarContent {...sidebarProps} />
          </aside>

          <main className="flex-1 bg-white overflow-y-auto anim-slide-r min-w-0 h-full">
            {detailLoading && (
              <div className="flex flex-col items-center justify-center h-64 gap-2">
                <div className="w-10 h-10 border-2 border-[#0a6ed1] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!detailLoading && detailError && (
              <div className="flex flex-col items-center justify-center h-64 text-[#cc1c14] gap-2">
                <FileText size={32} className="opacity-50" />
                <span className="text-[14px]">{detailError}</span>
              </div>
            )}

            {!detailLoading && !detailError && doc && (
              <>
                <div className="sticky top-0 z-20 bg-white">
                  <div className="px-4 sm:px-6 lg:px-10 pt-5 sm:pt-7 pb-5 border-b border-[#e5e5e5] bg-gradient-to-b from-[#fafbfc] to-white">
                    <div className="flex items-center gap-3 mb-4 md:hidden">
                      <button data-sidebar-toggle onClick={() => setMobileSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#d9d9d9] text-[#6a6d70] hover:text-[#0a6ed1] hover:border-[#0a6ed1] transition-all">
                        <Menu size={16} />
                      </button>
                      <span className="text-[13px] text-[#6a6d70]">Return Documents</span>
                    </div>

                    <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                      <div className="min-w-0">
                        <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1.5">Delivery Challan No.</div>
                        <h2 className="text-[20px] sm:text-[24px] font-bold text-[#0a6ed1] tracking-tight break-all">{doc.id}</h2>
                      </div>

                      <div className="flex items-center gap-3 ml-3 flex-shrink-0 relative group">
                        <span className="text-[13px] text-[#6a6d70] bg-white px-3 py-2 rounded-lg border border-[#e5e5e5] shadow-sm whitespace-nowrap mr-2 hidden sm:block">
                          {doc.documentDate}
                        </span>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[14px]">
                      {[
                        { label: 'Plant Code',    value: doc.plantCode },
                        { label: 'Document No',   value: doc.documentNo },
                        { label: 'Posting Date',  value: doc.postingDate },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div className="text-[11px] uppercase tracking-wider text-[#6a6d70] font-semibold mb-1">{label}</div>
                          <div className="text-[#32363a] font-medium break-words">{value || '—'}</div>
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

            {!detailLoading && !detailError && !doc && (
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