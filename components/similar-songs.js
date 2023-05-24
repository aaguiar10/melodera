import Image from 'next/image'
import Link from 'next/link'
import SpotifyLogo from '../public/images/spotify_logo.png'
import Button from 'react-bootstrap/Button'
import Collapse from 'react-bootstrap/Collapse'

// component for Spotify recommendations
export default function SimilarSongs ({
  isCollapsed,
  setIsCollapsed,
  recommendations,
  init,
  moreBtnResults
}) {
  return (
    <>
      <Button
        className={
          'rounded-pill searchCateg' +
          (!isCollapsed['recommendations'] ? ' activeCateg' : '')
        }
        id='btnSimCateg'
        size='lg'
        onClick={() =>
          setIsCollapsed({
            ...isCollapsed,
            ['recommendations']: !isCollapsed['recommendations']
          })
        }
        aria-expanded={!isCollapsed['recommendations']}
        variant='dark'
        aria-controls='showSimCateg, moreBtnSim'
      >
        Similar Songs
      </Button>
      <Collapse in={!isCollapsed['recommendations']}>
        <div>
          <div className='searched' id='showSimCateg'>
            {recommendations.tracks.map((result, index) => (
              <div
                className='text-white-top'
                onClick={() => {
                  init.playVid(result.id)
                  init.getAnalysis(result.id)
                  init.getFeatures(result.id)
                }}
                key={'recommendation_' + index}
              >
                <div>
                  <Image
                    style={{
                      display: 'flex',
                      margin: '10px auto 0px auto'
                    }}
                    src={
                      result.album.images.length === 0
                        ? MusicNote
                        : result.album.images[2].url
                    }
                    width={64}
                    height={64}
                    alt='Song Pic'
                  />
                  <p className='resultText'>
                    {result.artists
                      .map(eachArtist => eachArtist.name)
                      .join(', ')}{' '}
                    — {result.name}
                  </p>
                  {result.album.release_date.trim() !== '' ? (
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
            ))}
          </div>
          <button
            type='button'
            className='btn moreBtn'
            id='moreBtnSim'
            onClick={() => moreBtnResults('showSimCateg')}
          >
            See more
          </button>
        </div>
      </Collapse>
    </>
  )
}
