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
    <div
      className={alt ? 'player-floating-container' : 'd-flex'}
      aria-label='corner options'
    >
      <div className={alt ? 'player-floating-left' : undefined}>
        {state.showTopBtn && (
          <Button
            className={alt ? 'player-floating-btn' : 'lightBtnCustom'}
            id='btn-back-to-top'
            style={alt ? undefined : { bottom: '20px' }}
            onClick={backToTop}
          >
            <i className='bi bi-arrow-up'></i>
          </Button>
        )}
        <Button
          className={alt ? 'player-floating-btn' : 'lightBtnCustom'}
          id='btn-sync'
          onClick={() => {
            syncPlayer(state, setState, session)
          }}
          style={
            alt
              ? undefined
              : state.showTopBtn
              ? { left: '3rem', bottom: '20px' }
              : { bottom: '20px' }
          }
        >
          <i className='bi bi-music-note-beamed' />
        </Button>
      </div>

      {alt && (
        <Button
          className='player-floating-btn'
          id='expandBtn'
          onClick={() => setPlayerSize(playerSize + 1)}
        >
          <i className='bi bi-arrow-bar-up fs-5' />
        </Button>
      )}
    </div>
  )
}
