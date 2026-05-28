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

async function odataGet(path) {
  const res = await fetch(`${ODATA_BASE}${path}`, {
    headers: {
      Accept: 'application/json',
      Loginid: '401122',
      Logintype: 'P',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`)
  return res.json()
}

// ── HEADER mapper (sidebar list) ──
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
    items: [],
  }
}

// ── ITEM mapper (S_ITEM — from Sitemnav expand) — REAL FIELDS ──
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
    scheduleLines: [],  // loaded separately via S_LINEITEMSSet
  }
}

// ── SCHEDULE LINE mapper (S_LINEITEMS) — REAL FIELDS ──
function mapScheduleLine(d) {
  return {
    schLineNo: str(d.Schedule_Line),
    deliveryDate: sapDate(d.Delivery_Date),
    deliverySchedule: num(d.Required_Qty),
    confirmedQty: num(d.Confirmed_Qty),
    unit: str(d.Uom),
  }
}

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

  // DETAIL — single agreement + items via Sitemnav
  // KEY: SHORT form ('value') — NOT (Schedule_No='value')
  async getAgreement(id) {
    const json = await odataGet(
      `/S_HEADERSet('${id}')?$expand=Sitemnav&$format=json`
    )
    const d = json.d
    if (!d) return null
    const agreement = mapHeader(d)
    const itemRows = d.Sitemnav?.results || []
    agreement.items = itemRows.map(mapItem)
    return agreement
  },

  // SCHEDULE LINES — separate call per item
  async getScheduleLines(scheduleNo, scheduleItem, materialNo, uom) {
    const filter =
      `Schedule_No eq '${scheduleNo}' and ` +
      `Schedule_Item eq '${scheduleItem}' and ` +
      `Material_No eq '${materialNo}' and ` +
      `Uom eq '${uom}'`
    const json = await odataGet(
      `/S_LINEITEMSSet?$filter=${encodeURIComponent(filter)}&$format=json`
    )
    return (json.d?.results || []).map(mapScheduleLine)
  },

  async confirmAgreement(id) {
    console.log('confirm requested for', id)
    return { success: true, id }
  },
}