// DeliveryChallanPrint.jsx
// Drop this file next to ReturnPOMatdoc.jsx
// Usage: import DeliveryChallanPrint from './DeliveryChallanPrint'
//        then render <DeliveryChallanPrint doc={selectedDoc} /> anywhere in the tree
//
// The component renders ONLY in print media (hidden on screen via CSS).
// It uses a dedicated <style> block with @media print rules so it takes
// over the page cleanly when window.print() fires.

export default function DeliveryChallanPrint({ doc }) {
  if (!doc) return null

  // ── helpers ──────────────────────────────────────────────────
  const fmt = (n) =>
    n == null || n === '' ? '' : Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

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

  // ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── PRINT-ONLY STYLES ───────────────────────────────── */}
      <style>{`
        /* Hide on screen; show only when printing */
        .dc-print-wrapper {
          display: none;
        }
        @media print {
          /* Suppress everything else on the page */
          body > *:not(.dc-print-portal) {
            display: none !important;
          }
          .dc-print-portal {
            display: block !important;
          }
          .dc-print-wrapper {
            display: block;
            width: 100%;
          }

          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }

          * { box-sizing: border-box; }

          .dc-page {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9pt;
            color: #000;
            width: 100%;
          }

          /* ── outer border ── */
          .dc-outer {
            border: 1.5px solid #000;
            width: 100%;
          }

          /* ── generic cell / section helpers ── */
          .dc-row { display: flex; }
          .dc-col { display: flex; flex-direction: column; }

          .dc-b  { border-bottom: 1px solid #000; }
          .dc-bl { border-left:   1px solid #000; }
          .dc-br { border-right:  1px solid #000; }
          .dc-bt { border-top:    1px solid #000; }

          .dc-bold { font-weight: bold; }
          .dc-center { text-align: center; }
          .dc-right  { text-align: right; }

          /* ── header (logo + title + doc info) ── */
          .dc-header {
            display: flex;
            border-bottom: 1px solid #000;
          }
          .dc-logo-block {
            width: 160px;
            flex-shrink: 0;
            padding: 6px 8px;
            border-right: 1px solid #000;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            justify-content: center;
            gap: 4px;
          }
          .dc-logo-block img {
            width: 110px;
            height: auto;
          }
          .dc-logo-tagline {
            font-size: 7.5pt;
            font-weight: bold;
            letter-spacing: 0.5px;
          }
          .dc-title-block {
            flex: 1;
            text-align: center;
            padding: 6px 10px;
            border-right: 1px solid #000;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .dc-title-block .main-title {
            font-size: 13pt;
            font-weight: bold;
            letter-spacing: 0.5px;
          }
          .dc-title-block .company-name {
            font-size: 11pt;
            font-weight: bold;
          }
          .dc-title-block .subtitle {
            font-size: 7.5pt;
            margin-top: 2px;
          }
          .dc-title-block .address {
            font-size: 7.5pt;
          }
          .dc-doc-info-block {
            width: 200px;
            flex-shrink: 0;
            padding: 5px 8px;
            font-size: 8pt;
            display: flex;
            flex-direction: column;
            gap: 3px;
            justify-content: center;
          }
          .dc-doc-info-block .original-label {
            font-weight: bold;
            font-size: 8.5pt;
            text-align: right;
            margin-bottom: 4px;
          }
          .dc-doc-info-row {
            display: flex;
            gap: 3px;
          }
          .dc-doc-info-row .lbl { font-weight: bold; white-space: nowrap; }
          .dc-doc-info-row .val { }

          /* ── GSTIN banner ── */
          .dc-gstin-bar {
            border-bottom: 1px solid #000;
            text-align: center;
            padding: 3px;
            font-size: 8pt;
            font-weight: bold;
          }

          /* ── Consignee + PO section ── */
          .dc-consignee-section {
            display: flex;
            border-bottom: 1px solid #000;
          }
          .dc-consignee-block {
            flex: 1;
            padding: 5px 8px;
            border-right: 1px solid #000;
            font-size: 8.5pt;
          }
          .dc-consignee-block .section-label {
            font-weight: bold;
            font-size: 8.5pt;
            text-decoration: underline;
            margin-bottom: 3px;
          }
          .dc-consignee-field { margin-bottom: 2px; }
          .dc-consignee-field .lbl { font-weight: bold; }

          .dc-po-block {
            width: 280px;
            flex-shrink: 0;
            padding: 5px 8px;
            font-size: 8.5pt;
          }
          .dc-po-row {
            display: flex;
            gap: 6px;
            margin-bottom: 3px;
            align-items: baseline;
          }
          .dc-po-row .lbl { font-weight: bold; white-space: nowrap; }
          .dc-po-row .val { }

          /* ── Items table ── */
          .dc-items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7.5pt;
          }
          .dc-items-table th,
          .dc-items-table td {
            border: 1px solid #000;
            padding: 3px 4px;
            vertical-align: middle;
          }
          .dc-items-table thead tr th {
            font-weight: bold;
            text-align: center;
            background: #fff;
            font-size: 7.5pt;
          }
          .dc-items-table tbody td {
            text-align: center;
          }
          .dc-items-table tbody td.dc-desc {
            text-align: left;
          }
          .dc-items-table tfoot td {
            font-weight: bold;
            text-align: center;
          }

          /* ── Remarks + totals ── */
          .dc-bottom-section {
            display: flex;
            border-top: 1px solid #000;
          }
          .dc-remarks-block {
            flex: 1;
            padding: 5px 8px;
            font-size: 8.5pt;
            border-right: 1px solid #000;
          }
          .dc-remarks-block .lbl { font-weight: bold; }
          .dc-totals-block {
            width: 200px;
            flex-shrink: 0;
            padding: 5px 8px;
            font-size: 8.5pt;
          }
          .dc-total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          .dc-total-row .lbl { font-weight: bold; }
          .dc-grand-total-row {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 9.5pt;
            border-top: 1px solid #000;
            padding-top: 3px;
            margin-top: 2px;
          }

          /* ── Words row ── */
          .dc-words-row {
            border-top: 1px solid #000;
            padding: 4px 8px;
            font-size: 8.5pt;
          }
          .dc-words-row .lbl { font-weight: bold; }

          /* ── Signatory ── */
          .dc-signatory-section {
            display: flex;
            border-top: 1px solid #000;
            min-height: 50px;
          }
          .dc-signatory-left {
            flex: 1;
            padding: 5px 8px;
            font-size: 8pt;
            border-right: 1px solid #000;
            display: flex;
            align-items: flex-end;
          }
          .dc-signatory-right {
            width: 200px;
            flex-shrink: 0;
            padding: 5px 8px;
            font-size: 8pt;
            text-align: right;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          /* ── Footer disclaimer ── */
          .dc-disclaimer {
            border-top: 1px solid #000;
            padding: 4px 8px;
            font-size: 7.5pt;
            font-weight: bold;
          }

          /* ── Registered office footer ── */
          .dc-reg-footer {
            border-top: 1px solid #000;
            padding: 4px 8px;
            font-size: 7pt;
            text-align: center;
          }

          .dc-page-num {
            text-align: right;
            font-size: 7.5pt;
            padding-right: 4px;
          }
        }
      `}</style>

      {/* ── PORTAL ROOT — must live at body level for print suppression to work ── */}
      {/* We render inline here; the CSS hides everything else on print */}
      <div className="dc-print-portal" style={{ display: 'none' }}>
        <div className="dc-print-wrapper">
          <div className="dc-page">
            <div className="dc-outer">

              {/* ══════════════ HEADER ══════════════ */}
              <div className="dc-header">
                {/* Logo */}
                <div className="dc-logo-block">
                  {/* Replace /fiem-logo.png with the actual path to your logo in /public */}
                  <img src="/fiem-logo.png" alt="Fiem Industries" />
                  <div className="dc-logo-tagline">LIGHT UP THE WORLD</div>
                </div>

                {/* Title */}
                <div className="dc-title-block">
                  <div className="main-title">DELIVERY CHALLAN CUM REJECTION NOTE</div>
                  <div className="company-name">FIEM INDUSTRIES LIMITED</div>
                  <div className="subtitle">AUTOMOTIVE LIGHTING EQUIPEMENTS &amp; PLASTIC MOULDED PARTS</div>
                  <div className="address">Plot No.1915, HSIDC, Phase-V-Rai Distt. Sonepat-131029</div>
                  <div className="address">Phone: 01302367905,06</div>
                </div>

                {/* Doc Info */}
                <div className="dc-doc-info-block">
                  <div className="original-label">ORIGINAL FOR CONSIGNEE</div>
                  <div className="dc-doc-info-row"><span className="lbl">Delivery Challan No. :</span> <span className="val">{doc.id}</span></div>
                  <div className="dc-doc-info-row"><span className="lbl">Document Date:</span> <span className="val">{doc.documentDate}</span></div>
                  <div className="dc-doc-info-row"><span className="lbl">Plant Code:</span> <span className="val">{doc.plantCode}</span></div>
                  <div className="dc-doc-info-row"><span className="lbl">Document No:</span> <span className="val">{doc.documentNo}</span></div>
                  <div className="dc-doc-info-row"><span className="lbl">Posting Date:</span> <span className="val">{doc.postingDate}</span></div>
                </div>
              </div>

              {/* ══════════════ GSTIN BAR ══════════════ */}
              <div className="dc-gstin-bar">
                GSTIN: 06AAACF1034E1ZD &nbsp;&nbsp; CIN: L36999DL1989PLC034928
              </div>

              {/* ══════════════ CONSIGNEE + PO DETAILS ══════════════ */}
              <div className="dc-consignee-section">
                {/* Consignee */}
                <div className="dc-consignee-block">
                  <div className="section-label">Name and Address of Consignee</div>
                  <div className="dc-consignee-field"><span className="lbl">Name: </span>{doc.consignee.name}</div>
                  <div className="dc-consignee-field" style={{ marginTop: 4 }}><span className="lbl">Address: </span>{doc.consignee.address}</div>
                  <div className="dc-consignee-field" style={{ marginTop: 6 }}>
                    <span className="lbl">State Code: </span>{doc.consignee.stateCode}&nbsp;&nbsp;
                    <span className="lbl">State: </span>{doc.consignee.state}&nbsp;&nbsp;
                    <span className="lbl">Country: </span>{doc.consignee.country}
                  </div>
                  <div className="dc-consignee-field"><span className="lbl">GSTIN: </span>{doc.consignee.gstin}</div>
                </div>

                {/* PO / GR details */}
                <div className="dc-po-block">
                  <div className="dc-po-row">
                    <span className="lbl">PO No.:</span>
                    <span className="val">{doc.generalData.poNo}</span>
                    <span className="lbl" style={{ marginLeft: 8 }}>PO Date:</span>
                    <span className="val">{doc.generalData.poDate}</span>
                  </div>
                  <div className="dc-po-row">
                    <span className="lbl">Vend Code:</span>
                    <span className="val">{doc.generalData.vendCode}</span>
                  </div>
                  <div className="dc-po-row">
                    <span className="lbl">Vehicle No:</span>
                    <span className="val">{doc.generalData.vehicleNo || ''}</span>
                  </div>
                  <div className="dc-po-row">
                    <span className="lbl">GR No.:</span>
                    <span className="val">{doc.generalData.grNo}</span>
                    <span className="lbl" style={{ marginLeft: 8 }}>Org Inv</span>
                    <span className="val">{doc.generalData.orgInv}</span>
                  </div>
                  <div className="dc-po-row">
                    <span className="lbl">Eway Bill No. :</span>
                    <span className="val">{doc.generalData.ewayBillNo || ''}</span>
                    <span className="lbl" style={{ marginLeft: 8 }}>Date :</span>
                    <span className="val">{doc.generalData.date}</span>
                  </div>
                </div>
              </div>

              {/* ══════════════ ITEMS TABLE ══════════════ */}
              <table className="dc-items-table">
                <thead>
                  <tr>
                    <th rowSpan={2} style={{ width: 28 }}>Sr. No</th>
                    <th rowSpan={2} style={{ width: 120 }}>Item Code &amp;<br />Item Description</th>
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
                    <th style={{ width: 46 }}>Amount</th>
                    <th style={{ width: 32 }}>Rate%</th>
                    <th style={{ width: 46 }}>Amount</th>
                    <th style={{ width: 32 }}>Rate%</th>
                    <th style={{ width: 46 }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {doc.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.itemNo}</td>
                      <td className="dc-desc">
                        <div style={{ fontWeight: 'bold' }}>{item.itemCode}</div>
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
                  {/* blank filler rows so the table doesn't look too compressed */}
                  {Array.from({ length: Math.max(0, 5 - doc.items.length) }).map((_, i) => (
                    <tr key={`blank-${i}`} style={{ height: 18 }}>
                      {Array.from({ length: 16 }).map((__, j) => <td key={j}>&nbsp;</td>)}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td></td>
                    <td className="dc-bold dc-center">Total</td>
                    <td></td>
                    <td className="dc-bold">{totals.qty}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td className="dc-right">{totals.disc ? fmt(totals.disc) : '0.00'}</td>
                    <td></td>
                    <td className="dc-right dc-bold">{fmt(totals.taxable)}</td>
                    <td></td>
                    <td className="dc-right dc-bold">{fmt(totals.cgst)}</td>
                    <td></td>
                    <td className="dc-right dc-bold">{fmt(totals.sgst)}</td>
                    <td></td>
                    <td className="dc-right dc-bold">{totals.igst ? fmt(totals.igst) : '0.00'}</td>
                  </tr>
                </tfoot>
              </table>

              {/* ══════════════ REMARKS + TOTALS ══════════════ */}
              <div className="dc-bottom-section">
                <div className="dc-remarks-block">
                  <span className="lbl">Remarks : </span>{doc.remarks}
                </div>
                <div className="dc-totals-block">
                  <div className="dc-total-row"><span className="lbl">Total Value:</span><span>{fmt(doc.totalValue)}</span></div>
                  <div className="dc-total-row" style={{ marginTop: 4 }}><span className="lbl">CGST:</span><span>{fmt(doc.cgst)}</span></div>
                  <div className="dc-total-row"><span className="lbl">SGST:</span><span>{fmt(doc.sgst)}</span></div>
                  <div className="dc-total-row"><span className="lbl">IGST:</span><span>{fmt(doc.igst)}</span></div>
                  <div className="dc-grand-total-row"><span>Grand Total:</span><span>{fmt(doc.grandTotal)}</span></div>
                </div>
              </div>

              {/* ══════════════ AMOUNT IN WORDS ══════════════ */}
              <div className="dc-words-row">
                <span className="lbl">Total Value(in Words): </span>
                {doc.totalValueInWords || ''}
              </div>

              {/* ══════════════ SIGNATORY ══════════════ */}
              <div className="dc-signatory-section">
                <div className="dc-signatory-left"></div>
                <div className="dc-signatory-right">
                  <div style={{ fontWeight: 'bold' }}>For FIEM INDUSTRIES LIMITED</div>
                  <div style={{ marginTop: 30 }}>Authorised Signatory</div>
                </div>
              </div>

              {/* ══════════════ DISCLAIMER ══════════════ */}
              <div className="dc-disclaimer">
                SUPPLIER NEED TO ISSUE CREDIT NOTE WITHIN MONTH OF THE RECEIPT OF THIS DELIVERY CHALLAN AND SEND THE SAME TO FIEM.
              </div>

              {/* ══════════════ REGISTERED OFFICE ══════════════ */}
              <div className="dc-reg-footer">
                * Registered office: Unit No. 1A &amp; 1C, First Floor, Commercial Towers, Hotel JW Marriott, Aerocity, New Delhi-110037
                Tel: +91-9821795327/28/29/30<br />
                Email:info@fiemindustries.com, Website:www.fiemindustries.com, CIN:L36999DL1989PLC034928
              </div>

              <div className="dc-page-num">1 of 1</div>

            </div>{/* dc-outer */}
          </div>{/* dc-page */}
        </div>{/* dc-print-wrapper */}
      </div>{/* dc-print-portal */}
    </>
  )
}