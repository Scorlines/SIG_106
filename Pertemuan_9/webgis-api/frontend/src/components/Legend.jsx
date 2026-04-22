import { getColorForJenis } from './MapView'

function Legend({ jenisCategories }) {
  const sortedCategories = Object.entries(jenisCategories)
    .sort((a, b) => b[1] - a[1]) // Urutkan dari yang terbanyak

  if (sortedCategories.length === 0) return null

  return (
    <div className="legend-panel" id="legend-panel">
      <div className="legend-title">
        <span>🏷️</span>
        <span>Kategori Fasilitas</span>
      </div>
      <div className="legend-items">
        {sortedCategories.map(([jenis, count]) => {
          const color = getColorForJenis(jenis)
          return (
            <div className="legend-item" key={jenis}>
              <div
                className="legend-color"
                style={{ backgroundColor: color, color: color }}
              ></div>
              <span className="legend-label">{jenis}</span>
              <span className="legend-count">{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Legend
