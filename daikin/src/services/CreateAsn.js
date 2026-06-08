// src/services/CreateAsn.js

const ODATA_BASE = '/sap/opu/odata/shiv/NW_SUPP_PORTAL_PO_APP_SRV'

const HEADERS = {
  Accept: 'application/json',
  Loginid: '401122',
  Logintype: 'P',
}

async function odataGet(path) {
  const res = await fetch(`${ODATA_BASE}${path}`, { headers: HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`)
  return res.json()
}

// SAP "20260519" → "May 19, 2026"
function sapDateToDisplay(v) {
  const s = String(v ?? '').trim()
  if (s.length !== 8) return s
  const iso = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// SAP "20260519" → "2026-05-19" (for date input value)
function sapDateToIso(v) {
  const s = String(v ?? '').trim()
  if (s.length !== 8) return ''
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
}

const num = (v) => Number(String(v ?? '').trim() || 0)
const str = (v) => String(v ?? '').trim()

// Map PO_ASN_ITEM → CreateASN item shape
function mapItem(d) {
  const totalQty   = str(d.Total_Qty)
  const poQty      = str(d.Po_Qty)
  const asnCreated = str(d.Asn_Created)
  const shortQty   = num(d.ShortQty)
  const delQty     = num(d.DelQty)

  // avlAsnQty = ShortQty (open qty to ship)
  const avlAsnQty  = str(d.ShortQty) || String(Math.max(0, num(d.Menge) - num(d.Asn_Created)))

  return {
    itemNo:            str(d.Ebelp),
    schLine:           str(d.Etenr),
    materialName:      str(d.Maktx),
    materialNumber:    str(d.Matnr),
    storageLocation:   str(d.StorageLocation) || str(d.Lgort),
    shipmentDate:      sapDateToDisplay(d.ShipDate || d.Eindt),
    shipmentDateIso:   sapDateToIso(d.ShipDate || d.Eindt),
    materialExpiry:    sapDateToIso(d.MatExpDate),
    totalQty,
    totalUnit:         str(d.Meins),
    confQty:           str(d.Menge),
    confUnit:          str(d.Meins),
    deliveredQty:      str(d.DelQty),
    deliveredUnit:     str(d.Meins),
    asnCreated:        asnCreated,
    avlAsnQty,
    fgStock:           '',
    netPrice:          str(d.Netpr).trim(),
    supplierNetPrice:  str(d.NetprVen).trim(),
    taxMismatch:       str(d.TaxChange) === 'X',
    packingMaterialType: str(d.PkgMatType),
    packingMaterialQty:  str(d.PkgMatQty) || '1',
    spq:               str(d.SOQ),
    pdirNo:            str(d.PdirRefNo),
    packagingType:     '',
    qtyPerPackaging:   '',
    hsnCode:           str(d.Hsn_Code),
    igst:              num(d.Igst),
    cgst:              num(d.Cgst),
    sgst:              num(d.Sgst),
    igstPer:           str(d.Igst_per),
    cgstPer:           str(d.Cgst_per),
    sgstPer:           str(d.Sgst_per),
    warehouseNo:       str(d.Warehouse_No),
    batches:           [],
  }
}

// Map PO_ASN_HEADER → agreement/header shape
function mapHeader(d) {
  return {
    poNo:              str(d.Po_No),
    plant:             str(d.Werks),
    plantDesc:         str(d.Plant_Desc),
    buyerName:         str(d.Buyer_Name),
    purchaseGroupDesc: str(d.Purchase_Group_Desc),
    currency:          str(d.Currency) || 'INR',
    draftAsn:          d.DraftAsn === true,
    asnNum:            str(d.AsnNum),
    items:             (d.asnheadertoasnitemnav?.results || []).map(mapItem),
  }
}

// Map Pdir_ref_noSet result → { value, label }
function mapPdir(d) {
  return {
    value: str(d.PdirRefNo || d.Pdir_Ref_No || d.RefNo || ''),
    label: str(d.PdirRefNo || d.Pdir_Ref_No || d.RefNo || ''),
  }
}

// ═══════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════
export const createAsnService = {

  /**
   * Fetch PO header + items for Create ASN form.
   * Returns { header, items }
   */
  async getAsnData(poNo) {
    const json = await odataGet(
      `/PO_ASN_HEADERSet('${poNo}')?$expand=asnheadertoasnitemnav`
    )
    const d = json.d
    if (!d) throw new Error('No data returned for PO: ' + poNo)
    const header = mapHeader(d)
    return { header, items: header.items }
  },

  /**
   * Fetch PDIR reference numbers for a PO.
   * Returns array of { value, label }
   */
  async getPdirRefs(poNo) {
    const filter = `Ebeln eq '${poNo}'`
    const json = await odataGet(
      `/Pdir_ref_noSet?$filter=${encodeURIComponent(filter)}`
    )
    return (json.d?.results || []).map(mapPdir)
  },

  /**
   * Fetch both in parallel — use this in CreateASN component.
   */
  async getCreateAsnPageData(poNo) {
    const [asnData, pdirRefs] = await Promise.all([
      createAsnService.getAsnData(poNo),
      createAsnService.getPdirRefs(poNo),
    ])
    return { ...asnData, pdirRefs }
  },
}

export { sapDateToIso }