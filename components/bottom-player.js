import FloatingBtns from './floating-btns'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Dropdown from 'react-bootstrap/Dropdown'
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'
import Button from 'react-bootstrap/Button'
import SpotifyLogo from '../public/images/spotify_logo_white.png'
import Link from 'next/link'
import NextImage from 'next/image'
import { useEffect, useState, Fragment, useRef, useContext } from 'react'
import { useSession } from 'next-auth/react'
import { AnalysisContext, ResultsContext } from '../utils/context'
import { resumeTrack, pauseTrack } from '../utils/funcs'

// component for the audio player
export default function BottomPlayer ({
  setShowDisabledToast,
  showPlistToast,
  setShowPlistToast,
  showSongToast,
  setShowSongToast,
  windowSmall,
  timer,
  dominantPitch,
  currPitch
}) {
  const { data: session } = useSession()
  const [state, setState, player] = useContext(AnalysisContext)
  const [, , , setViewState] = useContext(ResultsContext)
  const [playerVolume, setPlayerVolume] = useState(0.8)
  const [addInPlist, setAddInPlist] = useState(true)
  const [playerSize, setPlayerSize] = useState(0)
  const bottomPlayerRef = useRef(null)

  function skipStart () {
    if (player.current) {
      player.current.previousTrack()
    }
  }

  function skipEnd () {
    if (player.current) {
      player.current.nextTrack()
    }
  }

  function popPlist () {
    fetch('/api/v1/me/playlists?limit=50', {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`
      }
    })
      .then(e => e.json())
      .then(data => {
        setState(prevState => ({
          ...prevState,
          fChartData: {
            ...prevState.fChartData,
            playlists: data
          }
        }))
      })
      .catch(error => {
        console.log(error)
      })
  } // show playlists in dropdown

  function addTrack2Plist (track, playlist) {
    fetch('/api/v1/me/addToPlist?playlist=' + playlist + '&track=' + track, {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`
      }
    })
      .then(() => {
        setShowPlistToast({ ...showPlistToast, added: true, removed: false })
      })
      .catch(e => console.error(e))
  } // add to playlist functionality

  function removeTrackFromPlist (track, playlist) {
    fetch(
      '/api/v1/me/removeFromPlist?playlist=' + playlist + '&track=' + track,
      {
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`
        }
      }
    )
      .then(() => {
        setShowPlistToast({ ...showPlistToast, added: false, removed: true })
      })
      .catch(e => console.error(e))
  } // remove from playlist functionality

  function saveCurrTrack () {
    fetch('/api/v1/me/saveTrack?id=' + state.spotifyObj.currentTrack, {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`
      }
    })
      .then(e => e.json())
      .then(data => {
        setState(prevState => ({
          ...prevState,
          analysisData: {
            ...prevState.analysisData,
            isTrackSaved: !data[0]
          }
        }))
        if (!data[0])
          setShowSongToast({ ...showSongToast, added: true, removed: false })
        else setShowSongToast({ ...showSongToast, added: false, removed: true })
      })
      .catch(e => console.error(e))
  } // save track functionality

  function getMoodString (valence) {
    switch (true) {
      case valence <= 0.25:
        return 'Melancholy'
      case valence <= 0.5:
        return 'Restless'
      case valence <= 0.75:
        return 'Warm'
      case valence <= 1:
        return 'Vibrant'
      default:
        return ''
    }
  }

  useEffect(() => {
    if (player.current) player.current.setVolume(playerVolume)
  }, [playerVolume])

  useEffect(() => {
    if (playerSize > 1) setPlayerSize(0)
  }, [playerSize])

  return (
    <>
      <div
        className='overflow-scroll fixed-bottom mh-100'
        ref={bottomPlayerRef}
        style={{
          '--bottom-player-bg':
            'rgb(' +
            state.artCover.color?.rgbMuted[0] +
            ', ' +
            state.artCover.color?.rgbMuted[1] +
            ', ' +
            state.artCover.color?.rgbMuted[2] +
            ')'
        }}
      >
        <FloatingBtns
          alt
          playerSize={playerSize}
          setPlayerSize={setPlayerSize}
        />
        <Container
          id='bottom-player'
          className='pb-4 pb-lg-2 text-center text-light'
          fluid
        >
          {playerSize != 0 ? (
            <Row
              className='mt-2 align-items-center justify-content-lg-between justify-content-center gap-lg-0 gap-2'
              style={{
                '--range-bg':
                  'rgba(' +
                  state.artCover.color?.rgbLightVibrant[0] +
                  ', ' +
                  state.artCover.color?.rgbLightVibrant[1] +
                  ', ' +
                  state.artCover.color?.rgbLightVibrant[2] +
                  ', 1)'
              }}
            >
              <Col>
                <div className='d-flex flex-column align-items-center align-items-lg-start gap-2'>
                  <div className='d-flex align-items-end'>
                    <Link
                      className='d-flex align-items-center align-items-lg-start flex-column col-auto'
                      href={state.artCover.link ?? 'https://www.spotify.com'}
                      target='_blank'
                      rel='noreferrer'
                      aria-label='Go to album on spotify'
                    >
                      <NextImage
                        className='img-fluid mb-1'
                        id='spotiflogo'
                        src={SpotifyLogo}
                        width={70}
                        alt='spotify logo'
                      />
                      {state.artCover.image && (
                        <NextImage
                          id='artcover'
                          className='img-fluid'
                          src={state.artCover.image}
                          width={128}
                          height={128}
                          alt='cover'
                          priority
                        />
                      )}
                    </Link>
                    <Container className='d-flex flex-column justify-content-end gap-2'>
                      <div className='track-description text-start text-white'>
                        <div>{state.spotifyObj.currentTrackInfo?.name}</div>
                        <div className='text-white-50'>
                          {state.spotifyObj.currentTrackInfo?.artists
                            .map(eachArtist => eachArtist.name)
                            .join(', ')}
                        </div>
                        <div className='text-white-50'>
                          {state.spotifyObj.currentTrackInfo?.album.album_type +
                            ': ' +
                            state.spotifyObj.currentTrackInfo?.album.name}
                        </div>
                      </div>
                      <ButtonGroup size='sm'>
                        <Button
                          size='sm'
                          variant='dark'
                          id='showSimBtn'
                          onClick={() =>
                            setViewState(prevState => ({
                              ...prevState,
                              showSim: true
                            }))
                          }
                        >
                          Show similar
                        </Button>
                        <Dropdown
                          as={ButtonGroup}
                          drop={!windowSmall ? 'end' : 'down-centered'}
                          onClick={popPlist}
                          className='flex-grow-1'
                        >
                          <Dropdown.Toggle
                            variant='dark'
                            size='sm'
                            id='add2PlistBtn'
                          >
                            <svg
                              xmlns='http://www.w3.org/2000/svg'
                              width='16'
                              height='16'
                              fill='currentColor'
                              className='bi bi-plus-slash-minus'
                              viewBox='0 0 16 16'
                            >
                              <path d='m1.854 14.854 13-13a.5.5 0 0 0-.708-.708l-13 13a.5.5 0 0 0 .708.708ZM4 1a.5.5 0 0 1 .5.5v2h2a.5.5 0 0 1 0 1h-2v2a.5.5 0 0 1-1 0v-2h-2a.5.5 0 0 1 0-1h2v-2A.5.5 0 0 1 4 1Zm5 11a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5A.5.5 0 0 1 9 12Z' />
                            </svg>{' '}
                            Playlist
                          </Dropdown.Toggle>
                          <Dropdown.Menu
                            className='text-center'
                            id='plistOptions'
                          >
                            <Dropdown.Header
                              onClick={() => setAddInPlist(!addInPlist)}
                              id='addInPlistHeader'
                            >
                              {addInPlist ? 'Add to' : 'Remove from'}
                            </Dropdown.Header>
                            <Dropdown.Divider />
                            {state.fChartData?.playlists?.items?.length ===
                            0 ? (
                              <Dropdown.Item disabled>
                                Nothing found
                              </Dropdown.Item>
                            ) : (
                              state.fChartData?.playlists?.items?.map(
                                (result, index) =>
                                  result.owner.id ===
                                    state.profileInfo.currentUser ||
                                  result.collaborative === true ? (
                                    <Dropdown.Item
                                      key={result.id}
                                      onClick={() => {
                                        addInPlist
                                          ? addTrack2Plist(
                                              state.spotifyObj.currentTrack,
                                              result.id
                                            )
                                          : removeTrackFromPlist(
                                              state.spotifyObj.currentTrack,
                                              result.id
                                            )
                                      }}
                                    >
                                      {result.name}
                                    </Dropdown.Item>
                                  ) : (
                                    <Fragment key={index}></Fragment>
                                  )
                              )
                            )}
                          </Dropdown.Menu>
                        </Dropdown>
                      </ButtonGroup>
                    </Container>
                  </div>
                </div>
              </Col>
              <Col lg='4'>
                <Row className='my-2'>
                  <Col xs='auto'>
                    {((timer.progress % 60000) / 1000).toFixed(0) == 60
                      ? Math.floor(timer.progress / 60000) + 1 + ':00'
                      : Math.floor(timer.progress / 60000) +
                        ':' +
                        (((timer.progress % 60000) / 1000).toFixed(0) < 10
                          ? '0'
                          : '') +
                        ((timer.progress % 60000) / 1000).toFixed(0)}
                  </Col>
                  <Col className='d-flex align-items-center my-auto px-0'>
                    <Form.Range
                      min='0'
                      max='100'
                      className='inputRange'
                      id='progress-range'
                      value={(timer.progress / timer.duration) * 100}
                      step={(1000 / timer.duration) * 100}
                      onChange={event => {
                        state.profileInfo.subscription !== 'free'
                          ? player.current
                              .seek(
                                (event?.target.value / 100) * timer.duration
                              )
                              .catch(e => console.log(e))
                          : setShowDisabledToast(true)
                      }}
                      style={{
                        backgroundSize:
                          ((timer.progress / timer.duration) * 100 * 100) /
                            100 +
                          '% 100%'
                      }}
                    />
                  </Col>
                  <Col xs='auto'>
                    {~~(((timer.duration / 1000) % 3600) / 60) +
                      ':' +
                      (~~(timer.duration / 1000) % 60 < 10 ? '0' : '') +
                      (~~(timer.duration / 1000) % 60)}
                  </Col>
                </Row>
                <Container fluid className='d-flex justify-content-center'>
                  <Row className='flex-nowrap player-btn align-items-center gap-4'>
                    <Button
                      as={Col}
                      className='player-btn-bg-lighten skip-btn bi bi-skip-start-fill'
                      variant='light'
                      id='skip-back-btn'
                      onClick={() => {
                        state.profileInfo.subscription !== 'free'
                          ? skipStart()
                          : setShowDisabledToast(true)
                      }}
                    />
                    <Button
                      as={Col}
                      className={
                        (state.isPaused ? 'd-block' : 'd-none') +
                        ' player-btn-bg-lighten bi bi-play-circle-fill'
                      }
                      variant='light'
                      id='resume-btn'
                      onClick={() => {
                        state.profileInfo.subscription !== 'free'
                          ? resumeTrack(player, setState)
                          : setShowDisabledToast(true)
                      }}
                    />
                    <Button
                      as={Col}
                      className={
                        (state.isPaused ? 'd-none' : 'd-block') +
                        ' player-btn-bg-lighten bi bi-pause-circle-fill'
                      }
                      variant='light'
                      id='pause-btn'
                      onClick={() => {
                        state.profileInfo.subscription !== 'free'
                          ? pauseTrack(player, setState)
                          : setShowDisabledToast(true)
                      }}
                    />
                    <Button
                      as={Col}
                      className='player-btn-bg-lighten skip-btn bi bi-skip-end-fill'
                      variant='light'
                      id='skip-end-btn'
                      onClick={() => {
                        state.profileInfo.subscription !== 'free'
                          ? skipEnd()
                          : setShowDisabledToast(true)
                      }}
                    />
                  </Row>
                </Container>
              </Col>
              <Col className='d-flex gap-4 flex-column'>
                <Row className='justify-content-lg-end align-items-center justify-content-center'>
                  <Button
                    as={Col}
                    xs='auto'
                    id='save-track-btn'
                    onClick={saveCurrTrack}
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='35'
                      viewBox='0 0 150 150'
                    >
                      <path
                        fill={state.analysisData.isTrackSaved ? '#fff' : 'none'}
                        stroke='#000'
                        strokeWidth={5}
                        d='M125.784 35.037c-12.745-12.745-32.798-13.669-46.661-2.138-.017.014-1.805 
                  1.482-4.123 1.482-2.377 0-4.073-1.44-4.14-1.496-13.846-11.517-33.9-10.593-46.644 
                  2.152-6.547 6.546-10.154 15.25-10.154 24.51 0 9.261 3.607 17.966 10.03 
                  24.376l40.216 47.083A14.044 14.044 0 0 0 75 135.938c4.12 0 8.016-1.798 
                  10.692-4.929l40.09-46.948c13.519-13.516 13.519-35.508.002-49.024Zm-3.438 45.844'
                      />
                    </svg>
                  </Button>
                  <Col className='mx-2 bg-dark' xs='auto' id='BPM'>
                    {Math.round(state.featuresData?.tempo) + ' BPM'}
                  </Col>
                  <InputGroup
                    as={Col}
                    xs='auto'
                    className='flex-nowrap gap-2 align-items-center w-50 ps-0'
                    id='volume-div'
                  >
                    <Form.Label className='my-auto'>
                      <i
                        className={
                          'bi bi-volume-' +
                          (playerVolume >= 0.7
                            ? 'up'
                            : playerVolume > 0
                            ? 'down'
                            : 'mute') +
                          '-fill'
                        }
                      />
                    </Form.Label>
                    <Form.Range
                      min='0'
                      max='100'
                      className='inputRange'
                      id='volume-range'
                      defaultValue={playerVolume * 100}
                      onChange={event => {
                        state.profileInfo.subscription !== 'free'
                          ? setPlayerVolume(event?.target.value / 100)
                          : setShowDisabledToast(true)
                      }}
                      style={{
                        backgroundSize:
                          (playerVolume * 100 * 100) / 100 + '% 100%'
                      }}
                    />
                  </InputGroup>
                </Row>
                <Row className='justify-content-lg-end justify-content-center gap-lg-0 gap-2'>
                  <Col xs='auto'>
                    <div>Beats per bar</div>
                    <div>{state.featuresData?.time_signature}</div>
                  </Col>
                  <Col xs='auto'>
                    <div>Key</div>
                    <div>
                      {`${state.featuresData?.key} ${
                        state.featuresData?.mode == 1 ? ' Major' : ' Minor'
                      }`}
                    </div>
                  </Col>
                  <Col xs='auto'>
                    <div>Pitch</div>
                    <div
                      style={{
                        backgroundColor: currPitch
                      }}
                      className='fw-bold text-black px-lg-2 px-4 border border-black'
                    >
                      {dominantPitch ? ' ' + dominantPitch : ''}
                    </div>
                  </Col>
                  <Col xs='auto'>
                    <div>Mood</div>
                    <div>{getMoodString(state.featuresData?.valence)}</div>
                  </Col>
                  <Col xs='auto'>
                    <div>Type</div>
                    <div>
                      {state.featuresData?.instrumentalness >= 0.7
                        ? 'Instrumental'
                        : 'Vocal'}
                    </div>
                  </Col>
                </Row>
              </Col>
            </Row>
          ) : (
            <Row
              style={{
                '--range-bg':
                  'rgba(' +
                  state.artCover.color?.rgbLightVibrant[0] +
                  ', ' +
                  state.artCover.color?.rgbLightVibrant[1] +
                  ', ' +
                  state.artCover.color?.rgbLightVibrant[2] +
                  ', 1)'
              }}
            >
              <Col>
                <div className='d-flex mt-2 flex-column align-items-start gap-2'>
                  <Container fluid className='d-flex align-items-end px-0'>
                    <Link
                      className='d-flex align-items-center align-items-lg-start flex-column col-auto'
                      href={state.artCover.link ?? 'https://www.spotify.com'}
                      target='_blank'
                      rel='noreferrer'
                      aria-label='Go to album on spotify'
                    >
                      <NextImage
                        className='img-fluid mb-1'
                        id='spotiflogo'
                        src={SpotifyLogo}
                        width={35}
                        alt='spotify logo'
                      />
                      {state.artCover.image && (
                        <NextImage
                          id='artcover'
                          className='img-fluid'
                          src={state.artCover.image}
                          width={64}
                          height={64}
                          alt='cover'
                          priority
                        />
                      )}
                    </Link>
                    <Container
                      fluid
                      className='d-flex flex-column justify-content-end gap-2'
                    >
                      <div className='track-description text-start text-white'>
                        <div>{state.spotifyObj.currentTrackInfo?.name}</div>
                        <div className='text-white-50'>
                          {state.spotifyObj.currentTrackInfo?.artists
                            .map(eachArtist => eachArtist.name)
                            .join(', ')}
                        </div>
                      </div>
                    </Container>
                    <Col className='flex-nowrap player-btn align-items-center'>
                      <Button
                        className={
                          (state.isPaused ? 'd-block' : 'd-none') +
                          ' player-btn-bg-lighten bi bi-play-fill'
                        }
                        variant='light'
                        id='resume-btn'
                        onClick={() => {
                          state.profileInfo.subscription !== 'free'
                            ? resumeTrack(player, setState)
                            : setShowDisabledToast(true)
                        }}
                        style={{ fontSize: '3rem' }}
                      />
                      <Button
                        className={
                          (state.isPaused ? 'd-none' : 'd-block') +
                          ' player-btn-bg-lighten bi bi-pause-fill'
                        }
                        variant='light'
                        id='pause-btn'
                        onClick={() => {
                          state.profileInfo.subscription !== 'free'
                            ? pauseTrack(player, setState)
                            : setShowDisabledToast(true)
                        }}
                        style={{ fontSize: '3rem' }}
                      />
                    </Col>
                  </Container>
                </div>
                <Row className='mt-2'>
                  <Col xs='auto'>
                    {((timer.progress % 60000) / 1000).toFixed(0) == 60
                      ? Math.floor(timer.progress / 60000) + 1 + ':00'
                      : Math.floor(timer.progress / 60000) +
                        ':' +
                        (((timer.progress % 60000) / 1000).toFixed(0) < 10
                          ? '0'
                          : '') +
                        ((timer.progress % 60000) / 1000).toFixed(0)}
                  </Col>
                  <Col className='d-flex align-items-center my-auto px-0'>
                    <Form.Range
                      min='0'
                      max='100'
                      className='inputRange'
                      id='progress-range'
                      value={(timer.progress / timer.duration) * 100}
                      step={(1000 / timer.duration) * 100}
                      onChange={event => {
                        state.profileInfo.subscription !== 'free'
                          ? player.current
                              .seek(
                                (event?.target.value / 100) * timer.duration
                              )
                              .catch(e => console.log(e))
                          : setShowDisabledToast(true)
                      }}
                      style={{
                        backgroundSize:
                          ((timer.progress / timer.duration) * 100 * 100) /
                            100 +
                          '% 100%'
                      }}
                    />
                  </Col>
                  <Col xs='auto'>
                    {~~(((timer.duration / 1000) % 3600) / 60) +
                      ':' +
                      (~~(timer.duration / 1000) % 60 < 10 ? '0' : '') +
                      (~~(timer.duration / 1000) % 60)}
                  </Col>
                </Row>
              </Col>
            </Row>
          )}
        </Container>
      </div>
    </>
  )
}
