import { useState, useEffect, useRef, useCallback } from 'react'
import Header from '../components/Header.jsx'
import NavBar from '../components/NavBar.jsx'
import { NAV_MODULES } from '../router/index.jsx'
import TileGrid from '../components/TileGrid.jsx'

export default function MainLayout() {
  const [activeModule, setActiveModule] = useState(NAV_MODULES[0]?.id)
  const sectionRefs = useRef({})
  const scrollAreaRef = useRef(null)
  const isScrollingTo = useRef(false)
  const scrollTimer = useRef(null)

  const getStickyHeight = () => 56 + 60 + 8

  useEffect(() => {
    const stickyH = getStickyHeight()
    const scrollArea = scrollAreaRef.current
    if (!scrollArea) return

    const visibleSections = new Set()

    const obs = new IntersectionObserver(
      (entries) => {
        if (isScrollingTo.current) return

        entries.forEach((entry) => {
          const id = entry.target.dataset.moduleId
          if (entry.isIntersecting) visibleSections.add(id)
          else visibleSections.delete(id)
        })

        if (visibleSections.size === 0) return

        let topmost = null
        let topmostY = Infinity
        visibleSections.forEach((id) => {
          const el = sectionRefs.current[id]
          if (!el) return
          const rect = el.getBoundingClientRect()
          if (rect.top < topmostY) { topmostY = rect.top; topmost = id }
        })

        if (topmost) setActiveModule(topmost)
      },
      {
        root: scrollArea,
        rootMargin: `-${stickyH}px 0px -20% 0px`,
        threshold: 0
      }
    )

    NAV_MODULES.forEach((mod) => {
      const el = sectionRefs.current[mod.id]
      if (el) { el.dataset.moduleId = mod.id; obs.observe(el) }
    })

    return () => obs.disconnect()
  }, [])

  const handleSelect = useCallback((id) => {
    const el = sectionRefs.current[id]
    const scrollArea = scrollAreaRef.current
    if (!el || !scrollArea) return

    setActiveModule(id)
    isScrollingTo.current = true
    if (scrollTimer.current) clearTimeout(scrollTimer.current)

    const offset = getStickyHeight()
    const top =
      el.getBoundingClientRect().top -
      scrollArea.getBoundingClientRect().top +
      scrollArea.scrollTop -
      offset

    scrollArea.scrollTo({ top, behavior: 'smooth' })
    scrollTimer.current = setTimeout(() => { isScrollingTo.current = false }, 1000)
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }

        .ml-shell {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        .ml-fixed-top {
          flex-shrink: 0;
          position: relative;
          z-index: 100;
        }

        .ml-scroll-area {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .ml-main {
          max-width: 1280px;
          margin: 0 auto;
          padding: 36px 28px 80px;
          display: flex;
          flex-direction: column;
          gap: 56px;
        }

        .ml-section {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

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
          white-space: nowrap;
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
          white-space: nowrap;
        }
      `}</style>

      <div className="ml-shell">
        <div className="ml-fixed-top">
          <Header />
          <NavBar activeModule={activeModule} onSelect={handleSelect} />
        </div>

        <div className="ml-scroll-area" ref={scrollAreaRef}>
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
        </div>
      </div>
    </>
  )
}