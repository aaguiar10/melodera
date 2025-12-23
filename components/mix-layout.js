import MusicNote from '../public/images/music-note-beamed.svg'
import SpotifyLogo from '../public/images/spotify_logo_white.png'
import Link from 'next/link'
import Image from 'next/image'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import Toast from 'react-bootstrap/Toast'
import Stack from 'react-bootstrap/Stack'
import { SkeletonMixItem } from './skeleton-loader'
import { useSession } from 'next-auth/react'
import { useState, useContext } from 'react'
import { playTrack, getAnalysis, getFeatures, throttle } from '../utils/funcs'
import { AnalysisContext } from '../utils/context'

// component for 'My Mix' modal
export default function MixLayout () {
  const { data: session } = useSession()
  const [state, setState, player, deviceId] = useContext(AnalysisContext)
  const [mixState, setMixState] = useState(null)
  const [showToast, setShowToast] = useState(false)

  const fetchMix = throttle(() => {
    fetch(`/api/v1/musicMix?market=${state.profileInfo?.userCountry}`, {
      headers: { Authorization: `Bearer ${session.user.accessToken}` }
    })
      .then(e => e.json())
      .then(data => {
        setMixState(data)
      })
      .catch(error => {
        console.error('Error:', error)
      })
  }, 2000)

  const createMixPlist = throttle(tracks => {
    const trackUris = tracks?.map(track => `spotify:track:${track.id}`)
    const date = new Date()
    const title = 'My Mix'
    fetch(
      `/api/v1/me/createPlist?timestamp=${date.toLocaleString()}&tracks=${trackUris}&title=${title}`,
      {
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`
        }
      }
    )
      .then(() => setShowToast(true))
      .catch(e => console.error(e))
  }, 2000)

  return (
    <>
      <Modal
        id='mixModal'
        tabIndex='-1'
        aria-labelledby='mixModalLabel'
        aria-hidden='true'
        show={state.showMix}
        onShow={() => fetchMix()}
        onHide={() => {
          setState(prevState => ({
            ...prevState,
            showMix: false
          }))
          setMixState(null)
        }}
      >
        <Modal.Dialog
          centered
          className={mixState ? 'm-0' : ''}
          contentClassName='border-0'
        >
          {!mixState && state.showMix && (
            <Modal.Body className='text-center' id='mixModalBody'>
              <SkeletonMixItem count={5} />
            </Modal.Body>
          )}
          {mixState && (
            <>
              <Modal.Header closeButton>
                <Modal.Title id='mixModalTitle'>My Mix</Modal.Title>
                <Toast
                  className='text-center trackOptionsToast'
                  show={showToast}
                  onClose={() => setShowToast(false)}
                  delay='2000'
                  autohide
                >
                  <Toast.Body>Playlist added to Your Library</Toast.Body>
                </Toast>
              </Modal.Header>
              <Modal.Body
                id='mixModalBody'
                style={{ padding: '1rem', overflow: 'hidden' }}
              >
                {mixState?.tracks?.length > 0 ? (
                  <ol
                    className='px-0 m-0 text-break'
                    style={{
                      listStyle: 'none',
                      maxHeight: '50vh',
                      overflowY: 'auto',
                      overflowX: 'hidden'
                    }}
                  >
                    {mixState?.tracks?.map((result, index) => (
                      <Stack
                        className='mix-item py-1 gap-1'
                        direction='horizontal'
                        key={`mixItem${index}`}
                        onClick={() => {
                          playTrack(result.id, player, deviceId, session, state)
                          getFeatures(result.id, session, setState)
                          getAnalysis(result.id, session, setState)
                        }}
                      >
                        <Link
                          className='d-flex align-items-start flex-column col-auto'
                          href={
                            result.external_urls?.spotify ??
                            'https://www.spotify.com'
                          }
                          target='_blank'
                          rel='noreferrer'
                          onClick={e => e.stopPropagation()}
                          aria-label='Go to track on spotify'
                        >
                          <Image
                            className='img-fluid mb-1'
                            src={SpotifyLogo}
                            width={35}
                            height={10}
                            alt='spotify logo'
                          />
                          <Image
                            className='img-fluid artcover'
                            src={
                              ((
                                result?.album?.images?.[0] ||
                                result?.album?.images?.[1]
                              )?.url ||
                                (result?.images?.[0] || item?.images?.[1])
                                  ?.url) ??
                              MusicNote
                            }
                            width={64}
                            height={64}
                            alt='Track Image'
                          />
                        </Link>
                        <Stack>
                          <p className='fw-light ms-auto mb-0 px-1'>
                            Released: {result?.album?.release_date}
                          </p>
                          <li
                            key={result.id}
                            className='px-1 mt-auto'
                            style={{ fontWeight: '500' }}
                          >
                            {++index}.{' '}
                            {result.artists
                              .map(artist => artist.name)
                              .join(', ')}{' '}
                            — {result.name}
                          </li>
                        </Stack>
                      </Stack>
                    ))}
                  </ol>
                ) : (
                  <p className='text-center text-muted my-3'>
                    No tracks available for your mix.
                  </p>
                )}
              </Modal.Body>
              <Modal.Footer>
                {mixState && (
                  <Button
                    className='btn-aubergine'
                    onClick={() => createMixPlist(mixState?.tracks)}
                  >
                    Add to Library
                  </Button>
                )}
              </Modal.Footer>
            </>
          )}
        </Modal.Dialog>
      </Modal>
    </>
  )
}
