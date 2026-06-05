import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_USERS, saveUser } from '../lib/auth';

const HINTS = [
  { role: 'partner', email: 'arbeel.admin@daikin.com', password: 'admin123', icon: '🛡️', desc: 'Full access' },
  { role: 'employee',  email: 'arbeel.user@daikin.com',  password: 'user123',  icon: '👤', desc: 'Limited access' },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700;800;900&family=Geist+Mono:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .lp-root {
    min-height: 100vh;
    display: flex;
    background: #f0f4fa;
    font-family: 'Geist', sans-serif;
    overflow: hidden;
    position: relative;
  }

  /* ── animated bg ── */
  .lp-bg {
    position: fixed;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
  }
  .lp-bg-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.18;
    animation: orbFloat 12s ease-in-out infinite;
  }
  .lp-bg-orb:nth-child(1) { width: 600px; height: 600px; background: #0b3d91; top: -200px; left: -200px; animation-delay: 0s; }
  .lp-bg-orb:nth-child(2) { width: 400px; height: 400px; background: #1e5dd6; bottom: -100px; right: 300px; animation-delay: -4s; }
  .lp-bg-orb:nth-child(3) { width: 300px; height: 300px; background: #0b3d91; top: 40%; right: -100px; animation-delay: -8s; }

  @keyframes orbFloat {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33%       { transform: translate(30px, -40px) scale(1.05); }
    66%       { transform: translate(-20px, 20px) scale(0.97); }
  }

  /* ── grid overlay ── */
  .lp-grid {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background-image:
      linear-gradient(rgba(11,61,145,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(11,61,145,0.06) 1px, transparent 1px);
    background-size: 48px 48px;
  }

  /* ── LEFT PANEL ── */
  .lp-left {
    position: relative;
    z-index: 1;
    flex: 1;
    background: linear-gradient(145deg, #0b3d91 0%, #07296b 50%, #041d52 100%);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 3rem 3.5rem;
    overflow: hidden;
    min-height: 100vh;
  }

  /* inner grid on left */
  .lp-left::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }

  /* diagonal slash accent */
  .lp-left::after {
    content: '';
    position: absolute;
    top: -120px; right: -120px;
    width: 400px; height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(30,93,214,0.35) 0%, transparent 70%);
    pointer-events: none;
  }

  .lp-left-glow {
    position: absolute;
    bottom: -180px; left: -180px;
    width: 500px; height: 500px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(11,61,145,0.5) 0%, transparent 65%);
    pointer-events: none;
  }

  .lp-logo-wrap {
    position: relative;
    display: flex;
    align-items: center;
    gap: 18px;
    transform: scale(1.15);
    transform-origin: left center;
    text-decoration: none;
  }

  .lp-logo-img {
    height: 80px;
    width: auto;
    object-fit: contain;
    filter: brightness(0) invert(1);
    opacity: 0.95;
  }

  .lp-logo-sep {
    width: 1px; height: 32px;
    background: rgba(255,255,255,0.2);
  }

  .lp-logo-text {
    display: flex;
    flex-direction: column;
  }

  .lp-logo-name {
    font-size: 15px;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.04em;
    line-height: 1;
  }

  .lp-logo-sub {
    font-family: 'Geist Mono', monospace;
    font-size: 9px;
    font-weight: 500;
    color: rgba(255,255,255,0.45);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin-top: 3px;
  }

  .lp-hero {
    position: relative;
  }

  .lp-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.14);
    border-radius: 100px;
    padding: 5px 14px 5px 8px;
    margin-bottom: 2rem;
  }

  .lp-eyebrow-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #5eb3f7;
    box-shadow: 0 0 8px #5eb3f7;
    animation: pulse 2.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.6; transform: scale(0.85); }
  }

  .lp-eyebrow-txt {
    font-family: 'Geist Mono', monospace;
    font-size: 9.5px;
    font-weight: 500;
    color: rgba(255,255,255,0.65);
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .lp-headline {
    font-family: 'Instrument Serif', serif;
    font-size: clamp(2.6rem, 4vw, 3.8rem);
    font-weight: 400;
    line-height: 1.08;
    color: #fff;
    margin-bottom: 1.5rem;
    letter-spacing: -0.5px;
  }

  .lp-headline em {
    font-style: italic;
    background: linear-gradient(90deg, #7ec8f7, #a5d8ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .lp-desc {
    font-size: 14px;
    color: rgba(255,255,255,0.5);
    line-height: 1.75;
    max-width: 380px;
    margin-bottom: 2.5rem;
  }

  .lp-features {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .lp-feat {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .lp-feat-icon {
    width: 32px; height: 32px;
    border-radius: 8px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    color: #7ec8f7;
  }

  .lp-feat-label {
    font-size: 12.5px;
    color: rgba(255,255,255,0.55);
    letter-spacing: 0.01em;
  }

  .lp-bottom {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .lp-stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .lp-stat-num {
    font-family: 'Geist Mono', monospace;
    font-size: 18px;
    font-weight: 600;
    color: #fff;
    letter-spacing: -0.5px;
  }

  .lp-stat-label {
    font-size: 10px;
    color: rgba(255,255,255,0.35);
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  .lp-stat-sep {
    width: 1px; height: 32px;
    background: rgba(255,255,255,0.12);
    margin: 0 6px;
  }

  /* ── RIGHT PANEL ── */
  .lp-right {
    position: relative;
    z-index: 1;
    width: 500px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2.5rem;
    background: rgba(240,244,250,0.7);
    backdrop-filter: blur(20px);
  }

  .lp-card {
    width: 100%;
    max-width: 400px;
    background: #fff;
    border-radius: 20px;
    border: 1px solid rgba(11,61,145,0.1);
    box-shadow:
      0 1px 0 rgba(255,255,255,0.8) inset,
      0 24px 64px -12px rgba(11,61,145,0.18),
      0 8px 24px rgba(11,61,145,0.08);
    overflow: hidden;
  }

  /* card top accent bar */
  .lp-card-bar {
    height: 4px;
    background: linear-gradient(90deg, #0b3d91, #1e5dd6, #5eb3f7);
  }

  .lp-card-body {
    padding: 2rem 2rem 2.25rem;
  }

  .lp-card-header {
    margin-bottom: 1.75rem;
  }

  .lp-card-tag {
    font-family: 'Geist Mono', monospace;
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #0b3d91;
    background: rgba(11,61,145,0.07);
    border: 1px solid rgba(11,61,145,0.15);
    border-radius: 100px;
    padding: 3px 10px;
    display: inline-block;
    margin-bottom: 10px;
  }

  .lp-card-title {
    font-family: 'Instrument Serif', serif;
    font-size: 1.9rem;
    font-weight: 400;
    color: #0f172a;
    line-height: 1.15;
    letter-spacing: -0.3px;
  }

  .lp-card-title em {
    font-style: italic;
    color: #0b3d91;
  }

  .lp-card-sub {
    font-size: 12.5px;
    color: #94a3b8;
    margin-top: 6px;
    line-height: 1.5;
  }

  /* role cards */
  .lp-roles {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 1.5rem;
  }

  .lp-role-btn {
    padding: 14px 12px;
    border-radius: 12px;
    cursor: pointer;
    text-align: center;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
  }

  .lp-role-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(11,61,145,0.05), transparent);
    opacity: 0;
    transition: opacity 0.2s;
  }

  .lp-role-btn:hover::before { opacity: 1; }

  .lp-role-icon {
    font-size: 1.5rem;
    margin-bottom: 5px;
    display: block;
  }

  .lp-role-name {
    font-size: 11.5px;
    font-weight: 700;
    text-transform: capitalize;
    display: block;
    margin-bottom: 2px;
  }

  .lp-role-desc {
    font-family: 'Geist Mono', monospace;
    font-size: 9px;
    color: #94a3b8;
    letter-spacing: 0.05em;
    display: block;
  }

  /* inputs */
  .lp-field { margin-bottom: 12px; }

  .lp-label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: #475569;
    margin-bottom: 5px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .lp-input {
    width: 100%;
    padding: 11px 14px;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    font-family: 'Geist', sans-serif;
    font-size: 13.5px;
    color: #0f172a;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    background: #fafbfc;
  }

  .lp-input::placeholder { color: #cbd5e1; }

  .lp-input:focus {
    border-color: #0b3d91;
    background: #fff;
    box-shadow: 0 0 0 4px rgba(11,61,145,0.1);
  }

  .lp-error {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fdecea;
    border: 1px solid #f5c6c6;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 12px;
    color: #c0392b;
    margin-bottom: 12px;
  }

  .lp-btn {
    width: 100%;
    padding: 13px;
    border: none;
    border-radius: 12px;
    font-family: 'Geist', sans-serif;
    font-size: 13.5px;
    font-weight: 700;
    letter-spacing: 0.04em;
    cursor: pointer;
    transition: all 0.25s ease;
    position: relative;
    overflow: hidden;
  }

  .lp-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent);
  }

  .lp-btn:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(11,61,145,0.35);
  }

  .lp-btn:not(:disabled):active {
    transform: translateY(0);
  }

  .lp-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 18px;
  }

  .lp-divider-line {
    flex: 1;
    height: 1px;
    background: #e2e8f0;
  }

  .lp-divider-txt {
    font-family: 'Geist Mono', monospace;
    font-size: 9px;
    color: #cbd5e1;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  @media (max-width: 900px) {
    .lp-left { display: none; }
    .lp-right { width: 100%; }
  }
`;

export default function LoginPage() {
    const navigate = useNavigate();
    const [selected, setSelected] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const pickRole = (h) => { setSelected(h.role); setEmail(h.email); setPassword(h.password); setError(''); };

    const handleLogin = async () => {
        if (!selected) { setError('Select a role first.'); return; }
        setLoading(true);
        await new Promise(r => setTimeout(r, 700));
        const record = MOCK_USERS[email.toLowerCase()];
        if (!record || record.password !== password) { setError('Invalid credentials.'); setLoading(false); return; }
        if (record.user.role !== selected) { setError('Role mismatch — pick correct role.'); setLoading(false); return; }
        saveUser(record.user);
        navigate('/landing');
    };

    return (
        <>
            <style>{CSS}</style>
            <div className="lp-root">

                {/* Animated bg */}
                <div className="lp-bg">
                    <div className="lp-bg-orb" />
                    <div className="lp-bg-orb" />
                    <div className="lp-bg-orb" />
                </div>
                <div className="lp-grid" />

                {/* ── LEFT ── */}
                <div className="lp-left">
                    <div className="lp-left-glow" />

                    {/* Logo */}
                    <div className="lp-logo-wrap">
                        <img
                            src="/daikin.png"
                            alt="FIEM"
                            className="lp-logo-img"
                            onError={(e) => {
                                e.target.style.display = "none";
                            }}
                        />
                        <div className="lp-logo-sep" />
                        <div className="lp-logo-text">
                            <span className="lp-logo-name">FIEM Industries</span>
                            <span className="lp-logo-sub">Supply Chain Portal</span>
                        </div>
                    </div>

                    {/* Hero */}
                    <div className="lp-hero">
                        <div className="lp-eyebrow">
                            <span className="lp-eyebrow-dot" />
                            <span className="lp-eyebrow-txt">Supplier Portal · v2.0</span>
                        </div>

                        <h2 className="lp-headline">
                            Procurement,<br />
                            logistics &<br />
                            <em>all in one place.</em>
                        </h2>

                        <p className="lp-desc">
                            Manage purchase orders, advance shipments, goods receipt, and real-time reports — built for Daikin's supply chain.
                        </p>

                        <div className="lp-features">
                            {[
                                { label: 'Purchase Order Management', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg> },
                                { label: 'ASN & Shipment Tracking', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg> },
                                { label: 'Reports & Analytics', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg> },
                                { label: 'Role-Based Access Control', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> },
                            ].map(f => (
                                <div className="lp-feat" key={f.label}>
                                    <div className="lp-feat-icon">{f.icon}</div>
                                    <span className="lp-feat-label">{f.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="lp-bottom">
                        {[
                            { num: '99.9%', label: 'Uptime' },
                            { num: '2ms', label: 'Avg Response' },
                            { num: '256-bit', label: 'Encryption' },
                        ].map((s, i) => (
                            <>
                                {i > 0 && <div className="lp-stat-sep" key={'sep' + i} />}
                                <div className="lp-stat" key={s.label}>
                                    <span className="lp-stat-num">{s.num}</span>
                                    <span className="lp-stat-label">{s.label}</span>
                                </div>
                            </>
                        ))}
                    </div>
                </div>

                {/* ── RIGHT ── */}
                <div className="lp-right">
                    <div className="lp-card">
                        <div className="lp-card-bar" />
                        <div className="lp-card-body">

                            <div className="lp-card-header">
                                <span className="lp-card-tag">Secure Access</span>
                                <h1 className="lp-card-title">Welcome<br /><em>back.</em></h1>
                                <p className="lp-card-sub">Select your role, then sign in to continue.</p>
                            </div>

                            {/* Role selector */}
                            <div className="lp-roles">
                                {HINTS.map(h => (
                                    <button
                                        key={h.role}
                                        className="lp-role-btn"
                                        onClick={() => pickRole(h)}
                                        style={{
                                            border: selected === h.role ? '2px solid #0b3d91' : '1.5px solid #e2e8f0',
                                            background: selected === h.role ? 'rgba(11,61,145,0.06)' : '#fafbfc',
                                        }}
                                    >
                                        <span className="lp-role-icon">{h.icon}</span>
                                        <span className="lp-role-name" style={{ color: selected === h.role ? '#0b3d91' : '#1e293b' }}>{h.role}</span>
                                        <span className="lp-role-desc">{h.desc}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Email */}
                            <div className="lp-field">
                                <label className="lp-label">Email</label>
                                <input
                                    className="lp-input"
                                    type="email"
                                    placeholder="you@fiem.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>

                            {/* Password */}
                            <div className="lp-field" style={{ marginBottom: '16px' }}>
                                <label className="lp-label">Password</label>
                                <input
                                    className="lp-input"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="lp-error">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                className="lp-btn"
                                onClick={handleLogin}
                                disabled={loading}
                                style={{
                                    background: loading ? '#aac4e0' : 'linear-gradient(135deg, #0b3d91, #1e5dd6)',
                                    color: '#fff',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {loading ? 'Authenticating…' : 'Access Portal →'}
                            </button>

                            <div className="lp-divider">
                                <div className="lp-divider-line" />
                                <span className="lp-divider-txt">credentials auto-fill on role select</span>
                                <div className="lp-divider-line" />
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}