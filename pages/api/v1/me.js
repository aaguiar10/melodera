import spotifyApi from '../../../lib/spotify'
export default async function handler (req, res) {
  // Get User Info
  spotifyApi.setAccessToken(req.headers?.authorization?.split(' ')[1])
  try {
    const data = await spotifyApi.getMe()
    res.status(200).send(data.body)
  } catch (error) {
    console.error(error)
    res.status(error.statusCode).send(error.body)
  }
}
