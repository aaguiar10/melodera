const LOCALSTORAGE_ACCESS_TOKEN_KEY = "app-spotify-access-token";
const LOCALSTORAGE_ACCESS_TOKEN_EXPIRY_KEY =
  "app-spotify-access-token-expires-in";

function parseHash(hash) {
  return hash
    .substring(1)
    .split("&")
    .reduce(function (initial, item) {
      if (item) {
        var parts = item.split("=");
        initial[parts[0]] = decodeURIComponent(parts[1]);
      }
      return initial;
    }, {});
}

document.addEventListener("DOMContentLoaded", () => {
  if (
    localStorage.getItem(LOCALSTORAGE_ACCESS_TOKEN_KEY) && 
    parseInt(localStorage.getItem(LOCALSTORAGE_ACCESS_TOKEN_EXPIRY_KEY)) > Date.now()
  ) {
    window.location = "/analysis.html";
  } else {
    if (window.location.hash) {
      const hash = parseHash(window.location.hash);
      if (hash["access_token"] && hash["expires_in"]) {
        localStorage.setItem(
          LOCALSTORAGE_ACCESS_TOKEN_KEY,
          hash["access_token"] // store access_token
        );
        localStorage.setItem(
          LOCALSTORAGE_ACCESS_TOKEN_EXPIRY_KEY,
          Date.now() + 1000 * parseInt(hash["expires_in"]) // store expiration time (in ms)
        );
        localStorage.setItem("beat_visualizer_state", 
                             JSON.stringify(false)); // default visualizer state
        localStorage.setItem("beat_visualizer_type", ""); // default vis type
        window.location = "/analysis.html";
      }
    }
    document.getElementById("login").addEventListener("click", function (e) {
      e.preventDefault();
      fetch("/spotifyRedirectUri")
        .then((e) => e.json())
        .then((data) => {
          window.location = data.redirectUri;
        })
        .catch((error) => {
          alert("Failed to prepare for Spotify Authentication");
        });
    });
  }
});

/* some functions adapted from
  https://developer.spotify.com/community/showcase/spotify-audio-analysis/
*/