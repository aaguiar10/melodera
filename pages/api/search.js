import spotifyApi from '../../lib/spotify'
export default async function handler (req, res) {
  // Search tracks, artists, albums, playlists
  spotifyApi.setAccessToken(req.headers?.authorization?.split(' ')[1])
  if (req.query.type !== undefined) {
    if (req.query.type === 'tracks') {
      try {
        const data = await spotifyApi.searchTracks(req.query.query, {
          limit: 10,
          offset: req.query.offset
        })
        res.status(200).json(data.body)
      } catch (error) {
        console.error(error)
        res.status(error.statusCode).send(error.body)
      }
    } else if (req.query.type === 'artists') {
      try {
        const data = await spotifyApi.searchArtists(req.query.query, {
          limit: 10,
          offset: req.query.offset
        })
        res.status(200).json(data.body)
      } catch (error) {
        console.error(error)
        res.status(error.statusCode).send(error.body)
      }
    } else if (req.query.type === 'albums') {
      try {
        const data = await spotifyApi.searchAlbums(req.query.query, {
          limit: 10,
          offset: req.query.offset
        })
        res.status(200).json(data.body)
      } catch (error) {
        console.error(error)
        res.status(error.statusCode).send(error.body)
      }
    } else if (req.query.type === 'playlists') {
      try {
        const data = await spotifyApi.searchPlaylists(req.query.query, {
          limit: 10,
          offset: req.query.offset
        })
        res.status(200).json(data.body)
      } catch (error) {
        console.error(error)
        res.status(error.statusCode).send(error.body)
      }
    }
  } else {
    try {
      const data_1 = await spotifyApi.searchTracks(req.query.query, {
        limit: 10,
        offset: req.query.offset
      })
      const data_2 = await spotifyApi.searchArtists(req.query.query, {
        limit: 10,
        offset: req.query.offset
      })
      const data_3 = await spotifyApi.searchAlbums(req.query.query, {
        limit: 10,
        offset: req.query.offset
      })
      const data_4 = await spotifyApi.searchPlaylists(req.query.query, {
        limit: 10,
        offset: req.query.offset
      })
      res
        .status(200)
        .json(
          Object.assign({}, data_1.body, data_2.body, data_3.body, data_4.body)
        )
    } catch (error) {
      console.error(error)
      res.status(error.statusCode).send(error.body)
    }
  }
}
