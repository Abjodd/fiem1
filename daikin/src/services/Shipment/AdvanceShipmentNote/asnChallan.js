
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
      format: 'CODE39',
      width: opts.width || 2,
      height: opts.height || 55,
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

function qrDataUrl(text, opts = {}) {
  return new Promise((resolve) => {
    try {
      window.QRCode.toDataURL(
        text,
        { width: opts.size || 200, margin: 0, errorCorrectionLevel: 'M' },
        (err, url) => {
          if (err) { console.error('QR generation failed:', err); resolve(null); return }
          resolve(url)
        }
      )
    } catch (err) {
      console.error('QR generation failed:', err)
      resolve(null)
    }
  })
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

  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
  await loadScript('https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js')
  await loadScript('https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js')

  const { jsPDF } = window.jspdf

  // A4 dimensions
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const setFont = (style = 'normal', size = 10) => {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
  }

  const logoDataUrl = await fetchLogoDataUrl()

  const tagW = 180
  const tagH = 65
  const gap = 5
  const leftMargin = 15 // (210 - 180) / 2
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
    doc.rect(leftMargin, offsetY, tagW, tagH) // outer border

    // ── Field values ──
    const barcodeValue = tag.barcodeValue || '2600000140//C3'
    const qrValue = tag.qrValue ||
      '7000037126/00040/0001/NMR/08.07.2026/22.12.2025/1P302790-1 G/15/1/2/2600000140/2026/153348/*'

    const partNumber   = tag.partNumber   || '1P302790-1G'
    const partDesc     = tag.partDesc     || 'DISCH.GRILLE'
    const qty          = tag.qty          || '15.000-NO'
    const poNo         = tag.poNo         || '7000037126'
    const poItem       = tag.poItem       || '00040'
    const poSubItem    = tag.poSubItem    || '0001'
    const invNo        = tag.invNo        || '-0O,'
    const supplierCode = tag.supplierCode || '401122'
    const supplierName = tag.supplierName || 'Kunstocom(India) Ltd'
    const plant        = tag.plant        || 'NMR'
    const boxNo        = tag.boxNo        || '1'
    const totalBoxes   = tag.totalBoxes   || '2'
    const delDate      = tag.delDate      || '22.12.2025'
    const issueDate    = tag.issueDate    || '08.07.2026'
    const expiryDate   = tag.expiryDate   || ''

    // ── Column anchors ──
    const LX = leftMargin + 4
    const MX = leftMargin + 53
    const RX = leftMargin + 174

    // ── Row 1 ──
    setFont('bold', 15); doc.text(partNumber, LX, offsetY + 8)
    setFont('bold', 12); doc.text(`QTY- ${qty}`, MX, offsetY + 8)
    setFont('bold', 11); doc.text(`${boxNo}/${totalBoxes} BOX`, RX, offsetY + 8, { align: 'right' })

    // ── Row 2 ──
    setFont('normal', 7.5)
    doc.text(`DEL DATE- ${delDate}`, RX, offsetY + 14, { align: 'right' })

    // ── Info block ──
    let fy = offsetY + 18
    setFont('normal', 8)
    ;[
      partDesc,
      `PO No - ${poNo} : ${poItem} : ${poSubItem}`,
      `INV. No - ${invNo}`,
      `SUPPLIER CODE - ${supplierCode}`,
      `SUPPLIER NAME - ${supplierName}`,
    ].forEach(line => { doc.text(line, MX, fy); fy += 4.3 })

    // ── QR code ──
    const qrImg = await qrDataUrl(qrValue, { size: 200 })
    if (qrImg) doc.addImage(qrImg, 'PNG', LX, offsetY + 13, 17, 17)
    setFont('bold', 7); doc.text('PART TAG', LX, offsetY + 38)

    // ── Barcode ──
    const barcodeImg = barcodeDataUrl(barcodeValue, { width: 2, height: 55 })
    if (barcodeImg) doc.addImage(barcodeImg, 'PNG', MX, offsetY + 40, 42, 11)

    // ── Plant code ──
    setFont('bold', 24); doc.text(plant, MX + 48, offsetY + 49)

    // ── Logo ──
    const logoToDraw = tag.logoDataUrl || logoDataUrl
    if (logoToDraw) {
      doc.addImage(logoToDraw, 'PNG', MX, offsetY + 53, 30, 10)
    } else {
      setFont('bold', 13); doc.text('FIEM', MX, offsetY + 58)
    }

    // ── Issue / Expiry ──
    setFont('normal', 7.5)
    doc.text(`ISSUE DATE- ${issueDate}`, RX, offsetY + 46, { align: 'right' })
    doc.text(`EXPIRY DATE- ${expiryDate}`, RX, offsetY + 51, { align: 'right' })
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

  const newTab = window.open(blobUrl, '_blank')
  if (!newTab || newTab.closed) {
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
  return { filename, blobUrl }
}

export default generatePartTags