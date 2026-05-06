import { useNavigate } from 'react-router-dom'
import { ICONS } from './icons.jsx'

export default function TileGrid({ tiles }) {
  const navigate = useNavigate()

  if (!tiles || tiles.length === 0) {
    return (
      <div className="bg-white border border-[var(--border)] rounded-xl p-12 text-center text-[var(--text-muted)] text-sm">
        <div className="text-5xl mb-4">🚧</div>
        No tiles configured for this module yet.
      </div>
    )
  }

  return (
    <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
      {tiles.map((tile, i) => {
        const Icon = ICONS[tile.icon] || ICONS.default
        return (
          <div
            key={tile.id}
            onClick={() => navigate(tile.path)}
            style={{ animationDelay: `${i * 0.04}s` }}
            className="relative bg-white border border-[var(--border)] rounded-xl p-5 flex flex-col gap-3 cursor-pointer overflow-hidden
              transition-all duration-[180ms] ease-out
              hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)] hover:border-[var(--primary)]
              [animation:fadeUp_0.3s_ease_both]
              before:content-[''] before:absolute before:top-0 before:left-0 before:w-[3px] before:h-full
              before:bg-[var(--primary)] before:scale-y-0 before:origin-bottom before:transition-transform before:duration-[180ms]
              hover:before:scale-y-100"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)]">
              <Icon />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-[var(--text-primary)] leading-snug">
                {tile.label}
              </div>
              {tile.sub && (
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {tile.sub}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}