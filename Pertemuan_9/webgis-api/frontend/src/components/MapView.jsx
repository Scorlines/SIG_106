/**
 * MapView.jsx
 * ===========
 * Komponen peta interaktif menggunakan React-Leaflet.
 * 
 * Fitur:
 * - Tampilkan marker fasilitas dari GeoJSON
 * - Popup dengan tombol Edit dan Hapus (hanya muncul jika user login)
 * - Mode "pick coordinate" — user klik peta untuk mengisi koordinat di modal
 * - Auto-fit bounds saat data dimuat
 * - Hover glow effect pada marker
 */

import { useEffect, useRef, useMemo, useCallback } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useAuth } from '../context/AuthContext'

// ── Warna per kategori ────────────────────────────────────────────────────────
const JENIS_COLORS = {
  'Rumah Sakit': '#f43f5e', 'Puskesmas': '#ec4899', 'Klinik': '#f59e0b',
  'Apotek': '#10b981', 'Sekolah': '#6366f1', 'Universitas': '#8b5cf6',
  'Masjid': '#06b6d4', 'Gereja': '#0ea5e9', 'Pasar': '#f97316',
  'Mall': '#a855f7', 'Bank': '#14b8a6', 'ATM': '#22d3ee',
  'SPBU': '#ef4444', 'Hotel': '#eab308', 'Restoran': '#84cc16',
  'Kantor Polisi': '#3b82f6', 'Kantor Pos': '#f59e0b', 'Stasiun': '#64748b',
  'Terminal': '#78716c', 'Taman': '#22c55e',
}

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

// ── Ikon emoji per kategori ───────────────────────────────────────────────────
const JENIS_ICONS = {
  'Rumah Sakit': '🏥', 'Puskesmas': '🩺', 'Klinik': '🏨',
  'Apotek': '💊', 'Sekolah': '🏫', 'Universitas': '🎓',
  'Masjid': '🕌', 'Gereja': '⛪', 'Pasar': '🏪',
  'Mall': '🛒', 'Bank': '🏦', 'ATM': '💳',
  'SPBU': '⛽', 'Hotel': '🏨', 'Restoran': '🍽️',
  'Kantor Polisi': '🚔', 'Kantor Pos': '📮', 'Stasiun': '🚉',
  'Terminal': '🚌', 'Taman': '🌳',
}

function getIconForJenis(jenis) {
  return JENIS_ICONS[jenis] || '📍'
}

// ── Buat custom marker icon ───────────────────────────────────────────────────
function createMarkerIcon(jenis) {
  const color = getColorForJenis(jenis)
  const html = `
    <div class="custom-marker" style="
      width: 32px; height: 32px; position: relative;
      display: flex; align-items: center; justify-content: center;
    ">
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="14" fill="${color}" fill-opacity="0.18" stroke="${color}" stroke-width="2"/>
        <circle cx="16" cy="16" r="7" fill="${color}" />
      </svg>
      <div style="
        position: absolute; width: 40px; height: 40px;
        border-radius: 50%; background: ${color};
        opacity: 0; filter: blur(10px);
        transition: opacity 0.2s ease; pointer-events: none; z-index: -1;
      " class="marker-glow"></div>
    </div>
  `
  return L.divIcon({
    html, className: '',
    iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -18],
  })
}

// ── Auto fit bounds ───────────────────────────────────────────────────────────
function FitBounds({ geojsonData }) {
  const map = useMap()
  useEffect(() => {
    if (!geojsonData?.features?.length) return
    const bounds = L.geoJSON(geojsonData).getBounds()
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 })
  }, [geojsonData, map])
  return null
}

// ── Pick coordinate handler ───────────────────────────────────────────────────
function PickCoordHandler({ pickMode, onPicked }) {
  useMapEvents({
    click(e) {
      if (pickMode) {
        onPicked(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}

// ── Popup content (HTML string) ───────────────────────────────────────────────
function createPopupContent(properties, isLoggedIn) {
  const { id, nama, jenis, alamat } = properties
  const color = getColorForJenis(jenis)
  const icon = getIconForJenis(jenis)

  const actionButtons = isLoggedIn ? `
    <div class="popup-actions">
      <button
        class="popup-btn popup-btn-edit"
        onclick="window.__webgisEditFasilitas(${id})"
        title="Edit fasilitas ini"
      >✏️ Edit</button>
      <button
        class="popup-btn popup-btn-delete"
        onclick="window.__webgisDeleteFasilitas(${id}, '${(nama || '').replace(/'/g, "\\'")}')"
        title="Hapus fasilitas ini"
      >🗑️ Hapus</button>
    </div>
  ` : ''

  return `
    <div class="popup-card">
      <div class="popup-header">
        <div class="popup-icon" style="background: ${color}20; color: ${color};">${icon}</div>
        <div>
          <div class="popup-nama">${nama || 'Tanpa Nama'}</div>
          <span class="popup-jenis" style="background: ${color}20; color: ${color};">${jenis || 'Tidak diketahui'}</span>
        </div>
      </div>
      <div class="popup-divider"></div>
      <div class="popup-alamat">
        <span class="popup-alamat-icon">📍</span>
        <span>${alamat || 'Alamat tidak tersedia'}</span>
      </div>
      ${actionButtons}
    </div>
  `
}

// ── Main MapView component ────────────────────────────────────────────────────
function MapView({
  geojsonData,
  loading,
  pickMode,
  onPickedCoord,
  onEditRequest,
  onDeleteRequest,
}) {
  const geoJsonRef = useRef(null)
  const { isLoggedIn } = useAuth()

  const defaultCenter = [-6.9, 107.6] // Bandung default
  const defaultZoom = 12

  // Daftarkan handler global agar bisa dipanggil dari popup HTML
  useEffect(() => {
    window.__webgisEditFasilitas = (id) => {
      onEditRequest(id)
    }
    window.__webgisDeleteFasilitas = (id, nama) => {
      onDeleteRequest(id, nama)
    }
    return () => {
      delete window.__webgisEditFasilitas
      delete window.__webgisDeleteFasilitas
    }
  }, [onEditRequest, onDeleteRequest])

  // GeoJSON handler
  const onEachFeature = useCallback((feature, layer) => {
    layer.bindPopup(
      createPopupContent(feature.properties, isLoggedIn),
      { closeButton: true, maxWidth: 300, minWidth: 220 }
    )

    layer.on('mouseover', function () {
      const el = this.getElement?.()
      if (!el) return
      const marker = el.querySelector('.custom-marker')
      if (marker) {
        marker.style.transform = 'scale(1.4)'
        marker.style.filter = 'brightness(1.3) drop-shadow(0 0 10px rgba(99,102,241,0.7))'
      }
      const glow = el.querySelector('.marker-glow')
      if (glow) glow.style.opacity = '0.4'
    })

    layer.on('mouseout', function () {
      const el = this.getElement?.()
      if (!el) return
      const marker = el.querySelector('.custom-marker')
      if (marker) { marker.style.transform = 'scale(1)'; marker.style.filter = 'none' }
      const glow = el.querySelector('.marker-glow')
      if (glow) glow.style.opacity = '0'
    })

    layer.on('click', function (e) {
      const map = e.target._map
      if (map) map.flyTo(e.latlng, Math.max(map.getZoom(), 15), { duration: 0.8 })
    })
  }, [isLoggedIn])

  const pointToLayer = useCallback((feature, latlng) => {
    return L.marker(latlng, {
      icon: createMarkerIcon(feature.properties.jenis || 'Lainnya'),
    })
  }, [])

  return (
    <div
      className="map-wrapper"
      id="map-wrapper"
      style={{ cursor: pickMode ? 'crosshair' : 'default' }}
    >
      {/* Banner saat mode pick */}
      {pickMode && (
        <div className="pick-mode-banner">
          📌 Klik pada peta untuk memilih koordinat fasilitas
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        zoomControl={true}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {geojsonData && (
          <GeoJSON
            ref={geoJsonRef}
            key={JSON.stringify(geojsonData)}
            data={geojsonData}
            pointToLayer={pointToLayer}
            onEachFeature={onEachFeature}
          />
        )}

        {geojsonData && <FitBounds geojsonData={geojsonData} />}
        <PickCoordHandler pickMode={pickMode} onPicked={onPickedCoord} />
      </MapContainer>
    </div>
  )
}

export default MapView
