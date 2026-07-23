import { readFileSync, writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import {
  cleanFacility,
  groupFacilitiesByType,
  loadFacilitiesFromJson,
} from "./facility-data-utils.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const jsonPath = resolve(__dirname, "../data/facilities.json")

const raw = JSON.parse(readFileSync(jsonPath, "utf-8"))
const facilities = loadFacilitiesFromJson(raw).map(cleanFacility)

const qualityCounts = { complete: 0, partial: 0, minimal: 0 }
for (const facility of facilities) {
  qualityCounts[facility.data_quality]++
}

const grouped = groupFacilitiesByType(facilities)
const output = {
  metadata: {
    ...raw.metadata,
    last_cleaned: new Date().toISOString().slice(0, 19).replace("T", " "),
    data_quality_summary: qualityCounts,
    total_toilets_with_bidets: grouped.toilets_with_bidets.length,
    total_water_coolers: grouped.water_coolers.length,
    total_nursing_rooms: grouped.nursing_rooms.length,
  },
  toilets_with_bidets: grouped.toilets_with_bidets,
  water_coolers: grouped.water_coolers,
  nursing_rooms: grouped.nursing_rooms,
}

writeFileSync(jsonPath, JSON.stringify(output, null, 4) + "\n", "utf-8")

console.log(`Cleaned ${facilities.length} facilities:`)
console.log(`  Complete: ${qualityCounts.complete}`)
console.log(`  Partial:  ${qualityCounts.partial}`)
console.log(`  Minimal:  ${qualityCounts.minimal}`)
console.log(`Wrote ${jsonPath}`)
