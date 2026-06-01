// ═══════════════════════════════════════════════════════════════
// scheduleGenerateService.js — Schedule Generate API
// Mock data now, OData integration later
// ═══════════════════════════════════════════════════════════════

const USE_MOCK = true
// const SRV = '/sap/opu/odata/shiv/SUP_PORTAL_SCHEDULE_SRV'

// ── Mock suppliers with SA data ───────────────────────────────
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
        { itemNo: '10', sapCode: '3p566', description: 'flare cap', hsnCode: '84159000', totalQuantity: 2000, unitPrice: 0.78, indicator: '', status: 'Not Generated', days: new Array(30).fill(0), frozenDays: [] },
        { itemNo: '20', sapCode: '3p567', description: 'FLARE CAP PACKAGING', hsnCode: '84159000', totalQuantity: 1000, unitPrice: 0.65, indicator: '', status: 'Not Generated', days: new Array(30).fill(0), frozenDays: [] },
        { itemNo: '30', sapCode: '3p568', description: 'FLARE CAP PACKAGING', hsnCode: '84159000', totalQuantity: 2500, unitPrice: 0.65, indicator: '', status: 'Not Generated', days: new Array(30).fill(0), frozenDays: [] },
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
        { itemNo: '10', sapCode: '3P6201', description: 'Compressor mount bracket', hsnCode: '73269099', totalQuantity: 600, unitPrice: 4.10, indicator: '', status: 'Not Generated', days: new Array(30).fill(0), frozenDays: [] },
        { itemNo: '20', sapCode: '3P6202', description: 'Motor housing plate', hsnCode: '73269099', totalQuantity: 1200, unitPrice: 2.85, indicator: '', status: 'Not Generated', days: new Array(30).fill(0), frozenDays: [] },
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
        { itemNo: '10', sapCode: '3P7104', description: 'Drain pan assembly', hsnCode: '84159000', totalQuantity: 800, unitPrice: 2.40, indicator: '', status: 'Not Generated', days: new Array(30).fill(0), frozenDays: [] },
      ],
    }],
  },
}

// ── Schedule generation helpers ───────────────────────────────
export function generateDays(totalQty, mode, dayCount) {
  const days = new Array(30).fill(0)
  if (mode === 'week') {
    const slots = [0, 7, 14, 21] // days 1, 8, 15, 22
    const per = Math.floor(totalQty / 4)
    const rem = totalQty - per * 4
    slots.forEach((d, i) => { days[d] = per + (i < rem ? 1 : 0) })
  } else {
    const n = Math.min(dayCount, 30)
    const per = Math.floor(totalQty / n)
    const rem = totalQty - per * n
    for (let i = 0; i < n; i++) days[i] = per + (i < rem ? 1 : 0)
  }
  return days
}

// ── API ───────────────────────────────────────────────────────
export const scheduleGenerateApi = {

  async fetchSupplier(code) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 200))
      const s = MOCK_SUPPLIERS[code.toUpperCase()]
      if (!s) return null
      // Deep clone so mutations don't affect mock store
      return JSON.parse(JSON.stringify(s))
    }
    // const data = await odata(`/SupplierHelpSet('${code}')?$expand=AgreementNav/ItemNav`)
    // return mapSupplier(data.d)
  },

  async saveScheduleLines(agreementId, items) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
      console.log('Saved schedule lines for', agreementId, items)
      return { success: true }
    }
    // const csrf = await fetchCsrfToken()
    // return odataWrite('/ScheduleLineSet', { AgreementId: agreementId, Items: items })
  },

  async approveSchedule(agreementId, itemNos) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
      console.log('Approved', agreementId, itemNos)
      return { success: true }
    }
    // return odataWrite('/ApproveSet', { AgreementId: agreementId, Items: itemNos })
  },
}

export default scheduleGenerateApi