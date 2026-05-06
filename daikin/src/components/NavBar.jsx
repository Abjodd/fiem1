import { NAV_MODULES } from '../router/index.jsx'

export default function NavBar({ activeModule, onSelect }) {
  return (
    <nav className="sticky top-14 z-[90] h-12 bg-[var(--nav-bg)] flex items-stretch px-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {NAV_MODULES.map((mod) => {
        const isActive = activeModule === mod.id
        return (
          <button
            key={mod.id}
            onClick={() => onSelect(mod.id)}
            className={`relative flex items-center shrink-0 px-4 text-[13px] whitespace-nowrap transition-all duration-200 border-none outline-none
              ${isActive
                ? 'text-white font-semibold bg-white/10'
                : 'text-white/50 font-medium bg-transparent hover:text-white/80 hover:bg-white/5'
              }`}
          >
            <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-[var(--accent)] transition-all duration-300
              ${isActive ? 'w-8 opacity-100 shadow-[0_0_8px_2px_rgba(0,180,216,0.5)]' : 'w-0 opacity-0'}`}
            />
            {mod.label}
          </button>
        )
      })}
    </nav>
  )
}