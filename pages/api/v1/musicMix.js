import { createSpotifyClient } from '../../../lib/spotify'

// Note: Spotify deprecated Recommendations API in November 2024
// This endpoint now falls back to using top tracks as a mix
export default async function handler (req, res) {
  const accessToken = req.headers?.authorization?.split(' ')[1]
  const spotify = createSpotifyClient(accessToken)

  try {
    // Get user's top tracks from different time ranges for variety
    const [shortTermTracks, mediumTermTracks] = await Promise.all([
      spotify.currentUser.topItems('tracks', 'short_term', 25, 0),
      spotify.currentUser.topItems('tracks', 'medium_term', 25, 0)
    ])

    // Try the recommendations API first
    try {
      const topTracks = await spotify.currentUser.topItems(
        'tracks',
        'short_term',
        3,
        0
      )
      const topArtists = await spotify.currentUser.topItems(
        'artists',
        'short_term',
        2,
        0
      )
      const trackIds = topTracks.items.map(item => item.id)
      const artistIds = topArtists.items.map(item => item.id)

      const recommendations = await spotify.recommendations.get({
        seed_artists: artistIds,
        seed_tracks: trackIds,
        market: req.query.market,
        min_popularity: 25,
        limit: 50
      })

      return res.status(200).send(recommendations)
    } catch (recError) {
      console.log(
        'Recommendations API unavailable (deprecated), using top tracks as mix'
      )
    }

    // Fallback: Create a "mix" from user's top tracks across time ranges
    // Combine and deduplicate tracks from different time periods
    const allTracks = [...shortTermTracks.items, ...mediumTermTracks.items]
    const uniqueTracksMap = new Map()

    allTracks.forEach(track => {
      if (!uniqueTracksMap.has(track.id)) {
        uniqueTracksMap.set(track.id, track)
      }
    })

    // Shuffle the tracks for variety
    const uniqueTracks = Array.from(uniqueTracksMap.values())
    for (let i = uniqueTracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[uniqueTracks[i], uniqueTracks[j]] = [uniqueTracks[j], uniqueTracks[i]]
    }

    // Return in the same format as recommendations API
    const fallbackResponse = {
      tracks: uniqueTracks.slice(0, 50),
      seeds: [],
      _isFallback: true,
      _message:
        'Recommendations API is deprecated. Showing your personalized top tracks mix instead.'
    }

    res.status(200).send(fallbackResponse)
  } catch (error) {
    console.error(error)
    res.status(error.status || 500).json({ error: error.message })
  }
}
