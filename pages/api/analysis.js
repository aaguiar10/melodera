import spotifyApi from '../../lib/spotify'
export default async function handler (req, res) {
  // Get Audio Analysis for a Track
  spotifyApi.setAccessToken(req.headers?.authorization?.split(' ')[1])
  try {
    const data_1 = await spotifyApi.getAudioAnalysisForTrack(req.query.id)
    // Check if track is saved
    const data_2 = await spotifyApi.containsMySavedTracks([req.query.id])
    res.status(200).json({ ...data_1.body, isTrackSaved: data_2.body[0] })
  } catch (error) {
    console.error(error)
    res.status(error.statusCode).send(error.body)
  }
}
