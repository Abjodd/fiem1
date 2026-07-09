// src/services/UploadAttachment.js
import { authConfig } from '../../authConfig.js'
const SA_ODATA_BASE = '/sap/opu/odata/shiv/NW_SUPP_PORTAL_PO_APP_SRV'
// export const authConfig = { loginId: '', loginType: '' }

/**
 * Fetch a CSRF token from the SA OData service.
 * SAP requires a valid X-CSRF-Token for all POST requests.
 */
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
 * Upload a single File to SAP AsnAttachementSet.
 *
 * SAP media-link entry pattern:
 *   POST /AsnAttachementSet
 *   Content-Type: <file mime type>
 *   slug: <filename>          ← SAP reads filename from this header
 *   X-CSRF-Token: <token>
 *   Body: raw file binary
 *
 * The AsnNum / FisYear association is done via query params or custom headers
 * depending on your SAP backend implementation. Both approaches are tried here.
 *
 * @param {object} opts
 * @param {string}  opts.asnNum    - ASN number returned from postCreateAsn e.g. "2600000100"
 * @param {string}  opts.fisYear   - Fiscal year e.g. "2026"
 * @param {File}    opts.file      - Raw browser File object
 * @param {string}  opts.csrfToken - Token fetched before upload loop
 * @param {string}  [opts.kind]    - "general" | "pdir" (informational, logged only)
 */
export async function uploadAttachmentToSap({ asnNum, fisYear, file, csrfToken, kind = 'general' }) {
  // Build URL — some SAP backends accept key fields as query params
  const url = `${SA_ODATA_BASE}/AsnAttachementSet`

  const buffer = await file.arrayBuffer()
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      // Content-Type must be the real file MIME so SAP stores it correctly
      'Content-Type': file.type || 'application/octet-stream',
      'Accept': 'application/json',
      'X-CSRF-Token': csrfToken,
        Loginid: authConfig.loginId,
        Logintype: authConfig.loginType,
      // SAP reads the filename from the slug header
      'slug': `${asnNum}/${fisYear}/${file.name}`,
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
 * Upload all attachments (general + pdir) for a given ASN.
 * Fetches CSRF token once, then uploads sequentially.
 *
 * @param {object}   opts
 * @param {string}   opts.asnNum             - ASN number
 * @param {string}   opts.fisYear            - Fiscal year
 * @param {Array}    opts.generalAttachments  - Array of attachment objects with ._file (File)
 * @param {Array}    opts.pdirAttachments     - Array of attachment objects with ._file (File)
 *
 * @returns {{ uploaded: number, failed: Array<{name:string, error:string}> }}
 */
export async function uploadAllAttachments({ asnNum, fisYear, generalAttachments, pdirAttachments }) {
  const allAttachments = [
    ...generalAttachments.map(a => ({ ...a, kind: 'general' })),
    ...pdirAttachments.map(a => ({ ...a, kind: 'pdir' })),
  ]

  // Nothing to upload
  if (allAttachments.length === 0) return { uploaded: 0, failed: [] }

  // Fetch CSRF token once for all uploads
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