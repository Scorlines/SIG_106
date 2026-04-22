/**
 * FasilitasModal.jsx
 * ==================
 * Modal form untuk menambahkan atau mengedit data fasilitas publik.
 *
 * Props:
 * - initialData  : object | null  → null = mode tambah, object = mode edit
 * - onClose      : () => void     → menutup modal
 * - onSaved      : () => void     → dipanggil setelah data berhasil disimpan
 * - pickMode     : boolean        → apakah sedang dalam mode pilih koordinat dari peta
 * - onPickCoord  : () => void     → aktifkan mode pilih koordinat dari peta
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const API_BASE = 'http://localhost:8000'

const JENIS_OPTIONS = [
  'Rumah Sakit', 'Puskesmas', 'Klinik', 'Apotek',
  'Sekolah', 'Universitas', 'Masjid', 'Gereja',
  'Pasar', 'Mall', 'Bank', 'ATM', 'SPBU',
  'Hotel', 'Restoran', 'Kantor Polisi', 'Kantor Pos',
  'Stasiun', 'Terminal', 'Taman', 'Lainnya',
]

/** Validasi form sebelum submit */
function validateForm(form) {
  const errors = {}
  if (!form.nama.trim()) errors.nama = 'Nama wajib diisi'
  else if (form.nama.trim().length < 3) errors.nama = 'Nama minimal 3 karakter'
  if (!form.jenis) errors.jenis = 'Jenis fasilitas wajib dipilih'
  if (form.latitude === '' || form.latitude === undefined) {
    errors.latitude = 'Latitude wajib diisi'
  } else if (isNaN(Number(form.latitude)) || Number(form.latitude) < -90 || Number(form.latitude) > 90) {
    errors.latitude = 'Latitude harus antara -90 dan 90'
  }
  if (form.longitude === '' || form.longitude === undefined) {
    errors.longitude = 'Longitude wajib diisi'
  } else if (isNaN(Number(form.longitude)) || Number(form.longitude) < -180 || Number(form.longitude) > 180) {
    errors.longitude = 'Longitude harus antara -180 dan 180'
  }
  return errors
}

export default function FasilitasModal({ initialData, onClose, onSaved, onPickCoord }) {
  const { authFetch } = useAuth()
  // Mode edit hanya jika initialData punya id (bukan sekadar koordinat dari pick peta)
  const isEdit = !!(initialData && initialData.id)

  const [form, setForm] = useState({
    nama: '',
    jenis: '',
    alamat: '',
    latitude: '',
    longitude: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)

  // Isi form saat edit
  useEffect(() => {
    if (initialData) {
      setForm({
        nama: initialData.nama || '',
        jenis: initialData.jenis || '',
        alamat: initialData.alamat || '',
        latitude: initialData.latitude ?? '',
        longitude: initialData.longitude ?? '',
      })
    }
  }, [initialData])

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setErrors(err => ({ ...err, [e.target.name]: '' }))
    setServerError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validateForm(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    setServerError('')

    const payload = {
      nama: form.nama.trim(),
      jenis: form.jenis,
      alamat: form.alamat.trim() || null,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
    }

    try {
      const url = isEdit
        ? `${API_BASE}/api/fasilitas/${initialData.id}`
        : `${API_BASE}/api/fasilitas/`
      const res = await authFetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        setServerError(err.detail || 'Gagal menyimpan data')
      } else {
        setSuccess(true)
        setTimeout(() => {
          onSaved()
          onClose()
        }, 900)
      }
    } catch {
      setServerError('Tidak dapat terhubung ke server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div className="modal-overlay" id="fasilitas-modal-overlay" onClick={onClose} />

      {/* Modal */}
      <div className="modal-card" id="fasilitas-modal" role="dialog" aria-modal="true"
           aria-label={isEdit ? 'Edit Fasilitas' : 'Tambah Fasilitas'}>

        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">{isEdit ? '✏️' : '📍'}</span>
            <h3 className="modal-title">{isEdit ? 'Edit Fasilitas' : 'Tambah Fasilitas'}</h3>
          </div>
          <button id="modal-close" className="modal-close" onClick={onClose} aria-label="Tutup modal">✕</button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {success && (
            <div className="auth-alert auth-alert-success">
              ✅ Data berhasil {isEdit ? 'diperbarui' : 'ditambahkan'}!
            </div>
          )}
          {serverError && (
            <div className="auth-alert auth-alert-error" id="modal-server-error">
              ⚠️ {serverError}
            </div>
          )}

          <form id="fasilitas-form" onSubmit={handleSubmit} noValidate>
            {/* Nama */}
            <div className="form-group">
              <label className="form-label" htmlFor="f-nama">Nama Fasilitas <span className="required">*</span></label>
              <input
                id="f-nama"
                name="nama"
                type="text"
                className={`form-input ${errors.nama ? 'input-error' : ''}`}
                placeholder="Contoh: Puskesmas Kiaracondong"
                value={form.nama}
                onChange={handleChange}
                maxLength={100}
              />
              {errors.nama && <span className="form-error">{errors.nama}</span>}
            </div>

            {/* Jenis */}
            <div className="form-group">
              <label className="form-label" htmlFor="f-jenis">Jenis Fasilitas <span className="required">*</span></label>
              <select
                id="f-jenis"
                name="jenis"
                className={`form-input form-select ${errors.jenis ? 'input-error' : ''}`}
                value={form.jenis}
                onChange={handleChange}
              >
                <option value="">— Pilih jenis —</option>
                {JENIS_OPTIONS.map(j => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
              {errors.jenis && <span className="form-error">{errors.jenis}</span>}
            </div>

            {/* Alamat */}
            <div className="form-group">
              <label className="form-label" htmlFor="f-alamat">Alamat <span className="optional">(opsional)</span></label>
              <input
                id="f-alamat"
                name="alamat"
                type="text"
                className="form-input"
                placeholder="Contoh: Jl. Ahmad Yani No.1, Bandung"
                value={form.alamat}
                onChange={handleChange}
                maxLength={255}
              />
            </div>

            {/* Koordinat */}
            <div className="coord-row">
              <div className="form-group">
                <label className="form-label" htmlFor="f-latitude">Latitude <span className="required">*</span></label>
                <input
                  id="f-latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  className={`form-input ${errors.latitude ? 'input-error' : ''}`}
                  placeholder="-6.9000"
                  value={form.latitude}
                  onChange={handleChange}
                />
                {errors.latitude && <span className="form-error">{errors.latitude}</span>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="f-longitude">Longitude <span className="required">*</span></label>
                <input
                  id="f-longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  className={`form-input ${errors.longitude ? 'input-error' : ''}`}
                  placeholder="107.6000"
                  value={form.longitude}
                  onChange={handleChange}
                />
                {errors.longitude && <span className="form-error">{errors.longitude}</span>}
              </div>
            </div>

            {/* Tombol ambil dari peta */}
            <button
              type="button"
              id="pick-from-map"
              className="btn-pick-coord"
              onClick={() => { onClose(); onPickCoord() }}
              title="Klik titik pada peta untuk mengisi koordinat"
            >
              📌 Ambil Koordinat dari Peta
            </button>

            {/* Action buttons */}
            <div className="modal-actions">
              <button type="button" id="modal-cancel" className="btn-secondary" onClick={onClose}>
                Batal
              </button>
              <button
                type="submit"
                id="modal-save"
                className="auth-btn modal-save-btn"
                disabled={loading || success}
              >
                {loading ? <span className="btn-spinner" /> : null}
                {loading ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Tambah Fasilitas'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
