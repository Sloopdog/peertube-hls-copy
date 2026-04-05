const WIDGET_ID = 'pt-copy-hls-widget'
const ADMIN_ROLE_ID = 0

function copyText (text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text)
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'readonly')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()

  const ok = document.execCommand('copy')
  document.body.removeChild(textarea)

  if (!ok) {
    throw new Error('copy failed')
  }
}

function getPlaylistUrl (video) {
  if (!video || !Array.isArray(video.streamingPlaylists) || video.streamingPlaylists.length === 0) {
    return null
  }

  const masterPlaylist = video.streamingPlaylists.find(p => typeof p.playlistUrl === 'string' && p.playlistUrl.endsWith('-master.m3u8'))
  if (masterPlaylist) return masterPlaylist.playlistUrl

  const firstPlaylist = video.streamingPlaylists[0]
  return firstPlaylist && typeof firstPlaylist.playlistUrl === 'string' ? firstPlaylist.playlistUrl : null
}

function getOrCreateWidgetRoot () {
  const existing = document.getElementById(WIDGET_ID)
  if (existing) return existing

  const widget = document.createElement('section')
  widget.id = WIDGET_ID
  widget.innerHTML = `
    <div class="pt-copy-hls-title">HLS stream</div>
    <div class="pt-copy-hls-row">
      <input class="pt-copy-hls-input" type="text" readonly aria-label="HLS stream URL" />
      <button class="pt-copy-hls-copy" type="button">Copy</button>
      <a class="pt-copy-hls-open" target="_blank" rel="noreferrer noopener">Open</a>
    </div>
    <div class="pt-copy-hls-status" aria-live="polite"></div>
  `

  const content = document.getElementById('content')
  const actionsArea = (content && content.querySelector('.video-info-first-row-bottom')) || document.querySelector('.video-info-first-row-bottom')

  if (actionsArea) {
    actionsArea.appendChild(widget)
    return widget
  }

  const videoWrapper = (content && content.querySelector('#video-wrapper')) || document.getElementById('video-wrapper')

  if (videoWrapper && videoWrapper.parentNode) {
    if (videoWrapper.nextSibling) {
      videoWrapper.parentNode.insertBefore(widget, videoWrapper.nextSibling)
    } else {
      videoWrapper.parentNode.appendChild(widget)
    }

    return widget
  }

  const placeholder = document.getElementById('plugin-placeholder-player-next')
  if (!placeholder) return null

  placeholder.appendChild(widget)
  return widget
}

function removeWidget () {
  const existing = document.getElementById(WIDGET_ID)
  if (existing) existing.remove()
}

async function isCurrentUserAdmin (peertubeHelpers) {
  if (!peertubeHelpers || typeof peertubeHelpers.isLoggedIn !== 'function' || !peertubeHelpers.isLoggedIn()) {
    return false
  }

  const headers = typeof peertubeHelpers.getAuthHeader === 'function'
    ? (peertubeHelpers.getAuthHeader() || {})
    : {}

  try {
    const response = await fetch('/api/v1/users/me', {
      headers,
      credentials: 'same-origin'
    })

    if (!response.ok) return false

    const user = await response.json()
    const roleId = user && user.role && typeof user.role === 'object'
      ? user.role.id
      : user && user.role

    return roleId === ADMIN_ROLE_ID
  } catch (error) {
    return false
  }
}

function renderWidget (video, notifier) {
  const widget = getOrCreateWidgetRoot()
  if (!widget) return false

  const url = getPlaylistUrl(video)
  const input = widget.querySelector('.pt-copy-hls-input')
  const copyButton = widget.querySelector('.pt-copy-hls-copy')
  const openButton = widget.querySelector('.pt-copy-hls-open')
  const status = widget.querySelector('.pt-copy-hls-status')

  if (!url) {
    input.value = 'HLS URL is not available until transcoding finishes.'
    copyButton.disabled = true
    openButton.removeAttribute('href')
    openButton.setAttribute('aria-disabled', 'true')
    openButton.tabIndex = -1
    status.textContent = 'No streaming playlist is available for this video yet.'
    return true
  }

  input.value = url
  openButton.href = url
  copyButton.disabled = false
  openButton.removeAttribute('aria-disabled')
  openButton.tabIndex = 0
  status.textContent = 'Ready to copy.'

  input.onclick = () => {
    input.select()
    input.setSelectionRange(0, input.value.length)
  }

  copyButton.onclick = async () => {
    try {
      await copyText(url)
      status.textContent = 'Copied to clipboard.'
      notifier.success('HLS URL copied to clipboard.')
    } catch (error) {
      status.textContent = 'Copy failed.'
      notifier.error('Could not copy the HLS URL.')
    }
  }

  return true
}

function renderWhenReady (video, notifier, attempt = 0) {
  if (renderWidget(video, notifier)) return
  if (attempt >= 20) return

  window.setTimeout(() => renderWhenReady(video, notifier, attempt + 1), 250)
}

function register ({ registerHook, peertubeHelpers }) {
  const { notifier } = peertubeHelpers

  registerHook({
    target: 'action:video-watch.video.loaded',
    handler: async ({ video }) => {
      const isAdmin = await isCurrentUserAdmin(peertubeHelpers)
      if (!isAdmin) {
        removeWidget()
        return
      }

      renderWhenReady(video, notifier)
    }
  })
}

export {
  register
}
