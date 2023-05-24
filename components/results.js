import { useEffect, useRef, useState, Fragment } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Container from 'react-bootstrap/Container'
import SpotifyLogo from '../public/images/spotify_logo.png'
import MusicNote from '../public/images/music-note-beamed.svg'
import AddResult from './add-result'
import SimilarSongs from './similar-songs'
import Button from 'react-bootstrap/Button'
import Collapse from 'react-bootstrap/Collapse'

// component for results (tracks, artists, albums, playlists)
export default function Results ({
  type,
  userCountry,
  token,
  state,
  funcs,
  spotifyObj
}) {
  const [data, setData] = useState(null)
  const [showSim, setShowSim] = useState(false)
  const tframesRef = useRef(null)
  const [tracksOffset, setTracksOffset] = useState(0)
  const [artistsOffset, setArtistsOffset] = useState(0)
  const [albumsOffset, setAlbumsOffset] = useState(0)
  const [plistsOffset, setPlistsOffset] = useState(0)
  const [showSimLimit, setShowSimLimit] = useState(4)
  const [afterArtistOset, setAfterArtistOset] = useState('')
  const [combinedResults, setCombinedResults] = useState([])
  const [showTFrameItems, setShowTFrameItems] = useState({
    topTracks: 0,
    topArtists: 0
  })
  const [topTracksOffset, setTopTracksOffset] = useState({})
  const [topArtistsOffset, setTopArtistsOffset] = useState({})
  const [toggledAdd, setToggledAdd] = useState({})
  const [isCollapsed, setIsCollapsed] = useState({
    topTracks: false,
    topArtists: false,
    featPlists: false,
    newRels: false,
    tracks: false,
    artists: false,
    albums: false,
    plists: false,
    recommendations: false
  })
  const [isLibrary, setIsLibrary] = useState(null)

  function scrollToTframe (timeframe) {
    const map = getMap()
    const node = map.get(timeframe)
    node?.scrollIntoView({
      behavior: 'smooth'
    })
  }
  function getMap () {
    if (!tframesRef.current) {
      // Initialize the Map on first usage.
      tframesRef.current = new Map()
    }
    return tframesRef.current
  }

  function showResults (data, isLibrary) {
    let trackArr = []
    let artistArr = []
    let albumArr = []
    let plistArr = []
    for (const key in data) {
      if (key == 'tracks') {
        trackArr.push(
          data.tracks.items.map(result => (
            <div
              className='text-white-top'
              onClick={() => {
                funcs.playVid(isLibrary ? result.track.id : result.id)
                funcs.getAnalysis(isLibrary ? result.track.id : result.id)
                funcs.getFeatures(isLibrary ? result.track.id : result.id)
              }}
              key={isLibrary ? result.track?.id : result.id}
            >
              <div>
                <Image
                  style={{
                    display: 'flex',
                    margin: '10px auto 0px auto'
                  }}
                  src={
                    isLibrary
                      ? result.track.album.images.length === 0
                        ? MusicNote
                        : result.track.album.images[2].url
                      : result.album.images.length === 0
                      ? MusicNote
                      : result.album.images[2].url
                  }
                  width={64}
                  height={64}
                  alt='Song Pic'
                />
                <p className='resultText'>
                  {isLibrary
                    ? result.track.artists
                        .map(eachArtist => eachArtist.name)
                        .join(', ')
                    : result.artists
                        .map(eachArtist => eachArtist.name)
                        .join(', ')}{' '}
                  — {isLibrary ? result.track.name : result.name}
                </p>
                {isLibrary ? (
                  result.track.album.release_date.trim() !== '' ? (
                    <>
                      <p className='resultText fw-light fs-6'>
                        Released: {result.track.album.release_date}
                      </p>
                      <span onClick={e => e.stopPropagation()}>
                        <Link
                          className='btn btn-sm spotifyLink'
                          href={result.track.album.external_urls.spotify}
                          target='_blank'
                          rel='noreferrer'
                        >
                          <Image
                            src={SpotifyLogo}
                            className='img-fluid'
                            width={70}
                            alt='spotify logo'
                          />
                        </Link>
                      </span>
                    </>
                  ) : (
                    <></>
                  )
                ) : result.album.release_date.trim() !== '' ? (
                  <>
                    <p className='resultText fw-light fs-6'>
                      Released: {result.album.release_date}
                    </p>
                    <span onClick={e => e.stopPropagation()}>
                      <Link
                        className='btn btn-sm spotifyLink'
                        href={result.album.external_urls.spotify}
                        target='_blank'
                        rel='noreferrer'
                      >
                        <Image
                          src={SpotifyLogo}
                          className='img-fluid'
                          width={70}
                          alt='spotify logo'
                        />
                      </Link>
                    </span>
                  </>
                ) : (
                  <></>
                )}
              </div>
            </div>
          ))
        )
      } else if (key == 'artists') {
        artistArr.push(
          data.artists.items.map(result => (
            <div
              className='text-white-top'
              onClick={() =>
                setToggledAdd({
                  ...toggledAdd,
                  [result.id]:
                    toggledAdd[result.id] === undefined
                      ? true
                      : !toggledAdd[result.id]
                })
              }
              key={result.id}
            >
              <div>
                <Image
                  style={{
                    display: 'flex',
                    margin: '10px auto 0px auto'
                  }}
                  src={
                    result.images.length === 0
                      ? MusicNote
                      : result.images[2].url
                  }
                  width={64}
                  height={64}
                  alt='Artist Pic'
                />
                <p className='resultText'>{result.name}</p>
                <span onClick={e => e.stopPropagation()}>
                  <a
                    className='btn btn-sm spotifyLink'
                    href={result.external_urls.spotify}
                    target='_blank'
                    rel='noreferrer'
                  >
                    <Image
                      src={SpotifyLogo}
                      className='img-fluid'
                      width={70}
                      alt='spotify logo'
                    />
                  </a>
                </span>
                <AddResult
                  resultId={result.id}
                  categ='artist'
                  userCountry={userCountry}
                  toggledAdd={toggledAdd}
                  token={token}
                  init={funcs}
                />
              </div>
            </div>
          ))
        )
      } else if (key == 'albums') {
        albumArr.push(
          data.albums.items.map(result => (
            <div
              className='text-white-top'
              onClick={() =>
                setToggledAdd({
                  ...toggledAdd,
                  [isLibrary ? result.album.id : result.id]: (
                    isLibrary
                      ? toggledAdd[result.album.id] === undefined
                      : toggledAdd[result.id] === undefined
                  )
                    ? true
                    : !toggledAdd[isLibrary ? result.album.id : result.id]
                })
              }
              key={isLibrary ? result.album.id : result.id}
            >
              <div>
                <Image
                  style={{
                    display: 'flex',
                    margin: '10px auto 0px auto'
                  }}
                  src={
                    isLibrary
                      ? result.album.images.length === 0
                        ? MusicNote
                        : result.album.images[2].url
                      : result.images.length === 0
                      ? MusicNote
                      : result.images[2].url
                  }
                  width={64}
                  height={64}
                  alt='Album Pic'
                />
                <p className='resultText'>
                  {isLibrary
                    ? result.album.artists
                        .map(eachArtist => eachArtist.name)
                        .join(', ')
                    : result.artists
                        .map(eachArtist => eachArtist.name)
                        .join(', ')}{' '}
                  — {isLibrary ? result.album.name : result.name}
                </p>
                {isLibrary ? (
                  result.album.release_date.trim() !== '' ? (
                    <>
                      <p className='resultText fw-light fs-6'>
                        {result.album.album_type}, {result.album.release_date}
                      </p>
                      <span onClick={e => e.stopPropagation()}>
                        <Link
                          className='btn btn-sm spotifyLink'
                          href={result.album.external_urls.spotify}
                          target='_blank'
                          rel='noreferrer'
                        >
                          <Image
                            src={SpotifyLogo}
                            className='img-fluid'
                            width={70}
                            alt='spotify logo'
                          />
                        </Link>
                      </span>
                      <AddResult
                        resultId={isLibrary ? result.album.id : result.id}
                        categ='album'
                        userCountry={userCountry}
                        toggledAdd={toggledAdd}
                        token={token}
                        init={funcs}
                      />
                    </>
                  ) : (
                    <AddResult
                      resultId={isLibrary ? result.album.id : result.id}
                      categ='album'
                      userCountry={userCountry}
                      toggledAdd={toggledAdd}
                      token={token}
                      init={funcs}
                    />
                  )
                ) : result.release_date.trim() !== '' ? (
                  <>
                    <p className='resultText fw-light fs-6'>
                      {result.album_type}, {result.release_date}
                    </p>
                    <span onClick={e => e.stopPropagation()}>
                      <Link
                        className='btn btn-sm spotifyLink'
                        href={result.external_urls.spotify}
                        target='_blank'
                        rel='noreferrer'
                      >
                        <Image
                          src={SpotifyLogo}
                          className='img-fluid'
                          width={70}
                          alt='spotify logo'
                        />
                      </Link>
                    </span>
                    <AddResult
                      resultId={result.id}
                      categ='album'
                      userCountry={userCountry}
                      toggledAdd={toggledAdd}
                      token={token}
                      init={funcs}
                    />
                  </>
                ) : (
                  <AddResult
                    resultId={result.id}
                    categ='album'
                    userCountry={userCountry}
                    toggledAdd={toggledAdd}
                    token={token}
                    init={funcs}
                  />
                )}
              </div>
            </div>
          ))
        )
      } else if (key == 'playlists') {
        plistArr.push(
          data.playlists.items.map(result => (
            <div
              className='text-white-top'
              onClick={() => {
                setToggledAdd({
                  ...toggledAdd,
                  [result.id]:
                    toggledAdd[result.id] === undefined
                      ? true
                      : !toggledAdd[result.id]
                })
              }}
              key={result.id}
            >
              <div>
                <Image
                  style={{
                    display: 'flex',
                    margin: '10px auto 0px auto'
                  }}
                  src={
                    result.images.length === 0
                      ? MusicNote
                      : result.images[0].url
                  }
                  width={64}
                  height={64}
                  alt='Playlist Pic'
                />
                <p className='resultText'>
                  {result.name} — {result.owner.display_name}
                </p>
                <span onClick={e => e.stopPropagation()}>
                  <Link
                    className='btn btn-sm spotifyLink'
                    href={result.external_urls.spotify}
                    target='_blank'
                    rel='noreferrer'
                  >
                    <Image
                      src={SpotifyLogo}
                      className='img-fluid'
                      width={70}
                      alt='spotify logo'
                    />
                  </Link>
                </span>
                <AddResult
                  resultId={result.id}
                  categ='plist'
                  userCountry={userCountry}
                  toggledAdd={toggledAdd}
                  token={token}
                  init={funcs}
                />
              </div>
            </div>
          ))
        )
      }
    }
    if (
      state.timeframe !== '' &&
      !isLibrary &&
      ('topTracks' in data || 'topArtists' in data)
    ) {
      let isTopTracks = 'topTracks' in data
      let tFrameArray = Object.keys(
        isTopTracks ? topTracksOffset : topArtistsOffset
      ).map(timeframe => {
        return (
          `tRange${isTopTracks ? 'Tracks' : 'Artists'}Divider_` +
          timeframe +
          `, top${isTopTracks ? 'Tracks' : 'Artists'}Categ_` +
          timeframe +
          `, moreBtnTop${isTopTracks ? 'Tracks' : 'Artists'}_` +
          timeframe +
          `, ${isTopTracks ? 'track' : 'artist'}_` +
          timeframe
        )
      })
      return (
        <Container
          id={isTopTracks ? 'topTracksContainer' : 'topArtistsContainer'}
          key={isTopTracks ? 'topTracksContainer' : 'topArtistsContainer'}
        >
          <Button
            className={
              'rounded-pill searchCateg' +
              ((
                isTopTracks
                  ? !isCollapsed['topTracks']
                  : !isCollapsed['topArtists']
              )
                ? ' activeCateg'
                : '')
            }
            id={isTopTracks ? 'btnTopTracksCateg' : 'btnTopArtistsCateg'}
            size='lg'
            onClick={() =>
              setIsCollapsed({
                ...isCollapsed,
                [isTopTracks ? 'topTracks' : 'topArtists']:
                  !isCollapsed[isTopTracks ? 'topTracks' : 'topArtists']
              })
            }
            aria-expanded={
              !isCollapsed[isTopTracks ? 'topTracks' : 'topArtists']
            }
            variant='dark'
            aria-controls={tFrameArray}
          >
            {isTopTracks ? 'Top Songs' : 'Top Artists'}
          </Button>
          {combinedResults.map(result => (
            <Collapse
              key={
                isTopTracks
                  ? 'topTracks_' + result.topTracks
                  : 'topArtists_' + result.topArtists
              }
              in={!isCollapsed[isTopTracks ? 'topTracks' : 'topArtists']}
            >
              <div>
                <div
                  className='tFrametitle h4'
                  id={
                    isTopTracks
                      ? 'track_' + result.topTracks
                      : 'artist_' + result.topArtists
                  }
                  ref={node => {
                    const map = getMap()
                    const id = isTopTracks
                      ? 'track_' + result.topTracks
                      : 'artist_' + result.topArtists
                    if (node) {
                      map.set(id, node)
                    } else {
                      map.delete(id)
                    }
                  }}
                >
                  {(isTopTracks ? result.topTracks : result.topArtists) ===
                  'short_term'
                    ? 'Last 4 weeks'
                    : (isTopTracks ? result.topTracks : result.topArtists) ===
                      'medium_term'
                    ? 'Last 6 months'
                    : 'All time'}
                </div>
                <hr
                  id={
                    isTopTracks
                      ? 'tRangeTracksDivider_' + result.topTracks
                      : 'tRangeArtistsDivider_' + result.topArtists
                  }
                />
                <div
                  className='searchedAlt'
                  id={
                    isTopTracks
                      ? 'topTracksCateg_' + result.topTracks
                      : 'topArtistsCateg_' + result.topArtists
                  }
                >
                  {result?.items.map((item, index) => (
                    <div
                      className='text-white-top'
                      onClick={
                        isTopTracks
                          ? () => {
                              funcs.playVid(item.id)
                              funcs.getAnalysis(item.id)
                              funcs.getFeatures(item.id)
                            }
                          : () =>
                              setToggledAdd({
                                ...toggledAdd,
                                [item.id]:
                                  toggledAdd[item.id] === undefined
                                    ? true
                                    : !toggledAdd[item.id]
                              })
                      }
                      key={
                        item.id +
                        '_' +
                        (isTopTracks ? result.topTracks : result.topArtists)
                      }
                    >
                      <div>
                        <Image
                          style={{
                            display: 'flex',
                            margin: '10px auto 0px auto'
                          }}
                          src={
                            isTopTracks
                              ? item.album.images.length === 0
                                ? MusicNote
                                : item.album.images[2].url
                              : item.images.length === 0
                              ? MusicNote
                              : item.images[2].url
                          }
                          width={64}
                          height={64}
                          alt={isTopTracks ? 'Song Pic' : 'Artist Pic'}
                        />
                        <p className='resultText'>
                          {++index}.{' '}
                          {isTopTracks
                            ? item.artists
                                .map(eachArtist => eachArtist.name)
                                .join(', ') + ' —'
                            : ''}{' '}
                          {item.name}
                        </p>
                        {isTopTracks ? (
                          <p className='resultText fw-light fs-6'>
                            Released: {item.album.release_date}
                          </p>
                        ) : (
                          <></>
                        )}
                        <span onClick={e => e.stopPropagation()}>
                          <a
                            className='btn btn-sm spotifyLink'
                            href={item.external_urls.spotify}
                            target='_blank'
                            rel='noreferrer'
                          >
                            <Image
                              src={SpotifyLogo}
                              className='img-fluid'
                              width={70}
                              alt='spotify logo'
                            />
                          </a>
                        </span>
                        <AddResult
                          resultId={item.id}
                          categ={isTopTracks ? 'track' : 'artist'}
                          userCountry={userCountry}
                          toggledAdd={toggledAdd}
                          token={token}
                          init={funcs}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type='button'
                  className='btn moreBtn'
                  id={
                    isTopTracks
                      ? 'moreBtnTopTracks_' + result.topTracks
                      : 'moreBtnTopArtists_' + result.topArtists
                  }
                  onClick={() =>
                    moreBtnResults(
                      isTopTracks
                        ? 'topTracksCateg_' + result.topTracks
                        : 'topArtistsCateg_' + result.topArtists
                    )
                  }
                >
                  See more
                </button>
              </div>
            </Collapse>
          ))}
        </Container>
      )
    } else {
      return (
        <Fragment key={'containDefault4'}>
          <Fragment key={'tracks' + String.valueOf(tracksOffset)}>
            <Button
              className={
                'rounded-pill searchCateg' +
                (!isCollapsed['tracks'] ? ' activeCateg' : '')
              }
              id='btnTracksCateg'
              size='lg'
              onClick={() =>
                setIsCollapsed({
                  ...isCollapsed,
                  ['tracks']: !isCollapsed['tracks']
                })
              }
              aria-expanded={!isCollapsed['tracks']}
              variant='dark'
              aria-controls='tracksCateg, moreBtnTracks'
            >
              Songs
            </Button>
            <Collapse in={!isCollapsed['tracks']}>
              <div>
                <div className='searched' id='tracksCateg'>
                  {trackArr}
                </div>
                <button
                  type='button'
                  className='btn moreBtn'
                  id='moreBtnTracks'
                  onClick={() => moreBtnResults('tracksCateg')}
                >
                  See more
                </button>
              </div>
            </Collapse>
          </Fragment>
          <Fragment key={'artists' + String.valueOf(artistsOffset)}>
            <Button
              className={
                'rounded-pill searchCateg' +
                (isCollapsed['artists'] ? ' activeCateg' : '')
              }
              id='btnArtistsCateg'
              size='lg'
              onClick={() =>
                setIsCollapsed({
                  ...isCollapsed,
                  ['artists']: !isCollapsed['artists']
                })
              }
              aria-expanded={isCollapsed['artists']}
              variant='dark'
              aria-controls='artistsCateg, moreBtnArtists'
            >
              Artists
            </Button>
            <Collapse in={isCollapsed['artists']}>
              <div>
                <div className='searched' id='artistsCateg'>
                  {artistArr}
                </div>
                <button
                  type='button'
                  className='btn moreBtn'
                  id='moreBtnArtists'
                  onClick={() => moreBtnResults('artistsCateg')}
                >
                  See more
                </button>
              </div>
            </Collapse>
          </Fragment>
          <Fragment key={'albums' + String.valueOf(albumsOffset)}>
            <Button
              className={
                'rounded-pill searchCateg' +
                (isCollapsed['albums'] ? ' activeCateg' : '')
              }
              id='btnAlbumsCateg'
              size='lg'
              onClick={() =>
                setIsCollapsed({
                  ...isCollapsed,
                  ['albums']: !isCollapsed['albums']
                })
              }
              aria-expanded={isCollapsed['albums']}
              variant='dark'
              aria-controls='albumsCateg, moreBtnAlbums'
            >
              Albums
            </Button>
            <Collapse in={isCollapsed['albums']}>
              <div>
                <div className='searched' id='albumsCateg'>
                  {albumArr}
                </div>
                <button
                  type='button'
                  className='btn moreBtn'
                  id='moreBtnAlbums'
                  onClick={() => moreBtnResults('albumsCateg')}
                >
                  See more
                </button>
              </div>
            </Collapse>
          </Fragment>
          <Fragment key={'playlists' + String.valueOf(plistsOffset)}>
            <Button
              className={
                'rounded-pill searchCateg' +
                (isCollapsed['plists'] ? ' activeCateg' : '')
              }
              id='btnPlistsCateg'
              size='lg'
              onClick={() =>
                setIsCollapsed({
                  ...isCollapsed,
                  ['plists']: !isCollapsed['plists']
                })
              }
              aria-expanded={isCollapsed['plists']}
              variant='dark'
              aria-controls='plistsCateg, moreBtnPlists'
            >
              Playlists
            </Button>
            <Collapse in={isCollapsed['plists']}>
              <div>
                <div className='searched' id='plistsCateg'>
                  {plistArr}
                </div>
                <button
                  type='button'
                  className='btn moreBtn'
                  id='moreBtnPlists'
                  onClick={() => moreBtnResults('plistsCateg')}
                >
                  See more
                </button>
              </div>
            </Collapse>
          </Fragment>
        </Fragment>
      )
    }
  }

  // update offsets for addtional results
  function moreBtnResults (category) {
    if (category === 'tracksCateg') {
      setTracksOffset(tracksOffset + 4)
    } else if (category === 'artistsCateg') {
      setArtistsOffset(artistsOffset + 4)
    } else if (category === 'albumsCateg') {
      setAlbumsOffset(albumsOffset + 4)
    } else if (category === 'plistsCateg') {
      setPlistsOffset(plistsOffset + 4)
    } else if (category === 'showSimCateg') {
      setShowSimLimit(showSimLimit + 4)
    } else if (category.includes(`topTracksCateg`)) {
      let timeframe = category.substring(15)
      state.setTimeframe(timeframe)
      if (topTracksOffset[timeframe] >= 40) {
        alert('Limit reached')
        return
      }
      let updated = topTracksOffset[timeframe] + 10
      setTopTracksOffset({
        ...topTracksOffset,
        [timeframe]: updated
      })
    } else if (category.includes(`topArtistsCateg`)) {
      let timeframe = category.substring(16)
      state.setTimeframe(timeframe)
      if (topArtistsOffset[timeframe] >= 40) {
        alert('Limit reached')
        return
      }
      let updated = topArtistsOffset[timeframe] + 10
      setTopArtistsOffset({
        ...topArtistsOffset,
        [timeframe]: updated
      })
    }
  }

  useEffect(() => {
    if (tracksOffset !== 0 && combinedResults.length > 0) {
      if (isLibrary) {
        if (tracksOffset > 100) alert('Limit reached')
        else {
          fetch('/api/v1/me/tracks?offset=' + tracksOffset, {
            headers: { Authorization: `Bearer ${token}` }
          })
            .then(resp => resp.json())
            .then(data => {
              setData(prev => ({
                ...prev,
                tracks: {
                  items: [...prev.tracks.items, ...data.items]
                }
              }))
            })
            .catch(error => console.error('Error:', error))
        }
      } else {
        if (tracksOffset > 50) alert('Limit reached')
        else {
          fetch(
            '/api/search?query=' +
              state.searchValue +
              '&type=track&offset=' +
              tracksOffset,
            { headers: { Authorization: `Bearer ${token}` } }
          )
            .then(resp => resp.json())
            .then(data => {
              setData(prev => ({
                ...prev,
                tracks: {
                  items: [...prev.tracks.items, ...data.tracks.items]
                }
              }))
            })
            .catch(error => console.error('Error:', error))
        }
      }
    }
  }, [tracksOffset])

  useEffect(() => {
    if (artistsOffset !== 0 && combinedResults.length > 0) {
      if (isLibrary) {
        if (artistsOffset > 100) alert('Limit reached')
        else {
          fetch('/api/v1/me/following?after=' + afterArtistOset, {
            headers: { Authorization: `Bearer ${token}` }
          })
            .then(resp => resp.json())
            .then(data => {
              setData(prev => ({
                ...prev,
                artists: {
                  items: [...prev.artists.items, ...data.artists.items]
                }
              }))
              setAfterArtistOset(data.artists.cursors.after)
            })
            .catch(error => console.error('Error:', error))
        }
      } else {
        if (artistsOffset > 50) alert('Limit reached')
        else {
          fetch(
            '/api/search?query=' +
              state.searchValue +
              '&type=artist&offset=' +
              artistsOffset,
            { headers: { Authorization: `Bearer ${token}` } }
          )
            .then(resp => resp.json())
            .then(data => {
              setData(prev => ({
                ...prev,
                artists: {
                  items: [...prev.artists.items, ...data.artists.items]
                }
              }))
            })
            .catch(error => console.error('Error:', error))
        }
      }
    }
  }, [artistsOffset])

  useEffect(() => {
    if (albumsOffset !== 0 && combinedResults.length > 0) {
      if (isLibrary) {
        if (albumsOffset > 100) alert('Limit reached')
        else {
          fetch('/api/v1/me/albums?offset=' + albumsOffset, {
            headers: { Authorization: `Bearer ${token}` }
          })
            .then(resp => resp.json())
            .then(data => {
              setData(prev => ({
                ...prev,
                albums: {
                  items: [...prev.albums.items, ...data.items]
                }
              }))
            })
            .catch(error => console.error('Error:', error))
        }
      } else {
        if (albumsOffset > 50) alert('Limit reached')
        else {
          fetch(
            '/api/search?query=' +
              state.searchValue +
              '&type=album&offset=' +
              albumsOffset,
            { headers: { Authorization: `Bearer ${token}` } }
          )
            .then(resp => resp.json())
            .then(data => {
              setData(prev => ({
                ...prev,
                albums: {
                  items: [...prev.albums.items, ...data.albums.items]
                }
              }))
            })
            .catch(error => console.error('Error:', error))
        }
      }
    }
  }, [albumsOffset])

  useEffect(() => {
    if (plistsOffset !== 0 && combinedResults.length > 0) {
      if (isLibrary) {
        if (plistsOffset > 100) alert('Limit reached')
        else {
          fetch('/api/v1/me/playlists?offset=' + plistsOffset, {
            headers: { Authorization: `Bearer ${token}` }
          })
            .then(resp => resp.json())
            .then(data => {
              setData(prev => ({
                ...prev,
                playlists: {
                  items: [...prev.playlists.items, ...data.items]
                }
              }))
            })
            .catch(error => console.error('Error:', error))
        }
      } else {
        if (plistsOffset > 50) alert('Limit reached')
        else {
          fetch(
            '/api/search?query=' +
              state.searchValue +
              '&type=playlist&offset=' +
              plistsOffset,
            { headers: { Authorization: `Bearer ${token}` } }
          )
            .then(resp => resp.json())
            .then(data => {
              setData(prev => ({
                ...prev,
                playlists: {
                  items: [...prev.playlists.items, ...data.playlists.items]
                }
              }))
            })
            .catch(error => console.error('Error:', error))
        }
      }
    }
  }, [plistsOffset])

  useEffect(() => {
    if (showSimLimit !== 4 && combinedResults.length > 0) {
      if (showSimLimit > 100) alert('Limit reached')
      else {
        fetch(
          '/api/v1/recommendations?seed_artists=' +
            spotifyObj.currentArtist +
            '&seed_tracks=' +
            spotifyObj.currentTrack +
            '&target_energy=' +
            spotifyObj.currentEnergy +
            '&target_valence=' +
            spotifyObj.currentValence +
            '&target_tempo=' +
            spotifyObj.currentTempo +
            '&target_danceability=' +
            spotifyObj.currentDanceability +
            '&target_time_signature=' +
            spotifyObj.currentTimeSig +
            '&market=' +
            userCountry +
            '&limit=' +
            showSimLimit,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
          .then(e => e.json())
          .then(data => {
            state.setFChartData(prev => ({
              ...prev,
              recommendations: data
            }))
          })
      }
    }
  }, [showSimLimit])

  function getTopTracks (timeframe) {
    if (showTFrameItems.topTracks === 1) setCombinedResults([])
    else if (showTFrameItems.topTracks > 3) {
      setShowTFrameItems({ ...showTFrameItems, ['topTracks']: 1 })
      return
    }
    setShowSim(false)
    setShowSimLimit(4)
    setTopTracksOffset({
      ...topTracksOffset,
      [timeframe]: 0
    })
  }

  function getTopArtists (timeframe) {
    if (showTFrameItems.topArtists === 1) setCombinedResults([])
    else if (showTFrameItems.topArtists > 3) {
      setShowTFrameItems({ ...showTFrameItems, ['topArtists']: 1 })
      return
    }
    setShowSim(false)
    setShowSimLimit(4)
    setTopArtistsOffset({
      ...topArtistsOffset,
      [timeframe]: 0
    })
  }

  useEffect(() => {
    if (type.home) {
      setCombinedResults([])
      setShowSim(false)
      setToggledAdd({})
      setIsLibrary(false)
      setTopTracksOffset({})
      setTopArtistsOffset({})
      setShowTFrameItems({
        ['topTracks']: 0,
        ['topArtists']: 0
      })
      setShowSimLimit(4)
      let date = new Date()
      let timestampISO = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000
      ).toISOString()
      try {
        fetch(
          '/api/getHomeContent?user_country=' +
            userCountry +
            '&timestamp=' +
            timestampISO,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
          .then(res => res.json())
          .then(data => {
            setData(data)
          })
      } catch (error) {
        console.error('Error:', error)
      }
    } else if (type.library) {
      setCombinedResults([])
      setShowSim(false)
      setToggledAdd({})
      setIsLibrary(true)
      setTopTracksOffset({})
      setTopArtistsOffset({})
      setTracksOffset(0)
      setArtistsOffset(0)
      setAlbumsOffset(0)
      setPlistsOffset(0)
      setAfterArtistOset('')
      setShowSimLimit(4)
      setShowTFrameItems({
        ...showTFrameItems,
        ['topTracks']: 0,
        ['topArtists']: 0
      })
      var fullResult = {}
      Promise.all([
        fetch('/api/v1/me/tracks', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(resp => resp.json()),
        fetch('/api/v1/me/following', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(resp => resp.json()),
        fetch('/api/v1/me/albums?&market=' + userCountry, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(resp => resp.json()),
        fetch('/api/v1/me/playlists', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(resp => resp.json())
      ])
        .then(data => {
          data.map(function (result, index) {
            if (index === 0) fullResult['tracks'] = result
            else if (index === 1) {
              if (result.artists.items.length > 0)
                setAfterArtistOset(result.artists.cursors.after)
              fullResult['artists'] = result.artists
            } else if (index === 2) fullResult['albums'] = result
            else if (index === 3) fullResult['playlists'] = result
          })
          setData(fullResult)
        })
        .catch(error => {
          console.error('Error:', error)
        })
    } else if (type.search) {
      if (state.searchValue !== '') {
        setCombinedResults([])
        setShowSim(false)
        setToggledAdd({})
        setIsLibrary(false)
        setTopTracksOffset({})
        setTopArtistsOffset({})
        setTracksOffset(0)
        setArtistsOffset(0)
        setAlbumsOffset(0)
        setPlistsOffset(0)
        setShowSimLimit(4)
        setShowTFrameItems({
          ...showTFrameItems,
          ['topTracks']: 0,
          ['topArtists']: 0
        })
        fetch('/api/search?query=' + state.searchValue, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(e => e.json())
          .then(data => {
            setData(data)
          })
          .catch(error => {
            console.error(error)
          })
      }
    } else if (type.topTracks) {
      if (Object.keys(topArtistsOffset).length > 0) setTopArtistsOffset({})
      if (topTracksOffset[state.timeframe] !== undefined) {
        scrollToTframe('track_' + state.timeframe)
        return
      }
      setToggledAdd({})
      setIsLibrary(false)
      setShowTFrameItems({
        ...showTFrameItems,
        ['topTracks']: showTFrameItems.topTracks + 1,
        ['topArtists']: 0
      })
    } else if (type.topArtists) {
      if (Object.keys(topTracksOffset).length > 0) setTopTracksOffset({})
      if (topArtistsOffset[state.timeframe] !== undefined) {
        scrollToTframe('artist_' + state.timeframe)
        return
      }
      setToggledAdd({})
      setIsLibrary(false)
      setShowTFrameItems({
        ...showTFrameItems,
        ['topArtists']: showTFrameItems.topArtists + 1,
        ['topTracks']: 0
      })
    }
  }, [type])

  useEffect(() => {
    if (data !== null) {
      if (type.home) {
        setCombinedResults([data])
      } else if (
        (type.library || type.search) &&
        tracksOffset === 0 &&
        artistsOffset === 0 &&
        albumsOffset === 0 &&
        plistsOffset === 0
      ) {
        setCombinedResults([data])
      } else if (
        type.topTracks &&
        combinedResults.length < 3 &&
        topTracksOffset[state.timeframe] === 0
      ) {
        setCombinedResults(prev => [...prev, data])
      } else if (
        type.topArtists &&
        combinedResults.length < 3 &&
        topArtistsOffset[state.timeframe] === 0
      ) {
        setCombinedResults(prev => [...prev, data])
      }
    }
  }, [data])

  useEffect(() => {
    if (type.topTracks) {
      getTopTracks(state.timeframe)
    } else if (type.topArtists) {
      getTopArtists(state.timeframe)
    }
  }, [showTFrameItems])

  useEffect(() => {
    if (combinedResults.length > 0) {
      if (type.topTracks && topTracksOffset[state.timeframe] === 0)
        scrollToTframe('track_' + state.timeframe)
      else if (type.topArtists && topArtistsOffset[state.timeframe] === 0)
        scrollToTframe('artist_' + state.timeframe)
    }
  }, [combinedResults])

  useEffect(() => {
    if (topTracksOffset[state.timeframe] >= 0 && state.timeframe !== '') {
      fetch(
        '/api/topTracks?time_range=' +
          state.timeframe +
          '&offset=' +
          topTracksOffset[state.timeframe],
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
        .then(res => res.json())
        .then(data => {
          data['topTracks'] = state.timeframe
          if (
            combinedResults.length > 0 &&
            topTracksOffset[state.timeframe] > 0
          ) {
            let key = Object.keys(combinedResults).find(
              key => combinedResults[key].topTracks === state.timeframe
            )
            const moreResults = combinedResults.map((item, index) => {
              if (index === +key) {
                // update topTracks result for specific timeframe
                return { ...item, items: [...item.items, ...data.items] }
              } else {
                // The rest haven't changed
                return item
              }
            })
            setCombinedResults(moreResults)
          } else setData(data)
        })
        .catch(error => {
          console.error('Error:', error)
        })
    }
  }, [topTracksOffset])

  useEffect(() => {
    if (topArtistsOffset[state.timeframe] >= 0 && state.timeframe !== '') {
      fetch(
        '/api/topArtists?time_range=' +
          state.timeframe +
          '&offset=' +
          topArtistsOffset[state.timeframe],
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
        .then(res => res.json())
        .then(data => {
          data['topArtists'] = state.timeframe
          if (
            combinedResults.length > 0 &&
            topArtistsOffset[state.timeframe] > 0
          ) {
            let key = Object.keys(combinedResults).find(
              key => combinedResults[key].topArtists === state.timeframe
            )
            const moreResults = combinedResults.map((item, index) => {
              if (index === +key) {
                // update topArtists result for specific timeframe
                return { ...item, items: [...item.items, ...data.items] }
              } else {
                // The rest haven't changed
                return item
              }
            })
            setCombinedResults(moreResults)
          } else setData(data)
        })
        .catch(error => {
          console.error('Error:', error)
        })
    }
  }, [topArtistsOffset])

  useEffect(() => {
    // show similar songs when user chooses to
    if (state.fChartData?.recommendations) {
      setShowSim(true)
    }
  }, [state.fChartData?.recommendations])

  if (data === null || combinedResults.length === 0) {
    return (
      <div className='d-flex justify-content-center align-items-center'>
        <div className='spinner-border' role='status' />
      </div>
    )
  } else if (
    type.home &&
    combinedResults.length === 1 &&
    combinedResults[0].albums?.href.includes('/browse')
  ) {
    let data = combinedResults[0]
    let resultArr = []
    // For each of the featured playlists, create an element
    var featPlistsArray = []
    data.playlists.items.forEach(function (playlist) {
      var featPlistDiv = (
        <div
          className='text-white-top'
          onClick={() =>
            setToggledAdd({
              ...toggledAdd,
              [playlist.id]:
                toggledAdd[playlist.id] === undefined
                  ? true
                  : !toggledAdd[playlist.id]
            })
          }
          key={playlist.id}
        >
          <div>
            <Image
              style={{
                display: 'flex',
                margin: '10px auto 0px auto'
              }}
              src={
                playlist.images.length === 0
                  ? MusicNote
                  : playlist.images[0].url
              }
              width={64}
              height={64}
              alt='Playlist Image'
            />
            <p className='resultText'>{playlist.name}</p>
            {playlist.description.trim() !== '' ? (
              <>
                <p className='resultText fw-light fs-6'>
                  {playlist.description.trim().replace(/<\/?[^>]+(>|$)/g, '')}
                </p>
                <span onClick={e => e.stopPropagation()}>
                  <a
                    className='btn btn-sm spotifyLink'
                    href={playlist.external_urls.spotify}
                    target='_blank'
                    rel='noreferrer'
                  >
                    <Image
                      src={SpotifyLogo}
                      className='img-fluid'
                      width={70}
                      alt='spotify logo'
                    />
                  </a>
                </span>
                <AddResult
                  resultId={playlist.id}
                  categ='plist'
                  userCountry={userCountry}
                  toggledAdd={toggledAdd}
                  token={token}
                  init={funcs}
                />
              </>
            ) : (
              <AddResult
                resultId={playlist.id}
                categ='plist'
                userCountry={userCountry}
                toggledAdd={toggledAdd}
                token={token}
                init={funcs}
              />
            )}
          </div>
        </div>
      )
      featPlistsArray.push(featPlistDiv)
    })
    resultArr.push(
      <Container id='featPlistsContainer' key='featPlistsContainer'>
        <Button
          className={
            'rounded-pill searchCateg' +
            (!isCollapsed['featPlists'] ? ' activeCateg' : '')
          }
          id='btnFeatPlistsCateg'
          size='lg'
          onClick={() =>
            setIsCollapsed({
              ...isCollapsed,
              ['featPlists']: !isCollapsed['featPlists']
            })
          }
          aria-expanded={!isCollapsed['featPlists']}
          variant='dark'
          aria-controls='featMsgDivider, featPlistsCateg, featPlistMsg'
        >
          Featured Playlists
        </Button>
        <Collapse in={!isCollapsed['featPlists']}>
          <div>
            <div className='msgTitle h4' id='featPlistMsg'>
              {data.message}
            </div>
            <hr id='featMsgDivider' />
            <div id='featPlistsCateg' className='searchedAlt'>
              {featPlistsArray}
            </div>
          </div>
        </Collapse>
      </Container>
    )
    // For each of the new releases, create an element
    var newRelsArray = []
    data.albums.items.forEach(function (album) {
      var newRelDiv = (
        <div
          className='text-white-top'
          onClick={() =>
            setToggledAdd({
              ...toggledAdd,
              [album.id]:
                toggledAdd[album.id] === undefined
                  ? true
                  : !toggledAdd[album.id]
            })
          }
          key={album.id}
        >
          <div>
            <Image
              style={{
                display: 'flex',
                margin: '10px auto 0px auto'
              }}
              src={album.images.length === 0 ? MusicNote : album.images[2].url}
              width={64}
              height={64}
              alt='Album Cover'
            />
            <p className='resultText'>
              {album.artists.map(eachArtist => eachArtist.name).join(', ')} -{' '}
              {album.name}
            </p>
            {album.release_date.trim() !== '' ? (
              <>
                <p className='resultText fw-light fs-6'>
                  {album.album_type}, {album.release_date}
                </p>
                <span onClick={e => e.stopPropagation()}>
                  <a
                    className='btn btn-sm spotifyLink'
                    href={album.external_urls.spotify}
                    target='_blank'
                    rel='noreferrer'
                  >
                    <Image
                      src={SpotifyLogo}
                      className='img-fluid'
                      width={70}
                      alt='spotify logo'
                    />
                  </a>
                </span>
                <AddResult
                  resultId={album.id}
                  categ='album'
                  userCountry={userCountry}
                  toggledAdd={toggledAdd}
                  token={token}
                  init={funcs}
                />
              </>
            ) : (
              <AddResult
                resultId={album.id}
                categ='album'
                userCountry={userCountry}
                toggledAdd={toggledAdd}
                token={token}
                init={funcs}
              />
            )}
          </div>
        </div>
      )
      newRelsArray.push(newRelDiv)
    })
    resultArr.push(
      <Container id='newRelsContainer' key='newRelsContainer'>
        <Button
          className={
            'rounded-pill searchCateg' +
            (!isCollapsed['newRels'] ? ' activeCateg' : '')
          }
          id='btnNewRelsCateg'
          size='lg'
          onClick={() =>
            setIsCollapsed({
              ...isCollapsed,
              ['newRels']: !isCollapsed['newRels']
            })
          }
          aria-expanded={!isCollapsed['newRels']}
          variant='dark'
          aria-controls='newRelsCateg'
        >
          New Releases
        </Button>
        <Collapse in={!isCollapsed['newRels']}>
          <div>
            <div id='newRelsCateg' className='searchedAlt'>
              {newRelsArray}
            </div>
          </div>
        </Collapse>
      </Container>
    )
    if (showSim)
      resultArr.push(
        <SimilarSongs
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          recommendations={state.fChartData?.recommendations}
          init={funcs}
          moreBtnResults={moreBtnResults}
          key='similarSongs'
        />
      )
    return resultArr
  } else if (
    type.search &&
    combinedResults.length === 1 &&
    combinedResults[0].tracks?.href.includes('/search')
  ) {
    if (showSim)
      return [
        showResults(data, false),
        <SimilarSongs
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          recommendations={state.fChartData?.recommendations}
          init={funcs}
          moreBtnResults={moreBtnResults}
          key='similarSongs'
        />
      ]
    return showResults(data, false)
  } else if (
    type.library &&
    combinedResults.length === 1 &&
    combinedResults[0].tracks?.href.includes('/me')
  ) {
    if (showSim)
      return [
        showResults(data, true),
        <SimilarSongs
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          recommendations={state.fChartData?.recommendations}
          init={funcs}
          moreBtnResults={moreBtnResults}
          key='similarSongs'
        />
      ]
    return showResults(data, true)
  } else if (
    type.topTracks &&
    combinedResults.length <= 3 &&
    'topTracks' in data
  ) {
    if (showSim)
      return [
        showResults(data, false),
        <SimilarSongs
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          recommendations={state.fChartData?.recommendations}
          init={funcs}
          moreBtnResults={moreBtnResults}
          key='similarSongs'
        />
      ]
    return showResults(data, false)
  } else if (
    type.topArtists &&
    combinedResults.length <= 3 &&
    'topArtists' in data
  ) {
    if (showSim)
      return [
        showResults(data, false),
        <SimilarSongs
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          recommendations={state.fChartData?.recommendations}
          init={funcs}
          moreBtnResults={moreBtnResults}
          key='similarSongs'
        />
      ]
    return showResults(data, false)
  }
}
