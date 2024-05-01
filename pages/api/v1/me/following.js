import spotifyApi from '../../../../lib/spotify'
export default async function handler (req, res) {
  // Get User's Followed Artists
  spotifyApi.setAccessToken(req.headers?.authorization?.split(' ')[1])
  const options = {
    type: 'artist',
    limit: 50
  }
  if (req.query?.after) {
    options.after = req.query.after
  }
  return spotifyApi
    .getFollowedArtists(options)
    .then(function (data) {
      res.status(200).json(data.body)
    })
    .catch(error => {
      console.error(error)
      res.status(error.statusCode).send(error.body)
    })
}
