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
  if (s.length !== 8 || s === '00000000') return ''   // ← add this guard
  return `${s.slice(6, 8)}-${s.slice(4, 6)}-${s.slice(0, 4)}`
}

const formatTime = (v) => {
  const s = str(v)
  if (s.length < 6 || s === '000000') return ''
  return `${s.slice(0, 2)}:${s.slice(2, 4)}:${s.slice(4, 6)}`
}

function mapAsnRow(raw) {
  return {
    plant:             str(raw.Plant),
    plantDesc:         str(raw.PlantName ?? raw.PlantDesc ?? ''),
    invoiceNumber:     str(raw.VendorInvoice),
    invoiceDate:       formatDate(raw.InvDate),
    ibdNo:             str(raw.Ibd),
    gateEntryNo:       str(raw.GateNo ?? ''),
    asnNumber:         str(raw.AsnNumber),
    shipmentNo:        str(raw.Shipment),
    createdOn:     formatDate(raw.CreatedOn),
    shipmentDate:  formatDate(raw.ShipmentDate),
    baseDocument:      str(raw.BaseDocument),
    baseDocumentType:  str(raw.DocType ?? raw.BaseDocumentType ?? ''),
    vendorCode:        str(raw.Supplier),
    vendorName:        str(raw.Name),
    purchaseGroup:     str(raw.PurGrp),
    asnStatus:         str(raw.AsnStatusText),
    grStatus:          str(raw.GrStatus),
    invStatus:         str(raw.InvStatus),
    currency:          str(raw.Currency ?? raw.Waers ?? ''),
    qty:               str(raw.Qty ?? raw.Menge ?? ''),
    ewayBillNo:        str(raw.Eway),
    ewayBillDate:  formatDate(raw.EwayDate),
    reachedPlantDate:  formatDate(raw.RchPlantDt),
    etaDate:           formatDate(raw.Eta ?? ''),
    etaTime:           formatTime(raw.EtaTime ?? ''),
    gateEntryDate:     formatDate(raw.GenDate ?? ''),
    gateEntryTime:     formatTime(raw.GenTime ?? ''),
    gateExitDate:      formatDate(raw.GexDate ?? ''),
    gateExitTime:      formatTime(raw.GexTime ?? ''),
    material:          str(raw.Material ?? raw.Matnr ?? ''),
    materialName:      str(raw.MaterialText ?? raw.Maktx ?? ''),
    challanNo:         str(raw.ChallanNo ?? ''),
    qualityStatus:     str(raw.QualityStatus ?? ''),
    packingMaterialType: str(raw.PackingMaterialType ?? ''),
    packingMaterialQty:  str(raw.PackingMaterialQty ?? '0.000'),
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

function dateFilter(startDate, endDate, extra = {}) {
  return buildFilter(
    { StartDate: toSapDate(startDate), EndDate: toSapDate(endDate) },
    extra,
  )
}

export const AsnReportApi = {

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

  async fetchAsnHelp({ startDate = '', endDate = '', skip = 0, top = 20 } = {}) {
    const f = dateFilter(startDate, endDate)
    const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
    const data = await odata(`/AsnHelpSet?$filter=${f}${pagination}`)
    return (data.d?.results || []).map(mapAsn)
  },

  async fetchShipmentHelp({ startDate = '', endDate = '', skip = 0, top = 20 } = {}) {
  try {
    const f = dateFilter(startDate, endDate)
    const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
    const data = await odata(`/ShipmentHelpSet?$filter=${f}${pagination}`)
    return (data.d?.results || []).map(r => ({ code: str(r.Shipment), label: '' }))
  } catch {
    return []
  }
},

async fetchIbdHelp({ startDate = '', endDate = '', skip = 0, top = 20 } = {}) {
  try {
    const f = dateFilter(startDate, endDate)
    const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
    const data = await odata(`/IBDHelpSet?$filter=${f}${pagination}`)
    return (data.d?.results || []).map(r => ({ code: str(r.Ibd), label: '' }))
  } catch {
    return []
  }
},

  async fetchMaterialHelp({ startDate = '', endDate = '', skip = 0, top = 20 } = {}) {
    const f = dateFilter(startDate, endDate)
    const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
    const data = await odata(`/MaterialHelpSet?$filter=${f}${pagination}`)
    return (data.d?.results || []).map(mapMaterial)
  },

  async fetchInvoiceHelp({ startDate = '', endDate = '', skip = 0, top = 20 } = {}) {
    const f = dateFilter(startDate, endDate)
    const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
    const data = await odata(`/SupplierInvoiceHelpSet?$filter=${f}${pagination}`)
    return (data.d?.results || []).map(mapInvoice)
  },

  async fetchRefDocHelp({ startDate = '', endDate = '', skip = 0, top = 20 } = {}) {
    const f = dateFilter(startDate, endDate)
    const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
    const data = await odata(`/BaseDocHelpSet?$filter=${f}${pagination}`)
    return (data.d?.results || []).map(mapRefDoc)
  },

  async fetchSupplierHelp({ skip = 0, top = 20 } = {}) {
    const pagination = skip > 0 ? `$skip=${skip}&$top=${top}` : `$top=${top}`
    const data = await odata(`/SupplierHelpSet?${pagination}`)
    return (data.d?.results || []).map(r => ({
      code:  str(r.Supplier),
      label: str(r.SupplierName),
    }))
  },

  async fetchPlantHelp() {
    return []
  },
}

export default AsnReportApi