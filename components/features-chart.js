import BottomPlayer from './bottom-player'
import Toast from 'react-bootstrap/Toast'
import ToastContainer from 'react-bootstrap/ToastContainer'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import { useEffect, useRef, useState, useContext } from 'react'
import { AnalysisContext } from '../utils/context'
import { useSession } from 'next-auth/react'
import { resumeTrack, pauseTrack, syncPlayer } from '../utils/funcs'

// component for the features chart
export default function FeaturesChart () {
  const { data: session } = useSession()
  const [state, setState, player] = useContext(AnalysisContext)
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
  const [windowSmall, setWindowSmall] = useState(null)
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

  function checkWindowWidth () {
    if (window.innerWidth < 768) {
      // dropdown view depending on screen width
      setWindowSmall(true)
    } else {
      setWindowSmall(false)
    }
  }

  function doFullScreen () {
    if (featuresChartContainer.current.requestFullscreen) {
      featuresChartContainer.current.requestFullscreen()
    } else if (featuresChartContainer.current.webkitRequestFullscreen) {
      featuresChartContainer.current.webkitRequestFullscreen()
    } else if (featuresChartContainer.current.mozRequestFullscreen) {
      featuresChartContainer.current.mozRequestFullscreen()
    } else if (featuresChartContainer.current.msRequestFullscreen) {
      featuresChartContainer.current.msRequestFullscreen()
    } else if (featuresChartContainer.current.mozEnterFullScreen) {
      featuresChartContainer.current.mozEnterFullScreen()
    } else if (featuresChartContainer.current.webkitEnterFullScreen) {
      featuresChartContainer.current.webkitEnterFullScreen()
    } else if (featuresChartContainer.current.msEnterFullScreen) {
      featuresChartContainer.current.msEnterFullScreen()
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
      state.analysisData.track.duration *
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
    player.current
      ?.seek(Math.floor((seekTime < 0 ? 0 : seekTime) * 1000))
      .catch(e => console.log(e))
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

    arrayLikes.forEach((arrayLike, arrayLikeIndex) => {
      const startY = getRowPosition(arrayLikeIndex) * rowHeight
      const arrayLikeHeight = rowHeight / (arrayLikeIndex + 1)
      let pitchSegment = null
      arrayLike.forEach((section, sectionIndex) => {
        if (
          (arrayLikesKeys[arrayLikeIndex] == 'sections' ||
            arrayLikesKeys[arrayLikeIndex] == 'bars' ||
            arrayLikesKeys[arrayLikeIndex] == 'beats') &&
          arrayLikesKeys[arrayLikeIndex] != undefined
        ) {
          fChartCtx.fillStyle = colors[sectionIndex % colors.length]
          fChartCtx.fillRect(
            (section.start / data.track.duration) * width,
            getRowPosition(arrayLikeIndex) * rowHeight,
            (section.duration / data.track.duration) * width,
            arrayLikeHeight
          )
          if (arrayLikesKeys[arrayLikeIndex] == 'beats') {
            beatsObj['startTime'].push(section.start)
            beatsObj['beatDuration'].push(section.duration)
          }
        }
        if (
          arrayLikesKeys[arrayLikeIndex] == 'segments' &&
          section.confidence >= 0.7
        ) {
          if (section.pitches.indexOf(1) === pitchSegment) {
            return
          }
          pitchSegment = section.pitches.indexOf(1) // pitch val of 1 indicates pure tone
          pitchesObj['pitchSectionI'].push(sectionIndex)

          switch (pitchSegment) {
            case 0:
              pitchesObj['startTime'].push(section.start)
              pitchesObj['pitch'].push('C')
              fChartCtx.fillStyle = colors[0]
              break
            case 1:
              pitchesObj['startTime'].push(section.start)
              pitchesObj['pitch'].push('C♯ / D♭')
              fChartCtx.fillStyle = colors[1]
              break
            case 2:
              pitchesObj['startTime'].push(section.start)
              pitchesObj['pitch'].push('D')
              fChartCtx.fillStyle = colors[2]
              break
            case 3:
              pitchesObj['startTime'].push(section.start)
              pitchesObj['pitch'].push('D♯ / E♭')
              fChartCtx.fillStyle = colors[3]
              break
            case 4:
              pitchesObj['startTime'].push(section.start)
              pitchesObj['pitch'].push('E')
              fChartCtx.fillStyle = colors[4]
              break
            case 5:
              pitchesObj['startTime'].push(section.start)
              pitchesObj['pitch'].push('F')
              fChartCtx.fillStyle = colors[5]
              break
            case 6:
              pitchesObj['startTime'].push(section.start)
              pitchesObj['pitch'].push('F♯ / G♭')
              fChartCtx.fillStyle = colors[6]
              break
            case 7:
              pitchesObj['startTime'].push(section.start)
              pitchesObj['pitch'].push('G')
              fChartCtx.fillStyle = colors[7]
              break
            case 8:
              pitchesObj['startTime'].push(section.start)
              pitchesObj['pitch'].push('G♯ / A♭')
              fChartCtx.fillStyle = colors[8]
              break
            case 9:
              pitchesObj['startTime'].push(section.start)
              pitchesObj['pitch'].push('A')
              fChartCtx.fillStyle = colors[9]
              break
            case 10:
              pitchesObj['startTime'].push(section.start)
              pitchesObj['pitch'].push('A♯ / B♭')
              fChartCtx.fillStyle = colors[10]
              break
            case 11:
              pitchesObj['startTime'].push(section.start)
              pitchesObj['pitch'].push('B')
              fChartCtx.fillStyle = colors[11]
              break
            default:
              pitchesObj['startTime'].push(null)
              pitchesObj['pitch'].push(null)
          }
          fChartCtx.fillRect(
            (section.start / data.track.duration) * width,
            getRowPosition(arrayLikeIndex) * rowHeight,
            data.track.duration * width,
            arrayLikeHeight
          )
        }
      })
      if (arrayLikesKeys[arrayLikeIndex] != 'segments') {
        const label =
          arrayLikesKeys[arrayLikeIndex].charAt(0).toUpperCase() +
          arrayLikesKeys[arrayLikeIndex].slice(1)
        fChartCtx.fillStyle = '#000'
        fChartCtx.font = `bold ${arrayLikeHeight / 2.5}px Circular`
        fChartCtx.fillText(label, 0, startY + arrayLikeHeight)
      } else {
        fChartCtx.fillStyle = '#000'
        fChartCtx.font = `bold ${arrayLikeHeight / 2.5}px Circular`
        fChartCtx.fillText('Pitch', 0, startY + arrayLikeHeight)
      }
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
              /* do special case for a chosen song 
              from Spotify client (free users) */
              doneResizing(true)
              return
            } else if (data?.item) {
              if (!data.is_playing) {
                pauseTrack(player, setState)
              } else if (data.is_playing) {
                resumeTrack(player, setState)
              }
              if (
                resizeEvent.current ||
                state.spotifyObj.currentTrack !== data.item.id
              ) {
                animReq.current = false
                resizeEvent.current = false
                syncPlayer(state, setState, session)
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
            console.log('Animation: ', error)
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
    index === 0 ? 0 : 1 / index + getRowPosition(index - 1)

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
  function doneResizing (specialCase = false) {
    if (state.featuresData || specialCase) {
      fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`
        }
      })
        .then(async e => {
          const data = await e.json()
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
            /* do special case for a chosen song 
            from Spotify client (free users) */
            doneResizing(true)
            return
          }
          if (
            state.spotifyObj.currentTrack &&
            !resizeEvent.current &&
            !specialCase
          ) {
            resizeEvent.current = true
          }
          if (
            state.profileInfo.subscription === 'free' &&
            state.spotifyObj.currentTrack !== data.item.id
          ) {
            syncPlayer(state, setState, session)
          } else if (
            state.spotifyObj.currentTrack &&
            (!data.is_playing || data.is_playing) &&
            data.item.id === state.spotifyObj.currentTrack
          ) {
            resizingAnalysis(data.item.id)
          }
        })
        .catch(error => {
          console.log(error)
        })
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
      console.log(error)
    }
  }

  function resizingAnalysis (id) {
    if (state.spotifyObj.currentTrack) {
      resetCanvas(id)
    }
  } // helper function when resizing canvas

  async function resetCanvas (id) {
    let query = '/api/analysis?id=' + id
    const e = await fetch(query, {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`
      }
    })
    const data = await e.json()
    drawAnalysis(data)
  }

  function debounce (func, delay) {
    let timeoutId
    return function (...args) {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func.apply(this, args)
      }, delay)
    }
  } // after a delay, a function executes once

  useEffect(() => {
    if (state.analysisData && state.featuresData && state.artCover) {
      drawAnalysis(state.analysisData)
    }
    function handleResize () {
      checkWindowWidth()
      doneResizing()
    }
    const debouncedResize = debounce(handleResize, 200)
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

  useEffect(() => {
    checkWindowWidth()
  }, [])

  return (
    <>
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
          showPlistToast={showPlistToast}
          setShowPlistToast={setShowPlistToast}
          showSongToast={showSongToast}
          setShowSongToast={setShowSongToast}
          windowSmall={windowSmall}
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
