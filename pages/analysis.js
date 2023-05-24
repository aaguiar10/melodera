import HeadLayout from '../components/head-layout'
import { useEffect, useState, useRef } from 'react'
import NavBar from '../components/navbar'
import Results from '../components/results'
import FeaturesChart from '../components/features-chart'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import GuideLayout from '../components/guide-layout'
import ProfileLayout from '../components/profile-layout'
import { useSession, signIn } from 'next-auth/react'
import MusicNote from '../public/images/music-note-beamed.svg'
import Script from 'next/script'

export default function Analysis () {
  const { data: session, status } = useSession()
  const [renderType, setRenderType] = useState({
    home: true,
    search: false,
    library: false,
    topTracks: false,
    topArtists: false
  })
  const [analysisData, setAnalysisData] = useState(null)
  const [featuresData, setFeaturesData] = useState(null)
  const [fChartData, setFChartData] = useState(null)
  const [visState, setVisState] = useState(false)
  const [timeframe, setTimeframe] = useState('')
  const [showTopBtn, setShowTopBtn] = useState(null)
  const [showSyncBtn, setShowSyncBtn] = useState(null)
  const [active, setActive] = useState('home')
  const [profileInfo, setProfileInfo] = useState({})
  const [searchValue, setSearchValue] = useState('')
  const [artCover, setArtCover] = useState({
    link: null,
    image: null,
    color: null
  })
  const player = useRef(null)
  const deviceId = useRef('')
  const [isPaused, setIsPaused] = useState(false)
  const [spotifyObj, setSpotifyObj] = useState({
    currentTrack: null,
    currentTrackInfo: null,
    currentArtist: null,
    currentValence: null,
    currentEnergy: null,
    currentTempo: null,
    currentDanceability: null,
    currentTimeSig: null
  })

  // On click, scroll to the top
  function backToTop () {
    window.scroll({ top: 0, behavior: 'smooth' })
  }

  // sync playback of Spotify client with Melodera
  function syncPlayer () {
    if (profileInfo['subLevel'] === 'free') {
      fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`
        }
      })
        .then(e => e.json())
        .then(data => {
          if (data?.item?.id) {
            getAnalysis(data.item.id)
            getFeatures(data.item.id)
          }
        })
        .catch(error => {
          console.log(error)
          alert(
            `Choose song through Spotify app (desktop client, phone, etc.) then` +
              ` click music icon to sync with Melodera.`
          )
        })
    }
  }

  // start playback with Melodera player (premium feature)
  function playVid (id) {
    if (player.current && profileInfo['subLevel'] !== 'free') {
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
    } else if (profileInfo['subLevel'] === 'free') {
      var alerted = localStorage.getItem('alertedCheckId') || ''
      if (alerted !== 'yes') {
        alert(
          `Choose song through Spotify app (desktop client, phone, etc.) then` +
            ` click music icon to sync with Melodera.`
        )
        localStorage.setItem('alertedCheckId', 'yes')
      }
    }
  }

  function resumeVid () {
    if (player.current && profileInfo['subLevel'] !== 'free') {
      player.current.resume()
    }
  }

  // resume functionality when not using Melodera's native resume button
  function resumeVidAuto () {
    setIsPaused(false)
  }

  function pauseVid () {
    if (player.current && profileInfo['subLevel'] !== 'free') {
      player.current.pause()
    }
  }

  // pause functionality when not using Melodera's native pause button
  function pauseVidAuto () {
    setIsPaused(true)
  }

  // retrieve track info, audio features, and scan cover art
  async function getFeaturesData (id) {
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
      setSpotifyObj({
        ...spotifyObj,
        currentTrack: data.id,
        currentTrackInfo: data,
        currentArtist: data.artists[0].id,
        currentValence: data_2.valence,
        currentEnergy: data_2.energy,
        currentTempo: data_2.tempo,
        currentDanceability: data_2.danceability,
        currentTimeSig: data_2.key
      })
      if (data_2.key == 0) data_2.key = 'C'
      else if (data_2.key == 1) data_2.key = 'C♯/D♭'
      else if (data_2.key == 2) data_2.key = 'D'
      else if (data_2.key == 3) data_2.key = 'D♯/E♭'
      else if (data_2.key == 4) data_2.key = 'E'
      else if (data_2.key == 5) data_2.key = 'F'
      else if (data_2.key == 6) data_2.key = 'F♯/G♭'
      else if (data_2.key == 7) data_2.key = 'G'
      else if (data_2.key == 8) data_2.key = 'G♯/A♭'
      else if (data_2.key == 9) data_2.key = 'A'
      else if (data_2.key == 10) data_2.key = 'A♯/B♭'
      else if (data_2.key == 11) data_2.key = 'B'
      else data_2.key = 'unknown'
      setFeaturesData(data_2)

      fetch('/api/imgArt?img=' + (data.album.images[1].url ?? MusicNote), {
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`
        }
      })
        .then(res => res.json())
        .then(imgData => {
          setArtCover({
            ...artCover,
            link: data.album.external_urls.spotify ?? 'https://www.spotify.com',
            image: data.album.images[1].url ?? '/images/music-note-beamed.svg',
            color: {
              rgbVibrant: imgData.Vibrant.rgb,
              rgbMuted: imgData.Muted.rgb
            }
          })
        })
        .catch(error => console.error('Error:', error))
    } catch (error) {
      console.error(error)
    }
  }

  async function fetchQuery (query) {
    const e = await fetch(query, {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`
      }
    })
    const data = await e.json()
    setIsPaused(false)
    setAnalysisData(data)
  }

  async function getAnalysis (id) {
    let query = '/api/analysis?id='
    if (!id) {
      return
    }
    query += id
    fetchQuery(query)
  }

  async function getFeatures (id) {
    if (!id) {
      return
    }
    getFeaturesData(id)
  }

  useEffect(() => {
    // When the user scrolls down 20px from the top of the page, show the button
    function handleScroll () {
      if (window.scrollY > 20) {
        setShowTopBtn(true)
      } else {
        setShowTopBtn(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    function handleClick () {
      if (player.current) {
        player.current.activateElement()
      }
    }

    if (session) {
      if (
        session.error === 'RefreshAccessTokenError' ||
        status === 'unauthenticated'
      ) {
        signIn()
      } else if (status === 'authenticated') {
        // initialize player and retrieve user profile
        try {
          fetch('/api/v1/me', {
            headers: {
              Authorization: `Bearer ${session.user.accessToken}`
            }
          })
            .then(res => res.json())
            .then(data => {
              let profilePic =
                data.images?.length !== 0 ? data?.images?.[0].url : ''
              setProfileInfo(profileInfo => ({
                ...profileInfo,
                prof_pic: profilePic,
                displayName: data.display_name,
                userCountry: data.country,
                currentUser: data.id,
                subLevel: data.product,
                followersCount: data.followers?.total
              }))
              if (data.product === 'free') {
                setShowSyncBtn(true)
                var alerted = localStorage.getItem('alertedOnLogin') || ''
                if (alerted !== 'yes') {
                  alert(
                    `Spotify Premium is required to control Melodera's audio player / visualizer.` +
                      ` Instead use the Spotify app (desktop client, phone, etc.) for playback, then click` +
                      ` the music icon on the bottom left of the screen (after this alert) to sync with Melodera.`
                  )
                  localStorage.setItem('alertedOnLogin', 'yes')
                }
              } else {
                setShowSyncBtn(false)
              }
            })
        } catch (error) {
          console.log(error)
        }

        window.onSpotifyWebPlaybackSDKReady = () => {
          const spot_player = new Spotify.Player({
            name: 'Melodera Player',
            getOAuthToken: cb => {
              cb(session.user.accessToken)
            },
            volume: 0.8
          })
          player.current = spot_player

          spot_player.addListener('ready', ({ device_id }) => {
            deviceId.current = device_id
          })

          spot_player.addListener('not_ready', ({ device_id }) => {
            deviceId.current = device_id
            alert(
              'Melodera player is not ready for playback. Please try again later.'
            )
          })

          spot_player.on('account_error', ({ message }) => {
            console.error('Failed to validate Spotify account:', message)
          })

          // check player state
          spot_player.on('player_state_changed', state => {
            if (
              state?.track_window?.previous_tracks.find(
                x => x.id === state.track_window.current_track.id
              ) &&
              state.paused
            ) {
              pauseVidAuto()
            } else if (state.paused) {
              pauseVidAuto()
            } else if (!state.paused) {
              resumeVidAuto()
            }
          })

          // Connect to the player
          spot_player.connect().then(success => {
            if (success) {
              console.log('Melodera player connected to Spotify')
            }
          })
          document.body.addEventListener('click', handleClick, { once: true })
        }
      }
    }
    return () => {
      document.body.removeEventListener('click', handleClick, {
        once: true
      })
    }
  }, [session, status])

  // Loading screen
  if (Object.keys(profileInfo).length === 0) {
    return (
      <>
        <HeadLayout
          title='Melodera'
          description='Analyze songs, get recommendations, and view your listening habits'
        />
        <div className='d-flex justify-content-center align-items-center vh-100'>
          <div className='loader' role='status' />
        </div>
      </>
    )
  }

  return (
    <>
      <HeadLayout
        title='Melodera'
        description='Analyze songs, get recommendations, and view your listening habits'
      />
      <header className='rounded'>
        <h1 className='siteName'>Melodera</h1>
      </header>
      <NavBar
        states={{
          active,
          setActive,
          renderType,
          setRenderType,
          setTimeframe,
          setSearchValue,
          isPaused
        }}
        profPic={profileInfo['prof_pic']}
        subscription={profileInfo['subLevel']}
        player={player}
        funcs={{
          resumeVid,
          pauseVid
        }}
      />
      <ButtonGroup aria-label='corner options'>
        {showTopBtn ? (
          <button
            type='button'
            className='btn btn-floating btn-md'
            id='btn-back-to-top'
            onClick={backToTop}
            aria-label='btn-back-to-top'
          >
            <i className='bi bi-arrow-up'></i>
          </button>
        ) : (
          <></>
        )}
        {showSyncBtn ? (
          <button
            type='button'
            className='btn btn-floating btn-md'
            id='btn-sync'
            onClick={syncPlayer}
            style={showTopBtn ? { left: '50px' } : {}}
            aria-label='btn-sync-player'
          >
            <i className='bi bi-music-note-beamed' />
          </button>
        ) : (
          <></>
        )}
      </ButtonGroup>
      <section className='features'>
        <ProfileLayout profileInfo={profileInfo} />
        <GuideLayout visState={visState} setVisState={setVisState} />
        <div id='results'>
          <Results
            type={renderType}
            userCountry={profileInfo.userCountry}
            token={session.user.accessToken}
            state={{
              timeframe,
              setTimeframe,
              searchValue,
              fChartData,
              setFChartData
            }}
            funcs={{
              playVid,
              getAnalysis,
              getFeatures
            }}
            spotifyObj={spotifyObj}
          />
        </div>
        <hr
          className={
            analysisData ? 'dividerLine d-block' : 'dividerLine d-none'
          }
        />
        {analysisData &&
          featuresData &&
          artCover &&
          spotifyObj &&
          player.current && (
            <FeaturesChart
              funcs={{
                resumeVid,
                resumeVidAuto,
                pauseVid,
                pauseVidAuto,
                syncPlayer
              }}
              artCover={artCover}
              isPaused={isPaused}
              token={session.user.accessToken}
              player={player}
              analysisData={analysisData}
              featuresData={featuresData}
              fChartState={{ fChartData, setFChartData, visState }}
              userInfo={{
                username: profileInfo.currentUser,
                subscription: profileInfo.subLevel,
                country: profileInfo.userCountry
              }}
              spotifyObj={spotifyObj}
            />
          )}
      </section>
      <Script
        src='https://sdk.scdn.co/spotify-player.js'
        strategy='lazyOnload'
      />
    </>
  )
}
