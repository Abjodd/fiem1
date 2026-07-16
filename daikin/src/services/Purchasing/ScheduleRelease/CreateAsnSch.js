const ODATA_BASE = '/sap/opu/odata/shiv/NW_SUPP_PORTAL_SA_SRV'
export const authConfig = { loginId: '', loginType: '' }

const str = (v) => String(v ?? '').trim()
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const sapDateDisplay = (v) => {
  const s = str(v)
  if (s.length !== 8) return s
  const y = s.slice(0, 4), m = s.slice(4, 6), d = s.slice(6, 8)
  const mi = parseInt(m, 10) - 1
  if (mi < 0 || mi > 11) return s
  return `${MONTHS[mi]} ${d}, ${y}`
}

function toSap8(v) {
  const s = str(v)
  if (!s) return ''
  if (/^\d{8}$/.test(s)) return s
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.replace(/-/g, '')
  const d = new Date(s)
  if (!isNaN(d)) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}${m}${day}`
  }
  return ''
}

const getHeaders = () => ({
  Accept: 'application/json',
  Loginid: authConfig.loginId,
  Logintype: authConfig.loginType,
})

async function odataGet(path) {
  const res = await fetch(`${ODATA_BASE}${path}`, { headers: getHeaders() })
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`)
  return res.json()
}

async function fetchCsrfToken() {
  const res = await fetch(`${ODATA_BASE}/`, {
    method: 'GET',
    headers: { ...getHeaders(), 'X-CSRF-Token': 'Fetch' },
    credentials: 'include',
  })
  return res.headers.get('X-CSRF-Token') || res.headers.get('x-csrf-token') || ''
}


function mapAsnItem(d, idx = 0) {
  const ebelp = str(d.Ebelp)      
  const etenr = str(d.Etenr)
  const eindt = str(d.Eindt)

  const conQty = str(d.Con_Qty)
  const delQty = str(d.DelQty)
  const menge  = str(d.Menge)     

  return {
    itemNo: `${ebelp}-${etenr || '0'}-${eindt}-${idx}`,
    ebelp,
    schLine:          etenr,
    ebeln:            str(d.Ebeln || d.Schedule_No),
    scheduleNo:       str(d.Schedule_No),
    eindt:            str(d.Eindt),
    werks:            str(d.Werks),
    maktx:            str(d.Maktx),
    plantDesc:        str(d.PlantDesc),
    perUnit:          str(d.PerUnit),    
    warningMsg:       str(d.Warningmsg),
    pstyp:            str(d.Pstyp),

    igst:             str(d.Igst    || '0'),
    cgst:             str(d.Cgst    || '0'),
    sgst:             str(d.Sgst    || '0'),
    igstPer:          str(d.Igst_per || '0'),
    cgstPer:          str(d.Cgst_per || '0'),
    sgstPer:          str(d.Sgst_per || '0'),
    tax:              str(d.Tax     || '0'),   
    currency:         str(d.Currency || ''),

    materialName:     str(d.Maktx),
    materialNumber:   str(d.Matnr),
    storageLocation:  str(d.StorageLocation),
    warehouseNo:      str(d.Warehouse_No),
    hsn:              str(d.Hsn_Code),

    shipmentDate:     sapDateDisplay(d.Eindt),
    materialExpiry:   str(d.MatExpDate),

    totalQty:         str(d.Total_Qty),
    totalUnit:        str(d.Meins),
    confQty:          conQty,
    confUnit:         str(d.Meins),
    asnCreated:       str(d.Asn_Created),
    draftAsnQty:      str(d.Draft_AsnQty || '0'),
    spq:              str(d.SOQ),

    avlAsnQty:        menge,
    delQty:           delQty,
    deliveredQty:     delQty,
    deliveredUnit:    str(d.Meins),

    netPrice:         str(d.Netpr),
    supplierNetPrice: str(d.NetprVen),

    packingMaterialQty:  '1',
    packingMaterialType: str(d.PkgMatType),
    packagingType:       str(d.PackingStyle),
    pdirNo:              str(d.PdirRefNo),

    fgStock:          '',
    qtyPerPackaging:  '',
    taxMismatch:      false,
    batches:          [],
  }
}

export const createAsnApi = {

  async getEligibleItems({ scheduleNo, fromDate, toDate, storageLocation = '' } = {}) {
    let filter = `Schedule_No eq '${scheduleNo}'`
    const dateParts = []
    if (fromDate) dateParts.push(`Eindt ge '${toSap8(fromDate)}'`)
    if (toDate)   dateParts.push(`Eindt le '${toSap8(toDate)}'`)
    if (dateParts.length) filter += ` and ((${dateParts.join(' and ')}))`
    if (storageLocation.trim()) {
      filter += ` and StorageLocation eq '${storageLocation.trim()}'`
    }
    const json = await odataGet(`/ASN_itemSet?$filter=${encodeURIComponent(filter)}&$format=json`)
    
    const results = json.d?.results || []
    let globalSchCounter = 1;
    
    return results.map((d, idx) => {
      const item = mapAsnItem(d, idx)
      
      const genSch = String(globalSchCounter++)
      item.schLine = item.schLine ? String(parseInt(item.schLine, 10)) : genSch
      
      item.itemNo = `${item.ebelp}-${item.schLine}-${item.eindt}-${idx}`
      
      return item
    })
  },

  async getPdirRefNos(scheduleNo) {
    const json = await odataGet(`/Pdir_ref_noSet?$filter=Ebeln eq '${scheduleNo}'&$format=json`)
    return (json.d?.results || [])
      .map(d => str(d.PdirRefNo || d.Pdir_ref_no || ''))
      .filter(Boolean)
  },

  async submitAsn({
    scheduleNo, plant, invoiceNumber, invoiceDate, invoiceAmount,
    totalPacking, items,
  }) {
    const token = await fetchCsrfToken()

    // ── Item rows ─────────────────────────────────────────────────────────────
    let globalSchCounter = 1;

    const itemRows = items.map(it => {
      const menge = String(parseFloat(it.avlAsnQty || '0'))
      
      const ebelpStr = str(it.ebelp)
      const generatedEtenr = String(globalSchCounter++)

      const itemObj = {
        __metadata: {
          type: 'SHIV.AAL_SUP_PORTAL_SA_SRV.ASN_ITEM',  
        },

        Schedule_No:     str(it.scheduleNo || scheduleNo),
        Ebelp:           ebelpStr,          
        AsnNum:          '',
        DelQty:          str(it.delQty    || '0'),
        Etenr:           generatedEtenr,
        Ebeln:           str(it.ebeln || scheduleNo),
        Eindt:           str(it.eindt),
        Werks:           str(it.werks || plant),

        Matnr:           str(it.materialNumber),
        Maktx:           str(it.maktx || it.materialName),
        Meins:           str(it.totalUnit),

        Menge:           str(it.avlAsnQty || '0'),                   

        Netpr:           String(parseFloat(it.netPrice          || '0')),  
        NetprVen:        String(parseFloat(it.supplierNetPrice  || '0')),

        ShipDate:        str(it.eindt),
        MatExpDate:      it.materialExpiry ? toSap8(it.materialExpiry) : '',

        PkgMatQty:       String(parseFloat(it.packingMaterialQty  || '0')),
        PkgMatType:      str(it.packingMaterialType || ''),
        PackingStyle:    str(it.packagingType       || ''),

        PdirRefNo:       str(it.pdirNo              || ''),
        StorageLocation: str(it.storageLocation),
        Warehouse_No:    str(it.warehouseNo         || ''),
        TaxChange:       it.taxMismatch ? 'X' : '',
        FixedBin:        it.batches?.[0]?.batchCode || '',
        PerUnit:         String(parseFloat(it.perUnit || '1') || 1),  
        PlantDesc:       str(it.plantDesc           || ''),
        Warningmsg:      '',

        Hsn_Code:        str(it.hsn      || ''),
        Igst:            String(parseFloat(it.igst    || '0')),
        Cgst:            String(parseFloat(it.cgst    || '0')),
        Sgst:            String(parseFloat(it.sgst    || '0')),
        Igst_per:        String(parseFloat(it.igstPer || '0')),
        Cgst_per:        String(parseFloat(it.cgstPer || '0')),
        Sgst_per:        String(parseFloat(it.sgstPer || '0')),
        Tax:             String(parseFloat(it.tax     || '0')),  
        Currency:        str(it.currency || ''),

        Total_Qty:       String(parseFloat(it.totalQty    || '0')),
        Con_Qty:         String(parseFloat(it.confQty     || '0')),
        Asn_Created:     String(parseFloat(it.asnCreated  || '0')),
        Draft_AsnQty:    String(parseFloat(it.draftAsnQty || '0')),
        Pstyp:           str(it.pstyp  || ''),
        SOQ:             String(parseFloat(it.spq || '0')),

        App: '',
      }

      if (it.batches && it.batches.length > 0) {
        itemObj.BatchSplitSet = it.batches.map(b => ({
          Batch: str(b.batchCode),
          Menge: String(parseInt(b.quantity, 10)),
          Po_No: str(scheduleNo),
          Ebelp: ebelpStr,
          Etenr: generatedEtenr,
          ProductionDate: str(it.eindt || ''),
          MatExpDate: ''
        }))
      }

      return itemObj
    })

    const payload = {
      Update:               false,
      DraftAsn:             false,
      AsnNum:               '',
      Buyer_Name:           '',
      Currency:             '',
      InvoiceAmt:           String(invoiceAmount),
      ASNamt:               String(invoiceAmount),
      InvoiceDate:          toSap8(invoiceDate),
      InvoiceNum:           invoiceNumber,
      InvoiceVal:           String(invoiceAmount),
      Purchase_Group_Desc:  '',
      Schedule_No:          scheduleNo,
      ShipTime:             '',
      Total_Amount:         '',
      UnplannedCost:        '0',
      UnplannedCost_text:   '',
      Werks:                plant,
      Fis_Year:             '',
      TotalPacking:         String(totalPacking || ''),
      ASNItemnav:           { results: itemRows },
    }

    const res = await fetch(`${ODATA_BASE}/ASN_HEADERSet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-CSRF-Token': token,
        Loginid: authConfig.loginId,
        Logintype: authConfig.loginType,
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

    const data = await res.json()
    const asnNum  = str(data.d?.AsnNum   || data.AsnNum  || '')
    const fisYear = str(data.d?.Fis_Year || data.Fis_Year || '')
    const message = asnNum
      ? `ASN No. ${asnNum}${fisYear ? '/' + fisYear : ''} created successfully`
      : 'ASN created successfully'
    return { asnNum, fisYear, message, raw: data }
  },

  async uploadAttachment(asnDraftId, file, kind = 'general') {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('kind', kind)
    const res = await fetch(`${ODATA_BASE}/AsnAttachementSet`, { method: 'POST', body: fd })
    if (!res.ok) throw new Error('Failed to upload')
    return res.json()
  },
}

export default createAsnApi