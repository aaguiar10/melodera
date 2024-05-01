import spotifyApi from '../../../../lib/spotify'
export default async function handler (req, res) {
  // Create a Playlist
  spotifyApi.setAccessToken(req.headers?.authorization?.split(' ')[1])
  try {
    const dateString = req.query.timestamp.split(',')[0]
    const title = req.query.title
    const data_1 = await spotifyApi.createPlaylist(`${title} (${dateString})`, {
      description: 'Curated by Melodera',
      public: true
    })
    // Add Tracks to the Playlist
    const trackList = req.query.tracks.split(',')
    const data_2 = await spotifyApi.addTracksToPlaylist(
      data_1.body.id,
      trackList
    )
    res.status(200).json(data_2.body)
  } catch (error) {
    console.error(error)
    res.status(error.statusCode).send(error.body)
  }
}
