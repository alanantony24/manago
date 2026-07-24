/**
 * Capture ManaGo mobile screenshots and wrap them in phone frames.
 * Usage:
 *   npm run dev   # in another terminal
 *   npm run gallery
 *
 * Optional: GALLERY_ONLY=07-contribute,09-help npm run gallery
 * Note: /add requires auth in middleware — temporarily add it to
 * isPublicRoute (or sign in) before capturing the Contribute screen.
 */
import { chromium, devices } from "playwright"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const OUT_RAW = path.join(ROOT, "public/gallery/raw")
const OUT_FRAMED = path.join(ROOT, "public/gallery")
const BASE = process.env.GALLERY_BASE_URL ?? "http://localhost:3000"

// Uniqlo Orchard Central — good landmark for portfolio shots
const FACILITY_ID = "b1333558-a556-4654-869d-4057371bc431"
// Slightly south of Orchard so "nearby" distances look real
const GEO = { latitude: 1.301, longitude: 103.836, accuracy: 12 }

const ONLY = new Set(
  (process.env.GALLERY_ONLY ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
)

const SHOTS = [
  {
    id: "01-nearby",
    label: "Nearby map & list",
    path: "/nearby",
    wait: "map",
    settleMs: 2500,
  },
  {
    id: "02-nearby-filter",
    label: "Amenity filters",
    path: "/nearby",
    wait: "map",
    settleMs: 1800,
    after: async (page) => {
      const chip = page.getByRole("button", { name: /Water Cooler/i })
      if (await chip.count()) await chip.first().click()
      await page.waitForTimeout(1200)
    },
  },
  {
    id: "03-facility-detail",
    label: "Facility detail",
    path: `/facilities/${FACILITY_ID}`,
    settleMs: 2000,
  },
  {
    id: "04-locate",
    label: "Turn-by-turn locate",
    path: `/locate?facilityId=${FACILITY_ID}`,
    wait: "map",
    settleMs: 4000,
    after: async (page) => {
      // Prefer walking mode if the sheet is open
      const walk = page.getByRole("button", { name: /Walk|Walking/i })
      if (await walk.count()) {
        await walk.first().click().catch(() => {})
        await page.waitForTimeout(2000)
      }
    },
  },
  {
    id: "05-sign-in",
    label: "Sign in",
    path: "/sign-in",
    settleMs: 2000,
  },
  {
    id: "06-register",
    label: "Register",
    path: "/register",
    settleMs: 2000,
  },
  {
    id: "07-contribute",
    label: "Contribute a place",
    path: "/add",
    settleMs: 2500,
    after: async (page) => {
      await page.evaluate(() => window.scrollTo(0, 0))
      const name = page.locator("#facility-name")
      if (await name.count()) {
        await name.fill("Orchard Water Station")
      }
      const water = page.getByRole("button", { name: /^Water Cooler$/i })
      if (await water.count()) await water.first().click()
      const building = page.locator("#building-name")
      if (await building.count()) {
        await building.fill("ION Orchard")
      }
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.waitForTimeout(600)
    },
  },
  {
    id: "08-review",
    label: "Leave a review",
    path: `/facilities/${FACILITY_ID}/review`,
    settleMs: 2000,
    after: async (page) => {
      const stars = page.locator('button[aria-label*="star" i], button:has(svg)')
      const count = await stars.count()
      if (count >= 4) await stars.nth(3).click().catch(() => {})
      await page.waitForTimeout(400)
    },
  },
  {
    id: "09-help",
    label: "Help & FAQ",
    path: "/help",
    settleMs: 1500,
  },
  {
    id: "10-nav-drawer",
    label: "Navigation menu",
    path: "/nearby",
    wait: "map",
    settleMs: 1500,
    after: async (page) => {
      const toggle = page.getByRole("button", { name: /Open menu|Close menu/i })
      if (await toggle.count()) {
        await toggle.first().click()
        await page.waitForTimeout(600)
      }
    },
  },
]

async function dismissNoise(page) {
  // Hide common Clerk/dev overlays that spoil marketing shots
  await page.addStyleTag({
    content: `
      .cl-internal-b3fm6y,
      iframe[src*="clerk"],
      [data-clerk-component="ImpersonationFab"],
      nextjs-portal,
      [data-nextjs-toast],
      [data-sonner-toaster] { display: none !important; }
    `,
  }).catch(() => {})
}

async function waitForMap(page) {
  await page.waitForSelector(".mapboxgl-canvas, canvas.mapboxgl-canvas", {
    timeout: 15000,
  }).catch(() => {})
  // Give tiles a moment to paint
  await page.waitForTimeout(1500)
}

async function capture() {
  await mkdir(OUT_RAW, { recursive: true })
  await mkdir(OUT_FRAMED, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  // Explicit tall phone viewport — Playwright device presets can end up short
  // in headless shell and produce a stubby/square frame.
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: devices["iPhone 14"].userAgent,
    geolocation: GEO,
    permissions: ["geolocation"],
    locale: "en-SG",
    colorScheme: "light",
  })
  const page = await context.newPage()
  // Hard-enforce size in case anything overrides context viewport
  await page.setViewportSize({ width: 390, height: 844 })

  for (const shot of SHOTS) {
    if (ONLY.size > 0 && !ONLY.has(shot.id)) continue
    process.stdout.write(`Capturing ${shot.id}… `)
    const url = `${BASE}${shot.path}`
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(
      async () => page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 })
    )
    await dismissNoise(page)
    if (shot.wait === "map") await waitForMap(page)
    if (shot.after) await shot.after(page)
    await page.waitForTimeout(shot.settleMs ?? 1000)

    const rawPath = path.join(OUT_RAW, `${shot.id}.png`)
    await page.screenshot({ path: rawPath, fullPage: false, type: "png" })
    console.log("ok")
  }

  await browser.close()

  const manifestPath = path.join(OUT_FRAMED, "manifest.json")
  // Keep full manifest labels for framing even when only a subset was captured
  const fullManifest = SHOTS.map(({ id, label, path: p }) => ({ id, label, path: p }))
  await writeFile(manifestPath, JSON.stringify(fullManifest, null, 2))

  // Frame with Pillow
  const frameScript = path.join(__dirname, "frame-gallery.py")
  const result = spawnSync("python3", [frameScript], {
    cwd: ROOT,
    stdio: "inherit",
  })
  if (result.status !== 0) {
    console.error("Framing failed")
    process.exit(result.status ?? 1)
  }

  console.log(`\nDone. Framed shots in ${OUT_FRAMED}`)
}

capture().catch((err) => {
  console.error(err)
  process.exit(1)
})
