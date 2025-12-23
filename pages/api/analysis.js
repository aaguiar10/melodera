import { createSpotifyClient } from '../../lib/spotify'

// Note: Spotify deprecated the Audio Analysis API in November 2024
// This endpoint returns placeholder data as a fallback
export default async function handler (req, res) {
  const accessToken = req.headers?.authorization?.split(' ')[1]
  const spotify = createSpotifyClient(accessToken)

  try {
    const [audioAnalysis, savedCheck] = await Promise.all([
      spotify.tracks.audioAnalysis(req.query.id),
      spotify.currentUser.tracks.hasSavedTracks([req.query.id])
    ])
    res.status(200).json({ ...audioAnalysis, isTrackSaved: savedCheck[0] })
  } catch (error) {
    // console.warn('Audio Analysis API error (likely deprecated):', error.message)

    // Try to at least get the saved status
    let isTrackSaved = false
    try {
      const savedCheck = await spotify.currentUser.tracks.hasSavedTracks([
        req.query.id
      ])
      isTrackSaved = savedCheck[0]
    } catch (e) {
      console.error('Could not check saved status:', e.message)
    }

    // Return placeholder data since Spotify deprecated this endpoint
    const placeholderAnalysis = {
      meta: {
        analyzer_version: 'placeholder',
        platform: 'web',
        detailed_status: 'Audio Analysis API is deprecated',
        status_code: 0,
        timestamp: Date.now(),
        analysis_time: 0,
        input_process: 'placeholder'
      },
      track: {
        num_samples: 0,
        duration: 200,
        sample_md5: '',
        offset_seconds: 0,
        window_seconds: 0,
        analysis_sample_rate: 22050,
        analysis_channels: 1,
        end_of_fade_in: 0,
        start_of_fade_out: 200,
        loudness: -10,
        tempo: 120,
        tempo_confidence: 0,
        time_signature: 4,
        time_signature_confidence: 0,
        key: 0,
        key_confidence: 0,
        mode: 1,
        mode_confidence: 0,
        codestring: '',
        code_version: 0,
        echoprintstring: '',
        echoprint_version: 0,
        synchstring: '',
        synch_version: 0,
        rhythmstring: '',
        rhythm_version: 0
      },
      bars: [],
      beats: [],
      sections: [],
      segments: [],
      tatums: [],
      isTrackSaved,
      _isPlaceholder: true,
      _message:
        'Audio Analysis API is deprecated. Apply for Extended Quota Mode at developer.spotify.com'
    }

    res.status(200).json(placeholderAnalysis)
  }
}
