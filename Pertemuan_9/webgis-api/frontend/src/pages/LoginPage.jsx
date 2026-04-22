/**
 * LoginPage.jsx
 * =============
 * Halaman login dengan desain glassmorphism dark-mode.
 * Validasi form client-side sebelum mengirim request ke API.
 */

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage({ onSwitchToRegister }) {
  const { login } = useAuth()
  const [form, setForm] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  /** Validasi form sebelum submit */
  const validate = () => {
    const e = {}
    if (!form.username.trim()) e.username = 'Username wajib diisi'
    else if (form.username.length < 3) e.username = 'Username minimal 3 karakter'
    if (!form.password) e.password = 'Password wajib diisi'
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
    const result = await login(form.username, form.password)
    setLoading(false)
    if (!result.ok) setServerError(result.error)
  }

  return (
    <div className="auth-page">
      {/* Background decorative blobs */}
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />

      <div className="auth-card" id="login-card">
        {/* Logo */}
        <div className="auth-logo">
          <span className="auth-logo-icon">🗺️</span>
          <div>
            <div className="auth-logo-title">WebGIS</div>
            <div className="auth-logo-sub">Fasilitas Publik</div>
          </div>
        </div>

        <h2 className="auth-heading">Selamat Datang</h2>
        <p className="auth-subheading">Masuk untuk mengelola data fasilitas</p>

        {/* Server error */}
        {serverError && (
          <div className="auth-alert auth-alert-error" id="login-error">
            ⚠️ {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-username">Username</label>
            <input
              id="login-username"
              name="username"
              type="text"
              className={`form-input ${errors.username ? 'input-error' : ''}`}
              placeholder="Masukkan username…"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
            />
            {errors.username && <span className="form-error">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              className={`form-input ${errors.password ? 'input-error' : ''}`}
              placeholder="Masukkan password…"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <button
            id="login-submit"
            type="submit"
            className="auth-btn"
            disabled={loading}
          >
            {loading ? <span className="btn-spinner" /> : null}
            {loading ? 'Memproses…' : 'Masuk'}
          </button>
        </form>

        <div className="auth-divider"><span>atau</span></div>

        <button
          id="goto-register"
          className="auth-btn auth-btn-outline"
          onClick={onSwitchToRegister}
        >
          Buat Akun Baru
        </button>
      </div>
    </div>
  )
}
