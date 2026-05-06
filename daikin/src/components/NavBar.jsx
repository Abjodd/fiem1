import { NAV_MODULES } from '../router/index.jsx'
import { useRef, useEffect, useState } from 'react'

export default function NavBar({ activeModule, onSelect }) {
  const [indicatorStyle, setIndicatorStyle] = useState({})
  const [hovered, setHovered] = useState(null)

  const navRef = useRef(null)
  const buttonRefs = useRef({})

  useEffect(() => {
    const btn = buttonRefs.current[activeModule]

    if (!btn) return

    const nav = navRef.current
    const navRect = nav.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()

    setIndicatorStyle({
      width: btnRect.width,
      transform: `translateX(${btnRect.left - navRect.left + nav.scrollLeft}px)`,
    })

    btn.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [activeModule])

  const scrollLeft = () => {
    navRef.current.scrollBy({
      left: -250,
      behavior: 'smooth',
    })
  }

  const scrollRight = () => {
    navRef.current.scrollBy({
      left: 250,
      behavior: 'smooth',
    })
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');

        .nb-wrapper {
          position: sticky;
          top: 56px;
          z-index: 95;
          display: flex;
          align-items: center;
          background: #03122b;
          border-bottom: 1px solid rgba(56, 140, 255, 0.12);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.04),
            0 4px 32px rgba(0,0,0,0.45),
            0 1px 0 rgba(56,140,255,0.08);
          padding: 0 10px;
        }

        .nb-root {
  position: relative;
  flex: 1;
  height: 60px;
  background: #03122b;
  display: flex;
  align-items: center;
  overflow-x: auto;
  scrollbar-width: none;
  font-family: 'Outfit', sans-serif;
  scroll-behavior: smooth;
}

        .nb-root::-webkit-scrollbar {
          display: none;
        }

        /* Background Grid Effect */
        .nb-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            90deg,
            transparent,
            transparent 100px,
            rgba(56,140,255,0.03) 100px,
            rgba(56,140,255,0.03) 101px
          );
          pointer-events: none;
        }

        /* Active Sliding Pill */
        .nb-pill {
  position: absolute;
  top: 7px;
  bottom: 7px;
  border-radius: 12px;
}

        /* Bottom Laser */
        .nb-laser {
          position: absolute;
          bottom: 0;
          height: 3px;
          border-radius: 3px 3px 0 0;
          background:
            linear-gradient(
              90deg,
              #1e5adc,
              #38c6ff,
              #1e5adc
            );
          background-size: 200% 100%;
          animation: laser-shimmer 2.4s linear infinite;
          transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          pointer-events: none;
          box-shadow:
            0 -2px 12px rgba(56,198,255,0.6),
            0 -1px 4px rgba(56,198,255,0.8);
        }

        @keyframes laser-shimmer {
          0% {
            background-position: 0% 0%;
          }

          100% {
            background-position: 200% 0%;
          }
        }

        /* Top Reflection */
        .nb-top-line {
          position: absolute;
          top: 0;
          height: 2px;
          border-radius: 0 0 2px 2px;
          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(56,198,255,0.45),
              transparent
            );
          transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          pointer-events: none;
        }

        /* NAV BUTTON */
       .nb-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 9px;
  flex-shrink: 0;

  height: 46px;
  padding: 0 22px;
  margin: 0 5px;

  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: 0.02em;

  white-space: nowrap;
  border: none;
  background: transparent;
  cursor: pointer;

  border-radius: 12px;
  z-index: 10;

  color: rgba(160, 190, 240, 0.65);

  transition:
    color 0.2s ease,
    transform 0.2s ease;
}

        .nb-btn:hover {
          color: #ffffff;
          transform: translateY(-1px);
        }

        .nb-btn.active {
          color: #ffffff;
          font-weight: 700;
        }

        /* Dot */
        .nb-btn-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(56,140,255,0.45);

          transition:
            background 0.2s,
            box-shadow 0.2s,
            transform 0.2s;

          flex-shrink: 0;
        }

        .nb-btn.active .nb-btn-dot {
          background: #38c6ff;
          box-shadow: 0 0 10px 3px rgba(56,198,255,0.55);
          transform: scale(1.2);
        }

        .nb-btn:hover .nb-btn-dot {
          background: rgba(56,198,255,0.8);
        }

        /* Hover Glow */
        .nb-btn::after {
          content: '';
          position: absolute;
          inset: 6px;
          border-radius: 12px;
          background:
            radial-gradient(
              circle at 50% 50%,
              rgba(56,140,255,0.18),
              transparent 70%
            );
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
        }

        .nb-btn:hover::after {
          opacity: 1;
        }

        /* ARROWS */
        
         .nb-arrow {
  width: 34px;
  height: 34px;

  border: none;
  outline: none;

  background: rgba(56,140,255,0.12);
  color: #ffffff;

  cursor: pointer;

  border-radius: 10px;

  margin: 0 4px;

  font-size: 11px;
  font-weight: 700;

  transition:
    background 0.2s ease,
    transform 0.2s ease;

  flex-shrink: 0;
}

        .nb-arrow:hover {
  background: rgba(56,140,255,0.24);
  transform: scale(1.04);
}

        .nb-arrow:active {
          transform: scale(0.98);
        }

        @media (max-width: 768px) {
          .nb-root {
            height: 72px;
          }

          .nb-btn {
            padding: 0 24px;
            font-size: 14px;
            height: 50px;
          }

          .nb-arrow {
            width: 42px;
            height: 42px;
          }
        }
      `}</style>

      <div className="nb-wrapper">

        {/* LEFT ARROW */}
        <button
          className="nb-arrow"
          onClick={scrollLeft}
        >
          ◀
        </button>

        {/* NAVIGATION */}
        <nav
          ref={navRef}
          className="nb-root"
        >
          {/* Sliding Pill */}
          <span
            className="nb-pill"
            style={indicatorStyle}
          />

          {/* Laser */}
          <span
            className="nb-laser"
            style={{
              width: indicatorStyle.width,
              transform: indicatorStyle.transform,
            }}
          />

          {/* Top Reflection */}
          <span
            className="nb-top-line"
            style={{
              width: indicatorStyle.width,
              transform: indicatorStyle.transform,
            }}
          />

          {NAV_MODULES.map((mod) => {
            const isActive = activeModule === mod.id

            return (
              <button
                key={mod.id}
                ref={(el) => (buttonRefs.current[mod.id] = el)}
                onClick={() => onSelect(mod.id)}
                onMouseEnter={() => setHovered(mod.id)}
                onMouseLeave={() => setHovered(null)}
                className={`nb-btn ${isActive ? 'active' : ''}`}
              >
                <span className="nb-btn-dot" />
                {mod.label}
              </button>
            )
          })}
        </nav>

        {/* RIGHT ARROW */}
        <button
          className="nb-arrow"
          onClick={scrollRight}
        >
          ▶
        </button>
      </div>
    </>
  )
}