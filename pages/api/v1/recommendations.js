import spotifyApi from '../../../lib/spotify'
export default async function handler (req, res) {
  // Get Recommendations Based on Seeds / Features
  spotifyApi.setAccessToken(req.headers?.authorization?.split(' ')[1])
  try {
    const data = await spotifyApi.getRecommendations({
      seed_artists: [req.query.seed_artists],
      seed_tracks: [req.query.seed_tracks],
      target_energy: req.query.target_energy,
      target_valence: req.query.target_valence,
      target_tempo: req.query.target_tempo,
      target_danceability: req.query.target_danceability,
      target_time_signature: req.query.target_time_signature,
      market: req.query.market,
      limit: req.query.limit ?? 10
    })
    let sliced_data = {
      ...data.body,
      tracks: data.body.tracks.slice(
        data.body.tracks.length - 10,
        data.body.tracks.length
      )
    }
    res.status(200).send(sliced_data)
  } catch (error) {
    console.error(error)
    res.status(error.statusCode).send(error.body)
  }
}
