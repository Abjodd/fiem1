import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Boxes, Shield, Zap, BarChart3, Users, Cog, ChevronRight, Bell, Search, Menu } from 'lucide-react';

export default function DaikinPortal() {
    const userName = "Arbeel"; // Replace with logged-in user
    const [greeting, setGreeting] = useState("Good Morning");
    const [time, setTime] = useState(new Date());
    const [scrolled, setScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const heroRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        setMounted(true);
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good Morning");
        else if (hour < 17) setGreeting("Good Afternoon");
        else setGreeting("Good Evening");

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

    const modules = [
        { icon: Boxes, name: "Materials Management", code: "MM", desc: "Procurement, inventory & supplier ops" },
        { icon: BarChart3, name: "Financial Accounting", code: "FI", desc: "GL, AR, AP & financial reporting" },
        { icon: Cog, name: "Production Planning", code: "PP", desc: "Manufacturing & shop floor control" },
        { icon: Users, name: "Human Capital", code: "HR", desc: "Workforce, payroll & talent" },
        { icon: Shield, name: "Quality Management", code: "QM", desc: "Inspection & quality assurance" },
        { icon: Zap, name: "Plant Maintenance", code: "PM", desc: "Asset reliability & service ops" },
        { icon: ArrowRight, name: "Sales & Distribution", code: "SD", desc: "Order management & customer ops" },
    ];



    return (
        <div className="min-h-screen bg-[#05080d] text-white font-sans antialiased overflow-x-hidden">
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
          50% { opacity: 0.6; }
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
            linear-gradient(rgba(0, 162, 232, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 162, 232, 0.06) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: gridMove 20s linear infinite;
        }

        .radial-spot {
          background: radial-gradient(circle at center, rgba(0, 162, 232, 0.25), transparent 60%);
        }

        .text-glow {
          text-shadow: 0 0 40px rgba(0, 162, 232, 0.4);
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
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
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
          border-color: rgba(0, 162, 232, 0.5);
          background: rgba(0, 162, 232, 0.04);
        }
        .module-card:hover .module-arrow {
          transform: translateX(4px);
          color: #00A2E8;
        }
        .module-card:hover .module-icon {
          background: rgba(0, 162, 232, 0.15);
          border-color: rgba(0, 162, 232, 0.4);
        }

        .scan-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0, 162, 232, 0.8), transparent);
          animation: scan 6s linear infinite;
          pointer-events: none;
        }

        .shimmer-text {
          background: linear-gradient(90deg, #fff 0%, #00A2E8 50%, #fff 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
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
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#05080d]/85 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'}`}>
                <div className="max-w-[1480px] mx-auto px-8 py-5 flex items-center justify-between">
                    {/* Logo */}
                   <div className="flex items-center gap-3">
    
    <img
        src="/daikin.png"
        alt="Daikin Logo"
        className="w-24 md:w-28 object-contain"
    />

    <span className="hidden md:inline text-white/30 text-sm font-mono ml-2 pl-3 border-l border-white/10">
        SAP PORTAL
    </span>

</div>

                    {/* Nav links */}
                    <ul className="hidden lg:flex items-center gap-9 text-[14px]">
                        {['Home', 'Modules'].map((item, i) => (
                            <li key={item}>
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className={`relative group ${i === 0 ? 'text-white' : 'text-white/55 hover:text-white'} transition-colors`}
                                >
                                    {item}
                                    {i === 0 && <span className="absolute -bottom-[18px] left-0 right-0 h-px bg-[#00A2E8]" />}
                                </button>
                            </li>
                        ))}
                    </ul>

                    {/* Right actions */}
                    <div className="flex items-center gap-5">
                        <button className="hidden md:flex items-center gap-2 text-white/50 hover:text-white text-sm transition">
                            <Search size={16} />

                        </button>
                        <button className="relative text-white/70 hover:text-white transition">
                            <Bell size={18} />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#00A2E8] rounded-full anim-pulse-glow" />
                        </button>
                        <div className="flex items-center gap-2.5 pl-4 border-l border-white/10">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00A2E8] to-[#0066a8] flex items-center justify-center text-sm font-semibold">
                                {userName[0]}
                            </div>
                            <div className="hidden md:block text-left">
                                <div className="text-xs text-white/50 leading-tight">Employee</div>
                                <div className="text-sm leading-tight">{userName} K.</div>
                            </div>
                        </div>
                        <button className="lg:hidden text-white"><Menu size={20} /></button>
                    </div>
                </div>
            </nav>

            {/* ============ HERO ============ */}
            <section
                ref={heroRef}
                onMouseMove={handleMouseMove}
                className="relative min-h-screen flex items-center pt-24 overflow-hidden"
            >
                {/* Background layers */}
                <div className="absolute inset-0 grid-bg opacity-60" />
                <div
                    className="absolute inset-0 radial-spot transition-transform duration-700 ease-out"
                    style={{
                        transform: `translate(${mousePos.x * 30}px, ${mousePos.y * 30}px) scale(1.2)`,
                    }}
                />
                <div className="absolute top-1/2 -translate-y-1/2 right-0 w-[600px] h-[600px] rounded-full bg-[#00A2E8]/10 blur-[120px] anim-float" />
                <div className="scan-line" />

                {/* Corner decorations */}



                <div className="relative max-w-[1480px] mx-auto px-8 w-full grid lg:grid-cols-12 gap-12 items-center">
                    {/* LEFT: copy */}
                    <div className="lg:col-span-7 relative z-10">
                        {/* Greeting badge */}
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-sm mb-8 anim-fade-up">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00A2E8] anim-pulse-glow" />
                            <span className="text-xs font-mono tracking-wider text-white/70">
                                {greeting.toUpperCase()} · {time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase()}
                            </span>
                        </div>

                        {/* Headline */}
                        <h1 className="anim-fade-up stagger-1 text-[clamp(2.8rem,6.5vw,5.5rem)] leading-[0.95] tracking-[-0.03em] font-medium">
                            <span className="block text-white/95">{greeting},</span>
                            <span className="block">
                                <span className="font-serif italic shimmer-text">{userName}</span>
                                <span className="text-white/95">.</span>
                            </span>
                        </h1>

                        {/* Subhead */}
                        <p className="anim-fade-up stagger-2 mt-7 text-lg md:text-xl text-white/55 max-w-xl leading-relaxed">
                            Your unified gateway to Daikin's enterprise SAP ecosystem.
                            <span className="text-white/80"> Twenty-four integrated modules</span>, one orchestrated workspace built for operational excellence.
                        </p>

                        {/* CTAs */}
                        <div className="anim-fade-up stagger-3 mt-10 flex flex-wrap items-center gap-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="btn-shine group relative inline-flex items-center gap-3 px-7 py-4 bg-[#00A2E8] text-[#05080d] font-semibold tracking-wide rounded-full hover:bg-white transition-all duration-300 shadow-[0_0_40px_rgba(0,162,232,0.4)] hover:shadow-[0_0_60px_rgba(0,162,232,0.6)]"
                            >
                                <span>EXPLORE MODULES</span>

                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>

                        </div>


                    </div>

                    {/* RIGHT: visual */}
                    <div className="lg:col-span-5 relative anim-fade-in stagger-3">
                        <div
                            className="relative aspect-square max-w-[480px] mx-auto"
                            style={{
                                transform: `translate(${mousePos.x * -12}px, ${mousePos.y * -12}px)`,
                                transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                            }}
                        >
                            {/* Concentric rings */}
                            <div className="absolute inset-0 rounded-full border border-[#00A2E8]/20 anim-pulse-glow" />
                            <div className="absolute inset-8 rounded-full border border-[#00A2E8]/30" />
                            <div className="absolute inset-16 rounded-full border border-[#00A2E8]/40" />
                            <div className="absolute inset-24 rounded-full border-2 border-[#00A2E8]/50" />

                            {/* Rotating outer ring */}
                            <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '40s' }} viewBox="0 0 400 400">
                                <defs>
                                    <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#00A2E8" stopOpacity="0.8" />
                                        <stop offset="50%" stopColor="#00A2E8" stopOpacity="0" />
                                        <stop offset="100%" stopColor="#00A2E8" stopOpacity="0.4" />
                                    </linearGradient>
                                </defs>
                                <circle cx="200" cy="200" r="195" fill="none" stroke="url(#ring-grad)" strokeWidth="1" strokeDasharray="4 8" />
                                <circle cx="200" cy="5" r="4" fill="#00A2E8" />
                            </svg>

                            {/* Counter rotation */}
                            <svg className="absolute inset-12 w-[calc(100%-6rem)] h-[calc(100%-6rem)] animate-spin" style={{ animationDuration: '25s', animationDirection: 'reverse' }} viewBox="0 0 400 400">
                                <circle cx="200" cy="200" r="195" fill="none" stroke="#00A2E8" strokeWidth="0.5" strokeDasharray="2 14" opacity="0.4" />
                                <circle cx="5" cy="200" r="3" fill="#00A2E8" opacity="0.8" />
                                <circle cx="395" cy="200" r="3" fill="#00A2E8" opacity="0.6" />
                            </svg>

                            {/* Center logo */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative">

                                    <div className="absolute inset-0 bg-[#00A2E8] blur-3xl opacity-30 anim-pulse-glow" />

                                    <img
                                        src="/dd.png"
                                        alt="Daikin Logo"
                                        className="relative  w-24 md:w-28 object-contain drop-shadow-[0_0_25px_rgba(0,162,232,0.5)]"
                                    />

                                </div>
                            </div>

                            {/* Orbiting nodes */}
                            {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                                <div
                                    key={i}
                                    className="absolute top-1/2 left-1/2 w-3 h-3"
                                    style={{
                                        transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-180px)`,
                                    }}
                                >
                                    <div className="w-full h-full rounded-full bg-[#00A2E8] anim-pulse-glow" style={{ animationDelay: `${i * 0.3}s` }} />
                                </div>
                            ))}
                        </div>

                        {/* Side label */}
                        <div className="hidden lg:block absolute top-1/2 -right-4 -translate-y-1/2 rotate-90 origin-center font-mono text-[10px] text-white/30 tracking-[0.3em] whitespace-nowrap">
                            ENTERPRISE · INTEGRATION · LAYER
                        </div>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 anim-fade-in" style={{ animationDelay: '1.5s' }}>
                    <span className="text-[10px] font-mono text-white/40 tracking-widest">SCROLL</span>
                    <div className="w-px h-10 bg-gradient-to-b from-[#00A2E8] to-transparent" />
                </div>
            </section>

            {/* ============ MODULES SECTION ============ */}
            <section className="relative py-32 px-8 border-t border-white/5">
                <div className="absolute inset-0 grid-bg opacity-200 bg-transparent" />
                <div className="relative max-w-[1480px] mx-auto">
                    {/* Section header */}
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
                        <div>
                            <div className="font-mono text-xs text-[#00A2E8] tracking-[0.25em] mb-4">— 02 / MODULES</div>
                            <h2 className="text-5xl md:text-6xl tracking-[-0.02em] font-medium leading-[1]">
                                Engineered for <span className="font-serif italic text-[#00A2E8]">precision</span>.
                            </h2>
                        </div>
                        <p className="max-w-md text-white/55 text-base leading-relaxed">
                            Each module is purpose-built, role-permissioned, and tightly integrated with the wider Daikin operations stack. Click through to enter.
                        </p>
                    </div>

                    {/* Modules grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5 rounded-3xl overflow-hidden">
                        {modules.map((m, i) => {
                            const Icon = m.icon;
                            return (
                                <div
                                    key={i}
                                    onClick={() => navigate('/dashboard')}
                                    className="module-card group relative bg-[#05080d] p-8 cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-12">
                                        <div className="module-icon w-14 h-14 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center transition-all duration-500">
                                            <Icon size={22} strokeWidth={1.5} className="text-[#00A2E8]" />
                                        </div>
                                        <span className="font-mono text-xs text-white/30 tracking-wider">/ {String(i + 1).padStart(2, '0')}</span>
                                    </div>

                                    <div className="font-mono text-[10px] text-[#00A2E8] tracking-[0.2em] mb-2">{m.code}</div>
                                    <h3 className="text-2xl font-medium tracking-tight mb-3">{m.name}</h3>
                                    <p className="text-white/50 text-sm leading-relaxed mb-8">{m.desc}</p>

                                    <div className="flex items-center gap-2 text-sm text-white/70">
                                        <span>Open module</span>
                                        <ArrowRight size={14} className="module-arrow transition-all duration-300" />
                                    </div>

                                    {/* hover gradient corner */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#00A2E8]/0 to-transparent group-hover:from-[#00A2E8]/20 transition-all duration-700 pointer-events-none rounded-tr-3xl" />
                                </div>
                            );
                        })}
                    </div>

                    {/* CTA below grid */}

                </div>
            </section>

            {/* ============ ACTIVITY / WIDGETS ============ */}


            {/* ============ FOOTER ============ */}
            <footer className="relative border-t border-white/5 py-12 px-8">
                <div className="max-w-[1480px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <svg width="30" height="18" viewBox="0 0 100 56" fill="none">
                            <polygon points="0,0 30,0 15,56" fill="#1a1a1a" />
                            <polygon points="15,0 45,0 30,56 0,56" fill="#00A2E8" />
                        </svg>
                        <span className="text-sm text-white/60">© 2026 Daikin Industries · Internal Portal</span>
                    </div>
                    <div className="flex items-center gap-8 text-sm text-white/50">
                        <a href="#" className="hover:text-white transition">Privacy</a>
                        <a href="#" className="hover:text-white transition">Security</a>
                        <a href="#" className="hover:text-white transition">IT Helpdesk</a>
                        <span className="font-mono text-xs text-white/30">BUILD 2026.05.12</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}