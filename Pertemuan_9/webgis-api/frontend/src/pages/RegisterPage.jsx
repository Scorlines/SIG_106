/**
 * RegisterPage.jsx
 * ================
 * Halaman registrasi akun baru dengan validasi ketat client-side.
 */

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage({ onSwitchToLogin }) {
  const { register } = useAuth()
  const [form, setForm] = useState({ username: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  /** Validasi form sebelum submit */
  const validate = () => {
    const e = {}
    if (!form.username.trim()) {
      e.username = 'Username wajib diisi'
    } else if (form.username.length < 3) {
      e.username = 'Username minimal 3 karakter'
    } else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      e.username = 'Hanya huruf, angka, dan underscore'
    }
    if (!form.password) {
      e.password = 'Password wajib diisi'
    } else if (form.password.length < 6) {
      e.password = 'Password minimal 6 karakter'
    }
    if (!form.confirm) {
      e.confirm = 'Konfirmasi password wajib diisi'
    } else if (form.password !== form.confirm) {
      e.confirm = 'Password tidak cocok'
    }
    return e
  }

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setErrors(err => ({ ...err, [e.target.name]: '' }))
    setServerError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    const result = await register(form.username, form.password)
    setLoading(false)
    if (!result.ok) setServerError(result.error)
    // Jika berhasil, AuthContext.isLoggedIn menjadi true → App.jsx redirect ke peta
  }

  return (
    <div className="auth-page">
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />

      <div className="auth-card" id="register-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">🗺️</span>
          <div>
            <div className="auth-logo-title">WebGIS</div>
            <div className="auth-logo-sub">Fasilitas Publik</div>
          </div>
        </div>

        <h2 className="auth-heading">Buat Akun</h2>
        <p className="auth-subheading">Daftarkan diri untuk mulai mengelola data fasilitas</p>

        {serverError && (
          <div className="auth-alert auth-alert-error" id="register-error">
            ⚠️ {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-username">Username</label>
            <input
              id="reg-username"
              name="username"
              type="text"
              className={`form-input ${errors.username ? 'input-error' : ''}`}
              placeholder="Pilih username unik…"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
            />
            {errors.username && <span className="form-error">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              name="password"
              type="password"
              className={`form-input ${errors.password ? 'input-error' : ''}`}
              placeholder="Minimal 6 karakter…"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm">Konfirmasi Password</label>
            <input
              id="reg-confirm"
              name="confirm"
              type="password"
              className={`form-input ${errors.confirm ? 'input-error' : ''}`}
              placeholder="Ulangi password…"
              value={form.confirm}
              onChange={handleChange}
              autoComplete="new-password"
            />
            {errors.confirm && <span className="form-error">{errors.confirm}</span>}
          </div>

          {/* Password strength indicator */}
          {form.password && (
            <div className="password-strength">
              <div
                className={`strength-bar ${
                  form.password.length >= 10 ? 'strength-strong'
                  : form.password.length >= 6 ? 'strength-medium'
                  : 'strength-weak'
                }`}
              />
              <span className="strength-label">
                {form.password.length >= 10 ? '💪 Kuat'
                  : form.password.length >= 6 ? '⚡ Sedang'
                  : '⚠️ Lemah'}
              </span>
            </div>
          )}

          <button
            id="register-submit"
            type="submit"
            className="auth-btn"
            disabled={loading}
          >
            {loading ? <span className="btn-spinner" /> : null}
            {loading ? 'Mendaftarkan…' : 'Daftar & Masuk'}
          </button>
        </form>

        <div className="auth-divider"><span>sudah punya akun?</span></div>

        <button
          id="goto-login"
          className="auth-btn auth-btn-outline"
          onClick={onSwitchToLogin}
        >
          Masuk Sekarang
        </button>
      </div>
    </div>
  )
}
