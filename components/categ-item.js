import AddResult from './add-result'
import SpotifyLogo from '../public/images/spotify_logo_white.png'
import MusicNote from '../public/images/music-note-beamed.svg'
import Image from 'next/image'
import Link from 'next/link'
import parse from 'html-react-parser'
import { useContext } from 'react'
import { AnalysisContext, ResultsContext } from '../utils/context'
import { playTrack, getFeatures, getAnalysis } from '../utils/funcs'
import { useSession } from 'next-auth/react'

const ImageComponent = ({ item, category }) => (
  <div className='card-image-wrapper'>
    <Image
      src={
        ((item?.album?.images?.[0] || item?.album?.images?.[1])?.url ||
          (item?.images?.[0] || item?.images?.[1])?.url) ??
        MusicNote
      }
      style={{
        borderRadius: '12px',
        objectFit: 'cover'
      }}
      width={160}
      height={160}
      alt={`${category.charAt(0).toUpperCase() + category.slice(1)} Image`}
    />
  </div>
)

const ResultText = ({ id, item, rank, category }) => (
  <div className='resultText'>
    {rank ? <span className='rank-badge'>{rank}</span> : null}
    <span className='track-name'>{item?.name}</span>
    {(category == 'track' || category == 'album') && (
      <span className='artist-name'>
        {item?.artists?.map(eachArtist => eachArtist.name).join(', ')}
      </span>
    )}
  </div>
)

const ResultTextInfo = ({ item, category }) => (
  <div className='resultText resultTextInfo'>
    {category == 'track' && item?.album?.release_date}
    {category == 'artist' &&
      `${item?.followers?.total?.toLocaleString()} followers`}
    {category == 'album' &&
      `${item?.album_type} • ${item?.release_date?.split('-')[0]}`}
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
      height={21}
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
      className='text-white-top text-break'
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
