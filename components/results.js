import CategContainer from './categ-container'
import { useEffect, useContext } from 'react'
import { useSession } from 'next-auth/react'
import { getMap } from '../utils/funcs'
import { AnalysisContext, ResultsContext } from '../utils/context'

// component for results (tracks, artists, albums, playlists)
export default function Results () {
  const { data: session } = useSession()
  const [state, setState] = useContext(AnalysisContext)
  const [
    dataState,
    setDataState,
    viewState,
    setViewState,
    offsetState,
    setOffsetState,
    tframesRef
  ] = useContext(ResultsContext)

  function scrollToTframe (timeframe) {
    const map = getMap(tframesRef)
    const node = map.get(timeframe)
    node?.scrollIntoView({
      block: 'center',
      behavior: 'smooth'
    })
  }

  function showResults (data) {
    let containers = []
    const categoryMap = {
      tracks: { id: 'tracks', title: 'Songs', category: 'track' },
      artists: { id: 'artists', title: 'Artists', category: 'artist' },
      albums: { id: 'albums', title: 'Albums', category: 'album' },
      playlists: { id: 'playlists', title: 'Playlists', category: 'playlist' },
      topTracks: { id: 'topTracks', title: 'Top Tracks', category: 'track' },
      topArtists: { id: 'topArtists', title: 'Top Artists', category: 'artist' }
    }
    for (const key in data) {
      if (categoryMap[key]) {
        const { id, title, category } = categoryMap[key]
        containers.push(
          <CategContainer
            key={id}
            id={id}
            title={title}
            category={category}
            extraControls={
              title.includes('Top') &&
              Object.keys(offsetState[id]).map(timeframe => {
                return (
                  `tRange-${id}Divider_` +
                  timeframe +
                  `, ${id}Categ_` +
                  timeframe +
                  `, ${category}_` +
                  timeframe
                )
              })
            }
          />
        )
      }
    }
    return containers
  }

  function fetchTopItemsData (type) {
    if (offsetState[type][state.timeframe] >= 0 && state.timeframe !== '') {
      fetch(
        `/api/${type}?time_range=${state.timeframe}&offset=${
          offsetState[type][state.timeframe]
        }`,
        {
          headers: {
            Authorization: `Bearer ${session.user.accessToken}`
          }
        }
      )
        .then(res => res.json())
        .then(data => {
          data[type] = state.timeframe
          let key = Object.keys(dataState.combinedResults).find(
            key => dataState.combinedResults[key][type] === state.timeframe
          )
          if (dataState.combinedResults.length > 0 && key) {
            const moreResults = dataState.combinedResults.map((item, index) => {
              if (index === +key && offsetState[type][state.timeframe] >= 0)
                return data // update result for specific timeframe
              else return item // The rest haven't changed
            })
            setDataState(prevState => ({
              ...prevState,
              combinedResults: moreResults
            }))
          } else
            setDataState(prevState => ({
              ...prevState,
              result: data
            }))
        })
        .catch(error => {
          console.error('Error:', error)
        })
    }
  }

  function getTopItems (itemType, timeframe) {
    if (viewState.showTFrameItems[itemType] === 1) {
      setViewState(prevState => ({
        ...prevState,
        showSim: false
      }))
      setDataState(prevState => ({
        ...prevState,
        combinedResults: []
      }))
    } else if (viewState.showTFrameItems[itemType] > 3) {
      setViewState(prev => ({
        ...prev,
        showTFrameItems: {
          ...prev.showTFrameItems,
          [itemType]: 1
        }
      }))
      return
    }
    setOffsetState(prevOffset => ({
      ...prevOffset,
      [itemType]: {
        ...prevOffset[itemType],
        [timeframe]: 0
      }
    }))
  }

  function resetState (library = false) {
    setViewState(prev => ({
      ...prev,
      showSim: false,
      showTFrameItems: {
        topTracks: 0,
        topArtists: 0
      }
    }))
    setDataState({
      result: null,
      combinedResults: [],
      toggledAdd: {},
      isLibrary: library
    })
    setOffsetState(prevOffset => ({
      ...prevOffset,
      tracks: 0,
      artists: 0,
      albums: 0,
      playlists: 0,
      artistCursorAfter: {},
      topTracks: {},
      topArtists: {}
    }))
  }

  function fetchData (type, offset) {
    if (offset >= 0 && dataState.result) {
      let url = ''
      if (type === 'artists' && dataState.isLibrary) {
        url = `/api/v1/me/following${
          offset > 40
            ? `?after=${
                // closest lower offset to current offset
                offsetState.artistCursorAfter?.[
                  Object.keys(offsetState.artistCursorAfter)
                    .filter(key => key <= offset)
                    .reduce((prev, curr) =>
                      Math.abs(curr - offset) < Math.abs(prev - offset)
                        ? curr
                        : prev
                    )
                ]
              }`
            : ``
        }`
      } else if (dataState.isLibrary) {
        url = `/api/v1/me/${type}?offset=${offset}`
      } else if (state.searchValue) {
        url = `/api/search?query=${state.searchValue}&type=${type}&offset=${offset}`
      }
      if (url)
        fetch(url, {
          headers: { Authorization: `Bearer ${session.user.accessToken}` }
        })
          .then(resp => resp.json())
          .then(data => {
            if (type === 'artists' && dataState.isLibrary) {
              let slice = data?.artists?.items.slice(
                offset % 50,
                (offset % 50) + 10
              )
              let dataSlice = {
                ...data?.artists,
                items: slice
              }
              data = dataSlice
              if (data?.cursors?.after)
                setOffsetState(prevOffset => ({
                  ...prevOffset,
                  artistCursorAfter: {
                    ...prevOffset.artistCursorAfter,
                    [prevOffset.artists]: data?.cursors?.after
                  }
                }))
            }
            setDataState(prevState => ({
              ...prevState,
              result: {
                ...prevState.result,
                [type]: dataState.isLibrary ? { ...data } : { ...data?.[type] }
              }
            }))
          })
          .catch(error => console.error('Error:', error))
    }
  }

  useEffect(() => {
    fetchData('tracks', offsetState.tracks)
  }, [offsetState.tracks])

  useEffect(() => {
    fetchData('artists', offsetState.artists)
  }, [offsetState.artists])

  useEffect(() => {
    fetchData('albums', offsetState.albums)
  }, [offsetState.albums])

  useEffect(() => {
    fetchData('playlists', offsetState.playlists)
  }, [offsetState.playlists])

  useEffect(() => {
    if (viewState.showSim) {
      setOffsetState(prevOffset => ({ ...prevOffset, recommendations: 0 }))
    } else {
      setOffsetState(prevOffset => ({ ...prevOffset, recommendations: null }))
    }
  }, [viewState.showSim])

  useEffect(() => {
    if (state.renderType.home) {
      resetState()
      let date = new Date()
      let timestampISO = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000
      ).toISOString()
      try {
        fetch(
          '/api/getHomeContent?user_country=' +
            state.profileInfo.userCountry +
            '&timestamp=' +
            timestampISO,
          {
            headers: {
              Authorization: `Bearer ${session.user.accessToken}`
            }
          }
        )
          .then(res => res.json())
          .then(data => {
            setDataState(prevState => ({
              ...prevState,
              result: data
            }))
          })
      } catch (error) {
        console.error('Error:', error)
      }
    } else if (state.renderType.library) {
      resetState(true)
      var fullResult = {}
      Promise.all([
        fetch('/api/v1/me/tracks', {
          headers: { Authorization: `Bearer ${session.user.accessToken}` }
        }).then(resp => resp.json()),
        fetch('/api/v1/me/following', {
          headers: { Authorization: `Bearer ${session.user.accessToken}` }
        }).then(resp => resp.json()),
        fetch('/api/v1/me/albums?&market=' + state.profileInfo.userCountry, {
          headers: { Authorization: `Bearer ${session.user.accessToken}` }
        }).then(resp => resp.json()),
        fetch('/api/v1/me/playlists', {
          headers: { Authorization: `Bearer ${session.user.accessToken}` }
        }).then(resp => resp.json())
      ])
        .then(data => {
          data.map(function (result, index) {
            if (index === 0) fullResult['tracks'] = result
            else if (index === 1) {
              let slice = result?.artists?.items.slice(0, 10)
              let resultSlice = {
                ...result,
                artists: {
                  ...result?.artists,
                  items: slice
                }
              }
              setOffsetState(prevOffset => ({
                ...prevOffset,
                artistCursorAfter: {
                  0: result?.artists?.cursors?.after
                }
              }))
              fullResult['artists'] = resultSlice?.artists
            } else if (index === 2) fullResult['albums'] = result
            else if (index === 3) fullResult['playlists'] = result
          })
          setDataState(prevState => ({
            ...prevState,
            result: fullResult
          }))
        })
        .catch(error => {
          console.error('Error:', error)
        })
    } else if (state.renderType.search) {
      resetState()
      if (state.searchValue) {
        fetch('/api/search?query=' + state.searchValue, {
          headers: { Authorization: `Bearer ${session.user.accessToken}` }
        })
          .then(e => e.json())
          .then(data => {
            setDataState(prevState => ({
              ...prevState,
              result: data
            }))
          })
          .catch(error => {
            console.error('Error:', error)
          })
      }
    } else if (state.renderType.topTracks) {
      if (Object.keys(offsetState.topArtists).length > 0)
        setOffsetState(prevOffset => ({
          ...prevOffset,
          topArtists: {}
        }))
      if (offsetState.topTracks[state.timeframe] !== undefined) {
        scrollToTframe('track_' + state.timeframe)
        return
      }
      setDataState(prevState => ({
        ...prevState,
        toggledAdd: {},
        isLibrary: false
      }))
      setViewState(prev => ({
        ...prev,
        showTFrameItems: {
          topTracks: prev.showTFrameItems.topTracks + 1,
          topArtists: 0
        }
      }))
    } else if (state.renderType.topArtists) {
      if (Object.keys(offsetState.topTracks).length > 0)
        setOffsetState(prevOffset => ({
          ...prevOffset,
          topTracks: {}
        }))
      if (offsetState.topArtists[state.timeframe] !== undefined) {
        scrollToTframe('artist_' + state.timeframe)
        return
      }
      setDataState(prevState => ({
        ...prevState,
        toggledAdd: {},
        isLibrary: false
      }))
      setViewState(prev => ({
        ...prev,
        showTFrameItems: {
          topArtists: prev.showTFrameItems.topArtists + 1,
          topTracks: 0
        }
      }))
    }
  }, [state.renderType])

  useEffect(() => {
    if (dataState.result) {
      setDataState(prevState => ({
        ...prevState,
        combinedResults:
          state.renderType.topTracks || state.renderType.topArtists
            ? [...prevState.combinedResults, prevState.result]
            : [prevState.result]
      }))
    }
  }, [
    dataState.result,
    state.renderType.topTracks,
    state.renderType.topArtists
  ])

  useEffect(() => {
    if (viewState.showTFrameItems.topTracks > 0) {
      getTopItems('topTracks', state.timeframe)
    } else if (viewState.showTFrameItems.topArtists > 0) {
      getTopItems('topArtists', state.timeframe)
    }
  }, [
    viewState.showTFrameItems.topTracks,
    viewState.showTFrameItems.topArtists
  ])

  useEffect(() => {
    if (dataState.combinedResults.length > 0) {
      const type = state.renderType.topTracks ? 'track' : 'artist'
      const offset =
        type === 'track' ? offsetState.topTracks : offsetState.topArtists
      if (offset[state.timeframe] === 0)
        scrollToTframe(`${type}_${state.timeframe}`)
    }
  }, [
    dataState.combinedResults,
    offsetState.topTracks,
    offsetState.topArtists,
    state.renderType.topTracks,
    state.renderType.topArtists,
    state.timeframe
  ])

  useEffect(() => {
    fetchTopItemsData('topTracks')
  }, [offsetState.topTracks])

  useEffect(() => {
    fetchTopItemsData('topArtists')
  }, [offsetState.topArtists])

  useEffect(() => {
    if (
      offsetState.recommendations >= 0 &&
      state.spotifyObj.currentTrack &&
      viewState.showSim
    ) {
      const params = {
        seed_artists: state.spotifyObj.currentArtists,
        seed_tracks: state.spotifyObj.currentTrack,
        target_energy: state.spotifyObj.currentEnergy,
        target_valence: state.spotifyObj.currentValence,
        target_tempo: state.spotifyObj.currentTempo,
        target_danceability: state.spotifyObj.currentDanceability,
        target_time_signature: state.spotifyObj.currentTimeSig,
        market: state.profileInfo.userCountry,
        limit: offsetState.recommendations + 10
      }

      const queryString = new URLSearchParams(params).toString()
      const url = `/api/v1/recommendations?${queryString}`
      fetch(url, {
        headers: { Authorization: `Bearer ${session.user.accessToken}` }
      })
        .then(e => e.json())
        .then(data => {
          let recommendTracks = { items: data?.tracks }
          setState(prevState => ({
            ...prevState,
            fChartData: {
              ...prevState.fChartData,
              recommendations: [recommendTracks]
            }
          }))
        })
        .catch(error => {
          console.error('Error:', error)
        })
    } else if (!offsetState.recommendations) {
      setState(prevState => ({
        ...prevState,
        fChartData: {
          ...prevState.fChartData,
          recommendations: null
        }
      }))
    }
  }, [offsetState.recommendations])

  return (
    <>
      {!dataState.result || dataState.combinedResults.length === 0 ? (
        <div className='d-flex mt-4 justify-content-center align-items-center'>
          <div className='spinner-border' role='status' />
        </div>
      ) : state.renderType.home &&
        dataState.result &&
        dataState.combinedResults.length === 1 ? (
        <>
          <CategContainer
            id='featPlists'
            title='Featured Playlists'
            category='playlist'
            extraControls={`featPlistsMsg, featPlistsMsgDivider`}
          />
          <CategContainer id='newRels' title='New Releases' category='album' />
          {state.fChartData?.recommendations && (
            <CategContainer
              id='recommendations'
              title='Similar Songs'
              category='track'
            />
          )}
        </>
      ) : (
        dataState.combinedResults.length <= 3 && (
          <>
            {showResults(dataState.result)}
            {state.fChartData?.recommendations && (
              <CategContainer
                id='recommendations'
                title='Similar Songs'
                category='track'
              />
            )}
          </>
        )
      )}
    </>
  )
}
