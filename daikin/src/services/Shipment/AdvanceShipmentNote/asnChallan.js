import { jsPDF } from 'jspdf'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'

// ── Barcode: CODE128 format ──
function barcodeDataUrl(text, opts = {}) {
  const canvas = document.createElement('canvas')
  try {
    JsBarcode(canvas, text, {
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

async function qrDataUrl(text, opts = {}) {
  try {
    return await QRCode.toDataURL(text, {
      width: opts.size || 200,
      margin: 0,
      errorCorrectionLevel: 'M',
    })
  } catch (err) {
    console.error('QR generation failed:', err)
    return null
  }
}

async function fetchLogoDataUrl() {
  try {
    const res = await fetch('/fiemChallan.png')
    const blob = await res.blob()
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  } catch (err) {
    console.error('Failed to load FIEM logo', err)
    return null
  }
}

// ── PART TAG GENERATOR ─────────────────────────────────────────
export async function generatePartTags(tags = []) {
  if (!tags.length) tags = [{}] // fallback for empty call

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const setFont = (style = 'normal', size = 10) => {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
  }

  const logoDataUrl = await fetchLogoDataUrl()

  const tagW = 180
  const tagH = 65
  const gap = 5
  const leftMargin = 15
  const topMargin = 15

  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i]

    // Page break after 4 tags
    if (i > 0 && i % 4 === 0) {
      doc.addPage()
    }

    const positionIndex = i % 4
    const offsetY = topMargin + positionIndex * (tagH + gap)

    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.5)
    doc.rect(leftMargin, offsetY, tagW, tagH)

    // ── Field values ──
    const barcodeValue = tag.barcodeValue || '1100000093'
    const qrValue = tag.qrValue || ''

    const partNumber   = tag.partNumber   || ''
    const partDesc     = tag.partDesc     || ''
    const qty          = tag.qty          || ''
    const poNo         = tag.poNo         || ''
    const poItem       = tag.poItem       || ''
    const poSubItem    = tag.poSubItem    || ''
    const invNo        = tag.invNo        || ''
    const supplierCode = tag.supplierCode || ''
    const supplierName = tag.supplierName || ''
    const plant        = tag.plant        || ''
    const plantDesc    = tag.plantDesc    || ''
    const boxNo        = tag.boxNo        || '1'
    const totalBoxes   = tag.totalBoxes   || '1'
    const delDate      = tag.delDate      || ''
    const issueDate    = tag.issueDate    || ''
    const expiryDate   = tag.expiryDate   || ''

    // ── Column anchors ──
    const LX = leftMargin + 4
    const MX = leftMargin + 53
    const RX = leftMargin + tagW - 6

    // ── Row 1 — Material Code / QTY / Box count ──
    setFont('bold', 15); doc.text(partNumber, LX, offsetY + 8)
    setFont('bold', 12); doc.text(`QTY- ${qty}`, MX, offsetY + 8)
    setFont('bold', 11); doc.text(`${boxNo}/${totalBoxes} BOX`, RX, offsetY + 8, { align: 'right' })

    // ── Row 2 — DEL DATE (right-aligned) ──
    setFont('normal', 7.5)
    doc.text(`DEL DATE- ${delDate}`, RX, offsetY + 14, { align: 'right' })

    // ── Info block (mid column, 5 lines) ──
    let fy = offsetY + 18
    setFont('normal', 8)

    const maxInfoWidth = tagW - 53 - 8
    const truncate = (text, maxW) => {
      if (doc.getTextWidth(text) <= maxW) return text
      while (text.length > 0 && doc.getTextWidth(text + '...') > maxW) {
        text = text.slice(0, -1)
      }
      return text + '...'
    }

    ;[
      partDesc,
      `PO No - ${poNo} : ${poItem} : ${poSubItem}`,
      `INV. No - ${invNo}`,
      `SUPPLIER CODE - ${supplierCode}`,
      `SUPPLIER NAME - ${truncate(supplierName, maxInfoWidth)}`,
    ].forEach(line => { doc.text(line, MX, fy); fy += 4.3 })

    // ── QR code — left column, above PART TAG ──
    if (qrValue) {
      const qrImg = await qrDataUrl(qrValue, { size: 200 })
      if (qrImg) doc.addImage(qrImg, 'PNG', LX, offsetY + 36, 18, 18)
    }

    // ── Barcode — mid column, lower area ──
    const barcodeImg = barcodeDataUrl(barcodeValue, { width: 2, height: 50 })
    if (barcodeImg) doc.addImage(barcodeImg, 'PNG', MX, offsetY + 40, 50, 12)

    // ── Plant code (Werks) — right-aligned, next to barcode row ──
    setFont('bold', 10); doc.text(`Plant : ${plant}`, RX, offsetY + 50, { align: 'right' })

    // ── "PART TAG" label — bottom-left corner ──
    setFont('bold', 7); doc.text('PART TAG', LX, offsetY + 58)

    // ── Logo — below barcode ──
    const logoToDraw = tag.logoDataUrl || logoDataUrl
    if (logoToDraw) {
      // Made larger and less compressed than the original 40x8 (now 35x10)
      doc.addImage(logoToDraw, 'PNG', MX, offsetY + 54, 35, 10)
    } else {
      setFont('bold', 13); doc.text('FIEM', MX, offsetY + 60)
    }

    // ── Issue / Expiry — right column ──
    setFont('normal', 7.5)
    doc.text(`ISSUE DATE- ${issueDate}`, RX, offsetY + 55, { align: 'right' })
    doc.text(`EXPIRY DATE- ${expiryDate}`, RX, offsetY + 59, { align: 'right' })

    // ── Plant Description — bottom-right, smaller font to fit ──
    if (plantDesc) {
      setFont('normal', 5.5)
      const truncatedPlantDesc = truncate(plantDesc, tagW - 53 - 8)
      doc.text(truncatedPlantDesc, RX, offsetY + 63, { align: 'right' })
    }
  }

  return doc
}

// ── OPEN / DOWNLOAD WRAPPER ──
export async function previewPartTags(tags = []) {
  const doc = await generatePartTags(tags)

  const firstTag = tags[0] || {}
  const idForName = (firstTag.barcodeValue || 'part-tags').replace(/\//g, '_')
  const filename = `Part_Tags_${idForName}.pdf`

  const pdfBlob = doc.output('blob')
  const blobUrl = URL.createObjectURL(pdfBlob)

  return { filename, blobUrl }
}

export default generatePartTags