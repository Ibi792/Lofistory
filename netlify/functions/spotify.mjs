/**
 * Netlify serverless function — mirrors api/spotify.js but in Netlify's
 * event/response format. Reached via the /api/spotify redirect in netlify.toml.
 */

const sleep = ms => new Promise(r => setTimeout(r, ms))

const CLIENT_ID     = process.env.VITE_SPOTIFY_CLIENT_ID
const CLIENT_SECRET = process.env.VITE_SPOTIFY_CLIENT_SECRET

let _token       = null
let _tokenExpiry = 0
const _cache     = new Map()
const CACHE_TTL  = 12 * 60 * 60 * 1000 // 12 h

async function getToken() {
  if (_token && Date.now() < _tokenExpiry) return _token
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  })
  const json = await res.json()
  if (!json.access_token) throw new Error(`Token failed (${res.status}): ${JSON.stringify(json)}`)
  _token       = json.access_token
  _tokenExpiry = Date.now() + (json.expires_in - 60) * 1000
  return _token
}

async function cachedSearch(key, fetcher) {
  const hit = _cache.get(key)
  if (hit && Date.now() < hit.expiry) return hit.data
  const data = await fetcher()
  _cache.set(key, { data, expiry: Date.now() + CACHE_TTL })
  return data
}

async function spotifyArtist(token, name) {
  return cachedSearch(`artist:${name.toLowerCase()}`, async () => {
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (res.status === 429) throw new Error('Spotify rate limited')
    const json = await res.json()
    const item = json.artists?.items?.[0]
    if (!item) return null
    return {
      image:      item.images?.[0]?.url ?? null,
      genres:     item.genres?.slice(0, 2) ?? [],
      followers:  item.followers?.total ?? null,
      spotifyUrl: item.external_urls?.spotify ?? null,
    }
  })
}

async function spotifyTrack(token, title, artist) {
  return cachedSearch(`track:${title}:${artist}`.toLowerCase(), async () => {
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=track:${encodeURIComponent(title)}+artist:${encodeURIComponent(artist)}&type=track&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (res.status === 429) throw new Error('Spotify rate limited')
    const json = await res.json()
    return json.tracks?.items?.[0]?.external_urls?.spotify ?? null
  })
}

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=43200',
}

export const handler = async (event) => {
  const params = event.queryStringParameters ?? {}
  const type   = params.type

  try {
    const token = await getToken()

    if (type === 'artists') {
      const names = (params.names ?? '').split(',').map(n => n.trim()).filter(Boolean)
      const results = {}
      const CONCURRENCY = 5
      for (let i = 0; i < names.length; i += CONCURRENCY) {
        if (i > 0) await sleep(150)
        const batch = names.slice(i, i + CONCURRENCY)
        const data  = await Promise.all(batch.map(n => spotifyArtist(token, n).catch(() => null)))
        batch.forEach((name, j) => { results[name] = data[j] })
      }
      return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify(results) }

    } else if (type === 'track') {
      const spotifyUrl = await spotifyTrack(token, params.title ?? '', params.artist ?? '').catch(() => null)
      return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify({ spotifyUrl }) }

    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'Unknown type param' }) }
    }

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
