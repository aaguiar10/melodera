import { createSpotifyClient } from '../../../lib/spotify'
export default async function handler (req, res) {
  // Get User Info
  const accessToken = req.headers?.authorization?.split(' ')[1]
  const spotify = createSpotifyClient(accessToken)
  try {
    const data = await spotify.currentUser.profile()
    res.status(200).send(data)
  } catch (error) {
    console.error(error)
    res.status(error.status || 500).json({ error: error.message })
  }
}
