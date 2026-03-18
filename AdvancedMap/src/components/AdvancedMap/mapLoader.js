/**
 * Google Maps JavaScript API loader utility.
 * Ensures the script is loaded only once per API key and provides
 * a promise-based interface for consumers.
 */

import { Car, Bike, PersonStanding, Package, Truck } from 'lucide'

const loadedScripts = {}

/**
 * Load the Google Maps JS API (with Directions library).
 * Returns a promise that resolves with the global `google.maps` object.
 *
 * @param {string} apiKey - Google Maps API key
 * @returns {Promise<typeof google.maps>}
 */
export function loadGoogleMaps(apiKey) {
  if (!apiKey) {
    return Promise.reject(new Error('Google Maps API key is required'))
  }

  // Already loaded for this key
  if (loadedScripts[apiKey]) {
    return loadedScripts[apiKey]
  }

  // Already present on the page (e.g. another component loaded it)
  if (
    typeof window !== 'undefined' &&
    window.google &&
    window.google.maps &&
    window.google.maps.DirectionsService
  ) {
    loadedScripts[apiKey] = Promise.resolve(window.google.maps)
    return loadedScripts[apiKey]
  }

  loadedScripts[apiKey] = new Promise((resolve, reject) => {
    try {
      const callbackName = `__gmapsInit_${Date.now()}`

      window[callbackName] = () => {
        delete window[callbackName]
        if (window.google && window.google.maps) {
          resolve(window.google.maps)
        } else {
          reject(new Error('Google Maps failed to initialise'))
        }
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places&callback=${callbackName}`
      script.async = true
      script.defer = true
      script.onerror = () => {
        delete window[callbackName]
        delete loadedScripts[apiKey]
        reject(new Error('Failed to load Google Maps script'))
      }
      document.head.appendChild(script)
    } catch (err) {
      delete loadedScripts[apiKey]
      reject(err)
    }
  })

  return loadedScripts[apiKey]
}

/**
 * Create an SVG marker icon with a given fill colour.
 *
 * @param {typeof google.maps} maps - The google.maps namespace
 * @param {string} color - CSS colour string
 * @param {number} [scale=1] - Icon scale multiplier
 * @returns {google.maps.Symbol}
 */
export function createMarkerIcon(maps, color, scale = 1) {
  return {
    path: maps.SymbolPath.CIRCLE,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeWeight: 2,
    scale: 8 * scale,
  }
}

/**
 * Create a pin-style SVG marker icon.
 *
 * @param {typeof google.maps} maps
 * @param {string} color
 * @returns {google.maps.Icon}
 */
export function createPinIcon(maps, color) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26C32 7.16 24.84 0 16 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="16" cy="16" r="6" fill="#fff"/>
    </svg>
  `
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new maps.Size(32, 42),
    anchor: new maps.Point(16, 42),
  }
}

/* ──────────────────────────────────────────────
   Lucide-based marker icon helper.
   Converts Lucide icon node arrays (from the `lucide`
   vanilla package) into SVG strings inside a coloured
   circle, suitable for Google Maps markers.
   ────────────────────────────────────────────── */

/** Map of icon type string → Lucide icon node array */
const LUCIDE_ICON_MAP = {
  car: Car,
  bike: Bike,
  truck: Truck,
  person: PersonStanding,
  package: Package,
}

/**
 * Convert a Lucide icon node array into an SVG elements string.
 * Each node is a tuple: [tagName, { attr1: val1, ... }]
 *
 * @param {Array<[string, Object]>} iconNode
 * @returns {string} SVG inner elements (no wrapping <svg>)
 */
function iconNodeToSvg(iconNode) {
  return iconNode
    .map(([tag, attrs]) => {
      const attrStr = Object.entries(attrs)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ')
      // All Lucide elements are self-closing (path, circle, polyline, line, rect)
      return `<${tag} ${attrStr}/>`
    })
    .join('')
}

/**
 * Build a Google Maps marker icon from a Lucide icon node array,
 * rendered inside a coloured circle.
 *
 * @param {typeof google.maps} maps
 * @param {string} color - Background circle colour
 * @param {Array<[string, Object]>} iconNode - Lucide icon node array
 * @returns {google.maps.Icon}
 */
export function createLucideMarkerIcon(maps, color, iconNode) {
  const innerElements = iconNodeToSvg(iconNode)

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="19" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <svg x="9" y="9" width="22" height="22" viewBox="0 0 24 24"
           fill="none" stroke="#fff" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        ${innerElements}
      </svg>
    </svg>
  `

  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new maps.Size(40, 40),
    anchor: new maps.Point(20, 20),
  }
}

/**
 * Create a numbered pin SVG marker for waypoints.
 *
 * @param {typeof google.maps} maps
 * @param {string} color
 * @param {number|string} label
 * @returns {google.maps.Icon}
 */
export function createNumberedPinIcon(maps, color, label) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26C32 7.16 24.84 0 16 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <text x="16" y="21" text-anchor="middle" fill="#fff" font-size="14" font-weight="bold" font-family="Arial,sans-serif">${label}</text>
    </svg>
  `
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new maps.Size(32, 42),
    anchor: new maps.Point(16, 42),
  }
}

/**
 * Pulsating blue dot for the "user" location (like ride-hailing apps).
 *
 * @param {typeof google.maps} maps
 * @param {string} color
 * @returns {google.maps.Icon}
 */
export function createPulsingDotIcon(maps, color) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="1" stroke-opacity="0.4"/>
      <circle cx="20" cy="20" r="8" fill="${color}" stroke="#fff" stroke-width="2.5"/>
    </svg>
  `
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new maps.Size(40, 40),
    anchor: new maps.Point(20, 20),
  }
}

/**
 * Dispatcher: returns the appropriate icon based on `iconType`.
 *
 * Supported types: 'pulsingDot', 'pin', 'car', 'bike', 'truck', 'person', 'package'.
 * Falls back to `pin` for unknown types.
 *
 * @param {typeof google.maps} maps
 * @param {string} color
 * @param {string} iconType
 * @returns {google.maps.Icon|google.maps.Symbol}
 */
export function createMarkerByType(maps, color, iconType) {
  // Check if it's a Lucide-based icon
  const LucideIcon = LUCIDE_ICON_MAP[iconType]
  if (LucideIcon) {
    return createLucideMarkerIcon(maps, color, LucideIcon)
  }

  // Built-in icon types
  switch (iconType) {
    case 'pulsingDot':
      return createPulsingDotIcon(maps, color)
    case 'pin':
    default:
      return createPinIcon(maps, color)
  }
}

/**
 * Format metres into a human-friendly distance string.
 *
 * @param {number} metres
 * @returns {string}
 */
export function formatDistance(metres) {
  if (metres < 1000) {
    return `${Math.round(metres)} m`
  }
  return `${(metres / 1000).toFixed(1)} km`
}

/**
 * Format seconds into a human-friendly duration string.
 *
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  if (seconds < 60) {
    return `${Math.round(seconds)} sec`
  }
  const mins = Math.round(seconds / 60)
  if (mins < 60) {
    return `${mins} min`
  }
  const hrs = Math.floor(mins / 60)
  const remainMins = mins % 60
  return remainMins > 0 ? `${hrs} h ${remainMins} min` : `${hrs} h`
}
