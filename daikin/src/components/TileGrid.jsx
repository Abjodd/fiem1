import { useNavigate } from 'react-router-dom'
import { useRef } from 'react'
import { ICONS } from './icons.jsx'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap');

  .tg-wrap {
<<<<<<< HEAD
    --accent:        #0b3d91;
    --accent-light:  #1e5dd6;
    --accent-deep:   #07296b;
    --accent-soft:   rgba(11,61,145,0.05);
    --accent-mid:    rgba(11,61,145,0.10);
    --accent-brd:    rgba(11,61,145,0.18);

    --surface:       #ffffff;
    --surface-2:     #f1f4f9;
    --bg:            #e9edf3;

    --border:        rgba(15,23,42,0.08);
    --border-hard:   rgba(15,23,42,0.14);

    --ink:           #0f172a;
    --ink-2:         #334155;
    --ink-3:         #64748b;
    --muted:         #94a3b8;

    --mono: 'Geist Mono', monospace;
    --sans: 'Geist', -apple-system, sans-serif;
    --serif: 'Instrument Serif', serif;
=======
    --accent:      #0082c4;
    --accent-soft: rgba(0,130,196,0.08);
    --border:      rgba(0,130,196,0.10);
    --border-hard: rgba(0,130,196 ,0.20);
    --ink:         #1e1b4b;
    --muted:       #9896b8;
    --surface:     #ffffff;
    --mono: 'IBM Plex Mono', monospace;
    --sans: 'IBM Plex Sans', sans-serif;
>>>>>>> 5c6458343e6ece76694fae1823e1af9fda1b7ce4
    font-family: var(--sans);

    position: relative;
  }

  /* ── EMPTY STATE ── */
  .tg-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 60px 24px;
    border: 1px dashed var(--border-hard);
    border-radius: 14px;
    background: var(--surface-2);
    color: var(--ink-3);
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    font-family: var(--mono);
  }

  .tg-empty-icon {
    font-size: 32px;
    opacity: 0.4;
    color: var(--accent);
    margin-bottom: 2px;
  }

  /*
    ── HORIZONTAL SCROLL TRACK ──
  */
  .tg-grid {
    display: flex;
    gap: 18px;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    scroll-snap-type: x mandatory;
    padding: 6px 2px 14px;
    margin: 0 -2px;
    /* fade out edges for visual depth */
    mask-image: linear-gradient(to right, transparent 0, #000 18px, #000 calc(100% - 18px), transparent 100%);
    -webkit-mask-image: linear-gradient(to right, transparent 0, #000 18px, #000 calc(100% - 18px), transparent 100%);

    /* Hide native scrollbar */
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .tg-grid::-webkit-scrollbar { display: none; }

  /* ── CARD ── */
  .tg-card {
    position: relative;
    background: var(--surface);
    border: 1px solid var(--border-hard);
    border-radius: 16px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: transform 0.3s cubic-bezier(0.16,1,0.3,1),
                border-color 0.25s ease,
                box-shadow 0.3s ease;
    animation: tg-in 0.5s cubic-bezier(0.16,1,0.3,1) both;
    -webkit-tap-highlight-color: transparent;

    /* fixed-width carousel item */
    flex: 0 0 calc((100% - 18px * 3) / 4); /* 4 visible, 18px gaps */
    min-width: 240px;
    max-width: 360px;
    scroll-snap-align: start;
  }

  @keyframes tg-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .tg-card:hover {
    transform: translateY(-4px);
    border-color: var(--accent-brd);
    box-shadow:
      0 1px 2px rgba(15,23,42,0.04),
      0 14px 32px -10px rgba(11,61,145,0.2);
  }

  /* arrow indicator — top right of card via pseudo */
  .tg-body::after {
    content: '→';
    position: absolute;
    top: 14px;
    right: 16px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--muted);
    background: transparent;
    font-family: var(--sans);
    font-size: 16px;
    font-weight: 400;
    line-height: 1;
    transition: all 0.28s cubic-bezier(0.16,1,0.3,1);
    z-index: 2;
  }

  .tg-card:hover .tg-body::after {
    background: var(--accent);
    color: #fff;
    transform: translateX(3px);
  }

  /* ── COVER IMAGE ── */
  .tg-cover {
    position: relative;
    width: 100%;
    height: 140px;
    overflow: hidden;
    flex-shrink: 0;
    background: var(--surface-2);
  }

  .tg-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.5s cubic-bezier(0.16,1,0.3,1);
  }

  .tg-card:hover .tg-cover img {
    transform: scale(1.05);
  }

  .tg-cover-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(7,41,107,0) 30%,
      rgba(7,41,107,0.35) 100%
    );
    transition: background 0.3s;
  }

  .tg-card:hover .tg-cover-overlay {
    background: linear-gradient(
      180deg,
      rgba(11,61,145,0.05) 0%,
      rgba(7,41,107,0.5) 100%
    );
  }

  /* small icon chip on cover */
  .tg-cover-icon {
    position: absolute;
    bottom: 12px;
    left: 14px;
    width: 34px;
    height: 34px;
    border-radius: 9px;
    background: rgba(255,255,255,0.95);
    border: 1px solid rgba(255,255,255,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent);
    backdrop-filter: blur(6px);
    transition: background 0.25s, transform 0.25s cubic-bezier(0.16,1,0.3,1);
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(7,41,107,0.22);
  }

  .tg-card:hover .tg-cover-icon {
    background: var(--accent);
    color: #ffffff;
    transform: scale(1.08);
    border-color: transparent;
  }

  /* status dot — top-left of cover */
  .tg-cover-dot {
    position: absolute;
    top: 12px;
    left: 14px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #4ade80;
    box-shadow: 0 0 0 3px rgba(255,255,255,0.45);
  }

  /* ── BODY ── */
  .tg-body {
    padding: 18px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    position: relative;
  }

  .tg-label {
    font-family: var(--sans);
    font-size: 15.5px;
    font-weight: 600;
    color: var(--ink);
    letter-spacing: -0.015em;
    line-height: 1.3;
    padding-right: 32px;
  }

  .tg-sub {
    font-family: var(--sans);
    font-size: 12.5px;
    color: var(--ink-3);
    line-height: 1.5;
    letter-spacing: -0.005em;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* bottom accent bar */
  .tg-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    width: 0;
    background: var(--accent);
    border-radius: 0 2px 0 0;
    transition: width 0.4s cubic-bezier(0.16,1,0.3,1);
  }

  .tg-card:hover .tg-bar { width: 55%; }

  /* ── NO COVER FALLBACK ── */
  .tg-cover-fallback {
    width: 100%;
    height: 140px;
    background:
      linear-gradient(135deg, var(--surface-2) 0%, #e3e8f0 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
    border-bottom: 1px solid var(--border);
  }

  .tg-cover-fallback::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(11,61,145,0.045) 1px, transparent 1px),
      linear-gradient(90deg, rgba(11,61,145,0.045) 1px, transparent 1px);
    background-size: 22px 22px;
    pointer-events: none;
  }

  .tg-cover-fallback-icon {
    width: 46px;
    height: 46px;
    border-radius: 12px;
    background: var(--surface);
    border: 1px solid var(--accent-brd);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent);
    transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
    position: relative;
    z-index: 1;
    box-shadow: 0 2px 8px rgba(11,61,145,0.08);
  }

  .tg-card:hover .tg-cover-fallback-icon {
    background: var(--accent);
    color: #fff;
    transform: scale(1.08);
    border-color: var(--accent);
    box-shadow: 0 4px 16px rgba(11,61,145,0.28);
  }

  /*
    ── FUNCTIONAL CAROUSEL ARROWS ──
    Real buttons. Always visible when there are 5+ tiles (hidden otherwise
    via the data-show attribute on .tg-wrap).
  */
  .tg-arrow {
    position: absolute;
    top: calc(50% - 6px);
    transform: translateY(-50%);
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: var(--surface);
    border: 1px solid var(--border-hard);
    box-shadow: 0 4px 18px rgba(11,61,145,0.18);
    z-index: 10;
    display: none;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--accent);
    transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
    -webkit-tap-highlight-color: transparent;
    padding: 0;
  }

  .tg-arrow:hover {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
    transform: translateY(-50%) scale(1.08);
    box-shadow: 0 6px 22px rgba(11,61,145,0.32);
  }

  .tg-arrow:active {
    transform: translateY(-50%) scale(0.96);
  }

  .tg-arrow.tg-arrow-left  { left: -22px; }
  .tg-arrow.tg-arrow-right { right: -22px; }

  /* Show arrows when track has 5+ tiles */
  .tg-wrap[data-overflow="true"] .tg-arrow { display: flex; }

  /* ── RESPONSIVE ── */
  @media (max-width: 1100px) {
    .tg-card {
      flex: 0 0 calc((100% - 16px * 2) / 3);
    }
    .tg-grid { gap: 16px; }
  }

  @media (max-width: 768px) {
    .tg-card {
      flex: 0 0 calc((100% - 14px) / 2);
      min-width: 200px;
    }
    .tg-grid {
      gap: 14px;
      mask-image: linear-gradient(to right, transparent 0, #000 12px, #000 calc(100% - 12px), transparent 100%);
      -webkit-mask-image: linear-gradient(to right, transparent 0, #000 12px, #000 calc(100% - 12px), transparent 100%);
    }
    .tg-cover, .tg-cover-fallback { height: 120px; }
    .tg-label { font-size: 14px; padding-right: 28px; }
    .tg-sub { font-size: 12px; }
    .tg-body { padding: 14px 16px 16px; }
    .tg-body::after { width: 24px; height: 24px; top: 12px; right: 12px; font-size: 14px; }
    .tg-cover-icon { width: 30px; height: 30px; bottom: 10px; left: 12px; }
    .tg-cover-dot { top: 10px; left: 12px; }
    .tg-cover-fallback-icon { width: 40px; height: 40px; }
    /* hide arrows on mobile — touch-swipe is natural */
    .tg-wrap[data-overflow="true"] .tg-arrow { display: none; }
  }

  @media (max-width: 480px) {
    .tg-card {
      flex: 0 0 78%;
      min-width: 220px;
    }
  }
`

export default function TileGrid({ tiles }) {
  const navigate = useNavigate()
  const trackRef = useRef(null)

  const scrollByCard = (dir) => {
    const track = trackRef.current
    if (!track) return
    const card = track.querySelector('.tg-card')
    const cardWidth = card ? card.getBoundingClientRect().width : 260
    const gap = 18
    // Scroll by 2 cards at a time for a more useful jump
    const delta = (cardWidth + gap) * 2 * dir
    track.scrollBy({ left: delta, behavior: 'smooth' })
  }

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

  const hasOverflow = tiles.length > 4

  return (
    <>
      <style>{CSS}</style>
      <div className="tg-wrap" data-overflow={hasOverflow ? 'true' : 'false'}>
        {hasOverflow && (
          <button
            type="button"
            className="tg-arrow tg-arrow-left"
            onClick={() => scrollByCard(-1)}
            aria-label="Previous tiles"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        )}
        {hasOverflow && (
          <button
            type="button"
            className="tg-arrow tg-arrow-right"
            onClick={() => scrollByCard(1)}
            aria-label="Next tiles"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        )}
        <div className="tg-grid" ref={trackRef}>
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