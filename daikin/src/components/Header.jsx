import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { findModuleByTilePath, NAV_MODULES } from '../router/index.jsx'

const COMPANY = 'DSAL'
const COMPANY_FULL = 'Daikin Airconditioning India Pvt. Ltd.'
const SUPPLIER = 'Kunstocom (India) Ltd'
const LOCATION = 'Neemrana, Alwar'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap');

  .hdr-root {
<<<<<<< HEAD
    --accent:        #0b3d91;
    --accent-2:      #1e5dd6;
    --accent-deep:   #07296b;
    --accent-soft:   rgba(11,61,145,0.06);
    --accent-mid:    rgba(11,61,145,0.12);
    --accent-brd:    rgba(11,61,145,0.20);

    --bg:            #ffffff;
    --surface:       #f4f6fa;
    --surface-2:     #e9edf3;

    --border:        rgba(15,23,42,0.08);
    --border-hard:   rgba(15,23,42,0.14);

    --ink:           #0f172a;
    --ink-2:         #334155;
    --muted:         #94a3b8;

    --mono: 'Geist Mono', monospace;
    --sans: 'Geist', -apple-system, sans-serif;
    --serif: 'Instrument Serif', serif;
=======
    --accent:       #2f5bc9;
    --accent-2:     #5b4be8;
    --accent-soft:  rgba(59,47,201,0.08);
    --accent-mid:   rgba(59,47,201,0.18);
    --accent-brd:   rgba(59,47,201,0.22);
    --bg:           #ffffff;
    --surface:      #f4f5fb;
    --surface-2:    #edeef8;
    --border:       rgba(59,47,201,0.10);
    --border-hard:  rgba(59,47,201,0.18);
    --ink:          #1a1740;
    --ink-2:        #4a4870;
    --muted:        #9896b8;
    --mono: 'IBM Plex Mono', monospace;
    --sans: 'IBM Plex Sans', sans-serif;
>>>>>>> 5c6458343e6ece76694fae1823e1af9fda1b7ce4

    position: sticky;
    top: 0;
    z-index: 2000;
    isolation: isolate;
    height: 56px;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    box-shadow: 0 1px 0 var(--border), 0 4px 16px rgba(11,61,145,0.05);
    display: flex;
    align-items: center;
    padding: 0 20px;
    gap: 0;
    font-family: var(--sans);
  }
.hdr-logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
}

<<<<<<< HEAD
  /* ── LOGO ── */
  .hdr-logo {
    display: flex;
    align-items: center;
    text-decoration: none;
    flex-shrink: 0;
    padding: 4px 4px 4px 0;
    transition: opacity 0.18s ease;
  }

  .hdr-logo:hover {
    opacity: 0.8;
  }

  .hdr-logo-img {
    width: 80px;
    height: auto;
    object-fit: contain;
    display: block;
  }

  .hdr-logo-fallback {
    font-family: var(--sans);
    font-size: 16px;
    font-weight: 700;
    color: var(--accent);
    letter-spacing: 0.06em;
  }
=======
.hdr-logo-mark {
  display: flex;
  align-items: center;
  justify-content: center;
}

.hdr-logo-img {
  width: 90px;   /* adjust size */
  height: auto;
  object-fit: contain;
  display: block;
}

/* Remove old styles */
.hdr-logo-fallback,
.hdr-logo-text,
.hdr-logo-name,
.hdr-logo-sub {
  display: none;
}
>>>>>>> 5c6458343e6ece76694fae1823e1af9fda1b7ce4

  /* ── DIVIDER ── */
  .hdr-div {
    width: 1px;
    height: 22px;
    background: var(--border-hard);
    margin: 0 16px;
    flex-shrink: 0;
  }

  /* ── BREADCRUMB ── */
  .hdr-nav {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    font-size: 12.5px;
    color: var(--muted);
    flex-shrink: 0;
    font-family: var(--sans);
  }

  .hdr-crumb-home {
    font-weight: 500;
    color: var(--ink-2);
    text-decoration: none;
    flex-shrink: 0;
    transition: color 0.15s ease;
    letter-spacing: -0.005em;
  }

  .hdr-crumb-home:hover { color: var(--accent); }

  .hdr-crumb-sep {
    color: var(--muted);
    font-size: 14px;
    flex-shrink: 0;
    opacity: 0.6;
  }

  .hdr-crumb-module {
    color: var(--ink-2);
    flex-shrink: 0;
    font-weight: 400;
    letter-spacing: -0.005em;
  }

  .hdr-crumb-tile {
    font-weight: 500;
    color: var(--accent);
    background: var(--accent-soft);
    border: 1px solid var(--accent-brd);
    padding: 3px 9px;
    border-radius: 5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    letter-spacing: 0.02em;
    font-family: var(--mono);
    font-size: 11px;
  }

  /* ── SEARCH ── */
  .hdr-search-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 16px;
    min-width: 0;
    position: relative;
    z-index: 2100;
  }

  .hdr-search-box {
    position: relative;
    width: 100%;
    max-width: 380px;
  }

  .hdr-search-icon {
    position: absolute;
    left: 11px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--muted);
    pointer-events: none;
    display: flex;
    align-items: center;
  }

  .hdr-search-input {
    width: 100%;
    height: 34px;
    background: var(--surface);
    border: 1px solid var(--border-hard);
    border-radius: 100px;
    padding: 0 36px 0 34px;
    font-family: var(--sans);
    font-size: 12.5px;
    color: var(--ink);
    outline: none;
    transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
    letter-spacing: -0.005em;
    box-sizing: border-box;
  }

  .hdr-search-input::placeholder { color: var(--muted); }

  .hdr-search-input:focus {
    border-color: var(--accent);
    background: #ffffff;
    box-shadow: 0 0 0 4px rgba(11,61,145,0.10);
  }

  .hdr-search-input:focus + .hdr-search-kbd {
    color: var(--accent);
    border-color: var(--accent-brd);
    background: rgba(11,61,145,0.06);
  }

  .hdr-search-kbd {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    font-family: var(--mono);
    font-size: 9px;
    font-weight: 500;
    color: var(--muted);
    background: var(--surface-2);
    border: 1px solid var(--border-hard);
    border-radius: 4px;
    padding: 2px 6px;
    letter-spacing: 0.04em;
    pointer-events: none;
    transition: all 0.18s ease;
  }

  /* Search dropdown */
  .hdr-search-drop {
    position: absolute;
    z-index: 2200;
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 380px;
    background: #ffffff;
    border: 1px solid var(--border-hard);
    border-radius: 14px;
    overflow: hidden;
    box-shadow:
      0 1px 0 rgba(255,255,255,0.6) inset,
      0 16px 40px -8px rgba(11,61,145,0.18),
      0 4px 12px rgba(11,61,145,0.08);
    z-index: 999;
    max-height: 360px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--border-hard) transparent;
  }

  .hdr-search-drop::-webkit-scrollbar { width: 4px; }
  .hdr-search-drop::-webkit-scrollbar-thumb {
    background: var(--border-hard);
    border-radius: 4px;
  }

  .hdr-search-group-label {
    font-family: var(--mono);
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: var(--accent);
    padding: 12px 16px 6px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
  }

  .hdr-search-item {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 10px 16px;
    cursor: pointer;
    transition: background 0.15s ease;
    -webkit-tap-highlight-color: transparent;
  }

  .hdr-search-item:hover,
  .hdr-search-item.focused {
    background: var(--accent-soft);
  }

  .hdr-search-item-icon {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: var(--surface);
    border: 1px solid var(--border-hard);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--accent);
    transition: all 0.15s ease;
  }

  .hdr-search-item:hover .hdr-search-item-icon,
  .hdr-search-item.focused .hdr-search-item-icon {
    background: var(--accent);
    color: #ffffff;
    border-color: var(--accent);
  }

  .hdr-search-item-text { flex: 1; min-width: 0; }

  .hdr-search-item-label {
    font-size: 12.5px;
    font-weight: 500;
    color: var(--ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: var(--sans);
    letter-spacing: -0.005em;
  }

  .hdr-search-item-label mark {
    background: transparent;
    color: var(--accent);
    font-weight: 600;
  }

  .hdr-search-item-module {
    font-size: 10px;
    color: var(--muted);
    margin-top: 2px;
    font-family: var(--mono);
    letter-spacing: 0.02em;
  }

  .hdr-search-arrow {
    color: var(--muted);
    flex-shrink: 0;
    transition: transform 0.2s ease, color 0.15s ease;
  }

  .hdr-search-item:hover .hdr-search-arrow,
  .hdr-search-item.focused .hdr-search-arrow {
    color: var(--accent);
    transform: translateX(2px);
  }

  .hdr-search-empty {
    padding: 28px 16px;
    text-align: center;
    font-size: 12.5px;
    color: var(--muted);
    font-family: var(--sans);
  }

  /* ── COMPANY BLOCK ── */
  .hdr-company {
    display: none;
    flex-direction: column;
    align-items: flex-end;
    gap: 3px;
    flex-shrink: 0;
  }

  @media (min-width: 1024px) { .hdr-company { display: flex; } }

  .hdr-company-row1 {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .hdr-badge {
<<<<<<< HEAD
    font-family: var(--mono);
    font-size: 9.5px;
    font-weight: 500;
    letter-spacing: 0.14em;
    padding: 3px 8px;
    border-radius: 5px;
    background: var(--accent);
    color: #ffffff;
  }
=======
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.1em;
  padding: 2px 7px;
  border-radius: 4px;
  background: #0082c4;
  color: #ffffff;
}
>>>>>>> 5c6458343e6ece76694fae1823e1af9fda1b7ce4

  .hdr-company-name {
    font-family: var(--sans);
    font-size: 12px;
    font-weight: 500;
    color: var(--ink-2);
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    letter-spacing: -0.005em;
  }

  .hdr-company-row2 {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10.5px;
    color: var(--muted);
    font-family: var(--sans);
    letter-spacing: -0.005em;
  }

  .hdr-loc {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* ── ACTIONS ── */
  .hdr-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: 8px;
    flex-shrink: 0;
  }

  .hdr-icon-btn {
    position: relative;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid var(--border-hard);
    background: transparent;
    color: var(--ink-2);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
  }

  .hdr-icon-btn:hover {
    background: var(--accent-soft);
    color: var(--accent);
    border-color: var(--accent-brd);
  }

  .hdr-notif-dot {
    position: absolute;
    top: 7px;
    right: 7px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent);
    border: 2px solid var(--bg);
    box-shadow: 0 0 0 1px rgba(11,61,145,0.2);
  }

  .hdr-avatar {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%);
    border: 1px solid var(--accent);
    color: #ffffff;
    font-family: var(--sans);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.04em;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: box-shadow 0.18s ease, transform 0.18s ease;
  }

  .hdr-avatar:hover {
    box-shadow: 0 0 0 4px rgba(11,61,145,0.15);
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    .hdr-root { padding: 0 14px 0 60px; }
    .hdr-div { margin: 0 10px; }
    .hdr-logo-img { width: 100px; }
    .hdr-nav { display: none; }
    .hdr-search-wrap { padding: 0 8px 0 0; }
  }

  @media (max-width: 480px) {
    .hdr-search-kbd { display: none; }
  }
`

function buildSearchIndex() {
  const items = []
  for (const mod of NAV_MODULES) {
    for (const tile of (mod.tiles || [])) {
      items.push({ moduleId: mod.id, moduleLabel: mod.label, tile })
    }
  }
  return items
}

function highlight(text, query) {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

const TileIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M9 9h6M9 12h6M9 15h4" />
  </svg>
)

export default function Header() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const match = findModuleByTilePath(pathname)

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [focusedIdx, setFocusedIdx] = useState(0)
  const inputRef = useRef(null)
  const wrapRef = useRef(null)

  const allItems = buildSearchIndex()

  const results = query.trim().length > 0
    ? allItems.filter(({ moduleLabel, tile }) =>
      tile.label.toLowerCase().includes(query.toLowerCase()) ||
      moduleLabel.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 12)
    : []

  const grouped = results.reduce((acc, item) => {
    const key = item.moduleLabel
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === '/' || (e.ctrlKey && e.key === 'k')) && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIdx(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[focusedIdx]) {
      const item = results[focusedIdx]
      if (item.tile.path) {
        navigate(item.tile.path)
        setOpen(false)
        setQuery('')
      }
    }
  }

  const handleSelect = (item) => {
    if (item.tile.path) {
      navigate(item.tile.path)
    }
    setOpen(false)
    setQuery('')
  }

  let flatIdx = 0

  return (
    <>
      <style>{CSS}</style>
      <header className="hdr-root">

        {/* Logo */}
        <Link to="/" className="hdr-logo">
<<<<<<< HEAD
          <img
            src="/daikin.png"
            alt="Daikin Logo"
            className="hdr-logo-img"
            onError={(e) => {
              e.target.style.display = 'none'
              const span = document.createElement('span')
              span.className = 'hdr-logo-fallback'
              span.textContent = 'DAIKIN'
              e.target.parentNode.appendChild(span)
            }}
          />
=======
          <div className="hdr-logo-mark">
            <img
              src="/daikin.png"
              alt="Logo"
              className="hdr-logo-img"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
>>>>>>> 5c6458343e6ece76694fae1823e1af9fda1b7ce4
        </Link>

        <div className="hdr-div" />

        {/* Breadcrumb */}
        <nav className="hdr-nav">
          <Link to="/" className="hdr-crumb-home">Home</Link>
          {match && (
            <>
              <span className="hdr-crumb-sep">/</span>
              <span className="hdr-crumb-module">{match.module.label}</span>
              <span className="hdr-crumb-sep">/</span>
              <span className="hdr-crumb-tile">{match.tile.label}</span>
            </>
          )}
        </nav>

        {/* Search */}
        <div className="hdr-search-wrap" ref={wrapRef}>
          <div className="hdr-search-box">
            <span className="hdr-search-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
            </span>
            <input
              ref={inputRef}
              className="hdr-search-input"
              type="text"
              placeholder="Search modules & items…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); setFocusedIdx(0) }}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              spellCheck={false}
            />
            <span className="hdr-search-kbd">/</span>

            {open && query.trim().length > 0 && (
              <div className="hdr-search-drop">
                {results.length === 0 ? (
                  <div className="hdr-search-empty">No results for "{query}"</div>
                ) : (
                  Object.entries(grouped).map(([modLabel, items]) => (
                    <div key={modLabel}>
                      <div className="hdr-search-group-label">{modLabel}</div>
                      {items.map((item) => {
                        const idx = flatIdx++
                        return (
                          <div
                            key={item.tile.label + idx}
                            className={`hdr-search-item${focusedIdx === idx ? ' focused' : ''}`}
                            onMouseEnter={() => setFocusedIdx(idx)}
                            onClick={() => handleSelect(item)}
                          >
                            <div className="hdr-search-item-icon"><TileIcon /></div>
                            <div className="hdr-search-item-text">
                              <div className="hdr-search-item-label">
                                {highlight(item.tile.label, query)}
                              </div>
                              <div className="hdr-search-item-module">{item.moduleLabel}</div>
                            </div>
                            <span className="hdr-search-arrow">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 18l6-6-6-6" />
                              </svg>
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Company info */}
        <div className="hdr-company">
          <div className="hdr-company-row1">
            <span className="hdr-badge">{COMPANY}</span>
            <span className="hdr-company-name">{COMPANY_FULL}</span>
          </div>
          <div className="hdr-company-row2">
            <span>{SUPPLIER}</span>
            <span>·</span>
            <span className="hdr-loc">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              {LOCATION}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="hdr-actions">
          <div className="hdr-div" style={{ margin: '0 4px' }} />
          <button className="hdr-icon-btn" aria-label="Notifications">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="hdr-notif-dot" />
          </button>
          <button className="hdr-avatar" aria-label="Profile">AW</button>
        </div>

      </header>
    </>
  )
}