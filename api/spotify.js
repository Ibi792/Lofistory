/**
 * Spotify proxy — runs as a Vercel serverless function in production
 * and as Vite dev-server middleware in development (see vite.config.js).
 *
 * Keeps credentials server-side and caches Spotify responses for 12 hours
 * so the browser never calls Spotify directly and rate limits are shared
 * across all visitors rather than per-user.
 *
 * Endpoints (query-param routing works the same whether mounted at /api/spotify
 * by Vite or hit as a Vercel function):
 *   GET /api/spotify?type=artists&names=Nujabes,J+Dilla,...
 *   GET /api/spotify?type=track&title=Just+Friends&artist=Potsu
 */

const sleep = ms => new Promise(r => setTimeout(r, ms))

export function createHandler({ clientId, clientSecret } = {}) {
  const CLIENT_ID     = clientId     ?? process.env.VITE_SPOTIFY_CLIENT_ID
  const CLIENT_SECRET = clientSecret ?? process.env.VITE_SPOTIFY_CLIENT_SECRET

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

  async function cachedSearch(cacheKey, fetcher) {
    const hit = _cache.get(cacheKey)
    if (hit && Date.now() < hit.expiry) return hit.data
    const data = await fetcher()
    _cache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL })
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

  return async function handler(req, res) {
    const url  = new URL(req.url, 'http://localhost')
    const type = url.searchParams.get('type')

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'public, max-age=43200') // 12 h CDN cache on Vercel

    try {
      const token = await getToken()

      if (type === 'artists') {
        const names = (url.searchParams.get('names') ?? '')
          .split(',').map(n => n.trim()).filter(Boolean)

        const results = {}
        const CONCURRENCY = 5
        for (let i = 0; i < names.length; i += CONCURRENCY) {
          if (i > 0) await sleep(150)
          const batch = names.slice(i, i + CONCURRENCY)
          const data  = await Promise.all(batch.map(n => spotifyArtist(token, n).catch(() => null)))
          batch.forEach((name, j) => { results[name] = data[j] })
        }
        res.end(JSON.stringify(results))

      } else if (type === 'track') {
        const title  = url.searchParams.get('title')  ?? ''
        const artist = url.searchParams.get('artist') ?? ''
        const spotifyUrl = await spotifyTrack(token, title, artist).catch(() => null)
        res.end(JSON.stringify({ spotifyUrl }))

      } else {
        res.statusCode = 400
        res.end(JSON.stringify({ error: 'Missing or unknown type param' }))
      }

    } catch (err) {
      res.statusCode = 500
      res.end(JSON.stringify({ error: err.message }))
    }
  }
}

// Default export — used by Vercel as the serverless function
export default createHandler()
