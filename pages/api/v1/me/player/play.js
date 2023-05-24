import spotifyApi from '../../../../../lib/spotify'
export default function handler (req, res) {
  // Start/Resume a User's Playback
  spotifyApi.setAccessToken(req.headers?.authorization?.split(' ')[1])
  return spotifyApi
    .play({
      device_id: req.query.device_id,
      uris: [`spotify:track:${req.query.track_id}`],
      position_ms: 0
    })
    .then(
      function () {
        res.status(200).end()
      },
      function (error) {
        console.log(error)
        res.status(error.statusCode).send(error.body)
      }
    )
}
