import spotifyApi from '../../lib/spotify'
export default async function handler (req, res) {
  // Get a User’s Top Artists
  spotifyApi.setAccessToken(req.headers?.authorization?.split(' ')[1])
  try {
    const data = await spotifyApi.getMyTopArtists({
      time_range: req.query.time_range,
      limit: 10,
      offset: req.query.offset
    })
    res.status(200).json(data.body)
  } catch (error) {
    console.log(error)
    res.status(error.statusCode).send(error.body)
  }
}
