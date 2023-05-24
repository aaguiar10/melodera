import spotifyApi from '../../../../lib/spotify'
export default async function handler (req, res) {
  // Add Tracks to User's Saved Tracks
  spotifyApi.setAccessToken(req.headers?.authorization?.split(' ')[1])
  try {
    const data = await spotifyApi.addToMySavedTracks([req.query.id])
    res.status(200).json(data.body)
  } catch (error) {
    console.log(error)
    res.status(error.statusCode).send(error.body)
  }
}
