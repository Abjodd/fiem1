import { authConfig } from '../../authConfig.js'
const SA_ODATA_BASE = '/sap/opu/odata/shiv/NW_SUPP_PORTAL_PO_APP_SRV'

async function fetchCsrfToken() {
  const res = await fetch(`${SA_ODATA_BASE}/`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-CSRF-Token': 'Fetch',
        Loginid: authConfig.loginId,
        Logintype: authConfig.loginType,
    },
    credentials: 'include',
  })
  const token = res.headers.get('x-csrf-token') || ''
  if (!token) console.warn('CSRF token not returned — POST may fail')
  return token
}

/**
 *
 * @param {object} opts
 * @param {string}  opts.asnNum    
 * @param {string}  opts.fisYear   
 * @param {File}    opts.file      
 * @param {string}  opts.csrfToken 
 * @param {string}  [opts.kind]    
 */
export async function uploadAttachmentToSap({ asnNum, fisYear, file, csrfToken, kind = 'general' }) {
  const url = `${SA_ODATA_BASE}/AsnAttachementSet`
  const buffer = await file.arrayBuffer()
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'Accept': 'application/json',
      'X-CSRF-Token': csrfToken,
        Loginid: authConfig.loginId,
        Logintype: authConfig.loginType,
      'slug': `${asnNum}/${fisYear}/${file.name}`,
      'AsnNum': asnNum,
      'FisYear': fisYear,
    },
    body: buffer,
    credentials: 'include',
  })

  if (!res.ok) {
    let errMsg = `Attachment upload failed: HTTP ${res.status} — ${res.statusText}`
    try {
      const errJson = await res.json()
      const sapMsg = errJson?.error?.message?.value
      if (sapMsg) errMsg = sapMsg
    } catch { /* ignore parse errors */ }
    throw new Error(errMsg)
  }

  console.log(`[UploadAttachment] ${kind} file "${file.name}" uploaded for ASN ${asnNum}/${fisYear}`)
  return res
}

/**
 * @param {object}   opts
 * @param {string}   opts.asnNum             
 * @param {string}   opts.fisYear            
 * @param {Array}    opts.generalAttachments  
 * @param {Array}    opts.pdirAttachments     
 * @returns {{ uploaded: number, failed: Array<{name:string, error:string}> }}
 */
export async function uploadAllAttachments({ asnNum, fisYear, generalAttachments, pdirAttachments }) {
  const allAttachments = [
    ...generalAttachments.map(a => ({ ...a, kind: 'general' })),
    ...pdirAttachments.map(a => ({ ...a, kind: 'pdir' })),
  ]

  if (allAttachments.length === 0) return { uploaded: 0, failed: [] }

  const csrfToken = await fetchCsrfToken()
  let uploaded = 0
  const failed = []

  for (const att of allAttachments) {
    if (!att._file) {
      console.warn(`[UploadAttachment] Skipping "${att.name}" — no _file reference stored`)
      continue
    }
    try {
      await uploadAttachmentToSap({ asnNum, fisYear, file: att._file, csrfToken, kind: att.kind })
      uploaded++
    } catch (err) {
      console.error(`[UploadAttachment] Failed to upload "${att.name}":`, err.message)
      failed.push({ name: att.name, error: err.message })
    }
  }

  return { uploaded, failed }
}