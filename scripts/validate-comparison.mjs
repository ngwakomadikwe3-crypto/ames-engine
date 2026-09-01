import { chromium } from 'playwright'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const events = []
const url = process.env.AMES_COMPARISON_URL ?? 'http://127.0.0.1:5173/diamond-comparison.html'
page.on('console', (message) => events.push(`console:${message.type()}:${message.text()}`))
page.on('pageerror', (error) => events.push(`pageerror:${error.message}`))
await page.goto(url)
await page.waitForTimeout(8000)
const realtime = page.locator('[data-renderer="realtime"] .jewelry-viewer')
const reference = page.locator('[data-renderer="reference"] canvas')
const realtimeUuid = await realtime.getAttribute('data-geometry-uuid')
const referenceUuid = await reference.getAttribute('data-geometry-uuid')
const realtimeFingerprint = await realtime.getAttribute('data-geometry-fingerprint')
const referenceFingerprint = await reference.getAttribute('data-geometry-fingerprint')
const realtimeEnvironmentUuid = await realtime.getAttribute('data-environment-uuid')
const referenceEnvironmentUuid = await reference.getAttribute('data-environment-uuid')
const realtimeDiagnostics = await page.locator('[data-diagnostics="realtime"]').textContent()
const referenceDiagnostics = await page.locator('[data-diagnostics="reference"]').textContent()
const result = {
  url,
  events,
  canvases: await page.locator('canvas').count(),
  referenceBox: await reference.boundingBox(),
  geometryIdentity: {
    uuid: realtimeUuid,
    fingerprint: realtimeFingerprint,
    uuidMatches: realtimeUuid === referenceUuid,
    fingerprintMatches: realtimeFingerprint === referenceFingerprint,
    environmentUuid: realtimeEnvironmentUuid,
    environmentMatches: realtimeEnvironmentUuid === referenceEnvironmentUuid,
    diagnosticsMatch: realtimeDiagnostics === referenceDiagnostics,
  },
}
console.log(JSON.stringify(result, null, 2))
await browser.close()

const applicationErrors = events.filter((event) =>
  event.startsWith('pageerror:') || event.startsWith('console:error:'),
)
if (
  result.canvases !== 2 ||
  !result.referenceBox ||
  !result.geometryIdentity.uuid ||
  !result.geometryIdentity.fingerprint ||
  !result.geometryIdentity.uuidMatches ||
  !result.geometryIdentity.fingerprintMatches ||
  !result.geometryIdentity.environmentUuid ||
  !result.geometryIdentity.environmentMatches ||
  !result.geometryIdentity.diagnosticsMatch ||
  applicationErrors.length > 0
) {
  process.exitCode = 1
}
