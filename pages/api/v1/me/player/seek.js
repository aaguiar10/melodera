import spotifyApi from '../../../../../lib/spotify'
export default function handler (req, res) {
  // Seek To Position In Currently Playing Track
  spotifyApi.setAccessToken(req.headers?.authorization?.split(' ')[1])
  return spotifyApi.seek(req.query.position_ms).then(
    function () {
      res.status(200).end()
    },
    function (error) {
      console.log(error)
      res.status(error.statusCode).send(error.body)
    }
  )
}
