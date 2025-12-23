import { createSpotifyClient } from '../../../lib/spotify'
export default async function handler (req, res) {
  // Get Recommendations Based on Seeds / Features
  const accessToken = req.headers?.authorization?.split(' ')[1]
  const spotify = createSpotifyClient(accessToken)
  try {
    const data = await spotify.recommendations.get({
      seed_artists: req.query.seed_artists
        ? [req.query.seed_artists]
        : undefined,
      seed_tracks: req.query.seed_tracks ? [req.query.seed_tracks] : undefined,
      target_energy: req.query.target_energy
        ? parseFloat(req.query.target_energy)
        : undefined,
      target_valence: req.query.target_valence
        ? parseFloat(req.query.target_valence)
        : undefined,
      target_tempo: req.query.target_tempo
        ? parseFloat(req.query.target_tempo)
        : undefined,
      target_danceability: req.query.target_danceability
        ? parseFloat(req.query.target_danceability)
        : undefined,
      target_time_signature: req.query.target_time_signature
        ? parseInt(req.query.target_time_signature)
        : undefined,
      market: req.query.market,
      limit: 50
    })
    res.status(200).send(data)
  } catch (error) {
    console.error(error)
    res.status(error.status || 500).json({ error: error.message })
  }
}
