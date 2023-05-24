import spotifyApi from '../../lib/spotify'
export default async function handler (req, res) {
  // Get Audio Analysis for a Track
  spotifyApi.setAccessToken(req.headers?.authorization?.split(' ')[1])
  try {
    const data = await spotifyApi.getAudioAnalysisForTrack(req.query.id)
    res.status(200).json(data.body)
  } catch (error) {
    console.log(error)
    res.status(error.statusCode).send(error.body)
  }
}
