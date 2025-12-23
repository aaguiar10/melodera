import { createSpotifyClient } from '../../../../lib/spotify'
export default async function handler (req, res) {
  // Add Tracks to User's Saved Tracks
  const accessToken = req.headers?.authorization?.split(' ')[1]
  const spotify = createSpotifyClient(accessToken)
  try {
    // Check if track is already saved
    const savedCheck = await spotify.currentUser.tracks.hasSavedTracks([
      req.query.id
    ])

    const isTrackSaved = savedCheck[0]
    if (!isTrackSaved) {
      await spotify.currentUser.tracks.saveTracks([req.query.id])
    } else {
      await spotify.currentUser.tracks.removeSavedTracks([req.query.id])
    }
    res.status(200).json(savedCheck)
  } catch (error) {
    console.error(error)
    res.status(error.status || 500).json({ error: error.message })
  }
}
