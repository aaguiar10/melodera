import spotifyApi from '../../lib/spotify'

export default async function handler (req, res) {
  // Search tracks, artists, albums, playlists
  spotifyApi.setAccessToken(req.headers?.authorization?.split(' ')[1])

  const searchOptions = {
    limit: 10,
    offset: req.query.offset ?? 0
  }

  try {
    if (req.query.type) {
      const searchMethod = `search${req.query.type
        .charAt(0)
        .toUpperCase()}${req.query.type.slice(1)}`
      const data = await spotifyApi[searchMethod](
        req.query.query,
        searchOptions
      )
      res.status(200).json(data.body)
    } else {
      const data_1 = await spotifyApi.searchTracks(
        req.query.query,
        searchOptions
      )
      const data_2 = await spotifyApi.searchArtists(
        req.query.query,
        searchOptions
      )
      const data_3 = await spotifyApi.searchAlbums(
        req.query.query,
        searchOptions
      )
      const data_4 = await spotifyApi.searchPlaylists(
        req.query.query,
        searchOptions
      )
      res
        .status(200)
        .json(
          Object.assign({}, data_1.body, data_2.body, data_3.body, data_4.body)
        )
    }
  } catch (error) {
    console.error(error)
    res.status(error.statusCode).send(error.body)
  }
}
