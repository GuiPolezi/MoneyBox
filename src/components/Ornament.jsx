// The signature element: a guilloché — the fine, interwoven line engraving
// found on banknotes. Drawn purely with SVG paths so it scales crisply.
export function Guilloche({ className = '', color = '#234A3C', opacity = 0.5 }) {
  const rings = []
  const cx = 200, cy = 60
  for (let i = 0; i < 28; i++) {
    const phase = (i / 28) * Math.PI * 2
    const rx = 150 + Math.sin(phase * 3) * 18
    const ry = 34 + Math.cos(phase * 5) * 8
    rings.push(
      <ellipse
        key={i}
        cx={cx} cy={cy} rx={rx} ry={ry}
        transform={`rotate(${(i / 28) * 180} ${cx} ${cy})`}
        fill="none" stroke={color} strokeWidth="0.4"
      />
    )
  }
  return (
    <svg viewBox="0 0 400 120" className={className} style={{ opacity }} aria-hidden="true">
      {rings}
    </svg>
  )
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-paper border border-line rounded-t-md sm:rounded-sm shadow-note w-full sm:max-w-md p-5 max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl text-ink">{title}</h3>
          <button onClick={onClose} className="text-ink/50 hover:text-ink text-xl leading-none" aria-label="Fechar">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
