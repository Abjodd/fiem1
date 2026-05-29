import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { NAV_MODULES } from '../router/index';
import { ArrowRight, Bell, Search, Menu, Sun, Moon } from 'lucide-react';

export default function DaikinPortal() {
    const userName = "Chethan";
    const [greeting, setGreeting]  = useState("Good Morning");
    const [time, setTime] = useState(new Date());
    const [scrolled, setScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isDark, setIsDark] = useState(false);
    const heroRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        setMounted(true);
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good Morning");
        else if (hour < 17) setGreeting("Good Afternoon");
        else if (hour < 20) setGreeting("Good Evening");
        else setGreeting("Good Night");

        const interval = setInterval(() => setTime(new Date()), 1000);
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);

        return () => {
            clearInterval(interval);
            window.removeEventListener('scroll', onScroll);
        };
    }, []);

    const handleMouseMove = (e) => {
        if (!heroRef.current) return;
        const rect = heroRef.current.getBoundingClientRect();
        setMousePos({
            x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
            y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
        });
    };

    const modules = NAV_MODULES;

    // ── theme tokens ──────────────────────────────────────────
    const t = isDark ? {
        // DARK
        pageBg:         '#05080d',
        pageText:       'white',
        navScrolledBg:  'rgba(5,8,13,0.85)',
        navScrolledBorder: 'rgba(255,255,255,0.05)',
        navScrolledShadow: '',
        logoSub:        'rgba(255,255,255,0.3)',
        logoSubBorder:  'rgba(255,255,255,0.1)',
        navActive:      'white',
        navActiveLine:  '#00A2E8',
        navInactive:    'rgba(255,255,255,0.55)',
        iconColor:      'rgba(255,255,255,0.5)',
        iconHover:      'white',
        bellColor:      'rgba(255,255,255,0.7)',
        bellDot:        '#00A2E8',
        avatarFrom:     '#00A2E8',
        avatarTo:       '#0066a8',
        avatarText:     'white',
        userRole:       'rgba(255,255,255,0.5)',
        userName:       'white',
        menuBtn:        'white',
        toggleBg:       'rgba(255,255,255,0.08)',
        toggleBorder:   'rgba(255,255,255,0.12)',
        toggleColor:    'rgba(255,255,255,0.7)',
        toggleHoverBg:  'rgba(255,255,255,0.14)',
        gridLine:       'rgba(0,162,232,0.06)',
        radialSpot:     'rgba(0,162,232,0.25)',
        floatBlob:      'rgba(0,162,232,0.10)',
        scanLine:       'rgba(0,162,232,0.8)',
        badgeBorder:    'rgba(255,255,255,0.1)',
        badgeBg:        'rgba(255,255,255,0.03)',
        badgeText:      'rgba(255,255,255,0.7)',
        badgeDot:       '#00A2E8',
        h1Main:         'rgba(255,255,255,0.95)',
        shimmerA:       '#ffffff',
        shimmerB:       '#00A2E8',
        shimmerC:       '#ffffff',
        subText:        'rgba(255,255,255,0.55)',
        subHighlight:   'rgba(255,255,255,0.8)',
        btnBg:          '#00A2E8',
        btnText:        '#05080d',
        btnHoverBg:     'white',
        btnShadow:      'rgba(0,162,232,0.4)',
        btnHoverShadow: 'rgba(0,162,232,0.6)',
        ringA:          'rgba(0,162,232,0.20)',
        ringB:          'rgba(0,162,232,0.30)',
        ringC:          'rgba(0,162,232,0.40)',
        ringD:          'rgba(0,162,232,0.50)',
        gradStop1:      '#00A2E8',
        gradStop2:      '#00A2E8',
        gradStop3:      '#00A2E8',
        outerDot:       '#00A2E8',
        innerStroke:    '#00A2E8',
        innerDot1:      '#00A2E8',
        innerDot2:      '#00A2E8',
        logoGlow:       'rgba(0,162,232,1)',
        logoGlowOp:     '0.30',
        logoDropShadow: 'rgba(0,162,232,0.5)',
        orbitDot:       '#00A2E8',
        sideLabel:      'rgba(255,255,255,0.3)',
        scrollText:     'rgba(255,255,255,0.4)',
        scrollLine:     '#00A2E8',
        sectionBorder:  'rgba(255,255,255,0.05)',
        sectionGridOp:  '1',
        modLabel:       '#00A2E8',
        modH2:          'white',
        modDesc:        'rgba(255,255,255,0.55)',
        gridGap:        'rgba(255,255,255,0.05)',
        gridBorder:     'rgba(255,255,255,0.05)',
        cardBg:         '#05080d',
        iconBoxBg:      'rgba(255,255,255,0.04)',
        iconBoxBorder:  'rgba(255,255,255,0.10)',
        iconDot:        '#00A2E8',
        cardNum:        'rgba(255,255,255,0.3)',
        cardCode:       '#00A2E8',
        cardTitle:      'white',
        cardSub:        'rgba(255,255,255,0.5)',
        cardFooter:     'rgba(255,255,255,0.7)',
        cardArrow:      'rgba(255,255,255,0.7)',
        cardHoverCorner:'rgba(0,162,232,0.20)',
        footerBorder:   'rgba(255,255,255,0.05)',
        footerBg:       'transparent',
        footerPoly1:    '#1a1a1a',
        footerPoly2:    '#00A2E8',
        footerText:     'rgba(255,255,255,0.6)',
        footerLinks:    'rgba(255,255,255,0.5)',
        footerLinksHov: 'white',
        footerMono:     'rgba(255,255,255,0.3)',
        moduleCardHoverBg:   'rgba(0,162,232,0.04)',
        moduleCardHoverBorder:'rgba(0,162,232,0.5)',
        moduleCardHoverArrow: '#00A2E8',
        moduleIconHoverBg:    'rgba(0,162,232,0.15)',
        moduleIconHoverBorder:'rgba(0,162,232,0.4)',
    } : {
        // LIGHT
        pageBg:         '#e9edf3',
        pageText:       '#0f172a',
        navScrolledBg:  'rgba(255,255,255,0.90)',
        navScrolledBorder: 'rgba(11,61,145,0.10)',
        navScrolledShadow: '0 1px 8px rgba(11,61,145,0.06)',
        logoSub:        '#64748b',
        logoSubBorder:  'rgba(11,61,145,0.15)',
        navActive:      '#0b3d91',
        navActiveLine:  '#0b3d91',
        navInactive:    '#64748b',
        iconColor:      '#64748b',
        iconHover:      '#0b3d91',
        bellColor:      '#64748b',
        bellDot:        '#0b3d91',
        avatarFrom:     '#0b3d91',
        avatarTo:       '#1e5dd6',
        avatarText:     'white',
        userRole:       '#64748b',
        userName:       '#0f172a',
        menuBtn:        '#0f172a',
        toggleBg:       'rgba(11,61,145,0.06)',
        toggleBorder:   'rgba(11,61,145,0.15)',
        toggleColor:    '#64748b',
        toggleHoverBg:  'rgba(11,61,145,0.12)',
        gridLine:       'rgba(11,61,145,0.07)',
        radialSpot:     'rgba(11,61,145,0.12)',
        floatBlob:      'rgba(11,61,145,0.08)',
        scanLine:       'rgba(11,61,145,0.3)',
        badgeBorder:    'rgba(11,61,145,0.15)',
        badgeBg:        'rgba(255,255,255,0.60)',
        badgeText:      '#334155',
        badgeDot:       '#0b3d91',
        h1Main:         '#0f172a',
        shimmerA:       '#07296b',
        shimmerB:       '#1e5dd6',
        shimmerC:       '#07296b',
        subText:        '#64748b',
        subHighlight:   '#334155',
        btnBg:          '#0b3d91',
        btnText:        'white',
        btnHoverBg:     '#07296b',
        btnShadow:      'rgba(11,61,145,0.3)',
        btnHoverShadow: 'rgba(11,61,145,0.4)',
        ringA:          'rgba(11,61,145,0.15)',
        ringB:          'rgba(11,61,145,0.20)',
        ringC:          'rgba(11,61,145,0.28)',
        ringD:          'rgba(11,61,145,0.35)',
        gradStop1:      '#0b3d91',
        gradStop2:      '#0b3d91',
        gradStop3:      '#1e5dd6',
        outerDot:       '#0b3d91',
        innerStroke:    '#0b3d91',
        innerDot1:      '#0b3d91',
        innerDot2:      '#1e5dd6',
        logoGlow:       'rgba(11,61,145,0.2)',
        logoGlowOp:     '1',
        logoDropShadow: 'rgba(11,61,145,0.18)',
        orbitDot:       '#0b3d91',
        sideLabel:      '#94a3b8',
        scrollText:     '#94a3b8',
        scrollLine:     '#0b3d91',
        sectionBorder:  'rgba(11,61,145,0.08)',
        sectionGridOp:  '0.4',
        modLabel:       '#0b3d91',
        modH2:          '#0f172a',
        modDesc:        '#64748b',
        gridGap:        'rgba(11,61,145,0.08)',
        gridBorder:     'rgba(11,61,145,0.10)',
        cardBg:         'white',
        iconBoxBg:      '#e9edf3',
        iconBoxBorder:  'rgba(11,61,145,0.10)',
        iconDot:        '#0b3d91',
        cardNum:        '#94a3b8',
        cardCode:       '#0b3d91',
        cardTitle:      '#0f172a',
        cardSub:        '#64748b',
        cardFooter:     '#334155',
        cardArrow:      '#94a3b8',
        cardHoverCorner:'rgba(11,61,145,0.06)',
        footerBorder:   'rgba(11,61,145,0.10)',
        footerBg:       'white',
        footerPoly1:    '#dee3ec',
        footerPoly2:    '#0b3d91',
        footerText:     '#64748b',
        footerLinks:    '#94a3b8',
        footerLinksHov: '#0b3d91',
        footerMono:     '#94a3b8',
        moduleCardHoverBg:    'rgba(11,61,145,0.03)',
        moduleCardHoverBorder:'rgba(11,61,145,0.35)',
        moduleCardHoverArrow: '#0b3d91',
        moduleIconHoverBg:    'rgba(11,61,145,0.10)',
        moduleIconHoverBorder:'rgba(11,61,145,0.30)',
    };

    return (
        <div className="min-h-screen font-sans antialiased overflow-x-hidden"
            style={{ background: t.pageBg, color: t.pageText }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');

        * { font-family: 'Geist', -apple-system, sans-serif; }
        .font-serif { font-family: 'Instrument Serif', serif; font-weight: 400; }
        .font-mono { font-family: 'Geist Mono', monospace; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideRight {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes gridMove {
          from { background-position: 0 0; }
          to { background-position: 60px 60px; }
        }
        @keyframes scan {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: ${isDark ? '0.6' : '0.3'}; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .anim-fade-up { animation: fadeUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .anim-fade-in { animation: fadeIn 1.2s ease both; }
        .anim-float { animation: float 6s ease-in-out infinite; }
        .anim-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .anim-blink { animation: blink 2s ease-in-out infinite; }

        .grid-bg {
          background-image:
            linear-gradient(${t.gridLine} 1px, transparent 1px),
            linear-gradient(90deg, ${t.gridLine} 1px, transparent 1px);
          background-size: 60px 60px;
          animation: gridMove 20s linear infinite;
        }

        .radial-spot {
          background: radial-gradient(circle at center, ${t.radialSpot}, transparent 60%);
        }

        .btn-shine {
          position: relative;
          overflow: hidden;
        }
        .btn-shine::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,${isDark ? '0.3' : '0.4'}), transparent);
          transition: none;
        }
        .btn-shine:hover::after {
          animation: slideRight 0.8s ease;
        }

        .module-card {
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .module-card:hover {
          transform: translateY(-4px);
          border-color: ${t.moduleCardHoverBorder};
          background: ${t.moduleCardHoverBg};
          ${!isDark ? 'box-shadow: 0 14px 32px -10px rgba(11,61,145,0.15);' : ''}
        }
        .module-card:hover .module-arrow {
          transform: translateX(4px);
          color: ${t.moduleCardHoverArrow};
        }
        .module-card:hover .module-icon {
          background: ${t.moduleIconHoverBg};
          border-color: ${t.moduleIconHoverBorder};
        }

        .scan-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, ${t.scanLine}, transparent);
          animation: scan ${isDark ? '6s' : '8s'} linear infinite;
          pointer-events: none;
        }

        .shimmer-text {
          background: linear-gradient(90deg, ${t.shimmerA} 0%, ${t.shimmerB} 50%, ${t.shimmerC} 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }

        .theme-toggle:hover {
          background: ${t.toggleHoverBg} !important;
        }

        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }
        .stagger-5 { animation-delay: 0.5s; }
        .stagger-6 { animation-delay: 0.6s; }
        .stagger-7 { animation-delay: 0.7s; }
      `}</style>

            {/* ============ TOP NAV ============ */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
                transition: 'all 0.5s',
                background: scrolled ? t.navScrolledBg : 'transparent',
                backdropFilter: scrolled ? 'blur(20px)' : 'none',
                borderBottom: scrolled ? `1px solid ${t.navScrolledBorder}` : 'none',
                boxShadow: scrolled ? t.navScrolledShadow : 'none',
            }}>
                <div className="max-w-[1480px] mx-auto px-8 py-5 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <img src={import.meta.env.BASE_URL + 'daikin.png'} alt="FIEM Logo" className="w-24 md:w-28 object-contain" />
                        <span className="hidden md:inline text-sm font-mono ml-2 pl-3"
                            style={{ color: t.logoSub, borderLeft: `1px solid ${t.logoSubBorder}` }}>
                            SAP PORTAL
                        </span>
                    </div>

                    {/* Nav links */}
                    <ul className="hidden lg:flex items-center gap-9 text-[14px]">
                        {['Home', 'Modules'].map((item, i) => (
                            <li key={item}>
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    style={{ color: i === 0 ? t.navActive : t.navInactive, fontWeight: i === 0 ? 500 : 400 }}
                                    className="relative transition-colors"
                                >
                                    {item}
                                    {i === 0 && <span className="absolute -bottom-[18px] left-0 right-0 h-px" style={{ background: t.navActiveLine }} />}
                                </button>
                            </li>
                        ))}
                    </ul>

                    {/* Right actions */}
                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <button className="hidden md:flex items-center gap-2 text-sm transition"
                            style={{ color: t.iconColor }}>
                            <Search size={16} />
                        </button>

                        {/* Theme Toggle — visible on ALL screen sizes incl. mobile */}
                        <button
                            className="theme-toggle flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300"
                            style={{
                                background: t.toggleBg,
                                border: `1px solid ${t.toggleBorder}`,
                                color: t.toggleColor,
                            }}
                            onClick={() => setIsDark(!isDark)}
                            title={isDark ? 'Switch to Light' : 'Switch to Dark'}
                        >
                            {isDark
                                ? <Sun size={14} />
                                : <Moon size={14} />
                            }
                        </button>

                        {/* Bell */}
                        <button className="relative transition" style={{ color: t.bellColor }}>
                            <Bell size={18} />
                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full anim-pulse-glow"
                                style={{ background: t.bellDot }} />
                        </button>

                        {/* User */}
                        <div className="flex items-center gap-2.5 pl-4"
                            style={{ borderLeft: `1px solid ${t.logoSubBorder}` }}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                                style={{
                                    background: `linear-gradient(135deg, ${t.avatarFrom}, ${t.avatarTo})`,
                                    color: t.avatarText,
                                }}>
                                {userName[0]}
                            </div>
                            <div className="hidden md:block text-left">
                                <div className="text-xs leading-tight" style={{ color: t.userRole }}>Employee</div>
                                <div className="text-sm leading-tight" style={{ color: t.userName }}>{userName} </div>
                            </div>
                        </div>

                            
                            
                    </div>
                </div>
            </nav>

            {/* ============ HERO ============ */}
            <section
                ref={heroRef}
                onMouseMove={handleMouseMove}
                className="relative min-h-screen flex items-center pt-24 overflow-hidden"
            >
                <div className="absolute inset-0 grid-bg opacity-60" />
                <div className="absolute inset-0 radial-spot transition-transform duration-700 ease-out"
                    style={{ transform: `translate(${mousePos.x * 30}px, ${mousePos.y * 30}px) scale(1.2)` }} />
                <div className="absolute top-1/2 -translate-y-1/2 right-0 w-[600px] h-[600px] rounded-full anim-float"
                    style={{ background: t.floatBlob, filter: 'blur(120px)' }} />
                <div className="scan-line" />

                <div className="relative max-w-[1480px] mx-auto px-8 w-full grid lg:grid-cols-12 gap-12 items-center">
                    {/* LEFT */}
                    <div className="lg:col-span-7 relative z-10">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-8 anim-fade-up"
                            style={{
                                border: `1px solid ${t.badgeBorder}`,
                                background: t.badgeBg,
                                backdropFilter: 'blur(8px)',
                                boxShadow: isDark ? 'none' : '0 1px 4px rgba(11,61,145,0.06)',
                            }}>
                            <span className="w-1.5 h-1.5 rounded-full anim-pulse-glow" style={{ background: t.badgeDot }} />
                            <span className="text-xs font-mono tracking-wider" style={{ color: t.badgeText }}>
                                {greeting.toUpperCase()} · {time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase()}
                            </span>
                        </div>

                        {/* Headline */}
                        <h1 className="anim-fade-up stagger-1 text-[clamp(2.8rem,6.5vw,5.5rem)] leading-[0.95] tracking-[-0.03em] font-medium">
                            <span className="block" style={{ color: t.h1Main }}>{greeting},</span>
                            <span className="block">
                                <span className="font-serif italic shimmer-text">{userName}</span>
                                <span style={{ color: t.h1Main }}>.</span>
                            </span>
                        </h1>

                        {/* Subhead */}
                        <p className="anim-fade-up stagger-2 mt-7 text-lg md:text-xl max-w-xl leading-relaxed"
                            style={{ color: t.subText }}>
                            Your unified gateway to FIEM's enterprise SAP ecosystem.
                            <span style={{ color: t.subHighlight, fontWeight: 500 }}> {modules.length} integrated modules</span>, one orchestrated workspace built for operational excellence.
                        </p>

                        {/* CTA */}
                        <div className="anim-fade-up stagger-3 mt-10 flex flex-wrap items-center gap-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="btn-shine group relative inline-flex items-center gap-3 px-7 py-4 font-semibold tracking-wide rounded-full transition-all duration-300"
                                style={{
                                    background: t.btnBg,
                                    color: t.btnText,
                                    boxShadow: `0 4px 24px ${t.btnShadow}`,
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = t.btnHoverBg;
                                    e.currentTarget.style.color = isDark ? '#05080d' : 'white';
                                    e.currentTarget.style.boxShadow = `0 8px 32px ${t.btnHoverShadow}`;
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = t.btnBg;
                                    e.currentTarget.style.color = t.btnText;
                                    e.currentTarget.style.boxShadow = `0 4px 24px ${t.btnShadow}`;
                                }}
                            >
                                <span>EXPLORE MODULES</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* RIGHT: visual */}
                    <div className="lg:col-span-5 relative anim-fade-in stagger-3">
                        <div className="relative aspect-square max-w-[480px] mx-auto"
                            style={{
                                transform: `translate(${mousePos.x * -12}px, ${mousePos.y * -12}px)`,
                                transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                            }}>
                            {/* Concentric rings */}
                            <div className="absolute inset-0 rounded-full anim-pulse-glow" style={{ border: `1px solid ${t.ringA}` }} />
                            <div className="absolute inset-8 rounded-full" style={{ border: `1px solid ${t.ringB}` }} />
                            <div className="absolute inset-16 rounded-full" style={{ border: `1px solid ${t.ringC}` }} />
                            <div className="absolute inset-24 rounded-full" style={{ border: `2px solid ${t.ringD}` }} />

                            {/* Rotating outer ring */}
                            <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '40s' }} viewBox="0 0 400 400">
                                <defs>
                                    <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor={t.gradStop1} stopOpacity="0.7" />
                                        <stop offset="50%" stopColor={t.gradStop2} stopOpacity="0" />
                                        <stop offset="100%" stopColor={t.gradStop3} stopOpacity="0.4" />
                                    </linearGradient>
                                </defs>
                                <circle cx="200" cy="200" r="195" fill="none" stroke="url(#ring-grad)" strokeWidth="1" strokeDasharray="4 8" />
                                <circle cx="200" cy="5" r="4" fill={t.outerDot} />
                            </svg>

                            {/* Counter rotation */}
                            <svg className="absolute inset-12 w-[calc(100%-6rem)] h-[calc(100%-6rem)] animate-spin"
                                style={{ animationDuration: '25s', animationDirection: 'reverse' }} viewBox="0 0 400 400">
                                <circle cx="200" cy="200" r="195" fill="none" stroke={t.innerStroke} strokeWidth="0.5" strokeDasharray="2 14" opacity="0.3" />
                                <circle cx="5" cy="200" r="3" fill={t.innerDot1} opacity="0.7" />
                                <circle cx="395" cy="200" r="3" fill={t.innerDot2} opacity="0.5" />
                            </svg>

                            {/* Center logo */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative">
                                    <div className="absolute inset-0 blur-3xl anim-pulse-glow"
                                        style={{ background: t.logoGlow, opacity: t.logoGlowOp }} />
                                    <img
                                        src={import.meta.env.BASE_URL + 'dd.png'}
                                        alt="FIEM Logo"
                                        className="relative w-32 h-40 object-contain"
                                        style={{ filter: `drop-shadow(0 4px 24px ${t.logoDropShadow})` }}
                                    />
                                </div>
                            </div>

                            {/* Orbiting nodes */}
                            {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                                <div key={i} className="absolute top-1/2 left-1/2 w-3 h-3"
                                    style={{ transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-180px)` }}>
                                    <div className="w-full h-full rounded-full anim-pulse-glow"
                                        style={{
                                            background: t.orbitDot,
                                            boxShadow: `0 0 8px ${t.orbitDot}80`,
                                            animationDelay: `${i * 0.3}s`,
                                        }} />
                                </div>
                            ))}
                        </div>

                        <div className="hidden lg:block absolute top-1/2 -right-4 -translate-y-1/2 rotate-90 origin-center font-mono text-[10px] tracking-[0.3em] whitespace-nowrap"
                            style={{ color: t.sideLabel }}>
                            ENTERPRISE · INTEGRATION · LAYER
                        </div>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 anim-fade-in"
                    style={{ animationDelay: '1.5s' }}>
                    <span className="text-[10px] font-mono tracking-widest" style={{ color: t.scrollText }}>SCROLL</span>
                    <div className="w-px h-10" style={{ background: `linear-gradient(to bottom, ${t.scrollLine}, transparent)` }} />
                </div>
            </section>

            {/* ============ MODULES SECTION ============ */}
            <section className="relative py-32 px-8" style={{ borderTop: `1px solid ${t.sectionBorder}` }}>
                <div className="absolute inset-0 grid-bg" style={{ opacity: t.sectionGridOp }} />
                <div className="relative max-w-[1480px] mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
                        <div>
                            <div className="font-mono text-xs tracking-[0.25em] mb-4" style={{ color: t.modLabel }}>— 02 / MODULES</div>
                            <h2 className="text-5xl md:text-6xl tracking-[-0.02em] font-medium leading-[1]" style={{ color: t.modH2 }}>
                                Engineered for <span className="font-serif italic" style={{ color: t.modLabel }}>precision</span>.
                            </h2>
                        </div>
                        <p className="max-w-md text-base leading-relaxed" style={{ color: t.modDesc }}>
                            Each module is purpose-built, role-permissioned, and tightly integrated with the wider FIEM operations stack. Click through to enter.
                        </p>
                    </div>

                    {/* Modules grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 rounded-3xl overflow-hidden"
                        style={{
                            gap: '1px',
                            background: t.gridGap,
                            border: `1px solid ${t.gridBorder}`,
                        }}>
                        {modules.map((m, i) => (
                            <div
                                key={m.id}
                                onClick={() => navigate('/dashboard')}
                                className="module-card group relative p-8 cursor-pointer"
                                style={{ background: t.cardBg }}
                            >
                                <div className="flex items-start justify-between mb-12">
                                    <div className="module-icon w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-500"
                                        style={{ background: t.iconBoxBg, border: `1px solid ${t.iconBoxBorder}` }}>
                                        <div className="w-3 h-3 rounded-full"
                                            style={{ background: t.iconDot, boxShadow: `0 0 10px ${t.iconDot}66` }} />
                                    </div>
                                    <span className="font-mono text-xs tracking-wider" style={{ color: t.cardNum }}>
                                        / {String(i + 1).padStart(2, '0')}
                                    </span>
                                </div>

                                <div className="font-mono text-[10px] tracking-[0.2em] mb-2" style={{ color: t.cardCode }}>
                                    {m.id.toUpperCase()}
                                </div>
                                <h3 className="text-2xl font-medium tracking-tight mb-3" style={{ color: t.cardTitle }}>
                                    {m.label}
                                </h3>
                                <p className="text-sm leading-relaxed mb-8" style={{ color: t.cardSub }}>
                                    {m.tiles.length} integrated tools available
                                </p>
                                <div className="flex items-center gap-2 text-sm" style={{ color: t.cardFooter }}>
                                    <span>Open module</span>
                                    <ArrowRight size={14} className="module-arrow transition-all duration-300" style={{ color: t.cardArrow }} />
                                </div>

                                <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none rounded-tr-3xl transition-all duration-700"
                                    style={{ background: `linear-gradient(to bottom-left, ${t.cardHoverCorner}, transparent)` }} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============ FOOTER ============ */}
            <footer className="relative py-12 px-8"
                style={{ borderTop: `1px solid ${t.footerBorder}`, background: t.footerBg }}>
                <div className="max-w-[1480px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <img
                                        src={import.meta.env.BASE_URL + 'dd.png'}
                                        alt="FIEM Logo"
                                        className="relative w-10 h-12 object-contain"
                                        style={{ filter: `drop-shadow(0 4px 24px ${t.logoDropShadow})` }}
                                    />
                        <span className="text-sm" style={{ color: t.footerText }}>© 2026 FIEM Industries · Internal Portal</span>
                    </div>
                    
                </div>
            </footer>
        </div>
    );
}