/**
 * AuthContext.jsx
 * ===============
 * Context global untuk manajemen status autentikasi JWT.
 *
 * Menyimpan token dan data user di localStorage agar sesi tetap aktif
 * setelah halaman direfresh. Menyediakan fungsi login, logout, dan register
 * yang dapat diakses dari komponen manapun via useAuth() hook.
 */

import { createContext, useContext, useState, useCallback } from 'react'

const API_BASE = 'http://localhost:8000'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Ambil token dari localStorage (persistent login)
  const [token, setToken] = useState(() => localStorage.getItem('webgis_token'))
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('webgis_user'))
    } catch {
      return null
    }
  })

  /**
   * login — Mengirim credentials ke API dan menyimpan token.
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  const login = useCallback(async (username, password) => {
    try {
      // OAuth2PasswordRequestForm memerlukan form-encoded body
      const formData = new URLSearchParams()
      formData.append('username', username)
      formData.append('password', password)

      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      })

      if (!res.ok) {
        const err = await res.json()
        return { ok: false, error: err.detail || 'Login gagal' }
      }

      const data = await res.json()
      setToken(data.access_token)
      setUser({ username })
      localStorage.setItem('webgis_token', data.access_token)
      localStorage.setItem('webgis_user', JSON.stringify({ username }))
      return { ok: true }
    } catch {
      return { ok: false, error: 'Tidak dapat terhubung ke server' }
    }
  }, [])

  /**
   * register — Mendaftarkan akun baru lalu auto-login.
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  const register = useCallback(async (username, password) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        const err = await res.json()
        return { ok: false, error: err.detail || 'Registrasi gagal' }
      }

      // Auto-login setelah register berhasil
      return await login(username, password)
    } catch {
      return { ok: false, error: 'Tidak dapat terhubung ke server' }
    }
  }, [login])

  /**
   * logout — Menghapus token dan data user dari state dan localStorage.
   */
  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('webgis_token')
    localStorage.removeItem('webgis_user')
  }, [])

  /**
   * authFetch — Wrapper fetch yang otomatis menyertakan Bearer token.
   * Gunakan ini untuk semua request ke endpoint terproteksi.
   */
  const authFetch = useCallback((url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    })
  }, [token])

  return (
    <AuthContext.Provider value={{ token, user, login, logout, register, authFetch, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Hook untuk mengakses AuthContext dari komponen manapun. */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus digunakan di dalam AuthProvider')
  return ctx
}
