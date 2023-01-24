# Melodera

Melodera visualizes and analyzes songs according to their musical properties.

## Installation

This project uses NodeJS ([setup](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)).
Install the required node modules with

```bash
$ npm ci
```

## Testing

For local testing, create an app from the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/). Then within the app's settings, add a redirect URI such as `http://localhost:8888/` and save it.

Use the `Client ID` and `Client Secret` that Spotify provides to create a **.env** file (within the project folder) where you will store them:

```dosini
CLIENT_ID=YOURCLIENTID
CLIENT_SECRET=YOURCLIENTSECRET
NODE_ENV=development
```

**server.js**:

Update `currentURI` to the redirect URI you provided to Spotify

```typescript
// replace URI that matches your node environment in .env
if (process.env.NODE_ENV == 'production') {
  currentURI = 'https://melodera.up.railway.app/'
} else {
  currentURI = 'http://localhost:8888/'
}
```

If you specify a server port, make sure to also update it in the listener variable

```typescript
// port 8888 in 'development' environment
var listener = app.listen(process.env.PORT || 8888, function () {
  console.log('Available at ' + currentURI)
  console.log('\nYour app is listening on port ' + listener.address().port)
})
```

### Deployment

Run the server with

```bash
$ npm start

#-----Alternative-----
$ node server.js
```
