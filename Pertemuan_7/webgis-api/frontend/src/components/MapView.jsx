import { useEffect, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Peta warna per kategori jenis
const JENIS_COLORS = {
  'Rumah Sakit':    '#f43f5e',
  'Puskesmas':      '#ec4899',
  'Klinik':         '#f59e0b',
  'Apotek':         '#10b981',
  'Sekolah':        '#6366f1',
  'Universitas':    '#8b5cf6',
  'Masjid':         '#06b6d4',
  'Gereja':         '#0ea5e9',
  'Pasar':          '#f97316',
  'Mall':           '#a855f7',
  'Bank':           '#14b8a6',
  'ATM':            '#22d3ee',
  'SPBU':           '#ef4444',
  'Hotel':          '#eab308',
  'Restoran':       '#84cc16',
  'Kantor Polisi':  '#3b82f6',
  'Kantor Pos':     '#f59e0b',
  'Stasiun':        '#64748b',
  'Terminal':       '#78716c',
}

// Warna fallback untuk kategori yang tidak terdaftar
const FALLBACK_COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#f43f5e', '#0ea5e9', '#ec4899', '#f97316', '#a855f7',
]

let colorIndex = 0
const dynamicColorMap = {}

export function getColorForJenis(jenis) {
  if (JENIS_COLORS[jenis]) return JENIS_COLORS[jenis]
  if (!dynamicColorMap[jenis]) {
    dynamicColorMap[jenis] = FALLBACK_COLORS[colorIndex % FALLBACK_COLORS.length]
    colorIndex++
  }
  return dynamicColorMap[jenis]
}

// Emoji ikon per kategori
const JENIS_ICONS = {
  'Rumah Sakit': '🏥', 'Puskesmas': '🩺', 'Klinik': '🏨',
  'Apotek': '💊', 'Sekolah': '🏫', 'Universitas': '🎓',
  'Masjid': '🕌', 'Gereja': '⛪', 'Pasar': '🏪',
  'Mall': '🛒', 'Bank': '🏦', 'ATM': '💳',
  'SPBU': '⛽', 'Hotel': '🏨', 'Restoran': '🍽️',
  'Kantor Polisi': '🚔', 'Kantor Pos': '📮', 'Stasiun': '🚉',
  'Terminal': '🚌',
}

function getIconForJenis(jenis) {
  return JENIS_ICONS[jenis] || '📍'
}

// Buat circle marker SVG sebagai divIcon
function createMarkerIcon(jenis) {
  const color = getColorForJenis(jenis)
  const html = `
    <div class="custom-marker" style="
      width: 28px;
      height: 28px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="12" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/>
        <circle cx="14" cy="14" r="6" fill="${color}" />
      </svg>
      <div style="
        position: absolute;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: ${color};
        opacity: 0;
        filter: blur(8px);
        transition: opacity 0.2s ease;
        pointer-events: none;
        z-index: -1;
      " class="marker-glow"></div>
    </div>
  `
  return L.divIcon({
    html,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  })
}

// Komponen untuk auto-fit bounds
function FitBounds({ geojsonData }) {
  const map = useMap()

  useEffect(() => {
    if (!geojsonData || !geojsonData.features || geojsonData.features.length === 0) return

    const bounds = L.geoJSON(geojsonData).getBounds()
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 })
    }
  }, [geojsonData, map])

  return null
}

// Popup content
function createPopupContent(properties) {
  const { nama, jenis, alamat } = properties
  const color = getColorForJenis(jenis)
  const icon = getIconForJenis(jenis)

  return `
    <div class="popup-card">
      <div class="popup-header">
        <div class="popup-icon" style="background: ${color}20; color: ${color};">
          ${icon}
        </div>
        <div>
          <div class="popup-nama">${nama || 'Tanpa Nama'}</div>
          <span class="popup-jenis" style="background: ${color}20; color: ${color};">
            ${jenis || 'Tidak diketahui'}
          </span>
        </div>
      </div>
      <div class="popup-divider"></div>
      <div class="popup-alamat">
        <span class="popup-alamat-icon">📍</span>
        <span>${alamat || 'Alamat tidak tersedia'}</span>
      </div>
    </div>
  `
}

function MapView({ geojsonData, loading }) {
  const geoJsonRef = useRef(null)

  const defaultCenter = [-6.9, 107.6] // Bandung default
  const defaultZoom = 12

  // Handler GeoJSON
  const onEachFeature = useMemo(() => {
    return (feature, layer) => {
      // Popup
      layer.bindPopup(createPopupContent(feature.properties), {
        closeButton: true,
        maxWidth: 280,
        minWidth: 220,
      })

      // Hover: glow effect
      layer.on('mouseover', function () {
        const el = this.getElement && this.getElement()
        if (el) {
          const markerDiv = el.querySelector('.custom-marker')
          if (markerDiv) {
            markerDiv.style.transform = 'scale(1.4)'
            markerDiv.style.filter = 'brightness(1.3) drop-shadow(0 0 8px rgba(99,102,241,0.6))'
          }
          const glow = el.querySelector('.marker-glow')
          if (glow) {
            glow.style.opacity = '0.4'
          }
        }
      })

      layer.on('mouseout', function () {
        const el = this.getElement && this.getElement()
        if (el) {
          const markerDiv = el.querySelector('.custom-marker')
          if (markerDiv) {
            markerDiv.style.transform = 'scale(1)'
            markerDiv.style.filter = 'none'
          }
          const glow = el.querySelector('.marker-glow')
          if (glow) {
            glow.style.opacity = '0'
          }
        }
      })

      // Click: fly to
      layer.on('click', function (e) {
        const map = e.target._map
        if (map) {
          map.flyTo(e.latlng, Math.max(map.getZoom(), 15), {
            duration: 0.8,
          })
        }
      })
    }
  }, [])

  const pointToLayer = useMemo(() => {
    return (feature, latlng) => {
      const jenis = feature.properties.jenis || 'Lainnya'
      return L.marker(latlng, {
        icon: createMarkerIcon(jenis),
      })
    }
  }, [])

  return (
    <div className="map-wrapper" id="map-wrapper">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        zoomControl={true}
        style={{ width: '100%', height: '100%' }}
      >
        {/* CartoDB Dark Matter Basemap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Data GeoJSON */}
        {geojsonData && (
          <GeoJSON
            ref={geoJsonRef}
            key={JSON.stringify(geojsonData)}
            data={geojsonData}
            pointToLayer={pointToLayer}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Auto fit bounds */}
        {geojsonData && <FitBounds geojsonData={geojsonData} />}
      </MapContainer>
    </div>
  )
}

export default MapView
