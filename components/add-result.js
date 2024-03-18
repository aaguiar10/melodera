import { useEffect, useState, useContext } from 'react'
import { AnalysisContext } from '../utils/context'
import { useSession } from 'next-auth/react'
import { playTrack, getAnalysis, getFeatures } from '../utils/funcs'

// component for additional results
export default function AddResult ({ resultId, category, toggledAdd }) {
  const { data: session } = useSession()
  const [state, setState, player, deviceId] = useContext(AnalysisContext)
  const [data, setData] = useState(null)

  // set data depending on the id toggled and its category
  useEffect(() => {
    const fetchMap = {
      artist: { url: '/api/v1/artistTopTracks/', dataPath: 'tracks' },
      album: { url: '/api/v1/albumTracks/', dataPath: 'items' },
      playlist: { url: '/api/v1/playlistTracks/', dataPath: 'tracks.items' }
    }

    if (toggledAdd[resultId]) {
      const { url, dataPath } = fetchMap[category]
      fetch(`${url}?id=${resultId}&market=${state.profileInfo.userCountry}`, {
        headers: { Authorization: `Bearer ${session.user.accessToken}` }
      })
        .then(e => e.json())
        .then(data => {
          const items = dataPath.split('.').reduce((o, i) => o[i], data)
          setData(items.length === 0 ? {} : data)
        })
        .catch(error => {
          console.error('Error:', error)
          setData(null)
        })
    }
  }, [
    toggledAdd,
    resultId,
    category,
    state.profileInfo.userCountry,
    session.user.accessToken
  ])

  // decide what the component returns depending on data/category
  if (!data || !toggledAdd[resultId]) {
    return <ol className='addResultText' id={resultId}></ol>
  } else if (Object.keys(data).length === 0) {
    return (
      <ol className='addResultText' id={resultId}>
        {category === 'artist' && (
          <p className='text-decoration-underline'>Popular</p>
        )}
        <p>&lt;Nothing found&gt;</p>
      </ol>
    )
  } else {
    const renderListItem = (item, index) => (
      <li
        onClick={() => {
          playTrack(item.id, player, deviceId, session, state)
          getFeatures(item.id, session, setState)
          getAnalysis(item.id, session, setState)
        }}
        key={item.id}
        className='addResultItem'
      >
        {++index}. {item.name}
      </li>
    )
    return (
      <ol className='addResultText' id={resultId}>
        {category === 'artist' && (
          <>
            <p className='text-decoration-underline'>Popular</p>
            {data.tracks.map(renderListItem)}
          </>
        )}
        {category === 'album' && data.items.map(renderListItem)}
        {category === 'playlist' &&
          data.tracks.items
            .filter(result => result.track !== null)
            .map((result, index) => (
              <li
                onClick={() => {
                  playTrack(result.track.id, player, deviceId, session, state)
                  getFeatures(result.track.id, session, setState)
                  getAnalysis(result.track.id, session, setState)
                }}
                key={result.track.id}
                className='addResultItem'
              >
                {++index}.{' '}
                {result.track.artists.map(artist => artist.name).join(', ')} —{' '}
                {result.track.name}
              </li>
            ))}
      </ol>
    )
  }
}
