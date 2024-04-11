import spotifyApi from '../../../../lib/spotify'
export default async function handler (req, res) {
  // Add Tracks to a Playlist
  spotifyApi.setAccessToken(req.headers?.authorization?.split(' ')[1])
  try {
    const data = await spotifyApi.addTracksToPlaylist(req.query.playlist, [
      'spotify:track:' + req.query.track
    ])
    res.status(200).json(data.body)
  } catch (error) {
    console.error(error)
    res.status(error.statusCode).send(error.body)
  }
}
