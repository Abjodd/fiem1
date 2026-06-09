const ODATA_BASE = '/sap/opu/odata/shiv/NW_SUPP_PORTAL_SA_SRV'

const str = (v) => String(v ?? '').trim()

// ─────────────────────────────────────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// "20260422" → "Apr 22, 2026"  (display only, never sent to SAP)
const sapDateDisplay = (v) => {
  const s = str(v)
  if (s.length !== 8) return s
  const y = s.slice(0, 4), m = s.slice(4, 6), d = s.slice(6, 8)
  const mi = parseInt(m, 10) - 1
  if (mi < 0 || mi > 11) return s
  return `${MONTHS[mi]} ${d}, ${y}`
}

// Convert any reasonable date string → "YYYYMMDD" for SAP POST
function toSap8(v) {
  const s = str(v)
  if (!s) return ''
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

// ─────────────────────────────────────────────────────────────────────────────
// HTTP helpers
// ─────────────────────────────────────────────────────────────────────────────

const COMMON_HEADERS = {
  Accept: 'application/json',
  Loginid: '401122',
  Logintype: 'P',
}

async function odataGet(path) {
  const res = await fetch(`${ODATA_BASE}${path}`, { headers: COMMON_HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`)
  return res.json()
}

async function fetchCsrfToken() {
  const res = await fetch(`${ODATA_BASE}/`, {
    method: 'GET',
    headers: { ...COMMON_HEADERS, 'X-CSRF-Token': 'Fetch' },
    credentials: 'include',
  })
  return res.headers.get('X-CSRF-Token') || res.headers.get('x-csrf-token') || ''
}

// ─────────────────────────────────────────────────────────────────────────────
// mapAsnItem — OData ASN_itemSet row → UI item card shape
//
// KEY FIXES:
//  1. itemNo = `${ebelp}-${etenr}` (composite key)
//     Ebelp alone ("10") is shared by all Etenr rows — editing one used to
//     update all. Now "10-1", "10-2" … are independent React state entries.
//
//  2. avlAsnQty ← DelQty  (NOT Menge)
//     DelQty = qty SAP authorises for THIS schedule line shipment.
//     Menge  = open remaining PO qty — completely different concept.
//     Sending Menge > DelQty caused "exceeding" error.
//
//  3. eindt preserved as raw "YYYYMMDD"
//     Used verbatim as ShipDate in POST — display-formatted dates break this.
// ─────────────────────────────────────────────────────────────────────────────
function mapAsnItem(d) {
  const ebelp = str(d.Ebelp)    // "10", "20"  (leading space stripped)
  const etenr = str(d.Etenr)    // "1", "2", "3" …

  return {
    // ── React identity ───────────────────────────────────────────────────────
    itemNo:              `${ebelp}-${etenr}`,   // "10-1", "10-2" … unique per sch line

    // ── Fields echoed verbatim to POST payload ────────────────────────────────
    ebelp,
    schLine:             etenr,
    ebeln:               str(d.Ebeln || d.Schedule_No),  // Ebeln = PO number
    scheduleNo:          str(d.Schedule_No),
    eindt:               str(d.Eindt),           // raw "YYYYMMDD" — used as ShipDate
    werks:               str(d.Werks),
    maktx:               str(d.Maktx),           // material description
    plantDesc:           str(d.PlantDesc),
    perUnit:             str(d.PerUnit),
    warningMsg:          str(d.Warningmsg),
    pstyp:               str(d.Pstyp),

    // Tax / GST
    igst:                str(d.Igst    || '0'),
    cgst:                str(d.Cgst    || '0'),
    sgst:                str(d.Sgst    || '0'),
    igstPer:             str(d.Igst_per || '0'),
    cgstPer:             str(d.Cgst_per || '0'),
    sgstPer:             str(d.Sgst_per || '0'),
    tax:                 str(d.Tax     || '0'),
    currency:            str(d.Currency || ''),

    // Material
    materialName:        str(d.Maktx),
    materialNumber:      str(d.Matnr),
    storageLocation:     str(d.StorageLocation),
    warehouseNo:         str(d.Warehouse_No),
    hsn:                 str(d.Hsn_Code),

    // Dates
    shipmentDate:        sapDateDisplay(d.Eindt),  // display label only
    materialExpiry:      str(d.MatExpDate),         // user-editable; toSap8() on submit

    // Quantities
    totalQty:            str(d.Total_Qty),
    totalUnit:           str(d.Meins),
    confQty:             str(d.Con_Qty),
    confUnit:            str(d.Meins),
    asnCreated:          str(d.Asn_Created),
    draftAsnQty:         str(d.Draft_AsnQty || '0'),
    spq:                 str(d.SOQ),

    // avlAsnQty = DelQty (what SAP allows for this schedule line)
    avlAsnQty:           str(d.DelQty),
    delQty:              str(d.DelQty),   // echoed as DelQty in POST

    // deliveredQty = Menge (open remaining qty) — shown read-only
    deliveredQty:        str(d.Menge),
    deliveredUnit:       str(d.Meins),

    // Prices
    netPrice:            str(d.Netpr),
    supplierNetPrice:    str(d.NetprVen),

    // Packing
    packingMaterialQty:  str(d.PkgMatQty) || '1',
    packingMaterialType: str(d.PkgMatType),
    packagingType:       str(d.PackingStyle),
    pdirNo:              str(d.PdirRefNo),

    // User-editable (blank on load)
    fgStock:             '',
    qtyPerPackaging:     '',
    taxMismatch:         false,
    batches:             [],
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────
export const createAsnApi = {

  async getEligibleItems({ scheduleNo, fromDate, toDate, storageLocation = '' } = {}) {
    let filter = `Schedule_No eq '${scheduleNo}'`
    const dateParts = []
    if (fromDate) dateParts.push(`Eindt ge '${toSap8(fromDate)}'`)
    if (toDate)   dateParts.push(`Eindt le '${toSap8(toDate)}'`)
    if (dateParts.length) filter += ` and ((${dateParts.join(' and ')}))`
    if (storageLocation.trim()) {
      filter += ` and StorageLocation eq '${storageLocation.trim()}'`
    }
    const json = await odataGet(`/ASN_itemSet?$filter=${encodeURIComponent(filter)}&$format=json`)
    return (json.d?.results || []).map(mapAsnItem)
  },

  async getPdirRefNos(scheduleNo) {
    const json = await odataGet(`/Pdir_ref_noSet?$filter=Ebeln eq '${scheduleNo}'&$format=json`)
    return (json.d?.results || [])
      .map(d => str(d.PdirRefNo || d.Pdir_ref_no || ''))
      .filter(Boolean)
  },

  // Submit ASN — POST to ASN_HEADERSet
  // Payload structure mirrors EXACTLY the original working application (doc 10)
  // that successfully created ASN 2600000074.
  async submitAsn({
    scheduleNo, plant, invoiceNumber, invoiceDate, invoiceAmount,
    totalPacking, items,
  }) {
    const token = await fetchCsrfToken()

    // ── Item rows — field order and names match original working payload exactly ──
    // Original sends ASNItemnav as a flat ARRAY (not { results: [...] }).
    // Each item includes __metadata so SAP can resolve the entity type.
    const itemRows = items.map(it => ({
      __metadata: {
        type: 'SHIV.AAL_SUP_PORTAL_SA_SRV.ASN_ITEM',
      },

      // Key fields
      Schedule_No:     it.scheduleNo || scheduleNo,
      Ebelp:           it.ebelp,
      AsnNum:          '',
      DelQty:          it.delQty,          // original deliverable qty from GET
      Etenr:           it.schLine,
      Ebeln:           it.ebeln || scheduleNo,
      Eindt:           it.eindt,           // raw "YYYYMMDD" — never reformatted
      Werks:           it.werks || plant,

      // Material
      Matnr:           it.materialNumber,
      Maktx:           it.maktx || it.materialName,
      Meins:           it.totalUnit,

      // Qty — Menge = qty to ship (= DelQty from GET, user may edit avlAsnQty)
      Menge:           it.avlAsnQty,

      // Prices
      Netpr:           it.netPrice,
      NetprVen:        it.supplierNetPrice,

      // Dates
      ShipDate:        it.eindt,           // raw "YYYYMMDD"
      MatExpDate:      it.materialExpiry ? toSap8(it.materialExpiry) : '',

      // Packing
      PkgMatQty:       str(it.packingMaterialQty || ''),
      PkgMatType:      str(it.packingMaterialType || ''),
      PackingStyle:    str(it.packagingType || ''),

      // Other item fields
      PdirRefNo:       str(it.pdirNo || ''),
      StorageLocation: it.storageLocation,
      Warehouse_No:    str(it.warehouseNo || ''),
      TaxChange:       it.taxMismatch ? 'X' : '',
      FixedBin:        it.batches?.[0]?.batchCode || '',
      PerUnit:         str(it.perUnit || '1'),
      PlantDesc:       str(it.plantDesc || ''),
      Warningmsg:      '',

      // GST
      Hsn_Code:        str(it.hsn || ''),
      Igst:            str(it.igst    || '0'),
      Cgst:            str(it.cgst    || '0'),
      Sgst:            str(it.sgst    || '0'),
      Igst_per:        str(it.igstPer || '0'),
      Cgst_per:        str(it.cgstPer || '0'),
      Sgst_per:        str(it.sgstPer || '0'),
      Tax:             str(it.tax     || '0'),
      Currency:        str(it.currency || ''),

      // Quantity summary fields
      Total_Qty:       str(it.totalQty   || ''),
      Con_Qty:         str(it.confQty    || ''),
      Asn_Created:     str(it.asnCreated || ''),
      Draft_AsnQty:    str(it.draftAsnQty || '0'),
      Pstyp:           str(it.pstyp      || ''),
      SOQ:             str(it.spq        || ''),

      App:             '',
    }))

    // ── Header payload — matches original working app header fields exactly ───
    const payload = {
      Update:               false,
      DraftAsn:             false,
      AsnNum:               '',
      Buyer_Name:           '',
      Currency:             '',
      InvoiceAmt:           String(invoiceAmount),
      ASNamt:               String(invoiceAmount),
      InvoiceDate:          toSap8(invoiceDate),
      InvoiceNum:           invoiceNumber,
      InvoiceVal:           String(invoiceAmount),
      Purchase_Group_Desc:  '',
      Schedule_No:          scheduleNo,
      ShipTime:             '',
      Total_Amount:         '',
      UnplannedCost:        '0',
      UnplannedCost_text:   '',
      Werks:                plant,
      Fis_Year:             '',
      TotalPacking:         String(totalPacking || ''),
      // OData deep insert REQUIRES { results: [] } wrapper.
      // Browser devtools unwraps this to show a plain array, but the wire
      // format must use the results envelope or SAP returns
      // "Not any item request found" (receives no navigation property).
      ASNItemnav:           { results: itemRows },
    }

    const res = await fetch(`${ODATA_BASE}/ASN_HEADERSet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-CSRF-Token': token,
        Loginid: '401122',
        Logintype: 'P',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const t = await res.text().catch(() => '')
      let msg = `POST ${res.status}`
      try {
        const errJson = JSON.parse(t)
        msg = errJson?.error?.message?.value || msg
      } catch { msg = t.slice(0, 200) || msg }
      throw new Error(msg)
    }

    const data = await res.json()
    const asnNum  = str(data.d?.AsnNum  || data.AsnNum  || '')
    const fisYear = str(data.d?.Fis_Year || data.Fis_Year || '')
    const message = asnNum
      ? `ASN No. ${asnNum}${fisYear ? '/' + fisYear : ''} created successfully`
      : 'ASN created successfully'
    return { asnNum, fisYear, message, raw: data }
  },

  async uploadAttachment(asnDraftId, file, kind = 'general') {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('kind', kind)
    const res = await fetch(`${ODATA_BASE}/AsnAttachementSet`, { method: 'POST', body: fd })
    if (!res.ok) throw new Error('Failed to upload')
    return res.json()
  },
}

export default createAsnApi