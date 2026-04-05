# peertube-plugin-copy-hls-url

Adds an admin-only HLS control to PeerTube watch pages so instance administrators can copy or open the current video's HLS master playlist URL.

## Features

- Shows the HLS master `.m3u8` URL for the current video
- Copies the URL to the clipboard
- Opens the URL in a new tab
- Renders in the watch-page action area under the player
- Only appears for logged-in PeerTube administrators

## Compatibility

- PeerTube `>= 7.0.0`

## Installation

### From the PeerTube admin interface

Search for `peertube-plugin-copy-hls-url` in the plugin list and install it.

### From the command line on the PeerTube server

```bash
cd /var/www/peertube/peertube-latest
sudo -u peertube -H env NODE_ENV=production NODE_CONFIG_DIR=/var/www/peertube/config \
  node dist/scripts/plugin/install.js --plugin-path /absolute/path/to/peertube-plugin-copy-hls-url
sudo systemctl restart peertube
```

## Behavior

- The control is only rendered on `video-watch` pages.
- The control is hidden from anonymous users and non-admin accounts.
- If HLS transcoding is not available yet, the plugin shows a status message instead of a usable URL.
- The plugin prefers the HLS master playlist URL ending in `-master.m3u8`.

## Development

This plugin uses plain client-side JavaScript and CSS, so there is no separate build step.

To test locally on a PeerTube server:

```bash
cd /var/www/peertube/peertube-latest
sudo -u peertube -H env NODE_ENV=production NODE_CONFIG_DIR=/var/www/peertube/config \
  node dist/scripts/plugin/install.js --plugin-path /absolute/path/to/peertube-plugin-copy-hls-url
sudo systemctl restart peertube
```
