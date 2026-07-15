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
const num = (v) => Number(String(v ?? '').trim() || 0)
const str = (v) => String(v ?? '').trim()

const sapDate = (v) => {
  const s = str(v)
  if (s.length !== 8) return s
  return `${s.slice(6, 8)}.${s.slice(4, 6)}.${s.slice(0, 4)}`
}

const sapTime = (v) => {
  const s = str(v).padStart(6, '0')
  return `${s.slice(0, 2)}:${s.slice(2, 4)}:${s.slice(4, 6)}`
}

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
    lifnr: str(d.Lifnr),
    orderNum: str(d.Order_num),
    creationTime: str(d.CreationTime),
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
    materialCode: str(d.Material),
    quantity: num(d.Quantity),
    unit: str(d.Unit),
    amount: num(d.Net_price),
    hsnSac: str(d.HsnCode),
    igst: num(d.Tot_igst),
    cgst: num(d.Tot_cgst),
    sgstUtgst: num(d.Tot_sgst),
    unplannedCost: num(d.UnplannedCost),
    itemNo: str(d.ItemNo),
    schdLine: str(d.schd_line),
    poItem: str(d.Ebelp || d.PoItem || ''),
    poSubItem: str(d.Etenr || d.PoSubItem || ''),
  }
}

function mapAttachment(d) {
  const name = str(d.Filename)
  let mime = str(d.Mimetype).toLowerCase()

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

  const entityUri = d.__metadata?.uri || ''
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

export function buildPartTag(asn, item, opts = {}) {
  const boxNo = String(opts.boxNo ?? '1')
  const totalBoxes = String(opts.totalBoxes ?? '1')

  const poNo = asn.orderNum || ''
  const itemNo = item?.itemNo || ''
  const schdLine = item?.schdLine || ''

  const qrValue = [
    poNo,
    itemNo,
    schdLine,
    asn.plant,
    asn.shipment?.creationDate || '',
    item?.deliveryDate || '',
    item?.materialCode || '',
    item?.quantity ?? '',
    boxNo,
    totalBoxes,
    asn.asnNum,
    asn.fisYear,
    asn.creationTime || '',
    '*',
  ].join('/')

  return {
    barcodeValue: asn.asnNum || '',
    qrValue,
    partNumber: item?.materialCode || '',
    partDesc: item?.material || '',
    qty: `${item?.quantity ?? ''}-${item?.unit || 'NO'}`,
    poNo,
    poItem: itemNo,
    poSubItem: schdLine,
    invNo: asn.generalData?.supplierInvoice || '',
    supplierCode: asn.lifnr || '',
    supplierName: asn.vendor || '',
    plant: asn.plant,
    plantDesc: asn.plantName || '',
    boxNo,
    totalBoxes,
    delDate: item?.deliveryDate || '',
    issueDate: asn.shipment?.creationDate || '',
    expiryDate: '',
  }
}

export const asnApi = {

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

  async getAttachments(asnNum, fisYear) {
    const filter = `AsnNum eq '${asnNum}' and FisYear eq '${fisYear}'`
    const json = await odataGet(
      `/AsnAttachmentSet?$filter=${encodeURIComponent(filter)}&$format=json`
    )
    console.log('RAW attachment response:', JSON.stringify(json.d?.results?.[0], null, 2))
    return (json.d?.results || []).map(mapAttachment)
  },

  async downloadAttachment(asnNum, fisYear, attachment) {
    const { name, mime, content, downloadUrl, entityUri, mediaSrc } = attachment

    if (content) {
      try {
        triggerDownload(decodeContentToBlob(content, mime), name)
        return
      } catch (err) {
        console.warn('Inline content decode failed, trying other strategies:', err)
      }
    }

    if (entityUri) {
      try {
        let valueUrl = entityUri
        try {
          const parsed = new URL(entityUri)
          valueUrl = parsed.pathname
        } catch {
        }
        valueUrl = valueUrl + '/$value'

        const res = await fetch(valueUrl, {
          headers: { Accept: mime || 'application/octet-stream',
                      Loginid: authConfig.loginId,
          Logintype: authConfig.loginType
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

    if (mediaSrc) {
      try {
        let srcUrl = mediaSrc
        try { srcUrl = new URL(mediaSrc).pathname } catch {}
        const res = await fetch(srcUrl, {
          headers: { Accept: mime || 'application/octet-stream',
                      Loginid: authConfig.loginId,
          Logintype: authConfig.loginType
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

  async printAsn(id) {
    console.log('print requested for', id)
    return { success: true, id }
  },

async cancelAsn(id) {
  const [asnNum, fisYear] = id.split('/')

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

function decodeContentToBlob(raw, mime = 'application/octet-stream') {
  let clean = raw

  if (clean.includes(',')) {
    const parts = clean.split(',')
    if (parts[0].includes('base64') || parts[0].includes('data:')) {
      clean = parts.slice(1).join(',')
    }
  }

  clean = clean.replace(/[\s\r\n]+/g, '')

  if (!clean) throw new Error('Empty content after cleaning')

  const isHex = /^[0-9A-Fa-f]+$/.test(clean) && clean.length % 2 === 0 && clean.length > 8
  if (isHex) {
    const bytes = new Uint8Array(clean.length / 2)
    for (let i = 0; i < clean.length; i += 2) {
      bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16)
    }
    return new Blob([bytes], { type: mime })
  }

  while (clean.length % 4 !== 0) clean += '='

  const binary = atob(clean)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function triggerDownload(blob, filename) {
  let finalBlob = blob
  if (!blob.type || blob.type === 'application/octet-stream') {
    const ext = filename.split('.').pop().toLowerCase()
    const mimeMap = { pdf:'application/pdf', png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', gif:'image/gif', txt:'text/plain' }
    if (mimeMap[ext]) finalBlob = new Blob([blob], { type: mimeMap[ext] })
  }

  const url = URL.createObjectURL(finalBlob)

  const newTab = window.open(url, '_blank')
  if (newTab && !newTab.closed) {
    setTimeout(() => URL.revokeObjectURL(url), 120000)
    return
  }

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}