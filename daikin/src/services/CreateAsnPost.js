// src/services/CreateAsnPost.js

const ODATA_BASE = '/sap/opu/odata/shiv/NW_SUPP_PORTAL_PO_APP_SRV'
export const authConfig = { loginId: '', loginType: '' }


const getHeaders = () => ({
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Loginid: authConfig.loginId,
  Logintype: authConfig.loginType,
})

const str = (v) => String(v ?? '').trim()

// "2026-05-19" or display date → "20260519"
function toSapDate(v) {
  if (!v) return ''
  const s = str(v)
  if (/^\d{8}$/.test(s)) return s
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.replace(/-/g, '')
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
 * Build POST payload for PO ASN creation.
 *
 * @param {object} opts
 * @param {string}  opts.poNo            - PO number e.g. "8501000141"
 * @param {object}  opts.invoice         - { number, date, amount, invoiceVal, totalPacking }
 * @param {Array}   opts.selectedItems   - items filtered to selected only
 * @param {object}  opts.header          - full header from createAsnService (for buyer, currency etc.)
 */
export function buildAsnPayload({ poNo, invoice, selectedItems, header = {} }) {
  const items = selectedItems.map(it => ({
    __metadata: {
      type: 'SHIV.AAL_SUP_PORTAL_PO_SRV.PO_ASN_ITEM',
    },
    Po_No:           str(poNo),
    AsnNum:          '',
    Ebelp:           str(it.itemNo),
    DelQty:          str(it.avlAsnQty),
    Etenr:           str(it.schLine),
    Ebeln:           str(poNo),
    Eindt:           toSapDate(it.shipmentDateIso || it.shipmentDate),
    Werks:           str(header.plant || it.werks || ''),
    Lgort:           str(it.storageLocation),
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
    Currency:        str(header.currency || 'INR'),
    Asn_Created:     str(it.asnCreated),
    Po_Qty:          str(it.totalQty),
    Status:          '',
    Tax:             '0',
    Igst_per:        str(it.igstPer ?? '0'),
    Cgst_per:        str(it.cgstPer ?? '0'),
    Sgst_per:        str(it.sgstPer ?? '0'),
    Pstyp:           '0',
    Draft_AsnQty:    '0',
    ChallanNo:       '',
    ShipDate:        toSapDate(it.shipmentDateIso || it.shipmentDate),
    App:             '',
    Dispdate:        '',
    Storagebin:      '',
    PkgMatQty:       str(it.packingMaterialQty || '1'),
    MatExpDate:      toSapDate(it.materialExpiry),
    PkgMatType:      str(it.packingMaterialType),
    FixedBin:        '',
    PerUnit:         '1',
    TaxChange:       it.taxMismatch ? 'X' : '',
    ReturnQty:       '',
    ShortQty:        str(it.avlAsnQty),
    SOQ:             str(it.spq),
    PdirRefNo:       str(it.pdirNo),
    Warehouse_No:    str(it.warehouseNo),
    StorageLocation: str(it.storageLocation),
  }))

  return {
    Update:               false,
    DraftAsn:             false,
    AsnNum:               '',
    Buyer_Name:           str(header.buyerName),
    Currency:             str(header.currency || 'INR'),
    InvoiceAmt:           str(invoice.amount),
    InvoiceDate:          toSapDate(invoice.date),
    InvoiceNum:           str(invoice.number),
    InvoiceVal:           str(invoice.amount),
    Po_No:                str(poNo),
    Purchase_Group_Desc:  str(header.purchaseGroupDesc),
    ShipTime:             '',
    Total_Amount:         str(header.totalAmount || ''),
    UnplannedCost:        '',
    UnplannedCost_text:   '',
    Werks:                str(header.plant || ''),
    asnheadertoasnitemnav: items,
  }
}

/**
 * POST to PO_ASN_HEADERSet — creates the ASN for a PO.
 * Returns the full SAP response d object on success.
 */
export async function postCreateAsn({ poNo, invoice, selectedItems, header = {} }) {
  const payload = buildAsnPayload({ poNo, invoice, selectedItems, header })

  // Fetch CSRF token (SAP OData requires for POST)
  const tokenRes = await fetch(`${ODATA_BASE}/PO_ASN_HEADERSet`, {
    method: 'GET',
    headers: { ...getHeaders(), 'X-CSRF-Token': 'Fetch' },
  })
  const csrfToken = tokenRes.headers.get('x-csrf-token') || ''

  const res = await fetch(`${ODATA_BASE}/PO_ASN_HEADERSet`, {
    method: 'POST',
    headers: { ...getHeaders(), 'X-CSRF-Token': csrfToken },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
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