import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getUser, canAccess } from '../lib/auth';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700;800;900&family=Geist+Mono:wght@400;500;600&display=swap');

  .denied-root {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f0f4fa;
    font-family: 'Geist', sans-serif;
    position: relative;
    overflow: hidden;
  }

  .denied-grid {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(rgba(11,61,145,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(11,61,145,0.05) 1px, transparent 1px);
    background-size: 48px 48px;
  }

  .denied-orb-1 {
    position: absolute;
    width: 500px; height: 500px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(11,61,145,0.08) 0%, transparent 70%);
    top: -150px; left: -150px;
    pointer-events: none;
  }

  .denied-orb-2 {
    position: absolute;
    width: 350px; height: 350px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(231,76,60,0.06) 0%, transparent 70%);
    bottom: -100px; right: -100px;
    pointer-events: none;
  }

  .denied-card {
    position: relative;
    z-index: 1;
    background: #fff;
    border-radius: 24px;
    border: 1px solid rgba(11,61,145,0.1);
    box-shadow:
      0 1px 0 rgba(255,255,255,0.9) inset,
      0 24px 64px -12px rgba(11,61,145,0.16),
      0 8px 24px rgba(11,61,145,0.07);
    overflow: hidden;
    width: 100%;
    max-width: 520px;
    margin: 2rem;
    text-align: center;
  }

  .denied-top-bar {
    height: 4px;
    background: linear-gradient(90deg, #e74c3c, #c0392b, #e74c3c);
    background-size: 200% 100%;
    animation: shimmer 3s ease-in-out infinite;
  }

  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .denied-body {
    padding: 3rem 3rem 2.75rem;
  }

  .denied-icon-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 80px; height: 80px;
    border-radius: 20px;
    background: linear-gradient(135deg, rgba(231,76,60,0.1), rgba(192,57,43,0.06));
    border: 1.5px solid rgba(231,76,60,0.2);
    margin-bottom: 1.75rem;
  }

  .denied-icon-wrap::before {
    content: '';
    position: absolute;
    inset: -6px;
    border-radius: 26px;
    border: 1px solid rgba(231,76,60,0.1);
  }

  .denied-icon-wrap::after {
    content: '';
    position: absolute;
    inset: -12px;
    border-radius: 32px;
    border: 1px solid rgba(231,76,60,0.06);
  }

  .denied-code {
    font-family: 'Geist Mono', monospace;
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #e74c3c;
    background: rgba(231,76,60,0.07);
    border: 1px solid rgba(231,76,60,0.18);
    border-radius: 100px;
    padding: 4px 14px;
    display: inline-block;
    margin-bottom: 1rem;
  }

  .denied-headline {
    font-family: 'Instrument Serif', serif;
    font-size: 2.4rem;
    font-weight: 400;
    color: #0f172a;
    line-height: 1.1;
    letter-spacing: -0.3px;
    margin-bottom: 1rem;
  }

  .denied-headline em {
    font-style: italic;
    color: #0b3d91;
  }

  .denied-desc {
    font-size: 13.5px;
    color: #64748b;
    line-height: 1.7;
    max-width: 360px;
    margin: 0 auto 0.75rem;
  }

  .denied-path {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #f4f6fa;
    border: 1px solid rgba(11,61,145,0.12);
    border-radius: 8px;
    padding: 6px 14px;
    font-family: 'Geist Mono', monospace;
    font-size: 11px;
    color: #0b3d91;
    margin-bottom: 2rem;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .denied-divider {
    width: 40px; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(11,61,145,0.2), transparent);
    margin: 0 auto 2rem;
  }

  .denied-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .denied-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 22px;
    background: linear-gradient(135deg, #0b3d91, #1e5dd6);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-family: 'Geist', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    box-shadow: 0 4px 14px rgba(11,61,145,0.3);
  }

  .denied-btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(11,61,145,0.35);
  }

  .denied-btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 22px;
    background: transparent;
    color: #475569;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    font-family: 'Geist', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
  }

  .denied-btn-secondary:hover {
    background: #f4f6fa;
    border-color: rgba(11,61,145,0.2);
    color: #0b3d91;
  }

  .denied-footer {
    padding: 14px 3rem;
    background: #f8fafc;
    border-top: 1px solid rgba(11,61,145,0.07);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .denied-footer-role {
    font-family: 'Geist Mono', monospace;
    font-size: 9.5px;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    background: #0b3d91;
    color: #fff;
    padding: 3px 9px;
    border-radius: 5px;
  }

  .denied-footer-txt {
    font-size: 11.5px;
    color: #94a3b8;
  }
`;

function AccessDenied({ user, pathname }) {
  const navigate = useNavigate();

  return (
    <>
      <style>{CSS}</style>
      <div className="denied-root">
        <div className="denied-grid" />
        <div className="denied-orb-1" />
        <div className="denied-orb-2" />

        <div className="denied-card">
          <div className="denied-top-bar" />

          <div className="denied-body">
            {/* Icon */}
            <div className="denied-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                <line x1="12" y1="15" x2="12" y2="17"/>
              </svg>
            </div>

            <span className="denied-code">403 · Access Restricted</span>

            <h1 className="denied-headline">
              You shall<br /><em>not pass.</em>
            </h1>

            <p className="denied-desc">
              Your current role doesn't have permission to view this page. Contact your platform admin to request access.
            </p>

            <div className="denied-path">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              {pathname}
            </div>

            <div className="denied-divider" />

            <div className="denied-actions">
              <button className="denied-btn-primary" onClick={() => navigate(-1)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Go Back
              </button>
              <button className="denied-btn-secondary" onClick={() => navigate('/landing')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                Home
              </button>
            </div>
          </div>

          <div className="denied-footer">
            <span className="denied-footer-role">{user?.role ?? 'unknown'}</span>
            <span className="denied-footer-txt">does not have access to this resource</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ProtectedRoute({ children }) {
  const user     = getUser();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;
  // if (!user) {
  // localStorage.setItem(
  //   "user",
  //   JSON.stringify({
  //     name: "Developer",
  //     email: "dev@local.com",
  //     role: "partner"
  //   })
  // );

  return children;
// }

  if (!canAccess(user.role, location.pathname)) {
    return <AccessDenied user={user} pathname={location.pathname} />;
  }

  return children;
}