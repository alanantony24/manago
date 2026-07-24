const ADJECTIVES = [
  "Swift",
  "Calm",
  "Bright",
  "Quiet",
  "Bold",
  "Gentle",
  "Lucky",
  "Clever",
  "Sunny",
  "Nimble",
  "Cozy",
  "Brave",
  "Merry",
  "Steady",
  "Keen",
  "Jolly",
  "Soft",
  "Lively",
  "Warm",
  "Chill",
] as const

const NOUNS = [
  "Mango",
  "Sparrow",
  "Otter",
  "Panda",
  "Fox",
  "Koala",
  "Finch",
  "Cedar",
  "River",
  "Comet",
  "Pebble",
  "Maple",
  "Coral",
  "Badger",
  "Heron",
  "Willow",
  "Nimbus",
  "Clover",
  "Basil",
  "Juniper",
] as const

/** Simple deterministic hash so the same seed always maps to the same name. */
function hashSeed(seed: string): number {
  let hash = 2166136261
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** Public-facing alias for a review — never the signer's real name. */
export function anonymousNameFromSeed(seed: string): string {
  const hash = hashSeed(seed)
  const adjective = ADJECTIVES[hash % ADJECTIVES.length]
  const noun = NOUNS[Math.floor(hash / ADJECTIVES.length) % NOUNS.length]
  return `${adjective} ${noun}`
}
