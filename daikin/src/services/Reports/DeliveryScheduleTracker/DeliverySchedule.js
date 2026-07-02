// ═══════════════════════════════════════════════════════════════
// DeliveryScheduleApi.js — Schedule Tracker OData Service
// Service: SUPP_PORTAL_LOGISTICS_SRV
// ═══════════════════════════════════════════════════════════════

const SRV = '/sap/opu/odata/shiv/SUPP_PORTAL_LOGISTICS_SRV'
export const authConfig = { loginId: 'aryas@kpmg.com', loginType: 'E', bukrs: '1000' }

async function odata(path) {
  const res = await fetch(`${SRV}${path}`, {
    headers: {
      Accept: 'application/json',
      Loginid: authConfig.loginId,
      Logintype: authConfig.loginType,
    },
    credentials: 'include',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OData ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

const str = (v) => String(v ?? '').trim()

export const toSapDate = (isoDate) => {
  if (!isoDate) return ''
  return isoDate.replace(/-/g, '')
}

// ── Row mapper — GoodsMvtHeaderSet ───────────────────────────
function mapDeliveryRow(raw) {
  return {
    trackingNo:   str(raw.TrackNo),
    trackYear:    str(raw.Year ?? ''),
    plant:        str(raw.Plant),
    shipmentDate: str(raw.ShipDate),
    eta:          str(raw.Eta),
    ata:          str(raw.InDate),
    status:       str(raw.StatusText),
    timeDelay:    str(raw.DelayInd),
    city:         str(raw.City),
    supplier:     str(raw.Name),
    vendorCode:   str(raw.Vendor ?? raw.Lifnr ?? ''),
    // These fields enable client-side filtering as a safety net
    // in case the SAP server does not filter them correctly.
    // If GoodsMvtHeaderSet does not return these fields,
    // they will be empty strings — client filter will skip them gracefully.
    material:     str(raw.Matnr  ?? raw.Material ?? ''),
    asn:          str(raw.AsnNum ?? raw.Asn      ?? ''),
    invoiceNo:    str(raw.InvNo  ?? raw.Invoice  ?? ''),
  }
}

// ── Detail mapper — AsnDetailsSet ────────────────────────────
function mapDetailItem(raw) {
  const qty  = str(raw.Menge ?? '')
  const unit = str(raw.Meins ?? '')
  return {
    asn:           str(raw.Asn ?? ''),
    asnYear:       str(raw.AsnYear ?? ''),
    ibd:           str(raw.Ibd ?? ''),
    baseDoc:       str(raw.Ebeln ?? ''),
    docType:       str(raw.Type ?? ''),
    purchaseGroup: str(raw.PurGrp ?? ''),
    invoice:       str(raw.Invoice ?? ''),
    material:      str(raw.Matnr ?? ''),
    description:   str(raw.Maktx ?? ''),
    qty:           unit ? `${qty} ${unit}` : qty,
  }
}

// ═══════════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════════
export const DeliveryScheduleApi = {

  // Go button — GoodsMvtHeaderSet
  // Spec: ?$filter=Eta ge '20260429' and Eta le '20260529'
  async fetchDeliveries({
  startDate = '', endDate = '',
  status = '', supplier = '', material = '',
  asn = '', invoiceNo = '', trackSearch = '',
  skip = 0, top = 200,
} = {}) {
  const sapFrom = toSapDate(startDate)
  const sapTo   = toSapDate(endDate)

  const parts = []
  if (sapFrom) parts.push(`ShipDate ge '${sapFrom}'`)
if (sapTo)   parts.push(`ShipDate le '${sapTo}'`)
  if (status)      parts.push(`StatusText eq '${status}'`)
  if (supplier)    parts.push(`Vendor eq '${supplier}'`)
  if (material)    parts.push(`Material eq '${material}'`)
  if (asn)         parts.push(`AsnNum eq '${asn}'`)
  if (invoiceNo)   parts.push(`InvNo eq '${invoiceNo}'`)
  if (trackSearch) parts.push(`TrackNo eq '${trackSearch}'`)

  const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`

  // Guard: if no filter parts, fetch without $filter entirely
  // Sending $filter= (empty) causes SAP to ignore it and return all records
  const url = parts.length > 0
    ? `/GoodsMvtHeaderSet?$filter=${encodeURIComponent(parts.join(' and '))}${pagination}`
    : `/GoodsMvtHeaderSet?${pagination.replace('&','')}`

  const data = await odata(url)
    console.log('=== SAP fetchDeliveries ===')
    console.log('URL sent:', SRV + url)
    console.log('Parts:', parts)
    console.log('Rows returned:', data.d?.results?.length ?? 0)
    if (data.d?.results?.length > 0) {
      console.log('First raw row keys:', Object.keys(data.d.results[0]))
      console.log('First raw row:', JSON.stringify(data.d.results[0], null, 2))
    }
    return (data.d?.results || []).map(mapDeliveryRow)
},

  // Detail — AsnDetailsSet
  async fetchDetail(trackingNo, trackYear) {
    try {
      const parts = [`TrackNo eq '${trackingNo}'`]
      if (trackYear) parts.push(`Year eq '${trackYear}'`)
      const f    = encodeURIComponent(parts.join(' and '))
      const data = await odata(`/AsnDetailsSet?$filter=${f}`)
      const results = data.d?.results || []
      return {
        trackingNo,
        trackYear,
        items:        results.map(mapDetailItem),
        status:       str(results[0]?.StatusText ?? ''),
        supplier:     str(results[0]?.Name ?? ''),
        shipmentDate: str(results[0]?.ShipDate ?? ''),
        eta:          str(results[0]?.Eta ?? ''),
      }
    } catch (err) {
      throw new Error(err.message || 'Failed to fetch detail')
    }
  },

  // VH — Supplier
  async fetchSupplierOptions({ skip = 0, top = 10 } = {}) {
    const pagination = skip > 0 ? `$skip=${skip}&$top=${top}` : `$top=${top}`
    const data = await odata(`/VendorHelpSet?${pagination}`)
    return (data.d?.results || []).map(r => ({ code: str(r.Vendor), label: str(r.Name) }))
  },

  // VH — Material
  async fetchMaterialOptions({ skip = 0, top = 10 } = {}) {
    const pagination = skip > 0 ? `$skip=${skip}&$top=${top}` : `$top=${top}`
    const data = await odata(`/MaterialHelpSet?${pagination}`)
    return (data.d?.results || []).map(r => ({ code: str(r.Material), label: str(r.Desc) }))
  },

  // VH — ASN
  async fetchAsnOptions({ skip = 0, top = 20 } = {}) {
    const pagination = skip > 0 ? `$skip=${skip}&$top=${top}` : `$top=${top}`
    const data = await odata(`/AsnHelpSet?${pagination}`)
    return (data.d?.results || []).map(r => ({ code: str(r.AsnNum), label: str(r.FisYear) }))
  },

  // VH — Invoice
  async fetchInvoiceOptions({ skip = 0, top = 20 } = {}) {
    const pagination = skip > 0 ? `$skip=${skip}&$top=${top}` : `$top=${top}`
    const data = await odata(`/InvHelpSet?${pagination}`)
    return (data.d?.results || []).map(r => ({ code: str(r.InvNo), label: '' }))
  },

  async fetchTodayScheduled(todayDate) {
  const sapToday = todayDate.replace(/-/g, '')   // reuse same logic as toSapDate
  const f = encodeURIComponent(`Status ge '02' and Status le '06' and Eta eq '${sapToday}'`)
  const data = await odata(`/GoodsMvtHeaderSet?$filter=${f}`)
  return (data.d?.results || []).map(mapDeliveryRow)
},
}

export default DeliveryScheduleApi