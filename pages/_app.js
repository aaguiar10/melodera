import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import '../styles/globals.css'
import { useEffect, useState, useRef } from 'react'
import { SessionProvider } from 'next-auth/react'
import { AnalysisContext, ResultsContext } from '../utils/context'
export default function App ({
  Component,
  pageProps: { session, ...pageProps }
}) {
  const [state, setState] = useState({
    renderType: {
      home: true,
      search: false,
      library: false,
      topTracks: false,
      topArtists: false
    },
    analysisData: null,
    featuresData: null,
    fChartData: null,
    visState: { on: false, type: null },
    showTopBtn: null,
    active: 'home',
    profileInfo: {},
    searchValue: '',
    artCover: { link: null, image: null, color: null },
    isPaused: false,
    spotifyObj: {
      currentTrack: null,
      currentTrackInfo: null,
      currentArtists: null,
      currentValence: null,
      currentEnergy: null,
      currentTempo: null,
      currentDanceability: null,
      currentTimeSig: null
    },
    showAlerts: { freeSub: true, playerNotReady: false },
    showMix: null,
    sdkReady: false
  })

  const [dataState, setDataState] = useState({
    result: null,
    combinedResults: [],
    toggledAdd: {},
    isLibrary: null
  })

  const [viewState, setViewState] = useState({
    showSim: false,
    showTFrameItems: {
      topTracks: 0,
      topArtists: 0
    },
    isCollapsed: {
      topTracks: false,
      topArtists: false,
      featPlists: false,
      newRels: false,
      tracks: false,
      artists: false,
      albums: false,
      playlists: false,
      recommendations: false
    }
  })
  const [offsetState, setOffsetState] = useState({
    tracks: 0,
    artists: 0,
    albums: 0,
    playlists: 0,
    artistCursorAfter: {},
    topTracks: { short_term: 0, medium_term: 0, long_term: 0 },
    topArtists: { short_term: 0, medium_term: 0, long_term: 0 },
    recommendations: null
  })

  const player = useRef(null)
  const deviceId = useRef('')
  const tframesRef = useRef(null)

  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.min.js')
  }, [])
  return (
    // Refetch session near every hour
    <SessionProvider
      session={session}
      refetchInterval={60 * 1}
      refetchWhenOffline={false}
      refetchOnWindowFocus={true}
    >
      <AnalysisContext.Provider value={[state, setState, player, deviceId]}>
        <ResultsContext.Provider
          value={[
            dataState,
            setDataState,
            viewState,
            setViewState,
            offsetState,
            setOffsetState,
            tframesRef
          ]}
        >
          <Component {...pageProps} />
        </ResultsContext.Provider>
      </AnalysisContext.Provider>
    </SessionProvider>
  )
}
