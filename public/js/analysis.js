// client-side js
// main site functionality

var player
const LOCALSTORAGE_ACCESS_TOKEN_KEY = 'app-spotify-access-token'
const LOCALSTORAGE_ACCESS_TOKEN_EXPIRY_KEY =
  'app-spotify-access-token-expires-in'
const accessToken = localStorage.getItem(LOCALSTORAGE_ACCESS_TOKEN_KEY)

const colors = [
  'rgba(238, 229, 107, 1)',
  'rgba(242, 187, 143, 1)',
  'rgba(250, 243, 221, 1)',
  'rgba(150, 220, 189, 1)',
  'rgba(158, 170, 219, 1)',
  'rgba(105, 108, 128, 1)'
]

var deviceId = ''
var profileInfo = {}
var fChartImg = new Image()
var sVisualImg = new Image()
var playerCode = 0
var resizeEvent = false
var currentTrack = null
var currentArtist = null
var currentValence = null
var currentEnergy = null
var currentTempo = null
var currentDanceability = null
var currentTimeSig = null
const defaultOset = 0
var afterArtistOset = ''
var searchVal = ''
var tracksOffset = 0
var artistsOffset = 0
var albumsOffset = 0
var plistsOffset = 0
var showSimLimit = 4
var animReq
var pitchCounter
var beatCounter
var prevBeatCounter
var beatsObj = {}
var pitchesObj = {}
var topTracksOffset = {}
var topArtistsOffset = {}

function checkExpir () {
  if (
    !accessToken ||
    parseInt(localStorage.getItem(LOCALSTORAGE_ACCESS_TOKEN_EXPIRY_KEY)) <
      Date.now()
  ) {
    alert('Session expired.')
    localStorage.clear()
    window.location = '/'
  }
} // check access token expiration

function resetCanvas (id) {
  let query = '/analysis?id=' + id
  return fetch(query)
    .then(e => e.json())
    .then(data => {
      drawAnalysis(data)
    })
}
var resize

function easeInOutSine (currTime, begin, change, duration) {
  return (-change / 2) * (Math.cos((Math.PI * currTime) / duration) - 1) + begin
}

function binaryIndexOf (searchElement, valueof, valueout) {
  if (this.length == null) return
  ;('use strict')
  var minIndex = 0
  var maxIndex = this.length - 1
  var currentIndex
  var currentElement

  while (minIndex <= maxIndex) {
    currentIndex = ((minIndex + maxIndex) / 2) | 0
    currentElement = valueof(this[currentIndex])

    if (
      currentElement < searchElement &&
      (currentIndex + 1 < this.length
        ? valueof(this[currentIndex + 1])
        : Infinity) > searchElement
    ) {
      return valueout(currentElement, currentIndex, this)
    }
    if (currentElement < searchElement) {
      minIndex = currentIndex + 1
    } else if (currentElement > searchElement) {
      maxIndex = currentIndex - 1
    } else {
      return this[currentIndex]
    }
  }

  return -1
}

window.addEventListener('load', loadFunctions())

window.onresize = () => {
  dropdownAlignCheck()
  clearTimeout(resize)
  resize = setTimeout(doneResizing, 250)
}

document.addEventListener('visibilitychange', event => {
  if (
    document
      .getElementById('displaysong')
      .contains(document.getElementById('trackStatus'))
  ) {
    if (document.visibilityState === 'visible') {
      console.log('tab is active')
      doneResizing()
    } else if (
      document.visibilityState !== 'visible' &&
      document.getElementById('playedButton').style.display === 'none'
    ) {
      pauseVid()
      console.log('tab is inactive')
    } else {
      console.log('tab is inactive')
    }
  }
})

$('.nav-link').on('click', function () {
  // Select all list items
  var navItems = $('.nav-link')

  // Remove 'active' tag for all list items
  for (let i = 0; i < navItems.length; i++) {
    navItems[i].classList.remove('active')
  }

  // Add 'active' tag for currently selected item
  this.classList.add('active')
})

function dropdownAlignCheck () {
  if ($(window).width() < 476) {
    $('#partialSimBtns').removeClass('dropend')
  } else {
    $('#partialSimBtns').addClass('dropend')
  }
} // dropdown view depending on device width

function getProfileInfo () {
  return fetch(`https://api.spotify.com/v1/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
    .then(e => e.json())
    .then(data => {
      profileInfo['prof_pic'] =
        data.images.length !== 0 ? data.images[0].url : 'images/default_pic.png'
      document.getElementById('profpic').src = profileInfo['prof_pic']
      profileInfo['displayName'] = data.display_name
      profileInfo['userCountry'] = data.country
      profileInfo['currentUser'] = data.id
      profileInfo['subLevel'] = data.product
      profileInfo['followersCount'] = data.followers.total
    })
    .catch(error => {
      console.log(error)
    })
}

function getFeaturedPlists () {
  let date = new Date()
  let timestampISO = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  ).toISOString()
  return fetch(
    '/featuredPlists?offset=' +
      defaultOset +
      '&user_country=' +
      profileInfo['userCountry'] +
      '&timestamp=' +
      timestampISO,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  )
    .then(res => res.json())
    .then(data => {
      var featPlistsDiv = document.createElement('div')
      featPlistsDiv.setAttribute('id', `featPlistsCateg`)
      var featPSection = $(`<div class="container" id="featPlistsContainer">
            <button class='btn btn-lg rounded-pill searchCateg activeCateg' 
                id='btnFeatPlistsCateg' type='button' data-bs-toggle='collapse' 
                data-bs-target='#featPlistsCateg, #featPlistMsg' 
                onclick="toggleCateg('btnFeatPlistsCateg')"
                aria-expanded='true' aria-controls='featPlistsCateg, featPlistMsg'>
                Featured Playlists
             </button>
             <h4 class="collapse show msgTitle" id="featPlistMsg">${data.message}</h4>
           </div>`)
      featPSection.appendTo('#results')
      featPlistsDiv.setAttribute('class', 'collapse show searchedAlt')
      // For each of the featured playlists, create an element
      data.playlists.items.forEach(function (playlist, index) {
        var featPlistDiv = document.createElement('div')
        featPlistDiv.setAttribute('class', 'text-white-top')
        featPlistDiv.setAttribute('onclick', `getPlistSongs('${playlist.id}');`)
        featPlistDiv.innerHTML = `<div>
                  <img style="padding-top:10px; display: flex; margin: 0px auto 0px auto; width: 64px; height:auto;" 
                       src="${
                         playlist.images.length === 0
                           ? 'images/music-note-beamed.svg'
                           : playlist.images[0].url
                       }"
                       width="64" height="64">
                  <p class="resultText">
                    ${playlist.name}
                  </p>
                  ${
                    playlist.description.trim() !== ''
                      ? `<p class="resultText fw-light fs-6">${playlist.description.trim()}</p>
                          <a class="btn btn-sm spotifyLink" href="${
                            playlist.external_urls.spotify
                          }">
                          <img src="images/spotify_logo.png" class="img-fluid" width="70px">
                          </a>
                     <ol class="addResultText" id=${playlist.id}>
                    </ol>`
                      : `<ol class="addResultText" id=${playlist.id}></ol>`
                  }
                 </div>`
        featPlistsDiv.appendChild(featPlistDiv)
      })
      document.getElementById('featPlistsContainer').appendChild(featPlistsDiv)
    })
    .catch(error => console.error('Error:', error))
}

function getNewReleases () {
  fetch(
    '/newReleases?offset=' +
      defaultOset +
      '&user_country=' +
      profileInfo['userCountry'],
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  )
    .then(res => res.json())
    .then(data => {
      var newRelsDiv = document.createElement('div')
      newRelsDiv.setAttribute('id', `newRelsCateg`)
      var newRelSection = $(`<div class="container" id="newRelsContainer">
            <button class='btn btn-lg rounded-pill searchCateg activeCateg' 
                id='btnNewRelsCateg' type='button' data-bs-toggle='collapse' 
                data-bs-target='#newRelsCateg' 
                onclick="toggleCateg('btnNewRelsCateg')"
                aria-expanded='true' aria-controls='newRelsCateg'>
                New Releases
             </button>
           </div>`)
      newRelSection.appendTo('#results')
      newRelsDiv.setAttribute('class', 'collapse show searchedAlt')
      // For each of the new releases, create an element
      data.albums.items.forEach(function (album, index) {
        var newRelDiv = document.createElement('div')
        newRelDiv.setAttribute('class', 'text-white-top')
        newRelDiv.setAttribute('onclick', `getAlbumSongs('${album.id}');`)
        newRelDiv.innerHTML = `<div>
                  <img style="padding-top:10px; display: flex; margin: 0px auto 0px auto; width: 64px; height:auto;" 
                       src="${
                         album.images.length === 0
                           ? 'images/music-note-beamed.svg'
                           : album.images[2].url
                       }"
                       width="64" height="64">
                  <p class="resultText">
                    ${album.artists
                      .map(eachArtist => eachArtist.name)
                      .join(', ')} - ${album.name}
                  </p>
                  ${
                    album.release_date.trim() !== ''
                      ? `<p class="resultText fw-light fs-6">${album.album_type}, ${album.release_date}</p>
                        <a class="btn btn-sm spotifyLink" href="${album.external_urls.spotify}">
                        <img src="images/spotify_logo.png" class="img-fluid" width="70px">
                        </a>
                     <ol class="addResultText" id=${album.id}>
                    </ol>`
                      : `<ol class="addResultText" id=${album.id}></ol>`
                  }
                 </div>`
        newRelsDiv.appendChild(newRelDiv)
      })
      document.getElementById('newRelsContainer').appendChild(newRelsDiv)
    })
    .catch(error => console.error('Error:', error))
}

async function loadFunctions () {
  checkExpir()
  dropdownAlignCheck()
  await getProfileInfo()
  await getFeaturedPlists()
  getNewReleases()
  if (profileInfo['subLevel'] === 'open') {
    syncBtn.style.display = 'block'
    var alerted = localStorage.getItem('alertedOnLogin') || ''
    if (alerted != 'yes') {
      alert(
        `Spotify Premium is required to control Melodera's audio player / visualizer.` +
          ` Instead use another device (desktop client, phone, etc.) for playback, then click` +
          ` the music icon in bottom left of page (appears after this alert) to sync with Melodera.`
      )
      localStorage.setItem('alertedOnLogin', 'yes')
    }
  }
}

var backToTopBtn = document.getElementById('btn-back-to-top')
var syncBtn = document.getElementById('btn-sync')

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function () {
  scrollFunction()
}

function scrollFunction () {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    backToTopBtn.style.display = 'block'
    syncBtn.style.left = '50px'
  } else {
    backToTopBtn.style.display = 'none'
    syncBtn.style.left = '10px'
  }
}
// On click, scroll to the top
backToTopBtn.addEventListener('click', backToTop)

function backToTop () {
  window.scroll({ top: 0, behavior: 'smooth' })
}

syncBtn.addEventListener('click', syncPlayer)

// sync playback of alternative client with Melodera's visualizer
function syncPlayer () {
  if (profileInfo['subLevel'] === 'open') {
    setTimeout(doneResizing(true), 1000)
  }
}

function checkNull () {
  fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
    .then(e => e.json())
    .then(data => {
      if (data.item === null) return true
      else return false
    })
    .catch(error => {
      console.log(error)
    })
}

function doneResizing (specialCase = false) {
  if (
    document
      .getElementById('displaysong')
      .contains(document.getElementById('trackStatus')) ||
    specialCase
  ) {
    checkExpir()
    fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
      .then(e => e.json())
      .then(data => {
        if (data.item === null) {
          let isNull = true
          while (isNull) {
            isNull = checkNull()
          }
          doneResizing(
            true
          ) /* do special case 
                            for a clicked song from alternate client (free users) */
          return
        }
        if (currentTrack !== null && !resizeEvent && !specialCase) {
          resizeEvent = true
        }
        if (
          profileInfo['subLevel'] === 'open' &&
          currentTrack !== data.item.id
        ) {
          currentTrack = data.item.id
          getAnalysis(data.item.id)
          getFeatures(data.item.id)
        } else if (
          currentTrack !== null &&
          !data.is_playing &&
          data.item.id === currentTrack
        ) {
          resizingAnalysis(data.item.id)
          //console.log("Resized while paused");
        } else if (
          currentTrack !== null &&
          data.is_playing &&
          data.item.id === currentTrack
        ) {
          resizingAnalysis(data.item.id)
          //console.log("Resized while playing");
        }
      })
      .catch(error => {
        console.log(error)
      })
  }
}

const getRowPosition = index =>
  index === 0 ? 0 : 1 / index + getRowPosition(index - 1)

const getFloorRowPosition = (searchPosition, rowHeight, i = 0, max = 4) =>
  i > max
    ? max
    : searchPosition < getRowPosition(i + 1) * rowHeight
    ? i
    : getFloorRowPosition(searchPosition, rowHeight, i + 1, max)

function toggledNav () {
  const nIcon = document.getElementById('toggled-nav-icon')
  if (nIcon.classList.contains('active-nav-icon')) {
    nIcon.classList.remove('active-nav-icon')
  } else nIcon.classList.add('active-nav-icon')
}

function toggleCateg (categ) {
  const categBtn = document.getElementById(categ)
  if (categBtn.classList.contains('activeCateg')) {
    categBtn.classList.remove('activeCateg')
  } else categBtn.classList.add('activeCateg')
}

function getTopArtists (timeframe) {
  checkExpir()
  if (
    document
      .getElementById('results')
      .contains(document.getElementById(`artist_${timeframe}`))
  ) {
    document.getElementById(`artist_${timeframe}`).scrollIntoView()
    return
  }

  fetch('/topArtists?time_range=' + timeframe + '&offset=' + defaultOset, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
    .then(res => res.json())
    .then(data => {
      topArtistsOffset[timeframe] = 0
      var tRange = ''
      if (timeframe === 'short_term') tRange = 'Last 4 weeks'
      else if (timeframe === 'medium_term') tRange = 'Last 6 months'
      else tRange = 'All time'
      if (
        document
          .getElementById('results')
          .contains(document.getElementById('btnTracksCateg')) ||
        document
          .getElementById('results')
          .contains(document.getElementById('btnFeatPlistsCateg'))
      ) {
        document.getElementById('results').innerHTML = ''
      }
      var topArtistsDiv = document.createElement('div')
      topArtistsDiv.setAttribute('id', `topArtistsCateg_${timeframe}`)
      if (
        document
          .getElementById('results')
          .contains(document.getElementById(`btnTopArtistsCateg`))
      ) {
        var currTarget = document
          .getElementById(`btnTopArtistsCateg`)
          .getAttribute('data-bs-target')
        var currAria = document
          .getElementById(`btnTopArtistsCateg`)
          .getAttribute('aria-controls')
        var currExpand = document
          .getElementById(`btnTopArtistsCateg`)
          .getAttribute('aria-expanded')
        document.getElementById(`btnTopArtistsCateg`).setAttribute(
          'data-bs-target',
          currTarget +
            `,#topArtistsCateg_${timeframe}, 
                                                                    #moreBtnTopArtists_${timeframe},
                                                                    #artist_${timeframe}`
        )
        document.getElementById(`btnTopArtistsCateg`).setAttribute(
          'aria-controls',
          currAria +
            `,topArtistsCateg_${timeframe}, 
                                                                    moreBtnTopArtists_${timeframe},
                                                                    artist_${timeframe}`
        )
        if (currExpand === 'false') {
          document
            .getElementById(`btnTopArtistsCateg`)
            .setAttribute('aria-expanded', 'true')
          var xvv = document
            .getElementById('topArtistsContainer')
            .querySelectorAll('.collapse')
          xvv.forEach(function (elem) {
            elem.classList.toggle('show')
          })
          document
            .getElementById('btnTopArtistsCateg')
            .classList.toggle('activeCateg')
        }
        var topASection = $(`<h4 class="collapse show tFrametitle" 
              id="artist_${timeframe}">${tRange}:</h4>
             <button type="button" class="collapse show btn moreBtn" 
              id='moreBtnTopArtists_${timeframe}' 
              onclick='moreBtnResults(&apos;topArtistsCateg_${timeframe}&apos;, ${false})'>
              See more
             </button>`)
        topASection.appendTo('#topArtistsContainer')
        topArtistsDiv.setAttribute('class', `collapse show searchedAlt`)
      } else {
        var topASection = $(`<div class="container" id="topArtistsContainer">
            <button class='btn btn-lg rounded-pill searchCateg activeCateg' 
                id='btnTopArtistsCateg' type='button' data-bs-toggle='collapse' 
                data-bs-target='#topArtistsCateg_${timeframe}, #moreBtnTopArtists_${timeframe}, #artist_${timeframe}' 
                onclick="toggleCateg('btnTopArtistsCateg')"
                aria-expanded='true' aria-controls='topArtistsCateg_${timeframe},
                moreBtnTopArtists_${timeframe}, artist_${timeframe}'>
                Top Artists
             </button>
             <h4 class="collapse show tFrametitle" id="artist_${timeframe}">${tRange}:</h4>
             <button type="button" class="collapse show btn moreBtn" id='moreBtnTopArtists_${timeframe}'
              onclick='moreBtnResults(&apos;topArtistsCateg_${timeframe}&apos;, ${false})'>
              See more
             </button>
           </div>`)
        topASection.appendTo('#results')
        topArtistsDiv.setAttribute('class', 'collapse show searchedAlt')
      }
      // For each of the artists, create an element
      data.items.forEach(function (artist, index) {
        var artistDiv = document.createElement('div')
        artistDiv.setAttribute('class', 'text-white-top')
        artistDiv.setAttribute(
          'onclick',
          `getArtistSongs('${artist.id}', this);`
        )
        artistDiv.innerHTML = `<div>
                  <img style="padding-top:10px; display: flex; margin: 0px auto 0px auto; width: 64px; height:auto;" 
                       src="${
                         artist.images.length === 0
                           ? 'images/music-note-beamed.svg'
                           : artist.images[2].url
                       }"
                       width="64" height="64">
                  <p class="resultText">
                    ${index + 1}.  ${artist.name}
                  </p>
                  <ol class="addResultText" id=${artist.id + '_' + timeframe}>
                  </ol>
                 </div>`
        topArtistsDiv.appendChild(artistDiv)
      })
      document
        .getElementById('topArtistsContainer')
        .insertBefore(
          topArtistsDiv,
          document.getElementById(`moreBtnTopArtists_${timeframe}`)
        )
      document.getElementById(`topArtistsCateg_${timeframe}`).scrollIntoView()
    })
    .catch(error => console.error('Error:', error))
}

function openProfile () {
  document.getElementById(
    'profModalBody'
  ).innerHTML = `<div class="card" style="max-width: 540px;">
    <div class="row g-0">
      <div class="col-sm-4" style="text-align: center;">
        <img src="${profileInfo['prof_pic']}" class="img-fluid rounded-start" alt="profPic">
      </div>
      <div class="col-sm-8">
        <div class="card-body" style="text-align: center;">
          <h5 class="card-title">${profileInfo['displayName']}</h5>
          <ul class="card-text" id="profInfoText">
            <li>Country: ${profileInfo['userCountry']}</li>
            <li>Subscription: ${profileInfo['subLevel']}</li>
            <li>Followers: ${profileInfo['followersCount']}</li>
          <ul>
        </div>
      </div>
    </div>
  </div>`
}

function removeBeatVis () {
  localStorage.setItem('beat_visualizer_state', JSON.stringify(false))
  location.reload()
  return false
}

document
  .getElementById('circVisual')
  .addEventListener('click', function (event) {
    localStorage.setItem('beat_visualizer_state', JSON.stringify(true))
    localStorage.setItem('beat_visualizer_type', 'circle')
    location.reload()
  })
document
  .getElementById('triVisual')
  .addEventListener('click', function (event) {
    localStorage.setItem('beat_visualizer_state', JSON.stringify(true))
    localStorage.setItem('beat_visualizer_type', 'triangle')
    location.reload()
  })
document.getElementById('sqVisual').addEventListener('click', function (event) {
  localStorage.setItem('beat_visualizer_state', JSON.stringify(true))
  localStorage.setItem('beat_visualizer_type', 'square')
  location.reload()
})
document
  .getElementById('mixVisual')
  .addEventListener('click', function (event) {
    localStorage.setItem('beat_visualizer_state', JSON.stringify(true))
    localStorage.setItem('beat_visualizer_type', 'mix')
    location.reload()
  })

function openVisSettings () {
  document.getElementById('visModalBody').innerHTML = `<p>
  Known Issues: The visualizer can be buggy (moreso with free users), but refreshing the page usually fixes it.
  </p>
  <p>Spotify Premium users:</p>
  <p>Full usage of the site's features.
  </p>
  <p>Free users:</p>
  <p>Limited usage due to Spotify's restrictions. 
  Must use another client to control audio, but can still view the song breakdown and visualizer by
  clicking the music icon in the bottom left of the site (visible only to Free users) for synchronization of the alternative client and Melodera.
  </p>
  <p>
  If the visualizer isn't syncing correctly, reclicking the music icon a couple times should fix it.
  </p>
  <img src="images/melodera-player.png" 
  class="img-fluid" alt="Player Guide">`
}

function logoutAcc () {
  player.disconnect()
  localStorage.clear()
  window.location = '/'
}

function getTopTracks (timeframe) {
  checkExpir()
  if (
    document
      .getElementById('results')
      .contains(document.getElementById(`track_${timeframe}`))
  ) {
    document.getElementById(`track_${timeframe}`).scrollIntoView()
    return
  }

  fetch('/topTracks?time_range=' + timeframe + '&offset=' + defaultOset, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
    .then(res => res.json())
    .then(data => {
      topTracksOffset[timeframe] = 0
      var tRange = ''
      if (timeframe === 'short_term') tRange = 'Last 4 weeks'
      else if (timeframe === 'medium_term') tRange = 'Last 6 months'
      else tRange = 'All time'
      if (
        document
          .getElementById('results')
          .contains(document.getElementById('btnTracksCateg')) ||
        document
          .getElementById('results')
          .contains(document.getElementById('btnFeatPlistsCateg'))
      ) {
        document.getElementById('results').innerHTML = ''
      }
      var topTracksDiv = document.createElement('div')
      topTracksDiv.setAttribute('id', `topTracksCateg_${timeframe}`)
      if (
        document
          .getElementById('results')
          .contains(document.getElementById(`btnTopTracksCateg`))
      ) {
        var currTarget = document
          .getElementById(`btnTopTracksCateg`)
          .getAttribute('data-bs-target')
        var currAria = document
          .getElementById(`btnTopTracksCateg`)
          .getAttribute('aria-controls')
        var currExpand = document
          .getElementById(`btnTopTracksCateg`)
          .getAttribute('aria-expanded')
        document.getElementById(`btnTopTracksCateg`).setAttribute(
          'data-bs-target',
          currTarget +
            `,#topTracksCateg_${timeframe}, 
                                                                    #moreBtnTopTracks_${timeframe},
                                                                    #track_${timeframe}`
        )
        document.getElementById(`btnTopTracksCateg`).setAttribute(
          'aria-controls',
          currAria +
            `,topTracksCateg_${timeframe}, 
                                                                    moreBtnTopTracks_${timeframe},
                                                                    track_${timeframe}`
        )
        if (currExpand === 'false') {
          document
            .getElementById(`btnTopTracksCateg`)
            .setAttribute('aria-expanded', 'true')
          var xvv = document
            .getElementById('topTracksContainer')
            .querySelectorAll('.collapse')
          xvv.forEach(function (elem) {
            elem.classList.toggle('show')
          })
          document
            .getElementById('btnTopTracksCateg')
            .classList.toggle('activeCateg')
        }
        var topTSection = $(`<h4 class="collapse show tFrametitle" 
              id="track_${timeframe}">${tRange}:</h4>
             <button type="button" class="collapse show btn moreBtn" 
               id='moreBtnTopTracks_${timeframe}' 
              onclick='moreBtnResults(&apos;topTracksCateg_${timeframe}&apos;, ${false})'>
              See more
             </button>`)
        topTSection.appendTo('#topTracksContainer')
        topTracksDiv.setAttribute('class', `collapse show searchedAlt`)
      } else {
        var topTSection = $(`<div class="container" id="topTracksContainer">
             <button class='btn btn-lg rounded-pill searchCateg activeCateg' 
                id='btnTopTracksCateg' type='button' data-bs-toggle='collapse' 
                data-bs-target='#topTracksCateg_${timeframe}, #moreBtnTopTracks_${timeframe}, #track_${timeframe}' 
                onclick="toggleCateg('btnTopTracksCateg')"
                aria-expanded='true' aria-controls='topTracksCateg_${timeframe},
                moreBtnTopTracks_${timeframe}, track_${timeframe}'>
                Top Songs
             </button>
             <h4 class="collapse show tFrametitle" id="track_${timeframe}">${tRange}:</h4>
             <button type="button" class="collapse show btn moreBtn" id='moreBtnTopTracks_${timeframe}'
              onclick='moreBtnResults(&apos;topTracksCateg_${timeframe}&apos;, ${false})'>
              See more
             </button>
           </div`)
        topTSection.appendTo('#results')
        topTracksDiv.setAttribute('class', 'collapse show searchedAlt')
      }
      // For each of the tracks, create an element
      data.items.forEach(function (track, index) {
        var trackDiv = document.createElement('div')
        trackDiv.setAttribute('class', 'text-white-top')
        trackDiv.setAttribute(
          'onclick',
          `playVid('${track.id}');
                                          getAnalysis('${track.id}');
                                          getFeatures('${track.id}');`
        )
        trackDiv.innerHTML = `<div>
                  <img style="padding-top:10px; display: flex; margin: 0px auto 0px auto; width: 64px; height:auto;" 
                       src="${
                         track.album.images.length === 0
                           ? 'images/music-note-beamed.svg'
                           : track.album.images[2].url
                       }"
                       width="64" height="64">
                  <p class="resultText">
                    ${index + 1}.  ${track.artists
          .map(eachArtist => eachArtist.name)
          .join(', ')} - ${track.name}
                  </p>
                    ${
                      track.album.release_date.trim() !== ''
                        ? `<p class="resultText fw-light fs-6">Released: ${track.album.release_date}</p>
                          <a class="btn btn-sm spotifyLink" href="${track.album.external_urls.spotify}">
                          <img src="images/spotify_logo.png" class="img-fluid" width="70px">
                          </a>
                      </div>`
                        : `</div>`
                    }
                </div>`
        topTracksDiv.appendChild(trackDiv)
      })
      document
        .getElementById('topTracksContainer')
        .insertBefore(
          topTracksDiv,
          document.getElementById(`moreBtnTopTracks_${timeframe}`)
        )
      document.getElementById(`topTracksCateg_${timeframe}`).scrollIntoView()
    })
    .catch(error => console.error('Error:', error))
}
function drawFeatures (id) {
  let query = '/features?id=' + id

  $.get(query, function (data) {
    let labels = []
    let values = []
    for (var feature in data) {
      if (data.hasOwnProperty(feature) && feature !== 'duration_ms')
        labels.push(feature)
      values.push(data[feature])
    }
  })
}

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

function drawAnalysis (data) {
  if (currentTrack != null) {
    let fChart = document.getElementById('features-chart')
    fChart.replaceWith(fChart.cloneNode(true))
    let songVisual = document.getElementById('song-visual')
    songVisual.replaceWith(songVisual.cloneNode(true))
  }
  const featuresChart = document.getElementById('features-chart')
  featuresChart.style.display = 'block'
  featuresChart.width = featuresChart.offsetWidth * 2
  featuresChart.height = featuresChart.offsetHeight * 2
  const width = featuresChart.width
  const height = featuresChart.height
  const fChartCtx = featuresChart.getContext('2d')

  const sVisual = document.getElementById('song-visual')
  const visState = JSON.parse(localStorage.getItem('beat_visualizer_state'))
  if (visState) sVisual.style.display = 'block'
  else sVisual.style.display = 'none'
  sVisual.width = sVisual.offsetWidth
  sVisual.height = sVisual.offsetHeight
  const sVisualProps = {
    width: sVisual.width,
    height: sVisual.height,
    centerX: sVisual.width / 2,
    centerY: sVisual.height / 2,
    radius: featuresChart.height / 8
  }
  const sVisualCtx = sVisual.getContext('2d')

  const arrayLikesEntries = Object.entries(data)
    .filter(entry => entry[1] instanceof Array && !entry.includes('tatums'))
    .sort((a, b) => a[1].length - b[1].length)
  const arrayLikesKeys = arrayLikesEntries.map(entry => entry[0])
  const arrayLikes = arrayLikesEntries.map(entry => entry[1])
  const rowHeight = height / (arrayLikes.length / 1.92)
  const markerHeight = getRowPosition(arrayLikes.length - 1) * rowHeight
  featuresChart.addEventListener('click', clickEvent => {
    if (profileInfo['subLevel'] === 'open') {
      alert(
        `Spotify Premium is required to control Melodera audio player / visualizer.` +
          ` Please use another device (desktop client, phone, etc.) for controls and Melodera will sync.`
      )
      return
    }
    const time =
      (clickEvent.offsetX / featuresChart.width) * data.track.duration * 2
    const kind = getFloorRowPosition(clickEvent.offsetY * 2, rowHeight)
    const seekTime = binaryIndexOf.call(
      arrayLikes[kind],
      time,
      e => e.start,
      (element, index) => element
    )

    fetch(
      `https://api.spotify.com/v1/me/player/seek?position_ms=${Math.floor(
        (seekTime < 0 ? 0 : seekTime) * 1000
      )}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    ).catch(e => console.log(e))
    if (pitchesObj['startTime'].length !== 0) {
      const seekPitch = binaryIndexOf.call(
        pitchesObj['startTime'],
        time,
        e => e,
        (element, index) => index
      )
      pitchCounter = seekPitch
      if (pitchCounter == -1) {
        document.getElementById('domPitch').innerHTML = ''
        pitchCounter = 0
      } else if (
        pitchesObj['pitch'][pitchCounter] === null ||
        !Number.isInteger(pitchCounter)
      ) {
        document.getElementById('domPitch').innerHTML = 'unknown'
        pitchCounter++
      } else {
        document.getElementById('domPitch').innerHTML =
          pitchesObj['pitch'][pitchCounter]
        pitchCounter++
      }
    }
    if (beatsObj['startTime'].length !== 0) {
      const seekBeat = binaryIndexOf.call(
        beatsObj['startTime'],
        time,
        e => e,
        (element, index) => index
      )
      sVisualCtx.clearRect(0, 0, sVisual.width, sVisual.height)
      sVisualCtx.beginPath()
      sVisualCtx.fillStyle =
        colors[pitchesObj['pitchSectionI'][pitchCounter - 1] % colors.length]
      sVisualCtx.strokeStyle = '000'
      beatCounter = seekBeat
      prevBeatCounter = seekBeat - 1
      if (beatCounter == -1) {
        beatCounter = 0
        prevBeatCounter = 0
        getVisType(
          sVisualCtx,
          easeInOutSine(
            seekTime,
            sVisualProps.centerX,
            sVisualProps.centerX / 2,
            beatsObj['beatDuration'][beatCounter]
          ),
          sVisualProps
        )
        sVisualCtx.fill()
        sVisualCtx.stroke()
      } else {
        getVisType(
          sVisualCtx,
          easeInOutSine(
            seekTime,
            sVisualProps.centerX + sVisualProps.centerX / 2,
            -(sVisualProps.centerX + sVisualProps.centerX / 4),
            beatsObj['beatDuration'][beatCounter]
          ),
          sVisualProps
        )
        sVisualCtx.fill()
        sVisualCtx.stroke()
        prevBeatCounter = beatCounter
      }
      beatCounter++
    }
  })
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
            pitchesObj['pitch'].push('C&sharp;/D&flat;')
            break
          case 2:
            pitchesObj['startTime'].push(section.start)
            pitchesObj['pitch'].push('D')
            break
          case 3:
            pitchesObj['startTime'].push(section.start)
            pitchesObj['pitch'].push('D&sharp;/E&flat;')
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
            pitchesObj['pitch'].push('F&sharp;/G&flat;')
            break
          case 7:
            pitchesObj['startTime'].push(section.start)
            pitchesObj['pitch'].push('G')
            break
          case 8:
            pitchesObj['startTime'].push(section.start)
            pitchesObj['pitch'].push('G&sharp;/A&flat;')
            break
          case 9:
            pitchesObj['startTime'].push(section.start)
            pitchesObj['pitch'].push('A')
            break
          case 10:
            pitchesObj['startTime'].push(section.start)
            pitchesObj['pitch'].push('A&sharp;/B&flat;')
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
  function provideAnimationFrame (timestamp) {
    checkExpir()
    if (profileInfo['subLevel'] === 'open') {
      fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
        .then(e => e.json())
        .then(data => {
          if (data.item === null) {
            let isNull = true
            while (isNull) {
              isNull = checkNull()
            }
            doneResizing(
              true
            ) /* do special case 
                                for a clicked song from alternate client (free users) */
            return
          } else if (data.item !== null) {
            if (currentTrack !== data.item.id) {
              doneResizing()
            }
            if (
              !data.is_playing &&
              document.getElementById('pausedButton').style.display === 'block'
            ) {
              pauseVidAuto()
            }
            if (
              data.is_playing &&
              document.getElementById('playedButton').style.display === 'block'
            ) {
              resumeVidAuto()
            }
            if (resizeEvent) {
              resizeEvent = false
              return
            } else {
              document.getElementById('timer').innerHTML =
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

              const currPosition = data.progress_ms / 1000
              const markPosition =
                (data.progress_ms / 1000 / (data.item.duration_ms / 1000)) *
                width
              if (
                pitchesObj['startTime'].length !== 0 &&
                currPosition > 0 &&
                pitchCounter
              ) {
                const seekPitch = binaryIndexOf.call(
                  pitchesObj['startTime'],
                  currPosition,
                  e => e,
                  (element, index) => index
                )
                pitchCounter = seekPitch
                if (pitchCounter == -1) {
                  document.getElementById('domPitch').innerHTML = ''
                  pitchCounter = 0
                } else if (
                  pitchesObj['pitch'][pitchCounter] === null ||
                  !Number.isInteger(pitchCounter)
                ) {
                  document.getElementById('domPitch').innerHTML = 'unknown'
                  pitchCounter++
                } else {
                  document.getElementById('domPitch').innerHTML =
                    pitchesObj['pitch'][pitchCounter]
                  pitchCounter++
                }
              }
              if (beatsObj['startTime'].length !== 0 && currPosition > 0) {
                const seekBeat = binaryIndexOf.call(
                  beatsObj['startTime'],
                  currPosition,
                  e => e,
                  (element, index) => index
                )
                sVisualCtx.clearRect(0, 0, sVisual.width, sVisual.height)
                sVisualCtx.beginPath()
                sVisualCtx.fillStyle =
                  colors[
                    pitchesObj['pitchSectionI'][pitchCounter - 1] %
                      colors.length
                  ]
                sVisualCtx.strokeStyle = '000'
                beatCounter = seekBeat
                prevBeatCounter = seekBeat - 1
                if (beatCounter == -1) {
                  beatCounter = 0
                  prevBeatCounter = 0
                  getVisType(
                    sVisualCtx,
                    easeInOutSine(
                      currPosition,
                      sVisualProps.centerX,
                      sVisualProps.centerX / 2,
                      beatsObj['beatDuration'][beatCounter]
                    ),
                    sVisualProps,
                    data.is_playing
                  )
                  sVisualCtx.fill()
                  sVisualCtx.stroke()
                } else {
                  getVisType(
                    sVisualCtx,
                    easeInOutSine(
                      currPosition,
                      sVisualProps.centerX + sVisualProps.centerX / 2,
                      -(sVisualProps.centerX + sVisualProps.centerX / 4),
                      beatsObj['beatDuration'][beatCounter]
                    ),
                    sVisualProps,
                    data.is_playing
                  )
                  sVisualCtx.fill()
                  sVisualCtx.stroke()
                  prevBeatCounter = beatCounter
                }
                beatCounter++
              }
              // pitch and beat sync/animation
              if (
                beatCounter !== beatsObj['startTime'].length &&
                Math.abs(currPosition - beatsObj['startTime'][beatCounter]) <
                  0.5
              ) {
                if (pitchCounter !== pitchesObj['startTime'].length) {
                  if (
                    pitchesObj['startTime'][pitchCounter] === null ||
                    !Number.isInteger(pitchCounter)
                  ) {
                    document.getElementById('domPitch').innerHTML = 'unknown'
                    pitchCounter++
                  } else if (
                    Math.fround(currPosition) >
                    Math.fround(pitchesObj['startTime'][pitchCounter])
                  ) {
                    document.getElementById('domPitch').innerHTML =
                      pitchesObj['pitch'][pitchCounter]
                    pitchCounter++
                  }
                } else if (pitchesObj['startTime'].length === 0) {
                  document.getElementById('domPitch').innerHTML = 'unavailable'
                }
                if (
                  Math.fround(currPosition) >
                  Math.fround(beatsObj['startTime'][beatCounter])
                ) {
                  if (prevBeatCounter !== beatCounter) {
                    prevBeatCounter = beatCounter
                  }
                  beatCounter++
                }
              }
              fChartCtx.clearRect(
                0,
                0,
                featuresChart.width,
                featuresChart.height
              )
              fChartCtx.drawImage(fChartImg, 0, 0)
              sVisualCtx.drawImage(sVisualImg, 0, 0)
              fChartCtx.fillStyle = '#000'
              fChartCtx.fillRect(markPosition, 0, 5, markerHeight)
            }
            animReq = requestAnimationFrame(provideAnimationFrame)
          }
        })
        .catch(error => {
          console.log('Animation: ', error)
        })
    } else {
      player &&
        player
          .getCurrentState()
          .then(state => {
            document.getElementById('timer').innerHTML =
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
            const currPosition = state.position / 1000
            const markPosition =
              (state.position / 1000 / (state.duration / 1000)) * width

            // pitch and beat sync/animation
            if (
              beatCounter !== beatsObj['startTime'].length &&
              Math.abs(currPosition - beatsObj['startTime'][beatCounter]) < 0.5
            ) {
              if (pitchCounter !== pitchesObj['startTime'].length) {
                if (
                  pitchesObj['startTime'][pitchCounter] === null ||
                  !Number.isInteger(pitchCounter)
                ) {
                  document.getElementById('domPitch').innerHTML = 'unknown'
                  pitchCounter++
                } else if (
                  Math.fround(currPosition) >
                  Math.fround(pitchesObj['startTime'][pitchCounter])
                ) {
                  document.getElementById('domPitch').innerHTML =
                    pitchesObj['pitch'][pitchCounter]
                  pitchCounter++
                }
              } else if (pitchesObj['startTime'].length === 0) {
                document.getElementById('domPitch').innerHTML = 'unavailable'
              }
              if (
                Math.fround(currPosition) >
                Math.fround(beatsObj['startTime'][beatCounter])
              ) {
                sVisualCtx.clearRect(0, 0, sVisual.width, sVisual.height)

                sVisualCtx.beginPath()
                sVisualCtx.fillStyle =
                  colors[
                    pitchesObj['pitchSectionI'][pitchCounter - 1] %
                      colors.length
                  ]
                sVisualCtx.strokeStyle = '000'
                sVisualCtx.lineWidth = 0.5
                if (prevBeatCounter === beatCounter) {
                  getVisType(
                    sVisualCtx,
                    easeInOutSine(
                      currPosition,
                      sVisualProps.centerX,
                      sVisualProps.centerX / 2,
                      beatsObj['beatDuration'][beatCounter]
                    ),
                    sVisualProps,
                    !state.paused
                  )
                  sVisualCtx.fill()
                  sVisualCtx.stroke()
                } else {
                  getVisType(
                    sVisualCtx,
                    easeInOutSine(
                      currPosition,
                      sVisualProps.centerX + sVisualProps.centerX / 2,
                      -(sVisualProps.centerX + sVisualProps.centerX / 4),
                      beatsObj['beatDuration'][beatCounter]
                    ),
                    sVisualProps,
                    !state.paused
                  )
                  sVisualCtx.fill()
                  sVisualCtx.stroke()
                  prevBeatCounter = beatCounter
                }
                beatCounter++
              }
            }

            fChartCtx.clearRect(0, 0, featuresChart.width, featuresChart.height)
            fChartCtx.drawImage(fChartImg, 0, 0)
            sVisualCtx.drawImage(sVisualImg, 0, 0)
            fChartCtx.fillStyle = '#000'
            fChartCtx.fillRect(markPosition, 0, 5, markerHeight)
            animReq = requestAnimationFrame(provideAnimationFrame)
          })
          .catch(e => {
            console.error('Animation: ', e)
          })
    }
  }
  cancelAnimationFrame(animReq)
  animReq = requestAnimationFrame(provideAnimationFrame)
  fChartImg.src = featuresChart.toDataURL('png')
  sVisualImg.src = sVisual.toDataURL('png')
}

function resizingAnalysis (id) {
  if (currentTrack != null) {
    resetCanvas(id)
  }
}

function getArtistSongs (artistId, divClicked) {
  if (
    divClicked.getElementsByClassName('addResultText')[0].textContent.trim() ===
    ''
  ) {
    fetch(
      'https://api.spotify.com/v1/artists/' +
        artistId +
        '/top-tracks?market=' +
        profileInfo['userCountry'],
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    )
      .then(e => e.json())
      .then(data => {
        divClicked.getElementsByClassName('addResultText')[0].style.display =
          'block'
        divClicked.getElementsByClassName('addResultText')[0].style.maxHeight =
          '150px'
        if (data.tracks.length === 0) {
          divClicked.getElementsByClassName('addResultText')[0].innerHTML =
            `<p class="text-decoration-underline">Popular</p>` +
            `<p>
               &lt;Nothing found&gt;
          </p>`
        } else {
          divClicked.getElementsByClassName('addResultText')[0].innerHTML =
            `<p class="text-decoration-underline">Popular<p>` +
            data.tracks
              .map(
                track =>
                  `<li onClick="playVid(&apos;${track.id}&apos;);
            getAnalysis(&apos;${track.id}&apos;); getFeatures(&apos;${track.id}&apos;);">
            ${track.name}
           </li>`
              )
              .join('')
        }
      })
      .catch(error => console.error('Error:', error))
  } else {
    if (
      divClicked.getElementsByClassName('addResultText')[0].style.display ===
      'block'
    ) {
      divClicked.getElementsByClassName('addResultText')[0].style.display =
        'none'
    } else
      divClicked.getElementsByClassName('addResultText')[0].style.display =
        'block'
  }
}

function getAlbumSongs (albumId) {
  if (document.getElementById(albumId).textContent.trim() === '') {
    fetch('https://api.spotify.com/v1/albums/' + albumId + '/tracks?limit=50', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
      .then(e => e.json())
      .then(data => {
        document.getElementById(albumId).style.display = 'block'
        document.getElementById(albumId).style.maxHeight = '150px'
        if (data.items.length === 0) {
          document.getElementById(albumId).innerHTML = `<p>
               &lt;Nothing found&gt;
          </p>`
        } else {
          document.getElementById(albumId).innerHTML = data.items
            .map(
              track =>
                `<li onClick="playVid(&apos;${track.id}&apos;); 
                    getAnalysis(&apos;${track.id}&apos;); getFeatures(&apos;${track.id}&apos;);">
                    ${track.name}
                   </li>`
            )
            .join('')
        }
      })
      .catch(error => console.error('Error:', error))
  } else {
    if (document.getElementById(albumId).style.display === 'block') {
      document.getElementById(albumId).style.display = 'none'
    } else document.getElementById(albumId).style.display = 'block'
  }
}

function getPlistSongs (plistId) {
  if (document.getElementById(plistId).textContent.trim() === '') {
    fetch(
      'https://api.spotify.com/v1/playlists/' + plistId + '/tracks?limit=50',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    )
      .then(e => e.json())
      .then(data => {
        document.getElementById(plistId).style.display = 'block'
        document.getElementById(plistId).style.maxHeight = '150px'
        if (data.items.length === 0) {
          document.getElementById(plistId).innerHTML = `<p>
               &lt;Nothing found&gt;
          </p>`
        } else {
          document.getElementById(plistId).innerHTML = data.items
            .filter(result => result.track !== null)
            .map(
              result =>
                `<li onClick="playVid(&apos;${result.track.id}&apos;); 
                    getAnalysis(&apos;${
                      result.track.id
                    }&apos;); getFeatures(&apos;${result.track.id}&apos;);">
                    ${result.track.artists
                      .map(eachArtist => eachArtist.name)
                      .join(', ')} - ${result.track.name}
                   </li>`
            )
            .join('')
        }
      })
      .catch(error => console.error('Error:', error))
  } else {
    if (document.getElementById(plistId).style.display === 'block') {
      document.getElementById(plistId).style.display = 'none'
    } else document.getElementById(plistId).style.display = 'block'
  }
}

function checkId (id) {
  if (profileInfo['subLevel'] === 'open') {
    return fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
      .then(e => e.json())
      .then(data => {
        if (data.item === null) {
          return ''
        }
        return data.item.id
      })
      .catch(error => {
        console.log('Error: ', error)
        var alerted = localStorage.getItem('alertedCheckId') || ''
        if (alerted != 'yes') {
          alert(
            `Choose song through another device (desktop client, phone, etc.) and` +
              ` click music icon in bottom left of page to sync with Melodera.`
          )
          localStorage.setItem('alertedCheckId', 'yes')
        }
        return ''
      })
  } else {
    return id
  }
}

function fetchQuery (query) {
  return fetch(query)
    .then(e => e.json())
    .then(data => {
      document.getElementById('pausedButton').style.display = 'block'
      document.getElementById('playedButton').style.display = 'none'
      beatsObj['startTime'] = new Array()
      beatsObj['beatDuration'] = new Array()
      pitchesObj['startTime'] = new Array()
      pitchesObj['pitch'] = new Array()
      pitchesObj['pitchSectionI'] = new Array()
      document.getElementById('domPitch').innerHTML = ''
      pitchCounter = 0
      beatCounter = 0
      prevBeatCounter = 0
      drawAnalysis(data)
    })
}

async function getAnalysis (id) {
  checkExpir()
  showSimLimit = 4
  if (document.body.contains(document.getElementById('simTrackCateg'))) {
    document.getElementById('btnSimT').remove()
    document.getElementById('simTrackCateg').remove()
    document.getElementById('moreBtnSimT').remove()
  }
  let query = '/analysis?id='
  id = await checkId(id)
  if (id === '') {
    alert(
      `Unable to fetch currently playing song. Please try again` +
        ` by choosing song through another device and clicking music note icon to sync.`
    )
    return
  }
  query += id
  await fetchQuery(query)
}

function moreBtnResults (category, isLibrary) {
  checkExpir()
  var indivResult = {}
  if (isLibrary) {
    if (category === 'tracksCateg') {
      tracksOffset += 4
      if (tracksOffset > 100) alert('Limit reached')
      else {
        Promise.all([
          fetch(
            'https://api.spotify.com/v1/me/tracks?limit=4&offset=' +
              tracksOffset,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          ).then(resp => resp.json())
        ])
          .then(data => {
            data.map(function (result) {
              indivResult['tracks'] = result
            })
            showAddResults(indivResult, true, category)
          })
          .catch(error => console.error('Error:', error))
      }
    } else if (category === 'artistsCateg') {
      artistsOffset += 4
      if (artistsOffset > 100) alert('Limit reached')
      else {
        Promise.all([
          fetch(
            'https://api.spotify.com/v1/me/following?type=artist&limit=4&after=' +
              afterArtistOset,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          ).then(resp => resp.json())
        ])
          .then(data => {
            data.map(function (result) {
              indivResult['artists'] = result.artists
            })
            showAddResults(indivResult, true, category)
          })
          .catch(error => console.error('Error:', error))
      }
    } else if (category === 'albumsCateg') {
      albumsOffset += 4
      if (albumsOffset > 100) alert('Limit reached')
      else {
        Promise.all([
          fetch(
            'https://api.spotify.com/v1/me/albums?limit=4&offset=' +
              albumsOffset +
              '&market=' +
              profileInfo['userCountry'],
            { headers: { Authorization: `Bearer ${accessToken}` } }
          ).then(resp => resp.json())
        ])
          .then(data => {
            data.map(function (result) {
              indivResult['albums'] = result
            })
            showAddResults(indivResult, true, category)
          })
          .catch(error => console.error('Error:', error))
      }
    } else if (category === 'plistsCateg') {
      plistsOffset += 4
      if (plistsOffset > 100) alert('Limit reached')
      else {
        Promise.all([
          fetch(
            'https://api.spotify.com/v1/me/playlists?limit=4&offset=' +
              plistsOffset,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          ).then(resp => resp.json())
        ])
          .then(data => {
            data.map(function (result) {
              indivResult['playlists'] = result
            })
            showAddResults(indivResult, true, category)
          })
          .catch(error => console.error('Error:', error))
      }
    }
  } else {
    if (category === 'tracksCateg') {
      tracksOffset += 4
      if (tracksOffset > 50) alert('Limit reached')
      else {
        Promise.all([
          fetch(
            'https://api.spotify.com/v1/search?q=' +
              searchVal +
              '&type=track&limit=4&offset=' +
              tracksOffset,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          ).then(resp => resp.json())
        ])
          .then(data => {
            data.map(function (result) {
              indivResult['tracks'] = result
            })
            showAddResults(indivResult.tracks, false, category)
          })
          .catch(error => console.error('Error:', error))
      }
    } else if (category === 'artistsCateg') {
      artistsOffset += 4
      if (artistsOffset > 50) alert('Limit reached')
      else {
        Promise.all([
          fetch(
            'https://api.spotify.com/v1/search?q=' +
              searchVal +
              '&type=artist&limit=4&offset=' +
              artistsOffset,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          ).then(resp => resp.json())
        ])
          .then(data => {
            data.map(function (result) {
              indivResult['artists'] = result
            })
            showAddResults(indivResult.artists, false, category)
          })
          .catch(error => console.error('Error:', error))
      }
    } else if (category === 'albumsCateg') {
      albumsOffset += 4
      if (albumsOffset > 50) alert('Limit reached')
      else {
        Promise.all([
          fetch(
            'https://api.spotify.com/v1/search?q=' +
              searchVal +
              '&type=album&limit=4&offset=' +
              albumsOffset,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          ).then(resp => resp.json())
        ])
          .then(data => {
            data.map(function (result) {
              indivResult['albums'] = result
            })
            showAddResults(indivResult.albums, false, category)
          })
          .catch(error => console.error('Error:', error))
      }
    } else if (category === 'plistsCateg') {
      plistsOffset += 4
      if (plistsOffset > 50) alert('Limit reached')
      else {
        Promise.all([
          fetch(
            'https://api.spotify.com/v1/search?q=' +
              searchVal +
              '&type=playlist&limit=4&offset=' +
              plistsOffset,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          ).then(resp => resp.json())
        ])
          .then(data => {
            data.map(function (result) {
              indivResult['playlists'] = result
            })
            showAddResults(indivResult.playlists, false, category)
          })
          .catch(error => console.error('Error:', error))
      }
    } else if (category.includes(`topTracksCateg`)) {
      topTracksOffset[category.substring(15)] += 10
      if (topTracksOffset[category.substring(15)] > 40) alert('Limit reached')
      else {
        fetch(
          '/topTracks?time_range=' +
            category.substring(15) +
            '&offset=' +
            topTracksOffset[category.substring(15)],
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        )
          .then(res => res.json())
          .then(data => {
            showAddResults(data, false, category)
          })
          .catch(error => console.error('Error:', error))
      }
    } else if (category.includes(`topArtistsCateg`)) {
      topArtistsOffset[category.substring(16)] += 10
      if (topArtistsOffset[category.substring(16)] > 40) alert('Limit reached')
      else {
        fetch(
          '/topArtists?time_range=' +
            category.substring(16) +
            '&offset=' +
            topArtistsOffset[category.substring(16)],
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        )
          .then(res => res.json())
          .then(data => {
            showAddResults(data, false, category)
          })
          .catch(error => console.error('Error:', error))
      }
    }
  }
}

function showResults (data, isLibrary) {
  document.getElementById('results').innerHTML =
    `<button class='btn btn-lg rounded-pill searchCateg activeCateg' 
            id='btnTracksCateg' type='button' data-bs-toggle='collapse' 
            data-bs-target='#tracksCateg, #moreBtnTracks' onclick="toggleCateg('btnTracksCateg')"
            aria-expanded='true' aria-controls='tracksCateg, moreBtnTracks'>
            Songs
           </button>
           <div class='collapse show searched' id='tracksCateg'>
          ` +
    data.tracks.items
      .map(
        result =>
          `<div class="text-white"
                onClick="playVid(&apos;${
                  isLibrary ? result.track.id : result.id
                }&apos;); 
                getAnalysis(&apos;${
                  isLibrary ? result.track.id : result.id
                }&apos;); 
                         getFeatures(&apos;${
                           isLibrary ? result.track.id : result.id
                         }&apos;);"
                >
                  <div>
                    <img style="padding-top:10px; display: flex; margin: 0px auto 0px auto; width: 64px; height:auto;" 
                         src="${
                           isLibrary
                             ? result.track.album.images.length === 0
                               ? 'images/music-note-beamed.svg'
                               : result.track.album.images[2].url
                             : result.album.images.length === 0
                             ? 'images/music-note-beamed.svg'
                             : result.album.images[2].url
                         }"
                         width="64" height="64">
                    <p class="resultText">
                    ${
                      isLibrary
                        ? result.track.artists
                            .map(eachArtist => eachArtist.name)
                            .join(', ')
                        : result.artists
                            .map(eachArtist => eachArtist.name)
                            .join(', ')
                    } - ${isLibrary ? result.track.name : result.name}
                    </p>
                    ${
                      isLibrary
                        ? result.track.album.release_date.trim() !== ''
                          ? `<p class="resultText fw-light fs-6">Released: ${result.track.album.release_date}</p>
                          <a class="btn btn-sm spotifyLink" href="${result.track.album.external_urls.spotify}">
                          <img src="images/spotify_logo.png" class="img-fluid" width="70px">
                          </a>
                      </div>`
                          : `</div>`
                        : result.album.release_date.trim() !== ''
                        ? `<p class="resultText fw-light fs-6">Released: ${result.album.release_date}</p>
                          <a class="btn btn-sm spotifyLink" href="${result.album.external_urls.spotify}">
                          <img src="images/spotify_logo.png" class="img-fluid" width="70px">
                          </a>
                      </div>`
                        : `</div>`
                    }
               </div>`
      )
      .join('') +
    '</div>' +
    `<button type="button" class="collapse show btn moreBtn" id='moreBtnTracks' 
              onclick='moreBtnResults(&apos;tracksCateg&apos;, ${isLibrary})'>
              See more
             </button>` +
    `<button class='btn btn-lg rounded-pill searchCateg'
            id='btnArtistsCateg' type='button' data-bs-toggle='collapse' 
            data-bs-target='#artistsCateg, #moreBtnArtists' onclick="toggleCateg('btnArtistsCateg')" 
            aria-expanded='false' aria-controls='artistsCateg, moreBtnArtists'>
            Artists
           </button>
           <div class='collapse searched' id='artistsCateg'>
          ` +
    data.artists.items
      .map(
        result =>
          `<div class="text-white"s
                onClick="getArtistSongs(&apos;${result.id}&apos;, this);"
                >
                  <div>
                    <img style="padding-top:10px; display: flex; margin: 0px auto 0px auto; width: 64px; height:auto;" 
                         src="${
                           result.images.length === 0
                             ? 'images/music-note-beamed.svg'
                             : result.images[2].url
                         }"
                         width="64" height="64">
                    <p class="resultText">
                    ${result.name}
                    </p>
                    <a class="btn btn-sm spotifyLink" href="${
                      result.external_urls.spotify
                    }">
                    <img src="images/spotify_logo.png" class="img-fluid" width="70px">
                    </a>
                    <ol class="addResultText" id=${result.id}>   
                    </ol>
                  </div>
               </div>`
      )
      .join('') +
    '</div>' +
    `<button type="button" class="collapse btn moreBtn" id='moreBtnArtists' 
              onclick='moreBtnResults(&apos;artistsCateg&apos;, ${isLibrary})'>
              See more
             </button>` +
    `<button class='btn btn-lg rounded-pill searchCateg'
            id='btnAlbumsCateg' type='button' data-bs-toggle='collapse' 
            data-bs-target='#albumsCateg, #moreBtnAlbums' onclick="toggleCateg('btnAlbumsCateg')"
            aria-expanded='false' aria-controls='albumsCateg, moreBtnAlbums'>
            Albums
           </button>
           <div class='collapse searched' id='albumsCateg'>
          ` +
    data.albums.items
      .map(
        result =>
          `<div class="text-white"
                onClick="getAlbumSongs(&apos;${
                  isLibrary ? result.album.id : result.id
                }&apos;);"
                >
                  <div>
                    <img style="padding-top:10px; display: flex; margin: 0px auto 0px auto; width: 64px; height:auto;" 
                         src="${
                           isLibrary
                             ? result.album.images.length === 0
                               ? 'images/music-note-beamed.svg'
                               : result.album.images[2].url
                             : result.images.length === 0
                             ? 'images/music-note-beamed.svg'
                             : result.images[2].url
                         }"
                         width="64" height="64">
                    <p class="resultText">
                    ${
                      isLibrary
                        ? result.album.artists
                            .map(eachArtist => eachArtist.name)
                            .join(', ')
                        : result.artists
                            .map(eachArtist => eachArtist.name)
                            .join(', ')
                    } - ${isLibrary ? result.album.name : result.name}
                    </p>
                    
                    ${
                      isLibrary
                        ? result.album.release_date.trim() !== ''
                          ? `<p class="resultText fw-light fs-6">${result.album.album_type}, ${result.album.release_date}</p>
                            <a class="btn btn-sm spotifyLink" href="${result.album.external_urls.spotify}">
                            <img src="images/spotify_logo.png" class="img-fluid" width="70px">
                            </a>
                       <ol class="addResultText" id=${result.album.id}>
                      </ol>`
                          : `<ol class="addResultText" id=${result.album.id}></ol>`
                        : result.release_date.trim() !== ''
                        ? `<p class="resultText fw-light fs-6">${result.album_type}, ${result.release_date}</p>
                          <a class="btn btn-sm spotifyLink" href="${result.external_urls.spotify}">
                          <img src="images/spotify_logo.png" class="img-fluid" width="70px">
                          </a>
                       <ol class="addResultText" id=${result.id}>
                      </ol>`
                        : `<ol class="addResultText" id=${result.id}></ol>`
                    }
                      
                  </div>
               </div>`
      )
      .join('') +
    '</div>' +
    `<button type="button" class="collapse btn moreBtn" id='moreBtnAlbums' 
              onclick='moreBtnResults(&apos;albumsCateg&apos;, ${isLibrary})'>
              See more
             </button>` +
    `<button class='btn btn-lg rounded-pill searchCateg'
            id='btnPlistsCateg' type='button' data-bs-toggle='collapse' 
            data-bs-target='#plistsCateg, #moreBtnPlists' onclick="toggleCateg('btnPlistsCateg')"
            aria-expanded='false' aria-controls='plistsCateg, moreBtnPlists'>
            Playlists
           </button>
           <div class='collapse searched' id='plistsCateg'>
          ` +
    data.playlists.items
      .map(
        result =>
          `<div class="text-white"
                onClick="getPlistSongs(&apos;${result.id}&apos;);"
                >
                  <div>
                    <img style="padding-top:10px; display: flex; margin: 0px auto 0px auto; width: 64px; height:auto;" 
                         src="${
                           result.images.length === 0
                             ? 'images/music-note-beamed.svg'
                             : result.images[0].url
                         }"
                         width="64" height="64">
                    <p class="resultText">
                    ${result.name} - By ${result.owner.display_name}
                    </p>
                    <ol class="addResultText" id=${result.id}>
                    </ol>
                  </div>
               </div>`
      )
      .join('') +
    '</div>' +
    `<button type="button" class="collapse btn moreBtn" id='moreBtnPlists' 
              onclick='moreBtnResults(&apos;plistsCateg&apos;, ${isLibrary})'>
              See more
             </button>` +
    '</div>'
  if (data.artists.items.length > 0)
    afterArtistOset = data.artists.items[data.artists.items.length - 1].id
}

function showAddResults (data, isLibrary, category) {
  if (category === 'tracksCateg') {
    document.getElementById(category).innerHTML += data.tracks.items
      .map(
        result =>
          `<div class="text-white"
                onClick="playVid(&apos;${
                  isLibrary ? result.track.id : result.id
                }&apos;); 
                  getAnalysis(&apos;${
                    isLibrary ? result.track.id : result.id
                  }&apos;); 
                         getFeatures(&apos;${
                           isLibrary ? result.track.id : result.id
                         }&apos;);"
                >
                  <div>
                    <img style="padding-top:10px; display: flex; margin: 0px auto 0px auto; width: 64px; height:auto;" 
                         src="${
                           isLibrary
                             ? result.track.album.images.length === 0
                               ? 'images/music-note-beamed.svg'
                               : result.track.album.images[2].url
                             : result.album.images.length === 0
                             ? 'images/music-note-beamed.svg'
                             : result.album.images[2].url
                         }"
                         width="64" height="64">
                    <p class="resultText">
                    ${
                      isLibrary
                        ? result.track.artists
                            .map(eachArtist => eachArtist.name)
                            .join(', ')
                        : result.artists
                            .map(eachArtist => eachArtist.name)
                            .join(', ')
                    } - ${isLibrary ? result.track.name : result.name}
                    </p>
                    ${
                      isLibrary
                        ? result.track.album.release_date.trim() !== ''
                          ? `<p class="resultText fw-light fs-6">Released: ${result.track.album.release_date}</p>
                            <a class="btn btn-sm spotifyLink" href="${result.track.album.external_urls.spotify}">
                            <img src="images/spotify_logo.png" class="img-fluid" width="70px">
                            </a>
                      </div>`
                          : `</div>`
                        : result.album.release_date.trim() !== ''
                        ? `<p class="resultText fw-light fs-6">Released: ${result.album.release_date}</p>
                          <a class="btn btn-sm spotifyLink" href="${result.album.external_urls.spotify}">
                          <img src="images/spotify_logo.png" class="img-fluid" width="70px">
                          </a>
                      </div>`
                        : `</div>`
                    }
               </div>`
      )
      .join('')
  } else if (category === 'artistsCateg') {
    document.getElementById(category).innerHTML += data.artists.items
      .map(
        result =>
          `<div class="text-white"
                onClick="getArtistSongs(&apos;${result.id}&apos;, this);"
                >
                  <div>
                    <img style="padding-top:10px; display: flex; margin: 0px auto 0px auto; width: 64px; height:auto;" 
                         src="${
                           result.images.length === 0
                             ? 'images/music-note-beamed.svg'
                             : result.images[2].url
                         }"
                         width="64" height="64">
                    <p class="resultText">
                    ${result.name}
                    </p>
                    <a class="btn btn-sm spotifyLink" href="${
                      result.external_urls.spotify
                    }">
                    <img src="images/spotify_logo.png" class="img-fluid" width="70px">
                    </a>
                    <ol class="addResultText" id=${result.id}>   
                    </ol>
                  </div>
               </div>`
      )
      .join('')
    if (data.artists.items.length > 0)
      afterArtistOset = data.artists.items[data.artists.items.length - 1].id
  } else if (category === 'albumsCateg') {
    document.getElementById(category).innerHTML += data.albums.items
      .map(
        result =>
          `<div class="text-white"
                onClick="getAlbumSongs(&apos;${
                  isLibrary ? result.album.id : result.id
                }&apos;);"
                >
                  <div>
                    <img style="padding-top:10px; display: flex; margin: 0px auto 0px auto; width: 64px; height:auto;" 
                         src="${
                           isLibrary
                             ? result.album.images.length === 0
                               ? 'images/music-note-beamed.svg'
                               : result.album.images[2].url
                             : result.images.length === 0
                             ? 'images/music-note-beamed.svg'
                             : result.images[2].url
                         }"
                         width="64" height="64">
                    <p class="resultText">
                    ${
                      isLibrary
                        ? result.album.artists
                            .map(eachArtist => eachArtist.name)
                            .join(', ')
                        : result.artists
                            .map(eachArtist => eachArtist.name)
                            .join(', ')
                    } - ${isLibrary ? result.album.name : result.name}
                    </p>
                    
                    ${
                      isLibrary
                        ? result.album.release_date.trim() !== ''
                          ? `<p class="resultText fw-light fs-6">${result.album.album_type}, ${result.album.release_date}</p>
                            <a class="btn btn-sm spotifyLink" href="${result.album.external_urls.spotify}">
                            <img src="images/spotify_logo.png" class="img-fluid" width="70px">
                            </a>
                       <ol class="addResultText" id=${result.album.id}>
                      </ol>`
                          : `<ol class="addResultText" id=${result.album.id}></ol>`
                        : result.release_date.trim() !== ''
                        ? `<p class="resultText fw-light fs-6">${result.album_type}, ${result.release_date}</p>
                          <a class="btn btn-sm spotifyLink" href="${result.external_urls.spotify}">
                          <img src="images/spotify_logo.png" class="img-fluid" width="70px">
                          </a>
                       <ol class="addResultText" id=${result.id}>
                      </ol>`
                        : `<ol class="addResultText" id=${result.id}></ol>`
                    }
                      
                  </div>
               </div>`
      )
      .join('')
  } else if (category === 'plistsCateg') {
    document.getElementById(category).innerHTML += data.playlists.items
      .map(
        result =>
          `<div class="text-white"
                onClick="getPlistSongs(&apos;${result.id}&apos;);"
                >
                  <div>
                    <img style="padding-top:10px; display: flex; margin: 0px auto 0px auto; width: 64px; height:auto;" 
                         src="${
                           result.images.length === 0
                             ? 'images/music-note-beamed.svg'
                             : result.images[0].url
                         }"
                         width="64" height="64">
                    <p class="resultText">
                    ${result.name} - By ${result.owner.display_name}
                    </p>
                    <ol class="addResultText" id=${result.id}>
                    </ol>
                  </div>
               </div>`
      )
      .join('')
  } else if (category.includes(`topTracksCateg`)) {
    let oSet = topTracksOffset[category.substring(15)] + 1
    document.getElementById(category).innerHTML += data.items
      .map(
        result =>
          `<div class="text-white-top"
                onClick="playVid(&apos;${result.id}&apos;); 
                  getAnalysis(&apos;${result.id}&apos;); 
                         getFeatures(&apos;${result.id}&apos;);"
                >
                  <div>
                    <img style="padding-top:10px; display: flex; margin: 0px auto 0px auto; width: 64px; height:auto;" 
                         src="${
                           result.album.images.length === 0
                             ? 'images/music-note-beamed.svg'
                             : result.album.images[2].url
                         }"
                         width="64" height="64">
                    <p class="resultText">
                    ${oSet++}.  ${result.artists
            .map(eachArtist => eachArtist.name)
            .join(', ')} - ${result.name}
                    </p>
                    ${
                      result.album.release_date.trim() !== ''
                        ? `<p class="resultText fw-light fs-6">Released: ${result.album.release_date}</p>
                          <a class="btn btn-sm spotifyLink" href="${result.album.external_urls.spotify}">
                          <img src="images/spotify_logo.png" class="img-fluid" width="70px">
                          </a>
                      </div>`
                        : `</div>`
                    }
                  </div>
               </div>`
      )
      .join('')
  } else if (category.includes(`topArtistsCateg`)) {
    let oSet = topArtistsOffset[category.substring(16)] + 1
    document.getElementById(category).innerHTML += data.items
      .map(
        result =>
          `<div class="text-white-top"
                onClick="getArtistSongs(&apos;${result.id}&apos;, this);"
                >
                  <div>
                    <img style="padding-top:10px; display: flex; margin: 0px auto 0px auto; width: 64px; height:auto;" 
                         src="${
                           result.images.length === 0
                             ? 'images/music-note-beamed.svg'
                             : result.images[2].url
                         }"
                         width="64" height="64">
                    <p class="resultText">
                    ${oSet++}.  ${result.name}
                    </p>
                    <ol class="addResultText" id=${result.id +
                      category.substring(15)}>
                    </ol>
                  </div>
               </div>`
      )
      .join('')
  }
}

function getMyLibrary () {
  checkExpir()
  tracksOffset = 0
  artistsOffset = 0
  albumsOffset = 0
  plistsOffset = 0
  showSimLimit = 4
  afterArtistOset = ''
  var fullResult = {}
  Promise.all([
    fetch(
      'https://api.spotify.com/v1/me/tracks?limit=4&offset=' + tracksOffset,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    ).then(resp => resp.json()),
    fetch(
      'https://api.spotify.com/v1/me/following?type=artist&limit=4&offset=' +
        artistsOffset,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    ).then(resp => resp.json()),
    fetch(
      'https://api.spotify.com/v1/me/albums?limit=4&offset=' +
        albumsOffset +
        '&market=' +
        profileInfo['userCountry'],
      { headers: { Authorization: `Bearer ${accessToken}` } }
    ).then(resp => resp.json()),
    fetch(
      'https://api.spotify.com/v1/me/playlists?limit=4&offset=' + plistsOffset,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    ).then(resp => resp.json())
  ])
    .then(data => {
      data.map(function (result, index) {
        if (index === 0) fullResult['tracks'] = result
        else if (index === 1) fullResult['artists'] = result.artists
        else if (index === 2) fullResult['albums'] = result
        else if (index === 3) fullResult['playlists'] = result
      })
      backToTop()
      showResults(fullResult, true)
    })
    .catch(error => console.error('Error:', error))
}

function getFeaturesData1 (id) {
  return fetch('https://api.spotify.com/v1/audio-features/' + id, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
    .then(e => e.json())
    .then(data => {
      currentValence = data.valence
      currentEnergy = data.energy
      currentTempo = data.tempo
      currentDanceability = data.danceability
      currentTimeSig = data.key
      if (data.key == 0) data.key = 'C'
      else if (data.key == 1) data.key = 'C&sharp;/D&flat;'
      else if (data.key == 2) data.key = 'D'
      else if (data.key == 3) data.key = 'D&sharp;/E&flat;'
      else if (data.key == 4) data.key = 'E'
      else if (data.key == 5) data.key = 'F'
      else if (data.key == 6) data.key = 'F&sharp;/G&flat;'
      else if (data.key == 7) data.key = 'G'
      else if (data.key == 8) data.key = 'G&sharp;/A&flat;'
      else if (data.key == 9) data.key = 'A'
      else if (data.key == 10) data.key = 'A&sharp;/B&flat;'
      else if (data.key == 11) data.key = 'B'
      else data.key = 'unknown'

      document.getElementById('BPM').innerHTML = Math.round(data.tempo) + ' BPM'
      document.getElementById('BPM').style.display = 'block'
      document.getElementById('bpmAndKey').innerHTML =
        'Key: ' +
        `<span id='keyOfT'>${data.key} ${
          data.mode == 1 ? 'Major' : 'Minor'
        }</span>` +
        ` <span style='font-size: x-large;'>|</span> ` +
        `Pitch: <span id='domPitch'></span>` +
        '<br>' +
        data.time_signature +
        ' beats per bar\n'
      if (data.instrumentalness >= 0.7 && data.valence >= 0.5) {
        document.getElementById('instrumental').innerHTML =
          "<br><span style='text-decoration: overline'>Mood: positivity and/or happiness</span><br>Instrumental"
      } else if (data.instrumentalness >= 0.7 && data.valence < 0.5) {
        document.getElementById('instrumental').innerHTML =
          "<br><span style='text-decoration: overline'>Mood: tension and/or melancholy</span><br>Instrumental"
      } else if (data.valence >= 0.5) {
        document.getElementById('instrumental').innerHTML =
          "<br><span style='text-decoration: overline'>Mood: positivity and/or happiness</span>"
      } else if (data.valence < 0.5) {
        document.getElementById('instrumental').innerHTML =
          "<br><span style='text-decoration: overline'>Mood: tension and/or melancholy</span>"
      }
    })
    .catch(error => {
      document.getElementById('bpmAndKey').innerHTML = error
    })
}

function getFeaturesData2 (id) {
  return fetch('https://api.spotify.com/v1/tracks/' + id, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
    .then(e => e.json())
    .then(data => {
      currentArtist = data.artists[0].id
      currentTrack = data.id
      document.getElementById('dividerLine').style.display = 'block'

      document.getElementById('artcover').src =
        data.album.images.length === 0
          ? 'images/music-note-beamed.svg'
          : data.album.images[1].url
      document.getElementById('artcover').style.display = 'block'
      document.getElementById('spotiflogo').style.display = 'block'

      fetch('/imgArt?img=' + data.album.images[1].url)
        .then(res => res.json())
        .then(data => {
          var rgbArray1 = data.Vibrant.rgb
          var rgbArray2 = data.Muted.rgb
          document.getElementById(
            'features-chart-container'
          ).style.backgroundColor =
            'rgba(' +
            rgbArray1[0] +
            ', ' +
            rgbArray1[1] +
            ', ' +
            rgbArray1[2] +
            ', 0.3)'
          document.getElementById('features-chart-container').style.border =
            '2px solid black'
          //document.getElementById("features-chart-container").style.height = "fit-content";
          document.getElementById('cover_and_play').style.border =
            '5px solid rgb(' +
            rgbArray2[0] +
            ', ' +
            rgbArray2[1] +
            ', ' +
            rgbArray2[2] +
            ')'
          document.getElementById('features-chart-container').scrollIntoView()
        })
        .catch(error => console.error('Error:', error))

      document.getElementById('play').style.display = 'grid'
      document.getElementById('hideSongs').style.display = 'flex'
      document.getElementById('linkalbum').href =
        ' ' + data.album.external_urls.spotify
      document.getElementById('albumart').innerHTML =
        '<span id="trackStatus">Currently Playing</span>: "' +
        data.name +
        '" by ' +
        data.artists.map(eachArtist => eachArtist.name).join(', ') +
        ' (from the ' +
        data.album.album_type +
        ' ' +
        data.album.name +
        ')'
      document.getElementById('albumart').style.display = 'block'
    })
    .catch(error => {
      document.getElementById('albumart').innerHTML = error
    })
}

async function getFeatures (id) {
  id = await checkId(id)
  if (id === '') {
    return
  }
  await getFeaturesData1(id)
  await getFeaturesData2(id)
}

function onSpotifyPlayerAPIReady () {
  player = new Spotify.Player({
    name: 'Melodera Player',
    getOauthToken: function (callback) {
      callback(accessToken)
    },
    volume: 0.8
  })

  player.addListener('ready', ({ device_id }) => {
    deviceId = device_id
  })

  player.addListener('not_ready', ({ device_id }) => {
    deviceId = device_id
    alert('Melodera player is not ready for playback. Please try again later.')
  })

  player.on('account_error', ({ message }) => {
    console.error('Failed to validate Spotify account', message)
  })
  // check player state
  player.on('player_state_changed', state => {
    if (
      this.state &&
      state.track_window.previous_tracks.find(
        x => x.id === state.track_window.current_track.id
      ) &&
      !this.state.paused &&
      state.paused
    ) {
      document.getElementById('pausedButton').style.display = 'none'
      document.getElementById('playedButton').style.display = 'block'
      document.getElementById('trackStatus').innerHTML = 'Done Playing'
      document.getElementById('domPitch').innerHTML = ''
      pitchCounter = 0
      beatCounter = 0
      prevBeatCounter = 0
    } else if (
      this.state &&
      state.paused &&
      window.getComputedStyle(document.getElementById('play')).display !==
        'none'
    ) {
      pauseVidAuto()
    } else if (
      this.state &&
      !state.paused &&
      window.getComputedStyle(document.getElementById('play')).display !==
        'none'
    ) {
      resumeVidAuto()
    }
    this.state = state
  })
  // Connect to the player
  player.connect().then(success => {
    if (success) {
      console.log('Melodera player connected to Spotify')
    }
  })
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.querySelector('input')
  document.querySelector('form').addEventListener('submit', function (event) {
    event.preventDefault()
    checkExpir()
    searchVal =
      input.value.trim() === '' ? 'johann sebastian bach' : input.value
    const searchQuery = '/search?query=' + searchVal + '&offset=' + defaultOset
    tracksOffset = 0
    artistsOffset = 0
    albumsOffset = 0
    plistsOffset = 0
    showSimLimit = 4
    fetch(searchQuery)
      .then(e => e.json())
      .then(data => {
        document.getElementById('searchTrack').reset()
        backToTop()
        showResults(data, false)
      })
      .catch(error => {
        document.getElementById('results').innerHTML = error
      })
  })
})

document.body.addEventListener(
  'click',
  () => {
    if (player && profileInfo['subLevel'] !== 'open') player.activateElement()
  },
  { once: true }
)

document
  .getElementById('results')
  .addEventListener('click', () => {}, { once: true })

document.getElementById('fullScreenBtn').addEventListener('click', () => {
  let fChart = document.getElementById('features-chart-container')
  if (fChart.requestFullscreen) {
    fChart.requestFullscreen()
  } else if (fChart.webkitRequestFullscreen) {
    fChart.webkitRequestFullscreen()
  } else if (fChart.mozRequestFullscreen) {
    fChart.mozRequestFullscreen()
  } else if (fChart.msRequestFullscreen) {
    fChart.msRequestFullscreen()
  } else if (fChart.mozEnterFullScreen) {
    fChart.mozEnterFullScreen()
  } else if (fChart.webkitEnterFullScreen) {
    fChart.webkitEnterFullScreen()
  } else if (fChart.msEnterFullScreen) {
    fChart.msEnterFullScreen()
  }
})

// start playback with Melodera player (premium feature)
function playVid (id) {
  checkExpir()
  if (player && profileInfo['subLevel'] !== 'open') {
    fetch(
      `https://api.spotify.com/v1/me/player/play${deviceId &&
        `?device_id=${deviceId}`}`,
      {
        method: 'PUT',
        body: JSON.stringify({ uris: [`spotify:track:${id}`], position_ms: 0 }),
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    ).catch(e => {
      console.log('Error:' + e)
    })
  }
}

function resumeVid () {
  checkExpir()
  document.getElementById('pausedButton').style.display = 'block'
  document.getElementById('playedButton').style.display = 'none'
  document.getElementById('trackStatus').innerHTML = 'Currently Playing'
  if (player) player.resume().then(() => {})
}
// resume functionality when not using Melodera's native resume button
function resumeVidAuto () {
  document.getElementById('pausedButton').style.display = 'block'
  document.getElementById('playedButton').style.display = 'none'
  document.getElementById('trackStatus').innerHTML = 'Currently Playing'
}

// show similar songs using current song's properties
function showSimilar () {
  fetch(
    'https://api.spotify.com/v1/recommendations?seed_artists=' +
      currentArtist +
      '&seed_tracks=' +
      currentTrack +
      '&target_energy=' +
      currentEnergy +
      '&target_valence=' +
      currentValence +
      '&target_tempo=' +
      currentTempo +
      '&target_danceability=' +
      currentDanceability +
      '&target_time_signature=' +
      currentTimeSig +
      '&market=' +
      profileInfo['userCountry'] +
      '&limit=' +
      showSimLimit,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  )
    .then(e => e.json())
    .then(data => {
      if (
        document.body.contains(document.getElementById('simTrackCateg')) &&
        showSimLimit > 100
      ) {
        alert('Limit reached')
      } else if (
        document.body.contains(document.getElementById('simTrackCateg'))
      ) {
        document.getElementById('simTrackCateg').innerHTML = data.tracks
          .map(
            track =>
              `<div class="text-white"
              onClick="playVid(&apos;${track.id}&apos;); 
              getAnalysis(&apos;${track.id}&apos;); getFeatures(&apos;${
                track.id
              }&apos;);"
              >
                <div>
                  <img style="padding-top:10px; display: flex; margin: 0px auto 0px auto; width: 64px; height:auto;" 
                       src="${
                         track.album.images.length === 0
                           ? 'images/music-note-beamed.svg'
                           : track.album.images[2].url
                       }"
                       width="64" height="64">
                  <p class="resultText">
                    ${track.artists
                      .map(eachArtist => eachArtist.name)
                      .join(', ')} - ${track.name}
                  </p>
                </div>
             </div>`
          )
          .join('')
        document
          .querySelector("button[aria-controls='simTrackCateg, moreBtnSimT']")
          .setAttribute('aria-expanded', 'true')
        document.getElementById('simTrackCateg').classList =
          'collapse show searched'
        document.getElementById('moreBtnSimT').classList =
          'collapse show btn moreBtn'
        showSimLimit += 4
        document.getElementById('simTrackCateg').scrollIntoView()
      } else {
        var simTrackElem1 = document.createElement('button')
        simTrackElem1.setAttribute(
          'class',
          'btn btn-lg rounded-pill searchCateg activeCateg'
        )
        simTrackElem1.setAttribute('id', 'btnSimT')
        simTrackElem1.setAttribute('type', 'button')
        simTrackElem1.setAttribute('data-bs-toggle', 'collapse')
        simTrackElem1.setAttribute(
          'data-bs-target',
          '#simTrackCateg, #moreBtnSimT'
        )
        simTrackElem1.setAttribute('onclick', "toggleCateg('btnSimT')")
        simTrackElem1.setAttribute('aria-expanded', true)
        simTrackElem1.setAttribute(
          'aria-controls',
          'simTrackCateg, moreBtnSimT'
        )
        simTrackElem1.innerHTML = 'Similar Songs'
        var simTrackElem2 = document.createElement('div')
        simTrackElem2.setAttribute('class', 'collapse show searched')
        simTrackElem2.setAttribute('id', 'simTrackCateg')
        simTrackElem2.innerHTML = data.tracks
          .map(
            track =>
              `<div class="text-white"
              onClick="playVid(&apos;${track.id}&apos;); 
              getAnalysis(&apos;${track.id}&apos;); getFeatures(&apos;${
                track.id
              }&apos;);"
              >
                <div>
                  <img style="padding-top:10px; display: flex; margin: 0px auto 0px auto; width: 64px; height:auto;" 
                       src="${
                         track.album.images.length === 0
                           ? 'images/music-note-beamed.svg'
                           : track.album.images[2].url
                       }"
                       width="64" height="64">
                  <p class="resultText">
                    ${track.artists
                      .map(eachArtist => eachArtist.name)
                      .join(', ')} - ${track.name}
                  </p>
                </div>
             </div>`
          )
          .join('')
        var simTrackElem3 = document.createElement('button')
        simTrackElem3.setAttribute('type', 'button')
        simTrackElem3.setAttribute('class', 'collapse show btn moreBtn')
        simTrackElem3.setAttribute('id', 'moreBtnSimT')
        simTrackElem3.setAttribute('onclick', 'showSimilar()')
        simTrackElem3.innerHTML = 'See more'
        showSimLimit += 4
        document.getElementById('results').appendChild(simTrackElem1)
        document.getElementById('results').appendChild(simTrackElem2)
        document.getElementById('results').appendChild(simTrackElem3)
        document
          .querySelector("button[aria-controls='simTrackCateg, moreBtnSimT']")
          .setAttribute('aria-expanded', 'true')
        document.getElementById('simTrackCateg').classList =
          'collapse show searched'
        document.getElementById('moreBtnSimT').classList =
          'collapse show btn moreBtn'
        document.getElementById('simTrackCateg').scrollIntoView()
      }
    })
}

function popPlist () {
  fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
    .then(e => e.json())
    .then(data => {
      if (data.items.length === 0) {
        document.getElementById(
          'plistOptions'
        ).innerHTML = `<p style="margin: auto">
               &lt;Nothing found&gt;
          </p>`
      } else {
        data.items.map(function (result) {
          if (
            result.owner.id === profileInfo['currentUser'] ||
            result.collaborative === true
          ) {
            var plistElem = document.createElement('li')
            var plistElemBtn = document.createElement('button')
            plistElemBtn.setAttribute('class', 'dropdown-item')
            plistElemBtn.setAttribute('type', 'button')
            plistElemBtn.setAttribute(
              'onclick',
              `addTrack2Plist('${currentTrack}','${result.id}')`
            )
            plistElemBtn.style.textAlign = 'center'
            plistElemBtn.innerHTML = result.name
            plistElem.appendChild(plistElemBtn)
            document.getElementById('plistOptions').appendChild(plistElem)
          }
        })
      }
    })
    .catch(error => {
      console.log(error)
    })
} // add to playlist functionality

function addTrack2Plist (track, playlist) {
  fetch(
    'https://api.spotify.com/v1/playlists/' +
      playlist +
      '/tracks?uris=spotify:track:' +
      track,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  )
    .then(() => {
      $('#plistAddSongToast').toast('show')
    })
    .catch(e => console.error(e))
}

function saveCurrTrack () {
  fetch('https://api.spotify.com/v1/me/tracks?ids=' + currentTrack, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
    .then(() => {
      $('#saveSongToast').toast('show')
    })
    .catch(e => console.error(e))
} // save track functionality

var saveSongNotif = document.getElementById('saveSongToast')
var song2PlistNotif = document.getElementById('plistAddSongToast')
var prevClassState1 = saveSongNotif.classList.contains('show')
var prevClassState2 = song2PlistNotif.classList.contains('show')
var observer1 = new MutationObserver(function (mutations) {
  // observe state of saveSongNotif
  mutations.forEach(function (mutation) {
    if (mutation.attributeName == 'class') {
      var currentClassState1 = mutation.target.classList.contains('show')
      if (prevClassState1 !== currentClassState1) {
        prevClassState1 = currentClassState1
        if (currentClassState1) {
          //console.log("saveSongNotif toast is showing");
          document.getElementById('toastDiv').style.display = 'block'
        } else {
          //console.log("saveSongNotif toast not showing");
          document.getElementById('toastDiv').style.display = 'none'
        }
      }
    }
  })
})
var observer2 = new MutationObserver(function (mutations) {
  // observe state of song2PlistNotif
  mutations.forEach(function (mutation) {
    if (mutation.attributeName == 'class') {
      var currentClassState2 = mutation.target.classList.contains('show')
      if (prevClassState2 !== currentClassState2) {
        prevClassState2 = currentClassState2
        if (currentClassState2) {
          //console.log("song2PlistNotif toast is showing");
          document.getElementById('toastDiv').style.display = 'block'
        } else {
          //console.log("song2PlistNotif toast not showing");
          document.getElementById('toastDiv').style.display = 'none'
        }
      }
    }
  })
})
observer1.observe(saveSongNotif, { attributes: true })
observer2.observe(song2PlistNotif, { attributes: true })

// add functionality to use spacebar for play/pause
window.onkeydown = function (event) {
  if (
    document.activeElement !== document.getElementById('inputSrch') &&
    document
      .getElementById('displaysong')
      .contains(document.getElementById('trackStatus'))
  ) {
    if (
      event.keyCode === 32 &&
      document.getElementById('playedButton').style.display === 'block'
    ) {
      resumeVid()
    } else if (
      event.keyCode === 32 &&
      document.getElementById('pausedButton').style.display === 'block'
    ) {
      pauseVid()
    }
  }
}

function pauseVid () {
  checkExpir()
  document.getElementById('pausedButton').style.display = 'none'
  document.getElementById('playedButton').style.display = 'block'
  document.getElementById('trackStatus').innerHTML = 'Paused'
  if (player) player.pause().then(() => {})
}
// pause functionality when not using Melodera's native pause button
function pauseVidAuto () {
  document.getElementById('pausedButton').style.display = 'none'
  document.getElementById('playedButton').style.display = 'block'
  if (document.getElementById('trackStatus').innerHTML !== 'Done Playing') {
    document.getElementById('trackStatus').innerHTML = 'Paused'
  }
}

/* some functions adapted from
  https://developer.spotify.com/community/showcase/spotify-audio-analysis/
*/
