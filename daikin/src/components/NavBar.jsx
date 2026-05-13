import { NAV_MODULES } from '../router/index.jsx'
import { useRef, useEffect } from 'react'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');

  .nb-wrap {
    --accent:       #0082c4;
    --accent-2:     #5b4be8;
    --accent-soft:  rgba(8, 144, 213, 0.07);
    --accent-mid:   rgba(9, 113, 165, 0.14);
    --accent-brd:   rgba(22, 138, 196, 0.22);
    --bg:           #ffffff;
    --surface:      #f4f5fb;
    --border:       rgba(59,47,201,0.10);
    --border-hard:  rgba(12, 7, 75, 0.16);
    --ink:          #1a1740;
    --ink-2:        #4a4870;
    --muted:        #9896b8;
    --mono: 'IBM Plex Mono', monospace;
    --sans: 'IBM Plex Sans', sans-serif;

    display: flex;
    align-items: center;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    box-shadow: 0 1px 0 var(--border);
    padding: 0 8px;
    height: 44px;
    position: sticky;
    top: 56px;
    z-index: 190;
  }

  /* SCROLL TRACK */
  .nb-track {
    flex: 1;
    display: flex;
    align-items: center;
    overflow-x: auto;
    scrollbar-width: none;
    scroll-behavior: smooth;
    gap: 2px;
    padding: 0 4px;
  }

  .nb-track::-webkit-scrollbar { display: none; }

  /* BUTTON */
  .nb-btn {
    position: relative;
    display: flex;
    align-items: center;
    gap: 7px;
    flex-shrink: 0;
    height: 32px;
    padding: 0 13px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 6px;
    font-family: var(--sans);
    font-size: 12.5px;
    font-weight: 400;
    color: var(--muted);
    white-space: nowrap;
    transition: color 0.15s, background 0.15s;
    -webkit-tap-highlight-color: transparent;
    letter-spacing: 0.01em;
  }

  .nb-btn:hover {
    color: var(--ink-2);
    background: var(--accent-soft);
  }

  .nb-btn.active {
    color: var(--accent);
    font-weight: 600;
    background: var(--accent-soft);
  }

  /* ACTIVE BOTTOM LINE */
  .nb-btn.active::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 13px;
    right: 13px;
    height: 2px;
    background: var(--accent);
    border-radius: 2px 2px 0 0;
  }

  /* DOT */
  .nb-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--border-hard);
    flex-shrink: 0;
    transition: background 0.15s, transform 0.2s, box-shadow 0.2s;
  }

  .nb-btn.active .nb-dot {
    background: var(--accent);
    transform: scale(1.2);
    box-shadow: 0 0 0 3px rgba(59,47,201,0.15);
  }

  .nb-btn:hover .nb-dot { background: var(--accent-2); }

  /* COUNT BADGE */
  .nb-count {
    font-family: var(--mono);
    font-size: 9px;
    font-weight: 500;
    color: var(--muted);
    background: var(--surface);
    border: 1px solid var(--border-hard);
    padding: 1px 5px;
    border-radius: 10px;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.04em;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }

  .nb-btn.active .nb-count {
    background: var(--accent-soft);
    border-color: var(--accent-brd);
    color: var(--accent);
  }

  /* SCROLL ARROWS */
  .nb-arrow {
    width: 28px;
    height: 28px;
    border: 1px solid var(--border-hard);
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
    margin: 0 2px;
  }

  .nb-arrow:hover {
    background: var(--accent-soft);
    color: var(--accent);
    border-color: var(--accent-brd);
  }

  .nb-arrow svg { display: block; }

  @media (max-width: 768px) {
    .nb-wrap { display: none; }
  }
`

export default function NavBar({ activeModule, onSelect }) {
  const trackRef = useRef(null)
  const buttonRefs = useRef({})

  useEffect(() => {
    const btn = buttonRefs.current[activeModule]
    if (!btn) return
    btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeModule])

  const scroll = (dir) => {
    trackRef.current?.scrollBy({ left: dir * 220, behavior: 'smooth' })
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="nb-wrap">
        <button className="nb-arrow" onClick={() => scroll(-1)} aria-label="Scroll left">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="nb-track" ref={trackRef}>
          {NAV_MODULES.map((mod) => {
            const isActive = activeModule === mod.id
            return (
              <button
                key={mod.id}
                ref={(el) => (buttonRefs.current[mod.id] = el)}
                onClick={() => onSelect(mod.id)}
                className={`nb-btn${isActive ? ' active' : ''}`}
              >
                <span className="nb-dot" />
                {mod.label}
                {mod.tiles?.length > 0 && (
                  <span className="nb-count">{mod.tiles.length}</span>
                )}
              </button>
            )
          })}
        </div>

        <button className="nb-arrow" onClick={() => scroll(1)} aria-label="Scroll right">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </>
  )
}