import spotifyApi from '../../lib/spotify'
export default async function handler (req, res) {
  // Get Featured Playlists and New Releases
  spotifyApi.setAccessToken(req.headers?.authorization?.split(' ')[1])
  try {
    const data_1 = await spotifyApi.getFeaturedPlaylists({
      limit: 12,
      country: req.query.user_country,
      timestamp: req.query.timestamp
    })
    const data_2 = await spotifyApi.getNewReleases({
      limit: 12,
      country: req.query.user_country
    })
    res.status(200).json(Object.assign({}, data_1.body, data_2.body))
  } catch (error) {
    console.log(error)
    res.status(error.statusCode).send(error.body)
  }
}
