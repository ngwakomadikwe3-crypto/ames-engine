import { chromium } from 'playwright'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const events = []
const url = process.env.AMES_COMPARISON_URL ?? 'http://127.0.0.1:5173/diamond-comparison.html'
page.on('console', (message) => events.push(`console:${message.type()}:${message.text()}`))
page.on('pageerror', (error) => events.push(`pageerror:${error.message}`))
await page.goto(url)
await page.waitForTimeout(8000)
const result = {
  url,
  events,
  canvases: await page.locator('canvas').count(),
  referenceBox: await page.locator('[data-renderer="reference"] canvas').boundingBox(),
}
console.log(JSON.stringify(result, null, 2))
await browser.close()

const applicationErrors = events.filter((event) =>
  event.startsWith('pageerror:') || event.startsWith('console:error:'),
)
if (result.canvases !== 2 || !result.referenceBox || applicationErrors.length > 0) {
  process.exitCode = 1
}
