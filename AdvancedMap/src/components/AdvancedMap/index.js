import React, { useRef, useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import {
  loadGoogleMaps,
  createPinIcon,
  createPulsingDotIcon,
  createNumberedPinIcon,
  formatDistance,
  formatDuration,
} from './mapLoader'

/* ──────────────────────────────────────────────
   Constants
   ────────────────────────────────────────────── */

const ANIMATION_STEP_MS = 20
const ANIMATION_STEPS = 30 // ~600 ms total for marker slide

/* ──────────────────────────────────────────────
   Helper: animate a marker from A → B
   ────────────────────────────────────────────── */
function animateMarker(marker, from, to, maps) {
  let step = 0
  const latStep = (to.lat() - from.lat()) / ANIMATION_STEPS
  const lngStep = (to.lng() - from.lng()) / ANIMATION_STEPS

  const interval = setInterval(() => {
    step++
    const lat = from.lat() + latStep * step
    const lng = from.lng() + lngStep * step
    marker.setPosition(new maps.LatLng(lat, lng))
    if (step >= ANIMATION_STEPS) clearInterval(interval)
  }, ANIMATION_STEP_MS)

  return interval
}

/* ──────────────────────────────────────────────
   Helper: check if coordinates are valid
   ────────────────────────────────────────────── */
function isValidCoord(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat !== 0 &&
    lng !== 0 &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

/* ──────────────────────────────────────────────
   Main Component
   ────────────────────────────────────────────── */
const AdvancedMap = (props) => {
  const {
    // API
    googleMapsApiKey,
    // Mode
    mapMode = 'tracking',
    // Map settings
    initialLatitude = 48.8566,
    initialLongitude = 2.3522,
    zoomLevel = 13,
    mapTypeId = 'roadmap',
    travelMode = 'DRIVING',
    showRoute = true,
    showInfoPanel = true,
    infoPanelPosition = 'bottom',
    // Tracking
    userLatitude = 0,
    userLongitude = 0,
    destinationLatitude = 0,
    destinationLongitude = 0,
    userLabel = 'You',
    destinationLabel = 'Destination',
    autoFitBounds = true,
    animateUserMarker = true,
    // Route builder
    waypoints = [],
    showSegmentDistances = true,
    showTotalSummary = true,
    optimizeWaypointOrder = false,
    // Autosave outputs
    totalDistance,
    totalDuration,
    // Actions
    onRouteCalculated,
    onMapTap,
    onWaypointTap,
    // Child component: styling
    mapStyling = {},
    // Editor injected
    editor,
    _width,
    _height,
  } = props

  const {
    routeColor = '#4285F4',
    routeWeight = 5,
    userMarkerColor = '#4285F4',
    destinationMarkerColor = '#EA4335',
    waypointMarkerColor = '#FBBC05',
    infoPanelBg = '#FFFFFF',
    infoPanelTextColor = '#333333',
    infoPanelFontSize = 14,
  } = mapStyling

  // ─── Refs ────────────────────────────
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const mapsRef = useRef(null)
  const userMarkerRef = useRef(null)
  const destMarkerRef = useRef(null)
  const waypointMarkersRef = useRef([])
  const directionsRendererRef = useRef(null)
  const segmentOverlaysRef = useRef([])
  const animIntervalRef = useRef(null)
  const routePolylineRef = useRef(null)

  // ─── State ───────────────────────────
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(null)
  const [routeInfo, setRouteInfo] = useState(null)
  const [segmentInfos, setSegmentInfos] = useState([])

  /* ────────────────────────────────────────
     LOAD GOOGLE MAPS
     ──────────────────────────────────────── */
  useEffect(() => {
    if (!googleMapsApiKey) {
      setError('Google Maps API key is required.')
      return
    }

    loadGoogleMaps(googleMapsApiKey)
      .then((maps) => {
        mapsRef.current = maps
        setLoaded(true)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load Google Maps')
      })
  }, [googleMapsApiKey])

  /* ────────────────────────────────────────
     INITIALISE MAP  (runs once after load)
     ──────────────────────────────────────── */
  useEffect(() => {
    if (!loaded || !containerRef.current || mapRef.current) return
    const maps = mapsRef.current

    const map = new maps.Map(containerRef.current, {
      center: { lat: initialLatitude, lng: initialLongitude },
      zoom: zoomLevel,
      mapTypeId: mapTypeId,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: getMapStyles(),
    })

    mapRef.current = map

    // Map click handler
    map.addListener('click', (e) => {
      if (onMapTap) {
        onMapTap(e.latLng.lat(), e.latLng.lng())
      }
    })
  }, [loaded]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ────────────────────────────────────────
     UPDATE MAP OPTIONS when props change
     ──────────────────────────────────────── */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.setMapTypeId(mapTypeId)
  }, [mapTypeId])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.setZoom(zoomLevel)
  }, [zoomLevel])

  /* ────────────────────────────────────────
     TRACKING MODE
     ──────────────────────────────────────── */
  useEffect(() => {
    if (!loaded || mapMode !== 'tracking') return
    const maps = mapsRef.current
    const map = mapRef.current
    if (!maps || !map) return

    // --- Clean up route builder artefacts ---
    clearWaypointMarkers()
    clearSegmentOverlays()
    clearRoutePolyline()

    const hasUser = isValidCoord(userLatitude, userLongitude)
    const hasDest = isValidCoord(destinationLatitude, destinationLongitude)

    // ── User marker ────────────────────
    if (hasUser) {
      const pos = new maps.LatLng(userLatitude, userLongitude)

      if (!userMarkerRef.current) {
        userMarkerRef.current = new maps.Marker({
          map,
          position: pos,
          icon: createPulsingDotIcon(maps, userMarkerColor),
          title: userLabel,
          zIndex: 10,
        })
      } else {
        // Animate or snap
        const prev = userMarkerRef.current.getPosition()
        if (animateUserMarker && prev) {
          if (animIntervalRef.current) clearInterval(animIntervalRef.current)
          animIntervalRef.current = animateMarker(
            userMarkerRef.current,
            prev,
            pos,
            maps
          )
        } else {
          userMarkerRef.current.setPosition(pos)
        }
        userMarkerRef.current.setIcon(
          createPulsingDotIcon(maps, userMarkerColor)
        )
        userMarkerRef.current.setTitle(userLabel)
      }
    }

    // ── Destination marker ─────────────
    if (hasDest) {
      const pos = new maps.LatLng(destinationLatitude, destinationLongitude)

      if (!destMarkerRef.current) {
        destMarkerRef.current = new maps.Marker({
          map,
          position: pos,
          icon: createPinIcon(maps, destinationMarkerColor),
          title: destinationLabel,
          zIndex: 5,
        })
      } else {
        destMarkerRef.current.setPosition(pos)
        destMarkerRef.current.setIcon(
          createPinIcon(maps, destinationMarkerColor)
        )
        destMarkerRef.current.setTitle(destinationLabel)
      }
    }

    // ── Route between user → destination ──
    if (hasUser && hasDest && showRoute) {
      calcTrackingRoute(maps, map)
    } else {
      // Clear previous renderer
      clearDirectionsRenderer()
      setRouteInfo(null)
      // Fit bounds to available markers
      if (hasUser && hasDest && autoFitBounds) {
        const bounds = new maps.LatLngBounds()
        bounds.extend(new maps.LatLng(userLatitude, userLongitude))
        bounds.extend(
          new maps.LatLng(destinationLatitude, destinationLongitude)
        )
        map.fitBounds(bounds, { top: 60, bottom: 60, left: 40, right: 40 })
      } else if (hasUser) {
        map.panTo(new maps.LatLng(userLatitude, userLongitude))
      } else if (hasDest) {
        map.panTo(
          new maps.LatLng(destinationLatitude, destinationLongitude)
        )
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    loaded,
    mapMode,
    userLatitude,
    userLongitude,
    destinationLatitude,
    destinationLongitude,
    showRoute,
    userMarkerColor,
    destinationMarkerColor,
    routeColor,
    routeWeight,
    travelMode,
    userLabel,
    destinationLabel,
    autoFitBounds,
    animateUserMarker,
  ])

  /* ────────────────────────────────────────
     ROUTE BUILDER MODE
     ──────────────────────────────────────── */
  useEffect(() => {
    if (!loaded || mapMode !== 'routeBuilder') return
    const maps = mapsRef.current
    const map = mapRef.current
    if (!maps || !map) return

    // --- Clean up tracking artefacts ---
    clearDirectionsRenderer()
    removeMarker(userMarkerRef)
    removeMarker(destMarkerRef)

    // Process waypoints from list data
    const points = extractWaypoints(waypoints)

    if (points.length === 0) {
      clearWaypointMarkers()
      clearSegmentOverlays()
      clearRoutePolyline()
      setRouteInfo(null)
      setSegmentInfos([])
      return
    }

    // ── Place waypoint markers ─────────
    clearWaypointMarkers()
    points.forEach((pt, idx) => {
      const pos = new maps.LatLng(pt.lat, pt.lng)
      const isFirst = idx === 0
      const isLast = idx === points.length - 1

      let icon
      if (isFirst) {
        icon = createPinIcon(maps, userMarkerColor)
      } else if (isLast) {
        icon = createPinIcon(maps, destinationMarkerColor)
      } else {
        icon = createNumberedPinIcon(maps, waypointMarkerColor, idx)
      }

      const marker = new maps.Marker({
        map,
        position: pos,
        icon,
        title: pt.label || `Waypoint ${idx + 1}`,
        zIndex: isFirst || isLast ? 10 : 5,
      })

      marker.addListener('click', () => {
        if (onWaypointTap) {
          onWaypointTap(
            pt.label || `Waypoint ${idx + 1}`,
            pt.lat,
            pt.lng
          )
        }
      })

      waypointMarkersRef.current.push(marker)
    })

    // ── Calculate multi-leg route ──────
    if (points.length >= 2 && showRoute) {
      calcRouteBuilderRoute(maps, map, points)
    } else {
      clearRoutePolyline()
      clearSegmentOverlays()
      setRouteInfo(null)
      setSegmentInfos([])

      // Zoom to markers
      const bounds = new maps.LatLngBounds()
      points.forEach((pt) => bounds.extend(new maps.LatLng(pt.lat, pt.lng)))
      map.fitBounds(bounds, { top: 60, bottom: 60, left: 40, right: 40 })
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    loaded,
    mapMode,
    waypoints,
    showRoute,
    showSegmentDistances,
    optimizeWaypointOrder,
    travelMode,
    routeColor,
    routeWeight,
    userMarkerColor,
    destinationMarkerColor,
    waypointMarkerColor,
  ])

  /* ────────────────────────────────────────
     ROUTE CALCULATION: Tracking Mode
     ──────────────────────────────────────── */
  const calcTrackingRoute = useCallback(
    (maps, map) => {
      const directionsService = new maps.DirectionsService()

      const request = {
        origin: new maps.LatLng(userLatitude, userLongitude),
        destination: new maps.LatLng(
          destinationLatitude,
          destinationLongitude
        ),
        travelMode: maps.TravelMode[travelMode] || maps.TravelMode.DRIVING,
      }

      directionsService.route(request, (result, status) => {
        if (status === 'OK') {
          // Use DirectionsRenderer for a polished display
          if (!directionsRendererRef.current) {
            directionsRendererRef.current = new maps.DirectionsRenderer({
              map,
              suppressMarkers: true, // we draw our own markers
              polylineOptions: {
                strokeColor: routeColor,
                strokeWeight: routeWeight,
                strokeOpacity: 0.85,
              },
            })
          } else {
            directionsRendererRef.current.setOptions({
              polylineOptions: {
                strokeColor: routeColor,
                strokeWeight: routeWeight,
                strokeOpacity: 0.85,
              },
            })
          }

          directionsRendererRef.current.setDirections(result)

          // Extract distance/duration
          const leg = result.routes[0].legs[0]
          const distM = leg.distance.value // metres
          const durS = leg.duration.value // seconds
          const distKm = parseFloat((distM / 1000).toFixed(2))
          const durMin = parseFloat((durS / 60).toFixed(1))

          setRouteInfo({
            distance: leg.distance.text,
            duration: leg.duration.text,
            distanceMetres: distM,
            durationSeconds: durS,
          })

          // Autosave outputs
          if (totalDistance && totalDistance.onChange) {
            totalDistance.onChange(distKm)
          }
          if (totalDuration && totalDuration.onChange) {
            totalDuration.onChange(durMin)
          }

          // Fire action
          if (onRouteCalculated) {
            onRouteCalculated(distKm, durMin)
          }

          // Fit bounds
          if (autoFitBounds) {
            const bounds = new maps.LatLngBounds()
            bounds.extend(new maps.LatLng(userLatitude, userLongitude))
            bounds.extend(
              new maps.LatLng(destinationLatitude, destinationLongitude)
            )
            map.fitBounds(bounds, {
              top: 60,
              bottom: 80,
              left: 40,
              right: 40,
            })
          }
        } else {
          console.warn('[AdvancedMap] Directions failed:', status)
          clearDirectionsRenderer()
        }
      })
    },
    [
      userLatitude,
      userLongitude,
      destinationLatitude,
      destinationLongitude,
      travelMode,
      routeColor,
      routeWeight,
      autoFitBounds,
      totalDistance,
      totalDuration,
      onRouteCalculated,
    ]
  )

  /* ────────────────────────────────────────
     ROUTE CALCULATION: Route Builder Mode
     ──────────────────────────────────────── */
  const calcRouteBuilderRoute = useCallback(
    (maps, map, points) => {
      clearRoutePolyline()
      clearSegmentOverlays()
      clearDirectionsRenderer()

      const directionsService = new maps.DirectionsService()

      const origin = new maps.LatLng(points[0].lat, points[0].lng)
      const destination = new maps.LatLng(
        points[points.length - 1].lat,
        points[points.length - 1].lng
      )

      // Intermediate waypoints
      const gmapsWaypoints = points.slice(1, -1).map((pt) => ({
        location: new maps.LatLng(pt.lat, pt.lng),
        stopover: true,
      }))

      const request = {
        origin,
        destination,
        waypoints: gmapsWaypoints,
        optimizeWaypoints: optimizeWaypointOrder,
        travelMode: maps.TravelMode[travelMode] || maps.TravelMode.DRIVING,
      }

      directionsService.route(request, (result, status) => {
        if (status !== 'OK') {
          console.warn('[AdvancedMap] Directions failed:', status)
          // Draw straight-line fallback
          drawStraightLineFallback(maps, map, points)
          return
        }

        const route = result.routes[0]
        const legs = route.legs

        // Draw the whole route polyline
        const path = route.overview_path
        const polyline = new maps.Polyline({
          map,
          path,
          strokeColor: routeColor,
          strokeWeight: routeWeight,
          strokeOpacity: 0.85,
        })
        routePolylineRef.current = polyline

        // Gather per-leg info
        let totalDistM = 0
        let totalDurS = 0
        const segments = []

        legs.forEach((leg, idx) => {
          totalDistM += leg.distance.value
          totalDurS += leg.duration.value

          segments.push({
            from: points[idx].label || `Point ${idx + 1}`,
            to: points[idx + 1].label || `Point ${idx + 2}`,
            distance: leg.distance.text,
            distanceValue: leg.distance.value,
            duration: leg.duration.text,
            durationValue: leg.duration.value,
          })

          // Place distance overlays on the map
          if (showSegmentDistances) {
            const midIdx = Math.floor(leg.steps.length / 2)
            const midStep = leg.steps[midIdx]
            const midPoint =
              midStep
                ? midStep.start_location
                : leg.start_location

            const overlay = createDistanceOverlay(
              maps,
              map,
              midPoint,
              leg.distance.text,
              infoPanelBg,
              infoPanelTextColor
            )
            segmentOverlaysRef.current.push(overlay)
          }
        })

        setSegmentInfos(segments)

        const distKm = parseFloat((totalDistM / 1000).toFixed(2))
        const durMin = parseFloat((totalDurS / 60).toFixed(1))

        setRouteInfo({
          distance: formatDistance(totalDistM),
          duration: formatDuration(totalDurS),
          distanceMetres: totalDistM,
          durationSeconds: totalDurS,
        })

        // Autosave
        if (totalDistance && totalDistance.onChange) {
          totalDistance.onChange(distKm)
        }
        if (totalDuration && totalDuration.onChange) {
          totalDuration.onChange(durMin)
        }

        // Action
        if (onRouteCalculated) {
          onRouteCalculated(distKm, durMin)
        }

        // Fit bounds
        const bounds = new maps.LatLngBounds()
        points.forEach((pt) =>
          bounds.extend(new maps.LatLng(pt.lat, pt.lng))
        )
        map.fitBounds(bounds, { top: 60, bottom: 80, left: 40, right: 40 })
      })
    },
    [
      optimizeWaypointOrder,
      travelMode,
      routeColor,
      routeWeight,
      showSegmentDistances,
      totalDistance,
      totalDuration,
      onRouteCalculated,
      infoPanelBg,
      infoPanelTextColor,
    ]
  )

  /* ────────────────────────────────────────
     FALLBACK: straight-line for no directions API
     ──────────────────────────────────────── */
  const drawStraightLineFallback = useCallback(
    (maps, map, points) => {
      const path = points.map((pt) => new maps.LatLng(pt.lat, pt.lng))
      const polyline = new maps.Polyline({
        map,
        path,
        strokeColor: routeColor,
        strokeWeight: routeWeight,
        strokeOpacity: 0.7,
        geodesic: true,
      })
      routePolylineRef.current = polyline

      // Calculate straight-line distances
      let totalDistM = 0
      const segments = []
      for (let i = 0; i < points.length - 1; i++) {
        const from = new maps.LatLng(points[i].lat, points[i].lng)
        const to = new maps.LatLng(points[i + 1].lat, points[i + 1].lng)
        const distM = maps.geometry.spherical.computeDistanceBetween(from, to)
        totalDistM += distM

        segments.push({
          from: points[i].label || `Point ${i + 1}`,
          to: points[i + 1].label || `Point ${i + 2}`,
          distance: formatDistance(distM),
          distanceValue: distM,
          duration: '—',
          durationValue: 0,
        })

        if (showSegmentDistances) {
          const midLat = (points[i].lat + points[i + 1].lat) / 2
          const midLng = (points[i].lng + points[i + 1].lng) / 2
          const mid = new maps.LatLng(midLat, midLng)
          const overlay = createDistanceOverlay(
            maps,
            map,
            mid,
            formatDistance(distM),
            infoPanelBg,
            infoPanelTextColor
          )
          segmentOverlaysRef.current.push(overlay)
        }
      }

      setSegmentInfos(segments)

      const distKm = parseFloat((totalDistM / 1000).toFixed(2))
      setRouteInfo({
        distance: formatDistance(totalDistM),
        duration: '—',
        distanceMetres: totalDistM,
        durationSeconds: 0,
      })

      if (totalDistance && totalDistance.onChange) {
        totalDistance.onChange(distKm)
      }

      const bounds = new maps.LatLngBounds()
      points.forEach((pt) => bounds.extend(new maps.LatLng(pt.lat, pt.lng)))
      map.fitBounds(bounds, { top: 60, bottom: 80, left: 40, right: 40 })
    },
    [
      routeColor,
      routeWeight,
      showSegmentDistances,
      totalDistance,
      infoPanelBg,
      infoPanelTextColor,
    ]
  )

  /* ────────────────────────────────────────
     HELPERS: extract waypoints from list
     ──────────────────────────────────────── */
  function extractWaypoints(list) {
    if (!Array.isArray(list)) return []

    return list
      .map((item) => {
        // Items come from childComponent "waypointItem"
        const child = item.waypointItem || item
        const lat = parseFloat(child.latitude ?? item.latitude ?? 0)
        const lng = parseFloat(child.longitude ?? item.longitude ?? 0)
        const label = child.label || item.label || ''
        if (!isValidCoord(lat, lng)) return null
        return { lat, lng, label }
      })
      .filter(Boolean)
  }

  /* ────────────────────────────────────────
     HELPERS: Cleanup functions
     ──────────────────────────────────────── */
  function clearDirectionsRenderer() {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null)
      directionsRendererRef.current = null
    }
  }

  function removeMarker(ref) {
    if (ref.current) {
      ref.current.setMap(null)
      ref.current = null
    }
  }

  function clearWaypointMarkers() {
    waypointMarkersRef.current.forEach((m) => m.setMap(null))
    waypointMarkersRef.current = []
  }

  function clearSegmentOverlays() {
    segmentOverlaysRef.current.forEach((o) => o.setMap(null))
    segmentOverlaysRef.current = []
  }

  function clearRoutePolyline() {
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null)
      routePolylineRef.current = null
    }
  }

  /* ────────────────────────────────────────
     CLEANUP on unmount
     ──────────────────────────────────────── */
  useEffect(() => {
    return () => {
      if (animIntervalRef.current) clearInterval(animIntervalRef.current)
      clearDirectionsRenderer()
      clearWaypointMarkers()
      clearSegmentOverlays()
      clearRoutePolyline()
    }
  }, [])

  /* ────────────────────────────────────────
     MAP STYLES (subtle, professional)
     ──────────────────────────────────────── */
  function getMapStyles() {
    return [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }],
      },
      {
        featureType: 'transit',
        elementType: 'labels.icon',
        stylers: [{ visibility: 'off' }],
      },
    ]
  }

  /* ────────────────────────────────────────
     DISTANCE OVERLAY (small label on map)
     ──────────────────────────────────────── */
  function createDistanceOverlay(maps, map, position, text, bg, color) {
    class DistanceLabel extends maps.OverlayView {
      constructor(pos, txt) {
        super()
        this.pos = pos
        this.txt = txt
        this.div = null
      }

      onAdd() {
        this.div = document.createElement('div')
        Object.assign(this.div.style, {
          position: 'absolute',
          background: bg || '#fff',
          color: color || '#333',
          padding: '2px 6px',
          borderRadius: '10px',
          fontSize: '11px',
          fontWeight: '600',
          fontFamily: 'Arial, sans-serif',
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          transform: 'translate(-50%, -50%)',
          zIndex: '1',
        })
        this.div.textContent = this.txt
        const panes = this.getPanes()
        panes.overlayLayer.appendChild(this.div)
      }

      draw() {
        if (!this.div) return
        const proj = this.getProjection()
        const point = proj.fromLatLngToDivPixel(this.pos)
        if (point) {
          this.div.style.left = point.x + 'px'
          this.div.style.top = point.y + 'px'
        }
      }

      onRemove() {
        if (this.div && this.div.parentNode) {
          this.div.parentNode.removeChild(this.div)
          this.div = null
        }
      }
    }

    const overlay = new DistanceLabel(position, text)
    overlay.setMap(map)
    return overlay
  }

  /* ════════════════════════════════════════
     RENDER
     ════════════════════════════════════════ */

  // ── Error state ─────────────────────
  if (error) {
    return (
      <View style={[styles.container, { width: _width, height: _height }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    )
  }

  // ── Loading state ───────────────────
  if (!loaded) {
    return (
      <View style={[styles.container, { width: _width, height: _height }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading map…</Text>
        </View>
      </View>
    )
  }

  // ── Info Panel Content ──────────────
  const renderInfoPanel = () => {
    if (!showInfoPanel || !routeInfo) return null

    const panelStyle = [
      styles.infoPanel,
      {
        backgroundColor: infoPanelBg,
        ...(infoPanelPosition === 'top'
          ? { top: 0, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }
          : {
              bottom: 0,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
            }),
      },
    ]

    const textStyle = { color: infoPanelTextColor, fontSize: infoPanelFontSize }

    if (mapMode === 'tracking') {
      return (
        <View style={panelStyle}>
          <View style={styles.infoPanelRow}>
            <View style={styles.infoPanelItem}>
              <Text style={[styles.infoPanelLabel, { color: infoPanelTextColor }]}>
                Distance
              </Text>
              <Text style={[styles.infoPanelValue, textStyle]}>
                {routeInfo.distance}
              </Text>
            </View>
            <View style={styles.infoPanelDivider} />
            <View style={styles.infoPanelItem}>
              <Text style={[styles.infoPanelLabel, { color: infoPanelTextColor }]}>
                ETA
              </Text>
              <Text style={[styles.infoPanelValue, textStyle]}>
                {routeInfo.duration}
              </Text>
            </View>
          </View>
          <View style={styles.infoPanelRouteBar}>
            <Text style={[styles.infoPanelRouteText, { color: infoPanelTextColor }]}>
              {userLabel} → {destinationLabel}
            </Text>
          </View>
        </View>
      )
    }

    // Route Builder info panel
    return (
      <View style={panelStyle}>
        {showTotalSummary && (
          <View style={styles.infoPanelRow}>
            <View style={styles.infoPanelItem}>
              <Text style={[styles.infoPanelLabel, { color: infoPanelTextColor }]}>
                Total Distance
              </Text>
              <Text style={[styles.infoPanelValue, textStyle]}>
                {routeInfo.distance}
              </Text>
            </View>
            <View style={styles.infoPanelDivider} />
            <View style={styles.infoPanelItem}>
              <Text style={[styles.infoPanelLabel, { color: infoPanelTextColor }]}>
                Total Duration
              </Text>
              <Text style={[styles.infoPanelValue, textStyle]}>
                {routeInfo.duration}
              </Text>
            </View>
          </View>
        )}
        {showSegmentDistances && segmentInfos.length > 0 && (
          <View style={styles.segmentsContainer}>
            {segmentInfos.map((seg, i) => (
              <View key={i} style={styles.segmentRow}>
                <Text
                  style={[
                    styles.segmentText,
                    { color: infoPanelTextColor, fontSize: infoPanelFontSize - 2 },
                  ]}
                  numberOfLines={1}
                >
                  {seg.from} → {seg.to}
                </Text>
                <Text
                  style={[
                    styles.segmentDistance,
                    { color: routeColor, fontSize: infoPanelFontSize - 2 },
                  ]}
                >
                  {seg.distance}
                  {seg.duration !== '—' ? ` · ${seg.duration}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    )
  }

  // ── Editor placeholder ──────────────
  if (editor && !googleMapsApiKey) {
    return (
      <View style={[styles.container, { width: _width, height: _height }]}>
        <View style={styles.editorPlaceholder}>
          <Text style={styles.editorPlaceholderIcon}>🗺️</Text>
          <Text style={styles.editorPlaceholderTitle}>Advanced Map</Text>
          <Text style={styles.editorPlaceholderSubtitle}>
            {mapMode === 'tracking'
              ? 'Live Tracking Mode'
              : 'Route Builder Mode'}
          </Text>
          <Text style={styles.editorPlaceholderHint}>
            Add a Google Maps API key to preview
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { width: _width, height: _height }]}>
      {/* Map container — rendered as a raw div for Google Maps */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      />
      {/* Info panel overlay */}
      {renderInfoPanel()}
    </View>
  )
}

/* ════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════ */

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 8,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff3f3',
    borderRadius: 8,
    padding: 20,
  },
  errorIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#cc0000',
    textAlign: 'center',
  },

  // Editor placeholder
  editorPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f0fe',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4285F4',
    borderStyle: 'dashed',
  },
  editorPlaceholderIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  editorPlaceholderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  editorPlaceholderSubtitle: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
  },
  editorPlaceholderHint: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
  },

  // Info Panel
  infoPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 10,
  },
  infoPanelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoPanelItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoPanelDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 12,
  },
  infoPanelLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 2,
    opacity: 0.6,
  },
  infoPanelValue: {
    fontWeight: '700',
  },
  infoPanelRouteBar: {
    marginTop: 8,
    alignItems: 'center',
  },
  infoPanelRouteText: {
    fontSize: 12,
    opacity: 0.7,
  },

  // Segments
  segmentsContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
    maxHeight: 120,
  },
  segmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  segmentText: {
    flex: 1,
    marginRight: 8,
  },
  segmentDistance: {
    fontWeight: '600',
  },
})

export default AdvancedMap
