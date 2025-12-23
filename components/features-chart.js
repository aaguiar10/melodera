import BottomPlayer from './bottom-player'
import Toast from 'react-bootstrap/Toast'
import ToastContainer from 'react-bootstrap/ToastContainer'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import { useEffect, useRef, useState, useContext } from 'react'
import { AnalysisContext } from '../utils/context'
import { useSession } from 'next-auth/react'
import { resumeTrack, pauseTrack, syncPlayer, debounce } from '../utils/funcs'

// component for the features chart
export default function FeaturesChart () {
  const { data: session } = useSession()
  const [state, setState, player] = useContext(AnalysisContext)
  const prevWidth = useRef(window.innerWidth)
  const animReq = useRef(null)
  const resizeEvent = useRef(false)
  const featuresChartContainer = useRef(null)
  const [fChartProps, setFChartProps] = useState({
    rowHeight: null,
    arrayLikes: [],
    pitchesObj: null,
    beatsObj: null
  })
  const [sVisualProps, setSVisualProps] = useState({
    width: null,
    height: null,
    centerX: null,
    centerY: null,
    radius: null
  })
  const [currPosition, setCurrPosition] = useState(null)
  const [pitchCounter, setPitchCounter] = useState(0)
  const [beatCounter, setBeatCounter] = useState(0)
  const prevBeatCounter = useRef(0)
  const [timer, setTimer] = useState({ progress: 0, duration: 1 })
  const [dominantPitch, setDominantPitch] = useState(null)
  const [showSongToast, setShowSongToast] = useState({
    added: false,
    removed: false
  })
  const [showPlistToast, setShowPlistToast] = useState({
    added: false,
    removed: false
  })
  const [showDisabledToast, setShowDisabledToast] = useState(false)
  const [showSimToast, setShowSimToast] = useState(false)
  const featuresChartRef = useRef(null)
  const songVisualRef = useRef(null)
  const colors = [
    '#B1B4D3',
    '#E1DFD7',
    '#C2D4DE',
    '#A6C6DE',
    '#87B6D8',
    '#769BCF',
    '#F8E5A5',
    '#F8ADA4',
    '#FFDDC3',
    '#E4CBBC',
    '#B7A590',
    '#B2CCD4'
  ]
  const allPitches = {
    C: colors[0],
    'C♯ / D♭': colors[1],
    D: colors[2],
    'D♯ / E♭': colors[3],
    E: colors[4],
    F: colors[5],
    'F♯ / G♭': colors[6],
    G: colors[7],
    'G♯ / A♭': colors[8],
    A: colors[9],
    'A♯ / B♭': colors[10],
    B: colors[11]
  }

  const cycleLoop = [0, 1, 2, 3, 4, 5]
  const scale = 0.75
  const sVisualImgWidth = 195
  const sVisualImgHeight = 225
  const scaledWidth = scale * sVisualImgWidth
  const scaledHeight = scale * sVisualImgHeight
  var sVisualImg = new Image()

  sVisualImg.src = '/images/coin-art.png'

  function drawFrame (frameX, frameY, canvasX, canvasY) {
    let songVisual = songVisualRef.current.getContext('2d')
    songVisual.globalCompositeOperation = 'color'
    songVisual.drawImage(
      sVisualImg,
      frameX * sVisualImgWidth,
      frameY * sVisualImgHeight,
      sVisualImgWidth,
      sVisualImgHeight,
      canvasX,
      canvasY,
      scaledWidth,
      scaledHeight
    )
  }

  function doFullScreen () {
    const methods = [
      'requestFullscreen',
      'webkitRequestFullscreen',
      'mozRequestFullscreen',
      'msRequestFullscreen',
      'mozEnterFullScreen',
      'webkitEnterFullScreen',
      'msEnterFullScreen'
    ]
    for (let method of methods) {
      if (featuresChartContainer.current[method]) {
        featuresChartContainer.current[method]()
        break
      }
    }
  }

  // handle click events on the feature chart
  function featureClick (clickEvent, subscription) {
    if (subscription === 'free') {
      setShowDisabledToast(true)
      return
    }
    const time =
      (clickEvent.nativeEvent.offsetX / featuresChartRef.current.width) *
      state.analysisData.track?.duration *
      2
    const kind = getFloorRowPosition(
      clickEvent.nativeEvent.offsetY * 2,
      fChartProps.rowHeight
    )
    const seekTime = binaryIndexOf.call(
      fChartProps.arrayLikes[kind],
      time,
      e => e.start,
      (element, index) => element
    )
    player.current?.seek(Math.floor((seekTime < 0 ? 0 : seekTime) * 1000)).catch(e => console.error(e))
    setCurrPosition(seekTime)
  }

  // draw feature chart
  function drawAnalysis (data) {
    cancelAnimationFrame(animReq.current)
    animReq.current = null
    const featuresChart = featuresChartRef.current
    const sVisual = songVisualRef.current

    featuresChart
      .getContext('2d', {
        willReadFrequently: true
      })
      .clearRect(0, 0, featuresChart.width, featuresChart.height)
    featuresChart.width = featuresChart.offsetWidth * 2
    featuresChart.height = featuresChart.offsetHeight * 2
    const width = featuresChart.width
    const height = featuresChart.height

    sVisual.width = featuresChart.offsetWidth
    sVisual.height = featuresChart.offsetHeight / 2

    const fChartCtx = featuresChart.getContext('2d')
    setSVisualProps({
      ...sVisualProps,
      width: sVisual.width,
      height: sVisual.height,
      centerX: sVisual.width / 2,
      centerY: sVisual.height / 2,
      radius: featuresChart.height / 8
    })
    fChartCtx.clearRect(0, 0, featuresChart.width, featuresChart.height)
    const arrayLikesEntries = Object.entries(data)
      .filter(entry => entry[1] instanceof Array && !entry.includes('tatums'))
      .sort((a, b) => a[1].length - b[1].length)
    const arrayLikesKeys = arrayLikesEntries.map(entry => entry[0])
    const arrayLikes = arrayLikesEntries.map(entry => entry[1])
    const rowHeight = height / (arrayLikes.length / 1.92)
    const markerHeight = getRowPosition(arrayLikes.length - 1) * rowHeight
    var beatsObj = {
      startTime: [],
      beatDuration: []
    }
    var pitchesObj = {
      startTime: [],
      pitch: [],
      pitchSectionI: []
    }

    const pitchNames = [
      'C',
      'C♯ / D♭',
      'D',
      'D♯ / E♭',
      'E',
      'F',
      'F♯ / G♭',
      'G',
      'G♯ / A♭',
      'A',
      'A♯ / B♭',
      'B'
    ]

    arrayLikes.forEach((arrayLike, arrayLikeIndex) => {
      const startY = getRowPosition(arrayLikeIndex) * rowHeight
      const arrayLikeHeight = rowHeight / (arrayLikeIndex + 1)
      let pitchSegment = null
      const key = arrayLikesKeys[arrayLikeIndex]

      arrayLike.forEach((section, sectionIndex) => {
        if (['sections', 'bars', 'beats'].includes(key)) {
          fChartCtx.fillStyle = colors[sectionIndex % colors.length]
          fChartCtx.fillRect(
            (section.start / data.track.duration) * width,
            startY,
            (section.duration / data.track.duration) * width,
            arrayLikeHeight
          )
          if (key === 'beats') {
            beatsObj['startTime'].push(section.start)
            beatsObj['beatDuration'].push(section.duration)
          }
        }
        if (key === 'segments' && section.confidence >= 0.7) {
          // find index of max pitch value; val of 1 indicates pure tone
          const maxPitchIndex = section.pitches.reduce(
            (iMax, val, i, arr) => (val > arr[iMax] ? i : iMax),
            0
          )
          if (maxPitchIndex === pitchSegment) return // skip if same pitch as previous
          pitchSegment = maxPitchIndex

          pitchesObj['pitchSectionI'].push(sectionIndex)
          pitchesObj['startTime'].push(section.start)
          pitchesObj['pitch'].push(pitchNames[maxPitchIndex] || null)

          fChartCtx.fillStyle = colors[maxPitchIndex] || null
          fChartCtx.fillRect(
            (section.start / data.track.duration) * width,
            getRowPosition(arrayLikeIndex) * rowHeight,
            data.track.duration * width,
            arrayLikeHeight
          )
        }
      })
      const label =
        key !== 'segments'
          ? key.charAt(0).toUpperCase() + key.slice(1)
          : 'Pitch'
      fChartCtx.fillStyle = '#000'
      fChartCtx.font = `bold ${
        arrayLikeHeight / (prevWidth.current < 576 ? 3 : 2.5)
      }px Circular`
      fChartCtx.fillText(label, 0, startY + arrayLikeHeight)
    })

    setFChartProps({
      ...fChartProps,
      rowHeight: rowHeight,
      arrayLikes: arrayLikes,
      pitchesObj: pitchesObj,
      beatsObj: beatsObj
    })

    let fChartImgData = null
    function provideAnimationFrame () {
      if (state.profileInfo.subscription === 'free') {
        fetch('https://api.spotify.com/v1/me/player/currently-playing', {
          headers: {
            Authorization: `Bearer ${session.user.accessToken}`
          }
        })
          .then(async e => {
            const data = await e.json()
            if (!animReq.current) return // exit animation
            if (!data?.item) {
              let isNull = true
              while (isNull) {
                try {
                  isNull = await checkNull()
                } catch (error) {
                  console.error('Error in checkNull:', error)
                  break
                }
              }
            } else if (data?.item) {
              if (!data.is_playing) {
                pauseTrack(player, setState)
              } else if (data.is_playing) {
                resumeTrack(player, setState)
              }
              if (
                resizeEvent.current ||
                state.spotifyObj.currentTrack !== data?.item.id
              ) {
                animReq.current = false
                resizeEvent.current = false
                if (state.spotifyObj.currentTrack !== data?.item.id)
                  syncPlayer(state, setState, session)
                else resizingAnalysis(data?.item.id)
              } else {
                setTimer({
                  ...timer,
                  progress: data.progress_ms,
                  duration: data.item.duration_ms
                })
                const currPosition = data.progress_ms / 1000
                setCurrPosition(currPosition)
                const markPosition =
                  (data.progress_ms / 1000 / (data.item.duration_ms / 1000)) *
                  width
                fChartCtx.clearRect(
                  0,
                  0,
                  featuresChart.width,
                  featuresChart.height
                )
                fChartCtx.putImageData(fChartImgData, 0, 0)
                fChartCtx.fillStyle = '#000'
                fChartCtx.fillRect(markPosition, 0, 5, markerHeight)
                animReq.current = requestAnimationFrame(provideAnimationFrame)
              }
            }
          })
          .catch(error => {
            console.error('Animation: ', error)
          })
      } else {
        player.current &&
          player.current
            .getCurrentState()
            .then(state => {
              if (!animReq.current) return // exit animation
              setTimer({
                ...timer,
                progress: state.position,
                duration: state.duration
              })
              const currPosition = state.position / 1000
              setCurrPosition(currPosition)
              const markPosition =
                (state.position / 1000 / (state.duration / 1000)) * width
              fChartCtx.clearRect(
                0,
                0,
                featuresChart.width,
                featuresChart.height
              )
              fChartCtx.putImageData(fChartImgData, 0, 0)
              fChartCtx.fillStyle = '#000'
              fChartCtx.fillRect(markPosition, 0, 5, markerHeight)
              animReq.current = requestAnimationFrame(provideAnimationFrame)
            })
            .catch(e => {
              console.error('Animation: ', e)
            })
      }
    }
    var fChartImg = new Image()

    fChartImg.src = featuresChart.toDataURL('png')

    fChartImg.onload = function () {
      fChartImgData = fChartCtx.getImageData(
        0,
        0,
        fChartImg.width,
        fChartImg.height
      )
      // start animation
      animReq.current = requestAnimationFrame(provideAnimationFrame)
    }
  }

  // easing function for transitions
  function easeInOutSine (currTime, begin, change, duration) {
    return (
      (-change / 2) * (Math.cos((Math.PI * currTime) / duration) - 1) + begin
    )
  }

  // binary search
  function binaryIndexOf (searchElement, valueof, valueout) {
    if (this?.length == null) return
    var minIndex = 0
    var maxIndex = this?.length - 1
    var currentIndex
    var currentElement

    while (minIndex <= maxIndex) {
      currentIndex = ((minIndex + maxIndex) / 2) | 0
      currentElement = valueof(this?.[currentIndex])

      if (
        currentElement < searchElement &&
        (currentIndex + 1 < this?.length
          ? valueof(this?.[currentIndex + 1])
          : Infinity) > searchElement
      ) {
        return valueout(currentElement, currentIndex, this)
      }
      if (currentElement < searchElement) {
        minIndex = currentIndex + 1
      } else if (currentElement > searchElement) {
        maxIndex = currentIndex - 1
      } else {
        return this?.[currentIndex]
      }
    }

    return -1
  }

  const getRowPosition = index =>
    index <= 0 ? 0 : 1 / index + getRowPosition(index - 1)

  const getFloorRowPosition = (searchPosition, rowHeight, i = 0, max = 4) =>
    i > max
      ? max
      : searchPosition < getRowPosition(i + 1) * rowHeight
      ? i
      : getFloorRowPosition(searchPosition, rowHeight, i + 1, max)

  // drawing on canvas
  function getVisType (sVisualCtx, currXPos, properties) {
    sVisualCtx.beginPath()
    if (state.visState.type === 'panorama') {
      sVisualCtx.rect(0, 1, properties.width, properties.height)
    } else if (state.visState.type === 'orb') {
      sVisualCtx.arc(
        currXPos,
        properties.centerY,
        properties.radius,
        0,
        2 * Math.PI
      )
    } else if (state.visState.type === 'pyramid') {
      sVisualCtx.moveTo(currXPos, 0)
      sVisualCtx.lineTo(currXPos + properties.width / 7, properties.height)
      sVisualCtx.lineTo(currXPos - properties.width / 7, properties.height)
    } else if (state.visState.type === 'block') {
      sVisualCtx.rect(currXPos / 2, 1, properties.width / 2, properties.height)
    }
    sVisualCtx.closePath()
    sVisualCtx.stroke()
    sVisualCtx.fill()
  }

  // resizing canvas
  function handleResizing () {
    if (state.featuresData && window.innerWidth !== prevWidth.current) {
      if (state.profileInfo.subscription !== 'free') {
        player.current
          .getCurrentState()
          .then(state => {
            if (
              state?.spotifyObj?.currentTrack !==
              state?.track_window?.current_track.id
            )
              syncPlayer(
                state,
                setState,
                session,
                state?.track_window?.current_track.id
              )
            else {
              resizingAnalysis(state?.track_window?.current_track.id)
            }
          })
          .catch(error => console.error(error))
      } else if (!resizeEvent.current) {
        resizeEvent.current = true
      }
      prevWidth.current = window.innerWidth
    }
  }

  async function checkNull () {
    try {
      const res = await fetch(
        'https://api.spotify.com/v1/me/player/currently-playing',
        {
          headers: {
            Authorization: `Bearer ${session.user.accessToken}`
          }
        }
      )
      const data = await res.json()
      return !data?.item
    } catch (error) {
      console.error(error)
    }
  }

  async function resizingAnalysis (id) {
    try {
      const res = await fetch(`/api/analysis?id=${id}`, {
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`
        }
      })
      const data = await res.json()
      drawAnalysis(data)
    } catch (error) {
      console.error(error)
    }
  } // helper function for resizing the canvas

  useEffect(() => {
    if (state.analysisData) drawAnalysis(state.analysisData)
    const debouncedResize = debounce(handleResizing, 200)
    window.addEventListener('resize', debouncedResize)
    return () => {
      cancelAnimationFrame(animReq.current)
      animReq.current = null
      window.removeEventListener('resize', debouncedResize)
    }
  }, [state.analysisData])

  useEffect(() => {
    if (currPosition === 0) {
      setBeatCounter(0)
      prevBeatCounter.current = 0
      setPitchCounter(0)
    }
    if (
      fChartProps.pitchesObj?.['startTime'].length !== 0 &&
      fChartProps.beatsObj?.['startTime'].length !== 0 &&
      currPosition > 0
    ) {
      const seekPitch = binaryIndexOf.call(
        fChartProps.pitchesObj['startTime'],
        currPosition,
        e => e,
        (__, index) => index
      )
      const seekBeat = binaryIndexOf.call(
        fChartProps.beatsObj['startTime'],
        currPosition,
        e => e,
        (__, index) => index
      )
      setDominantPitch(fChartProps.pitchesObj?.['pitch'][seekPitch])
      setPitchCounter(seekPitch)
      setBeatCounter(seekBeat)
    }
  }, [currPosition])

  useEffect(() => {
    if (pitchCounter == -1) {
      setPitchCounter(0)
    }
  }, [pitchCounter])

  useEffect(() => {
    if (beatCounter == -1) {
      setBeatCounter(0)
      prevBeatCounter.current = 0
    } else if (
      beatCounter !== fChartProps.beatsObj?.['startTime'].length &&
      Math.abs(
        currPosition - fChartProps.beatsObj?.['startTime'][beatCounter]
      ) < 0.5
    ) {
      // pitch and beat sync/animation
      if (
        pitchCounter !== -1 &&
        pitchCounter !== fChartProps.pitchesObj?.['startTime'].length &&
        Math.fround(currPosition) >
          Math.fround(fChartProps.pitchesObj?.['startTime'][pitchCounter])
      ) {
        setDominantPitch(fChartProps.pitchesObj?.['pitch'][pitchCounter])
      }
      if (
        Math.fround(currPosition) >=
          Math.fround(fChartProps.beatsObj?.['startTime'][beatCounter]) ||
        currPosition === 0
      ) {
        if (state.visState.on) {
          const sVisual = songVisualRef.current
          const sVisualCtx = sVisual.getContext('2d', {
            willReadFrequently: true
          })
          sVisualCtx.clearRect(0, 0, sVisual.width, sVisual.height)
          sVisualCtx.fillStyle =
            allPitches[fChartProps.pitchesObj?.['pitch'][pitchCounter]]
          sVisualCtx.strokeStyle = '#000'
          sVisualCtx.lineWidth = 2

          drawFrame(
            cycleLoop[beatCounter % cycleLoop.length],
            0,
            ((currPosition / state.analysisData.track.duration) *
              sVisualProps.centerX) /
              1.1,
            7.5
          )
          getVisType(
            sVisualCtx,
            easeInOutSine(
              currPosition,
              sVisualProps.centerX,
              0,
              fChartProps.beatsObj?.['beatDuration'][beatCounter]
            ),
            sVisualProps
          )

          if (state.visState.type !== 'block') {
            getVisType(
              sVisualCtx,
              easeInOutSine(
                currPosition,
                sVisualProps.centerX / 2,
                0,
                fChartProps.beatsObj?.['beatDuration'][beatCounter]
              ),
              sVisualProps
            )
            getVisType(
              sVisualCtx,
              easeInOutSine(
                currPosition,
                sVisualProps.width - sVisualProps.centerX / 2,
                0,
                fChartProps.beatsObj?.['beatDuration'][beatCounter]
              ),
              sVisualProps
            )
          }
        }
        if (prevBeatCounter.current !== beatCounter)
          prevBeatCounter.current = beatCounter
      }
    }
  }, [beatCounter, pitchCounter, sVisualProps, state.visState.type])

  return (
    <>
      <hr className='dividerLine' />
      <div
        id='features-chart-container'
        ref={featuresChartContainer}
        style={{
          backgroundColor:
            'rgba(' +
            state.artCover.color?.rgbVibrant[0] +
            ', ' +
            state.artCover.color?.rgbVibrant[1] +
            ', ' +
            state.artCover.color?.rgbVibrant[2] +
            ', 0.3)',
          border:
            '2px solid rgb(' +
            state.artCover.color?.rgbMuted[0] +
            ', ' +
            state.artCover.color?.rgbMuted[1] +
            ', ' +
            state.artCover.color?.rgbMuted[2] +
            ')'
        }}
      >
        <Container fluid>
          <Row>
            <Col className='d-flex flex-column px-0'>
              <button className='btn' id='fullScreenBtn' onClick={doFullScreen}>
                <i className='bi bi-fullscreen' />
              </button>
            </Col>
          </Row>
        </Container>
        <canvas
          id='features-chart'
          ref={featuresChartRef}
          onClick={event => {
            featureClick(event, state.profileInfo.subscription)
          }}
        ></canvas>
        <canvas
          className={state.visState.on ? 'd-block' : 'd-none'}
          id='song-visual'
          ref={songVisualRef}
        ></canvas>
        <ToastContainer
          className='p-3 position-fixed'
          position='bottom-end'
          id='toastDiv'
        >
          <Toast
            onClose={() => setShowSimToast(false)}
            show={showSimToast}
            className='text-center trackOptionsToast'
            delay='2500'
            autohide
          >
            <Toast.Body>
              Now showing{' '}
              <span style={{ color: '#525366' }}>Similar Songs</span>
            </Toast.Body>
          </Toast>
          <Toast
            onClose={() => setShowSongToast({ ...showSongToast, added: false })}
            show={showSongToast.added}
            className='text-center trackOptionsToast'
            delay='2000'
            autohide
          >
            <Toast.Body>Added to Liked Songs</Toast.Body>
          </Toast>
          <Toast
            onClose={() =>
              setShowSongToast({ ...showSongToast, removed: false })
            }
            show={showSongToast.removed}
            className='text-center trackOptionsToast'
            id='removeSongToast'
            delay='2000'
            autohide
          >
            <Toast.Body>Removed from Liked Songs</Toast.Body>
          </Toast>
          <Toast
            onClose={() =>
              setShowPlistToast({ ...showPlistToast, added: false })
            }
            show={showPlistToast.added}
            className='text-center trackOptionsToast'
            delay='2000'
            autohide
          >
            <Toast.Body>Song added to playlist</Toast.Body>
          </Toast>
          <Toast
            onClose={() =>
              setShowPlistToast({ ...showPlistToast, removed: false })
            }
            show={showPlistToast.removed}
            className='text-center trackOptionsToast'
            delay='2000'
            autohide
          >
            <Toast.Body>Song removed from playlist</Toast.Body>
          </Toast>
          <Toast
            onClose={() => setShowDisabledToast(false)}
            show={showDisabledToast}
            className='text-center trackOptionsToast'
            delay='2000'
            autohide
          >
            <Toast.Body>Control disabled (premium feature)</Toast.Body>
          </Toast>
        </ToastContainer>
        <BottomPlayer
          setShowDisabledToast={setShowDisabledToast}
          setShowPlistToast={setShowPlistToast}
          setShowSongToast={setShowSongToast}
          setShowSimToast={setShowSimToast}
          timer={timer}
          dominantPitch={dominantPitch}
          currPitch={
            allPitches[fChartProps.pitchesObj?.['pitch'][pitchCounter]]
          }
        />
      </div>
    </>
  )
}
