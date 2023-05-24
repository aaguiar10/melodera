import Image from 'next/image'
import CircleExample from '../public/images/circ_ex.png'
import TriangleExample from '../public/images/tri_ex.png'
import SquareExample from '../public/images/sq_ex.png'
import PlayerImg from '../public/images/melodera-player.png'

// component for guide section
export default function GuideLayout ({ visState, setVisState }) {
  function removeBeatVis () {
    if (visState) setVisState(false)
  }

  function circVis () {
    if (!visState) setVisState(true)
    localStorage.setItem('beat_visualizer_type', 'circle')
  }

  function triVis () {
    if (!visState) setVisState(true)
    localStorage.setItem('beat_visualizer_type', 'triangle')
  }

  function sqVis () {
    if (!visState) setVisState(true)
    localStorage.setItem('beat_visualizer_type', 'square')
  }

  function mixVis () {
    if (!visState) setVisState(true)
    localStorage.setItem('beat_visualizer_type', 'mix')
  }

  return (
    <>
      <div
        className='modal fade'
        id='visModal'
        aria-hidden='true'
        aria-labelledby='visModalLabel'
        tabIndex='-1'
      >
        <div className='modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable'>
          <div className='modal-content'>
            <div className='modal-header'>
              <h5 className='modal-title' id='visModalTitle'>
                How It Works
              </h5>
              <button
                type='button'
                className='btn-close'
                data-bs-dismiss='modal'
                aria-label='Close'
              ></button>
            </div>
            <div className='modal-body' id='visModalBody'>
              <p>Spotify Premium users:</p>
              <p>Full usage of the site&apos;s features.</p>
              <p>Free users:</p>
              <p>
                Limited usage due to Spotify&apos;s restrictions. Must use the
                official Spotify app to control audio, but can nonetheless view
                the song breakdown and visualizer by clicking the music icon{' '}
                <i className='bi bi-music-note-beamed' /> in the bottom left of
                the screen (visible for Free users) to sync the app with
                Melodera. If it is syncing incorrectly, reclick{' '}
                <i className='bi bi-music-note-beamed' /> or rechoose the song
                from the Spotify app.
              </p>
              <Image src={PlayerImg} className='img-fluid' alt='Player Guide' />
            </div>
            <div className='modal-footer justify-content-center'>
              <button
                type='button'
                className='btn btn-primary'
                data-bs-target='#customModal'
                data-bs-toggle='modal'
              >
                Visualizer Settings (Experimental)
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        className='modal fade'
        id='customModal'
        aria-hidden='true'
        aria-labelledby='customModalLabel'
        tabIndex='-1'
      >
        <div className='modal-dialog modal-dialog-centered'>
          <div className='modal-content'>
            <div className='modal-header'>
              <h5 className='modal-title' id='customModalTitle'>
                Shape of Visuals
              </h5>
              <button
                type='button'
                className='btn-close'
                data-bs-dismiss='modal'
                aria-label='Close'
              ></button>
            </div>
            <div className='modal-body' id='customModalBody'>
              <div className='d-grid gap-2 col-4 mx-auto'>
                <button
                  className='btn btn-primary visualizer-btns'
                  type='button'
                  id='circVisual'
                  onClick={circVis}
                >
                  Circle
                </button>
                <Image
                  src={CircleExample}
                  className='img-fluid'
                  alt='Circle Image'
                />
                <button
                  className='btn btn-primary visualizer-btns'
                  type='button'
                  id='triVisual'
                  onClick={triVis}
                >
                  Triangle
                </button>
                <Image
                  src={TriangleExample}
                  className='img-fluid'
                  alt='Triangle Image'
                />
                <button
                  className='btn btn-primary visualizer-btns'
                  type='button'
                  id='sqVisual'
                  onClick={sqVis}
                >
                  Square
                </button>
                <Image
                  src={SquareExample}
                  className='img-fluid'
                  alt='Square Image'
                />
                <button
                  className='btn btn-primary visualizer-btns'
                  type='button'
                  id='mixVisual'
                  onClick={mixVis}
                >
                  The Mix
                </button>
              </div>
            </div>
            <div className='modal-footer justify-content-center'>
              <button
                className='btn btn-primary'
                data-bs-target='#visModal'
                data-bs-toggle='modal'
              >
                Back To Guide
              </button>
              <button
                className='btn btn-primary'
                id='remove-vis-btn'
                data-bs-dismiss='modal'
                onClick={removeBeatVis}
              >
                Remove Visuals
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
