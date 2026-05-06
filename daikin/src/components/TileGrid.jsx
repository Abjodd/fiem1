import { useNavigate } from 'react-router-dom'
import { ICONS } from './icons.jsx'

export default function TileGrid({ tiles }) {
  const navigate = useNavigate()

  if (!tiles || tiles.length === 0) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

          .tg-empty {
            font-family: 'Outfit', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 14px;
            padding: 90px 24px;
            background: linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%);
            border: 1px dashed rgba(30,90,220,0.2);
            border-radius: 24px;
            color: #6b82aa;
            font-size: 14px;
          }

          .tg-empty-icon {
            font-size: 56px;
            opacity: 0.65;
          }
        `}</style>

        <div className="tg-empty">
          <span className="tg-empty-icon">🚧</span>
          No tiles configured for this module yet.
        </div>
      </>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

        /* GRID */
        .tg-grid {
          display: grid;

          grid-template-columns:
            repeat(auto-fill, minmax(240px, 1fr));

          gap: 18px;

          font-family: 'Outfit', sans-serif;
        }

        /* CARD */
        .tg-card {
          position: relative;

          min-height: 180px;

          border-radius: 20px;

          padding: 28px 22px 22px;

          display: flex;
          flex-direction: column;
          justify-content: space-between;

          gap: 20px;

          cursor: pointer;
          overflow: hidden;

          border: 1px solid rgba(30, 90, 220, 0.10);

          background: #ffffff;

          box-shadow:
            0 3px 10px rgba(10, 40, 100, 0.05);

          transition:
            transform 0.22s cubic-bezier(0.34,1.56,0.64,1),
            box-shadow 0.22s ease,
            border-color 0.22s ease;

          animation:
            tg-rise 0.38s cubic-bezier(0.22,1,0.36,1) both;
        }

        @keyframes tg-rise {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.97);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* TOP ACCENT */
        .tg-card::before {
          content: '';

          position: absolute;

          top: 0;
          left: 0;

          width: 50px;
          height: 4px;

          border-radius: 0 0 4px 0;

          background:
            linear-gradient(
              90deg,
              #1e5adc,
              #38c6ff
            );

          transform: scaleX(0);

          transform-origin: left;

          transition:
            transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }

        /* RADIAL GLOW */
        .tg-card::after {
          content: '';

          position: absolute;
          inset: 0;

          background:
            radial-gradient(
              circle at 30% 30%,
              rgba(30,90,220,0.06),
              transparent 65%
            );

          opacity: 0;

          transition: opacity 0.25s ease;

          pointer-events: none;

          border-radius: inherit;
        }

        .tg-card:hover {
          transform: translateY(-5px) scale(1.02);

          box-shadow:
            0 0 0 1px rgba(30,90,220,0.18),
            0 10px 30px rgba(10,40,120,0.12),
            0 3px 10px rgba(30,90,220,0.08);

          border-color: rgba(30,90,220,0.22);
        }

        .tg-card:hover::before {
          transform: scaleX(1);
        }

        .tg-card:hover::after {
          opacity: 1;
        }

        .tg-card:active {
          transform: translateY(-1px) scale(1.01);
        }

        /* ICON WRAPPER */
        .tg-icon-wrap {
          position: relative;

          width: 58px;
          height: 58px;

          border-radius: 16px;

          background:
            linear-gradient(
              135deg,
              #eef3ff 0%,
              #ddeaff 100%
            );

          display: flex;
          align-items: center;
          justify-content: center;

          color: #1e5adc;

          flex-shrink: 0;

          transition:
            background 0.22s,
            box-shadow 0.22s,
            transform 0.22s cubic-bezier(0.34,1.56,0.64,1);

          box-shadow:
            0 1px 4px rgba(30,90,220,0.1);
        }

        .tg-card:hover .tg-icon-wrap {
          background:
            linear-gradient(
              135deg,
              #1e5adc 0%,
              #38c6ff 100%
            );

          color: #fff;

          box-shadow:
            0 4px 18px rgba(30,90,220,0.35),
            0 0 0 4px rgba(30,90,220,0.08);

          transform: rotate(-4deg) scale(1.08);
        }

        /* INDEX BADGE */
        .tg-index {
          position: absolute;

          top: -6px;
          right: -6px;

          width: 18px;
          height: 18px;

          border-radius: 50%;

          background: #03122b;

          color: rgba(140,175,255,0.9);

          font-size: 9px;
          font-weight: 700;

          display: flex;
          align-items: center;
          justify-content: center;

          border: 1.5px solid white;

          opacity: 0;

          transform: scale(0.5);

          transition:
            opacity 0.2s,
            transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }

        .tg-card:hover .tg-index {
          opacity: 1;
          transform: scale(1);
        }

        /* TEXT */
        .tg-label {
          font-size: 15px;
          font-weight: 700;
          color: #0e1f40;
          line-height: 1.35;
          letter-spacing: 0.01em;

          transition: color 0.2s;
        }

        .tg-card:hover .tg-label {
          color: #1e5adc;
        }

        .tg-sub {
          font-size: 12px;
          color: #8a9ab5;
          margin-top: 6px;
          font-weight: 500;
          line-height: 1.5;
        }

        /* ARROW */
        .tg-arrow {
          position: absolute;

          bottom: 16px;
          right: 16px;

          width: 28px;
          height: 28px;

          border-radius: 9px;

          background: rgba(30,90,220,0.08);

          display: flex;
          align-items: center;
          justify-content: center;

          color: #1e5adc;

          opacity: 0;

          transform: translate(4px, 4px);

          transition:
            opacity 0.2s,
            transform 0.22s cubic-bezier(0.34,1.56,0.64,1);
        }

        .tg-card:hover .tg-arrow {
          opacity: 1;
          transform: translate(0, 0);
        }

        /* SHIMMER */
        .tg-shimmer {
          position: absolute;

          bottom: 0;
          left: 0;
          right: 0;

          height: 3px;

          background:
            linear-gradient(
              90deg,
              #1e5adc,
              #38c6ff,
              #1e5adc
            );

          background-size: 200% 100%;

          border-radius: 0 0 20px 20px;

          opacity: 0;

          animation: tg-shimmer-move 2s linear infinite;

          transition: opacity 0.25s;
        }

        @keyframes tg-shimmer-move {
          0% {
            background-position: 0% 0%;
          }

          100% {
            background-position: 200% 0%;
          }
        }

        .tg-card:hover .tg-shimmer {
          opacity: 1;
        }

        @media (max-width: 768px) {
          .tg-grid {
            grid-template-columns:
              repeat(auto-fill, minmax(190px, 1fr));
          }

          .tg-card {
            min-height: 165px;
            padding: 22px 18px;
          }

          .tg-label {
            font-size: 14px;
          }
        }
      `}</style>

      <div className="tg-grid">
        {tiles.map((tile, i) => {
          const Icon = ICONS[tile.icon] || ICONS.default

          return (
            <div
              key={tile.id}
              onClick={() => navigate(tile.path)}
              className="tg-card"
              style={{
                animationDelay: `${i * 0.05}s`,
              }}
            >
              {/* ICON */}
              <div className="tg-icon-wrap">
                <Icon size={24} strokeWidth={1.9} />
                <span className="tg-index">
                  {i + 1}
                </span>
              </div>

              {/* TEXT */}
              <div style={{ paddingRight: '30px' }}>
                <div className="tg-label">
                  {tile.label}
                </div>

                {tile.sub && (
                  <div className="tg-sub">
                    {tile.sub}
                  </div>
                )}
              </div>

              {/* ARROW */}
              <div className="tg-arrow">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7 17L17 7M17 7H7M17 7v10"/>
                </svg>
              </div>

              {/* SHIMMER */}
              <div className="tg-shimmer" />
            </div>
          )
        })}
      </div>
    </>
  )
}