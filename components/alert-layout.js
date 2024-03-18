import Alert from 'react-bootstrap/Alert'
import { useContext } from 'react'
import { AnalysisContext } from '../utils/context'

// Component for displaying alerts
export default function AlertLayout () {
  const [state, setState] = useContext(AnalysisContext)
  
  return (
    <>
      <Alert
        show={
          state.profileInfo.subscription === 'free' &&
          state.showAlerts.playerNotReady
        }
        variant={'info'}
        onClose={() =>
          setState(prevState => ({
            ...prevState,
            showAlerts: { ...prevState.showAlerts, playerNotReady: false }
          }))
        }
        dismissible
      >
        <Alert.Heading>Alert</Alert.Heading>
        Melodera&apos;s player is not ready for playback. Please try again
        later.
      </Alert>
      <Alert
        show={
          state.profileInfo.subscription === 'free' && state.showAlerts.freeSub
        }
        variant={'info'}
        onClose={() =>
          setState(prevState => ({
            ...prevState,
            showAlerts: { ...prevState.showAlerts, freeSub: false }
          }))
        }
        dismissible
      >
        <Alert.Heading>Alert</Alert.Heading>
        Spotify Premium is required to control Melodera&apos;s player and
        visualizer. Select a song from the Spotify app (desktop client, phone,
        etc.) for audio playback, then select the music icon{' '}
        <i className='bi bi-music-note-beamed' /> to sync it with Melodera.
      </Alert>
    </>
  )
}
