import spotifyApi from '../../../lib/spotify'
export default async function handler (req, res) {
  // Get an Artist's Top Tracks
  spotifyApi.setAccessToken(req.headers?.authorization?.split(' ')[1])
  try {
    const data = await spotifyApi.getArtistTopTracks(
      req.query.id,
      req.query.market
    )
    res.status(200).send(data.body)
  } catch (error) {
    console.error(error)
    res.status(error.statusCode).send(error.body)
  }
}
