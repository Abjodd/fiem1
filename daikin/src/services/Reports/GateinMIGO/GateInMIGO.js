const SRV = '/sap/opu/odata/shiv/SUPP_PORTAL_GRN_REPORT_SRV'
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

const str  = (v) => String(v ?? '').trim()
const num  = (v) => parseFloat(String(v ?? '0').trim()) || 0

export const toSapDate = (isoDate) => {
  if (!isoDate) return ''
  return isoDate.replace(/-/g, '')
}

function mapGrnRow(raw) {
  return {
    grnNumber:           str(raw.Mblnr),
    postingDate:         str(raw.Budat),
    gateInNo:            str(raw.Gno),
    ibdNumber:           str(raw.Ibd),
    posa:                str(raw.Ebeln),
    shipmentNo:          str(raw.ShipmentNo),
    invoiceNo:           str(raw.InvoiceNum),
    invoiceDate:         str(raw.InvoiceDate),
    asnNumber:           str(raw.AsnNum),
    asnQty:              num(raw.AsnQty),
    asnQtyUnit:          str(raw.AsnQtyUnit ?? raw.Meins ?? 'EA'),
    asnCrDate:           str(raw.CreationDt),
    grQty:               num(raw.Menge),
    grQtyUnit:           str(raw.Meins ?? 'EA'),
    materialCode:        str(raw.Matnr),
    materialName:        str(raw.Maktx),
    vehicleNo:           str(raw.VehicleRegNumb),
    plant:               str(raw.Werks),
    plantLoc:            str(raw.Plantdesc),
    asnCrBy:             str(raw.AsnCreater),
    grnBy:               str(raw.Usnam),
    stLoc:               str(raw.Lgort),
    trNo:                str(raw.Tbnum),
    toNo:                str(raw.Tanum),
    packagingComment:    str(raw.PkgStdCmt),
    packingMaterialType: str(raw.PkgMatType),
    packingMaterialQty:  num(raw.PkgMatQty),
    shortQty:            num(raw.ShortQty ?? 0),
    remarks:             str(raw.Remarks),
  }
}
function buildFilter(required = {}, optional = {}) {
  const parts = []
  Object.entries(required).forEach(([k, v]) => parts.push(`${k} eq '${v}'`))
  Object.entries(optional).forEach(([k, v]) => {
    if (v && v.trim() !== '') parts.push(`${k} eq '${v}'`)
  })
  return encodeURIComponent(`(${parts.join(' and ')})`)
}

export const GateInMIGOApi = {

  async fetchReport({
    postingStartDate = '', postingEndDate = '',
    asnNo = '', grnNo = '', material = '',
    shipmentNo = '', ibdNumber = '',
    plant = '',
    skip = 0, top = 200,
  } = {}) {
    const f = buildFilter(
      {},
      {
        Sdate:      toSapDate(postingStartDate),
        Edate:      toSapDate(postingEndDate),
        AsnNum:     asnNo,
        Mblnr:      grnNo,
        Matnr:      material,
        ShipmentNo: shipmentNo,
        Ibd:        ibdNumber,
        Werks:      plant,
      },
    )
    const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
    const data = await odata(`/HeaderDataSet?$filter=${f}${pagination}`)
    return (data.d?.results || []).map(mapGrnRow)
  },

  async fetchAsnHelp({ skip = 0, top = 20 } = {}) {
    const pagination = skip > 0 ? `$skip=${skip}&$top=${top}` : `$top=${top}`
    const data = await odata(`/AsnHelpSet?${pagination}`)
    return (data.d?.results || []).map(r => ({
      code:  str(r.AsnNum),
      label: str(r.FisYear),
    }))
  },

  async fetchGrnHelp({ startDate = '', endDate = '', asnNo = '', skip = 0, top = 20 } = {}) {
    const f = buildFilter(
      {
        Lifnr:  '',
        AsnNum: asnNo,
        Sdate:  toSapDate(startDate),
        Edate:  toSapDate(endDate),
      },
      {},
    )
    const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
    const data = await odata(`/DocumentHelpSet?$filter=${f}${pagination}`)
    return (data.d?.results || []).map(r => ({
      code:  str(r.Mblnr),
      label: str(r.Mjahr),
    }))
  },

  async fetchPlantHelp({ startDate = '', endDate = '', asnNo = '', grnNo = '', skip = 0, top = 20 } = {}) {
    const f = buildFilter(
      {
        Lifnr:  '',
        AsnNum: asnNo,
        Mblnr:  grnNo,
        Sdate:  toSapDate(startDate),
        Edate:  toSapDate(endDate),
      },
      {},
    )
    const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
    const data = await odata(`/PlantHelpSet?$filter=${f}${pagination}`)
    return (data.d?.results || []).map(r => ({
      code:  str(r.Werks),   // "1000"
      label: str(r.Name1),   // "KRL"
    }))
  },

  async fetchMaterialHelp({ startDate = '', endDate = '', asnNo = '', grnNo = '', plant = '', skip = 0, top = 20 } = {}) {
    const f = buildFilter(
      {
        Lifnr:  '',
        AsnNum: asnNo,
        Mblnr:  grnNo,
        Werks:  plant,
        Sdate:  toSapDate(startDate),
        Edate:  toSapDate(endDate),
      },
      {},
    )
    const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
    const data = await odata(`/MaterialHelpSet?$filter=${f}${pagination}`)
    return (data.d?.results || []).map(r => ({
  code:  str(r.Matnr),
  label: str(r.Maktx ?? ''),
}))
  },

async fetchShipmentHelp({ skip = 0, top = 20 } = {}) {
  const pagination = skip > 0 ? `$skip=${skip}&$top=${top}` : `$top=${top}`
  const data = await odata(`/ShipmentHelpSet?${pagination}`)
  return (data.d?.results || []).map(r => ({
    code:  str(r.Shipment), 
    label: '',
  }))
},

async fetchIbdHelp({ startDate = '', endDate = '', skip = 0, top = 20 } = {}) {
  try {
    const f = buildFilter(
      { Sdate: toSapDate(startDate), Edate: toSapDate(endDate) },
      {},
    )
    const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
    const data = await odata(`/IBDHelpSet?$filter=${f}${pagination}`)
    return (data.d?.results || []).map(r => ({
      code:  str(r.Ibd),
      label: '',
    }))
  } catch {
    return []
  }
},
}

export default GateInMIGOApi