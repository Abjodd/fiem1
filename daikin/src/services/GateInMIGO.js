// ═══════════════════════════════════════════════════════════════
// GateInMIGOApi.js — Gate-In to MIGO Report OData Service
// Service: SUPP_PORTAL_GRN_REPORT_SRV
// ═══════════════════════════════════════════════════════════════

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

// ── Row mapper — HeaderDataSet ────────────────────────────────
// Missing fields: TR No., TO No., Short Qty → kept blank until backend adds
// Doubts resolved:
//   Material     → Matnr (code) + Maktx (name)
//   Plant        → Werks (code) + Plantdesc (name)  — REMOVED FROM TABLE per spec
//   Pkg Comment  → Remarks (same field, Remarks also maps to standalone Remarks col)
//   HeaderText   → used as fallback for packagingComment if Remarks is used by remarks col
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
    // Plant removed from table — still mapped for internal use if needed
    plant:               str(raw.Werks),
    plantLoc:            str(raw.Plantdesc),
    asnCrBy:             str(raw.AsnCreater),
    grnBy:               str(raw.Usnam),
    stLoc:               str(raw.Lgort),
    trNo:                str(raw.TrNo ?? ''),          // Missing in payload
    toNo:                str(raw.ToNo ?? ''),          // Missing in payload
    // packagingComment uses HeaderText; Remarks reserved for separate Remarks column
    packagingComment:    str(raw.HeaderText ?? ''),
    packingMaterialType: str(raw.PkgMatType),
    packingMaterialQty:  num(raw.PkgMatQty),
    shortQty:            num(raw.ShortQty ?? 0),       // Missing in payload
    remarks:             str(raw.Remarks),
  }
}

// ── Filter builder ────────────────────────────────────────────
function buildFilter(required = {}, optional = {}) {
  const parts = []
  Object.entries(required).forEach(([k, v]) => parts.push(`${k} eq '${v}'`))
  Object.entries(optional).forEach(([k, v]) => {
    if (v && v.trim() !== '') parts.push(`${k} eq '${v}'`)
  })
  return encodeURIComponent(`(${parts.join(' and ')})`)
}

// ── Date-range filter used by most VH sets ────────────────────
function dateRangeFilter(startDate, endDate, extra = {}) {
  const sap = { Sdate: toSapDate(startDate), Edate: toSapDate(endDate) }
  return buildFilter({ ...sap }, extra)
}

// ═══════════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════════
export const GateInMIGOApi = {

  // Go button — HeaderDataSet
  async fetchReport({
    postingStartDate = '', postingEndDate = '',
    asnNo = '', grnNo = '', material = '',
    shipmentNo = '', ibdNumber = '',
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
      },
    )
    const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
    const data = await odata(`/HeaderDataSet?$filter=${f}${pagination}`)
    return (data.d?.results || []).map(mapGrnRow)
  },

  // VH — ASN: AsnHelpSet (no date filter needed per spec)
  async fetchAsnHelp({ skip = 0, top = 20 } = {}) {
    const pagination = skip > 0 ? `$skip=${skip}&$top=${top}` : `$top=${top}`
    const data = await odata(`/AsnHelpSet?${pagination}`)
    return (data.d?.results || []).map(r => ({
      code:  str(r.AsnNum),
      label: str(r.FisYear),
    }))
  },

  // VH — GRN / Document: DocumentHelpSet
  // Spec URL: Lifnr eq '' and AsnNum eq '' and (Sdate eq '...' and Edate eq '...')
  // Lifnr = '' per spec (empty, not loginId). Sdate/Edate always required.
  async fetchGrnHelp({ startDate = '', endDate = '', asnNo = '', skip = 0, top = 20 } = {}) {
    const f = buildFilter(
      {
        Lifnr: '',                    // spec sends empty string
        AsnNum: asnNo,                // empty when not selected — always include
        Sdate:  toSapDate(startDate),
        Edate:  toSapDate(endDate),
      },
      {},                             // no optional params — all must be present per spec
    )
    const pagination = skip > 0 ? `&$skip=${skip}&$top=${top}` : `&$top=${top}`
    const data = await odata(`/DocumentHelpSet?$filter=${f}${pagination}`)
    return (data.d?.results || []).map(r => ({
      code:  str(r.Mblnr),
      label: str(r.Mjahr),
    }))
  },

  // VH — Plant: PlantHelpSet
  // Spec URL: Lifnr eq '' and AsnNum eq '' and Mblnr eq '' and (Sdate eq '...' and Edate eq '...')
  // Kept in API even though plant removed from UI — may be needed later
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
      code:  str(r.Werks),
      label: str(r.Name1),
    }))
  },

  // VH — Material: MaterialHelpSet
  // Spec URL: Lifnr eq '' and AsnNum eq '' and Mblnr eq '' and Werks eq '' and (Sdate eq '...' and Edate eq '...')
  // All 5 params always sent (empty string when not selected).
  async fetchMaterialHelp({ startDate = '', endDate = '', asnNo = '', grnNo = '', skip = 0, top = 20 } = {}) {
    const f = buildFilter(
      {
        Lifnr:  '',
        AsnNum: asnNo,
        Mblnr:  grnNo,
        Werks:  '',       // plant removed from UI; always empty
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

  // VH — Shipment: ShipmentHelpSet (no filter params in spec)
  async fetchShipmentHelp({ skip = 0, top = 20 } = {}) {
    const pagination = skip > 0 ? `$skip=${skip}&$top=${top}` : `$top=${top}`
    const data = await odata(`/ShipmentHelpSet?${pagination}`)
    return (data.d?.results || []).map(r => ({
      code:  str(r.Shipmentno),
      label: '',
    }))
  },

  // VH — IBD: IBDHelpSet returns 404 → graceful empty
  async fetchIbdHelp() {
    try {
      const data = await odata(`/IBDHelpSet?$top=20`)
      return (data.d?.results || []).map(r => ({
        code:  str(r.Ibd ?? r.IbdNo ?? ''),
        label: '',
      }))
    } catch {
      return [] // 404 — backend not ready
    }
  },
}

export default GateInMIGOApi