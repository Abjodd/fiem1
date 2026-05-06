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
    <header className="sticky top-0 z-[100] h-14 bg-white border-b border-[var(--border)] flex items-center gap-3 px-6 shadow-sm">

      <Link to="/" className="flex items-center gap-2 shrink-0 no-underline">
        <div className="h-8 w-[46px] bg-[var(--primary)] rounded-md flex items-center justify-center text-xs font-bold text-white tracking-wide">
          SAP
        </div>
        <span className="text-sm font-semibold text-[var(--text-primary)] whitespace-nowrap">
          Supplier Portal
        </span>
      </Link>

      <div className="w-px h-5 bg-[var(--border)] shrink-0" />

      <nav className="flex-1 flex items-center gap-1.5 min-w-0 text-[13px]">
        <Link to="/" className="text-[var(--primary)] font-medium shrink-0 no-underline hover:opacity-80 transition-opacity">
          Home
        </Link>
        {match && (
          <>
            <span className="text-[var(--border)] text-base">/</span>
            <span className="text-[var(--text-muted)] shrink-0">{match.module.label}</span>
            <span className="text-[var(--border)] text-base">/</span>
            <span className="text-[var(--text-primary)] font-semibold truncate">{match.tile.label}</span>
          </>
        )}
      </nav>

      <div className="hidden lg:flex flex-col items-end gap-0.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="bg-[var(--primary-light)] text-[var(--primary)] text-[11px] font-bold px-2 py-0.5 rounded leading-[18px]">
            {COMPANY}
          </span>
          <span className="text-xs font-medium text-[var(--text-primary)] max-w-[180px] truncate">
            {COMPANY_FULL}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <span>{SUPPLIER}</span>
          <span className="text-[var(--border)]">·</span>
          <span className="flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            {LOCATION}
          </span>
        </div>
      </div>

      <div className="w-px h-5 bg-[var(--border)] shrink-0 hidden lg:block" />

      <button className="relative w-[34px] h-[34px] rounded-lg flex items-center justify-center text-[var(--text-muted)] shrink-0 hover:bg-[var(--bg)] transition-colors">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span className="absolute top-[7px] right-[7px] w-1.5 h-1.5 rounded-full bg-red-500 border-[1.5px] border-white" />
      </button>

      <button className="w-[34px] h-[34px] rounded-full shrink-0 bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xs font-bold flex items-center justify-center shadow-sm">
        SN
      </button>

    </header>
  )
}