// ═══════════════════════════════════════════════════════════════
// Create Movement OData API
// Service: SUP_PORTAL_GDS_MVT_APP_SRV
// ═══════════════════════════════════════════════════════════════

const SRV = '/sap/opu/odata/shiv/SUP_PORTAL_GDS_MVT_APP_SRV'

// ── Auth config ───────────────────────────────────────────────
export const authConfig = { loginId: '', loginType: '' }

// ── SAP Date helpers ──────────────────────────────────────────

export const toSapDate = (isoDate) => {
  if (!isoDate) return ''
  return isoDate.replace(/-/g, '')               // '2026-05-27' → '20260527'
}

export const fromSapDate = (sapDate) => {
  if (!sapDate || sapDate === '00000000') return ''
  return `${sapDate.slice(0, 4)}-${sapDate.slice(4, 6)}-${sapDate.slice(6, 8)}`
}

export const fromSapDateDisplay = (sapDate) => {
  if (!sapDate || sapDate === '00000000') return ''
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const y = sapDate.slice(0, 4)
  const m = parseInt(sapDate.slice(4, 6), 10) - 1
  const d = parseInt(sapDate.slice(6, 8), 10)
  return `${months[m]} ${String(d).padStart(2, '0')}, ${y}`
}

// ─────────────────────────────────────────────────────────────

const TRANS_MODE_LABEL_TO_CODE = {
  'By Road':         '01',
  'By Air':          '02',
  'By Rail':         '03',
  'By Ship':         '04',
  'By Sea':          '04',
  'By Courier':      '05',
  'By Hand':         '06',
  'Tie-up Supplier': '07',
}

// ── Shared headers ────────────────────────────────────────────
const getHeaders = () => ({
  Accept:    'application/json',
  Loginid:   authConfig.loginId,
  Logintype: authConfig.loginType,
})

// ── Generic OData fetch (GET) ─────────────────────────────────
async function odata(path) {
  const res = await fetch(`${SRV}${path}`, {
    headers: getHeaders(),
    credentials: 'include',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OData ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

// ── CSRF token fetch ──────────────────────────────────────────
async function fetchCsrfToken() {
  const res = await fetch(`${SRV}/`, {
    method: 'GET',
    headers: { ...getHeaders(), 'X-CSRF-Token': 'Fetch' },
    credentials: 'include',
  })
  return res.headers.get('X-CSRF-Token') || res.headers.get('x-csrf-token') || ''
}

// ── Generic OData write (PATCH only — POST handled explicitly) ─
async function odataWrite(path, payload, method = 'PATCH') {
  const csrf = await fetchCsrfToken()
  const res = await fetch(`${SRV}${path}`, {
    method,
    headers: {
      ...getHeaders(),
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf,
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OData ${method} ${res.status}: ${text.slice(0, 200)}`)
  }
  if (res.status === 204) return {}
  return res.json()
}

// ── ASN Mapper (AsnHelpSet row → UI shape) ────────────────────
const mapAsnHelp = (raw) => ({
  asnId:           raw.Asn              || '',
  asnYear:         raw.AsnYear          || '',
  invoiceNumber:   raw.InvNum           || '',
  invoiceAmount:   parseFloat((raw.Price || '0').trim()),
  currency:        raw.Curr             || '',
  plant:           raw.Plant            || '',
  warehouseNo:     raw.Warehouse_No     || '',
  storageLocation: raw.StorageLocation  || '',
  trackNo:         raw.TrackNo          || '',
})

// ── FixedBin Mapper ───────────────────────────────────────────
const mapFixedBin = (raw) => ({
  asnNo:       raw.AsnNo        || '',
  fixedBin:    raw.FixedBin     || '',
  plant:       raw.Plant        || '',
  warehouseNo: raw.Warehouse_No || '',
  storageType: raw.StorageType  || '',
})

// ── POST body builder ─────────────────────────────────────────
const buildPostBody = (form) => {
  const currentYear = String(new Date().getFullYear())

  const asnResults = (form.asnNums || []).map((a) => ({
    TrackNo:         '',
    Year:            '',
    Asn:             a.asnId,
    AsnYear:         a.asnYear || currentYear,
    ItmCount:        '',
    Price:           '',
    Curr:            '',
    InvNo:           '',
    InvDate:         '',
    IbdNo:           '',
    Plant:           '',
    Warehouse_No:    '',
    StorageLocation: '',
  }))

  return {
    TrackNo:        '',
    Year:           currentYear,
    Vendor:         '',
    Name:           '',
    RegNum:         (form.vehicleRegNo   || '').toUpperCase(),
    Transporter:    form.transporterName || '',
    Person:         form.driverName      || '',
    Contact:        form.contactNumber   || '',
    Mode:           TRANS_MODE_LABEL_TO_CODE[form.transportMode] || '01',
    TransMode:      form.transportMode   || 'By Road',
    CreateDate:     '',
    CreateTime:     '',
    ShipDate:       '',
    ShipTime:       '',
    InDate:         '',
    InTime:         '',
    RepDate:        '',
    RepTime:        '',
    GrDate:         '',
    GrTime:         '',
    GrEndDate:      '',
    GrEndTime:      '',
    OutDate:        '',
    OutTime:        '',
    Eta:            '',
    EtaTime:        '',
    Status:         '',
    StatusText:     '',
    Shipment:       '',
    Txn:            '1',
    EwayBill:       form.ewayBillNo                      || '',
    EwayBillDate:   toSapDate(form.ewayBillDate)         || '',
    LeadTime:       '',
    Vbeln:          '',
    Plant:          '',
    PlantText:      '',
    PollCertApp:    !!form.pollutionCertificateApplicable,
    SafetyEquip:    !!form.safetyEquipments,
    SafetyGauMat:   !!form.safetyGuardForMaterial,
    TotalAmt:       '',
    FixedBin:       form.fixedBin  || '',
    InvoiceNum:     form.lrNum     || '',   // LR No. → InvoiceNum
    HeaderAsnNav:   { results: asnResults },
    HeaderRpmInNav: { results: [] },
  }
}

// ── PATCH body builder ────────────────────────────────────────
const buildPatchBody = (form) => ({
  RegNum:      (form.vehicleRegNo   || '').toUpperCase(),
  Transporter:  form.transporterName || '',
  Person:       form.driverName      || '',
  Contact:      form.contactNumber   || '',
  Mode:         TRANS_MODE_LABEL_TO_CODE[form.transportMode] || '01',
  TransMode:    form.transportMode   || 'By Road',
  EwayBill:     form.ewayBillNo      || '',
  EwayBillDate: toSapDate(form.ewayBillDate) || '',
  InvoiceNum:   form.lrNum           || '',
  PollCertApp:  !!form.pollutionCertificateApplicable,
  SafetyEquip:  !!form.safetyEquipments,
  SafetyGauMat: !!form.safetyGuardForMaterial,
})

// ── Result mapper after POST ──────────────────────────────────
const mapCreateResult = (d) => {
  const trackNo = d?.TrackNo || ''
  const year    = d?.Year    || String(new Date().getFullYear())
  return {
    trackingId: `${trackNo}/${year}`,
    trackNo,
    year,
    raw: d,
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTED API
// ═══════════════════════════════════════════════════════════════
export const createMovementApi = {

  // ── Search ASNs (AsnHelpSet) ────────────────────────────────
  // GET /AsnHelpSet?$skip=0&$top=300
  async searchAsns({ search = '' } = {}) {
    const data = await odata('/AsnHelpSet?$skip=0&$top=300')
    let results = (data.d?.results || []).map(mapAsnHelp)

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      results = results.filter((a) =>
        a.asnId.toLowerCase().includes(q) ||
        (a.invoiceNumber || '').toLowerCase().includes(q) ||
        (a.plant         || '').toLowerCase().includes(q)
      )
    }
    return results
  },

  // ── Fetch FixedBin for a selected ASN ──────────────────────
  // GET /FixedBinSet?$filter=AsnNo eq '2600000103/2026'
  async getFixedBin(asnId, asnYear) {
    const asnNo  = `${asnId}/${asnYear || new Date().getFullYear()}`
    const filter = encodeURIComponent(`AsnNo eq '${asnNo}'`)
    const data   = await odata(`/FixedBinSet?$filter=${filter}`)
    return (data.d?.results || []).map(mapFixedBin)
  },

  // ── Create Movement (POST GoodsMvtHeaderSet) ────────────────
  // Mirrors createAsnApi.submitAsn pattern:
  //   • raw fetch (not odataWrite) so we can parse SAP error JSON properly
  //   • extracts error.message.value on failure
  //   • returns { trackingId, trackNo, year, message, raw }
  async createMovement(form) {
    const token   = await fetchCsrfToken()
    const payload = buildPostBody(form)

    const res = await fetch(`${SRV}/GoodsMvtHeaderSet`, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        'Content-Type': 'application/json',
        'X-CSRF-Token': token,
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

    const data    = await res.json()
    const result  = mapCreateResult(data.d)
    const message = result.trackNo
      ? `Movement No. ${result.trackingId} created successfully`
      : 'Movement created successfully'

    return { ...result, message }
  },

  // ── Update Movement (PATCH GoodsMvtHeaderSet) ───────────────
  async updateMovement(id, form) {
    const [trackNo, year] = id.split('/')
    const key  = `TrackNo='${encodeURIComponent(trackNo)}',Year='${encodeURIComponent(year)}'`
    const body = buildPatchBody(form)
    await odataWrite(`/GoodsMvtHeaderSet(${key})`, body, 'PATCH')
    return { trackingId: id, trackNo, year }
  },

  // ── Get tracking after create (for detail navigation) ───────
  // GET /GoodsMvtHeaderSet(TrackNo='...',Year='...')?$expand=...
  async getTracking(trackNo, year) {
    const key    = `TrackNo='${encodeURIComponent(trackNo)}',Year='${encodeURIComponent(year)}'`
    const expand = '$expand=HeaderAsnNav,HeaderRpmInNav,HeaderRpmOutNav'
    const data   = await odata(`/GoodsMvtHeaderSet(${key})?${expand}`)
    return data.d || null
  },
}

export default createMovementApi