import PanoExample from '../public/images/pano_ex.png'
import OrbExample from '../public/images/orb_ex.png'
import PyramidExample from '../public/images/pyramid_ex.png'
import BlockExample from '../public/images/block_ex.png'
import PlayerImg from '../public/images/melodera-player.png'
import PaletteImg from '../public/images/palette.png'
import Image from 'next/image'
import { useContext } from 'react'
import { AnalysisContext } from '../utils/context'

// component for guide section
export default function GuideLayout () {
  const [state, setState] = useContext(AnalysisContext)

  function removeVisual () {
    if (state.visState.on) {
      setState(prevState => ({
        ...prevState,
        visState: { on: false, type: '' }
      }))
    }
  }

  function handleVisual (id) {
    let visType = ''
    if (id === 'panoVisual') visType = 'panorama'
    else if (id === 'orbVisual') visType = 'orb'
    else if (id === 'pyrVisual') visType = 'pyramid'
    else if (id === 'blockVisual') visType = 'block'
    if (!state.visState.on || state.visState.type !== visType) {
      setState(prevState => ({
        ...prevState,
        visState: { on: true, type: visType }
      }))
    }
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
                Guide
              </h5>
              <button
                type='button'
                className='btn-close'
                data-bs-dismiss='modal'
                aria-label='Close'
              ></button>
            </div>
            <div className='modal-body' id='visModalBody'>
              <p className='fw-bold mx-auto'>Spotify Premium users</p>
              <p className='mx-auto'>Full access to Melodera&apos;s features</p>
              <p className='fw-bold mx-auto'>Free users</p>
              <p className='mx-auto text-center'>
                The official Spotify app is required to control audio. Sync
                Melodera with Spotify&apos;s audio playback by selecting the
                music icon <i className='bi bi-music-note-beamed' /> after
                selecting a song from the Spotify app
              </p>
              <p className='fw-bold mx-auto'>Player Info</p>
              <p className='mx-auto text-center'>
                If the visualizer is not syncing properly, reselect{' '}
                <i className='bi bi-music-note-beamed' /> or the song
              </p>
              <p className='mx-auto text-center'>
                There are two player modes: minimized and expanded. Select{' '}
                <i className='bi bi-arrow-bar-up fs-5' /> to switch between them
              </p>
              <Image src={PlayerImg} className='img-fluid' alt='Player Guide' />
              <div className='text-center p-3'>
                Each color in <span className='fw-bold'>Pitch</span> represents
                a pitch class
              </div>
              <Image
                src={PaletteImg}
                className='img-fluid'
                alt='Color Palette'
              />
            </div>
            <div className='modal-footer justify-content-center'>
              <button
                type='button'
                className='btn btn-primary'
                data-bs-target='#customModal'
                data-bs-toggle='modal'
              >
                Visualizer Settings
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
                Visualizer
              </h5>
              <button
                type='button'
                className='btn-close'
                data-bs-dismiss='modal'
                aria-label='Close'
              ></button>
            </div>
            <div className='modal-body' id='customModalBody'>
              <div className='d-grid gap-2 mx-auto'>
                <Image
                  src={PanoExample}
                  className='img-fluid'
                  alt='Panorama Image'
                />
                <button
                  className='btn btn-primary visualizer-btns'
                  type='button'
                  id='panoVisual'
                  onClick={e => handleVisual(e.currentTarget.id)}
                >
                  Panorama
                </button>
                <Image src={OrbExample} className='img-fluid' alt='Orb Image' />
                <button
                  className='btn btn-primary visualizer-btns'
                  type='button'
                  id='orbVisual'
                  onClick={e => handleVisual(e.currentTarget.id)}
                >
                  Orb
                </button>
                <Image
                  src={PyramidExample}
                  className='img-fluid'
                  alt='Pyramid Image'
                />
                <button
                  className='btn btn-primary visualizer-btns'
                  type='button'
                  id='pyrVisual'
                  onClick={e => handleVisual(e.currentTarget.id)}
                >
                  Pyramid
                </button>
                <Image
                  src={BlockExample}
                  className='img-fluid'
                  alt='Block Image'
                />
                <button
                  className='btn btn-primary visualizer-btns'
                  type='button'
                  id='blockVisual'
                  onClick={e => handleVisual(e.currentTarget.id)}
                >
                  Block
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
                type='button'
                id='remove-vis-btn'
                onClick={removeVisual}
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
