import SpotifyWebApi from 'spotify-web-api-node'
import { stringify } from 'querystring'

var generateRandomString = function (length) {
  var text = ''
  var possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}
const scopes = [
  'streaming',
  'user-read-private',
  'user-read-email',
  'user-modify-playback-state',
  'user-read-playback-state',
  'user-read-currently-playing',
  'user-follow-read',
  'user-library-read',
  'user-library-modify',
  'user-top-read',
  'playlist-read-collaborative',
  'playlist-read-private',
  'playlist-modify-public',
  'playlist-modify-private'
]
const redirectUriParameters = {
  client_id: process.env.SPOTIFY_CLIENT_ID,
  scope: scopes.join(' '),
  state: generateRandomString(16),
  show_dialog: true
}
const REDIRECT_URI = `https://accounts.spotify.com/authorize?${stringify(
  redirectUriParameters
)}`

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
})
export default spotifyApi
export { REDIRECT_URI }
