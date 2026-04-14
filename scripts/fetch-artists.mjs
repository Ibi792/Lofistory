/**
 * Run once to populate src/data/artistData.json with Spotify artist data.
 * Usage: node scripts/fetch-artists.mjs
 *
 * Requires VITE_SPOTIFY_CLIENT_ID and VITE_SPOTIFY_CLIENT_SECRET in .env
 * Reads the .env file directly so it works without Vite.
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// Read .env manually
const env = Object.fromEntries(
  readFileSync(resolve(root, '.env'), 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => l.split('=').map(s => s.trim()))
)

const CLIENT_ID = env.VITE_SPOTIFY_CLIENT_ID
const CLIENT_SECRET = env.VITE_SPOTIFY_CLIENT_SECRET

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing Spotify credentials in .env')
  process.exit(1)
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function getToken() {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  })
  const json = await res.json()
  if (!json.access_token) throw new Error('Token fetch failed: ' + JSON.stringify(json))
  return json.access_token
}

async function searchArtist(token, name) {
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (res.status === 429) {
    const retryAfter = res.headers.get('retry-after') ?? '60'
    throw new Error(`Rate limited. Retry after ${retryAfter}s`)
  }
  const json = await res.json()
  const item = json.artists?.items?.[0]
  if (!item) return null
  return {
    id: item.id,
    name: item.name,
    image: item.images?.[0]?.url ?? null,
    genres: item.genres?.slice(0, 2) ?? [],
    followers: item.followers?.total ?? null,
    spotifyUrl: item.external_urls?.spotify ?? null,
  }
}

const ARTISTS = [
  "Nujabes","J Dilla","Madlib","Fat Jon","Uyama Hiroto","DJ Krush","MF DOOM",
  "Idealism","Jinsang","bsd.u","Elijah Who","shiloh dynasty","SwuM","potsu",
  "Kupla","Sleepy Fish","Philanthrope","The Deli","Tomppabeats","Saib.",
  "L'Indécis","Mishka","invention_","Wun Two","Flovry","tender spring",
  "Brockbeat","Cloudchord","Nohidea","sarcastic sounds","quickly, quickly",
  "Harris Cole","Aso","Plusma","Moondrops","kno","Vanilla","Birocratic",
  "Blue Wednesday","Shopan","Toro y Moi","Kalaido","Amanogawa","Guggenz",
  "HM Surf","Takamado","Kudasaibeats","Eevee","Team Astro"
]

console.log('Fetching Spotify token...')
const token = await getToken()
console.log(`Fetching ${ARTISTS.length} artists (600ms delay between requests)...\n`)

const results = {}
for (let i = 0; i < ARTISTS.length; i++) {
  if (i > 0) await sleep(600)
  const name = ARTISTS[i]
  try {
    const data = await searchArtist(token, name)
    results[name] = data
    console.log(`✓ ${name} → ${data?.name ?? 'not found'}`)
  } catch (err) {
    console.error(`✗ ${name}: ${err.message}`)
    process.exit(1)
  }
}

const outPath = resolve(root, 'src/data/artistData.json')
writeFileSync(outPath, JSON.stringify(results, null, 2))
console.log(`\nSaved to ${outPath}`)
