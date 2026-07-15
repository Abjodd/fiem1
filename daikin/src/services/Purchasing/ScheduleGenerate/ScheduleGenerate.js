const USE_MOCK = false

const SRV = '/sap/opu/odata/sap/ZSCHEDULE_GENERATE_SRV'
export const authConfig = { loginId: '', loginType: '' }

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

function mapHeader(d) {
  return {
    id:          d.agreement,
    date:        d.date,
    companyCode: d.compcode,
    plant:       d.plant,
    plantName:   d.plant,
    lifnr:       d.lifnr,
    vendor:      d.name,
  }
}

function extractDaysFromRow(d) {
  const days = new Array(31).fill(0)
  const qty = Number(d.day1) || 0
  const dateStr = d.date || ''
  
  if (dateStr && dateStr.length === 8 && qty > 0) {
    const dayNum = parseInt(dateStr.substring(6, 8), 10)
    
    if (dayNum >= 1 && dayNum <= 31) {
      days[dayNum - 1] = qty
    }
  } else {
    for (let i = 1; i <= 31; i++) {
      days[i - 1] = Number(d[`day${i}`]) || 0
    }
  }
  return days
}

function mapItem(d) {
  const frozenDays = [d.fn1, d.fn2, d.fn3]
    .filter(Boolean)
    .map(Number)

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
    days:          extractDaysFromRow(d),
    frozenDays,
  }
}

function mapDayRecord(d) {
  const src = (d.editSet && d.editSet.results && d.editSet.results.length > 0)
    ? d.editSet.results
    : [d]

  const days = new Array(31).fill(0)
  src.forEach(row => {
    const rowDays = extractDaysFromRow(row)
    rowDays.forEach((val, i) => {
      if (val > 0) days[i] = val
    })
  })

  const first = src[0] || d
  const frozenDays = [first.fn1, first.fn2, first.fn3]
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

const MOCK_F4_SUPPLIERS = Object.values(MOCK_SUPPLIERS).map(s => ({
  lifnr: s.code,
  name:  s.name,
}))


function buildDeepPayload(agreementId, lifnr, item, mode) {
  const today = new Date()
  const year = String(today.getFullYear())
  const month = String(today.getMonth() + 1).padStart(2, '0')

  const results = []
  item.days.forEach((val, idx) => {
    const numVal = Number(val) || 0
    // For CREATE/GENERATE, only send if allotted > 0
    if (numVal > 0) {
      const dayStr = String(idx + 1).padStart(2, '0')
      results.push({
        //agreement: agreementId,
        itemno:    item.itemNo,
        //sapcode:   item.sapCode,
        day1:      String(numVal),
        date:      `${dayStr}${month}${year}`,
      })
    }
  })

  const payload = {
    agreement:  agreementId,
    lifnr,
    itemno:     item.itemNo,
    sapcode:    item.sapCode,
    desc:       item.description ?? '',
    hsn:        item.hsnCode     ?? '',
    totalsch:   String(item.totalQuantity),
    unitprice:  String(item.unitPrice  ?? 0),
    indicator:  item.indicator ?? '',
    status:     item.status    ?? '',
    date:       item.date      ?? '',
  }

  if (mode === 'WEEKLY') {
    payload.weekSet = { results }
  } else if (mode === 'DAILY') {
    payload.daySet  = { results }
  }

  return payload
}

function buildEditPayload(agreementId, lifnr, item) {
  const today = new Date()
  const year = String(today.getFullYear())
  const month = String(today.getMonth() + 1).padStart(2, '0')

  const results = []
  
  const original = item.originalDays || []
  
  item.days.forEach((val, idx) => {
    const numVal = Number(val) || 0
    const origVal = Number(original[idx]) || 0
    
    if (numVal > 0 || (numVal === 0 && origVal > 0)) {
      const dayStr = String(idx + 1).padStart(2, '0')
      results.push({
        agreement: agreementId,
        itemno:    item.itemNo,
        sapcode:   item.sapCode,
        day1:      String(numVal),
        date:      `${dayStr}${month}${year}`,
        flag:      'X',
      })
    }
  })

  return {
    agreement:  agreementId,
    lifnr,
    itemno:     item.itemNo,
    sapcode:    item.sapCode,
    desc:       item.description ?? '',
    hsn:        item.hsnCode     ?? '',
    totalsch:   String(item.totalQuantity),
    unitprice:  String(item.unitPrice  ?? 0),
    indicator:  item.indicator ?? '',
    status:     item.status    ?? '',
    date:       item.date      ?? '', 
    edit:       'X',
    editSet:    { results },
  }
}

function buildSendForApprovalPayload(agreementId, lifnr, item) {
  const childRow = {
    agreement:  agreementId,
    itemno:     item.itemNo,
    sapcode:    item.sapCode,
    indicator:  item.indicator ?? '',
    status:     item.status    ?? '',
    appflag:    'X',
  }
  return {
    agreement:  agreementId,
    lifnr,
    itemno:     item.itemNo,
    sapcode:    item.sapCode,
    desc:       item.description ?? '',
    hsn:        item.hsnCode     ?? '',
    totalsch:   String(item.totalQuantity),
    unitprice:  String(item.unitPrice  ?? 0),
    indicator:  item.indicator ?? '',
    status:     item.status    ?? '',
    date:       item.date      ?? '',
    approveSet: { results: [childRow] },
  }
}

function buildHeaderApprovePayload(agreementId, lifnr, itemsData) {
  const approveSetResults = itemsData.map(item => ({
    agreement:  agreementId,
    itemno:     item.itemNo,
    sapcode:    item.sapCode,
    indicator:  item.indicator ?? '',
    status:     item.status    ?? '',
    appflag:    'Y',
  }))

  return {
    agreement:  agreementId,
    lifnr:      lifnr,
    approveSet: { results: approveSetResults },
  }
}

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

export const scheduleGenerateApi = {
  async fetchAllSuppliers() {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 200))
      return MOCK_F4_SUPPLIERS.map(s => ({ ...s }))
    }

    const data = await odataGet('/f4supplierSet?$format=json')
    const results = data.results ?? []
    return results.map(d => ({ lifnr: d.lifnr, name: d.name }))
  },

  async listAgreements({ search = '', plants = [] } = {}) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 200))
      let rows = Object.values(MOCK_SUPPLIERS).flatMap(s => 
        s.agreements.map(a => ({ ...a, lifnr: s.code, vendor: s.name }))
      )
      return rows
    }

    const data = await odataGet('/sg_headerSet?$format=json')
    let rows = (data.results ?? []).map(mapHeader)
    
    const q = search.trim().toLowerCase()
    if (q) {
      rows = rows.filter(a =>
        a.id.toLowerCase().includes(q) ||
        (a.vendor || '').toLowerCase().includes(q) ||
        (a.lifnr || '').toLowerCase().includes(q) ||
        a.plant.toLowerCase().includes(q)
      )
    }
    if (plants.length) rows = rows.filter(a => plants.includes(a.plant))
    return rows
  },

  async getAgreementDetails(agreementId, lifnr, isApprover = false) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 200))
      const s = MOCK_SUPPLIERS[lifnr.toUpperCase()]
      if (!s) return null
      const ag = s.agreements.find(a => a.id === agreementId)
      if (!ag) return null
      return { id: agreementId, items: ag.items.map(it => ({ ...it })) }
    }

    const endpoint = isApprover ? '/approveSet' : '/sg_itemSet'
    const itemsRaw = await odataGet(
      `${endpoint}?$filter=agreement eq '${agreementId}' and lifnr eq '${encodeURIComponent(lifnr)}'&$format=json`
    )
    const items = (itemsRaw.results ?? []).map(mapItem)
    return { id: agreementId, items }
  },

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


  async fetchItemDays(agreementId, lifnr, itemNos) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 200))
      return {}
    }

    const map = {}
    const cleanItemNos = itemNos.map(n => String(n).trim().replace(/^0+/, ''))
    
    await Promise.all(
      cleanItemNos.map(async (itemNo) => {
        // Backend expects 5-digit padded item number for the filter
        const formattedItemNo = String(itemNo).padStart(5, '0')
        
        try {
          const itemsRaw = await odataGet(
            `/editSet?$filter=agreement eq '${agreementId}' and itemno eq '${formattedItemNo}'&$format=json`
          )
          
          const results = itemsRaw.results ?? []
          if (results.length > 0) {
            const days = new Array(31).fill(0)
            
            results.forEach(row => {
              const rowDays = extractDaysFromRow(row)
              rowDays.forEach((val, i) => {
                if (val > 0) days[i] = val
              })
            })
            
            const first = results[0]
            const frozenDays = [first.fn1, first.fn2, first.fn3]
              .filter(Boolean)
              .map(Number)
              
            map[itemNo] = {
              days,
              frozenDays,
              // Keeping backward compatibility format
              totalQuantity: Number(first.totalsch) || 0,
            }
          }
        } catch (err) {
          console.warn(`Failed to fetch editSet for item ${itemNo}:`, err)
        }
      })
    )
    
    return map
  },

  async fetchItemDaysApprover(agreementId, lifnr, itemNos) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 200))
      return {}
    }

    const itemsRaw = await odataGet(
      `/sg_itemSet?$filter=agreement eq '${agreementId}' and lifnr eq '${encodeURIComponent(lifnr)}'&$format=json`
    )

    const map = {}
    ;(itemsRaw.results ?? []).forEach(data => {
      const itemNo = String(data.itemno).trim().replace(/^0+/, '')
      const cleanItemNos = itemNos.map(n => String(n).trim().replace(/^0+/, ''))
      if (!cleanItemNos.includes(itemNo)) return
      map[itemNo] = mapDayRecord(data)
    })
    return map
  },

  async generateWeekSchedule(agreementId, lifnr, itemsData) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 250))
    return itemsData.map(it => ({ ...it }))
  }
  const results = await Promise.all(
    itemsData.map(item =>
      odataPost('/sg_itemSet', buildDeepPayload(agreementId, lifnr, item, 'WEEKLY'))
    )
  )
  return results.map((res, i) => ({ ...itemsData[i], ...mapDayRecord(res) }))
},

  async generateDaySchedule(agreementId, lifnr, itemsData, dayCount) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 250))
    return itemsData.map(it => ({ ...it }))
  }
  const results = await Promise.all(
    itemsData.map(item =>
      odataPost('/sg_itemSet', buildDeepPayload(agreementId, lifnr, item, 'DAILY'))
    )
  )
  return results.map((res, i) => ({ ...itemsData[i], ...mapDayRecord(res) }))
},

  async saveScheduleLines(agreementId, lifnr, itemsData) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 300))
    console.log('[mock] saveScheduleLines', agreementId, itemsData)
    return { success: true }
  }

  const results = await Promise.all(
    itemsData.map(item =>
      odataPost('/sg_itemSet', buildEditPayload(agreementId, lifnr, item))
    )
  )
  return results.map((res, i) => ({ ...itemsData[i], ...mapDayRecord(res) }))
},

  async sendForApproval(agreementId, lifnr, itemsData) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
      return { success: true }
    }
    await Promise.all(
      itemsData.map(item =>
        odataPost('/sg_itemSet', buildSendForApprovalPayload(agreementId, lifnr, item))
      )
    )
    return { success: true }
  },

  async approveSchedule(agreementId, lifnr, itemsData) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
      console.log('[mock] approveSchedule', agreementId, itemsData.map(i => i.itemNo))
      return { success: true }
    }

    await odataPost('/sg_headerSet', buildHeaderApprovePayload(agreementId, lifnr, itemsData))
    return { success: true }
  },
}

export default scheduleGenerateApi