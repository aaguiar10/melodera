// init project
var qs = require('querystring')
var express = require('express')
var Vibrant = require('node-vibrant')
var app = express()

// init Spotify API wrapper

var SpotifyWebApi = require('spotify-web-api-node')

var spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
})

var generateRandomString = function (length) {
  var text = ''
  var possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

var o1 = null
var o2 = null
var o3 = null
var o4 = null

const jssdkscopes = [
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
  client_id: process.env.CLIENT_ID,
  response_type: 'token',
  scope: jssdkscopes.join(' '),
  redirect_uri: encodeURI('https://melodera.herokuapp.com/'),
  state: generateRandomString(16),
  show_dialog: true
}

const redirectUri = `https://accounts.spotify.com/authorize?${qs.stringify(
  redirectUriParameters
)}`

function authenticate (callback) {
  spotifyApi.clientCredentialsGrant().then(
    function (data) {
      console.log('The access token expires in ' + data.body['expires_in'])
      console.log('The access token is ' + data.body['access_token'])

      callback instanceof Function && callback()

      // Save the access token so that it's used in future calls
      spotifyApi.setAccessToken(data.body['access_token'])
    },
    function (err) {
      console.log(
        'Something went wrong when retrieving an access token',
        err.message
      )
    }
  )
}
authenticate()

const reAuthenticateOnFailure = action => {
  action(() => {
    authenticate(action)
  })
}

app.use(express.static('public'))
app.get('/search', function (request, response) {
  reAuthenticateOnFailure(failure => {
    spotifyApi
      .searchTracks(request.query.query, {
        limit: 4,
        offset: request.query.offset
      })
      .then(function (data) {
        o1 = data.body
        spotifyApi
          .searchArtists(request.query.query, {
            limit: 4,
            offset: request.query.offset
          })
          .then(function (data) {
            o2 = data.body
            spotifyApi
              .searchAlbums(request.query.query, {
                limit: 4,
                offset: request.query.offset
              })
              .then(function (data) {
                o3 = data.body
                spotifyApi
                  .searchPlaylists(request.query.query, {
                    limit: 4,
                    offset: request.query.offset
                  })
                  .then(function (data) {
                    o4 = data.body
                    response.send(Object.assign({}, o1, o2, o3, o4))
                  }, failure)
              }, failure)
          }, failure)
      }, failure)
  })
})

app.get('/spotifyRedirectUri', function (request, response) {
  response.send(
    JSON.stringify(
      {
        redirectUri
      },
      null,
      2
    )
  )
})

app.get('/features', function (request, response) {
  reAuthenticateOnFailure(failure => {
    spotifyApi.getAudioFeaturesForTrack(request.query.id).then(function (data) {
      response.send(data.body)
    }, failure)
  })
})

app.get('/analysis', function (request, response) {
  reAuthenticateOnFailure(failure => {
    spotifyApi.getAudioAnalysisForTrack(request.query.id).then(function (data) {
      response.send(data.body)
    }, failure)
  })
})

app.get('/v1/me', function (request, response) {
  fetch()
  reAuthenticateOnFailure(failure => {
    spotifyApi.getMe().then(function (data) {
      response.send(data.body)
    }, failure)
  })
})
app.get('/v1/me/player/currently-playing', function (request, response) {
  reAuthenticateOnFailure(failure => {
    spotifyApi.getMyCurrentPlaybackState({}).then(function (data) {
      response.send(data.body)
    }, failure)
  })
})

app.get('/v1/me/tracks', function (request, response) {
  reAuthenticateOnFailure(failure => {
    spotifyApi
      .getMySavedTracks({
        limit: 4,
        offset: 0
      })
      .then(function (data) {
        response.send(data.body)
      }, failure)
  })
})

app.get('/imgArt', function (request, response) {
  var img = request.query.img
  Vibrant.from(img)
    .getPalette()
    .then(palette => response.send(palette))
})

app.get('/topArtists', function (request, response) {
  /* Get a User’s Top Artists*/
  spotifyApi.setAccessToken(request.headers['authorization'].split(' ')[1])
  reAuthenticateOnFailure(failure => {
    spotifyApi
      .getMyTopArtists({
        time_range: request.query.time_range,
        limit: 10,
        offset: request.query.offset
      })
      .then(function (data) {
        response.send(data.body)
      }, failure)
  })
})

app.get('/topTracks', function (request, response) {
  /* Get a User’s Top Tracks*/
  spotifyApi.setAccessToken(request.headers['authorization'].split(' ')[1])
  reAuthenticateOnFailure(failure => {
    spotifyApi
      .getMyTopTracks({
        time_range: request.query.time_range,
        limit: 10,
        offset: request.query.offset
      })
      .then(function (data) {
        response.send(data.body)
      }, failure)
  })
})

app.get('/featuredPlists', function (request, response) {
  /* Get Featured Playlists*/
  spotifyApi.setAccessToken(request.headers['authorization'].split(' ')[1])
  reAuthenticateOnFailure(failure => {
    spotifyApi
      .getFeaturedPlaylists({
        limit: 12,
        offset: request.query.offset,
        country: request.query.user_country,
        timestamp: request.query.timestamp
      })
      .then(function (data) {
        response.send(data.body)
      }, failure)
  })
})

app.get('/newReleases', function (request, response) {
  /* Get New Releases*/
  spotifyApi.setAccessToken(request.headers['authorization'].split(' ')[1])
  reAuthenticateOnFailure(failure => {
    spotifyApi
      .getNewReleases({
        limit: 12,
        offset: request.query.offset,
        country: request.query.user_country
      })
      .then(function (data) {
        response.send(data.body)
      }, failure)
  })
})

// listen for requests
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port)
})

/* some functions adapted from
  https://developer.spotify.com/community/showcase/spotify-audio-analysis/
*/
