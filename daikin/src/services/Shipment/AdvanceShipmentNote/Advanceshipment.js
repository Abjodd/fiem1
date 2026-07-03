const ODATA_BASE = '/sap/opu/odata/SHIV/MO_SUPP_PORTAL_ASN_APP_SRV'
export const authConfig = { loginId: '', loginType: '' }


async function fetchCsrfToken() {
  const res = await fetch(`${ODATA_BASE}/ASN_HEADERSet?$top=1&$format=json`, {
    headers: {
      'X-CSRF-Token': 'Fetch',
      Loginid: authConfig.loginId,
      Logintype: authConfig.loginType,
    },
  })
  return res.headers.get('x-csrf-token') || ''
}
// ── base GET helper ──
async function odataGet(path) {
  const res = await fetch(`${ODATA_BASE}${path}`, {
    headers: { Accept: 'application/json',      
          Loginid: authConfig.loginId,
          Logintype: authConfig.loginType, },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`)
  return res.json()
}

const TRANS_MODE = { '01': 'By Road', '02': 'By Air', '03': 'By Ship', '04': 'By Rail' }
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
      transportMode: TRANS_MODE[str(d.TransportMode)] || str(d.TransportMode),
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
  let mime = str(d.Mimetype).toLowerCase()

  // Derive mime from filename extension if SAP leaves it empty/wrong
  if (!mime || mime === 'application/octet-stream') {
    const ext = name.split('.').pop().toLowerCase()
    const mimeMap = {
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      txt: 'text/plain',
      csv: 'text/csv',
    }
    mime = mimeMap[ext] || mime || 'application/octet-stream'
  }

  const content = str(d.FileContent || d.Content || d.Value || '')

  // Extract SAP OData entity URI — needed for /$value binary download
  const entityUri = d.__metadata?.uri || ''
  // Some SAP services expose media_src for media-link entries
  const mediaSrc = d.__metadata?.media_src || ''

  return {
    name,
    type: mime.includes('pdf') ? 'PDF' : 'FILE',
    mime,
    content,
    entityUri,
    mediaSrc,
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

  // Download attachment — tries four strategies in order:
  //   1. base64/hex content already inline (FileContent field)
  //   2. SAP entity URI + /$value (binary stream — most reliable)
  //   3. SAP media_src URL (media-link entries)
  //   4. direct Url field fallback
  async downloadAttachment(asnNum, fisYear, attachment) {
    const { name, mime, content, downloadUrl, entityUri, mediaSrc } = attachment

    // Strategy 1 — inline base64 or hex content
    if (content) {
      try {
        triggerDownload(decodeContentToBlob(content, mime), name)
        return
      } catch (err) {
        console.warn('Inline content decode failed, trying other strategies:', err)
      }
    }

    // Strategy 2 — entity URI + /$value (standard SAP OData binary stream)
    if (entityUri) {
      try {
        // entityUri from SAP is absolute (https://saphost:port/sap/opu/...)
        // Convert to relative path so Vite proxy works
        let valueUrl = entityUri
        try {
          const parsed = new URL(entityUri)
          valueUrl = parsed.pathname
        } catch {
          // already relative
        }
        valueUrl = valueUrl + '/$value'

        const res = await fetch(valueUrl, {
          headers: { Accept: mime || 'application/octet-stream',
                      Loginid: authConfig.loginId,
          Logintype: authConfig.loginType,
           },
          credentials: 'include',
        })
        if (res.ok) {
          const blob = await res.blob()
          triggerDownload(new Blob([blob], { type: mime }), name)
          return
        }
        console.warn('entityUri/$value fetch status:', res.status)
      } catch (err) {
        console.warn('entityUri/$value fetch failed:', err)
      }
    }

    // Strategy 3 — SAP media_src (media-link entry pattern)
    if (mediaSrc) {
      try {
        let srcUrl = mediaSrc
        try { srcUrl = new URL(mediaSrc).pathname } catch {}
        const res = await fetch(srcUrl, {
          headers: { Accept: mime || 'application/octet-stream',
                      Loginid: authConfig.loginId,
          Logintype: authConfig.loginType,
           },
          credentials: 'include',
        })
        if (res.ok) {
          const blob = await res.blob()
          triggerDownload(new Blob([blob], { type: mime }), name)
          return
        }
      } catch (err) {
        console.warn('media_src fetch failed:', err)
      }
    }

    // Strategy 4 — direct Url field
    if (downloadUrl) {
      try {
        const res = await fetch(downloadUrl, { credentials: 'include' })
        if (res.ok) {
          const blob = await res.blob()
          triggerDownload(new Blob([blob], { type: mime }), name)
          return
        }
      } catch (err) {
        console.warn('downloadUrl fetch failed:', err)
      }
    }

    throw new Error('No download strategy available for this attachment')
  },

  // Print — log for now; wire to backend print endpoint when available
  async printAsn(id) {
    console.log('print requested for', id)
    return { success: true, id }
  },

  // Cancel — DELETE /ASN_HEADERSet(Asn_Num='...',FisYear='...')
async cancelAsn(id) {
  const [asnNum, fisYear] = id.split('/')

  // fetch CSRF token first
  const csrfToken = await fetchCsrfToken()

  const res = await fetch(
    `${ODATA_BASE}/ASN_HEADERSet(Asn_Num='${asnNum}',FisYear='${fisYear}')`,
    {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'X-CSRF-Token': csrfToken,
        Loginid: authConfig.loginId,
        Logintype: authConfig.loginType,
      },
    }
  )
  if (!res.ok) throw new Error(`Cancel failed: HTTP ${res.status}`)
  return { success: true, id }
},
}

// ═══════════════════════════════════════════════════════════════
// PRIVATE UTILS
// ═══════════════════════════════════════════════════════════════

// Robust decoder — handles base64, hex, data-URI, whitespace/newlines
function decodeContentToBlob(raw, mime = 'application/octet-stream') {
  let clean = raw

  // Strip data-URI prefix if present (e.g. "data:application/pdf;base64,AAAA…")
  if (clean.includes(',')) {
    const parts = clean.split(',')
    // Only strip if it looks like a data URI (first part contains "base64" or "data:")
    if (parts[0].includes('base64') || parts[0].includes('data:')) {
      clean = parts.slice(1).join(',')
    }
  }

  // Remove ALL whitespace / newlines SAP often injects into base64
  clean = clean.replace(/[\s\r\n]+/g, '')

  // If empty after cleaning, throw
  if (!clean) throw new Error('Empty content after cleaning')

  // Detect hex-encoded content (SAP sometimes returns hex instead of base64)
  // Hex string: only 0-9 A-F chars, even length
  // "25504446" = "%PDF" header in hex
  const isHex = /^[0-9A-Fa-f]+$/.test(clean) && clean.length % 2 === 0 && clean.length > 8
  if (isHex) {
    const bytes = new Uint8Array(clean.length / 2)
    for (let i = 0; i < clean.length; i += 2) {
      bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16)
    }
    return new Blob([bytes], { type: mime })
  }

  // Fix base64 padding if missing
  while (clean.length % 4 !== 0) clean += '='

  // Decode base64
  const binary = atob(clean)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function triggerDownload(blob, filename) {
  // Ensure blob has correct mime type from filename if missing
  let finalBlob = blob
  if (!blob.type || blob.type === 'application/octet-stream') {
    const ext = filename.split('.').pop().toLowerCase()
    const mimeMap = { pdf:'application/pdf', png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', gif:'image/gif', txt:'text/plain' }
    if (mimeMap[ext]) finalBlob = new Blob([blob], { type: mimeMap[ext] })
  }

  const url = URL.createObjectURL(finalBlob)

  // Always open in new tab — browser renders PDFs/images natively,
  // prompts download for unsupported types
  const newTab = window.open(url, '_blank')
  if (newTab && !newTab.closed) {
    // Keep blob URL alive so new tab can load it
    setTimeout(() => URL.revokeObjectURL(url), 120000)
    return
  }

  // Popup blocked → fall back to download
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}