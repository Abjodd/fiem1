// src/services/purchaseOrder.js
// OData service for NW_SUPP_PORTAL_PO_APP_SRV

const BASE = '/sap/opu/odata/shiv/NW_SUPP_PORTAL_PO_APP_SRV'

// ─── SAP date helpers ───────────────────────────────────────────
// SAP YYYYMMDD → "May 11, 2026"
export function sapDateToDisplay(s) {
  if (!s || s === '00000000') return ''
  const y = s.slice(0, 4)
  const m = s.slice(4, 6)
  const d = s.slice(6, 8)
  const dt = new Date(`${y}-${m}-${d}`)
  return isNaN(dt) ? '' : dt.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

// SAP YYYYMMDD → ISO "YYYY-MM-DD"
export function sapDateToIso(s) {
  if (!s || s === '00000000') return ''
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
}

// trim SAP numeric strings: "10.000 " → "10.00"
function trimNum(s) {
  if (!s) return '0.00'
  return parseFloat(s.trim()).toFixed(2)
}

// ─── Fetch helpers ──────────────────────────────────────────────
async function odataGet(path) {
  const url = `${BASE}${path}`
  const res = await fetch(url, {
    headers: { Accept: 'application/json',
        Loginid: '401122',
      Logintype: 'P',
    },
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`OData ${res.status}: ${url}`)
  const json = await res.json()
  return json.d
}

// ─── Mappers ────────────────────────────────────────────────────

/** PO_HEADER row → UI agreement shape */
function mapHeader(raw) {
  return {
    id: raw.Po_No,
    plant: raw.Plant,
    plantName: raw.Plant_Desc,
    date: sapDateToDisplay(raw.Po_Date),
    type: raw.UpdatedBy || 'Manual',
    vendor: raw.Vendor_Name || '',
    vendorNo: raw.Vendor_No,
    currency: raw.Currency,
    amount: raw.Amount,
    status: raw.Status,
    buyerName: raw.Buyer_Name,
    purchaseOrg: raw.Purchase_Org,
    purchaseOrgDesc: raw.Purchase_Org_Desc,
    purchaseGroup: raw.Purchase_Group,
    purchaseGroupDesc: raw.Purchase_Group_Desc,
    orderType: raw.Order_Type,
    orderTypeDesc: raw.Order_Type_Desc,
    itemCount: raw.Item_Count,
    upcomingDelDate: sapDateToDisplay(raw.Upcoming_Del_Date),
    validFrom: sapDateToDisplay(raw.ValidFrom),
    validTo: sapDateToDisplay(raw.ValidTo),
    poType: raw.PoType,
  }
}

/** PO_ASN_ITEM row → UI item shape */
function mapAsnItem(raw) {
  return {
    itemNo: raw.Ebelp?.replace(/^0+/, '') || raw.Ebelp, // strip leading zeros
    ebelp: raw.Ebelp,
    etenr: raw.Etenr,
    materialNumber: raw.Matnr,
    materialName: raw.Maktx,
    hsnCode: raw.Hsn_Code,
    storageLocation: raw.StorageLocation || raw.Lgort || '',
    warehouseNo: raw.Warehouse_No,
    storagebin: raw.Storagebin,
    deliverySchedule: trimNum(raw.Total_Qty),
    deliveryUnit: raw.Meins,
    deliveredQty: trimNum(raw.Asn_Created),
    deliveredUnit: raw.Meins,
    unitPrice: trimNum(raw.Netpr),
    vendorPrice: trimNum(raw.NetprVen),
    currency: raw.Currency,
    status: raw.Status === 'CNF' ? 'Confirmed' : raw.Status,
    igst: raw.Igst,
    cgst: raw.Cgst,
    sgst: raw.Sgst,
    igstPer: raw.Igst_per?.trim(),
    cgstPer: raw.Cgst_per,
    sgstPer: raw.Sgst_per,
    tax: raw.Tax,
    challanNo: raw.ChallanNo,
    shipDate: sapDateToDisplay(raw.ShipDate),
    dispdate: sapDateToDisplay(raw.Dispdate),
    pkgMatType: raw.PkgMatType,
    pkgMatQty: raw.PkgMatQty,
    matExpDate: sapDateToDisplay(raw.MatExpDate),
    perUnit: raw.PerUnit?.trim(),
    soq: raw.SOQ?.trim(),
    pdirRefNo: raw.PdirRefNo,
    deliveryDate: sapDateToDisplay(raw.Eindt), // schedule date
    poQty: trimNum(raw.Po_Qty),
    menge: trimNum(raw.Menge),
    delQty: trimNum(raw.DelQty),
    draftAsnQty: raw.Draft_AsnQty,
    pstyp: raw.Pstyp,
    // scheduleLines not in ASN item — populated separately if needed
    scheduleLines: [],
  }
}

/** PO_ASN_HEADER → UI ASN header shape */
function mapAsnHeader(raw) {
  return {
    poNo: raw.Po_No,
    draftAsn: raw.DraftAsn,
    asnNum: raw.AsnNum,
    plant: raw.Werks,
    invoiceDate: raw.InvoiceDate,
    shipTime: raw.ShipTime,
    invoiceNum: raw.InvoiceNum,
    invoiceAmt: raw.InvoiceAmt?.trim(),
    purchaseGroupDesc: raw.Purchase_Group_Desc,
    buyerName: raw.Buyer_Name,
    currency: raw.Currency,
    totalAmount: raw.Total_Amount,
    vendorNo: raw.Vendor_No,
    fiscalYear: raw.Fis_Year,
    plantDesc: raw.Plant_Desc,
    invoiceVal: raw.InvoiceVal,
    unplannedCost: raw.UnplannedCost,
    unplannedCostText: raw.UnplannedCost_text,
    canUpdate: raw.Update,
    canDelete: raw.Delete,
    storageLocation: raw.StorageLocation,
    items: (raw.asnheadertoasnitemnav?.results || []).map(mapAsnItem),
  }
}

/** Po_Lineitem row → schedule line shape */
function mapLineItem(raw) {
  return {
    ebeln: raw.Ebeln,
    ebelp: raw.Ebelp,
    etenr: raw.Etenr?.trim(),
    deliveryDate: sapDateToDisplay(raw.Eindt),
    deliverySchedule: trimNum(raw.Menge),
    confirmedQty: trimNum(raw.Wemng),
    unit: '',  // not returned in this entity; caller can inject if known
    schLineNo: raw.Etenr?.trim(),
  }
}

/** PoConfirmSet row → confirmation shape */
function mapConfirm(raw) {
  return {
    poNo: raw.Po_No,
    itemNo: raw.Po_item,
    deliveryDate: sapDateToDisplay(raw.Eindt),
    qty: trimNum(raw.Menge),
    confirmedQty: trimNum(raw.Bmeng),
    unit: raw.Meins,
    status: raw.Status,
    materialNo: raw.Matnr,
    materialDesc: raw.Maktx,
    plant: raw.Werks,
    deliveryComplete: raw.Elikz,
  }
}

/** Pdir_ref_noSet row */
function mapPdirRef(raw) {
  return {
    ebeln: raw.Ebeln,
    ebelp: raw.Ebelp,
    refNo: raw.Pdir_Ref_No,
    refDate: sapDateToDisplay(raw.Pdir_Ref_Date),
  }
}

// ─── API object ─────────────────────────────────────────────────

export const purchaseOrderApi = {
  /**
   * List PO headers.
   * SAP entity: PO_HEADERSet
   * Supports OData $filter server-side; client-side search done in JSX.
   */
  async listHeaders({ vendorNo = '' } = {}) {
    const filter = vendorNo ? `?$filter=Vendor_No%20eq%20%27${encodeURIComponent(vendorNo)}%27` : ''
    const data = await odataGet(`/PO_HEADERSet${filter}`)
    return (data.results || []).map(mapHeader)
  },

  /**
   * Single PO header.
   * SAP entity: PO_HEADERSet(Vendor_No='...',Po_No='...')
   */
  async getHeader(poNo, vendorNo = '') {
    const key = `Vendor_No='${vendorNo}',Po_No='${poNo}'`
    const data = await odataGet(`/PO_HEADERSet(${key})`)
    return mapHeader(data)
  },

  /**
   * ASN header + items (expanded).
   * SAP entity: PO_ASN_HEADERSet('...')?$expand=asnheadertoasnitemnav
   * Called when user clicks "Create ASN".
   */
  async getAsnHeader(poNo) {
    const data = await odataGet(
      `/PO_ASN_HEADERSet('${poNo}')?$expand=asnheadertoasnitemnav`
    )
    return mapAsnHeader(data)
  },

  /**
   * Line items for a PO + item combo.
   * SAP entity: Po_LineitemSet?$filter=Ebeln eq '...' and Ebelp eq '...'
   */
  async getLineItems(poNo, ebelp) {
    const f = `Ebeln%20eq%20%27${poNo}%27%20and%20Ebelp%20eq%20%27${ebelp}%27`
    const data = await odataGet(`/Po_LineitemSet?$filter=${f}`)
    return (data.results || []).map(mapLineItem)
  },

  /**
   * PDIR reference numbers for a PO.
   * SAP entity: Pdir_ref_noSet?$filter=Ebeln eq '...'
   * Called alongside getAsnHeader when "Create ASN" clicked.
   */
  async getPdirRefs(poNo) {
    const f = `Ebeln%20eq%20%27${poNo}%27`
    const data = await odataGet(`/Pdir_ref_noSet?$filter=${f}`)
    return (data.results || []).map(mapPdirRef)
  },

  /**
   * PO confirmation lines.
   * SAP entity: PoConfirmSet?$filter= Po_No eq '...'
   * Called when "Confirm" button clicked (GET to preview, then POST/PATCH per your flow).
   */
  async getConfirmLines(poNo) {
    const f = `%20Po_No%20eq%20%27${poNo}%27`
    const data = await odataGet(`/PoConfirmSet?$filter=${f}`)
    return (data.results || []).map(mapConfirm)
  },
}