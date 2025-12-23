import Container from 'react-bootstrap/Container'
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import NavDropdown from 'react-bootstrap/NavDropdown'
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'
import Button from 'react-bootstrap/Button'
import LogoPic from '../public/images/melodera-logo.png'
import DefaultPic from '../public/images/default_pic.png'
import Image from 'next/image'
import { useState, useRef, useEffect, useContext } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { AnalysisContext } from '../utils/context'
import {
  resumeTrack,
  pauseTrack,
  getTopTracks,
  getTopArtists
} from '../utils/funcs'

// component for navigation bar
export default function NavBar () {
  const { data: session } = useSession()
  const [state, setState, player] = useContext(AnalysisContext)
  const [navState, setNavState] = useState({
    isExpanded: false,
    inputValue: ''
  })
  const inputSrchRef = useRef(null)

  function toHome () {
    window.scroll({ top: 0, behavior: 'auto' })
    setState(prevState => ({
      ...prevState,
      active: 'home',
      renderType: {
        home: true,
        search: false,
        library: false,
        topTracks: false,
        topArtists: false
      }
    }))
  }

  function getMyLibrary () {
    setState(prevState => ({
      ...prevState,
      active: 'librBtn',
      renderType: {
        home: false,
        search: false,
        library: true,
        topTracks: false,
        topArtists: false
      }
    }))
  }

  function handleSubmit (e) {
    e.preventDefault()
    setState(prevState => ({
      ...prevState,
      active: 'search',
      timeframe: '',
      searchValue: navState.inputValue.trim(),
      renderType: {
        home: false,
        search: true,
        library: false,
        topTracks: false,
        topArtists: false
      }
    }))
  }

  useEffect(() => {
    const profile = session?.user?.profile
    if (profile)
      setState(prevState => ({
        ...prevState,
        profileInfo: {
          ...prevState.profileInfo,
          profPic: profile?.images?.[0]?.url,
          displayName: profile.display_name,
          userCountry: profile.country,
          currentUser: profile.id,
          subscription: profile.product,
          followersCount: profile.followersTotal
        }
      }))
  }, [session])

  useEffect(() => {
    if (state.profileInfo.subscription !== 'free') {
      // add functionality to use spacebar for play/pause
      const handleKeyDown = function (event) {
        if (document.activeElement !== inputSrchRef.current) {
          if (event.keyCode === 32 && state.isPaused) {
            resumeTrack(player, setState)
          } else if (event.keyCode === 32 && !state.isPaused) {
            pauseTrack(player, setState)
          }
        }
      }

      window.addEventListener('keydown', handleKeyDown)

      return () => {
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [state.isPaused, state.profileInfo.subscription])

  return (
    <>
      <Navbar
        sticky='top'
        expand='sm'
        id='topNav'
        variant='dark'
        onToggle={() =>
          setNavState(prevState => ({
            ...prevState,
            isExpanded: !prevState.isExpanded
          }))
        }
      >
        <Container fluid className='gap-2' id='navContainer'>
          <div id='homeAndTog'>
            <Nav.Item
              className={state.active === 'home' ? 'active' : ''}
              id='homeBtn'
              onClick={toHome}
            >
              <Image className='logo-nav' src={LogoPic} alt='logo' width={50} />
            </Nav.Item>
            <Navbar.Toggle id='nav-tog' aria-controls='navbarCollapse1'>
              <i className='bi bi-three-dots-vertical'></i>
            </Navbar.Toggle>
            <InputGroup
              className='h-50'
              id='srchAndForm'
              as={Form}
              onSubmit={e => handleSubmit(e)}
              required
            >
              <Form.Control
                type='text'
                id='inputSrch'
                placeholder='Search songs, artists...'
                aria-label='Search songs, artists...'
                aria-describedby='searchBtn'
                value={navState.inputValue}
                onChange={e =>
                  setNavState(prevState => ({
                    ...prevState,
                    inputValue: e.target.value
                  }))
                }
                ref={inputSrchRef}
                required
              />
              <Button
                variant='secondary'
                id='searchBtn'
                type='submit'
                aria-label='search button'
              >
                <i className='bi bi-search'></i>
              </Button>
            </InputGroup>
          </div>
          <Navbar.Collapse id='navbarCollapse1'>
            <Nav id='navItems'>
              <Nav.Item
                as={Nav.Link}
                className='text-nowrap'
                active={state.active === 'librBtn'}
                onClick={getMyLibrary}
              >
                Library
              </Nav.Item>
              <NavDropdown
                className='text-center'
                title='Top Listens'
                active={state.active === 'topOptionsDropdown'}
                id='topOptionsDropdown'
                menuRole='menu'
                onClick={() =>
                  setState(prevState => ({
                    ...prevState,
                    active: 'topOptionsDropdown'
                  }))
                }
              >
                <NavDropdown.Item
                  className='text-center'
                  id='top-song-nav'
                  onClick={() => getTopTracks(setState, 'short_term')}
                >
                  Songs
                </NavDropdown.Item>
                <NavDropdown.Item
                  className='text-center'
                  id='top-artist-nav'
                  onClick={() => getTopArtists(setState, 'short_term')}
                >
                  Artists
                </NavDropdown.Item>
              </NavDropdown>
              {session && (
                <NavDropdown
                  className='position-relative'
                  title={
                    <Image
                      id='profpic'
                      src={state.profileInfo.profPic ?? DefaultPic}
                      alt='prof pic'
                      width={32}
                      height={32}
                    />
                  }
                  active={state.active === 'profDropdown'}
                  id='profDropdown'
                  menuRole='menu'
                  align='end'
                  onClick={() =>
                    setState(prevState => ({
                      ...prevState,
                      active: 'profDropdown'
                    }))
                  }
                >
                  <NavDropdown.Item
                    className='text-center'
                    id='profile-btn'
                    onClick={() =>
                      document.getElementById('profModal-trigger')?.click()
                    }
                  >
                    Profile
                  </NavDropdown.Item>
                  <NavDropdown.Item
                    className='text-center'
                    id='my-mix-btn'
                    onClick={() =>
                      setState(prevState => ({
                        ...prevState,
                        showMix: true
                      }))
                    }
                  >
                    My Mix
                  </NavDropdown.Item>
                  <NavDropdown.Item
                    className='text-center'
                    id='vis-set-btn'
                    data-bs-toggle='modal'
                    data-bs-target='#visModal'
                  >
                    Guide / Visualizer
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item
                    className='text-center'
                    id='logout-btn'
                    onClick={() => {
                      player.current?.disconnect()
                      signOut({ callbackUrl: '/' })
                    }}
                  >
                    Exit
                  </NavDropdown.Item>
                </NavDropdown>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  )
}
