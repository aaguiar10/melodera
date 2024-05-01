import spotifyApi from '../../../../lib/spotify'
export default async function handler (req, res) {
  spotifyApi.setAccessToken(req.headers?.authorization?.split(' ')[1])
  // Check if track is already saved
  try {
    const data = await spotifyApi.containsMySavedTracks([req.query.id])
    res.status(200).json(data.body)
  } catch (error) {
    console.error(error)
    res.status(error.statusCode).send(error.body)
  }
}
