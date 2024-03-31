import HeadLayout from '../components/head-layout'
import NavBar from '../components/navbar'
import MixLayout from '../components/mix-layout'
import AlertLayout from '../components/alert-layout'
import FloatingBtns from '../components/floating-btns'
import Results from '../components/results'
import FeaturesChart from '../components/features-chart'
import GuideLayout from '../components/guide-layout'
import ProfileLayout from '../components/profile-layout'
import LogoPic from '../public/images/melodera-logo.png'
import Script from 'next/script'
import Image from 'next/image'
import { useEffect, useContext } from 'react'
import { useSession, getSession, signIn } from 'next-auth/react'
import { AnalysisContext } from '../utils/context'
import { resumeTrack, pauseTrack } from '../utils/funcs'

// main page after login
export default function Analysis () {
  const { data: session, status } = useSession()
  const [state, setState, player, deviceId] = useContext(AnalysisContext)

  const handleClick = () => {
    if (player.current) {
      player.current.activateElement()
    }
  }

  useEffect(() => {
    // When the user scrolls down 20px from the top of the page, show the button
    function handleScroll () {
      if (window.scrollY > 20) {
        setState(prevState => ({
          ...prevState,
          showTopBtn: true
        }))
      } else {
        setState(prevState => ({
          ...prevState,
          showTopBtn: false
        }))
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
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
                data.images?.length !== 0 ? data?.images?.[1].url : ''
              setState(prevState => ({
                ...prevState,
                profileInfo: {
                  ...prevState.profileInfo,
                  profPic: profilePic,
                  displayName: data.display_name,
                  userCountry: data.country,
                  currentUser: data.id,
                  subscription: data.product,
                  followersCount: data.followers?.total
                },
                showSyncBtn: data.product === 'free' ? true : false
              }))
            })
        } catch (error) {
          console.log(error)
        }
      }
    }
    window.onSpotifyWebPlaybackSDKReady = () => {
      if (!player.current) {
        const spot_player = new Spotify.Player({
          name: 'Melodera Player',
          getOAuthToken: async cb => {
            let session = await getSession()
            cb(session.user.accessToken)
          },
          volume: 0.8
        })

        spot_player.addListener('ready', ({ device_id }) => {
          deviceId.current = device_id
          player.current = spot_player
          fetch('/api/v1/me/player?device_id=' + device_id, {
            headers: {
              Authorization: `Bearer ${session.user.accessToken}`
            }
          }).catch(e => {
            console.log(e)
          })
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
        spot_player.on('player_state_changed', state => {
          if (
            state?.track_window?.previous_tracks.find(
              x => x.id === state.track_window.current_track.id
            ) &&
            state?.paused
          ) {
            pauseTrack(player, setState)
          } else if (state?.paused) {
            pauseTrack(player, setState)
          } else if (!state?.paused) {
            resumeTrack(player, setState)
          }
        })

        // Connect to the player
        spot_player.connect().then(success => {
          if (success) {
            console.log('Melodera player connected to Spotify')
          }
        })
        window.addEventListener('click', handleClick, { once: true })
      }
    }

    return () => {
      window.removeEventListener('click', handleClick, {
        once: true
      })
    }
  }, [session])

  // Loading screen
  if (Object.keys(state.profileInfo).length === 0) {
    return (
      <>
        <HeadLayout
          title='Melodera'
          description='Analyze songs, get recommendations, and view your listening habits'
        />
        <div className='d-flex justify-content-center align-items-center vh-100'>
          <Image
            className='img-fluid'
            src={LogoPic}
            alt='logo'
            width={300}
            height={300}
            priority
          />
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
      <NavBar />
      <AlertLayout />
      {!state.featuresData && <FloatingBtns />}
      <section className='features'>
        <ProfileLayout />
        <MixLayout />
        <GuideLayout />
        <div className='mb-1' id='results'>
          <Results />
        </div>
        <hr
          className={
            state.analysisData ? 'dividerLine d-block' : 'dividerLine d-none'
          }
        />
        {state.analysisData && state.featuresData && <FeaturesChart />}
      </section>
      <Script
        src='https://sdk.scdn.co/spotify-player.js'
        strategy='lazyOnload'
      />
    </>
  )
}
