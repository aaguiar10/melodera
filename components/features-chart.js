import Link from 'next/link'
import NextImage from 'next/image'
import { useEffect, useRef, useState, Fragment } from 'react'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import SpotifyLogo from '../public/images/spotify_logo.png'
import Dropdown from 'react-bootstrap/Dropdown'
import Toast from 'react-bootstrap/Toast'
import ToastContainer from 'react-bootstrap/ToastContainer'

export default function FeaturesChart ({
  funcs,
  artCover,
  isPaused,
  token,
  player,
  analysisData,
  featuresData,
  fChartState,
  userInfo,
  spotifyObj
}) {
  const [windowSmall, setWindowSmall] = useState(null)
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
  const [timer, setTimer] = useState(null)
  const [dominantPitch, setDominantPitch] = useState(null)
  const [showSaveSongToast, setShowSaveSongToast] = useState(false)
  const [showAddToPlistToast, setShowAddToPlistToast] = useState(false)
  const featuresChartRef = useRef(null)
  const songVisualRef = useRef(null)
  const colors = [
    'rgba(238, 229, 107, 1)',
    'rgba(242, 187, 143, 1)',
    'rgba(250, 243, 221, 1)',
    'rgba(150, 220, 189, 1)',
    'rgba(158, 170, 219, 1)',
    'rgba(105, 108, 128, 1)'
  ]

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

  // for chart clicks or activating visuals (depending on visState)
  function featureClick (clickEvent, optional = null) {
    if (userInfo.subscription === 'free' && !optional) {
      return
    }
    const time =
      optional ??
      (clickEvent.nativeEvent.offsetX / featuresChartRef.current.width) *
        analysisData.track.duration *
        2
    const kind =
      optional ??
      getFloorRowPosition(
        clickEvent.nativeEvent.offsetY * 2,
        fChartProps.rowHeight
      )
    const seekTime =
      optional ??
      binaryIndexOf.call(
        fChartProps.arrayLikes[kind],
        time,
        e => e.start,
        (element, index) => element
      )
    fetch(
      `/api/v1/me/player/seek?position_ms=${Math.floor(
        (seekTime < 0 ? 0 : seekTime) * 1000
      )}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ).catch(e => console.log(e))

    if (fChartProps.pitchesObj['startTime'].length !== 0) {
      const seekPitch = binaryIndexOf.call(
        fChartProps.pitchesObj['startTime'],
        time,
        e => e,
        (element, index) => index
      )
      setDominantPitch(fChartProps.pitchesObj?.['pitch'][seekPitch])
      setPitchCounter(seekPitch)
    }

    if (fChartProps.beatsObj['startTime'].length !== 0) {
      const seekBeat = binaryIndexOf.call(
        fChartProps.beatsObj['startTime'],
        time,
        e => e,
        (element, index) => index
      )
      setBeatCounter(seekBeat)
      prevBeatCounter.current = seekBeat - 1
    }
  }

  // draw feature chart
  function drawAnalysis (data) {
    cancelAnimationFrame(animReq.current)
    animReq.current = null
    const featuresChart = featuresChartRef.current
    const sVisual = songVisualRef.current

    featuresChart
      .getContext('2d')
      .clearRect(0, 0, featuresChart.width, featuresChart.height)
    sVisual.getContext('2d').clearRect(0, 0, sVisual.width, sVisual.height)
    featuresChart.width = featuresChart.offsetWidth * 2
    featuresChart.height = featuresChart.offsetHeight * 2
    const width = featuresChart.width
    const height = featuresChart.height

    sVisual.width = featuresChart.offsetWidth
    sVisual.height = 200

    const fChartCtx = featuresChart.getContext('2d', {
      willReadFrequently: true
    })
    setSVisualProps({
      ...sVisualProps,
      width: sVisual.width,
      height: sVisual.height,
      centerX: sVisual.width / 2,
      centerY: sVisual.height / 2,
      radius: featuresChart.height / 8
    })
    const sVisualCtx = sVisual.getContext('2d', { willReadFrequently: true })
    featuresChart
      .getContext('2d')
      .clearRect(0, 0, featuresChart.width, featuresChart.height)
    sVisual.getContext('2d').clearRect(0, 0, sVisual.width, sVisual.height)
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
          section.confidence >= 0.75
        ) {
          if (section.pitches.indexOf(1) === pitchSegment) {
            return
          }
          pitchSegment = section.pitches.indexOf(1) // pitch val of 1 indicates pure tone
          fChartCtx.fillStyle = colors[sectionIndex % colors.length]
          pitchesObj['pitchSectionI'].push(sectionIndex)
          fChartCtx.fillRect(
            (section.start / data.track.duration) * width,
            getRowPosition(arrayLikeIndex) * rowHeight,
            data.track.duration * width,
            arrayLikeHeight
          )

          switch (pitchSegment) {
            case 0:
              pitchesObj['startTime'].push(section.start)
              pitchesObj['pitch'].push('C')
              break
            case 1:
              pitchesObj['startTime'].push(section.start)
              pitchesObj['pitch'].push('C♯/D♭')
              break
            case 2:
              pitchesObj['startTime'].push(section.start)
              pitchesObj['pitch'].push('D')
              break
            case 3:
              pitchesObj['startTime'].push(section.start)
              pitchesObj['pitch'].push('D♯/E♭')
              break
            case 4:
              pitchesObj['startTime'].push(section.start)
              pitchesObj['pitch'].push('E')
              break
            case 5:
              pitchesObj['startTime'].push(section.start)
              pitchesObj['pitch'].push('F')
              break
            case 6:
              pitchesObj['startTime'].push(section.start)
              pitchesObj['pitch'].push('F♯/G♭')
              break
            case 7:
              pitchesObj['startTime'].push(section.start)
              pitchesObj['pitch'].push('G')
              break
            case 8:
              pitchesObj['startTime'].push(section.start)
              pitchesObj['pitch'].push('G♯/A♭')
              break
            case 9:
              pitchesObj['startTime'].push(section.start)
              pitchesObj['pitch'].push('A')
              break
            case 10:
              pitchesObj['startTime'].push(section.start)
              pitchesObj['pitch'].push('A♯/B♭')
              break
            case 11:
              pitchesObj['startTime'].push(section.start)
              pitchesObj['pitch'].push('B')
              break
            default:
              pitchesObj['startTime'].push(null)
              pitchesObj['pitch'].push(null)
          }
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
    let sVisualImgLoaded = false
    function provideAnimationFrame () {
      if (userInfo.subscription === 'free') {
        fetch('https://api.spotify.com/v1/me/player/currently-playing', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
          .then(e => e.json())
          .then(data => {
            if (!animReq.current) return // exit animation
            if (!data?.item) {
              let isNull = true
              while (isNull) {
                isNull = checkNull()
              }
              /* do special case for a chosen song 
              from Spotify client (free users) */
              doneResizing(true)
              return
            } else if (data?.item) {
              if (spotifyObj.currentTrack !== data.item.id) {
                animReq.current = false
                doneResizing()
                return
              }
              if (!data.is_playing) {
                funcs.pauseVidAuto()
              } else if (data.is_playing) {
                funcs.resumeVidAuto()
              }
              if (resizeEvent.current) {
                animReq.current = false
                resizeEvent.current = false
                return
              } else {
                setTimer(
                  (((data.progress_ms % 60000) / 1000).toFixed(0) == 60
                    ? Math.floor(data.progress_ms / 60000) + 1 + ':00'
                    : Math.floor(data.progress_ms / 60000) +
                      ':' +
                      (((data.progress_ms % 60000) / 1000).toFixed(0) < 10
                        ? '0'
                        : '') +
                      ((data.progress_ms % 60000) / 1000).toFixed(0)) +
                    ' / ' +
                    ~~(((data.item.duration_ms / 1000) % 3600) / 60) +
                    ':' +
                    (~~(data.item.duration_ms / 1000) % 60 < 10 ? '0' : '') +
                    (~~(data.item.duration_ms / 1000) % 60)
                )

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
                if (sVisualImgLoaded) sVisualCtx.drawImage(sVisualImg, 0, 0)
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
              setTimer(
                (((state.position % 60000) / 1000).toFixed(0) == 60
                  ? Math.floor(state.position / 60000) + 1 + ':00'
                  : Math.floor(state.position / 60000) +
                    ':' +
                    (((state.position % 60000) / 1000).toFixed(0) < 10
                      ? '0'
                      : '') +
                    ((state.position % 60000) / 1000).toFixed(0)) +
                  ' / ' +
                  ~~(((state.duration / 1000) % 3600) / 60) +
                  ':' +
                  (~~(state.duration / 1000) % 60 < 10 ? '0' : '') +
                  (~~(state.duration / 1000) % 60)
              )
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
              if (sVisualImgLoaded) sVisualCtx.drawImage(sVisualImg, 0, 0)
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
    var sVisualImg = new Image()

    fChartImg.src = featuresChart.toDataURL('png')
    sVisualImg.src = sVisual.toDataURL('png')
    sVisualImg.onload = function () {
      sVisualImgLoaded = true
    }
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
  function getVisType (sVisualCtx, currXPos, properties, songPlaying = true) {
    if (localStorage.getItem('beat_visualizer_type') === 'mix') {
      if (songPlaying) var pick = Math.floor(Math.random() * 3)
      if (pick === 0) {
        sVisualCtx.arc(
          currXPos,
          properties.centerY,
          properties.radius,
          0,
          2 * Math.PI
        )
      } else if (pick === 1) {
        sVisualCtx.moveTo(currXPos, 0)
        sVisualCtx.lineTo(currXPos + properties.width / 9, properties.height)
        sVisualCtx.lineTo(currXPos - properties.width / 9, properties.height)
        sVisualCtx.closePath()
      } else {
        sVisualCtx.rect(currXPos, 0, properties.width / 6, properties.height)
      }
    } else if (localStorage.getItem('beat_visualizer_type') === 'circle') {
      sVisualCtx.arc(
        currXPos,
        properties.centerY,
        properties.radius,
        0,
        2 * Math.PI
      )
    } else if (localStorage.getItem('beat_visualizer_type') === 'triangle') {
      sVisualCtx.moveTo(currXPos, 0)
      sVisualCtx.lineTo(currXPos + properties.width / 9, properties.height)
      sVisualCtx.lineTo(currXPos - properties.width / 9, properties.height)
      sVisualCtx.closePath()
    } else if (localStorage.getItem('beat_visualizer_type') === 'square') {
      sVisualCtx.rect(currXPos, 0, properties.width / 6, properties.height)
    }
  }

  // show similar songs using current song's properties
  function showSimilar () {
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
        userInfo.country +
        '&limit=4',
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
      .then(e => e.json())
      .then(data => {
        fChartState.setFChartData(prev => ({
          ...prev,
          recommendations: data
        }))
      })
  }

  function popPlist () {
    fetch('/api/v1/me/playlists?limit=50', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(e => e.json())
      .then(data => {
        fChartState.setFChartData(prev => ({
          ...prev,
          playlists: data
        }))
      })
      .catch(error => {
        console.log(error)
      })
  } // show playlists in dropdown

  function addTrack2Plist (track, playlist) {
    fetch('/api/v1/me/addToPlist?playlist=' + playlist + '&track=' + track, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(() => {
        setShowAddToPlistToast(true)
      })
      .catch(e => console.error(e))
  } // add to playlist functionality

  function saveCurrTrack () {
    fetch('/api/v1/me/saveTrack?id=' + spotifyObj.currentTrack, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(() => {
        setShowSaveSongToast(true)
      })
      .catch(e => console.error(e))
  } // save track functionality

  // resizing canvas
  function doneResizing (specialCase = false) {
    if (featuresData || specialCase) {
      fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(e => e.json())
        .then(data => {
          if (!data?.item) {
            let isNull = true
            while (isNull) {
              isNull = checkNull()
            }
            /* do special case for a chosen song 
            from Spotify client (free users) */
            doneResizing(true)
            return
          }
          if (spotifyObj.currentTrack && !resizeEvent.current && !specialCase) {
            resizeEvent.current = true
          }
          if (
            userInfo.subscription === 'free' &&
            spotifyObj.currentTrack !== data.item.id
          ) {
            funcs.syncPlayer()
          } else if (
            spotifyObj.currentTrack &&
            !data.is_playing &&
            data.item.id === spotifyObj.currentTrack
          ) {
            resizingAnalysis(data.item.id)
          } else if (
            spotifyObj.currentTrack &&
            data.is_playing &&
            data.item.id === spotifyObj.currentTrack
          ) {
            resizingAnalysis(data.item.id)
          }
        })
        .catch(error => {
          console.log(error)
        })
    }
  }

  function checkNull () {
    fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(e => e.json())
      .then(data => {
        if (data?.item) return true
        else return false
      })
      .catch(error => {
        console.log(error)
      })
  }

  function resizingAnalysis (id) {
    if (spotifyObj.currentTrack) {
      resetCanvas(id)
    }
  } // helper function when resizing canvas

  async function resetCanvas (id) {
    let query = '/api/analysis?id=' + id
    const e = await fetch(query, {
      headers: {
        Authorization: `Bearer ${token}`
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
    if (analysisData && featuresData && artCover) {
      drawAnalysis(analysisData)
    }
    function handleResize () {
      if (window.innerWidth < 476) {
        // dropdown view depending on device width
        setWindowSmall(true)
      } else {
        setWindowSmall(false)
      }
      doneResizing()
    }
    const debouncedResize = debounce(handleResize, 600)
    window.addEventListener('resize', debouncedResize)
    return () => {
      cancelAnimationFrame(animReq.current)
      window.removeEventListener('resize', debouncedResize)
    }
  }, [analysisData, featuresData, artCover])

  useEffect(() => {
    if (
      fChartProps.beatsObj?.['startTime'].length !== 0 &&
      fChartState.visState
    ) {
      featureClick(null, 0) // show shape visuals
    }
  }, [fChartProps, fChartState.visState])

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
        (element, index) => index
      )
      const seekBeat = binaryIndexOf.call(
        fChartProps.beatsObj['startTime'],
        currPosition,
        e => e,
        (element, index) => index
      )
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
        Math.fround(currPosition) >
        Math.fround(fChartProps.beatsObj?.['startTime'][beatCounter])
      ) {
        const sVisual = songVisualRef.current
        const sVisualCtx = sVisual.getContext('2d')
        sVisualCtx.clearRect(0, 0, sVisual.width, sVisual.height)

        sVisualCtx.beginPath()
        sVisualCtx.fillStyle =
          colors[
            fChartProps.pitchesObj?.['pitchSectionI'][pitchCounter] %
              colors.length
          ]
        sVisualCtx.strokeStyle = '000'
        sVisualCtx.lineWidth = 0.5
        if (prevBeatCounter.current === beatCounter) {
          getVisType(
            sVisualCtx,
            easeInOutSine(
              currPosition,
              sVisualProps.centerX - sVisualProps.centerX / 2,
              sVisualProps.centerX,
              fChartProps.beatsObj?.['beatDuration'][beatCounter]
            ),
            sVisualProps,
            !isPaused
          )
          sVisualCtx.fill()
          sVisualCtx.stroke()
        } else {
          prevBeatCounter.current = beatCounter
        }
        setBeatCounter(beatCounter + 1)
      }
    }
  }, [beatCounter])

  return (
    <>
      <div
        id='features-chart-container'
        ref={featuresChartContainer}
        style={{
          backgroundColor:
            'rgba(' +
            artCover.color?.rgbVibrant[0] +
            ', ' +
            artCover.color?.rgbVibrant[1] +
            ', ' +
            artCover.color?.rgbVibrant[2] +
            ', 0.3)'
        }}
      >
        <div
          id='cover_and_play'
          style={{
            border:
              '5px solid rgb(' +
              artCover.color?.rgbMuted[0] +
              ', ' +
              artCover.color?.rgbMuted[1] +
              ', ' +
              artCover.color?.rgbMuted[2] +
              ')'
          }}
        >
          <Link
            id='linkalbum'
            style={{ margin: 'auto' }}
            href={artCover.link ?? 'https://www.spotify.com'}
            target='_blank'
            rel='noreferrer'
            aria-label='Go to album on spotify'
          >
            <NextImage
              className='img-fluid'
              id='spotiflogo'
              src={SpotifyLogo}
              width={100}
              alt='spotify logo'
              priority
            />
            {artCover.image && (
              <NextImage
                id='artcover'
                className='img-fluid'
                src={artCover.image}
                width={300}
                height={300}
                alt='cover'
                priority
              />
            )}
          </Link>
          <div id='play'>
            <div className='playpausebutton'>
              <div
                className={isPaused ? 'd-block' : 'd-none'}
                id='playedButton'
              >
                <button
                  disabled={userInfo.subscription === 'free'}
                  className='paused'
                  id='resume-btn'
                  onClick={funcs.resumeVid}
                ></button>
              </div>
              <div
                className={isPaused ? 'd-none' : 'd-block'}
                id='pausedButton'
              >
                <button
                  disabled={userInfo.subscription === 'free'}
                  className='played'
                  id='pause-btn'
                  onClick={funcs.pauseVid}
                ></button>
              </div>
            </div>
            <div id='bpmdisplay'>
              <div className='displaybpm'>
                <p id='BPM'>{Math.round(featuresData?.tempo) + ' BPM'}</p>
              </div>

              <div
                aria-live='polite'
                aria-atomic='true'
                className='position-relative'
                id='toastDiv'
              >
                <ToastContainer className='p-3' position='top-end'>
                  <Toast
                    onClose={() => setShowSaveSongToast(false)}
                    show={showSaveSongToast}
                    className='align-items-center'
                    id='saveSongToast'
                    delay='3000'
                    autohide
                  >
                    <Toast.Body>Song saved</Toast.Body>
                  </Toast>

                  <Toast
                    onClose={() => setShowAddToPlistToast(false)}
                    show={showAddToPlistToast}
                    className='align-items-center'
                    id='addToPlistToast'
                    delay='3000'
                    autohide
                  >
                    <Toast.Body>Song added to playlist</Toast.Body>
                  </Toast>
                </ToastContainer>
              </div>
              <button className='btn' id='fullScreenBtn' onClick={doFullScreen}>
                <i className='bi bi-fullscreen'></i>
              </button>
            </div>
            <div id='displaysongstuff'>
              <p id='timer'>{timer}</p>
            </div>
            <div className='bpmKey'>
              <span id='bpmAndKey'>
                Key:{' '}
                <span id='keyOfT'>
                  {featuresData?.key}
                  {featuresData?.mode == 1 ? ' Major' : ' Minor'}
                </span>
                <span style={{ fontSize: 'x-large' }}> | </span>
                Pitch:
                <span id='domPitch'>
                  {dominantPitch ? ' ' + dominantPitch : ''}
                </span>
                <br />
                {featuresData?.time_signature + ' beats per bar\n'}
              </span>
              <span id='instrumental'>
                <br />
                <span style={{ textDecoration: 'overline' }}>
                  Mood:{' '}
                  {featuresData?.valence >= 0.5
                    ? 'positivity and/or happiness'
                    : 'tension and/or melancholy'}
                </span>
                <br />
                {featuresData?.instrumentalness >= 0.7 ? 'Instrumental' : ''}
              </span>
            </div>
            <div className='d-flex float-start' id='hideSongs'>
              <ButtonGroup className='trackOptions' vertical size='sm'>
                <button
                  className='btn btn-sm btn-aubergine'
                  id='showSimBtn'
                  onClick={showSimilar}
                >
                  Show similar
                </button>
                <ButtonGroup id='partialSimBtns' style={{ height: '50%' }}>
                  <button
                    className='btn btn-sm btn-aubergine'
                    id='save-track-btn'
                    onClick={saveCurrTrack}
                  >
                    Save song
                  </button>
                  <Dropdown
                    as={ButtonGroup}
                    drop={!windowSmall ? 'end' : 'up-centered'}
                    onClick={popPlist}
                  >
                    <Dropdown.Toggle
                      variant='aubergine'
                      size='sm'
                      id='add2PlistBtn'
                    >
                      Add to playlist
                    </Dropdown.Toggle>
                    <Dropdown.Menu className='text-center' id='plistOptions'>
                      {fChartState.fChartData?.playlists?.items?.length ===
                      0 ? (
                        <Dropdown.Item disabled>Nothing found</Dropdown.Item>
                      ) : (
                        fChartState.fChartData?.playlists?.items?.map(
                          (result, index) =>
                            result.owner.id === userInfo.username ||
                            result.collaborative === true ? (
                              <Dropdown.Item
                                key={result.id}
                                onClick={() => {
                                  addTrack2Plist(
                                    spotifyObj.currentTrack,
                                    result.id
                                  )
                                }}
                              >
                                {result.name}
                              </Dropdown.Item>
                            ) : (
                              <Fragment key={index}></Fragment>
                            )
                        )
                      )}
                    </Dropdown.Menu>
                  </Dropdown>
                </ButtonGroup>
              </ButtonGroup>
            </div>
            <div id='displaysong'>
              <p id='albumart'>
                <span id='trackStatus'>
                  {!isPaused ? 'Currently Playing' : 'Paused'}
                </span>
                :{' "'}
                {spotifyObj.currentTrackInfo?.name +
                  '" by ' +
                  spotifyObj.currentTrackInfo?.artists
                    .map(eachArtist => eachArtist.name)
                    .join(', ') +
                  ' (from the ' +
                  spotifyObj.currentTrackInfo?.album.album_type +
                  ' ' +
                  spotifyObj.currentTrackInfo?.album.name +
                  ')'}
              </p>
            </div>
          </div>
        </div>
        <canvas
          id='features-chart'
          ref={featuresChartRef}
          onClick={event => {
            featureClick(event, null)
          }}
        ></canvas>
        <canvas
          className={fChartState.visState ? 'd-block' : 'd-none'}
          id='song-visual'
          ref={songVisualRef}
        ></canvas>
      </div>
    </>
  )
}
