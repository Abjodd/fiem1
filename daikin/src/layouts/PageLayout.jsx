import { useNavigate, useLocation } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { findModuleByTilePath } from '../router/index.jsx'

export default function PageLayout({ children }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const match = findModuleByTilePath(pathname)

  return (
    <>
      <Header />
      <div className="sticky top-14 z-[90] h-12 bg-[var(--nav-bg)] flex items-center px-7 gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-white/60 hover:text-white text-[13px] font-medium transition-colors duration-150"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          {match?.module.label || 'Back'}
        </button>
        <span className="text-white/25 text-base">›</span>
        <span className="text-white text-[13px] font-semibold tracking-wide">
          {match?.tile.label || ''}
        </span>
      </div>
      {children}
    </>
  )
}