import { useState } from 'react'
import Header from '../components/Header.jsx'
import NavBar from '../components/NavBar.jsx'
import { NAV_MODULES } from '../router/index.jsx'
import TileGrid from '../components/TileGrid.jsx'

export default function MainLayout() {
  const [activeModule, setActiveModule] = useState('purchasing')
  const mod = NAV_MODULES.find(m => m.id === activeModule)

  return (
    <>
      <Header />
      <NavBar activeModule={activeModule} onSelect={setActiveModule} />
      <main className="px-7 py-8 max-w-screen-xl">
        {mod && (
          <div>
            <p className="text-[11px] font-bold tracking-[1.2px] uppercase text-[var(--text-muted)] mb-4">
              {mod.label}
            </p>
            <TileGrid tiles={mod.tiles} />
          </div>
        )}
      </main>
    </>
  )
}