import { useState } from 'react'

/**
 * Unggah citra → deteksi YOLOv8 (backend) dan muat GeoJSON untuk layer peta.
 */
export default function DetectionPanel({ apiBase, onDetectionComplete }) {
  const [file, setFile] = useState(null)
  const [tileSize, setTileSize] = useState('640')
  const [overlap, setOverlap] = useState('128')
  const [conf, setConf] = useState('0.25')
  const [north, setNorth] = useState('')
  const [south, setSouth] = useState('')
  const [east, setEast] = useState('')
  const [west, setWest] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMsg(null)
    if (!file) {
      setMsg({ type: 'err', text: 'Pilih file citra terlebih dahulu.' })
      return
    }
    const bn = north.trim(), bs = south.trim(), be = east.trim(), bw = west.trim()
    const filled = [bn, bs, be, bw].filter(Boolean).length
    if (filled > 0 && filled < 4) {
      setMsg({ type: 'err', text: 'Isi keempat nilai bbox (north, south, east, west) atau kosongkan semua untuk GeoTIFF.' })
      return
    }

    const fd = new FormData()
    fd.append('file', file)
    fd.append('tile_size', String(tileSize))
    fd.append('overlap', String(overlap))
    fd.append('conf', String(conf))
    if (filled === 4) {
      fd.append('bbox_north', bn)
      fd.append('bbox_south', bs)
      fd.append('bbox_east', be)
      fd.append('bbox_west', bw)
    }

    setBusy(true)
    try {
      const res = await fetch(`${apiBase}/api/detection/run`, {
        method: 'POST',
        body: fd,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail || {})
        throw new Error(detail || `HTTP ${res.status}`)
      }
      setMsg({ type: 'ok', text: data.message || 'Deteksi selesai.' })
      await onDetectionComplete?.()
    } catch (err) {
      setMsg({ type: 'err', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="glass-panel detection-panel">
      <div className="detection-panel__title">
        <span>🛰️</span>
        <span>Deteksi objek (YOLOv8)</span>
      </div>
      <p className="detection-panel__hint">
        Citra besar diproses bertiling. GeoTIFF georeferensi memakai transform raster; JPG/PNG wajib isi bbox WGS84.
      </p>
      <form onSubmit={handleSubmit} className="detection-panel__form">
        <label className="detection-panel__label">
          File citra (.tif/.jpg/.png)
          <input
            type="file"
            accept=".tif,.tiff,.jpg,.jpeg,.png"
            disabled={busy}
            onChange={(ev) => setFile(ev.target.files?.[0] ?? null)}
          />
        </label>
        <div className="detection-panel__row">
          <label>
            Ukuran tile (px)
            <input type="number" min={320} max={1280} value={tileSize} onChange={(e) => setTileSize(e.target.value)} disabled={busy} />
          </label>
          <label>
            Overlap (px)
            <input type="number" min={0} max={640} value={overlap} onChange={(e) => setOverlap(e.target.value)} disabled={busy} />
          </label>
        </div>
        <label className="detection-panel__label">
          Confidence min
          <input type="number" step={0.05} min={0.05} max={1} value={conf} onChange={(e) => setConf(e.target.value)} disabled={busy} />
        </label>

        <div className="detection-panel__bbox">
          <div className="detection-panel__bbox-title">Batas geografis WGS84 (opsional untuk non-GeoTIFF)</div>
          <input type="number" step="any" placeholder="North (lat)" value={north} onChange={(e) => setNorth(e.target.value)} disabled={busy} />
          <input type="number" step="any" placeholder="South (lat)" value={south} onChange={(e) => setSouth(e.target.value)} disabled={busy} />
          <input type="number" step="any" placeholder="East (lon)" value={east} onChange={(e) => setEast(e.target.value)} disabled={busy} />
          <input type="number" step="any" placeholder="West (lon)" value={west} onChange={(e) => setWest(e.target.value)} disabled={busy} />
        </div>

        <button type="submit" className="detection-panel__submit" disabled={busy}>
          {busy ? 'Memroses…' : 'Jalankan deteksi'}
        </button>
      </form>
      {msg && (
        <div className={msg.type === 'ok' ? 'detection-panel__toast ok' : 'detection-panel__toast err'}>
          {msg.text}
        </div>
      )}
    </div>
  )
}
