const ODATA_BASE = '/sap/opu/odata/shiv/MO_SUPP_PORTAL_ASN_APP_SRV'

// ── base GET helper ──
async function odataGet(path) {
  const res = await fetch(`${ODATA_BASE}${path}`, {
    headers: { Accept: 'application/json', Loginid: "manishgupta8@kpmg.com",
        Logintype: "E", },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`)
  return res.json()
}

// ── value helpers ──
const num = (v) => Number(String(v ?? '').trim() || 0)
const str = (v) => String(v ?? '').trim()

// SAP "20260520" → "20.05.2026"
const sapDate = (v) => {
  const s = str(v)
  if (s.length !== 8) return s
  return `${s.slice(6, 8)}.${s.slice(4, 6)}.${s.slice(0, 4)}`
}

// SAP "122800" → "12:28:00"
const sapTime = (v) => {
  const s = str(v).padStart(6, '0')
  return `${s.slice(0, 2)}:${s.slice(2, 4)}:${s.slice(4, 6)}`
}

// ── status derivation ──
function deriveStatus(d) {
  if (d.Cancel === true || str(d.Cancel) === 'X') return { status: 'Cancelled', color: 'red' }
  if (str(d.Status)) {
    const s = str(d.Status)
    return { status: s, color: s.toLowerCase() === 'confirmed' ? 'blue' : 'red' }
  }
  if (str(d.Tagged) === 'X') return { status: 'Tagged', color: 'red' }
  if (str(d.Draft) === 'X') return { status: 'Draft', color: 'green' }
  return { status: 'Open', color: 'green' }
}

// ── mappers ──
function mapHeader(d) {
  const { status, color } = deriveStatus(d)
  const baseDoc = `${str(d.Type_text)} ${str(d.Order_num)}`.trim()
  return {
    id: `${str(d.Asn_Num)}/${str(d.FisYear)}`,
    asnNum: str(d.Asn_Num),
    fisYear: str(d.FisYear),
    amount: num(d.TotAmt),
    currency: str(d.currency) || 'INR',
    baseDocument: baseDoc,
    plant: str(d.Werks),
    plantName: str(d.Plant_des),
    date: sapDate(d.Invoice_Date),
    status,
    statusColor: color,
    vendor: str(d.Name1),
    generalData: {
      supplierInvoice: str(d.Invoice_Num),
      baseDocument: baseDoc,
      invoiceAmount: num(d.Invoice_Amt),
      invoiceDate: sapDate(d.Invoice_Date),
    },
    shipment: {
      trackingNo: str(d.TrackingNo),
      driverName: str(d.NameDrvr),
      contactNumber: str(d.DrvContactNum),
      transporterName: str(d.TransporterName),
      transportMode: str(d.Transport),
      vehicleRegNo: str(d.VehicleRegNumb),
      creationDate: sapDate(d.CreationDt),
      creationTime: sapTime(d.CreationTime),
    },
    items: [],
    taxSummary: { taxableValue: 0, igst: 0, cgst: 0, sgstUtgst: 0, unPlannedCost: 0, totalAmount: 0 },
    attachments: [],
  }
}

function mapItem(d) {
  return {
    deliveryDate: sapDate(d.Delv_dt),
    material: str(d.Mat_txt) || str(d.Material),
    quantity: num(d.Quantity),
    unit: str(d.Unit),
    amount: num(d.Net_price),
    hsnSac: str(d.HsnCode),
    igst: num(d.Tot_igst),
    cgst: num(d.Tot_cgst),
    sgstUtgst: num(d.Tot_sgst),
    unplannedCost: num(d.UnplannedCost),
  }
}

function mapAttachment(d) {
  const name = str(d.Filename)
  const mime = str(d.Mimetype).toLowerCase()
  // SAP GOS stores base64 content in FileContent or Content field
  const content = str(d.FileContent || d.Content || '')
  return {
    name,
    type: mime.includes('pdf') ? 'PDF' : 'FILE',
    mime: mime || 'application/octet-stream',
    content, // base64 string — may be empty if SAP streams separately
    // URL-based download fallback (SAP GOS value help pattern)
    downloadUrl: d.Url ? str(d.Url) : null,
  }
}

// ═══════════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════════
export const asnApi = {

  // GET /ASN_HEADERSet?$format=json
  async listAsns({ search = '', plants = [] } = {}) {
    const json = await odataGet('/ASN_HEADERSet?$format=json')
    let rows = (json.d?.results || []).map(mapHeader)
    const q = search.trim().toLowerCase()
    if (q) rows = rows.filter(a =>
      a.id.toLowerCase().includes(q) ||
      a.plantName.toLowerCase().includes(q) ||
      a.plant.toLowerCase().includes(q) ||
      a.baseDocument.toLowerCase().includes(q) ||
      a.vendor.toLowerCase().includes(q)
    )
    if (plants.length) rows = rows.filter(a => plants.includes(a.plant))
    return rows
  },

  // GET /ASN_HEADERSet(Asn_Num='...',FisYear='...')?$expand=Headertoitemnav&$format=json
  async getAsn(id) {
    const [asnNum, fisYear] = id.split('/')
    const json = await odataGet(
      `/ASN_HEADERSet(Asn_Num='${asnNum}',FisYear='${fisYear}')?$expand=Headertoitemnav&$format=json`
    )
    const d = json.d
    if (!d) return null

    const asn = mapHeader(d)
    const itemRows = d.Headertoitemnav?.results || []
    asn.items = itemRows.map(mapItem)

    // derive tax summary from items
    const sum = (k) => asn.items.reduce((t, it) => t + (it[k] || 0), 0)
    const taxable = sum('amount')
    const igst = sum('igst')
    const cgst = sum('cgst')
    const sgst = sum('sgstUtgst')
    const unplanned = sum('unplannedCost')
    asn.taxSummary = {
      taxableValue: taxable,
      igst, cgst, sgstUtgst: sgst,
      unPlannedCost: unplanned,
      totalAmount: taxable + igst + cgst + sgst + unplanned,
    }
    return asn
  },

  // GET /AsnAttachmentSet?$filter=AsnNum eq '...' and FisYear eq '...'&$format=json
  async getAttachments(asnNum, fisYear) {
  const filter = `AsnNum eq '${asnNum}' and FisYear eq '${fisYear}'`
  const json = await odataGet(
    `/AsnAttachmentSet?$filter=${encodeURIComponent(filter)}&$format=json`
  )
  // ── TEMP DEBUG ──
  console.log('RAW attachment response:', JSON.stringify(json.d?.results?.[0], null, 2))
  // ────────────────
  return (json.d?.results || []).map(mapAttachment)
},

  

  // Download attachment — tries three strategies in order:
  //   1. base64 content already in the record (FileContent field)
  //   2. direct URL from the record (Url field)
  //   3. fetch raw bytes from OData $value endpoint
  async downloadAttachment(asnNum, fisYear, attachment) {
    const { name, mime, content, downloadUrl } = attachment

    // Strategy 1 — base64 content in record
    if (content) {
      triggerDownload(base64ToBlob(content, mime), name)
      return
    }

    // Strategy 2 — pre-signed / GOS URL
    if (downloadUrl) {
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = name
      a.target = '_blank'
      a.click()
      return
    }

    // Strategy 3 — fetch $value from OData
    // Adjust key fields if SAP uses different keys for AsnAttachmentSet
    const filter = `AsnNum eq '${asnNum}' and FisYear eq '${fisYear}' and Filename eq '${encodeURIComponent(name)}'`
    const url = `${ODATA_BASE}/AsnAttachmentSet?$filter=${encodeURIComponent(filter)}&$format=json`
    const res = await fetch(url, { headers: { Accept: mime || 'application/octet-stream' } })
    if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`)
    const blob = await res.blob()
    triggerDownload(blob, name)
  },

  // Print — log for now; wire to backend print endpoint when available
  async printAsn(id) {
    console.log('print requested for', id)
    return { success: true, id }
  },

  // Cancel — DELETE /ASN_HEADERSet(Asn_Num='...',FisYear='...')
  async cancelAsn(id) {
    const [asnNum, fisYear] = id.split('/')
    const res = await fetch(
      `${ODATA_BASE}/ASN_HEADERSet(Asn_Num='${asnNum}',FisYear='${fisYear}')`,
      { method: 'DELETE', headers: { Accept: 'application/json' } }
    )
    if (!res.ok) throw new Error(`Cancel failed: HTTP ${res.status}`)
    return { success: true, id }
  },
}

// ═══════════════════════════════════════════════════════════════
// PRIVATE UTILS
// ═══════════════════════════════════════════════════════════════

function base64ToBlob(base64, mime = 'application/octet-stream') {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}