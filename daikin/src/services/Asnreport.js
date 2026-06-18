// ═══════════════════════════════════════════════════════════════
// AsnReportApi.js — ASN Report OData Service
// Service: NW_SUP_POR_ASN_REPORT_SRV
// ═══════════════════════════════════════════════════════════════

const SRV = '/sap/opu/odata/shiv/NW_SUP_POR_ASN_REPORT_SRV'
export const authConfig = { loginId: 'aryas@kpmg.com', loginType: 'E' }

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

const formatDate = (v) => {
  const s = str(v)
  if (s.length !== 8) return s
  return `${s.slice(6, 8)}-${s.slice(4, 6)}-${s.slice(0, 4)}`
}


// ── Row mapper — AsnSet ───────────────────────────────────────
// Missing fields (Gate Entry No., ETA, Gate Entry/Exit DT, Invoice/PDIR)
// not in OData payload → kept blank until backend provides them.
function mapAsnRow(raw) {
  return {
    // Plant
    plant:             str(raw.Plant),
    plantDesc:         str(raw.PlantName ?? raw.PlantDesc ?? ''),

    // Invoice
    invoiceNumber:     str(raw.VendorInvoice),
    invoiceDate:       formatDate(raw.InvDate),

    // IBD / Gate
    ibdNo:             str(raw.Ibd),
    gateEntryNo:       str(raw.GateEntryNo ?? ''),      // Missing in payload

    // ASN / Shipment
    asnNumber:         str(raw.AsnNumber),
    shipmentNo:        str(raw.Shipment),
    createdOn:     formatDate(raw.CreatedOn),
    shipmentDate:  formatDate(raw.ShipmentDate),

    // Base document
    baseDocument:      str(raw.BaseDocument),
    baseDocumentType:  str(raw.DocType ?? raw.BaseDocumentType ?? ''),

    // Vendor
    vendorCode:        str(raw.Lifnr),
    vendorName:        str(raw.VendorName ?? raw.LifnrName ?? ''),

    // Purchase
    purchaseGroup:     str(raw.PurGrp),

    // Statuses
    asnStatus:         str(raw.AsnStatusText),
    grStatus:          str(raw.GrStatus),
    invStatus:         str(raw.InvStatus),

    // Financials
    currency:          str(raw.Currency ?? raw.Waers ?? ''),
    qty:               str(raw.Qty ?? raw.Menge ?? ''),

    // Eway bill
    ewayBillNo:        str(raw.Eway),
    ewayBillDate:  formatDate(raw.EwayDate),

    // Dates
    reachedPlantDate:  formatDate(raw.RchPlantDt),
    ewayBillDate:      formatDate(raw.EwayDate),        // Missing in payload
    etaTime:           str(raw.EtaTime ?? ''),          // Missing in payload
    gateEntryDate:     formatDate(raw.GateEntryDate ?? ''),    // Missing in payload
    gateEntryTime:     str(raw.GateEntryTime ?? ''),    // Missing in payload
    gateExitDate:      formatDate(raw.GateExitDate ?? ''),     // Missing in payload
    gateExitTime:      str(raw.GateExitTime ?? ''),     // Missing in payload

    // Material (used in detail page)
    material:          str(raw.Material ?? raw.Matnr ?? ''),
    materialName:      str(raw.MaterialText ?? raw.Maktx ?? ''),
    challanNo:         str(raw.ChallanNo ?? ''),
    qualityStatus:     str(raw.QualityStatus ?? ''),
    packingMaterialType: str(raw.PackingMaterialType ?? ''),
    packingMaterialQty:  str(raw.PackingMaterialQty ?? '0.000'),

    // Items array for detail page (single item per row from flat OData)
    items: [
      {
        materialCode:        str(raw.Material ?? raw.Matnr ?? ''),
        materialName:        str(raw.MaterialText ?? raw.Maktx ?? ''),
        challanNo:           str(raw.ChallanNo ?? ''),
        qty:                 str(raw.Qty ?? raw.Menge ?? ''),
        qualityStatus:       str(raw.QualityStatus ?? ''),
        packingMaterialType: str(raw.PackingMaterialType ?? ''),
        packingMaterialQty:  str(raw.PackingMaterialQty ?? '0.000'),
      },
    ],
  }
}

// ── VH mappers ────────────────────────────────────────────────
const mapAsn      = (raw) => ({ code: str(raw.AsnNumber), label: str(raw.Year) })
const mapMaterial = (raw) => ({ code: str(raw.Material), label: str(raw.MaterialText) })
const mapInvoice  = (raw) => ({ code: str(raw.VendorInvoice), label: '' })
const mapRefDoc   = (raw) => ({ code: str(raw.BaseDocument), label: str(raw.DocType) })

// Shipment & IBD help sets return 404 → graceful empty array fallback

// ── Filter builder — only include non-empty optional params ───
function buildFilter(required = {}, optional = {}) {
  const parts = []
  Object.entries(required).forEach(([key, val]) => {
    parts.push(`${key} eq '${val}'`)
  })
  Object.entries(optional).forEach(([key, val]) => {
    if (val && val.trim() !== '') parts.push(`${key} eq '${val}'`)
  })
  return encodeURIComponent(`(${parts.join(' and ')})`)
}

// ─────────────────────────────────────────────────────────────
// Date range filter — StartDate / EndDate used by all VH sets
// ─────────────────────────────────────────────────────────────
function dateFilter(startDate, endDate, extra = {}) {
  return buildFilter(
    { StartDate: toSapDate(startDate), EndDate: toSapDate(endDate) },
    extra,
  )
}

// ═══════════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════════
export const AsnReportApi = {

  // Go button — fetch report rows
  async fetchReport({
    asnDateFrom = '', asnDateTo = '',
    supplier = '', material = '', invoiceNo = '',
    refDoc = '', asnNo = '', shipmentNo = '',
    ibdNo = '', plant = '', status = '',
    skip = 0, top = 200,
  } = {}) {
    const f = buildFilter(
      {},
      {
        StartDate:     toSapDate(asnDateFrom),
        EndDate:       toSapDate(asnDateTo),
        Supplier:      supplier,
        Material:      material,
        VendorInvoice: invoiceNo,
        BaseDocument:  refDoc,
        AsnNumber:     asnNo,
        Shipment:      shipmentNo,
        Ibd:           ibdNo,
        Plant:         plant,
        Status:        status,
      },
    )
    const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
    const data = await odata(`/AsnSet?$filter=${f}${pagination}`)
    return (data.d?.results || []).map(mapAsnRow)
  },

  // Value Help — ASN Number
  async fetchAsnHelp({ startDate = '', endDate = '', skip = 0, top = 20 } = {}) {
    const f = dateFilter(startDate, endDate)
    const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
    const data = await odata(`/AsnHelpSet?$filter=${f}${pagination}`)
    return (data.d?.results || []).map(mapAsn)
  },

  // Value Help — Shipment (404 → empty, backend not ready)
  async fetchShipmentHelp({ startDate = '', endDate = '', skip = 0, top = 20 } = {}) {
    try {
      const f = dateFilter(startDate, endDate)
      const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
      const data = await odata(`/ShipmentHelpSet?$filter=${f}${pagination}`)
      return (data.d?.results || []).map(r => ({ code: str(r.Shipment ?? r.ShipmentNo ?? ''), label: '' }))
    } catch {
      return [] // 404 — backend not ready
    }
  },

  // Value Help — IBD Number (404 → empty, backend not ready)
  async fetchIbdHelp({ startDate = '', endDate = '', skip = 0, top = 20 } = {}) {
    try {
      const f = dateFilter(startDate, endDate)
      const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
      const data = await odata(`/IBDHelpSet?$filter=${f}${pagination}`)
      return (data.d?.results || []).map(r => ({ code: str(r.Ibd ?? r.IbdNo ?? ''), label: '' }))
    } catch {
      return [] // 404 — backend not ready
    }
  },

  // Value Help — Material
  async fetchMaterialHelp({ startDate = '', endDate = '', skip = 0, top = 20 } = {}) {
    const f = dateFilter(startDate, endDate)
    const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
    const data = await odata(`/MaterialHelpSet?$filter=${f}${pagination}`)
    return (data.d?.results || []).map(mapMaterial)
  },

  // Value Help — Invoice Number
  async fetchInvoiceHelp({ startDate = '', endDate = '', skip = 0, top = 20 } = {}) {
    const f = dateFilter(startDate, endDate)
    const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
    const data = await odata(`/SupplierInvoiceHelpSet?$filter=${f}${pagination}`)
    return (data.d?.results || []).map(mapInvoice)
  },

  // Value Help — Reference Document (Base Doc)
  async fetchRefDocHelp({ startDate = '', endDate = '', skip = 0, top = 20 } = {}) {
    const f = dateFilter(startDate, endDate)
    const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
    const data = await odata(`/BaseDocHelpSet?$filter=${f}${pagination}`)
    return (data.d?.results || []).map(mapRefDoc)
  },

  // Value Help — Supplier: SupplierHelpSet (no filter — Bukrs not filterable on this entity)
  async fetchSupplierHelp({ skip = 0, top = 20 } = {}) {
    const pagination = skip > 0 ? `$skip=${skip}&$top=${top}` : `$top=${top}`
    const data = await odata(`/SupplierHelpSet?${pagination}`)
    return (data.d?.results || []).map(r => ({
      code:  str(r.Supplier),
      label: str(r.SupplierName),
    }))
  },

  // Value Help — Plant: no endpoint confirmed yet → empty
  async fetchPlantHelp() {
    return []
  },
}

export default AsnReportApi