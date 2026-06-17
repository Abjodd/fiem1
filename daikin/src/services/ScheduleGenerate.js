const USE_MOCK = false

const SRV = '/sap/opu/odata/sap/ZSCHEDULE_GENERATE_SRV'
export const authConfig = { loginId: '', loginType: '' }

// ── OData helpers ─────────────────────────────────────────────

async function fetchCsrfToken() {
  const res = await fetch(`${SRV}/`, {
    method: 'GET',
    headers: {
      'X-CSRF-Token': 'Fetch',
      Accept: 'application/json',
      Loginid: authConfig.loginId,
      Logintype: authConfig.loginType,
    },
    credentials: 'include',
  })
  const token = res.headers.get('x-csrf-token')
  if (!token) throw new Error('Could not obtain CSRF token')
  return token
}

async function odataGet(path) {
  const res = await fetch(`${SRV}${path}`, {
    headers: {
      Accept: 'application/json',
      Loginid: authConfig.loginId,
      Logintype: authConfig.loginType,
    },
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`OData GET failed: ${res.status} ${res.statusText}`)
  const json = await res.json()
  return json.d
}

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

function mapHeader(d) {
  return {
    id:          d.agreement,
    date:        d.date,
    companyCode: d.compcode,
    plant:       d.plant,
    plantName:   d.plant,
  }
}

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
    days:          new Array(31).fill(0),
    frozenDays:    [],
  }
}

function mapDayRecord(d) {
  const days = []
  for (let i = 1; i <= 31; i++) {
    days.push(Number(d[`day${i}`]) || 0)
  }
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
  'FS901': {
    code: 'FS901',
    name: 'Kumar Auto Parts Pvt Ltd',
    agreements: [{
      id: '5501000412',
      date: '10.08.2026',
      companyCode: 'DSAL',
      plant: 'NM01',
      plantName: 'FIEM-NMR (NMR)',
      items: [
        { itemNo: '10', sapCode: '3P8801', description: 'Bracket assembly LH', hsnCode: '87089900', totalQuantity: 1500, unitPrice: 1.20, indicator: '', status: 'Not Generated', days: new Array(31).fill(0), frozenDays: [] },
      ],
    }],
  },
  'FS744': {
    code: 'FS744',
    name: 'Bharat Forge Components',
    agreements: [{
      id: '5501000398',
      date: '22.07.2026',
      companyCode: 'DSAL',
      plant: 'SR01',
      plantName: 'Sri City FG',
      items: [
        { itemNo: '10', sapCode: '3P5510', description: 'Forged shaft pin', hsnCode: '73269099', totalQuantity: 3000, unitPrice: 0.55, indicator: '', status: 'Not Generated', days: new Array(31).fill(0), frozenDays: [] },
      ],
    }],
  },
}

// Mock f4 supplier list (lifnr + name only)
const MOCK_F4_SUPPLIERS = Object.values(MOCK_SUPPLIERS).map(s => ({
  lifnr: s.code,
  name:  s.name,
}))

// ── Schedule generation helpers ───────────────────────────────
export function generateDays(totalQty, mode, dayCount) {
  const days = new Array(31).fill(0)
  if (mode === 'week') {
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
  // fetchAllSuppliers  (NEW — for F4 value help)
  // GET f4supplierSet → [{lifnr, name}]
  // ────────────────────────────────────────────────────────────
  async fetchAllSuppliers() {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 200))
      return MOCK_F4_SUPPLIERS.map(s => ({ ...s }))
    }

    const data = await odataGet('/f4supplierSet?$format=json')
    const results = data.results ?? []
    return results.map(d => ({ lifnr: d.lifnr, name: d.name }))
  },

  // ────────────────────────────────────────────────────────────
  // fetchSupplier
  // ────────────────────────────────────────────────────────────
  async fetchSupplier(code) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 200))
      const s = MOCK_SUPPLIERS[code.toUpperCase()]
      if (!s) return null
      return JSON.parse(JSON.stringify(s))
    }

    const supplierRaw = await odataGet(`/f4supplierSet('${encodeURIComponent(code)}')`)
    if (!supplierRaw) return null

    const headersRaw = await odataGet(
      `/sg_headerSet?$filter=lifnr eq '${encodeURIComponent(code)}'&$format=json`
    )
    const headers = (headersRaw.results ?? []).map(mapHeader)

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
  // ────────────────────────────────────────────────────────────
  async generateWeekSchedule(agreementId, lifnr, itemsData) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 250))
      return itemsData.map(it => ({ ...it }))
    }

    const results = await Promise.all(
      itemsData.map(item =>
        odataPost('/weekSet', buildDayPayload(agreementId, lifnr, item))
      )
    )
    return results.map((res, i) => ({
      ...itemsData[i],
      ...mapDayRecord(res),
    }))
  },

  // ────────────────────────────────────────────────────────────
  // generateDaySchedule
  // ────────────────────────────────────────────────────────────
  async generateDaySchedule(agreementId, lifnr, itemsData, dayCount) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 250))
      return itemsData.map(it => ({ ...it }))
    }

    const results = await Promise.all(
      itemsData.map(item =>
        odataPost('/daySet', buildDayPayload(agreementId, lifnr, item, {
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
          appflag:   'X',
        })
      )
    )
    return { success: true }
  },
}

export default scheduleGenerateApi