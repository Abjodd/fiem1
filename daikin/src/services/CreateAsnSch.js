const ODATA_BASE = '/sap/opu/odata/shiv/NW_SUPP_PORTAL_SA_SRV'

const num = (v) => Number(String(v ?? '').trim() || 0)
const str = (v) => String(v ?? '').trim()

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const sapDate = (v) => {
  const s = str(v)
  if (s.length !== 8) return s
  const y = s.slice(0, 4), m = s.slice(4, 6), d = s.slice(6, 8)
  const mi = parseInt(m, 10) - 1
  if (mi < 0 || mi > 11) return s
  return `${MONTHS[mi]} ${d}, ${y}`
}
const isoToSap8 = (iso) => (iso || '').replace(/-/g, '')

async function odataGet(path) {
  const res = await fetch(`${ODATA_BASE}${path}`, {
    headers: { Accept: 'application/json', Loginid: '401122', Logintype: 'P' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`)
  return res.json()
}

async function fetchCsrfToken() {
  const res = await fetch(`${ODATA_BASE}/`, {
    method: 'GET',
    headers: { 'X-CSRF-Token': 'Fetch', Accept: 'application/json', Loginid: '401122', Logintype: 'P' },
    credentials: 'include',
  })
  return res.headers.get('X-CSRF-Token') || ''
}

async function odataPost(path, payload) {
  const token = await fetchCsrfToken()
  const res = await fetch(`${ODATA_BASE}${path}`, {
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
    throw new Error(`POST ${res.status}: ${t.slice(0, 200)}`)
  }
  if (res.status === 204) return {}
  return res.json()
}

// Maps ASN_itemSet row → item card shape used by CreateASN
function mapAsnItem(d) {
  return {
    itemNo:            str(d.Ebelp).trim(),         // " 10" → "10"
    schLine:           str(d.Etenr),                // schedule line number
    materialName:      str(d.Maktx),
    materialNumber:    str(d.Matnr),
    storageLocation:   str(d.StorageLocation),
    shipmentDate:      sapDate(d.Eindt),            // Eindt = shipment/delivery date
    materialExpiry:    str(d.MatExpDate),
    totalQty:          str(d.Total_Qty),
    totalUnit:         str(d.Meins),
    confQty:           str(d.Con_Qty),
    confUnit:          str(d.Meins),
    deliveredQty:      str(d.DelQty),
    deliveredUnit:     str(d.Meins),
    asnCreated:        str(d.Asn_Created).trim(),
    avlAsnQty:         str(d.Menge).trim(),         // available ASN qty
    fgStock:           '',
    netPrice:          str(d.Netpr).trim(),
    supplierNetPrice:  str(d.NetprVen).trim(),
    taxMismatch:       false,
    packingMaterialQty: str(d.PkgMatQty).trim() || '1',
    spq:               str(d.SOQ).trim(),
    pdirNo:            str(d.PdirRefNo),
    packagingType:     str(d.PackingStyle),
    qtyPerPackaging:   '',                          // user-entered, not from API
    warehouseNo:       str(d.Warehouse_No),
    scheduleNo:        str(d.Schedule_No),
    ebelp:             str(d.Ebelp).trim(),
    hsn:               str(d.Hsn_Code),
    batches:           [],
  }
}

export const createAsnApi = {
  // Fetch items eligible for ASN using ASN_itemSet
  async getEligibleItems({ scheduleNo, fromDate, toDate, storageLocation = '' } = {}) {
    let filter = `Schedule_No eq '${scheduleNo}'`
    const dateParts = []
    if (fromDate) dateParts.push(`Eindt ge '${isoToSap8(fromDate)}'`)
    if (toDate)   dateParts.push(`Eindt le '${isoToSap8(toDate)}'`)
    if (dateParts.length) filter += ` and ((${dateParts.join(' and ')}))`
    if (storageLocation.trim()) filter += ` and StorageLocation eq '${storageLocation.trim()}'`

    const json = await odataGet(`/ASN_itemSet?$filter=${encodeURIComponent(filter)}&$format=json`)
    return (json.d?.results || []).map(mapAsnItem)
  },

  // Fetch PDIR reference numbers for the schedule
  async getPdirRefNos(scheduleNo) {
    const json = await odataGet(`/Pdir_ref_noSet?$filter=Ebeln eq '${scheduleNo}'&$format=json`)
    return (json.d?.results || []).map(d => str(d.PdirRefNo || d.Pdir_ref_no || '')).filter(Boolean)
  },

  // Submit ASN — POST to ASN_HEADERSet
  // Returns the success message string like "ASN No. 2600000071/2026 created successfully"
  async submitAsn({ scheduleNo, plant, invoiceNumber, invoiceDate, invoiceAmount,
                    totalPacking, items, generalAttachmentIds, pdirAttachmentIds }) {
    const token = await fetchCsrfToken()

    const payload = {
      Schedule_No:   scheduleNo,
      Werks:         plant,
      InvoiceNum:    invoiceNumber,
      InvoiceDate:   isoToSap8(invoiceDate),
      InvoiceAmt:    String(invoiceAmount),
      InvoiceVal:    String(invoiceAmount),
      TotalPacking:  String(totalPacking || ''),
      DraftAsn:      false,
      ASNItemnav: {
        results: items.map(it => ({
          Schedule_No:     it.scheduleNo || scheduleNo,
          Ebelp:           it.ebelp || it.itemNo,
          Etenr:           it.schLine,
          Matnr:           it.materialNumber,
          Menge:           it.avlAsnQty,
          Meins:           it.totalUnit,
          Netpr:           it.netPrice,
          NetprVen:        it.supplierNetPrice,
          ShipDate:        isoToSap8(it.shipmentDate) || '',
          MatExpDate:      it.materialExpiry ? isoToSap8(it.materialExpiry) : '',
          PkgMatQty:       String(it.packingMaterialQty || ''),
          PackingStyle:    it.packagingType || '',
          PdirRefNo:       it.pdirNo || '',
          StorageLocation: it.storageLocation,
          Warehouse_No:    it.warehouseNo || '',
          TaxChange:       it.taxMismatch ? 'X' : '',
          // Batch rows flattened — send first batch code if split
          FixedBin:        it.batches?.[0]?.batchCode || '',
        }))
      }
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
      // SAP sometimes returns error details in the body even on 4xx
      let msg = `POST ${res.status}`
      try {
        const errJson = JSON.parse(t)
        msg = errJson?.error?.message?.value || msg
      } catch { msg = t.slice(0, 200) || msg }
      throw new Error(msg)
    }

    const data = await res.json()
    // SAP returns AsnNum + Fis_Year — build display message
    const asnNum  = str(data.d?.AsnNum  || data.AsnNum  || '')
    const fisYear = str(data.d?.Fis_Year || data.Fis_Year || '')
    const message = asnNum
      ? `ASN No. ${asnNum}${fisYear ? '/' + fisYear : ''} created successfully`
      : 'ASN created successfully'
    return { asnNum, fisYear, message, raw: data }
  },

  // Upload attachment (unchanged from before)
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