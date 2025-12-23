import { createSpotifyClient } from '../../lib/spotify'
export default async function handler (req, res) {
  // Get personalized home content: Recently Played Tracks + New Releases
  const accessToken = req.headers?.authorization?.split(' ')[1]
  const spotify = createSpotifyClient(accessToken)
  try {
    const [recentlyPlayedResult, newReleasesResult] = await Promise.allSettled([
      spotify.player.getRecentlyPlayedTracks(20),
      spotify.browse.getNewReleases(undefined, 10)
    ])

    // Extract unique tracks from recently played (for the track category)
    const recentTracks = []
    if (recentlyPlayedResult.status === 'fulfilled') {
      const seenTrackIds = new Set()
      for (const item of recentlyPlayedResult.value.items) {
        if (!seenTrackIds.has(item.track.id)) {
          seenTrackIds.add(item.track.id)
          recentTracks.push(item.track)
        }
      }
    }

    // Return data structured to match the CategContainer expectations
    // tracks.items for 'track' category, albums.items for 'album' category
    res.status(200).json({
      tracks:
        recentTracks.length > 0
          ? {
              items: recentTracks.slice(0, 10),
              total: recentTracks.length
            }
          : null,
      albums:
        newReleasesResult.status === 'fulfilled'
          ? newReleasesResult.value.albums
          : null
    })
  } catch (error) {
    console.error(error)
    res
      .status(error.status || 500)
      .json({ error: error.message || 'Internal server error' })
  }
}
