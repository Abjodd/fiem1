// src/services/purchaseOrder.js
const BASE = '/sap/opu/odata/shiv/NW_SUPP_PORTAL_PO_APP_SRV'
export const authConfig = { loginId: '', loginType: '' }
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
 * PO_HEADER row → UI header shape (for sidebar list)
 * From: PO_HEADERSet?$skip=0&$top=40
 */
function mapHeader(raw) {
  return {
    id:                   str(raw.Po_No),
    plant:                str(raw.Plant),
    plantName:            str(raw.Plant_Desc),
    date:                 sapDateToDisplay(raw.Po_Date),
    type:                 str(raw.UpdatedBy) || 'Manual',
    vendor:               str(raw.Vendor_Name),
    vendorNo:             str(raw.Vendor_No),
    currency:             str(raw.Currency),
    amount:               str(raw.Amount),
    status:               str(raw.Status),
    buyerName:            str(raw.Buyer_Name),
    purchaseOrg:          str(raw.Purchase_Org),
    purchaseOrgDesc:      str(raw.Purchase_Org_Desc),
    purchaseGroup:        str(raw.Purchase_Group),
    purchaseGroupDesc:    str(raw.Purchase_Group_Desc),
    orderType:            str(raw.Order_Type),
    orderTypeDesc:        str(raw.Order_Type_Desc),
    itemCount:            str(raw.Item_Count),
    upcomingDelDate:      sapDateToDisplay(raw.Upcoming_Del_Date),
    validFrom:            sapDateToDisplay(raw.ValidFrom),
    validTo:              sapDateToDisplay(raw.ValidTo),
    poType:               str(raw.PoType),
    poFlag:               str(raw.Po_Flag),
    asnFlag:              str(raw.Asn_Flag),
  }
}

/**
 * PO_ITEM row (from headertoitemNav) → UI item shape
 *
 * Payload → UI column mapping:
 *   Item_No       → itemNo        (Item No.)
 *   Material_No   → materialNumber (Material — code)
 *   Material_Desc → materialName   (Material — description)
 *   Hsn_Code      → hsnCode        (HSN Code)
 *   Quantity      → poQty          (PO Qty — what was ordered)
 *   Confirm_Qty   → confirmQty     (Confirmed QTY)
 *   Delivered_Qty → deliveredQty   (Delivered QTY)
 *   Total_Amount  → unitPrice      (Unit Price)
 *   Confirm_Status→ status         (Status)
 */
function mapPoItem(raw) {
  const rawStatus = str(raw.Confirm_Status)
  let status = rawStatus
  if (!rawStatus || rawStatus === '') {
    status = 'Confirmation Required'
  }
  if (!['Confirmed', 'Partially Confirmed', 'Confirmation Required', 'Completed'].includes(rawStatus)) {
    status = rawStatus || 'Confirmation Required'
  }

  return {
    poNo:             str(raw.Po_No),
    // Item No. — strip leading zeros for display, keep raw for API calls
    itemNo:           str(raw.Item_No)?.replace(/^0+/, '') || str(raw.Item_No),
    ebelp:            str(raw.Item_No),
    // Material
    materialNumber:   str(raw.Material_No),
    materialName:     str(raw.Material_Desc),
    // HSN Code
    hsnCode:          str(raw.Hsn_Code),
    // PO Qty (ordered quantity)
    poQty:            trimNum(raw.Quantity),
    // Confirmed QTY
    confirmQty:       trimNum(raw.Confirm_Qty),
    // Delivered QTY (goods received)
    deliveredQty:     trimNum(raw.Delivered_Qty),
    // Unit Price — mapped from Total_Amount
    unitPrice:        trimNum(raw.Total_Amount),
    // Status
    status,
    // Unit of measure
    deliveryUnit:     str(raw.Uom),
    // Kept for backward compat / schedule line drill-down
    deliverySchedule: trimNum(raw.Quantity),
    deliveryDate:     sapDateToDisplay(raw.Delivery_Date),
    plant:            str(raw.Plant),
    plantDesc:        str(raw.Plant_Desc),
    totalAmount:      str(raw.Total_Amount),
    currency:         str(raw.Currency),
    igst:             str(raw.Igst),
    cgst:             str(raw.Cgst),
    sgst:             str(raw.Sgst),
    asnCreated:       trimNum(raw.Asn_Created),
    pendingQty:       trimNum(raw.Pending_Qty),
    storageLocation:  str(raw.StorageLocation),
    warehouseNo:      str(raw.Warehouse_No),
    matkl:            str(raw.Matkl),
    wgbez:            str(raw.Wgbez),
    pkgMatQty:        str(raw.PkgMatQty),
    pkgMatType:       str(raw.PkgMatType),
    soq:              str(raw.SOQ),
    itemIndicator:    str(raw.Item_indicator),
    scheduleItem:     str(raw.ScheduleItem),
    viewName:         str(raw.ViewName),
    scheduleLines:    [],
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
 */
function mapConfirmRow(raw) {
  return {
    poNo:            str(raw.Po_No),
    itemNo:          str(raw.Item_No),
    scheduleLine:    str(raw.Schedule_Line),
    vendorNo:        str(raw.Vendor_No),
    materialNo:      str(raw.Material_No),
    materialDesc:    str(raw.Material_Desc),
    poQty:           str(raw.PO_Quantity || raw.Po_Qty || ''),
    confirmedQty:    str(raw.Conf_Quantity || raw.Conf_Qty || '0'),
    delQty:          str(raw.Del_Quantity || raw.Del_Qty || ''),
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

/**
 * Po_Lineitem row → schedule line shape
 * Menge  = scheduled qty
 * Wemng  = goods received (delivered) qty
 * Bmeng  = vendor confirmed qty
 */
function mapLineItem(raw) {
  return {
    ebeln:            str(raw.Ebeln),
    ebelp:            str(raw.Ebelp),
    etenr:            str(raw.Etenr)?.trim(),
    deliveryDate:     sapDateToDisplay(raw.Eindt),
    deliverySchedule: trimNum(raw.Menge),
    deliveredQty:     trimNum(raw.Wemng),
    confirmedQty:     trimNum(raw.Bmeng),
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
  // Cross-service call to ZSCHEDULE_GENERATE_SRV for F4 supplier value help
  async fetchAllSuppliers() {
    const res = await fetch(`/sap/opu/odata/sap/ZSCHEDULE_GENERATE_SRV/f4supplierSet?$format=json`, {
      headers: {
        Accept: 'application/json',
        Loginid: authConfig.loginId,
        Logintype: authConfig.loginType,
      },
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Failed to load suppliers')
    const json = await res.json()
    return (json.d?.results || []).map(d => ({ lifnr: d.lifnr, name: d.name }))
  },

  async listHeaders({ vendorNo = '' } = {}) {
    const filter = vendorNo
      ? `?$filter=Vendor_No%20eq%20%27${encodeURIComponent(vendorNo)}%27`
      : '?$skip=0&$top=40'
    const data = await odataGet(`/PO_HEADERSet${filter}`)
    return (data.results || []).map(mapHeader)
  },

  async getHeader(poNo, vendorNo = '') {
    const key = `Po_No='${poNo}',Vendor_No='${vendorNo}'`
    const data = await odataGet(`/PO_HEADERSet(${key})`)
    return mapHeader(data)
  },

  async getPoDetail(poNo, vendorNo = '') {
    const key = `Po_No='${poNo}',Vendor_No='${vendorNo}'`
    const data = await odataGet(`/PO_HEADERSet(${key})?$expand=headertoitemNav`)
    return mapPoDetail(data)
  },

  async getLineItems(poNo, ebelp) {
    const f = `Ebeln%20eq%20%27${poNo}%27%20and%20Ebelp%20eq%20%27${ebelp}%27`
    const data = await odataGet(`/Po_LineitemSet?$filter=${f}`)
    return (data.results || []).map(mapLineItem)
  },

  async getPdirRefs(poNo) {
    const f = `Ebeln%20eq%20%27${poNo}%27`
    const data = await odataGet(`/Pdir_ref_noSet?$filter=${f}`)
    return (data.results || []).map(mapPdirRef)
  },

  async getConfirmData(poNo) {
    if (!poNo || poNo === 'undefined') throw new Error('No PO number provided')
    const filter = `%20Po_No%20eq%20%27${poNo}%27`
    const data = await odataGet(`/PoConfirmSet?$filter=${filter}`)
    return (data.results || []).map(mapConfirmRow)
  },

  async submitConfirm(poNo, selectedRows, vendorNo = '') {
    if (!poNo || poNo === 'undefined') throw new Error('No PO number provided')

    const csrfRes = await fetch(
      `${BASE}/PO_HEADERSet(Po_No='${poNo}',Vendor_No='${vendorNo}')`,
      {
        method: 'GET',
        headers: {
          'X-CSRF-Token': 'Fetch',
          Accept: 'application/json',
          Loginid: authConfig.loginId,
          Logintype: authConfig.loginType,
        },
        credentials: 'include',
      }
    )
    const token = csrfRes.headers.get('X-CSRF-Token') || ''

    const res = await fetch(`${BASE}/PO_HEADERSet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-CSRF-Token': token,
        Loginid: authConfig.loginId,
        Logintype: authConfig.loginType,
      },
      credentials: 'include',
      body: JSON.stringify({
        Po_No:    poNo,
        Vendor_No: vendorNo,
        headertopoconfirmnav: {
          results: selectedRows.map(row => ({
            Po_No:         poNo,
            Item_No:       row.itemNo,
            Schedule_Line: row.scheduleLine,
            Vendor_No:     vendorNo,
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