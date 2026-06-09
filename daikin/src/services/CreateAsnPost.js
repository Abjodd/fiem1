// src/services/CreateAsnPost.js

const ODATA_BASE = '/sap/opu/odata/shiv/NW_SUPP_PORTAL_SA_SRV'

const HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Loginid: '401122',
  Logintype: 'P',
}

const str = (v) => String(v ?? '').trim()
const num = (v) => String(Number(String(v ?? '').trim() || 0))

// "2026-05-19" or "May 19, 2026" → "20260519"
function toSapDate(v) {
  if (!v) return ''
  const s = str(v)
  // Already SAP format
  if (/^\d{8}$/.test(s)) return s
  // ISO format: 2026-05-19
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.replace(/-/g, '')
  // Try parsing display date
  const d = new Date(s)
  if (!isNaN(d)) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}${m}${day}`
  }
  return ''
}

/**
 * Build the POST payload from form state.
 *
 * @param {object} opts
 * @param {string}   opts.scheduleNo      - SA/PO number (e.g. "5501000407")
 * @param {object}   opts.invoice         - { number, date, amount, totalPacking }
 * @param {Array}    opts.selectedItems   - items[] filtered to selected only
 * @param {string}   [opts.plant]         - Werks from header
 */
export function buildAsnPayload({ scheduleNo, invoice, selectedItems, plant = '' }) {
  const items = selectedItems.map(it => ({
    __metadata: {
      type: 'SHIV.AAL_SUP_PORTAL_SA_SRV.ASN_ITEM',
    },
    Schedule_No:     str(scheduleNo),
    Ebelp:           str(it.itemNo),
    AsnNum:          '',
    DelQty:          str(it.avlAsnQty),
    Etenr:           str(it.schLine),
    Ebeln:           str(scheduleNo),
    Eindt:           toSapDate(it.shipmentDateIso || it.shipmentDate),
    Werks:           str(plant),
    Matnr:           str(it.materialNumber),
    Maktx:           str(it.materialName),
    Menge:           str(it.avlAsnQty),
    Meins:           str(it.totalUnit),
    Netpr:           str(it.netPrice),
    NetprVen:        str(it.supplierNetPrice),
    PlantDesc:       '',
    Total_Qty:       str(it.totalQty),
    Hsn_Code:        str(it.hsnCode),
    Igst:            str(it.igst ?? '0'),
    Cgst:            str(it.cgst ?? '0'),
    Sgst:            str(it.sgst ?? '0'),
    Currency:        '',
    Asn_Created:     str(it.asnCreated),
    Con_Qty:         str(it.confQty),
    Igst_per:        str(it.igstPer ?? '0'),
    Cgst_per:        str(it.cgstPer ?? '0'),
    Sgst_per:        str(it.sgstPer ?? '0'),
    Pstyp:           '',
    Tax:             '0',
    Draft_AsnQty:    '0',
    ShipDate:        toSapDate(it.shipmentDateIso || it.shipmentDate),
    App:             '',
    PerUnit:         '1',
    PkgMatQty:       str(it.packingMaterialQty || '1'),
    PkgMatType:      str(it.packingMaterialType),
    FixedBin:        '',
    MatExpDate:      toSapDate(it.materialExpiry),
    Warningmsg:      '',
    TaxChange:       it.taxMismatch ? 'X' : '',
    SOQ:             str(it.spq),
    PackingStyle:    str(it.packagingType),
    PdirRefNo:       str(it.pdirNo),
    Warehouse_No:    str(it.warehouseNo),
    StorageLocation: str(it.storageLocation),
  }))

  return {
    Update:               false,
    DraftAsn:             false,
    AsnNum:               '',
    Buyer_Name:           '',
    Currency:             '',
    InvoiceAmt:           str(invoice.amount),
    InvoiceDate:          toSapDate(invoice.date),
    InvoiceNum:           str(invoice.number),
    InvoiceVal:           str(invoice.amount),
    ASNamt:               str(invoice.amount),
    Purchase_Group_Desc:  '',
    Schedule_No:          str(scheduleNo),
    ShipTime:             '',
    Total_Amount:         '',
    UnplannedCost:        '0',
    UnplannedCost_text:   '',
    Fis_Year:             '',
    Plant:                '',
    Plant_Desc:           '',
    Vendor_Name:          '',
    Delete:               false,
    App:                  '',
    TotalPacking:         str(invoice.totalPacking),
    Delivery_Date:        '',
    MATNR:                '',
    Item_No:              '',
    Werks:                str(plant),
    ASNItemnav:           { results: items },
  }
}

/**
 * POST to ASN_HEADERSet — creates the ASN.
 * Returns the full SAP response d object on success.
 *
 * @param {object} opts  — same shape as buildAsnPayload
 */
export async function postCreateAsn(opts) {
  const payload = buildAsnPayload(opts)

  // Fetch CSRF token first (SAP OData requires it for POST/PUT/DELETE)
  const tokenRes = await fetch(`${ODATA_BASE}/ASN_HEADERSet`, {
    method: 'GET',
    headers: {
      ...HEADERS,
      'X-CSRF-Token': 'Fetch',
    },
  })
  const csrfToken = tokenRes.headers.get('x-csrf-token') || ''

  const res = await fetch(`${ODATA_BASE}/ASN_HEADERSet`, {
    method: 'POST',
    headers: {
      ...HEADERS,
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    // Try to parse SAP error message
    let errMsg = `HTTP ${res.status} — ${res.statusText}`
    try {
      const errJson = await res.json()
      const sapMsg = errJson?.error?.message?.value
      if (sapMsg) errMsg = sapMsg
    } catch {}
    throw new Error(errMsg)
  }

  const json = await res.json()
  return json.d
}