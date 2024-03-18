import AddResult from './add-result'
import SpotifyLogo from '../public/images/spotify_logo_black.png'
import MusicNote from '../public/images/music-note-beamed.svg'
import Image from 'next/image'
import Link from 'next/link'
import parse from 'html-react-parser'
import { useContext } from 'react'
import { AnalysisContext, ResultsContext } from '../utils/context'
import { playTrack, getFeatures, getAnalysis } from '../utils/funcs'
import { useSession } from 'next-auth/react'

const ImageComponent = ({ item, category }) => (
  <Image
    src={
      ((item?.album?.images?.[0] || item?.album?.images?.[1])?.url ||
        (item?.images?.[0] || item?.images?.[1])?.url) ??
      MusicNote
    }
    style={{ margin: '0.5rem auto 0.25rem' }}
    width={128}
    height={128}
    alt={`${category.charAt(0).toUpperCase() + category.slice(1)} Image`}
  />
)

const ResultText = ({ id, item, rank, category }) => (
  <div className='resultText'>
    {rank ? `${rank}. ` : ``}
    {(category == 'track' || category == 'album') &&
      item?.artists?.map(eachArtist => eachArtist.name).join(', ') + ' — '}
    {item?.name}
  </div>
)

const ResultTextInfo = ({ item, category }) => (
  <div className='resultText resultTextInfo fw-light fs-6'>
    {category == 'track' && `Released: ${item?.album?.release_date}`}
    {category == 'artist' && `Followers: ${item?.followers?.total}`}
    {category == 'album' && `${item?.album_type}, ${item?.release_date}`}
    {category == 'playlist' &&
      item?.description &&
      parse(item?.description?.trim().replace(/<\/?[^>]+(>|$)/g, ''))}
  </div>
)

const SpotifyLink = ({ item }) => (
  <Link
    className='btn btn-sm spotifyLink'
    href={item?.external_urls.spotify ?? 'https://www.spotify.com'}
    target='_blank'
    rel='noreferrer'
    onClick={e => e.stopPropagation()}
  >
    <Image
      src={SpotifyLogo}
      className='img-fluid'
      width={70}
      alt='spotify logo'
    />
  </Link>
)

// Component for each item in a category
export default function CategItem ({ id, category, item, index }) {
  const { data: session } = useSession()
  const [state, setState, player, deviceId] = useContext(AnalysisContext)
  const [dataState, setDataState, , , offsetState] = useContext(ResultsContext)
  let rank = null
  if (id.includes('top')) {
    const underscoreIndex = id.indexOf('_')
    const baseId = id.substring(0, underscoreIndex)
    const timeframe = id.substring(underscoreIndex + 1)
    rank = ++index + offsetState[baseId][timeframe]
  }
  const handleClick = () => {
    if (category == 'track') {
      playTrack(item?.id, player, deviceId, session, state)
      getFeatures(item?.id, session, setState)
      getAnalysis(item?.id, session, setState)
    } else {
      setDataState(prevState => ({
        ...prevState,
        toggledAdd: {
          ...prevState.toggledAdd,
          [item?.id]: prevState.toggledAdd[item?.id]
            ? !prevState.toggledAdd[item?.id]
            : true
        }
      }))
    }
  }

  return (
    <div
      className='text-white-top bg-light'
      onClick={handleClick}
      key={item?.id + `_${index}`}
    >
      <ImageComponent item={item} category={category} />
      <ResultText id={id} item={item} rank={rank} category={category} />
      <ResultTextInfo item={item} category={category} />
      <SpotifyLink item={item} />
      {category !== 'track' && (
        <AddResult
          resultId={item?.id}
          category={category}
          toggledAdd={dataState.toggledAdd}
        />
      )}
    </div>
  )
}
