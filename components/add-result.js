import { useEffect, useState } from 'react'

// component for additional results
export default function AddResult ({
  resultId,
  categ,
  userCountry,
  toggledAdd,
  token,
  init
}) {
  const [data, setData] = useState(null)

  // set data depending on the id toggled and its category
  useEffect(() => {
    if (toggledAdd[resultId]) {
      if (categ == 'artist') {
        fetch(
          '/api/v1/artistTopTracks/?id=' + resultId + '&market=' + userCountry,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
          .then(e => e.json())
          .then(data => {
            if (data.tracks.length === 0) {
              setData({})
            } else {
              setData(data)
            }
          })
          .catch(error => {
            console.error('Error:', error)
            setData(null)
          })
      } else if (categ == 'album') {
        fetch(
          '/api/v1/albumTracks/?id=' + resultId + '&market=' + userCountry,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
          .then(e => e.json())
          .then(data => {
            if (data.items.length === 0) {
              setData({})
            } else {
              setData(data)
            }
          })
          .catch(error => {
            console.error('Error:', error)
            setData(null)
          })
      } else if (categ == 'plist') {
        fetch(
          '/api/v1/playlistTracks/?id=' + resultId + '&market=' + userCountry,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
          .then(e => e.json())
          .then(data => {
            if (data.tracks.items.length === 0) {
              setData({})
            } else {
              setData(data)
            }
          })
          .catch(error => {
            console.error('Error:', error)
            setData(null)
          })
      }
    }
  }, [toggledAdd, resultId, categ, userCountry, token])

  // decide what the component returns depending on data/category
  if (data === null || toggledAdd[resultId] === false) {
    return <ol className='addResultText' id={resultId}></ol>
  } else if (Object.keys(data).length === 0) {
    return (
      <ol className='addResultText' id={resultId}>
        {categ == 'artist' ? (
          <p className='text-decoration-underline'>Popular</p>
        ) : (
          <></>
        )}
        <p>&lt;Nothing found&gt;</p>
      </ol>
    )
  } else {
    return (
      <ol className='addResultText' id={resultId}>
        {categ == 'artist' ? (
          <p className='text-decoration-underline'>Popular</p>
        ) : (
          <></>
        )}
        {categ == 'artist' ? (
          data.tracks.map((track, index) => (
            <li
              onClick={() => {
                init.playVid(track.id)
                init.getAnalysis(track.id)
                init.getFeatures(track.id)
              }}
              key={track.id}
            >
              {++index}. {track.name}
            </li>
          ))
        ) : categ == 'album' ? (
          data.items.map((track, index) => (
            <li
              onClick={() => {
                init.playVid(track.id)
                init.getAnalysis(track.id)
                init.getFeatures(track.id)
              }}
              key={track.id}
            >
              {++index}. {track.name}
            </li>
          ))
        ) : categ == 'plist' ? (
          data.tracks.items
            .filter(result => result.track !== null)
            .map((result, index) => (
              <li
                onClick={() => {
                  init.playVid(result.track.id)
                  init.getAnalysis(result.track.id)
                  init.getFeatures(result.track.id)
                }}
                key={result.track.id}
              >
                {++index}.{' '}
                {result.track.artists
                  .map(eachArtist => eachArtist.name)
                  .join(', ')}{' '}
                — {result.track.name}
              </li>
            ))
        ) : (
          <></>
        )}
      </ol>
    )
  }
}
