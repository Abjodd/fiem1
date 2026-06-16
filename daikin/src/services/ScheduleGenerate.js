// ═══════════════════════════════════════════════════════════════
// ScheduleGenerate.js — Schedule Generate API
// Service: ZSCHEDULE_GENERATE_SRV
// Toggle USE_MOCK = false to switch from mock → live OData
// ═══════════════════════════════════════════════════════════════

const USE_MOCK = true

const SRV = 'sap/opu/odata/shiv/ZSCHEDULE_GENERATE_SRV'
export const authConfig = { loginId: '', loginType: '' }

// ── OData helpers ─────────────────────────────────────────────

/** Fetch a CSRF token required for every mutating OData call (POST/PATCH/DELETE). */
async function fetchCsrfToken() {
  const res = await fetch(`${SRV}/`, {
    method: 'GET',
    headers: { 'X-CSRF-Token': 'Fetch', Accept: 'application/json' ,
      Loginid: authConfig.loginId,
      Logintype: authConfig.loginType,
    },
    credentials: 'include',
  })
  const token = res.headers.get('x-csrf-token')
  if (!token) throw new Error('Could not obtain CSRF token')
  return token
}

/** Generic OData GET — returns parsed d.results array or d object. */
async function odataGet(path) {
  const res = await fetch(`${SRV}${path}`, {
    headers: { Accept: 'application/json',Loginid: authConfig.loginId,
      Logintype: authConfig.loginType, },
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`OData GET failed: ${res.status} ${res.statusText}`)
  const json = await res.json()
  return json.d
}

/** Generic OData POST — returns parsed d object. */
async function odataPost(path, body) {
  const token = await fetchCsrfToken()
  const res = await fetch(`${SRV}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-CSRF-Token': token,
      Loginid: authConfig.loginId,
      Logintype: authConfig.loginType,
    },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`OData POST failed: ${res.status} ${res.statusText}`)
  const json = await res.json()
  return json.d
}

// ── Field-name mappers ────────────────────────────────────────
// OData field names (lowercase/abbreviated) → internal app names

/** Map one sg_headerSet record to the agreement header shape the UI expects. */
function mapHeader(d) {
  return {
    id:          d.agreement,
    date:        d.date,
    companyCode: d.compcode,
    plant:       d.plant,
    // plantName not in sg_headerSet; carry it from a separate lookup or leave as plant
    plantName:   d.plant,
  }
}

/** Map one sg_itemSet record to the item shape the UI expects. */
function mapItem(d) {
  return {
    itemNo:        d.itemno,
    sapCode:       d.sapcode,
    description:   d.desc,
    hsnCode:       d.hsn,
    totalQuantity: Number(d.totalsch) || 0,
    unitPrice:     Number(d.unitprice) || 0,
    indicator:     d.indicator || '',
    status:        d.status   || 'Not Generated',
    date:          d.date     || '',
    // days array is not on sg_itemSet; initialise empty — filled by week/daySet calls
    days:          new Array(31).fill(0),
    frozenDays:    [],
  }
}

/**
 * Map a weekSet or daySet record into the days[] array the UI uses.
 * The entity has day1…day31 + fn1/fn2/fn3 (frozen-day flags).
 */
function mapDayRecord(d) {
  const days = []
  for (let i = 1; i <= 31; i++) {
    days.push(Number(d[`day${i}`]) || 0)
  }
  // fn1/fn2/fn3 are frozen-day indicators (could be day indices or flags)
  const frozenDays = [d.fn1, d.fn2, d.fn3]
    .filter(Boolean)
    .map(Number)

  return {
    itemNo:        d.itemno,
    sapCode:       d.sapcode,
    description:   d.desc,
    hsnCode:       d.hsn,
    totalQuantity: Number(d.totalsch) || 0,
    total:         Number(d.total)    || 0,
    days,
    frozenDays,
  }
}

/**
 * Convert the internal days[] array back to the day1…day31 payload
 * shape required by weekSet / daySet / editSet POST bodies.
 */
function buildDayPayload(agreementId, lifnr, item, extraFields = {}) {
  const payload = {
    agreement: agreementId,
    lifnr,
    itemno:   item.itemNo,
    sapcode:  item.sapCode,
    desc:     item.description,
    hsn:      item.hsnCode,
    totalsch: String(item.totalQuantity),
    total:    String(item.days.reduce((s, v) => s + v, 0)),
    fn1: String(item.frozenDays?.[0] ?? ''),
    fn2: String(item.frozenDays?.[1] ?? ''),
    fn3: String(item.frozenDays?.[2] ?? ''),
    ...extraFields,
  }
  item.days.forEach((val, idx) => {
    payload[`day${idx + 1}`] = String(val)
  })
  return payload
}

// ── Mock data ─────────────────────────────────────────────────
const MOCK_SUPPLIERS = {
  'FS859': {
    code: 'FS859',
    name: 'The Supreme Industries Ltd',
    agreements: [{
      id: '5501000391',
      date: '01.08.2026',
      companyCode: 'DSAL',
      plant: 'NM01',
      plantName: 'FIEM-NMR (NMR)',
      items: [
        { itemNo: '10', sapCode: '3p566',  description: 'flare cap',             hsnCode: '84159000', totalQuantity: 2000, unitPrice: 0.78, indicator: '', status: 'Not Generated', days: new Array(31).fill(0), frozenDays: [] },
        { itemNo: '20', sapCode: '3p567',  description: 'FLARE CAP PACKAGING',   hsnCode: '84159000', totalQuantity: 1000, unitPrice: 0.65, indicator: '', status: 'Not Generated', days: new Array(31).fill(0), frozenDays: [] },
        { itemNo: '30', sapCode: '3p568',  description: 'FLARE CAP PACKAGING',   hsnCode: '84159000', totalQuantity: 2500, unitPrice: 0.65, indicator: '', status: 'Not Generated', days: new Array(31).fill(0), frozenDays: [] },
      ],
    }],
  },
  'FS833': {
    code: 'FS833',
    name: 'Ravi Industries',
    agreements: [{
      id: '5501000405',
      date: '05.08.2026',
      companyCode: 'DSAL',
      plant: 'SR01',
      plantName: 'Sri City FG',
      items: [
        { itemNo: '10', sapCode: '3P6201', description: 'Compressor mount bracket', hsnCode: '73269099', totalQuantity: 600,  unitPrice: 4.10, indicator: '', status: 'Not Generated', days: new Array(31).fill(0), frozenDays: [] },
        { itemNo: '20', sapCode: '3P6202', description: 'Motor housing plate',      hsnCode: '73269099', totalQuantity: 1200, unitPrice: 2.85, indicator: '', status: 'Not Generated', days: new Array(31).fill(0), frozenDays: [] },
      ],
    }],
  },
  'FS827': {
    code: 'FS827',
    name: 'Salim Enterprises',
    agreements: [{
      id: '5501000407',
      date: '18.07.2026',
      companyCode: 'DSAL',
      plant: 'NM01',
      plantName: 'FIEM-NMR (NMR)',
      items: [
        { itemNo: '10', sapCode: '3P7104', description: 'Drain pan assembly', hsnCode: '84159000', totalQuantity: 800, unitPrice: 2.40, indicator: '', status: 'Not Generated', days: new Array(31).fill(0), frozenDays: [] },
      ],
    }],
  },
}

// ── Schedule generation helpers ───────────────────────────────
export function generateDays(totalQty, mode, dayCount) {
  const days = new Array(31).fill(0)
  if (mode === 'week') {
    // Spread equally across 4 weekly slots: day 1, 8, 15, 22 (index 0, 7, 14, 21)
    const slots = [0, 7, 14, 21]
    const per = Math.floor(totalQty / 4)
    const rem = totalQty - per * 4
    slots.forEach((d, i) => { days[d] = per + (i < rem ? 1 : 0) })
  } else {
    const n = Math.min(dayCount, 31)
    const per = Math.floor(totalQty / n)
    const rem = totalQty - per * n
    for (let i = 0; i < n; i++) days[i] = per + (i < rem ? 1 : 0)
  }
  return days
}

// ── Public API ────────────────────────────────────────────────
export const scheduleGenerateApi = {

  // ────────────────────────────────────────────────────────────
  // fetchSupplier
  // Reads:  f4supplierSet  → supplier name
  //         sg_headerSet   → agreement header
  //         sg_itemSet     → line items
  // Returns the same shape the UI already expects.
  // ────────────────────────────────────────────────────────────
  async fetchSupplier(code) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 200))
      const s = MOCK_SUPPLIERS[code.toUpperCase()]
      if (!s) return null
      return JSON.parse(JSON.stringify(s))   // deep-clone so UI mutations don't corrupt mock
    }

    // 1. Validate supplier code and get name from f4supplierSet
    const supplierRaw = await odataGet(`/f4supplierSet('${encodeURIComponent(code)}')`)
    if (!supplierRaw) return null

    // 2. Fetch all agreements for this supplier from sg_headerSet
    const headersRaw = await odataGet(
      `/sg_headerSet?$filter=lifnr eq '${encodeURIComponent(code)}'&$format=json`
    )
    const headers = (headersRaw.results ?? []).map(mapHeader)

    // 3. For each agreement, fetch its items from sg_itemSet
    const agreements = await Promise.all(
      headers.map(async header => {
        const itemsRaw = await odataGet(
          `/sg_itemSet?$filter=agreement eq '${header.id}' and lifnr eq '${encodeURIComponent(code)}'&$format=json`
        )
        const items = (itemsRaw.results ?? []).map(mapItem)
        return { ...header, items }
      })
    )

    return {
      code: supplierRaw.lifnr,
      name: supplierRaw.name,
      agreements,
    }
  },

  // ────────────────────────────────────────────────────────────
  // generateWeekSchedule
  // POST to weekSet — backend calculates & returns the week distribution.
  // itemsData: array of item objects with days[] already set by generateDays().
  // ────────────────────────────────────────────────────────────
  async generateWeekSchedule(agreementId, lifnr, itemsData) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 250))
      // In mock mode the caller already computed days via generateDays(); just return as-is.
      return itemsData.map(it => ({ ...it }))
    }

    const results = await Promise.all(
      itemsData.map(item =>
        odataPost('/weekSet', buildDayPayload(agreementId, lifnr, item))
      )
    )
    // Merge back the server-returned distribution into itemsData shape
    return results.map((res, i) => ({
      ...itemsData[i],
      ...mapDayRecord(res),
    }))
  },

  // ────────────────────────────────────────────────────────────
  // generateDaySchedule
  // POST to daySet — backend distributes qty across N working days.
  // ────────────────────────────────────────────────────────────
  async generateDaySchedule(agreementId, lifnr, itemsData, dayCount) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 250))
      return itemsData.map(it => ({ ...it }))
    }

    const results = await Promise.all(
      itemsData.map(item =>
        odataPost('/daySet', buildDayPayload(agreementId, lifnr, item, {
          // Pass dayCount in fn1 or a dedicated field if the backend expects it
          // Adjust the field name to whatever ZSCHEDULE_GENERATE_SRV actually uses:
          fn1: String(dayCount),
        }))
      )
    )
    return results.map((res, i) => ({
      ...itemsData[i],
      ...mapDayRecord(res),
    }))
  },

  // ────────────────────────────────────────────────────────────
  // saveScheduleLines (editSet)
  // Called when the user hits Save inside ScheduleLines.
  // Sends the edited days[] back via editSet POST.
  // ────────────────────────────────────────────────────────────
  async saveScheduleLines(agreementId, lifnr, itemsData) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
      console.log('[mock] saveScheduleLines', agreementId, itemsData)
      return { success: true }
    }

    await Promise.all(
      itemsData.map(item =>
        odataPost('/editSet', buildDayPayload(agreementId, lifnr, item))
      )
    )
    return { success: true }
  },

  // ────────────────────────────────────────────────────────────
  // approveSchedule (approveSet)
  // POST to approveSet for each selected item.
  // The approveSet entity also carries the full item fields + appflag.
  // ────────────────────────────────────────────────────────────
  async approveSchedule(agreementId, lifnr, itemsData) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
      console.log('[mock] approveSchedule', agreementId, itemsData.map(i => i.itemNo))
      return { success: true }
    }

    await Promise.all(
      itemsData.map(item =>
        odataPost('/approveSet', {
          agreement: agreementId,
          lifnr,
          itemno:    item.itemNo,
          sapcode:   item.sapCode,
          desc:      item.description,
          hsn:       item.hsnCode,
          totalsch:  String(item.totalQuantity),
          unitprice: String(item.unitPrice),
          indicator: item.indicator,
          status:    item.status,
          date:      item.date || '',
          appflag:   'X',           // 'X' = approve; adjust per backend contract
        })
      )
    )
    return { success: true }
  },
}

export default scheduleGenerateApi