const ODATA_BASE = '/sap/opu/odata/shiv/NW_SUPP_PORTAL_SA_SRV'
export const authConfig = { loginId: '', loginType: '' }

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
    headers: { Accept: 'application/json',     
      Loginid: authConfig.loginId,
      Logintype: authConfig.loginType, },
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`)
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
    status: str(d.Confirm_Status) || 'Confirmation Required',
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
    itemNo:          str(d.Schedule_Item),
    scheduleLine:    str(d.Schedule_Line),
    materialNo:      str(d.Material_No),
    materialDesc:    str(d.Material_Desc),
    storageLocation: str(d.StorageLocation) || str(d.StorageBin),
    requiredQty:     num(d.Quantity),
    confirmedQty:    num(d.Con_Qty),
    asnQty:          num(d.Asn_Qty),
    deliveryDate:    sapDate(d.ReqDate || d.Date),
    deliveryDateRaw: str(d.ReqDate || d.Date),
    dispatchDate:    sapDate(d.DispDate),
    uom:             str(d.Uom || ''),
    scheduleNo:      str(d.Schedule_No),
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
    // Guard against undefined scheduleNo which causes a 400
    if (!scheduleNo || scheduleNo === 'undefined') {
      throw new Error('No schedule number provided')
    }

    const filter = `Schedule_No eq '${scheduleNo}'`
    const json = await odataGet(`/ConfirmDataSet?$filter=${encodeURIComponent(filter)}&$format=json`)
    let rows = (json.d?.results || []).map(mapConfirmRow)

    // Client-side filtering for dates and storage location
    if (fromDate) rows = rows.filter(r => r.deliveryDateRaw >= isoToSap8(fromDate))
    if (toDate)   rows = rows.filter(r => r.deliveryDateRaw <= isoToSap8(toDate))
    if (storageLocation.trim()) rows = rows.filter(r => r.storageLocation === storageLocation.trim())

    return rows
  },

  // CONFIRM SUBMIT
  // Step 1: GET S_HEADERSet(Schedule_No='...') to fetch CSRF token (mirrors UI5 exactly)
  // Step 2: Single POST to S_HEADERSet with all selected rows nested in Confirmnav
  async submitConfirm(scheduleNo, selectedRows) {
    if (!scheduleNo || scheduleNo === 'undefined') {
      throw new Error('No schedule number provided')
    }

    // Step 1: fetch CSRF token via GET on the specific header (exactly like UI5 does)
    const csrfRes = await fetch(`${ODATA_BASE}/S_HEADERSet('${scheduleNo}')`, {
      method: 'GET',
      headers: {
        'X-CSRF-Token': 'Fetch',
        Accept: 'application/json',
        Loginid: authConfig.loginId,
        Logintype: authConfig.loginType,
      },
      credentials: 'include',
    })
    const token = csrfRes.headers.get('X-CSRF-Token') || ''

    // Step 2: Single POST with all rows nested in Confirmnav
    // SAP rejects Schedule_Item/Schedule_Line as top-level S_HEADER fields —
    // they must be nested inside Confirmnav.results
    const res = await fetch(`${ODATA_BASE}/S_HEADERSet`, {
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
        Schedule_No: scheduleNo,
        Confirmnav: {
          results: selectedRows.map(row => ({
            Schedule_No:     scheduleNo,
            Schedule_Item:   row.itemNo,
            Schedule_Line:   row.scheduleLine,
            Material_No:     row.materialNo,
            Quantity:        String(row.requiredQty),
            Date:            row.deliveryDateRaw,
            Con_Qty:         String(row.confirmedQty),
            StorageLocation: row.storageLocation || '',
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

export default scheduleReleaseApi