import Image from 'next/image'
import Container from 'react-bootstrap/Container'
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import NavDropdown from 'react-bootstrap/NavDropdown'
import LogoPic from '../public/images/melodera-logo.png'
import DefaultPic from '../public/images/default_pic.png'
import { useState, useRef, useEffect } from 'react'
import { signOut } from 'next-auth/react'

export default function NavBar ({
  states,
  profPic,
  subscription,
  player,
  funcs
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputSrchRef = useRef(null)

  function clearOut () {
    player.current?.disconnect()
    localStorage.clear()
  }

  function toHome () {
    states.setActive('home')
    states.setRenderType(prev => ({
      ...prev,
      home: true,
      search: false,
      library: false,
      topTracks: false,
      topArtists: false
    }))
  }

  function getMyLibrary () {
    states.setActive('librBtn')
    states.setRenderType(prev => ({
      ...prev,
      home: false,
      search: false,
      library: true,
      topTracks: false,
      topArtists: false
    }))
  }

  function getTopTracks (timeframe) {
    states.setTimeframe(timeframe)
    states.setRenderType(prev => ({
      ...prev,
      home: false,
      search: false,
      library: false,
      topTracks: true,
      topArtists: false
    }))
  }

  function getTopArtists (timeframe) {
    states.setTimeframe(timeframe)
    states.setRenderType(prev => ({
      ...prev,
      home: false,
      search: false,
      library: false,
      topTracks: false,
      topArtists: true
    }))
  }

  function handleSubmit (e) {
    e.preventDefault()
    states.setActive('search')
    states.setTimeframe('')
    states.setSearchValue(inputValue.trim())
    states.setRenderType(prev => ({
      ...prev,
      home: false,
      search: true,
      library: false,
      topTracks: false,
      topArtists: false
    }))
  }

  useEffect(() => {
    if (player.current && subscription !== 'free') {
      // add functionality to use spacebar for play/pause
      window.onkeydown = function (event) {
        if (document.activeElement !== inputSrchRef.current) {
          if (event.keyCode === 32 && states.isPaused) {
            funcs.resumeVid()
          } else if (event.keyCode === 32 && !states.isPaused) {
            funcs.pauseVid()
          }
        }
      }
    }
  }, [states.isPaused, subscription])

  return (
    <>
      <Navbar
        className='rounded'
        sticky='top'
        expand='sm'
        id='topNav'
        onToggle={() => setIsExpanded(!isExpanded)}
      >
        <Container fluid id='navContainer'>
          <div id='homeAndTog'>
            <Navbar.Brand
              className={states.active === 'home' ? 'active' : ''}
              id='homeBtn'
              onClick={toHome}
            >
              <Image
                className='logo-nav'
                src={LogoPic}
                alt='logo'
                width={40}
                height={45}
              />
            </Navbar.Brand>
            <Navbar.Toggle id='nav-tog' aria-controls='navbarCollapse1'>
              {isExpanded ? (
                <i className='bi bi-toggle-on'></i>
              ) : (
                <i className='bi bi-toggle-off'></i>
              )}
            </Navbar.Toggle>
          </div>
          <div className='input-group' id='srchAndForm'>
            <form
              className='d-flex'
              id='searchTrack'
              onSubmit={e => handleSubmit(e)}
            >
              <div className='input-group'>
                <input
                  type='text'
                  className='form-control'
                  id='inputSrch'
                  placeholder='Search songs, artists... '
                  aria-label='SearchTerm'
                  aria-describedby='searchBtn'
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  ref={inputSrchRef}
                  required
                />
                <button
                  className='btn btn-secondary'
                  id='searchBtn'
                  type='submit'
                  aria-label='search button'
                >
                  <i className='bi bi-search'></i>
                </button>
              </div>
            </form>
          </div>

          <Navbar.Collapse id='navbarCollapse1'>
            <Nav id='navItems'>
              <Nav.Item
                as={Nav.Link}
                className='text-nowrap'
                active={states.active === 'librBtn'}
                onClick={getMyLibrary}
              >
                Library
              </Nav.Item>
              <NavDropdown
                title='Top Listens'
                active={states.active === 'topOptionsDropdown'}
                id='topOptionsDropdown'
                menuRole='menu'
                onClick={() => states.setActive('topOptionsDropdown')}
              >
                <h6 className='dropdown-header'>Songs</h6>
                <NavDropdown.Item
                  id='track-short'
                  onClick={() => getTopTracks('short_term')}
                >
                  Last 4 weeks
                </NavDropdown.Item>
                <NavDropdown.Item
                  id='track-med'
                  onClick={() => getTopTracks('medium_term')}
                >
                  Last 6 months
                </NavDropdown.Item>
                <NavDropdown.Item
                  id='track-long'
                  onClick={() => getTopTracks('long_term')}
                >
                  All time
                </NavDropdown.Item>

                <hr className='dropdown-divider' />
                <h6 className='dropdown-header'>Artists</h6>
                <NavDropdown.Item
                  id='artist-short'
                  onClick={() => getTopArtists('short_term')}
                >
                  Last 4 weeks
                </NavDropdown.Item>

                <NavDropdown.Item
                  id='artist-med'
                  onClick={() => getTopArtists('medium_term')}
                >
                  Last 6 months
                </NavDropdown.Item>

                <NavDropdown.Item
                  id='artist-long'
                  onClick={() => getTopArtists('long_term')}
                >
                  All time
                </NavDropdown.Item>
              </NavDropdown>
              <NavDropdown
                className='position-relative'
                title={
                  <Image
                    id='profpic'
                    src={profPic !== '' ? profPic : DefaultPic}
                    alt='prof pic'
                    width={32}
                    height={32}
                  />
                }
                active={states.active === 'profDropdown'}
                id='profDropdown'
                menuRole='menu'
                align='end'
                onClick={() => states.setActive('profDropdown')}
              >
                <NavDropdown.Item
                  id='profile-btn'
                  data-bs-toggle='modal'
                  data-bs-target='#profModal'
                >
                  Profile
                </NavDropdown.Item>
                <NavDropdown.Item
                  id='vis-set-btn'
                  data-bs-toggle='modal'
                  data-bs-target='#visModal'
                >
                  Visualizer / Guide
                </NavDropdown.Item>
                <NavDropdown.Item
                  id='logout-btn'
                  onClick={() => {
                    clearOut()
                    signOut()
                  }}
                >
                  Exit
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  )
}
