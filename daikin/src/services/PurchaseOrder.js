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
  if (s === null || s === undefined || s === '') return '0.00'
  const n = parseFloat(String(s).trim())
  return isNaN(n) ? '0.00' : n.toFixed(2)
}

const str = (v) => String(v ?? '').trim()

// ─── Fetch helpers ──────────────────────────────────────────────
async function odataGet(path) {
  const url = `${BASE}${path}`
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
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

/**
 * PO_HEADER row → UI header shape (for sidebar list)
 * From: PO_HEADERSet?$skip=0&$top=40
 */
function mapHeader(raw) {
  return {
    id: str(raw.Po_No),
    plant: str(raw.Plant),
    plantName: str(raw.Plant_Desc),
    date: sapDateToDisplay(raw.Po_Date),
    type: str(raw.UpdatedBy) || 'Manual',
    vendor: str(raw.Vendor_Name),
    vendorNo: str(raw.Vendor_No),
    currency: str(raw.Currency),
    amount: str(raw.Amount),
    status: str(raw.Status),
    buyerName: str(raw.Buyer_Name),
    purchaseOrg: str(raw.Purchase_Org),
    purchaseOrgDesc: str(raw.Purchase_Org_Desc),
    purchaseGroup: str(raw.Purchase_Group),
    purchaseGroupDesc: str(raw.Purchase_Group_Desc),
    orderType: str(raw.Order_Type),
    orderTypeDesc: str(raw.Order_Type_Desc),
    itemCount: str(raw.Item_Count),
    upcomingDelDate: sapDateToDisplay(raw.Upcoming_Del_Date),
    validFrom: sapDateToDisplay(raw.ValidFrom),
    validTo: sapDateToDisplay(raw.ValidTo),
    poType: str(raw.PoType),
    poFlag: str(raw.Po_Flag),
    asnFlag: str(raw.Asn_Flag),
  }
}

/**
 * PO_ITEM row (from headertoitemNav) → UI item shape
 * Payload fields: Po_No, Item_No, Material_No, Material_Desc, Quantity, Uom,
 *   Plant, Total_Amount, Currency, Delivery_Date, Hsn_Code, Igst, Cgst, Sgst,
 *   Confirm_Status, Delivered_Qty, Asn_Created, Confirm_Qty, Pending_Qty,
 *   Matkl, Wgbez, PkgMatQty, PkgMatType, SOQ, Warehouse_No, StorageLocation,
 *   Item_indicator, ScheduleItem, ViewName
 */
function mapPoItem(raw) {
  // Confirm_Status from SAP → normalise to status labels used in UI
  const rawStatus = str(raw.Confirm_Status)
  let status = rawStatus
  if (!rawStatus || rawStatus === '') {
    status = 'Confirmation Required'
  }
  // SAP may return "Confirmed", "Partially Confirmed", "Confirmation Required", "Completed" — pass through
  // but guard empty / unexpected values
  if (!['Confirmed', 'Partially Confirmed', 'Confirmation Required', 'Completed'].includes(rawStatus)) {
    status = rawStatus || 'Confirmation Required'
  }

  return {
    poNo:            str(raw.Po_No),
    itemNo:          str(raw.Item_No)?.replace(/^0+/, '') || str(raw.Item_No),
    ebelp:           str(raw.Item_No),
    materialNumber:  str(raw.Material_No),
    materialName:    str(raw.Material_Desc),
    quantity:        trimNum(raw.Quantity),
    deliveryUnit:    str(raw.Uom),
    plant:           str(raw.Plant),
    plantDesc:       str(raw.Plant_Desc),
    totalAmount:     str(raw.Total_Amount),
    currency:        str(raw.Currency),
    deliveryDate:    sapDateToDisplay(raw.Delivery_Date),
    hsnCode:         str(raw.Hsn_Code),
    igst:            str(raw.Igst),
    cgst:            str(raw.Cgst),
    sgst:            str(raw.Sgst),
    // Confirm_Status is the item status
    status,
    // Delivered_Qty = how much delivered
    deliveredQty:    trimNum(raw.Delivered_Qty),
    // Asn_Created = ASN qty
    asnCreated:      trimNum(raw.Asn_Created),
    // Confirm_Qty = confirmed qty
    confirmQty:      trimNum(raw.Confirm_Qty),
    // Pending_Qty
    pendingQty:      trimNum(raw.Pending_Qty),
    // For items table: "Delivery Schedule" = Quantity (PO ordered qty)
    deliverySchedule: trimNum(raw.Quantity),
    // deliveredQty doubles as "delivered" display
    deliveredUnit:   str(raw.Uom),
    // unit price not in PO_ITEM — set empty; shown as '—'
    unitPrice:       '',
    storageLocation: str(raw.StorageLocation),
    warehouseNo:     str(raw.Warehouse_No),
    matkl:           str(raw.Matkl),
    wgbez:           str(raw.Wgbez),
    pkgMatQty:       str(raw.PkgMatQty),
    pkgMatType:      str(raw.PkgMatType),
    soq:             str(raw.SOQ),
    itemIndicator:   str(raw.Item_indicator),
    scheduleItem:    str(raw.ScheduleItem),
    viewName:        str(raw.ViewName),
    scheduleLines:   [],
  }
}

/**
 * PO detail (expanded header + items) → UI agreement shape
 * From: PO_HEADERSet(Po_No='...',Vendor_No='')?$expand=headertoitemNav
 */
function mapPoDetail(raw) {
  return {
    id:                   str(raw.Po_No),
    poNo:                 str(raw.Po_No),
    vendorNo:             str(raw.Vendor_No),
    vendor:               str(raw.Vendor_Name),
    date:                 sapDateToDisplay(raw.Po_Date),
    plant:                str(raw.Plant),
    plantDesc:            str(raw.Plant_Desc),
    currency:             str(raw.Currency),
    amount:               str(raw.Amount),
    buyerName:            str(raw.Buyer_Name),
    purchaseOrg:          str(raw.Purchase_Org),
    purchaseOrgDesc:      str(raw.Purchase_Org_Desc),
    purchaseGroup:        str(raw.Purchase_Group),
    purchaseGroupDesc:    str(raw.Purchase_Group_Desc),
    orderType:            str(raw.Order_Type),
    orderTypeDesc:        str(raw.Order_Type_Desc),
    status:               str(raw.Status),
    itemCount:            str(raw.Item_Count),
    upcomingDelDate:      sapDateToDisplay(raw.Upcoming_Del_Date),
    poType:               str(raw.PoType),
    poFlag:               str(raw.Po_Flag),
    asnFlag:              str(raw.Asn_Flag),
    items: (raw.headertoitemNav?.results || []).map(mapPoItem),
  }
}

/**
 * PoConfirmSet row → confirm row shape
 * Payload fields: Po_No, Item_No, Schedule_Line, Vendor_No, Material_No,
 *   Material_Desc, Conf_Date, PO_Quantity, Conf_Quantity, Del_Quantity,
 *   Asn_Quantity, DispDate, StorageBin, ShipDate
 */
function mapConfirmRow(raw) {
  return {
    poNo:            str(raw.Po_No),
    itemNo:          str(raw.Item_No),
    scheduleLine:    str(raw.Schedule_Line),
    vendorNo:        str(raw.Vendor_No),
    materialNo:      str(raw.Material_No),
    materialDesc:    str(raw.Material_Desc),
    // PO_Quantity = what was ordered
    poQty:           str(raw.PO_Quantity || raw.Po_Qty || ''),
    // Conf_Quantity = vendor-entered confirmed qty
    confirmedQty:    str(raw.Conf_Quantity || raw.Conf_Qty || '0'),
    // Del_Quantity = delivery quantity
    delQty:          str(raw.Del_Quantity || raw.Del_Qty || ''),
    // Asn_Quantity
    asnQty:          str(raw.Asn_Quantity || raw.Asn_Qty || ''),
    confDate:        str(raw.Conf_Date),
    confDateDisplay: sapDateToDisplay(raw.Conf_Date),
    dispDate:        str(raw.DispDate),
    dispDateDisplay: sapDateToDisplay(raw.DispDate),
    shipDate:        str(raw.ShipDate),
    shipDateDisplay: sapDateToDisplay(raw.ShipDate),
    storageBin:      str(raw.StorageBin),
  }
}

/** Po_Lineitem row → schedule line shape */
function mapLineItem(raw) {
  return {
    ebeln:            str(raw.Ebeln),
    ebelp:            str(raw.Ebelp),
    etenr:            str(raw.Etenr)?.trim(),
    deliveryDate:     sapDateToDisplay(raw.Eindt),
    deliverySchedule: trimNum(raw.Menge),
    confirmedQty:     trimNum(raw.Wemng),
    unit:             '',
    schLineNo:        str(raw.Etenr)?.trim(),
  }
}

/** Pdir_ref_noSet row */
function mapPdirRef(raw) {
  return {
    ebeln:   str(raw.Ebeln),
    ebelp:   str(raw.Ebelp),
    refNo:   str(raw.Pdir_Ref_No),
    refDate: sapDateToDisplay(raw.Pdir_Ref_Date),
  }
}

// ─── API object ─────────────────────────────────────────────────

export const purchaseOrderApi = {
  /**
   * List PO headers for sidebar.
   * SAP entity: PO_HEADERSet?$skip=0&$top=40
   */
  async listHeaders({ vendorNo = '' } = {}) {
    const filter = vendorNo
      ? `?$filter=Vendor_No%20eq%20%27${encodeURIComponent(vendorNo)}%27`
      : '?$skip=0&$top=40'
    const data = await odataGet(`/PO_HEADERSet${filter}`)
    return (data.results || []).map(mapHeader)
  },

  /**
   * Single PO header (minimal, no expand) — used for CSRF token fetch.
   * SAP entity: PO_HEADERSet(Po_No='...',Vendor_No='')
   */
  async getHeader(poNo, vendorNo = '') {
    const key = `Po_No='${poNo}',Vendor_No='${vendorNo}'`
    const data = await odataGet(`/PO_HEADERSet(${key})`)
    return mapHeader(data)
  },

  /**
   * PO detail with expanded items.
   * SAP entity: PO_HEADERSet(Po_No='...',Vendor_No='')?$expand=headertoitemNav
   */
  async getPoDetail(poNo, vendorNo = '') {
    const key = `Po_No='${poNo}',Vendor_No='${vendorNo}'`
    const data = await odataGet(`/PO_HEADERSet(${key})?$expand=headertoitemNav`)
    return mapPoDetail(data)
  },

  /**
   * Schedule lines for a PO + item.
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
   */
  async getPdirRefs(poNo) {
    const f = `Ebeln%20eq%20%27${poNo}%27`
    const data = await odataGet(`/Pdir_ref_noSet?$filter=${f}`)
    return (data.results || []).map(mapPdirRef)
  },

  /**
   * PO confirmation lines.
   * SAP entity: PoConfirmSet?$filter= Po_No eq '...'
   */
  async getConfirmData(poNo) {
    if (!poNo || poNo === 'undefined') {
      throw new Error('No PO number provided')
    }
    const filter = `%20Po_No%20eq%20%27${poNo}%27`
    const data = await odataGet(`/PoConfirmSet?$filter=${filter}`)
    return (data.results || []).map(mapConfirmRow)
  },

  /**
   * Submit PO confirmation.
   *   Step 1 — GET PO_HEADERSet(Po_No='...',Vendor_No='') to fetch CSRF token
   *   Step 2 — POST PO_HEADERSet with selected rows nested in headertopoconfirmnav
   */
  async submitConfirm(poNo, selectedRows) {
    if (!poNo || poNo === 'undefined') {
      throw new Error('No PO number provided')
    }

    // Step 1: fetch CSRF token
    const csrfRes = await fetch(
      `${BASE}/PO_HEADERSet(Po_No='${poNo}',Vendor_No='')`,
      {
        method: 'GET',
        headers: {
          'X-CSRF-Token': 'Fetch',
          Accept: 'application/json',
          Loginid: '401122',
          Logintype: 'P',
        },
        credentials: 'include',
      }
    )
    const token = csrfRes.headers.get('X-CSRF-Token') || ''

    // Step 2: POST with selected rows
    const res = await fetch(`${BASE}/PO_HEADERSet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-CSRF-Token': token,
        Loginid: '401122',
        Logintype: 'P',
      },
      credentials: 'include',
      body: JSON.stringify({
        Po_No:    poNo,
        Vendor_No: '',
        headertopoconfirmnav: {
          results: selectedRows.map(row => ({
            Po_No:         poNo,
            Item_No:       row.itemNo,
            Schedule_Line: row.scheduleLine,
            Vendor_No:     '',
            Material_No:   row.materialNo,
            Conf_Date:     row.confDate,
            Conf_Quantity: String(row.confirmedQty),
            Del_Quantity:  String(row.delQty),
            StorageBin:    row.storageBin || '',
          })),
        },
      }),
    })

    if (!res.ok) {
      const t = await res.text().catch(() => '')
      let msg = `POST ${res.status}`
      try { msg = JSON.parse(t)?.error?.message?.value || msg } catch { msg = t.slice(0, 200) || msg }
      throw new Error(msg)
    }

    return res.status === 204 ? {} : res.json()
  },
}