import spotifyApi from '../../../lib/spotify'
export default async function handler (req, res) {
  // Get Recommendations Based on Seeds / Features for Music Mix
  spotifyApi.setAccessToken(req.headers?.authorization?.split(' ')[1])
  try {
    const data_1 = await spotifyApi.getMyTopTracks({
      time_range: 'short_term',
      limit: 3,
      offset: 0
    })
    const data_2 = await spotifyApi.getMyTopArtists({
      time_range: 'short_term',
      limit: 2,
      offset: 0
    })
    const trackIds = data_1.body.items.map(item => item.id)
    const artistIds = data_2.body.items.map(item => item.id)
    const data_3 = await spotifyApi.getAudioFeaturesForTracks(trackIds)
    const energyValenceList = data_3.body.audio_features.map(item => ({
      energy: item.energy,
      valence: item.valence
    }))
    const energyAvg =
      energyValenceList.reduce((a, b) => a + b.energy, 0) /
      energyValenceList.length
    const valenceAvg =
      energyValenceList.reduce((a, b) => a + b.valence, 0) /
      energyValenceList.length
    const data_4 = await spotifyApi.getRecommendations({
      seed_artists: artistIds,
      seed_tracks: trackIds,
      market: req.query.market,
      min_popularity: 50,
      target_energy: energyAvg,
      target_valence: valenceAvg,
      limit: 50
    })
    res.status(200).send(data_4.body)
  } catch (error) {
    console.log(error)
    res.status(error.statusCode).send(error.body)
  }
}
