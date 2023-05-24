import spotifyApi from '../../../lib/spotify'
export default async function handler (req, res) {
  // Get a Playlist
  spotifyApi.setAccessToken(req.headers?.authorization?.split(' ')[1])
  try {
    const data = await spotifyApi.getPlaylist(req.query.id, {
      limit: 50,
      offset: 0,
      market: req.query.market
    })
    res.status(200).send(data.body)
  } catch (error) {
    console.log(error)
    res.status(error.statusCode).send(error.body)
  }
}
