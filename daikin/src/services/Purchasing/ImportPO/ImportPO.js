import { authConfig } from '../../authConfig.js'

const BASE = '/sap/opu/odata/SAP/ZIMP_PO_SRV'

// ─── Helpers ───────────────────────────────────────────
function trimNum(s) {
  if (s === null || s === undefined || s === '') return '0.00'
  const n = parseFloat(String(s).trim())
  return isNaN(n) ? '0.00' : n.toFixed(2)
}

const str = (v) => String(v ?? '').trim()

// SAP YYYYMMDD -> ISO "YYYY-MM-DD"
export function sapDateToIso(s) {
  if (!s || s === '00000000') return ''
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
}

// SAP YYYYMMDD -> Display "DD.MM.YYYY"
export function sapDateToDisplay(s) {
  if (!s || s === '00000000') return ''
  return `${s.slice(6, 8)}.${s.slice(4, 6)}.${s.slice(0, 4)}`
}

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

function mapHeader(raw) {
  return {
    id:          str(raw.Purchaseid),
    poNo:        str(raw.Purchaseid),
    plant:       str(raw.Plant),
    plantName:   str(raw.PlantDesc),
    vendor:      str(raw.Vendor),
    buyerName:   str(raw.Buyer),
    currency:    str(raw.Currency),
    date:        sapDateToDisplay(raw.created_date),
    type:        'Import',
  }
}

function mapItem(raw) {
  return {
    itemNo:           str(raw.ItemNo)?.replace(/^0+/, '') || str(raw.ItemNo),
    materialNumber:   str(raw.Material),
    materialName:     str(raw.Material),
    hsnCode:          str(raw.HSNCode),
    poQty:            trimNum(raw.POQty),
    deliveredQty:     trimNum(raw.DeliveredQty),
    balanceQty:       trimNum(raw.BalanceQty),
    unitPrice:        trimNum(raw.UnitPrice),
    deliveryFromDate: sapDateToDisplay(raw.DeliveryFromDate),
    deliveryToDate:   sapDateToDisplay(raw.ToDate),
    deliveryUnit:     'PC',
  }
}

export const importPOApi = {
  async listHeaders() {
    const data = await odataGet(`/headerpoSet?$format=json`)
    return (data.results || []).map(mapHeader)
  },

  async getLineItems(purchaseId) {
    if (!purchaseId) return []
    const filter = `?$filter=Purchaseid%20eq%20%27${encodeURIComponent(purchaseId)}%27&$format=json`
    const data = await odataGet(`/itempoSet${filter}`)

    const filteredResults = (data.results || []).filter(
      raw => String(raw.Purchaseid) === String(purchaseId)
    )
    
    return filteredResults.map(mapItem)
  },
}
