import spotifyApi from '../../../../lib/spotify'
export default async function handler (req, res) {
  // Get User's Saved Tracks
  spotifyApi.setAccessToken(req.headers?.authorization?.split(' ')[1])
  try {
    const data = await spotifyApi.getMySavedTracks({
      limit: 4,
      offset: req.query.offset
    })
    res.status(200).json(data.body)
  } catch (error) {
    console.log(error)
    res.status(error.statusCode).send(error.body)
  }
}
