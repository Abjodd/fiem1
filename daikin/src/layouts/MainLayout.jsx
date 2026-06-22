import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { NAV_MODULES } from '../router/index.jsx'
import TileGrid from '../components/TileGrid.jsx'

const MOD_ICONS = {
  operations: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
    </svg>
  ),
  inventory: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h18v5H3zM3 8h18v13H3z"/><path d="M9 13h6M9 17h4"/>
    </svg>
  ),
  quality: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  vendors: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  reports: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
    </svg>
  ),
  planning: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      <path d="M8 14h.01M12 14h.01M16 14h.01"/>
    </svg>
  ),
  analytics: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18"/><path d="M7 16l4-4 3 3 5-6"/>
    </svg>
  ),
  default: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 9h6M9 12h6M9 15h4"/>
    </svg>
  ),
}

function getIcon(modId = '') {
  const key = modId.toLowerCase()
  for (const k of Object.keys(MOD_ICONS)) {
    if (key.includes(k)) return MOD_ICONS[k]
  }
  return MOD_ICONS.default
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --accent:        #0b3d91;
    --accent-light:  #1e5dd6;
    --accent-deep:   #07296b;
    --accent-soft:   rgba(11,61,145,0.06);
    --accent-mid:    rgba(11,61,145,0.12);
    --accent-brd:    rgba(11,61,145,0.22);

    --bg:            #e9edf3;
    --bg-2:          #dee3ec;
    --surface:       #ffffff;
    --surface-2:     #f1f4f9;

    --border:        rgba(15,23,42,0.08);
    --border-hard:   rgba(15,23,42,0.14);

    --ink:           #0f172a;
    --ink-2:         #334155;
    --ink-3:         #64748b;
    --muted:         #94a3b8;

    --mono: 'Geist Mono', monospace;
    --sans: 'Geist', -apple-system, sans-serif;
    --serif: 'Instrument Serif', serif;
  }

  html, body, #root { height: 100%; overflow: hidden; }

  body {
    background: var(--bg);
    color: var(--ink);
    -webkit-font-smoothing: antialiased;
  }

  .ml-shell {
    display: flex;
    flex-direction: column;
    height: 100dvh;
    background: var(--bg);
    font-family: var(--sans);
    color: var(--ink);
    overflow: hidden;
    position: relative;
  }

  .ml-top {
    flex-shrink: 0;
    z-index: 200;
    position: relative;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
  }

  .ml-body { flex: 1; display: flex; min-height: 0; overflow: hidden; position: relative; }

  .ml-pillnav {
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px;
    border-radius: 100px;
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(24px) saturate(1.8);
    -webkit-backdrop-filter: blur(24px) saturate(1.8);
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow:
      0 1px 0 rgba(255,255,255,0.7) inset,
      0 0 0 1px rgba(11,61,145,0.04),
      0 8px 28px -8px rgba(11,61,145,0.18),
      0 20px 40px -12px rgba(11,61,145,0.12);
    max-width: calc(100vw - 32px);
    animation: pill-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes pill-in {
    from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  .ml-pill-item {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 16px;
    border-radius: 100px;
    font-family: var(--sans);
    font-size: 13.5px;
    font-weight: 500;
    color: var(--ink-2);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    white-space: nowrap;
    -webkit-tap-highlight-color: transparent;
    letter-spacing: -0.005em;
    flex-shrink: 0;
  }

  .ml-pill-item:hover {
    color: var(--ink);
    background: rgba(11, 61, 145, 0.06);
  }

  .ml-pill-item.active {
    background: var(--accent);
    color: #ffffff;
    box-shadow:
      0 1px 0 rgba(255,255,255,0.18) inset,
      0 4px 12px -2px rgba(11,61,145,0.4);
  }

  .ml-pill-item.active:hover {
    background: var(--accent-deep);
    color: #ffffff;
  }

  .ml-pill-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    color: currentColor;
    opacity: 0.7;
    transition: opacity 0.25s ease;
  }

  .ml-pill-item.active .ml-pill-icon,
  .ml-pill-item:hover .ml-pill-icon { opacity: 1; }

  .ml-pill-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 100px;
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 500;
    background: rgba(11, 61, 145, 0.1);
    color: var(--accent);
    margin-left: 2px;
    transition: all 0.25s ease;
  }

  .ml-pill-item.active .ml-pill-badge {
    background: rgba(255, 255, 255, 0.22);
    color: #ffffff;
  }

  .ml-pill-scroll {
    display: flex;
    align-items: center;
    gap: 4px;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    scrollbar-width: none;
    -ms-overflow-style: none;
    max-width: 100%;
  }
  .ml-pill-scroll::-webkit-scrollbar { display: none; }

  .ml-scroll {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    scrollbar-color: var(--border-hard) transparent;
    background: var(--bg);
  }

  .ml-scroll::-webkit-scrollbar { width: 6px; }
  .ml-scroll::-webkit-scrollbar-track { background: transparent; }
  .ml-scroll::-webkit-scrollbar-thumb { background: var(--border-hard); border-radius: 4px; }
  .ml-scroll::-webkit-scrollbar-thumb:hover { background: var(--accent-brd); }

  .ml-main {
    width: 100%;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .ml-section:first-of-type .ml-section-head { padding-top: 168px; }

  .ml-section {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0;
    background: var(--surface);
    animation: section-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes section-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .ml-section-head {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: flex-start;
    min-height: 380px;
    padding: 56px 64px 48px;
    overflow: hidden;
    isolation: isolate;
    background: linear-gradient(135deg, var(--accent-deep) 0%, var(--accent) 60%, var(--accent-light) 130%);
  }

  .ml-section:nth-of-type(8n+1) .ml-section-head {
    background-image:
      linear-gradient(120deg, rgba(7,41,107,0.92) 0%, rgba(11,61,145,0.75) 55%, rgba(30,93,214,0.45) 100%),
      url('/images/purchasing-head.png');
    background-size: cover; background-position: center;
  }
  .ml-section:nth-of-type(8n+2) .ml-section-head {
    background-image:
      linear-gradient(120deg, rgba(7,41,107,0.92) 0%, rgba(11,61,145,0.75) 55%, rgba(30,93,214,0.45) 100%),
      url('/images/reports-head.png');
    background-size: cover; background-position: center;
  }
  .ml-section:nth-of-type(8n+3) .ml-section-head {
    background-image:
      linear-gradient(120deg, rgba(7,41,107,0.92) 0%, rgba(11,61,145,0.75) 55%, rgba(30,93,214,0.45) 100%),
      url('/images/shipment-head.png');
    background-size: cover; background-position: center;
  }
  .ml-section:nth-of-type(8n+4) .ml-section-head {
    background-image:
      linear-gradient(120deg, rgba(7,41,107,0.92) 0%, rgba(11,61,145,0.75) 55%, rgba(30,93,214,0.45) 100%),
      url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=1800&q=80');
    background-size: cover; background-position: center;
  }
  .ml-section:nth-of-type(8n+5) .ml-section-head {
    background-image:
      linear-gradient(120deg, rgba(7,41,107,0.92) 0%, rgba(11,61,145,0.75) 55%, rgba(30,93,214,0.45) 100%),
      url('https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1800&q=80');
    background-size: cover; background-position: center;
  }
  .ml-section:nth-of-type(8n+6) .ml-section-head {
    background-image:
      linear-gradient(120deg, rgba(7,41,107,0.92) 0%, rgba(11,61,145,0.75) 55%, rgba(30,93,214,0.45) 100%),
      url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1800&q=80');
    background-size: cover; background-position: center;
  }
  .ml-section:nth-of-type(8n+7) .ml-section-head {
    background-image:
      linear-gradient(120deg, rgba(7,41,107,0.92) 0%, rgba(11,61,145,0.75) 55%, rgba(30,93,214,0.45) 100%),
      url('https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=1800&q=80');
    background-size: cover; background-position: center;
  }
  .ml-section:nth-of-type(8n+8) .ml-section-head {
    background-image:
      linear-gradient(120deg, rgba(7,41,107,0.92) 0%, rgba(11,61,145,0.75) 55%, rgba(30,93,214,0.45) 100%),
      url('https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1800&q=80');
    background-size: cover; background-position: center;
  }

  .ml-section-head::before {
    content: '';
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none; opacity: 0.4; z-index: 0;
  }

  .ml-section-head::after {
    content: '';
    position: absolute;
    top: -120px; right: -80px;
    width: 360px; height: 360px;
    background: radial-gradient(circle, rgba(255,255,255,0.14) 0%, transparent 60%);
    border-radius: 50%;
    pointer-events: none; filter: blur(8px); z-index: 0;
  }

  .ml-section-name {
    position: relative; z-index: 2;
    font-family: var(--serif);
    font-style: italic; font-weight: 400;
    font-size: clamp(54px, 7vw, 96px);
    letter-spacing: -0.025em;
    color: #ffffff; line-height: 0.95;
    text-shadow: 0 2px 24px rgba(7,41,107,0.4);
    display: block;
  }

  .ml-section-name::before {
    content: 'CORPORATE MODULE';
    display: block;
    font-family: var(--mono); font-style: normal;
    font-size: 11px; font-weight: 500;
    letter-spacing: 0.32em;
    color: rgba(255,255,255,0.7);
    margin-bottom: 18px; text-transform: uppercase;
  }

  .ml-section-rule { display: none; }

  .ml-section-tag {
    position: relative; z-index: 2;
    margin-top: 20px;
    font-family: var(--sans); font-style: normal;
    font-size: 16px; font-weight: 400;
    color: rgba(255,255,255,0.8);
    letter-spacing: -0.005em; line-height: 1.55;
    max-width: 640px;
    background: transparent; border: none;
    padding: 0; border-radius: 0; display: block;
  }

  .ml-section-tag::before {
    content: 'Centralized workspace for managing this module · ';
    color: rgba(255,255,255,0.55);
  }

  .ml-section-tag::after {
    content: ' tiles available below.';
    color: rgba(255,255,255,0.55);
  }

  .ml-section > :not(.ml-section-head) {
    background: var(--surface);
    padding: 56px 64px 64px;
  }

  .ml-footer {
    background: var(--accent-deep);
    color: rgba(255,255,255,0.7);
    padding: 32px 64px;
    border-top: 1px solid rgba(255,255,255,0.08);
    font-family: var(--sans);
  }

  .ml-footer-inner {
    max-width: 1280px; margin: 0 auto;
    display: flex; align-items: center;
    justify-content: space-between;
    gap: 24px; flex-wrap: wrap;
  }

  .ml-footer-left {
    display: flex; align-items: center;
    gap: 14px; font-size: 13px; letter-spacing: -0.005em;
  }

  .ml-footer-mark {
    width: 28px; height: 28px; border-radius: 7px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.15);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--mono); font-size: 10px; font-weight: 600;
    color: #ffffff; letter-spacing: 0.05em; flex-shrink: 0;
  }

  .ml-footer-text { color: rgba(255,255,255,0.75); }
  .ml-footer-text em { font-family: serif; color: #ffffff; font-weight: 400; }

  .ml-mobile-nav { display: none; }
  .ml-mobile-toggle { display: none; }
  .ml-sidebar-overlay { display: none; }
  .ml-sidebar-drawer { display: none; }

  @media (max-width: 1100px) {
    .ml-pillnav { top: 16px; gap: 2px; padding: 5px; }
    .ml-pill-item { padding: 8px 13px; font-size: 12.5px; }
    .ml-pill-icon { width: 14px; height: 14px; }
    .ml-section:first-of-type .ml-section-head { padding-top: 110px; }
  }

  @media (max-width: 768px) {
    .ml-pillnav { display: none; }

    .ml-mobile-toggle {
      display: flex; align-items: center; justify-content: center;
      position: fixed; top: 10px; left: 12px; z-index: 310;
      width: 36px; height: 36px; border-radius: 10px;
      background: var(--accent-soft); border: 1px solid var(--accent-brd);
      color: var(--accent); cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: all 0.2s ease;
    }
    .ml-mobile-toggle:active { transform: scale(0.94); background: var(--accent-mid); }

    .ml-sidebar-overlay {
      display: block; position: fixed; inset: 0; z-index: 399;
      background: rgba(7,41,107,0.45);
      backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
      opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
    }
    .ml-sidebar-overlay.open { opacity: 1; pointer-events: all; }

    .ml-sidebar-drawer {
      display: flex; flex-direction: column;
      position: fixed; top: 0; left: 0; bottom: 0;
      width: 286px; max-width: 86vw; z-index: 400;
      background: var(--accent-deep); overflow: hidden;
      transform: translateX(-100%);
      transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 6px 0 40px rgba(7,41,107,0.4);
    }
    .ml-sidebar-drawer.open { transform: translateX(0); }

    .ml-drawer-head {
      position: relative; padding: 24px 22px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.1); flex-shrink: 0;
    }

    .ml-drawer-eyebrow {
      font-family: var(--mono); font-size: 9.5px; font-weight: 500;
      letter-spacing: 0.28em; text-transform: uppercase;
      color: rgba(255,255,255,0.5); margin-bottom: 12px;
      display: flex; align-items: center; gap: 8px;
    }
    .ml-drawer-eyebrow::before { content: ''; width: 14px; height: 1px; background: rgba(255,255,255,0.5); }

    .ml-drawer-title {
      font-family: var(--sans); font-size: 24px; font-weight: 500;
      color: #ffffff; letter-spacing: -0.025em; line-height: 1;
    }
    .ml-drawer-title em { font-family: var(--serif); font-style: italic; font-weight: 400; color: rgba(255,255,255,0.75); }

    .ml-drawer-close {
      position: absolute; top: 16px; right: 16px;
      width: 32px; height: 32px; border-radius: 10px;
      background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
      color: rgba(255,255,255,0.75);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; -webkit-tap-highlight-color: transparent; transition: all 0.2s ease;
    }
    .ml-drawer-close:active { background: rgba(255,255,255,0.18); color: #ffffff; }

    .ml-drawer-body {
      flex: 1; overflow-y: auto; overflow-x: hidden;
      padding: 16px 12px;
      scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.18) transparent;
    }
    .ml-drawer-body::-webkit-scrollbar { width: 4px; }
    .ml-drawer-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.18); border-radius: 4px; }

    .ml-drawer-group {
      font-family: var(--mono); font-size: 9px; font-weight: 500;
      letter-spacing: 0.28em; text-transform: uppercase;
      color: rgba(255,255,255,0.35); padding: 6px 10px 12px;
      display: flex; align-items: center; gap: 8px;
    }
    .ml-drawer-group::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.08); }

    .ml-drawer-item {
      display: flex; align-items: center; gap: 12px;
      padding: 11px 12px; cursor: pointer; border-radius: 12px;
      font-family: var(--sans); font-size: 14px;
      color: rgba(255,255,255,0.72);
      background: transparent; border: none; width: 100%; text-align: left;
      transition: background 0.18s ease, color 0.18s ease;
      -webkit-tap-highlight-color: transparent; margin-bottom: 4px; position: relative;
    }
    .ml-drawer-item:active { background: rgba(255,255,255,0.08); }
    .ml-drawer-item.active { background: rgba(255,255,255,0.14); color: #ffffff; font-weight: 500; }
    .ml-drawer-item.active::before {
      content: ''; position: absolute; left: -12px; top: 11px; bottom: 11px;
      width: 3px; background: #ffffff; border-radius: 0 3px 3px 0;
    }

    .ml-drawer-icon {
      width: 32px; height: 32px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7);
      border: 1px solid rgba(255,255,255,0.05); transition: all 0.18s ease;
    }
    .ml-drawer-item.active .ml-drawer-icon { background: rgba(255,255,255,0.2); color: #ffffff; border-color: rgba(255,255,255,0.15); }

    .ml-drawer-label { flex: 1; letter-spacing: -0.005em; }

    .ml-drawer-badge {
      font-family: var(--mono); font-size: 10px; font-weight: 500;
      letter-spacing: 0.08em; padding: 2px 7px; border-radius: 5px;
      background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5);
      flex-shrink: 0; border: 1px solid rgba(255,255,255,0.06);
    }
    .ml-drawer-item.active .ml-drawer-badge { background: rgba(255,255,255,0.22); color: #ffffff; border-color: rgba(255,255,255,0.15); }

    .ml-drawer-footer {
      flex-shrink: 0; border-top: 1px solid rgba(255,255,255,0.08);
      padding: 14px 22px; display: flex; align-items: center; gap: 11px;
      background: rgba(0,0,0,0.18);
    }

    .ml-drawer-pulse {
      width: 7px; height: 7px; border-radius: 50%;
      background: #4ade80; flex-shrink: 0;
      box-shadow: 0 0 0 0 rgba(74,222,128,0.5);
      animation: pulse-ring 2.4s ease-in-out infinite;
    }

    @keyframes pulse-ring {
      0%   { box-shadow: 0 0 0 0 rgba(74,222,128,0.5); }
      60%  { box-shadow: 0 0 0 7px rgba(74,222,128,0); }
      100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
    }

    .ml-drawer-status { font-family: var(--mono); font-size: 10px; font-weight: 500; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(255,255,255,0.75); }
    .ml-drawer-tag { font-family: var(--mono); font-size: 9px; color: rgba(255,255,255,0.45); letter-spacing: 0.1em; margin-top: 3px; }

    .ml-section:first-of-type .ml-section-head { padding-top: 36px; }
    .ml-section-head { min-height: 280px; padding: 36px 24px 32px; }
    .ml-section-name { font-size: clamp(40px, 11vw, 60px); }
    .ml-section-name::before { font-size: 9.5px; letter-spacing: 0.24em; margin-bottom: 12px; }
    .ml-section-tag { margin-top: 14px; font-size: 13.5px; }
    .ml-section > :not(.ml-section-head) { padding: 32px 20px 40px; }

    .ml-footer { padding: 24px 20px 28px; margin-bottom: 64px; }
    .ml-footer-inner { flex-direction: column; align-items: flex-start; gap: 16px; }
    .ml-footer-left { font-size: 12.5px; }

    .ml-mobile-nav {
      display: flex; position: fixed; bottom: 0; left: 0; right: 0; z-index: 300;
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(24px) saturate(1.8); -webkit-backdrop-filter: blur(24px) saturate(1.8);
      border-top: 1px solid var(--border-hard);
      box-shadow: 0 -4px 24px -4px rgba(11,61,145,0.08);
      overflow-x: auto; overflow-y: hidden; scrollbar-width: none;
      -webkit-overflow-scrolling: touch; padding: 0 8px; height: 64px; align-items: center; gap: 2px;
    }
    .ml-mobile-nav::-webkit-scrollbar { display: none; }

    .ml-mobile-tab {
      flex-shrink: 0; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 4px;
      height: 54px; min-width: 64px; padding: 0 12px; border-radius: 12px;
      cursor: pointer; border: none; background: transparent;
      -webkit-tap-highlight-color: transparent; transition: background 0.18s ease;
      position: relative; font-family: var(--sans);
    }
    .ml-mobile-tab:active { background: var(--accent-soft); }

    .ml-mobile-tab-icon { display: flex; color: var(--muted); transition: color 0.2s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
    .ml-mobile-tab.active .ml-mobile-tab-icon { color: var(--accent); transform: scale(1.15); }

    .ml-mobile-tab-label {
      font-family: var(--mono); font-size: 9px; font-weight: 500;
      color: var(--muted); white-space: nowrap; letter-spacing: 0.06em;
      text-transform: uppercase; transition: color 0.2s ease;
    }
    .ml-mobile-tab.active .ml-mobile-tab-label { color: var(--accent); font-weight: 600; }

    .ml-mobile-tab.active::after {
      content: ''; position: absolute; top: 4px; left: 50%; transform: translateX(-50%);
      width: 22px; height: 3px; background: var(--accent);
      border-radius: 0 0 4px 4px; box-shadow: 0 1px 4px rgba(11,61,145,0.3);
    }
  }

  @media (max-width: 480px) {
    .ml-section-head { padding: 30px 18px 28px; min-height: 240px; }
    .ml-section > :not(.ml-section-head) { padding: 28px 16px 36px; }
    .ml-mobile-tab { padding: 0 10px; min-width: 58px; }
    .ml-mobile-tab-label { font-size: 8.5px; letter-spacing: 0.05em; }
  }
`

export default function MainLayout() {
  const location = useLocation()
  const [activeModule, setActiveModule] = useState(NAV_MODULES[0]?.id)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const sectionRefs = useRef({})
  const pillItemRefs = useRef({})
  const pillScrollRef = useRef(null)
  const scrollAreaRef = useRef(null)
  const isScrollingTo = useRef(false)
  const scrollTimer = useRef(null)

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setDrawerOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const getTopHeight = () => {
    const top = document.querySelector('.ml-top')
    return top ? top.offsetHeight : 56
  }

  // Scroll-to from PageLayout back-navigation
  useEffect(() => {
    const id = location.state?.scrollTo
    if (!id) return
    window.history.replaceState({}, '')
    const timer = setTimeout(() => {
      const el = sectionRefs.current[id]
      const scrollArea = scrollAreaRef.current
      if (!el || !scrollArea) return
      setActiveModule(id)
      isScrollingTo.current = true
      const offset = getTopHeight() + 100
      const top =
        el.getBoundingClientRect().top -
        scrollArea.getBoundingClientRect().top +
        scrollArea.scrollTop - offset
      scrollArea.scrollTo({ top, behavior: 'smooth' })
      scrollTimer.current = setTimeout(() => { isScrollingTo.current = false }, 900)
    }, 120)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const scrollArea = scrollAreaRef.current
    if (!scrollArea) return
    const visibleSections = new Set()

    const obs = new IntersectionObserver(
      (entries) => {
        if (isScrollingTo.current) return
        entries.forEach((e) => {
          const id = e.target.dataset.moduleId
          if (e.isIntersecting) visibleSections.add(id)
          else visibleSections.delete(id)
        })
        if (!visibleSections.size) return
        let topmost = null, topmostY = Infinity
        visibleSections.forEach((id) => {
          const el = sectionRefs.current[id]
          if (!el) return
          const y = el.getBoundingClientRect().top
          if (y < topmostY) { topmostY = y; topmost = id }
        })
        if (topmost) setActiveModule(topmost)
      },
      { root: scrollArea, rootMargin: '-160px 0px -25% 0px', threshold: 0 }
    )

    NAV_MODULES.forEach((mod) => {
      const el = sectionRefs.current[mod.id]
      if (el) { el.dataset.moduleId = mod.id; obs.observe(el) }
    })

    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const pillScroll = pillScrollRef.current
    const activeEl = pillItemRefs.current[activeModule]
    if (!pillScroll || !activeEl) return
    const containerRect = pillScroll.getBoundingClientRect()
    const itemRect = activeEl.getBoundingClientRect()
    if (itemRect.left < containerRect.left || itemRect.right > containerRect.right) {
      const offset = activeEl.offsetLeft - (pillScroll.clientWidth / 2) + (activeEl.clientWidth / 2)
      pillScroll.scrollTo({ left: offset, behavior: 'smooth' })
    }
  }, [activeModule])

  const handleSelect = useCallback((id) => {
    const el = sectionRefs.current[id]
    const scrollArea = scrollAreaRef.current
    if (!el || !scrollArea) return
    setActiveModule(id)
    setDrawerOpen(false)
    isScrollingTo.current = true
    if (scrollTimer.current) clearTimeout(scrollTimer.current)
    const offset = getTopHeight() + 100
    const top =
      el.getBoundingClientRect().top -
      scrollArea.getBoundingClientRect().top +
      scrollArea.scrollTop - offset
    scrollArea.scrollTo({ top, behavior: 'smooth' })
    scrollTimer.current = setTimeout(() => { isScrollingTo.current = false }, 900)
  }, [])

  return (
    <>
      <style>{CSS}</style>
      <div className="ml-shell">

        <div className="ml-top">
          <Header />
        </div>

        <nav className="ml-pillnav" aria-label="Module navigation">
          <div className="ml-pill-scroll" ref={pillScrollRef}>
            {NAV_MODULES.map((mod) => (
              <button
                key={mod.id}
                ref={(el) => (pillItemRefs.current[mod.id] = el)}
                type="button"
                className={`ml-pill-item${activeModule === mod.id ? ' active' : ''}`}
                onClick={() => handleSelect(mod.id)}
              >
                <span className="ml-pill-icon">{getIcon(mod.id)}</span>
                <span>{mod.label}</span>
                {mod.tiles?.length > 0 && (
                  <span className="ml-pill-badge">{mod.tiles.length}</span>
                )}
              </button>
            ))}
          </div>
        </nav>

        <button
          type="button"
          className="ml-mobile-toggle"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <div
          className={`ml-sidebar-overlay${drawerOpen ? ' open' : ''}`}
          onClick={() => setDrawerOpen(false)}
        />

        <aside className={`ml-sidebar-drawer${drawerOpen ? ' open' : ''}`} aria-label="Mobile menu">
          <div className="ml-drawer-head">
            <div className="ml-drawer-eyebrow">FIEM SAP Portal</div>
            <div className="ml-drawer-title">Mod<em>ules</em></div>
            <button
              type="button"
              className="ml-drawer-close"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="ml-drawer-body">
            <div className="ml-drawer-group">All Modules</div>
            {NAV_MODULES.map((mod) => (
              <button
                key={mod.id}
                type="button"
                className={`ml-drawer-item${activeModule === mod.id ? ' active' : ''}`}
                onClick={() => handleSelect(mod.id)}
              >
                <div className="ml-drawer-icon">{getIcon(mod.id)}</div>
                <span className="ml-drawer-label">{mod.label}</span>
                {mod.tiles?.length > 0 && (
                  <span className="ml-drawer-badge">{mod.tiles.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="ml-drawer-footer">
            <div className="ml-drawer-pulse" />
            <div>
              <div className="ml-drawer-status">System Online</div>
              <div className="ml-drawer-tag">Kunstocom · v2.0</div>
            </div>
          </div>
        </aside>

        <div className="ml-body">
          <div className="ml-scroll" ref={scrollAreaRef}>
            <main className="ml-main">
              {NAV_MODULES.map((mod) => (
                <section
                  key={mod.id}
                  id={`section-${mod.id}`}
                  ref={(el) => (sectionRefs.current[mod.id] = el)}
                  className="ml-section"
                >
                  <div className="ml-section-head">
                    <span className="ml-section-name">{mod.label}</span>
                    <div className="ml-section-rule" />
                    {mod.tiles?.length > 0 && (
                      <span className="ml-section-tag">{mod.tiles.length}</span>
                    )}
                  </div>
                  <TileGrid tiles={mod.tiles} />
                </section>
              ))}
            </main>

            <footer className="ml-footer">
              <div className="ml-footer-inner">
                <div className="ml-footer-left">
                  <div className="ml-footer-mark">F</div>
                  <span className="ml-footer-text">
                    © {new Date().getFullYear()} <em>FIEM</em> · SAP Portal · Internal use only
                  </span>
                </div>
              </div>
            </footer>
          </div>
        </div>

        <nav className="ml-mobile-nav" aria-label="Module navigation (mobile)">
          {NAV_MODULES.map((mod) => (
            <button
              key={mod.id}
              type="button"
              className={`ml-mobile-tab${activeModule === mod.id ? ' active' : ''}`}
              onClick={() => handleSelect(mod.id)}
            >
              <span className="ml-mobile-tab-icon">{getIcon(mod.id)}</span>
              <span className="ml-mobile-tab-label">{mod.label}</span>
            </button>
          ))}
        </nav>

      </div>
    </>
  )
}