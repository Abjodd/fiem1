const SRV = '/sap/opu/odata/shiv/SUP_PORTAL_GDS_MVT_APP_SRV'

export const authConfig = { loginId: '', loginType: '' }


export const toSapDate = (isoDate) => {
  if (!isoDate) return ''
  return isoDate.replace(/-/g, '')
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

const getHeaders = () => ({
  Accept:    'application/json',
  Loginid:   authConfig.loginId,
  Logintype: authConfig.loginType,
})

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

async function fetchCsrfToken() {
  const res = await fetch(`${SRV}/`, {
    method: 'GET',
    headers: { ...getHeaders(), 'X-CSRF-Token': 'Fetch' },
    credentials: 'include',
  })
  return res.headers.get('X-CSRF-Token') || res.headers.get('x-csrf-token') || ''
}

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

const mapFixedBin = (raw) => ({
  asnNo:       raw.AsnNo        || '',
  fixedBin:    raw.FixedBin     || '',
  plant:       raw.Plant        || '',
  warehouseNo: raw.Warehouse_No || '',
  storageType: raw.StorageType  || '',
})

const buildPostBody = (form, { trackNo = '', year = '', txn = '1' } = {}) => {
  const currentYear = year || String(new Date().getFullYear())

  const asnResults = (form.asnNums || []).map((a) => ({
    TrackNo:         trackNo,
    Year:            currentYear,
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
    TrackNo:        trackNo,
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
    Txn:            txn,
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
    InvoiceNum:     form.lrNum     || '',
    lr:             form.lrNum     || '',
    fname:          form.finaltranspoterName || '',
    HeaderAsnNav:   { results: asnResults },
    HeaderRpmInNav: { results: [] },
  }
}

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

export const createMovementApi = {

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

  async getFixedBin(asnId, asnYear) {
    const asnNo  = `${asnId}/${asnYear || new Date().getFullYear()}`
    const filter = encodeURIComponent(`AsnNo eq '${asnNo}'`)
    const data   = await odata(`/FixedBinSet?$filter=${filter}`)
    return (data.d?.results || []).map(mapFixedBin)
  },

  async createMovement(form) {
    const token   = await fetchCsrfToken()
    const payload = buildPostBody(form, { txn: '1' })

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

    const data   = await res.json()
    const result = mapCreateResult(data.d)
    const message = result.trackNo
      ? `Movement No. ${result.trackingId} created successfully`
      : 'Movement created successfully'

    return { ...result, message }
  },

  async updateMovement(id, form) {
    const [trackNo, year] = id.split('/')
    const token   = await fetchCsrfToken()
    const payload = buildPostBody(form, { trackNo, year, txn: '2' })

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

    if (res.status === 204) return { trackingId: id, trackNo, year }
    const data = await res.json().catch(() => ({}))
    return { trackingId: id, trackNo, year, raw: data.d }
  },

  async getTracking(trackNo, year) {
    const key    = `TrackNo='${encodeURIComponent(trackNo)}',Year='${encodeURIComponent(year)}'`
    const expand = '$expand=HeaderAsnNav,HeaderRpmInNav,HeaderRpmOutNav'
    const data   = await odata(`/GoodsMvtHeaderSet(${key})?${expand}`)
    return data.d || null
  },
}

export default createMovementApi