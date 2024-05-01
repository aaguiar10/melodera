import HeadLayout from '../components/head-layout'
import NavBar from '../components/navbar'
import MixLayout from '../components/mix-layout'
import AlertLayout from '../components/alert-layout'
import FloatingBtns from '../components/floating-btns'
import Results from '../components/results'
import FeaturesChart from '../components/features-chart'
import GuideLayout from '../components/guide-layout'
import ProfileLayout from '../components/profile-layout'
import Script from 'next/script'
import { useEffect, useContext } from 'react'
import { getSession } from 'next-auth/react'
import { AnalysisContext } from '../utils/context'
import {
  resumeTrack,
  pauseTrack,
  getFeatures,
  getAnalysis
} from '../utils/funcs'

// main page after login
export default function Analysis () {
  const [state, setState, player, deviceId] = useContext(AnalysisContext)

  const handleClick = () => {
    if (player.current) {
      player.current.activateElement()
    }
  }

  // When the user scrolls down 20px from the top of the page, show the button
  const handleScroll = () => {
    setState(prevState => ({
      ...prevState,
      showTopBtn: window.scrollY > 20
    }))
  }

  useEffect(() => {
    window.onSpotifyWebPlaybackSDKReady = () => {
      setState(prevState => ({ ...prevState, sdkReady: true }))
    }
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    if (state.sdkReady) {
      if (!player.current) {
        // Initialize player
        const spot_player = new Spotify.Player({
          name: 'Melodera Player',
          getOAuthToken: async cb => {
            const session = await getSession()
            cb(session?.user?.accessToken)
          },
          volume: 0.8
        })

        spot_player.addListener('ready', ({ device_id }) => {
          deviceId.current = device_id
        })

        spot_player.addListener('not_ready', ({ device_id }) => {
          deviceId.current = device_id
          setState(prevState => ({
            ...prevState,
            showAlerts: { ...prevState.showAlerts, playerNotReady: true }
          }))
        })

        spot_player.on('account_error', ({ message }) => {
          console.error('Failed to validate Spotify account:', message)
        })

        // check player state
        spot_player.on('player_state_changed', async state => {
          if (
            state?.track_window?.previous_tracks.find(
              x => x.id === state?.track_window?.current_track.id
            ) &&
            state?.paused
          ) {
            pauseTrack(player, setState)
          } else if (state?.loading && state?.track_window?.current_track) {
            const session = await getSession()
            getFeatures(
              state?.track_window?.current_track.id,
              session,
              setState
            )
            getAnalysis(
              state?.track_window?.current_track.id,
              session,
              setState
            )
          }
          if (state?.paused) pauseTrack(player, setState)
          else if (!state?.paused) resumeTrack(player, setState)
        })

        // Connect to the player
        spot_player.connect().then(success => {
          if (success) {
            player.current = spot_player
            console.log('Melodera player connected to Spotify')
          }
        })
      }
      window.addEventListener('click', handleClick, { once: true })
    }
    return () => {
      window.removeEventListener('click', handleClick, {
        once: true
      })
    }
  }, [state.sdkReady])

  return (
    <>
      <HeadLayout
        title='Melodera'
        description='Analyze songs, get recommendations, and discover your listening trends'
      />
      <NavBar />
      {state.profileInfo.subscription && (
        <>
          <AlertLayout />
          {!state.spotifyObj.currentTrack && <FloatingBtns />}
          <section className='features'>
            <ProfileLayout />
            <MixLayout />
            <GuideLayout />
            <div className='mb-1' id='results'>
              <Results />
            </div>
            {state.spotifyObj.currentTrack && <FeaturesChart />}
          </section>
        </>
      )}
      <Script
        src='https://sdk.scdn.co/spotify-player.js'
        strategy='lazyOnload'
      />
    </>
  )
}
