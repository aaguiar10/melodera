import spotifyApi from '../../lib/spotify'
export default async function handler (req, res) {
  // Get a User’s Top Tracks
  spotifyApi.setAccessToken(req.headers?.authorization?.split(' ')[1])
  try {
    const data = await spotifyApi.getMyTopTracks({
      time_range: req.query.time_range,
      limit: req.query.limit ?? 10,
      offset: req.query.offset ?? 0
    })
    res.status(200).json(data.body)
  } catch (error) {
    console.error(error)
    res.status(error.statusCode).send(error.body)
  }
}
