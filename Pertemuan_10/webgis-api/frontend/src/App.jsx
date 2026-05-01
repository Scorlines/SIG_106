import { useState, useEffect, useCallback } from 'react'
import MapView from './components/MapView'
import Legend from './components/Legend'
import DetectionPanel from './components/DetectionPanel'

const API_BASE = 'http://localhost:8000'

function App() {
  const [geojsonData, setGeojsonData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [jenisCategories, setJenisCategories] = useState({})
  const [detectionGeoJSON, setDetectionGeoJSON] = useState(null)
  const [showDetectionLayer, setShowDetectionLayer] = useState(true)

  const fetchDetectionGeoJSON = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/detection/geojson`)
      if (!res.ok) return
      const data = await res.json()
      setDetectionGeoJSON(data)
    } catch {
      /* backend belum menyala atau belum ada hasil */
    }
  }, [])

  useEffect(() => {
    fetchGeoJSON()
    fetchDetectionGeoJSON()
  }, [fetchDetectionGeoJSON])

  const fetchGeoJSON = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/fasilitas/geojson`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setGeojsonData(data)

      // Hitung kategori jenis
      const counts = {}
      data.features.forEach((f) => {
        const jenis = f.properties.jenis || 'Lainnya'
        counts[jenis] = (counts[jenis] || 0) + 1
      })
      setJenisCategories(counts)

      // Delay sedikit agar animasi loading terlihat
      setTimeout(() => setLoading(false), 600)
    } catch (err) {
      console.error('Gagal memuat data GeoJSON:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const totalFasilitas = geojsonData ? geojsonData.features.length : 0
  const totalKategori = Object.keys(jenisCategories).length
  const detectCount =
    detectionGeoJSON?.properties?.count ?? detectionGeoJSON?.features?.filter((f) => f.geometry)?.length ?? 0

  return (
    <div className="app-container">
      {/* Loading Overlay */}
      <div className={`loading-overlay ${!loading ? 'hidden' : ''}`}>
        <div className="loading-spinner"></div>
        <div className="loading-text">Memuat data peta...</div>
      </div>

      {/* Header */}
      <header className="header" id="app-header">
        <div className="header-icon">🗺️</div>
        <div className="header-text">
          <h1>WebGIS Fasilitas</h1>
          <p>Peta Fasilitas Interaktif</p>
        </div>
        {!loading && !error && (
          <div className="header-badge">
            <span className="pulse-dot"></span>
            <span>{totalFasilitas} fasilitas</span>
          </div>
        )}
      </header>

      {/* Error State */}
      {error && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1500,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-primary)', gap: '16px'
        }}>
          <div style={{ fontSize: '48px' }}>⚠️</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent-rose)' }}>
            Gagal Memuat Data
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '320px', textAlign: 'center' }}>
            Pastikan backend FastAPI sudah berjalan di <code style={{ color: 'var(--accent-indigo)' }}>localhost:8000</code>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Error: {error}</div>
          <button
            onClick={() => { setLoading(true); setError(null); fetchGeoJSON(); }}
            style={{
              marginTop: '8px', padding: '10px 24px',
              background: 'var(--accent-indigo)', color: 'white', border: 'none',
              borderRadius: '100px', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
              fontFamily: 'var(--font-family)'
            }}
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Map */}
      {!error && (
        <MapView
          geojsonData={geojsonData}
          loading={loading}
          detectionGeoJSON={detectionGeoJSON}
          showDetectionLayer={showDetectionLayer}
        />
      )}

      {!loading && !error && (
        <DetectionPanel apiBase={API_BASE} onDetectionComplete={fetchDetectionGeoJSON} />
      )}

      {/* Legend */}
      {!loading && !error && (
        <Legend jenisCategories={jenisCategories} />
      )}

      {/* Stats Bar */}
      {!loading && !error && (
        <div className="stats-bar" id="stats-bar">
          <div className="stat-chip">
            📍 Total: <span className="stat-value">{totalFasilitas}</span>
          </div>
          <div className="stat-chip">
            📂 Kategori: <span className="stat-value">{totalKategori}</span>
          </div>
          <label className="stat-chip detection-layer-toggle">
            <input
              type="checkbox"
              checked={showDetectionLayer}
              onChange={(e) => setShowDetectionLayer(e.target.checked)}
              disabled={!detectCount}
            />
            <span>YOLO{detectCount ? ` (${detectCount})` : ''}</span>
          </label>
        </div>
      )}
    </div>
  )
}

export default App
