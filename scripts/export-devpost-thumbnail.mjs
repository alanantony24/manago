/**
 * Export a high-quality 3:2 Devpost thumbnail of the ManaGo brand mark.
 * Usage: node scripts/export-devpost-thumbnail.mjs
 */
import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const OUT = path.join(ROOT, "public/devpost-thumbnail.png")

const WIDTH = 1800
const HEIGHT = 1200

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Erica+One&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: ${WIDTH}px;
      height: ${HEIGHT}px;
      overflow: hidden;
    }
    body {
      display: grid;
      place-items: center;
      background:
        radial-gradient(ellipse 90% 70% at 18% 12%, rgba(243, 156, 18, 0.22), transparent 55%),
        radial-gradient(ellipse 80% 65% at 88% 88%, rgba(212, 232, 208, 0.18), transparent 50%),
        linear-gradient(145deg, #0a6e6e 0%, #007979 42%, #1a4d59 100%);
      font-family: "Erica One", system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .mark {
      display: flex;
      align-items: center;
      gap: 28px;
      filter: drop-shadow(0 18px 40px rgba(0, 0, 0, 0.28));
    }
    .pin {
      width: 168px;
      height: 168px;
      flex-shrink: 0;
    }
    .wordmark {
      font-size: 168px;
      line-height: 0.92;
      letter-spacing: -0.04em;
      color: #ffffff;
      white-space: nowrap;
    }
    .bang { color: #f39c12; }
  </style>
</head>
<body>
  <div class="mark" role="img" aria-label="ManaGo">
    <svg class="pin" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="24" cy="24" r="24" fill="#F39C12"/>
      <path d="M24 11c-4.2 0-7.5 3.3-7.5 7.5 0 5.6 7.5 14.5 7.5 14.5s7.5-8.9 7.5-14.5C31.5 14.3 28.2 11 24 11z" fill="#FFFFFF"/>
    </svg>
    <h1 class="wordmark">ManaGo<span class="bang">!</span></h1>
  </div>
</body>
</html>`

async function main() {
  await mkdir(path.dirname(OUT), { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  })
  await page.setContent(HTML, { waitUntil: "networkidle" })
  // Ensure webfont is applied before capture
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  await page.waitForTimeout(200)
  await page.screenshot({
    path: OUT,
    type: "png",
    omitBackground: false,
  })
  await browser.close()
  console.log(`Wrote ${OUT} (${WIDTH}×${HEIGHT}, 3:2)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
