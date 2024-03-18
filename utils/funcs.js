// Utility functions for the app

export function backToTop () {
  window.scroll({ top: 0, behavior: 'smooth' })
}

export function resumeTrack (player, setState) {
  if (player.current) {
    player.current.resume()
  }
  // switch state when resumed
  setState(prevState => ({
    ...prevState,
    isPaused: false
  }))
}

export function pauseTrack (player, setState) {
  if (player.current) {
    player.current.pause()
  }
  // switch state when paused
  setState(prevState => ({
    ...prevState,
    isPaused: true
  }))
}

// start playback with Melodera player (premium feature)
export function playTrack (id, player, deviceId, session, state) {
  if (player.current && state.profileInfo.subscription !== 'free') {
    fetch(
      '/api/v1/me/player/play?device_id=' +
        deviceId.current +
        '&track_id=' +
        id,
      {
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`
        }
      }
    ).catch(e => {
      console.log(e)
    })
  }
}

// retrieve track info, audio features, and scan cover art
async function getFeaturesData (id, session, setState) {
  try {
    const e = await fetch('/api/getTrack?id=' + id, {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`
      }
    })
    const data = await e.json()
    const e_2 = await fetch('/api/features?id=' + id, {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`
      }
    })
    const data_2 = await e_2.json()
    const keyMap = {
      0: 'C',
      1: 'C♯/D♭',
      2: 'D',
      3: 'D♯/E♭',
      4: 'E',
      5: 'F',
      6: 'F♯/G♭',
      7: 'G',
      8: 'G♯/A♭',
      9: 'A',
      10: 'A♯/B♭',
      11: 'B'
    }

    data_2.key = keyMap[data_2.key] || 'unknown'

    setState(prevState => ({
      ...prevState,
      spotifyObj: {
        currentTrack: data.id,
        currentTrackInfo: data,
        currentArtists: [...data.artists.map(artist => artist.id)],
        currentValence: data_2.valence,
        currentEnergy: data_2.energy,
        currentTempo: data_2.tempo,
        currentDanceability: data_2.danceability,
        currentTimeSig: data_2.time_signature
      },
      featuresData: data_2
    }))

    fetch('/api/imgArt?img=' + data.album.images[1]?.url, {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`
      }
    })
      .then(res => res.json())
      .then(imgData => {
        setState(prevState => ({
          ...prevState,
          artCover: {
            ...prevState.artCover,
            link: data.album.external_urls.spotify ?? 'https://www.spotify.com',
            image: data.album.images[1].url ?? '/images/music-note-beamed.svg',
            color: {
              rgbLightVibrant: imgData?.LightVibrant.rgb ?? [255, 255, 255],
              rgbVibrant: imgData?.Vibrant.rgb ?? [255, 255, 255],
              rgbDarkVibrant: imgData?.DarkVibrant.rgb ?? [255, 255, 255],
              rgbMuted: imgData?.Muted.rgb ?? [0, 0, 0]
            }
          }
        }))
      })
      .catch(error => console.error('Error:', error))
  } catch (error) {
    console.error(error)
  }
}

async function fetchQuery (query, session, setState) {
  const e = await fetch(query, {
    headers: {
      Authorization: `Bearer ${session.user.accessToken}`
    }
  })
  const data = await e.json()
  setState(prevState => ({
    ...prevState,
    isPaused: false,
    analysisData: data
  }))
}

export async function getAnalysis (id, session, setState) {
  id && fetchQuery(`/api/analysis?id=${id}`, session, setState)
}

export async function getFeatures (id, session, setState) {
  id && getFeaturesData(id, session, setState)
}

export const range = (start, stop, step) =>
  Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step)

export function getMap (tframesRef) {
  if (!tframesRef.current) tframesRef.current = new Map() // Initialize
  return tframesRef.current
}

// sync playback of Spotify client with Melodera
export function syncPlayer (state, setState, session) {
  if (state.profileInfo.subscription === 'free') {
    fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`
      }
    })
      .then(e => e.json())
      .then(data => {
        if (data?.item?.id) {
          getFeatures(data.item.id, session, setState)
          getAnalysis(data.item.id, session, setState)
        }
      })
      .catch(error => {
        console.log(error)
        if (!state.showAlerts.freeSub) {
          setState(prevState => ({
            ...prevState,
            showAlerts: { ...prevState.showAlerts, freeSub: true }
          }))
        }
      })
  }
}
