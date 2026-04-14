/**
 * Client-side Spotify helpers.
 * All requests go through /api/spotify (our own proxy) — credentials never
 * touch the browser and Spotify rate limits are handled server-side.
 */

// Deduplicate concurrent artist fetches (prevents StrictMode double-fire)
let _artistsPromise = null

export async function fetchAllArtists(names) {
  if (!_artistsPromise) {
    const qs = encodeURIComponent(names.join(','))
    _artistsPromise = fetch(`/api/spotify?type=artists&names=${qs}`)
      .then(res => {
        if (!res.ok) throw new Error(`Artists API error: ${res.status}`)
        return res.json()
      })
      .catch(err => {
        _artistsPromise = null // allow retry on next navigation
        throw err
      })
  }
  return _artistsPromise
}

export async function searchTrack(title, artist) {
  const res = await fetch(
    `/api/spotify?type=track&title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`
  )
  if (!res.ok) return null
  const { spotifyUrl } = await res.json()
  return spotifyUrl ?? null
}
