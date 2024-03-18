import spotifyApi from '../../../../lib/spotify'
export default async function handler (req, res) {
  // Add Tracks to User's Saved Tracks
  spotifyApi.setAccessToken(req.headers?.authorization?.split(' ')[1])
  try {
    // Check if track is already saved
    const data = await spotifyApi.containsMySavedTracks([req.query.id])

    const isTrackSaved = data.body[0]
    if (!isTrackSaved) {
      await spotifyApi.addToMySavedTracks([req.query.id])
    } else {
      await spotifyApi.removeFromMySavedTracks([req.query.id])
    }
    res.status(200).json(data.body)
  } catch (error) {
    console.log(error)
    res.status(error.statusCode).send(error.body)
  }
}
