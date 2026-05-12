import { useNavigate } from 'react-router-dom'
import { ICONS } from './icons.jsx'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');

  .tg-wrap {
    --accent:      #0082c4;
    --accent-soft: rgba(0,130,196,0.08);
    --border:      rgba(0,130,196,0.10);
    --border-hard: rgba(0,130,196 ,0.20);
    --ink:         #1e1b4b;
    --muted:       #9896b8;
    --surface:     #ffffff;
    --mono: 'IBM Plex Mono', monospace;
    --sans: 'IBM Plex Sans', sans-serif;
    font-family: var(--sans);
  }

  .tg-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 80px 24px;
    border: 1px dashed var(--border-hard);
    border-radius: 14px;
    color: var(--muted);
    font-size: 13px;
    letter-spacing: 0.02em;
    font-family: var(--mono);
  }

  .tg-empty-icon { font-size: 36px; opacity: 0.4; margin-bottom: 4px; }

  .tg-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 14px;
  }

  /* ── CARD ── */
  .tg-card {
    position: relative;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1),
                border-color 0.2s,
                box-shadow 0.2s;
    animation: tg-in 0.45s cubic-bezier(0.16,1,0.3,1) both;
    -webkit-tap-highlight-color: transparent;
  }

  @keyframes tg-in {
    from { opacity: 0; transform: translateY(14px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .tg-card:hover {
    transform: translateY(-4px) scale(1.01);
    border-color: rgba(67,56,202,0.4);
    box-shadow: 0 0 0 1px rgba(67,56,202,0.12),
                0 16px 40px -8px rgba(67,56,202,0.16);
  }

  /* ── COVER IMAGE ── */
  .tg-cover {
    position: relative;
    width: 100%;
    height: 110px;
    overflow: hidden;
    flex-shrink: 0;
  }

  .tg-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94),
                filter 0.3s;
    filter: saturate(0.85) brightness(0.92);
  }

  .tg-card:hover .tg-cover img {
    transform: scale(1.07);
    filter: saturate(1.05) brightness(0.88);
  }

  /* gradient overlay on cover */
  .tg-cover-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(30,27,75,0.08) 0%,
      rgba(30,27,75,0.45) 100%
    );
    transition: opacity 0.3s;
  }

  .tg-card:hover .tg-cover-overlay {
    background: linear-gradient(
      to bottom,
      rgba(67,56,202,0.12) 0%,
      rgba(30,27,75,0.55) 100%
    );
  }

  /* icon badge on cover */
  .tg-cover-icon {
    position: absolute;
    bottom: 10px;
    left: 12px;
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: rgba(255,255,255,0.92);
    border: 1px solid rgba(255,255,255,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent);
    backdrop-filter: blur(6px);
    transition: background 0.2s, transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
    flex-shrink: 0;
  }

  .tg-card:hover .tg-cover-icon {
    background: var(--accent);
    color: #ffffff;
    transform: rotate(-6deg) scale(1.1);
    border-color: transparent;
  }

  /* dot on cover */
  .tg-cover-dot {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #a5b4fc;
    box-shadow: 0 0 0 0 rgba(165,180,252,0.5);
    animation: tg-pulse 2.5s ease-out infinite;
  }

  @keyframes tg-pulse {
    0%   { box-shadow: 0 0 0 0 rgba(165,180,252,0.5); }
    70%  { box-shadow: 0 0 0 8px rgba(165,180,252,0); }
    100% { box-shadow: 0 0 0 0 rgba(165,180,252,0); }
  }

  /* ── BODY ── */
  .tg-body {
    padding: 12px 14px 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    position: relative;
  }

  .tg-label {
    font-family: var(--sans);
    font-size: 13px;
    font-weight: 600;
    color: var(--ink);
    letter-spacing: -0.01em;
    line-height: 1.3;
  }

  .tg-sub {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--muted);
    line-height: 1.45;
  }

  /* ── BOTTOM BAR ── */
  .tg-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    width: 0;
    background: var(--accent);
    border-radius: 0 2px 0 0;
    transition: width 0.35s cubic-bezier(0.34,1.56,0.64,1);
  }

  .tg-card:hover .tg-bar { width: 50%; }

  /* ── NO COVER FALLBACK ── */
  .tg-cover-fallback {
    width: 100%;
    height: 110px;
    background: var(--accent-soft);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    position: relative;
  }

  .tg-cover-fallback-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(67,56,202,0.12);
    border: 1px solid var(--border-hard);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent);
    transition: background 0.2s, transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
  }

  .tg-card:hover .tg-cover-fallback-icon {
    background: var(--accent);
    color: #fff;
    transform: rotate(-6deg) scale(1.1);
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 600px) {
    .tg-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .tg-cover, .tg-cover-fallback { height: 90px; }
    .tg-label { font-size: 12px; }
    .tg-body { padding: 10px 12px 12px; }
  }

  @media (max-width: 380px) {
    .tg-grid { grid-template-columns: 1fr; }
    .tg-cover, .tg-cover-fallback { height: 120px; }
  }
`

export default function TileGrid({ tiles }) {
  const navigate = useNavigate()

  if (!tiles || tiles.length === 0) {
    return (
      <>
        <style>{CSS}</style>
        <div className="tg-wrap">
          <div className="tg-empty">
            <span className="tg-empty-icon">◻</span>
            No tiles configured yet
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="tg-wrap">
        <div className="tg-grid">
          {tiles.map((tile, i) => {
            const Icon = ICONS[tile.icon] || ICONS.default
            return (
              <div
                key={tile.id}
                onClick={() => navigate(tile.path)}
                className="tg-card"
                style={{ animationDelay: `${i * 0.06}s` }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(tile.path)}
              >
                {tile.cover ? (
                  <div className="tg-cover">
                    <img
                      src={tile.cover}
                      alt={tile.label}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.closest('.tg-cover').style.display = 'none'
                      }}
                    />
                    <div className="tg-cover-overlay" />
                    <div className="tg-cover-icon">
                      <Icon size={16} />
                    </div>
                    <div className="tg-cover-dot" />
                  </div>
                ) : (
                  <div className="tg-cover-fallback">
                    <div className="tg-cover-fallback-icon">
                      <Icon size={20} />
                    </div>
                    <div className="tg-cover-dot" />
                  </div>
                )}

                <div className="tg-body">
                  <div className="tg-label">{tile.label}</div>
                  {tile.sub && <div className="tg-sub">{tile.sub}</div>}
                  <div className="tg-bar" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}