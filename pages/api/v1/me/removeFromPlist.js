import spotifyApi from '../../../../lib/spotify'
export default async function handler (req, res) {
  // Remove all occurrences of tracks from a playlist
  spotifyApi.setAccessToken(req.headers?.authorization?.split(' ')[1])
  try {
    const data = await spotifyApi.removeTracksFromPlaylist(req.query.playlist, [
      { uri: 'spotify:track:' + req.query.track }
    ])
    res.status(200).json(data.body)
  } catch (error) {
    console.error(error)
    res.status(error.statusCode).send(error.body)
  }
}
