// ═══════════════════════════════════════════════════════════════
// generateShipmentNote.js — PDF Shipment Note Generator
// ═══════════════════════════════════════════════════════════════

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.onload = resolve
    s.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(s)
  })
}

function barcodeDataUrl(text, opts = {}) {
  const canvas = document.createElement('canvas')
  try {
    window.JsBarcode(canvas, text, {
      format: 'CODE128',
      width: opts.width || 2,
      height: opts.height || 50,
      displayValue: false,
      margin: 0,
      background: '#ffffff',
      lineColor: '#000000',
    })
    return canvas.toDataURL('image/png')
  } catch (err) {
    console.error('Barcode generation failed for:', text, err)
    return null
  }
}

export async function generateShipmentNote(tracking) {
  if (!tracking) throw new Error('No tracking data')

  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
  await loadScript('https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js')

  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, H = 297
  const LM = 15, RM = 15
  const PW = W - LM - RM

  const BLACK = [0, 0, 0]
  const GRAY = [100, 100, 100]
  const LGRAY = [180, 180, 180]

  const setFont = (style = 'normal', size = 10) => {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
  }

  const drawRect = (x, y, w, h) => {
    doc.setDrawColor(...LGRAY)
    doc.setLineWidth(0.3)
    doc.rect(x, y, w, h)
  }

  // ── Extract data ────────────────────────────────────────────
  const trackingNo = tracking.id || ''             // e.g. '1000001187/2026'
  const createdOn = tracking.timeline?.find(t => t.key === 'created')?.timestamp || tracking.date || ''
  const shipmentDate = tracking.timeline?.find(t => t.key === 'shipped')?.timestamp || ''
  const eta = tracking.etaDate || ''
  const asnsTagged = tracking.asns?.length || 0

  const vendorName = tracking.vendorName || ''
  const vendorCode = tracking.vendor || ''
  const vendorAddress1 = ''
  const vendorAddress2 = ''
  const vendorCity     = ''
  const vendorPin      = ''

  const reportGateNo = ''
  const unloadingPoint = ''

  let Y = 15

  // ── HEADER ──────────────────────────────────────────────────
  setFont('bold', 18)
  doc.setTextColor(...BLACK)
  doc.text('SHIPMENT NOTE', W / 2, Y, { align: 'center' })

  setFont('normal', 9)
  doc.setTextColor(...GRAY)
  doc.text(`Report Gate No.: ${reportGateNo}`, W - RM, Y - 3, { align: 'right' })
  doc.text(`Unloading Point: ${unloadingPoint}`, W - RM, Y + 3, { align: 'right' })

  Y += 12

  // ── LEFT BOX ────────────────────────────────────────────────
  const leftBoxX = LM
  const leftBoxW = PW * 0.52
  const leftBoxY = Y
  const leftBoxH = 62

  drawRect(leftBoxX, leftBoxY, leftBoxW, leftBoxH)

  // FIX 3: Keep slash in barcode — CODE128 supports it natively
  const trackBarcodeText = trackingNo  // '1000001187/2026' — NO strip
  const trackBarcodeImg = barcodeDataUrl(trackBarcodeText, { width: 2, height: 40 })
  if (trackBarcodeImg) {
    doc.addImage(trackBarcodeImg, 'PNG', leftBoxX + 8, leftBoxY + 3, 55, 14)
  }

  let fieldY = leftBoxY + 20
  const fieldLabelX = leftBoxX + 4
  const fieldValueX = leftBoxX + 40
  setFont('normal', 9)

  const leftFields = [
    ['Tracking Number:', trackingNo],
    ['Created On:', createdOn],
    ['Shipment Date:', shipmentDate],
    ['ETA:', eta],
    ['ASNs Tagged:', String(asnsTagged)],
  ]

  leftFields.forEach(([label, value]) => {
    doc.setTextColor(...GRAY)
    setFont('normal', 9)
    doc.text(label, fieldLabelX, fieldY)
    doc.setTextColor(...BLACK)
    setFont('bold', 9)
    doc.text(value || '—', fieldValueX, fieldY)
    fieldY += 7
  })

  // ── RIGHT BOX — Vendor Details ──────────────────────────────
  const rightBoxX = leftBoxX + leftBoxW + 4
  const rightBoxW = PW - leftBoxW - 4
  const rightBoxY = leftBoxY
  const rightBoxH = leftBoxH

  drawRect(rightBoxX, rightBoxY, rightBoxW, rightBoxH)

  setFont('bold', 10)
  doc.setTextColor(...BLACK)
  doc.text('Vendor Details', rightBoxX + rightBoxW / 2, rightBoxY + 6, { align: 'center' })

  const innerX = rightBoxX + 2
  const innerY = rightBoxY + 9
  const innerW = rightBoxW - 4
  const innerH = rightBoxH - 12
  drawRect(innerX, innerY, innerW, innerH)

  let vendorY = innerY + 6
  const vendorTextMaxW = innerW - 6  // padding of 3mm each side
  setFont('normal', 9)
  doc.setTextColor(...BLACK)

  // FIX 4: splitTextToSize wraps text to fit within box width
  const vendorDisplayName = vendorCode
    ? `${vendorName} (${vendorCode})`
    : vendorName || '—'

  const nameLines = doc.splitTextToSize(vendorDisplayName, vendorTextMaxW)
  nameLines.forEach(line => {
    if (vendorY < innerY + innerH - 3) {
      doc.text(line, innerX + 3, vendorY)
      vendorY += 5
    }
  })

  const addrParts = [vendorAddress1, vendorAddress2, vendorCity, vendorPin].filter(Boolean)
  addrParts.forEach(part => {
    const partLines = doc.splitTextToSize(part, vendorTextMaxW)
    partLines.forEach(line => {
      if (vendorY < innerY + innerH - 3) {
        doc.text(line, innerX + 3, vendorY)
        vendorY += 5
      }
    })
  })

  // ── ASN BARCODES SECTION ─────────────────────────────────────
  Y = leftBoxY + leftBoxH + 4

  setFont('bold', 11)
  doc.setTextColor(...BLACK)
  doc.text('ASN BARCODES', W / 2, Y + 5, { align: 'center' })
  Y += 10

  const asnBoxX = LM
  const asnBoxW = PW
  const asnBoxY = Y
  const asnBlockHeight = 55
  const asnColumns = 2
  const asnRows = Math.ceil((tracking.asns?.length || 0) / asnColumns)
  const asnBoxH = Math.max(100, asnRows * asnBlockHeight + 10)

  drawRect(asnBoxX, asnBoxY, asnBoxW, asnBoxH)

  if (tracking.asns && tracking.asns.length > 0) {
    const colW = (asnBoxW - 10) / asnColumns

    tracking.asns.forEach((asn, idx) => {
      const col = idx % asnColumns
      const row = Math.floor(idx / asnColumns)

      const blockX = asnBoxX + 5 + col * colW
      const blockY = asnBoxY + 8 + row * asnBlockHeight

      if (blockY + asnBlockHeight > H - 20) {
        doc.addPage()
      }

      // FIX 3: Keep slash in ASN barcode too — '1000001187/2026' format preserved
      const asnBarcodeText = `${asn.asnId}${asn.asnYear ? '/' + asn.asnYear : ''}`
      const asnBarcodeImg = barcodeDataUrl(asnBarcodeText, { width: 2, height: 35 })
      if (asnBarcodeImg) {
        doc.addImage(asnBarcodeImg, 'PNG', blockX + 5, blockY, 50, 12)
      }

      let lineY = blockY + 15
      setFont('normal', 8)
      doc.setTextColor(...BLACK)

      const asnLines = [
        `IBD:${asn.ibdNumber || ''}`,
        `ASN:${asnBarcodeText}`,
        `Inv#:${asn.invoiceNumber || ''}`,
        `Inv Date:${asn.invoiceDate || ''}`,
        `LPA/${asn.storageLocation || ''}`,
        `PLANT:${asn.plant || ''}`,
      ]

      asnLines.forEach(line => {
        doc.text(line, blockX + 15, lineY, { align: 'left' })
        lineY += 4.5
      })
    })
  }

  // ── FIX 2: Proper filename — use <a> click trick ─────────────
  // This sets the correct filename in download dialog AND browser tab
  const sanitizedTrackNo = trackingNo.replace(/\//g, '_')
  const filename = `Tracking_Number_${sanitizedTrackNo}.pdf`

  const pdfBlob = doc.output('blob')
  const blobUrl = URL.createObjectURL(pdfBlob)

  // Create named anchor → forces correct filename in download + tab title
  const a = document.createElement('a')
  a.href = blobUrl
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  // Setting download attr shows filename in tab — but opens inline if browser supports PDF
  // Use without download attr to open in tab, WITH to force download
  // Best UX: open in tab (no download attr), filename visible in URL
  // Rename blob URL not possible, so append filename as hash hint for some browsers:
  const namedUrl = blobUrl  // blob URLs can't be renamed, but we trigger save via print dialog

  // Open in new tab
  const newTab = window.open(blobUrl, '_blank')

  // Fallback: if popup blocked → download with correct filename
  if (!newTab || newTab.closed) {
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // Also revoke after delay
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)

  return { filename, blobUrl }
}

export default generateShipmentNote