# Melodera

Melodera is an upgraded music player for Spotify that provides you with in-depth song information.

Features include:

- Identify musical attributes such as tempo and time signature
- See song structures and add beat-moving visuals
- Get song recommendations, view your listening habits, and more

## Installation

This project is built on [NextJS](https://nextjs.org/docs), which requires NodeJS 18.7 or later ([setup](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)).
Install the required node modules with

```bash
$ npm ci
```

## Testing

For local testing, create an app from the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/). Then within the app's settings, add redirect URI `http://localhost:3000/api/auth/callback/spotify` and save it.

Use the `Client ID` and `Client Secret` that Spotify provides to create a **.env.local** file (within the project folder) where you will store them along with your site url and a generated secret for [authorization](https://next-auth.js.org/configuration/options):

```dosini
NEXTAUTH_URL=http://localhost:3000
SPOTIFY_CLIENT_ID=YOURCLIENTID
SPOTIFY_CLIENT_SECRET=YOURCLIENTSECRET
NEXTAUTH_SECRET=YOURSECRETKEY
```

You can edit pages by modifying the `pages` directory. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be edited in the `pages/api` directory

### Deployment

For a development server:

```bash
$ npm run dev
# or
$ yarn dev
# or
$ pnpm dev
```

For a production server (after prepping with `npm run build`):

```bash
$ npm run start
# or
$ yarn start
# or
$ pnpm start
```
