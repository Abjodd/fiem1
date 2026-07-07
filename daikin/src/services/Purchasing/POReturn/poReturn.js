// src/services/poReturn.js
const BASE = '/sap/opu/odata/SAP/ZDEBIT_PO_SRV'
export const authConfig = { loginId: '', loginType: '' }

// ─── SAP date helpers ───────────────────────────────────────────
// SAP YYYYMMDD -> "05.06.2026"
export function sapDateToDdmmyyyy(s) {
  if (!s || s === '00000000') return ''
  const y = s.slice(0, 4), m = s.slice(4, 6), d = s.slice(6, 8)
  return `${d}.${m}.${y}`
}

// SAP YYYYMMDD -> ISO "YYYY-MM-DD"
export function sapDateToIso(s) {
  if (!s || s === '00000000') return ''
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
}

function trimNum(s) {
  if (s === null || s === undefined || s === '') return 0
  const n = parseFloat(String(s).trim())
  return isNaN(n) ? 0 : n
}

const str = (v) => String(v ?? '').trim()

// ─── Fetch helper ───────────────────────────────────────────────
async function odataGet(path) {
  const url = `${BASE}${path}`
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Loginid: authConfig.loginId,
      Logintype: authConfig.loginType,
    },
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`OData ${res.status}: ${url}`)
  const json = await res.json()
  return json.d
}

// ─── Mappers ────────────────────────────────────────────────────

/**
 * HeaderDetailsSet row -> UI sidebar/header shape
 * Fields: Status, PostingDate, DocumentDate, Plant, DocumentNo, DeliveryChallanNo
 */
function mapHeader(raw) {
  return {
    id:             str(raw.DeliveryChallanNo),
    documentNo:     str(raw.DocumentNo),
    plantCode:      str(raw.Plant),
    documentDate:   sapDateToDdmmyyyy(raw.DocumentDate),
    postingDate:    sapDateToDdmmyyyy(raw.PostingDate),
    status:         str(raw.Status),
  }
}

/**
 * GeneralDataSet row -> UI generalData shape
 * Fields: PurchaseOrderNo, VendCode, PODate, VehicleNo, GRNo, OrgInv,
 *         EwayBillNo, Date, DeliveryChallanNo, DocumentNo
 */
function mapGeneralData(raw) {
  return {
    poNo:         str(raw.PurchaseOrderNo),
    vendCode:     str(raw.VendCode),
    poDate:       sapDateToDdmmyyyy(raw.PODate) || str(raw.PODate),
    vehicleNo:    str(raw.VehicleNo),
    grNo:         str(raw.GRNo),
    orgInv:       str(raw.OrgInv),
    ewayBillNo:   str(raw.EwayBillNo),
    date:         sapDateToDdmmyyyy(raw.Date) || str(raw.Date),
  }
}

/**
 * ConsigneeSet row -> UI consignee shape
 * Fields: GSTIN, Country, State, StateCode, Address, Name,
 *         DeliveryChallanNo, DocumentNo
 */
function mapConsignee(raw) {
  return {
    name:       str(raw.Name),
    address:    str(raw.Address),
    stateCode:  str(raw.StateCode),
    state:      str(raw.State),
    country:    str(raw.Country),
    gstin:      str(raw.GSTIN),
  }
}

/**
 * ItemDetailsSet row -> UI item shape
 * Fields: ItemNo, ItemCodeDesc, HSN, Qty, UOM, Rate, Total, Discount,
 *         OtherCharges, TaxableValue, CGSTRate, CGSTAmount, SGSTRate,
 *         SGSTAmount, IGSTRate, IGSTAmount, CGSTTotal, SGSTTotal, IGSTTotal,
 *         Remarks, TotalValue, GrandTotal, TotalValInWords, Attachment,
 *         DeliveryChallanNo, DocumentNo
 *
 * ItemCodeDesc payload is "code|description" or "code - description" depending
 * on backend formatting; we split defensively on common separators.
 */
function splitItemCodeDesc(s) {
  const v = str(s).trim()
  if (!v) return { code: '', desc: '' }
  
  const sep = v.includes('|') ? '|' : (v.includes(' - ') ? ' - ' : null)
  
  if (!sep) {
    const firstSpace = v.indexOf(' ')
    if (firstSpace !== -1) {
      return {
        code: str(v.substring(0, firstSpace)),
        desc: str(v.substring(firstSpace + 1))
      }
    }
    return { code: v, desc: '' }
  }

  const [code, ...rest] = v.split(sep)
  return { code: str(code), desc: str(rest.join(sep)) }
}

function mapItem(raw) {
  const { code, desc } = splitItemCodeDesc(raw.ItemCodeDesc)
  return {
    itemNo:         str(raw.ItemNo),
    itemCode:       code,
    itemDesc:       desc,
    hsnCode:        str(raw.HSN),
    quantity:       trimNum(raw.Qty),
    uom:            str(raw.UOM),
    ratePerUnit:    trimNum(raw.Rate),
    total:          trimNum(raw.Total),
    disc:           str(raw.Discount),
    otherCharges:   str(raw.OtherCharges),
    taxableValue:   trimNum(raw.TaxableValue),
    cgstRate:       trimNum(raw.CGSTRate),
    cgstAmount:     trimNum(raw.CGSTAmount),
    sgstRate:       trimNum(raw.SGSTRate),
    sgstAmount:     trimNum(raw.SGSTAmount),
    igstRate:       trimNum(raw.IGSTRate),
    igstAmount:     trimNum(raw.IGSTAmount),
    attachment:     str(raw.Attachment),
  }
}

/**
 * Build the full UI document shape (header + generalData + consignee + items
 * + remarks/totals) by combining one row from each entity set that share the
 * same DocumentNo / DeliveryChallanNo key — mirrors how mapPoDetail() in
 * purchaseOrder.js combines PO_HEADERSet + headertoitemNav.
 *
 * Remarks/TotalValInWords/CGSTTotal/SGSTTotal/IGSTTotal/TotalValue/GrandTotal
 * live on ItemDetailsSet per-row in the service, but are document-level
 * values (same on every item row) — we just lift them from the first item.
 */
function mapDocument({ header, generalRaw, consigneeRaw, itemRows }) {
  const items = (itemRows || []).map(mapItem)
  const first = (itemRows || [])[0] || {}

  // Backend often sends empty strings for document-level totals.
  // Calculate them manually from the item rows as a fallback.
  let calcCgst = 0
  let calcSgst = 0
  let calcIgst = 0
  let calcTaxable = 0

  items.forEach(it => {
    calcCgst += it.cgstAmount || 0
    calcSgst += it.sgstAmount || 0
    calcIgst += it.igstAmount || 0
    calcTaxable += it.taxableValue || 0
  })

  const calcGrandTotal = calcTaxable + calcCgst + calcSgst + calcIgst

  return {
    ...mapHeader(header),
    generalData: mapGeneralData(generalRaw || {}),
    consignee:   mapConsignee(consigneeRaw || {}),
    items,
    remarks:            str(first.Remarks),
    totalValueInWords:  str(first.TotalValInWords),
    cgst:               trimNum(first.CGSTTotal) || calcCgst,
    sgst:               trimNum(first.SGSTTotal) || calcSgst,
    igst:               trimNum(first.IGSTTotal) || calcIgst,
    totalValue:         trimNum(first.TotalValue) || calcTaxable,
    grandTotal:         trimNum(first.GrandTotal) || calcGrandTotal,
  }
}

// ─── Status helpers (UI logic, not SAP-specific) ─────────────────
export const isPrintEnabled = (status) => {
  if (!status) return false
  const s = status.toLowerCase()
  return s.includes('return started') && !s.includes('not started')
}

// ─── API object ─────────────────────────────────────────────────

export const poReturnApi = {
  /**
   * List all delivery-challan headers for the sidebar.
   * GET HeaderDetailsSet?$skip=0&$top=40
   */
  async listHeaders() {
    const data = await odataGet('/HeaderDetailsSet?$skip=0&$top=40')
    return (data.results || []).map(mapHeader)
  },

  /**
   * Full document detail for one Delivery Challan No.
   * Fetches header + generalData + consignee + items in parallel,
   * all filtered by DocumentNo, same pattern as PO's $expand/$filter calls.
   */
  async getDocumentDetail(documentNo) {
    if (!documentNo) throw new Error('No document number provided')
    const f = `DocumentNo%20eq%20%27${encodeURIComponent(documentNo)}%27`

    const [headerData, generalData, consigneeData, itemData] = await Promise.all([
      odataGet(`/HeaderDetailsSet?$filter=${f}`),
      odataGet(`/GeneralDataSet?$filter=${f}`),
      odataGet(`/ConsigneeSet?$filter=${f}`),
      odataGet(`/ItemDetailsSet?$filter=${f}`),
    ])

    const header = (headerData.results || [])[0]
    if (!header) throw new Error(`Document ${documentNo} not found`)

    return mapDocument({
      header,
      generalRaw:   (generalData.results || [])[0],
      consigneeRaw: (consigneeData.results || [])[0],
      itemRows:     itemData.results || [],
    })
  },

  /**
   * Single-call detail fetch using $expand instead of 4 parallel filtered
   * calls, if/when the backend wires up navigation properties between
   * HeaderDetails -> GeneralData / Consignee / ItemDetails.
   * Prefer this once nav properties exist; falls back to getDocumentDetail
   * otherwise.
   */
  async getDocumentDetailExpanded(documentNo) {
    if (!documentNo) throw new Error('No document number provided')
    const key = `DocumentNo='${documentNo}'`
    const data = await odataGet(
      `/HeaderDetailsSet(${key})?$expand=GeneralDataNav,ConsigneeNav,ItemDetailsNav`
    )
    return mapDocument({
      header: data,
      generalRaw:   data.GeneralDataNav,
      consigneeRaw: data.ConsigneeNav,
      itemRows:     data.ItemDetailsNav?.results || [],
    })
  },
}