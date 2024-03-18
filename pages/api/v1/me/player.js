import spotifyApi from '../../../../lib/spotify'
export default function handler (req, res) {
  // Transfer a User's Playback
  spotifyApi.setAccessToken(req.headers?.authorization?.split(' ')[1])
  return spotifyApi.transferMyPlayback([req.query.device_id]).then(
    function () {
      res.status(200).end()
    },
    function (error) {
      console.log(error)
      res.status(error.statusCode).send(error.body)
    }
  )
}
