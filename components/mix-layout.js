import MusicNote from '../public/images/music-note-beamed.svg'
import SpotifyLogo from '../public/images/spotify_logo_black.png'
import Link from 'next/link'
import Image from 'next/image'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import Toast from 'react-bootstrap/Toast'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import { useSession } from 'next-auth/react'
import { useState, useContext } from 'react'
import { playTrack, getAnalysis, getFeatures } from '../utils/funcs'
import { AnalysisContext } from '../utils/context'

// component for 'My Mix' modal
export default function MixLayout () {
  const { data: session } = useSession()
  const [state, setState, player, deviceId] = useContext(AnalysisContext)
  const [mixState, setMixState] = useState(null)
  const [showToast, setShowToast] = useState(false)

  function fetchMix () {
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
  }
  function createMixPlist (tracks) {
    const trackUris = tracks?.map(track => `spotify:track:${track.id}`)
    const date = new Date()
    fetch(
      `/api/v1/me/createPlist?timestamp=${date.toLocaleString()}&tracks=${trackUris}`,
      {
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`
        }
      }
    )
      .then(() => {
        setShowToast(true)
      })
      .catch(e => console.error(e))
  }

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
            <div className='spinner-border' role='status' />
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
              <Modal.Body id='mixModalBody'>
                <Container>
                  <Row>
                    <ol
                      className='addResultText'
                      style={{
                        listStyle: 'none',
                        maxHeight: '50vh'
                      }}
                    >
                      {mixState?.tracks?.map((result, index) => (
                        <Row key={`mixItem${index}`}>
                          <Link
                            className='d-flex align-items-center align-items-lg-start flex-column col-auto'
                            href={
                              result.external_urls?.spotify ??
                              'https://www.spotify.com'
                            }
                            target='_blank'
                            rel='noreferrer'
                            aria-label='Go to track on spotify'
                          >
                            <Image
                              className='img-fluid mb-1'
                              src={SpotifyLogo}
                              width={70}
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
                          <Col className='d-flex align-items-center'>
                            <li
                              onClick={() => {
                                playTrack(
                                  result.id,
                                  player,
                                  deviceId,
                                  session,
                                  state
                                )
                                getFeatures(result.id, session, setState)
                                getAnalysis(result.id, session, setState)
                              }}
                              key={result.id}
                              className='addResultItem p-2'
                            >
                              {++index}.{' '}
                              {result.artists
                                .map(artist => artist.name)
                                .join(', ')}{' '}
                              — {result.name}
                            </li>
                          </Col>
                        </Row>
                      ))}
                    </ol>
                  </Row>
                </Container>
              </Modal.Body>
              <Modal.Footer>
                {mixState && (
                  <Button
                    variant='primary'
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
