import spotifyApi from '../../../../lib/spotify'
export default async function handler (req, res) {
  // Get User's Saved Albums
  spotifyApi.setAccessToken(req.headers?.authorization?.split(' ')[1])
  try {
    const data = await spotifyApi.getMySavedAlbums({
      limit: 10,
      offset: req.query.offset ?? 0
    })
    res.status(200).json(data.body)
  } catch (error) {
    console.error(error)
    res.status(error.statusCode).send(error.body)
  }
}
