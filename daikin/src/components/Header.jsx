import { Link, useLocation } from 'react-router-dom'
import { findModuleByTilePath } from '../router/index.jsx'

const COMPANY = 'DSAL'
const COMPANY_FULL = 'Daikin Airconditioning India Pvt. Ltd.'
const SUPPLIER = 'Kunstocom (India) Ltd'
const LOCATION = 'Neemrana, Alwar'

export default function Header() {
  const { pathname } = useLocation()
  const match = findModuleByTilePath(pathname)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');

        .hdr-root {
          position: sticky;
          top: 0;
          z-index: 100;
          height: 56px;
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 1px solid rgba(0,0,0,0.07);
          display: flex;
          align-items: center;
          gap: 0;
          padding: 0 20px;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 1px 0 rgba(0,0,0,0.04), 0 4px 24px rgba(0,80,180,0.04);
        }

        /* Logo pill */
        .hdr-logo-link {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          flex-shrink: 0;
          padding: 4px 10px 4px 4px;
          border-radius: 12px;
          transition: background 0.18s;
        }
        .hdr-logo-link:hover { background: rgba(0,90,200,0.06); }

        .hdr-logo-img-wrap {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          overflow: hidden;
          background: #0050b8;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,80,180,0.18);
          flex-shrink: 0;
        }
        .hdr-logo-img {
          width: 28px;
          height: 28px;
          object-fit: contain;
          padding: 0;
          display: block;
        }
        .hdr-logo-wordmark {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }
        .hdr-logo-top {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 800;
          color: #0050b8;
          letter-spacing: 0.04em;
        }
        .hdr-logo-sub {
          font-size: 9.5px;
          font-weight: 400;
          color: #8a9ab5;
          letter-spacing: 0.02em;
          margin-top: 1px;
        }

        /* Divider */
        .hdr-div {
          width: 1px;
          height: 22px;
          background: linear-gradient(180deg, transparent, rgba(0,0,0,0.1), transparent);
          margin: 0 14px;
          flex-shrink: 0;
        }

        /* Breadcrumb */
        .hdr-nav {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          font-size: 12.5px;
        }
        .hdr-crumb-home {
          color: #0050b8;
          font-weight: 600;
          text-decoration: none;
          flex-shrink: 0;
          letter-spacing: 0.01em;
          transition: opacity 0.15s;
        }
        .hdr-crumb-home:hover { opacity: 0.7; }
        .hdr-crumb-sep {
          color: #c8d3e6;
          font-size: 15px;
          flex-shrink: 0;
          line-height: 1;
        }
        .hdr-crumb-module {
          color: #8a9ab5;
          flex-shrink: 0;
          font-weight: 400;
        }
        .hdr-crumb-tile {
          color: #1a2540;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          background: rgba(0,80,184,0.07);
          padding: 2px 9px;
          border-radius: 6px;
          letter-spacing: 0.01em;
        }

        /* Company info block */
        .hdr-company {
          display: none;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          flex-shrink: 0;
        }
        @media (min-width: 1024px) { .hdr-company { display: flex; } }

        .hdr-company-row1 {
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .hdr-badge {
          background: linear-gradient(135deg, #0050b8, #1a8cff);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 5px;
          letter-spacing: 0.06em;
          box-shadow: 0 2px 6px rgba(0,80,184,0.22);
        }
        .hdr-company-name {
          font-size: 12px;
          font-weight: 500;
          color: #1a2540;
          max-width: 190px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .hdr-company-row2 {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10.5px;
          color: #8a9ab5;
        }
        .hdr-dot { color: #c8d3e6; }
        .hdr-loc {
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .hdr-loc svg { opacity: 0.6; }

        /* Action buttons */
        .hdr-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: 12px;
          flex-shrink: 0;
        }

        .hdr-icon-btn {
          position: relative;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: #5a6a8a;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, color 0.15s;
        }
        .hdr-icon-btn:hover {
          background: rgba(0,80,180,0.07);
          color: #0050b8;
        }
        .hdr-notif-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ef4444;
          border: 1.5px solid white;
          animation: pulse-dot 2s infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 0 4px rgba(239,68,68,0); }
        }

        .hdr-avatar {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: linear-gradient(135deg, #0050b8 0%, #1a8cff 100%);
          color: white;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          letter-spacing: 0.05em;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(0,80,184,0.25);
          transition: box-shadow 0.15s, transform 0.15s;
        }
        .hdr-avatar:hover {
          box-shadow: 0 4px 16px rgba(0,80,184,0.35);
          transform: translateY(-1px);
        }
      `}</style>

      <header className="hdr-root">

        {/* Logo */}
        <Link to="/" className="hdr-logo-link">
          
            <div className="hdr-logo-img-wrap">
              <img src="/daikin.png" alt="Logo" className="hdr-logo-img"
                onError={e => { e.target.style.display='none'; e.target.parentNode.innerHTML='<span style="font-family:Syne,sans-serif;font-size:11px;font-weight:800;color:white;letter-spacing:0.04em">SAP</span>'; }} />
            </div>
          
          <div className="hdr-logo-wordmark">
            <span className="hdr-logo-top">DAIKIN</span>
            <span className="hdr-logo-sub">SAP Portal</span>
          </div>
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

        {/* Company info */}
        <div className="hdr-company">
          <div className="hdr-company-row1">
            <span className="hdr-badge">{COMPANY}</span>
            <span className="hdr-company-name">{COMPANY_FULL}</span>
          </div>
          <div className="hdr-company-row2">
            <span>{SUPPLIER}</span>
            <span className="hdr-dot">·</span>
            <span className="hdr-loc">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
              {LOCATION}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="hdr-actions">
          <div className="hdr-div" style={{margin: '0 2px'}} />
          <button className="hdr-icon-btn" aria-label="Notifications">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span className="hdr-notif-dot" />
          </button>
          <button className="hdr-avatar" aria-label="Profile">SN</button>
        </div>

      </header>
    </>
  )
}