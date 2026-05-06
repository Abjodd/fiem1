import { useState, useEffect, useRef, useCallback } from 'react'
import Header from '../components/Header.jsx'
import NavBar from '../components/NavBar.jsx'
import { NAV_MODULES } from '../router/index.jsx'
import TileGrid from '../components/TileGrid.jsx'

export default function MainLayout() {
  const [activeModule, setActiveModule] = useState(NAV_MODULES[0]?.id)
  const sectionRefs = useRef({})
  const isScrollingTo = useRef(false)

  // ── Scroll-spy via IntersectionObserver ──────────────────────────────
  useEffect(() => {
    const HEADER_H = 56 + 60 // header + navbar height
    const observers = []

    NAV_MODULES.forEach((mod) => {
      const el = sectionRefs.current[mod.id]
      if (!el) return

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (isScrollingTo.current) return
          if (entry.isIntersecting) setActiveModule(mod.id)
        },
        {
          rootMargin: `-${HEADER_H}px 0px -55% 0px`,
          threshold: 0,
        }
      )
      obs.observe(el)
      observers.push(obs)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [])

  // ── Nav click → smooth scroll to section ────────────────────────────
  const handleSelect = useCallback((id) => {
    const el = sectionRefs.current[id]
    if (!el) return

    setActiveModule(id)
    isScrollingTo.current = true

    const OFFSET = 56 + 60 + 16 // header + navbar + breathing room
    const top = el.getBoundingClientRect().top + window.scrollY - OFFSET

    window.scrollTo({ top, behavior: 'smooth' })

    // re-enable spy after scroll settles
    setTimeout(() => { isScrollingTo.current = false }, 900)
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

        .ml-main {
          max-width: 1280px;
          margin: 0 auto;
          padding: 36px 28px 80px;
          display: flex;
          flex-direction: column;
          gap: 56px;
        }

        /* Section wrapper */
        .ml-section {
          display: flex;
          flex-direction: column;
          gap: 18px;
          scroll-margin-top: 132px; /* header + navbar */
        }

        /* Module heading row */
        .ml-section-head {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .ml-section-label {
          font-family: 'Outfit', sans-serif;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          color: #8a9ab5;
        }

        .ml-section-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, rgba(30,90,220,0.15), transparent);
          border-radius: 1px;
        }

        .ml-section-count {
          font-family: 'Outfit', sans-serif;
          font-size: 10px;
          font-weight: 600;
          color: rgba(56,140,255,0.5);
          letter-spacing: 0.04em;
        }
      `}</style>

      <Header />
      <NavBar activeModule={activeModule} onSelect={handleSelect} />

      <main className="ml-main">
        {NAV_MODULES.map((mod) => (
          <section
            key={mod.id}
            id={`section-${mod.id}`}
            ref={(el) => (sectionRefs.current[mod.id] = el)}
            className="ml-section"
          >
            <div className="ml-section-head">
              <span className="ml-section-label">{mod.label}</span>
              <div className="ml-section-line" />
              {mod.tiles?.length > 0 && (
                <span className="ml-section-count">{mod.tiles.length} tiles</span>
              )}
            </div>

            <TileGrid tiles={mod.tiles} />
          </section>
        ))}
      </main>
    </>
  )
}