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

// ── OData helpers ──
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

// ── Mappers ──
function mapHeader(d) {
  return {
    id: str(d.Schedule_No),
    plant: str(d.Plant),
    plantName: str(d.Plant_Desc),
    date: sapDate(d.Schedule_Date),
    type: str(d.UpdatedBy) || 'Manual',
    vendor: str(d.Vendor_Name),
    vendorNo: str(d.Vendor_No),
    currency: str(d.Currency) || 'INR',
    asnFlag: str(d.Asn_Flag),
    saFlag: str(d.Sa_Flag),
    items: [],
  }
}

function mapItem(d) {
  return {
    itemNo: str(d.Item_No),
    scheduleItem: str(d.Schedule_Item),
    materialName: str(d.Material_Desc),
    materialNumber: str(d.Material_No),
    hsnCode: str(d.Hsn_Code),
    storageLocation: str(d.StorageLocation),
    deliverySchedule: str(d.Quantity),
    deliveryUnit: str(d.Uom),
    deliveredQty: str(d.Delivered_Qty),
    deliveredUnit: str(d.Uom),
    unitPrice: str(d.Netpr),
    status: str(d.Confirm_Status) || 'Confirmed',
    scheduleLines: [],
  }
}

function mapScheduleLine(d) {
  return {
    schLineNo: str(d.Schedule_Line),
    deliveryDate: sapDate(d.Delivery_Date),
    deliverySchedule: num(d.Required_Qty),
    confirmedQty: num(d.Confirmed_Qty),
    unit: str(d.Uom),
  }
}

function mapConfirmRow(d) {
  return {
    itemNo:           str(d.Item_No),
    scheduleLine:     str(d.Schedule_Line),
    materialNo:       str(d.Material_No),
    materialDesc:     str(d.Material_Desc),
    storageLocation:  str(d.StorageLocation),
    requiredQty:      num(d.Required_Qty),
    confirmedQty:     num(d.Confirmed_Qty),
    asnQty:           num(d.Asn_Qty),
    deliveryDate:     sapDate(d.Delivery_Date),
    dispatchDate:     sapDate(d.Dispatch_Date),
    uom:              str(d.Uom),
    scheduleNo:       str(d.Schedule_No),
  }
}

// ═══════════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════════
export const scheduleReleaseApi = {

  // LIST — all schedule agreements
  async listAgreements({ search = '', plants = [] } = {}) {
    const json = await odataGet('/S_HEADERSet?$format=json')
    let rows = (json.d?.results || []).map(mapHeader)
    const q = search.trim().toLowerCase()
    if (q) {
      rows = rows.filter(a =>
        a.id.toLowerCase().includes(q) ||
        a.plantName.toLowerCase().includes(q) ||
        a.plant.toLowerCase().includes(q) ||
        a.vendor.toLowerCase().includes(q)
      )
    }
    if (plants.length) rows = rows.filter(a => plants.includes(a.plant))
    return rows
  },

  // DETAIL — single agreement + items
  async getAgreement(id) {
    const json = await odataGet(`/S_HEADERSet('${id}')?$expand=Sitemnav&$format=json`)
    const d = json.d
    if (!d) return null
    const agreement = mapHeader(d)
    agreement.items = (d.Sitemnav?.results || []).map(mapItem)
    return agreement
  },

  // SCHEDULE LINES — per item
  async getScheduleLines(scheduleNo, scheduleItem, materialNo, uom) {
    const filter =
      `Schedule_No eq '${scheduleNo}' and ` +
      `Schedule_Item eq '${scheduleItem}' and ` +
      `Material_No eq '${materialNo}' and ` +
      `Uom eq '${uom}'`
    const json = await odataGet(`/S_LINEITEMSSet?$filter=${encodeURIComponent(filter)}&$format=json`)
    return (json.d?.results || []).map(mapScheduleLine)
  },

  // CONFIRM DATA — fetch rows for confirm view
  async getConfirmData({ scheduleNo, fromDate, toDate, storageLocation = '' }) {
    let filter = `Schedule_No eq '${scheduleNo}'`
    const dateParts = []
    if (fromDate) dateParts.push(`Delivery_Date ge '${isoToSap8(fromDate)}'`)
    if (toDate)   dateParts.push(`Delivery_Date le '${isoToSap8(toDate)}'`)
    if (dateParts.length) filter += ` and ((${dateParts.join(' and ')}))`
    if (storageLocation.trim()) filter += ` and StorageLocation eq '${storageLocation.trim()}'`

    const json = await odataGet(`/ConfirmDataSet?$filter=${encodeURIComponent(filter)}&$format=json`)
    return (json.d?.results || []).map(mapConfirmRow)
  },

  // CONFIRM SUBMIT — POST selected rows
  async submitConfirm(scheduleNo, selectedRows) {
    // Each selected row gets POSTed — adjust payload fields per backend contract
    const results = await Promise.all(
      selectedRows.map(row =>
        odataPost('/ConfirmDataSet', {
          Schedule_No:   scheduleNo,
          Item_No:       row.itemNo,
          Schedule_Line: row.scheduleLine,
          Material_No:   row.materialNo,
          Confirmed_Qty: String(row.confirmedQty),
          Delivery_Date: row.deliveryDate,
        })
      )
    )
    return results
  },

  // CONFIRM AGREEMENT (header-level) — S_HEADERSet confirm
  async confirmAgreement(id) {
    return odataPost(`/S_HEADERSet('${id}')/Confirmnav`, {
      Schedule_No: id,
    })
  },
}

export default scheduleReleaseApi