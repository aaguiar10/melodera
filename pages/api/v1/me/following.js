import spotifyApi from '../../../../lib/spotify'
export default async function handler (req, res) {
  // Get User's Followed Artists
  spotifyApi.setAccessToken(req.headers?.authorization?.split(' ')[1])
  return spotifyApi
    .getFollowedArtists({
      type: 'artist',
      limit: 4,
      after: req.query.after
    })
    .then(function (data) {
      res.status(200).json(data.body)
    })
    .catch(error => {
      console.log(error)
      res.status(error.statusCode).send(error.body)
    })
}
