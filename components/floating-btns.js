import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Button from 'react-bootstrap/Button'
import { useSession } from 'next-auth/react'
import { useContext } from 'react'
import { AnalysisContext } from '../utils/context'
import { backToTop, syncPlayer } from '../utils/funcs'

// component for floating buttons on the bottom corners
export default function FloatingBtns ({ alt, playerSize, setPlayerSize }) {
  const { data: session } = useSession()
  const [state, setState] = useContext(AnalysisContext)

  return (
    <ButtonGroup
      className='d-flex'
      aria-label='corner options'
      style={{ bottom: '1.75rem' }}
    >
      {state.showTopBtn && (
        <Button
          variant='light'
          className={alt ? 'bg-transparent border-0' : ''}
          id='btn-back-to-top'
          style={alt ? { left: '0px' } : { bottom: '20px' }}
          onClick={backToTop}
        >
          <i className='bi bi-arrow-up'></i>
        </Button>
      )}
      <Button
        variant='light'
        className={alt ? 'bg-transparent border-0' : ''}
        id='btn-sync'
        onClick={() => {
          syncPlayer(state, setState, session)
        }}
        style={
          state.showTopBtn
            ? alt
              ? { left: '3rem' }
              : { left: '3rem', bottom: '20px' }
            : alt
            ? { left: '0px' }
            : { bottom: '20px' }
        }
      >
        <i className='bi bi-music-note-beamed' />
      </Button>
      {alt && (
        <Button
          variant='light'
          id='expandBtn'
          onClick={() => setPlayerSize(playerSize + 1)}
        >
          <i className='bi bi-arrow-bar-up fs-5' />
        </Button>
      )}
    </ButtonGroup>
  )
}
