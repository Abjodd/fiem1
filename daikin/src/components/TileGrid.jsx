import { useNavigate } from 'react-router-dom'
import { ICONS } from './icons.jsx'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');

  .tg-wrap {
    --neon: #c8ff00;
    --neon-05: rgba(200,255,0,0.05);
    --neon-08: rgba(200,255,0,0.08);
    --neon-12: rgba(200,255,0,0.12);
    --neon-20: rgba(200,255,0,0.20);
    --neon-35: rgba(200,255,0,0.35);
    --neon-60: rgba(200,255,0,0.60);
    --bg:       #070a10;
    --surface:  #0b0f1a;
    --surface2: #0f1422;
    --text:     #c8d8df;
    --muted:    rgba(200,255,0,0.38);
    --mono: 'IBM Plex Mono', monospace;
    --sans: 'IBM Plex Sans', sans-serif;
    font-family: var(--sans);
    background: var(--bg);
    padding: 28px;
    position: relative;
    overflow: hidden;
  }

  /* dot-grid background */
  .tg-wrap::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle, rgba(200,255,0,0.07) 1px, transparent 1px);
    background-size: 32px 32px;
    pointer-events: none;
    z-index: 0;
  }

  /* top ambient glow */
  .tg-wrap::after {
    content: '';
    position: absolute;
    top: -120px; left: 50%;
    transform: translateX(-50%);
    width: 600px; height: 240px;
    background: radial-gradient(ellipse, rgba(200,255,0,0.06) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  /* ── HEADER ── */
  .tg-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 22px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--neon-12);
    position: relative;
    z-index: 1;
  }

  .tg-header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .tg-header-pip {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--neon);
    box-shadow: 0 0 10px var(--neon), 0 0 20px rgba(200,255,0,0.4);
    animation: pip-pulse 2.5s ease-in-out infinite;
  }

  @keyframes pip-pulse {
    0%,100% { opacity: 1; box-shadow: 0 0 10px var(--neon), 0 0 20px rgba(200,255,0 ,0.4); }
    50%      { opacity: 0.5; box-shadow: 0 0 4px var(--neon); }
  }

  .tg-header-title {
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.22em;
    color: var(--muted);
    text-transform: uppercase;
  }

  .tg-header-right {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 0.14em;
    color: var(--neon-35);
  }

  /* ── EMPTY ── */
  .tg-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 80px 24px;
    border: 1px dashed var(--neon-12);
    color: var(--muted);
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.12em;
    position: relative;
    z-index: 1;
  }

  /* ── GRID ── */
  .tg-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 14px;
    position: relative;
    z-index: 1;
  }

  /* ── CARD ── */
  .tg-card {
    position: relative;
    background: var(--surface);
    border: 1px solid var(--neon-12);
    border-radius: 3px;
    padding: 20px 18px 16px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 168px;
    overflow: hidden;
    transition:
      transform 0.28s cubic-bezier(0.22,1,0.36,1),
      border-color 0.22s ease,
      box-shadow 0.22s ease,
      background 0.22s ease;
    animation: card-rise 0.5s cubic-bezier(0.16,1,0.3,1) both;
    -webkit-tap-highlight-color: transparent;
    outline: none;
  }

  @keyframes card-rise {
    from { opacity: 0; transform: translateY(18px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* neon radial glow overlay */
  .tg-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 70% 10%, rgba(0,245,255,0.10) 0%, transparent 65%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    border-radius: 3px;
  }

  /* top-right corner bracket */
  .tg-card::after {
    content: '';
    position: absolute;
    top: -1px; right: -1px;
    width: 22px; height: 22px;
    border-top: 2px solid var(--neon-20);
    border-right: 2px solid var(--neon-20);
    border-radius: 0 3px 0 0;
    transition:
      width 0.28s cubic-bezier(0.22,1,0.36,1),
      height 0.28s cubic-bezier(0.22,1,0.36,1),
      border-color 0.22s ease;
  }

  .tg-card:hover {
    transform: translateY(-5px) scale(1.015);
    background: var(--surface2);
    border-color: var(--neon-35);
    box-shadow:
      0 0 0 1px var(--neon-12),
      0 20px 60px -12px rgba(0,245,255,0.18),
      0 0 30px -8px rgba(0,245,255,0.12),
      inset 0 1px 0 var(--neon-08);
  }

  .tg-card:hover::before { opacity: 1; }

  .tg-card:hover::after {
    width: 32px;
    height: 32px;
    border-color: var(--neon-60);
  }

  /* ── SCAN LINE ── */
  .tg-scan {
    position: absolute;
    top: -100%; left: 0;
    width: 100%; height: 28%;
    background: linear-gradient(to bottom,
      transparent 0%,
      rgba(0,245,255,0.055) 50%,
      transparent 100%);
    pointer-events: none;
    z-index: 0;
  }

  .tg-card:hover .tg-scan {
    animation: scan-move 1.5s linear infinite;
  }

  @keyframes scan-move {
    from { top: -28%; }
    to   { top: 110%; }
  }

  /* ── BOTTOM EDGE BAR ── */
  .tg-bar {
    position: absolute;
    bottom: 0; left: 0;
    height: 2px;
    width: 0;
    background: var(--neon);
    box-shadow: 0 0 10px var(--neon), 0 0 20px rgba(0,245,255,0.5);
    transition: width 0.45s cubic-bezier(0.22,1,0.36,1);
    z-index: 2;
  }

  .tg-card:hover .tg-bar { width: 100%; }

  /* bottom-left bracket */
  .tg-corner {
    position: absolute;
    bottom: -1px; left: -1px;
    width: 14px; height: 14px;
    border-bottom: 2px solid var(--neon-20);
    border-left: 2px solid var(--neon-20);
    border-radius: 0 0 0 3px;
    transition: border-color 0.22s ease;
    z-index: 2;
  }

  .tg-card:hover .tg-corner {
    border-color: var(--neon-60);
  }

  /* ── INDEX ── */
  .tg-num {
    position: absolute;
    top: 13px; right: 15px;
    font-family: var(--mono);
    font-size: 9px;
    font-weight: 400;
    letter-spacing: 0.1em;
    color: var(--neon);
    opacity: 0.2;
    z-index: 1;
  }

  /* ── TOP ROW ── */
  .tg-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    position: relative;
    z-index: 1;
  }

  /* ── ICON BOX ── */
  .tg-icon-box {
    width: 42px; height: 42px;
    border-radius: 2px;
    border: 1px solid var(--neon-12);
    background: var(--bg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--neon);
    flex-shrink: 0;
    transition:
      background 0.22s ease,
      border-color 0.22s ease,
      box-shadow 0.25s ease,
      transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }

  .tg-card:hover .tg-icon-box {
    background: var(--neon-08);
    border-color: var(--neon-35);
    box-shadow:
      0 0 16px rgba(0,245,255,0.22),
      inset 0 0 10px rgba(0,245,255,0.06);
    transform: scale(1.1);
  }

  /* ── LIVE BADGE ── */
  .tg-badge {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 8px 4px 7px;
    border: 1px solid var(--neon-12);
    background: var(--neon-05);
    border-radius: 2px;
    flex-shrink: 0;
    transition: border-color 0.22s ease, background 0.22s ease;
  }

  .tg-card:hover .tg-badge {
    border-color: var(--neon-20);
    background: var(--neon-08);
  }

  .tg-badge-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--neon);
    box-shadow: 0 0 6px var(--neon);
    animation: badge-blink 2.8s ease-in-out infinite;
  }

  @keyframes badge-blink {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.3; }
  }

  .tg-badge-text {
    font-family: var(--mono);
    font-size: 8px;
    font-weight: 500;
    letter-spacing: 0.14em;
    color: var(--neon);
    opacity: 0.6;
  }

  /* ── FOOTER ── */
  .tg-foot {
    display: flex;
    flex-direction: column;
    gap: 5px;
    position: relative;
    z-index: 1;
  }

  .tg-label {
    font-family: var(--sans);
    font-size: 13.5px;
    font-weight: 600;
    color: var(--text);
    letter-spacing: 0.015em;
    line-height: 1.25;
    transition: color 0.2s ease;
  }

  .tg-card:hover .tg-label {
    color: #e8f4f8;
  }

  .tg-sub {
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 400;
    color: var(--muted);
    letter-spacing: 0.07em;
    line-height: 1.5;
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 600px) {
    .tg-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .tg-card { min-height: 148px; padding: 15px 13px 13px; }
    .tg-label { font-size: 12.5px; }
    .tg-icon-box { width: 36px; height: 36px; }
    .tg-wrap { padding: 16px; }
  }

  @media (max-width: 380px) {
    .tg-grid { grid-template-columns: 1fr; }
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
            — NO MODULES CONFIGURED —
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="tg-wrap">

        <div className="tg-header">
          <div className="tg-header-left">
            <div className="tg-header-pip" />
            <span className="tg-header-title">Module Directory</span>
          </div>
          <span className="tg-header-right">
            {String(tiles.length).padStart(2, '0')} NODES ACTIVE
          </span>
        </div>

        <div className="tg-grid">
          {tiles.map((tile, i) => {
            const Icon = ICONS[tile.icon] || ICONS.default
            const idx = String(i + 1).padStart(2, '0')

            return (
              <div
                key={tile.id}
                onClick={() => navigate(tile.path)}
                className="tg-card"
                style={{ animationDelay: `${i * 0.065}s` }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(tile.path)}
                aria-label={tile.label}
              >
                <div className="tg-scan" />
                {/* <span className="tg-num">{idx}</span> */}

                <div className="tg-top">
                  <div className="tg-icon-box">
                    <Icon size={18} />
                  </div>
                  <div className="tg-badge">
                    <div className="tg-badge-dot" />
                    <span className="tg-badge-text">LIVE</span>
                  </div>
                </div>

                <div className="tg-foot">
                  <div className="tg-label">{tile.label}</div>
                  {tile.sub && <div className="tg-sub">{tile.sub}</div>}
                </div>

                <div className="tg-bar" />
                <div className="tg-corner" />
              </div>
            )
          })}
        </div>

      </div>
    </>
  )
}