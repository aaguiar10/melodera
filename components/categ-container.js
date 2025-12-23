import Container from 'react-bootstrap/Container'
import Button from 'react-bootstrap/Button'
import Collapse from 'react-bootstrap/Collapse'
import Row from 'react-bootstrap/Row'
import Toast from 'react-bootstrap/Toast'
import Pagination from 'react-bootstrap/Pagination'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import CategItem from './categ-item'
import { getSession } from 'next-auth/react'
import { useState, useContext } from 'react'
import { AnalysisContext, ResultsContext } from '../utils/context'
import {
  range,
  getMap,
  throttle,
  getTopTracks,
  getTopArtists
} from '../utils/funcs'

const createPlist = throttle(async (timeframe, setShowToast) => {
  const tframe =
    timeframe === 'short_term'
      ? 'Last 4 weeks'
      : timeframe === 'medium_term'
      ? 'Last 6 months'
      : 'All time'
  const date = new Date()
  const title = `Top Songs - ${tframe}`
  const limit = 50
  const session = await getSession()
  fetch(`/api/topTracks?time_range=${timeframe}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${session.user.accessToken}` }
  })
    .then(resp => resp.json())
    .then(data => {
      const trackUris = data?.items.map(track => `spotify:track:${track.id}`)
      return fetch(
        `/api/v1/me/createPlist?timestamp=${date.toLocaleString()}&tracks=${trackUris}&title=${title}`,
        {
          headers: { Authorization: `Bearer ${session.user.accessToken}` }
        }
      )
    })
    .then(resp => resp.json())
    .then(() =>
      setShowToast(prevState => ({ ...prevState, [timeframe]: true }))
    )
    .catch(e => console.error(e))
}, 2000)

const Message = ({ result, id }) =>
  result?.message &&
  id === 'featPlists' && (
    <>
      <div className='msgTitle h4' id={`${id}Msg`}>
        {result?.message}
      </div>
      <hr id={`${id}Divider`} />
    </>
  )

const renderTitle = (
  setState,
  category,
  result,
  id,
  tframesRef,
  showToast,
  setShowToast
) => {
  const getTop = timeframe => {
    if (id === 'topArtists') {
      getTopArtists(setState, timeframe)
    } else if (id === 'topTracks') {
      getTopTracks(setState, timeframe)
    }
  }

  return (
    <>
      <Toast
        show={showToast[result[id]]}
        onClose={() =>
          setShowToast(prevState => ({ ...prevState, [result[id]]: false }))
        }
        className='text-center trackOptionsToast'
        delay='2000'
        autohide
      >
        <Toast.Body>Top 50 added to Your Library</Toast.Body>
      </Toast>
      <div
        className='tFrameTitle gap-4 align-items-end d-flex flex-wrap'
        ref={node => {
          const map = getMap(tframesRef)
          const resultId = `${category}_${result[id]}`
          if (node) {
            map.set(resultId, node)
          } else {
            map.delete(resultId)
          }
        }}
      >
        <div className='d-flex flex-grow-1 mb-0 justify-content-md-start justify-content-center h4'>
          {result[id] === 'short_term'
            ? 'Last 4 weeks'
            : result[id] === 'medium_term'
            ? 'Last 6 months'
            : 'All time'}
        </div>
        <ButtonGroup
          className='mx-auto justify-content-lg-end justify-content-center'
          aria-label='top items timeframe buttons'
        >
          <Button
            className='btn-aubergine'
            onClick={() => getTop('short_term')}
          >
            Last 4 weeks
          </Button>
          <Button
            className='btn-aubergine'
            onClick={() => getTop('medium_term')}
          >
            Last 6 months
          </Button>
          <Button className='btn-aubergine' onClick={() => getTop('long_term')}>
            All time
          </Button>
          {id === 'topTracks' && (
            <Button
              className='btn-aubergine'
              onClick={() => createPlist(result[id], setShowToast)}
            >
              <i className='bi bi-music-note-list' />
            </Button>
          )}
        </ButtonGroup>
      </div>
      <hr
        id={`tRangeTracksDivider_${result[id]}`}
        className='section-divider'
      />
    </>
  )
}

const PaginationComponent = ({
  result,
  limit,
  id,
  setState,
  offsetState,
  setOffsetState
}) => {
  let category = `${id}Categ${id.includes('top') ? `_${result[id]}` : ''}`
  let rangeVal = id.includes('top')
    ? offsetState[id]?.[result[id]]
    : offsetState[id]
  return (
    id !== 'featPlists' &&
    id !== 'newRels' && (
      <Pagination className='justify-content-lg-end justify-content-center mt-4 flex-wrap'>
        <Pagination.First
          onClick={() =>
            loadMoreResults(
              category,
              0,
              setState,
              offsetState,
              setOffsetState,
              limit
            )
          }
        />
        <Pagination.Prev
          onClick={() =>
            loadMoreResults(
              category,
              'prev',
              setState,
              offsetState,
              setOffsetState,
              limit
            )
          }
        />
        {range(
          limit - rangeVal < 40 ? Math.max(limit - 40, 0) : rangeVal, // start
          rangeVal + 40 > limit ? limit : rangeVal + 40, // stop
          10 // step
        ).map(elem => (
          <Pagination.Item
            key={`${id}_page_${elem}`}
            active={elem === rangeVal}
            onClick={() =>
              loadMoreResults(
                category,
                elem,
                setState,
                offsetState,
                setOffsetState,
                limit
              )
            }
          >
            {elem / 10 + 1}
          </Pagination.Item>
        ))}
        <Pagination.Next
          onClick={() =>
            loadMoreResults(
              category,
              'next',
              setState,
              offsetState,
              setOffsetState,
              limit
            )
          }
        />
        <Pagination.Last
          onClick={() =>
            loadMoreResults(
              category,
              !result?.artists?.cursors
                ? limit
                : Math.min(Math.ceil(rangeVal / 50) * 50 + 40, limit),
              setState,
              offsetState,
              setOffsetState,
              limit
            )
          }
        />
      </Pagination>
    )
  )
}

const Items = ({ id, items, category }) => (
  <div className='searched' id={`${id}Categ`}>
    {items &&
      items.map((item, index) => (
        <CategItem
          id={id}
          category={category}
          item={item[category] ?? item}
          index={index}
          key={category + index}
        />
      ))}
  </div>
)

// Helper function to calculate new offset
const calculateOffset = (altOffset, currentOffset, limit) => {
  if (altOffset === 'prev') return Math.max(currentOffset - 10, 0)
  if (altOffset === 'next') return Math.min(currentOffset + 10, limit)
  return altOffset
}

// update offsets for additional results
function loadMoreResults (
  category,
  altOffset,
  setState,
  offsetState,
  setOffsetState,
  limit
) {
  const categoryMap = {
    tracksCateg: 'tracks',
    artistsCateg: 'artists',
    albumsCateg: 'albums',
    playlistsCateg: 'playlists',
    recommendationsCateg: 'recommendations'
  }

  const key =
    categoryMap[category] ||
    (category.includes('Tracks') ? 'topTracks' : 'topArtists')
  const isTopCategory = category.includes('top')
  const timeframe = isTopCategory
    ? category.substring(category.includes('Tracks') ? 15 : 16)
    : null

  // Update state for top categories
  if (isTopCategory) {
    setState(prevState => ({ ...prevState, timeframe }))
  }

  // Calculate new offset
  const currentOffset = isTopCategory
    ? offsetState[key][timeframe]
    : offsetState[key]
  const newOffset = calculateOffset(altOffset, currentOffset, limit)

  // Update offset state
  setOffsetState(prevOffset => ({
    ...prevOffset,
    [key]: isTopCategory
      ? { ...prevOffset[key], [timeframe]: newOffset }
      : newOffset
  }))
}

// component for container of 'category' results
export default function CategContainer ({ id, title, category, extraControls }) {
  const [state, setState] = useContext(AnalysisContext)
  const [
    dataState,
    ,
    viewState,
    setViewState,
    offsetState,
    setOffsetState,
    tframesRef
  ] = useContext(ResultsContext)
  const [showToast, setShowToast] = useState({
    short_term: false,
    medium_term: false,
    long_term: false
  })

  let data =
    id !== 'recommendations'
      ? dataState.combinedResults
      : state.fChartData?.recommendations
  let mappedResults = data.map((result, index) => {
    let items =
      id !== 'recommendations'
        ? result?.[`${category}s`]?.items ?? result?.items
        : result?.items?.slice(
            offsetState[id] % 50,
            (offsetState[id] % 50) + 10
          )
    const totalItems =
      id !== 'recommendations'
        ? result?.[`${category}s`]?.total ?? result?.total
        : result?.items.length
    let limit =
      Math.floor(totalItems / 10) * 10 - (totalItems % 10 === 0 ? 10 : 0)
    return (
      <Collapse in={!viewState.isCollapsed[id]} key={`${id}_${index}`}>
        <div>
          <Message result={result} id={id} />
          {id.includes('top') &&
            renderTitle(
              setState,
              category,
              result,
              id,
              tframesRef,
              showToast,
              setShowToast
            )}
          <PaginationComponent
            result={result}
            limit={limit}
            id={id}
            setState={setState}
            offsetState={offsetState}
            setOffsetState={setOffsetState}
          />
          <Items
            id={`${id}${id.includes('top') ? `_${result[id]}` : ''}`}
            items={items}
            category={category}
          />
        </div>
      </Collapse>
    )
  })

  return (
    <Container fluid id={`${id}Container`} key={`${id}Container`}>
      <Row className='gap-2'>
        <Button
          className={`rounded-pill searchCateg${
            !viewState.isCollapsed[id] ? ' activeCateg' : ''
          }`}
          id={`btn-${id}Categ`}
          size='lg'
          onClick={() =>
            setViewState(prev => ({
              ...prev,
              isCollapsed: {
                ...prev.isCollapsed,
                [id]: !prev.isCollapsed[id]
              }
            }))
          }
          aria-expanded={!viewState.isCollapsed[id]}
          variant='dark'
          aria-controls={`${id}Categ${
            extraControls ? ', ' + extraControls : ''
          }`}
        >
          {title}
        </Button>
        {mappedResults}
      </Row>
    </Container>
  )
}
