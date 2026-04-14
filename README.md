# Lofistory

A lo-fi music history site built with React + Vite. Explore the history of the genre, listen to iconic tracks, and browse 50 influential artists — all wrapped in a rainy, atmospheric UI.

---

## Features

### Home Page
- **A Brief History** — overview of lo-fi's origins and cultural impact
- **Famous Tracks** — interactive player with Web Audio API visualizer, progress bar, and per-track volume control
- **Notable Artists** — quick-glance artist strip with hover animations

### Artists Page
- **50 curated artists** organized into five categories: The Pioneers, Modern Icons, Genre-Benders, Global & Emerging, and Bonus Picks
- Each card displays the artist's **Spotify photo, genres, and follower count**, fetched live from the Spotify API
- Hover any card to reveal a **"Listen on Spotify"** link that opens the artist's Spotify profile
- Shares the same blurred background and animated rain canvas as the home page

### Track Player
- Each track on the home page has a **"Listen on Spotify"** button (appears on hover) that links directly to the track on Spotify
- Track URLs are resolved at runtime via the Spotify API

### Ambient Rain
- Procedural pink-noise rain sound (Web Audio API) with a floating toggle and volume slider
- Animated canvas raindrops visible on both pages

---

## API / Services

**Spotify Web API** — [developer.spotify.com](https://developer.spotify.com)

Uses the **Client Credentials** flow (no user login required) to fetch public artist and track data. Calls made:
- `POST /api/token` — obtain an access token
- `GET /v1/search?type=artist` — look up each artist by name
- `GET /v1/search?type=track` — look up each home page track to get its Spotify URL

> Note: credentials are stored in `.env` and are not committed to version control. Because this uses Client Credentials (no user data is accessed), the exposure risk is low for a personal/portfolio project.

---

## Setup

### 1. Clone and install

```bash
npm install
```

### 2. Add your Spotify credentials

Create a `.env` file in the project root:

```
VITE_SPOTIFY_CLIENT_ID=your_client_id
VITE_SPOTIFY_CLIENT_SECRET=your_client_secret
```

To get credentials, create a free app at [developer.spotify.com](https://developer.spotify.com/dashboard). Select **Web API** — no special scopes needed.

### 3. Add audio files

Drop your tracks into `public/audio/`:

```
public/audio/track1.mp3   — Just Friends (Potsu)
public/audio/track2.mp3   — U-Love (J Dilla)
public/audio/track3.mp3   — Aruarian Dance (Nujabes)
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Stack

- **React 18** + **Vite**
- **CSS Modules**
- **React Router v6**
- **Web Audio API** — track visualizer and rain ambience
- **Canvas API** — animated rain drops
- **Spotify Web API** — artist data and track links
