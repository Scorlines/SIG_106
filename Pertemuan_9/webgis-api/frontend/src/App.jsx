/**
 * App.jsx
 * =======
 * Root komponen aplikasi WebGIS.
 *
 * Routing sederhana berbasis state:
 * - Jika belum login → tampilkan LoginPage atau RegisterPage
 * - Jika sudah login → tampilkan peta dengan header & kontrol CRUD
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './context/AuthContext'
import MapView from './components/MapView'
import Legend from './components/Legend'
import FasilitasModal from './components/FasilitasModal'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

const API_BASE = 'http://localhost:8000'

function App() {
  const { isLoggedIn, user, logout, authFetch } = useAuth()

  // ── State data & UI ────────────────────────────────────────────────────────
  const [page, setPage] = useState('login') // 'login' | 'register'
  const [geojsonData, setGeojsonData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [jenisCategories, setJenisCategories] = useState({})

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState(null) // null = tambah, object = edit
  const [pickMode, setPickMode] = useState(false)
  const [pendingCoord, setPendingCoord] = useState(null)

  // ── Delete confirm ──────────────────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { id, nama }
  const [deleteLoading, setDeleteLoading] = useState(false)

  // ── Fetch GeoJSON ───────────────────────────────────────────────────────────
  const fetchGeoJSON = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/fasilitas/geojson`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setGeojsonData(data)

      const counts = {}
      data.features.forEach((f) => {
        const jenis = f.properties.jenis || 'Lainnya'
        counts[jenis] = (counts[jenis] || 0) + 1
      })
      setJenisCategories(counts)
      setTimeout(() => setLoading(false), 600)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isLoggedIn) fetchGeoJSON()
  }, [isLoggedIn, fetchGeoJSON])

  // ── Edit handler ────────────────────────────────────────────────────────────
  const handleEditRequest = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/fasilitas/${id}`)
      if (!res.ok) return
      const data = await res.json()
      setEditData(data)
      setModalOpen(true)
    } catch { /* ignore */ }
  }, [])

  // ── Delete handler ──────────────────────────────────────────────────────────
  const handleDeleteRequest = useCallback((id, nama) => {
    setDeleteConfirm({ id, nama })
  }, [])

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    setDeleteLoading(true)
    try {
      await authFetch(`${API_BASE}/api/fasilitas/${deleteConfirm.id}`, { method: 'DELETE' })
      setDeleteConfirm(null)
      fetchGeoJSON()
    } catch { /* ignore */ }
    setDeleteLoading(false)
  }

  // ── Pick coord ──────────────────────────────────────────────────────────────
  const handlePickCoord = useCallback(() => {
    setPickMode(true)
  }, [])

  const handlePickedCoord = useCallback((lat, lng) => {
    setPendingCoord({ lat, lng })
    setPickMode(false)
    setModalOpen(true)
  }, [])

  // Ketika pendingCoord ada, inject ke editData (atau buat editData minimal)
  useEffect(() => {
    if (pendingCoord && modalOpen) {
      setEditData(prev => prev
        ? { ...prev, latitude: pendingCoord.lat, longitude: pendingCoord.lng }
        : { latitude: pendingCoord.lat, longitude: pendingCoord.lng }
      )
      setPendingCoord(null)
    }
  }, [pendingCoord, modalOpen])

  const openAddModal = () => {
    setEditData(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditData(null)
  }

  const totalFasilitas = geojsonData ? geojsonData.features.length : 0
  const totalKategori = Object.keys(jenisCategories).length

  // ── Auth screens ────────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return page === 'login'
      ? <LoginPage onSwitchToRegister={() => setPage('register')} />
      : <RegisterPage onSwitchToLogin={() => setPage('login')} />
  }

  // ── Map screen ──────────────────────────────────────────────────────────────
  return (
    <div className="app-container">
      {/* Loading overlay */}
      <div className={`loading-overlay ${!loading ? 'hidden' : ''}`}>
        <div className="loading-spinner" />
        <div className="loading-text">Memuat data peta…</div>
      </div>

      {/* Header */}
      <header className="header" id="app-header">
        <div className="header-icon">🗺️</div>
        <div className="header-text">
          <h1>WebGIS Fasilitas</h1>
          <p>Peta Fasilitas Interaktif</p>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Tombol tambah (hanya saat login) */}
        {!loading && !error && (
          <button id="btn-add-fasilitas" className="btn-add-fasilitas" onClick={openAddModal}>
            + Tambah Fasilitas
          </button>
        )}

        {/* Badge jumlah fasilitas */}
        {!loading && !error && (
          <div className="header-badge">
            <span className="pulse-dot" />
            <span>{totalFasilitas} fasilitas</span>
          </div>
        )}

        {/* User & logout */}
        <div className="header-user">
          <span className="header-username">👤 {user?.username}</span>
          <button id="btn-logout" className="btn-logout" onClick={logout}>Keluar</button>
        </div>
      </header>

      {/* Error state */}
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
            onClick={() => fetchGeoJSON()}
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
          pickMode={pickMode}
          onPickedCoord={handlePickedCoord}
          onEditRequest={handleEditRequest}
          onDeleteRequest={handleDeleteRequest}
        />
      )}

      {/* Legend */}
      {!loading && !error && <Legend jenisCategories={jenisCategories} />}

      {/* Stats bar */}
      {!loading && !error && (
        <div className="stats-bar" id="stats-bar">
          <div className="stat-chip">📍 Total: <span className="stat-value">{totalFasilitas}</span></div>
          <div className="stat-chip">📂 Kategori: <span className="stat-value">{totalKategori}</span></div>
        </div>
      )}

      {/* Fasilitas Modal */}
      {modalOpen && (
        <FasilitasModal
          initialData={editData}
          onClose={closeModal}
          onSaved={fetchGeoJSON}
          onPickCoord={handlePickCoord}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <>
          <div className="modal-overlay" onClick={() => setDeleteConfirm(null)} />
          <div className="modal-card delete-dialog" id="delete-dialog" role="alertdialog">
            <div className="delete-icon">🗑️</div>
            <h3 className="delete-title">Hapus Fasilitas?</h3>
            <p className="delete-desc">
              Yakin ingin menghapus <strong>&quot;{deleteConfirm.nama}&quot;</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="modal-actions">
              <button
                id="delete-cancel"
                className="btn-secondary"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleteLoading}
              >
                Batal
              </button>
              <button
                id="delete-confirm"
                className="auth-btn btn-danger"
                onClick={confirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? <span className="btn-spinner" /> : null}
                {deleteLoading ? 'Menghapus…' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default App
