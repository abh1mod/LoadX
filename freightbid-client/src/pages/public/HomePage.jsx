import React, { Component, useEffect, useRef, useState } from 'react';
import { Link, useInRouterContext } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import {
  Truck,
  ShieldCheck,
  TrendingDown,
  Clock,
  ArrowRight,
  Star,
  CheckCircle,
  Building,
  Quote
} from 'lucide-react';
import api from '../../api/axios';

/* ==========================================================================
   LoadX home page
   Everything this page needs (Navbar, Button, Card, RatingStars, formatters,
   styles) lives in this file. The only outside dependencies are React,
   react-router-dom, lucide-react and the project's axios instance.
   ========================================================================== */

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */

const asArray = (value) => (Array.isArray(value) ? value : []);

const toText = (value) =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : '';

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  } catch (err) {
    return date.toLocaleString();
  }
};

const formatNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString('en-IN') : '0';
};

const formatINR = (value) => `₹${formatNumber(value)}`;

const formatClock = (totalSeconds) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const minutes = String(Math.floor(s / 60)).padStart(2, '0');
  const seconds = String(s % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const getInitials = (name) => {
  const parts = toText(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'LX';
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
};

const EMPTY_HOME = {
  stats: { suppliersCount: 0, transportersCount: 0, totalShipments: 0, deliveredShipments: 0 },
  topRatedTransporters: [],
  recentReviews: []
};

const normalizeHome = (raw) => {
  const source = raw && typeof raw === 'object' ? raw : {};
  const stats = source.stats && typeof source.stats === 'object' ? source.stats : {};
  return {
    stats: { ...EMPTY_HOME.stats, ...stats },
    topRatedTransporters: asArray(source.topRatedTransporters).filter(Boolean),
    recentReviews: asArray(source.recentReviews).filter(Boolean)
  };
};

/* --------------------------------------------------------------------------
   Styles (self-contained, every class is prefixed with lx-)
   -------------------------------------------------------------------------- */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&display=swap');

.lx-root {
  --ink: #0F1B33;
  --ink-soft: #1B2A4A;
  --green: #0C7A57;
  --green-deep: #075C40;
  --mint: #E1F0E8;
  --gold: #F4B21B;
  --sand: #FBF0CF;
  --mist: #E4E9F3;
  --signal: #D9462F;
  --paper: #F5F6F3;
  --white: #FFFFFF;
  --line: #DCE1D9;
  --muted: #56647C;
  --focus: var(--green);
  --maxw: 1180px;
  --gutter: clamp(20px, 4vw, 40px);
  font-family: 'Bricolage Grotesque', 'Segoe UI', system-ui, -apple-system, sans-serif;
  font-optical-sizing: auto;
  color: var(--ink);
  background: var(--paper);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  color-scheme: light;
}

:where(.lx-root, .lx-root *, .lx-root *::before, .lx-root *::after) { box-sizing: border-box; }
:where(.lx-root) :where(h1, h2, h3, h4, p, ul, ol, figure, blockquote) { margin: 0; padding: 0; }
:where(.lx-root) :where(ul, ol) { list-style: none; }
:where(.lx-root) :where(a) { color: inherit; }

@media (prefers-reduced-motion: no-preference) {
  html { scroll-behavior: smooth; }
}

.lx-root :focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }

.lx-wrap {
  width: 100%;
  max-width: var(--maxw);
  margin: 0 auto;
  padding: 0 var(--gutter);
}

/* ---------- Buttons ---------- */
.lx-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font: inherit;
  font-weight: 600;
  line-height: 1;
  border: 1.5px solid transparent;
  border-radius: 999px;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  transition: background-color .15s ease, color .15s ease, border-color .15s ease;
}
.lx-btn-sm { padding: 10px 18px; font-size: 14px; }
.lx-btn-md { padding: 13px 24px; font-size: 15px; }
.lx-btn-lg { padding: 17px 30px; font-size: 16px; }
.lx-btn-primary { background: var(--ink); color: #fff; }
.lx-btn-primary:hover { background: var(--green); }
.lx-btn-secondary { background: transparent; color: var(--ink); border-color: #B5BEB2; }
.lx-btn-secondary:hover { border-color: var(--ink); background: rgba(15, 27, 51, .04); }
.lx-btn-outline { background: #fff; color: var(--ink); border-color: var(--ink); }
.lx-btn-outline:hover { background: var(--ink); color: #fff; }
.lx-btn-ghost { background: transparent; color: var(--ink); }
.lx-btn-ghost:hover { background: rgba(15, 27, 51, .06); }
.lx-btn-gold { background: var(--gold); color: var(--ink); }
.lx-btn-gold:hover { background: #fff; }

/* ---------- Navbar ---------- */
.lx-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(245, 246, 243, .86);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid transparent;
  transition: border-color .2s ease;
}
.lx-nav[data-scrolled="true"] { border-bottom-color: var(--line); }
.lx-nav-inner { height: 68px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.lx-logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -.03em;
  text-decoration: none;
  color: var(--ink);
}
.lx-logo-mark {
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background: var(--ink);
  color: var(--gold);
  display: grid;
  place-items: center;
}
.lx-nav-links { display: flex; gap: 30px; }
.lx-nav-links a { color: var(--muted); font-weight: 500; font-size: 15px; text-decoration: none; transition: color .15s ease; }
.lx-nav-links a:hover { color: var(--ink); }
.lx-nav-actions { display: flex; align-items: center; gap: 6px; }

/* ---------- Hero ---------- */
.lx-hero { padding: clamp(36px, 6vw, 84px) 0 clamp(48px, 7vw, 88px); }
.lx-hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.14fr) minmax(0, .86fr);
  gap: clamp(32px, 5vw, 64px);
  align-items: center;
}
.lx-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px 8px 12px;
  border-radius: 999px;
  background: var(--mint);
  color: var(--green-deep);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
}
.lx-h1 {
  margin-top: 24px;
  font-size: clamp(36px, 4.6vw, 60px);
  line-height: 1.04;
  letter-spacing: -.04em;
  font-weight: 800;
  text-wrap: balance;
}
.lx-hero-text {
  margin-top: 24px;
  max-width: 54ch;
  text-wrap: pretty;
  font-size: clamp(17px, 1.5vw, 19px);
  line-height: 1.6;
  color: var(--muted);
}
.lx-actions { margin-top: 36px; display: flex; flex-wrap: wrap; gap: 12px; }

/* ---------- Card ---------- */
.lx-card { border-radius: 24px; padding: 28px; }
.lx-card-mint { background: var(--mint); }
.lx-card-sand { background: var(--sand); }
.lx-card-mist { background: var(--mist); }
.lx-card-white { background: #fff; border: 1px solid var(--line); }
.lx-card-night { background: var(--ink); color: #fff; }

/* ---------- Live lot (hero) ---------- */
.lx-lot {
  --row: 62px;
  --focus: var(--gold);
  padding: 24px;
  border-radius: 28px;
  box-shadow: 0 40px 70px -40px rgba(15, 27, 51, .6);
  overflow: hidden;
}
.lx-lot-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 16px; }
.lx-lot-route { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; font-size: 24px; font-weight: 700; letter-spacing: -.025em; line-height: 1.15; }
.lx-lot-route svg { color: var(--gold); flex: none; }
.lx-lot-chips { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px; }
.lx-chip { padding: 5px 11px; border-radius: 999px; background: rgba(255, 255, 255, .09); color: #C6D0E6; font-size: 13px; font-weight: 500; }
.lx-clock { text-align: left; }
.lx-clock-time { display: inline-flex; align-items: center; gap: 8px; font-size: 32px; font-weight: 700; line-height: 1; color: var(--gold); font-variant-numeric: tabular-nums; }
.lx-clock-label { margin-top: 6px; padding-left: 30px; font-size: 13px; color: #9FB0D0; }
.lx-ladder { position: relative; margin-top: 24px; }
.lx-bid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: calc(var(--row) - 8px);
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 0 18px;
  border-radius: 16px;
  background: rgba(255, 255, 255, .06);
  transition: transform .75s cubic-bezier(.2, .8, .2, 1), background-color .4s ease;
}
.lx-bid[data-lead="true"] { background: rgba(12, 122, 87, .34); box-shadow: inset 0 0 0 1px rgba(110, 215, 170, .55); }
.lx-rank { font-weight: 700; color: #8EA0C4; font-variant-numeric: tabular-nums; }
.lx-bid[data-lead="true"] .lx-rank { color: #86E5BD; }
.lx-bid-name { font-weight: 600; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lx-bid-rate { position: relative; font-weight: 700; font-size: 18px; text-align: right; font-variant-numeric: tabular-nums; }
.lx-delta { position: absolute; right: 0; top: calc(100% - 1px); font-size: 12px; font-weight: 600; line-height: 1.2; color: var(--gold); white-space: nowrap; animation: lx-drop 2.6s ease forwards; }
@keyframes lx-drop {
  0% { opacity: 0; transform: translateY(-5px); }
  10% { opacity: 1; transform: none; }
  80% { opacity: 1; }
  100% { opacity: 0; }
}
.lx-lot-note { margin-top: 20px; display: flex; align-items: center; gap: 8px; font-size: 13px; color: #9FB0D0; }

/* ---------- Stat ledger ---------- */
.lx-ledger { border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.lx-ledger-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); }
.lx-stat { padding: 30px 24px 30px 0; }
.lx-stat + .lx-stat { padding-left: 28px; border-left: 1px solid var(--line); }
.lx-stat-num { font-size: clamp(34px, 4.2vw, 52px); font-weight: 800; line-height: 1; letter-spacing: -.04em; font-variant-numeric: tabular-nums; }
.lx-stat-label { margin-top: 12px; display: flex; align-items: center; gap: 8px; font-size: 15px; color: var(--muted); }
.lx-stat-label svg { color: var(--green); flex: none; }

/* ---------- Sections ---------- */
.lx-section { padding: clamp(64px, 9vw, 120px) 0; }
.lx-band { background: #fff; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.lx-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 24px; }
.lx-head-copy { max-width: 700px; }
.lx-h2 { font-size: clamp(30px, 4vw, 48px); line-height: 1.05; letter-spacing: -.035em; font-weight: 800; text-wrap: balance; }
.lx-lede { margin-top: 16px; max-width: 64ch; font-size: clamp(16px, 1.4vw, 18px); line-height: 1.6; color: var(--muted); text-wrap: pretty; }

/* ---------- How it works ---------- */
.lx-route { position: relative; margin-top: 60px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 32px; }
.lx-route::before { content: ''; position: absolute; top: 27px; left: 28px; right: 28px; border-top: 3px dashed #B9C2B5; }
.lx-step { position: relative; display: flex; flex-direction: column; gap: 24px; }
.lx-node {
  position: relative;
  z-index: 1;
  flex: none;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  box-shadow: 0 0 0 8px var(--paper);
}
.lx-step[data-tone="green"] .lx-node { background: var(--green); }
.lx-step[data-tone="gold"] .lx-node { background: var(--gold); color: var(--ink); }
.lx-step[data-tone="ink"] .lx-node { background: var(--ink); }
.lx-step-card { flex: 1; padding: 30px; }
.lx-step-icon { display: block; margin-bottom: 22px; color: var(--ink); opacity: .75; }
.lx-step h3 { font-size: 24px; line-height: 1.15; letter-spacing: -.025em; font-weight: 700; }
.lx-step p { margin-top: 12px; font-size: 16px; line-height: 1.6; color: #3E4C66; }

/* ---------- Carrier roster ---------- */
.lx-roster { margin-top: 48px; border-top: 1px solid var(--line); }
.lx-carrier {
  display: grid;
  grid-template-columns: minmax(0, 2.2fr) minmax(0, 1.2fr) minmax(0, 1.7fr) auto;
  grid-template-areas: "id metrics tags rating";
  align-items: center;
  gap: 24px;
  padding: 22px 12px;
  border-bottom: 1px solid var(--line);
  transition: background-color .15s ease;
}
.lx-carrier:hover { background: #F6F7F4; }
.lx-carrier-id { grid-area: id; display: flex; align-items: center; gap: 16px; min-width: 0; }
.lx-avatar { flex: none; width: 50px; height: 50px; border-radius: 15px; display: grid; place-items: center; font-weight: 700; font-size: 16px; background: var(--mint); color: var(--green-deep); }
.lx-carrier-name { min-width: 0; }
.lx-carrier-name strong { display: block; font-size: 17px; font-weight: 700; letter-spacing: -.01em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lx-carrier-name span { display: block; margin-top: 3px; font-size: 14px; color: var(--muted); }
.lx-carrier-metrics { grid-area: metrics; display: flex; gap: 32px; }
.lx-carrier-metrics strong { display: block; font-size: 18px; font-weight: 700; font-variant-numeric: tabular-nums; }
.lx-carrier-metrics span { display: block; margin-top: 2px; font-size: 13px; color: var(--muted); }
.lx-tags { grid-area: tags; display: flex; flex-wrap: wrap; gap: 6px; }
.lx-tag { padding: 5px 11px; border-radius: 9px; background: #EEF1EB; color: #3E4C66; font-size: 13px; font-weight: 500; }
.lx-rating { grid-area: rating; display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 999px; background: var(--sand); color: #6E4A00; font-size: 15px; font-weight: 700; font-variant-numeric: tabular-nums; }
.lx-rating svg { color: #E8A200; }

/* ---------- Stars ---------- */
.lx-stars { display: inline-flex; gap: 2px; vertical-align: middle; }
.lx-star { position: relative; display: inline-block; line-height: 0; }
.lx-star-fill { position: absolute; top: 0; left: 0; height: 100%; overflow: hidden; }
.lx-star-fill svg { display: block; max-width: none; }

/* ---------- Reviews ---------- */
.lx-featured { margin-top: 48px; max-width: 900px; }
.lx-featured .lx-quote-icon { color: var(--gold); }
.lx-featured blockquote { margin-top: 18px; font-size: clamp(22px, 2.8vw, 34px); line-height: 1.32; letter-spacing: -.02em; font-weight: 500; text-wrap: pretty; }
.lx-featured figcaption { margin-top: 28px; display: grid; gap: 4px; font-size: 15px; color: var(--muted); }
.lx-cap-top { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; margin-bottom: 10px; font-size: 14px; }
.lx-featured figcaption strong, .lx-quote strong { color: var(--ink); font-weight: 700; font-size: 16px; }
.lx-link-tone { color: var(--green-deep); font-weight: 600; }
.lx-quotes { margin-top: 56px; display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 40px 32px; }
.lx-quote { display: flex; flex-direction: column; justify-content: space-between; gap: 18px; padding-top: 22px; border-top: 2px solid var(--ink); }
.lx-quote-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 13px; color: var(--muted); }
.lx-quote p { margin-top: 14px; font-size: 16px; line-height: 1.6; color: #2C3A55; display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
.lx-quote-by { font-size: 14px; color: var(--muted); display: grid; gap: 3px; }
.lx-quote-by span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ---------- Empty and loading ---------- */
.lx-empty { margin-top: 48px; padding: 56px 24px; text-align: center; border: 1.5px dashed #C2CABF; border-radius: 24px; color: var(--muted); font-size: 16px; }
.lx-empty svg { display: block; margin: 0 auto 14px; color: #9AA597; }
.lx-skel { display: block; height: 14px; border-radius: 7px; background: var(--line); animation: lx-pulse 1.4s ease-in-out infinite; }
@keyframes lx-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }

/* ---------- Call to action ---------- */
.lx-cta { --focus: var(--gold); position: relative; overflow: hidden; background: var(--ink); color: #fff; padding: clamp(64px, 9vw, 112px) 0 clamp(96px, 12vw, 148px); }
.lx-cta::after { content: ''; position: absolute; left: 0; right: 0; bottom: clamp(32px, 5vw, 56px); border-top: 3px dashed rgba(244, 178, 27, .55); }
.lx-cta-grid { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 40px; align-items: end; }
.lx-cta h2 { font-size: clamp(32px, 5vw, 60px); line-height: 1.02; letter-spacing: -.04em; font-weight: 800; text-wrap: balance; }
.lx-cta p { margin-top: 20px; max-width: 48ch; font-size: 18px; line-height: 1.6; color: #BCC7DE; }
.lx-cta-actions { display: flex; justify-content: flex-end; }

/* ---------- Footer ---------- */
.lx-footer { --focus: var(--gold); background: var(--ink); color: #9FB0D0; border-top: 1px solid rgba(255, 255, 255, .08); padding: 28px 0; font-size: 14px; }
.lx-footer-inner { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; }
.lx-footer .lx-logo { color: #fff; font-size: 18px; }
.lx-footer .lx-logo-mark { width: 30px; height: 30px; border-radius: 9px; background: rgba(255, 255, 255, .1); }
.lx-footer p { max-width: 60ch; line-height: 1.5; }

/* ---------- Responsive ---------- */
@media (max-width: 960px) {
  .lx-hero-grid { grid-template-columns: minmax(0, 1fr); }
  .lx-cta-grid { grid-template-columns: minmax(0, 1fr); align-items: start; }
  .lx-cta-actions { justify-content: flex-start; }
}
@media (max-width: 860px) {
  .lx-nav-links { display: none; }
  .lx-route { grid-template-columns: minmax(0, 1fr); gap: 28px; }
  .lx-route::before { top: 28px; bottom: 28px; left: 27px; right: auto; border-top: 0; border-left: 3px dashed #B9C2B5; }
  .lx-step { flex-direction: row; align-items: flex-start; gap: 20px; }
  .lx-carrier {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: "id rating" "metrics metrics" "tags tags";
    gap: 14px 16px;
    padding: 20px 4px;
  }
}
@media (max-width: 720px) {
  .lx-ledger-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .lx-stat:nth-child(3) { padding-left: 0; border-left: 0; }
  .lx-stat:nth-child(n + 3) { border-top: 1px solid var(--line); }
}
@media (max-width: 520px) {
  .lx-hide-xs { display: none; }
  .lx-lot { padding: 18px; }
  .lx-bid { grid-template-columns: 22px minmax(0, 1fr) auto; gap: 10px; padding: 0 14px; }
  .lx-step-card { padding: 24px; }
}
@media (prefers-reduced-motion: reduce) {
  .lx-bid { transition: none; }
  .lx-skel { animation: none; }
  .lx-delta { animation: none; opacity: 1; }
}
`;

/* --------------------------------------------------------------------------
   Small building blocks (formerly separate files)
   -------------------------------------------------------------------------- */

/* Link that also works when the page is rendered outside a Router. */
const SafeLink = ({ to, children, ...rest }) => {
  const inRouter = useInRouterContext();
  if (inRouter) {
    return (
      <Link to={to} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={to} {...rest}>
      {children}
    </a>
  );
};

const Button = ({ variant = 'primary', size = 'md', to, className = '', type = 'button', children, ...rest }) => {
  const classes = `lx-btn lx-btn-${variant} lx-btn-${size} ${className}`.trim();
  if (to) {
    return (
      <SafeLink to={to} className={classes} {...rest}>
        {children}
      </SafeLink>
    );
  }
  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
};

const Card = ({ tone = 'white', className = '', children, ...rest }) => (
  <div className={`lx-card lx-card-${tone} ${className}`.trim()} {...rest}>
    {children}
  </div>
);

const RatingStars = ({ rating = 0, size = 'md' }) => {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));
  const px = size === 'sm' ? 14 : 18;
  return (
    <span className="lx-stars" role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className="lx-star" style={{ width: px, height: px }} aria-hidden="true">
            <Star size={px} color="#D3D9CF" fill="#D3D9CF" />
            <span className="lx-star-fill" style={{ width: `${fill * 100}%` }}>
              <Star size={px} color="#E8A200" fill="#F4B21B" />
            </span>
          </span>
        );
      })}
    </span>
  );
};

const Logo = () => (
  <span className="lx-logo">
    <span className="lx-logo-mark" aria-hidden="true">
      <Truck size={20} />
    </span>
    LoadX
  </span>
);

/* Keeps one bad record from blanking the whole page. */
class SectionBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('A home page section failed to render:', error);
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

const EmptyState = ({ icon: Icon, children }) => (
  <div className="lx-empty">
    {Icon ? <Icon size={28} aria-hidden="true" /> : null}
    {children}
  </div>
);

/* --------------------------------------------------------------------------
   Hero: illustrative live auction
   -------------------------------------------------------------------------- */

const ROW_HEIGHT = 62;
const LOT_SECONDS = 274;
const RATE_FLOOR = 96000;

const INITIAL_BIDS = [
  { id: 'kaveri', name: 'Kaveri Carriers', rate: 104800 },
  { id: 'northline', name: 'Northline Logistics', rate: 106500 },
  { id: 'rudra', name: 'Rudra Fleet Services', rate: 107900 },
  { id: 'meridian', name: 'Meridian Haulage', rate: 109400 },
  { id: 'tapti', name: 'Tapti Transport Co.', rate: 111200 }
];

const nextBidState = (bids) => {
  const index = Math.floor(Math.random() * bids.length);
  const target = bids[index];
  const drop = (4 + Math.floor(Math.random() * 14)) * 100;
  const rate = Math.max(RATE_FLOOR, target.rate - drop);
  if (rate === target.rate) return { bids, event: null };
  const updated = bids.map((bid, i) => (i === index ? { ...bid, rate } : bid));
  return { bids: updated, event: { id: target.id, amount: target.rate - rate, n: Date.now() } };
};

const LiveLot = () => {
  const [seconds, setSeconds] = useState(LOT_SECONDS);
  const [bids, setBids] = useState(INITIAL_BIDS);
  const [event, setEvent] = useState(null);
  const bidsRef = useRef(INITIAL_BIDS);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;

    let remaining = LOT_SECONDS;
    let tick = 0;
    const timer = setInterval(() => {
      tick += 1;
      remaining -= 1;
      if (remaining <= 0) {
        remaining = LOT_SECONDS;
        bidsRef.current = INITIAL_BIDS;
        setBids(INITIAL_BIDS);
        setEvent(null);
      } else if (tick % 3 === 0) {
        const next = nextBidState(bidsRef.current);
        bidsRef.current = next.bids;
        setBids(next.bids);
        setEvent(next.event);
      }
      setSeconds(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const ranked = [...bids].sort((a, b) => a.rate - b.rate);
  const rankOf = {};
  ranked.forEach((bid, index) => {
    rankOf[bid.id] = index;
  });

  return (
    <Card tone="night" className="lx-lot" role="group" aria-label="Illustrative live auction">
      <div className="lx-lot-head">
        <div>
          <div className="lx-lot-route">
            Ludhiana
            <ArrowRight size={22} aria-hidden="true" />
            Nagpur
          </div>
          <div className="lx-lot-chips">
            <span className="lx-chip">24 tonnes</span>
            <span className="lx-chip">Steel coils</span>
            <span className="lx-chip">32 ft multi-axle</span>
          </div>
        </div>
        <div className="lx-clock">
          <div className="lx-clock-time">
            <Clock size={22} aria-hidden="true" />
            {formatClock(seconds)}
          </div>
          <div className="lx-clock-label">until hard close</div>
        </div>
      </div>

      <div className="lx-ladder" style={{ height: ROW_HEIGHT * bids.length }}>
        {bids.map((bid) => {
          const rank = rankOf[bid.id];
          return (
            <div
              key={bid.id}
              className="lx-bid"
              data-lead={rank === 0}
              style={{ transform: `translateY(${rank * ROW_HEIGHT}px)` }}
            >
              <span className="lx-rank">{rank + 1}</span>
              <span className="lx-bid-name">{bid.name}</span>
              <span className="lx-bid-rate">
                {formatINR(bid.rate)}
                {event && event.id === bid.id ? (
                  <span key={event.n} className="lx-delta">
                    {'−'}
                    {formatINR(event.amount)}
                  </span>
                ) : null}
              </span>
            </div>
          );
        })}
      </div>

      <p className="lx-lot-note">
        <TrendingDown size={16} aria-hidden="true" />
        Illustrative lot with simulated bids
      </p>
    </Card>
  );
};

/* --------------------------------------------------------------------------
   Page sections
   -------------------------------------------------------------------------- */

const STEPS = [
  {
    tone: 'green',
    card: 'mint',
    icon: Building,
    title: 'Shippers post loads',
    text:
      'Verified manufacturers specify pickup and drop locations, cargo weight, vehicle category, and exact bidding start and hard-close timestamps.'
  },
  {
    tone: 'gold',
    card: 'sand',
    icon: TrendingDown,
    title: 'Live reverse bidding',
    text:
      'Carriers compete live in real time. Transporters see ranks and competitors updated instantaneously, adjusting rates freely before the window closes.'
  },
  {
    tone: 'ink',
    card: 'mist',
    icon: Truck,
    title: 'Award and milestone tracking',
    text:
      'Shippers award to any bidder upon auction close. The awarded carrier logs sequential transit milestones until final delivery, followed by star rating reviews.'
  }
];

const CarrierSkeleton = () => (
  <li className="lx-carrier" aria-hidden="true">
    <div className="lx-carrier-id">
      <span className="lx-avatar" style={{ background: 'var(--line)' }} />
      <div style={{ flex: 1 }}>
        <span className="lx-skel" style={{ width: '60%' }} />
        <span className="lx-skel" style={{ width: '38%', marginTop: 10 }} />
      </div>
    </div>
    <div className="lx-carrier-metrics">
      <span className="lx-skel" style={{ width: 90 }} />
    </div>
    <div className="lx-tags">
      <span className="lx-skel" style={{ width: 120 }} />
    </div>
    <span className="lx-skel" style={{ width: 64, height: 34, borderRadius: 17 }} />
  </li>
);

const CarrierRow = ({ carrier }) => {
  const title = toText(carrier.companyName || carrier.name) || 'Unnamed carrier';
  const place = [carrier.city, carrier.state].map(toText).filter(Boolean).join(', ');
  const rating = Number(carrier.avgRating);
  const fleet = Number(carrier.fleetSize);
  const fleetCount = Number.isFinite(fleet) ? fleet : 0;
  const reviewCount = Number(carrier.reviewCount);
  const vehicles = asArray(carrier.vehicleTypes).map(toText).filter(Boolean);
  const shown = vehicles.slice(0, 4);
  const extra = vehicles.length - shown.length;

  return (
    <li className="lx-carrier">
      <div className="lx-carrier-id">
        <span className="lx-avatar" aria-hidden="true">
          {getInitials(carrier.name || carrier.companyName)}
        </span>
        <div className="lx-carrier-name">
          <strong title={title}>{title}</strong>
          {place ? <span>{place}</span> : null}
        </div>
      </div>

      <div className="lx-carrier-metrics">
        <div>
          <strong>{formatNumber(fleetCount)}</strong>
          <span>{fleetCount === 1 ? 'truck' : 'trucks'}</span>
        </div>
        <div>
          <strong>{formatNumber(Number.isFinite(reviewCount) ? reviewCount : 0)}</strong>
          <span>reviews</span>
        </div>
      </div>

      <div className="lx-tags">
        {shown.map((vehicle) => (
          <span key={vehicle} className="lx-tag">
            {vehicle}
          </span>
        ))}
        {extra > 0 ? <span className="lx-tag">+{extra}</span> : null}
      </div>

      <div className="lx-rating" aria-label={Number.isFinite(rating) && rating > 0 ? `Rated ${rating.toFixed(1)} out of 5` : 'No rating yet'}>
        <Star size={16} fill="currentColor" aria-hidden="true" />
        {Number.isFinite(rating) && rating > 0 ? rating.toFixed(1) : 'New'}
      </div>
    </li>
  );
};

const ReviewMeta = ({ review }) => (
  <>
    <strong>{toText(review.supplierName) || 'Verified shipper'}</strong>
    {review.transporterName ? (
      <span>
        Carrier: <b className="lx-link-tone">{toText(review.transporterName)}</b>
      </span>
    ) : null}
    {review.shipmentTitle ? <span>Cargo: {toText(review.shipmentTitle)}</span> : null}
  </>
);

const ReviewsBlock = ({ reviews }) => {
  const [featured, ...others] = reviews;
  return (
    <>
      <figure className="lx-featured">
        <Quote className="lx-quote-icon" size={44} aria-hidden="true" />
        <blockquote>{toText(featured.comment) || 'Delivered as agreed.'}</blockquote>
        <figcaption>
          <div className="lx-cap-top">
            <RatingStars rating={featured.rating} />
            <span>{formatDateTime(featured.createdAt)}</span>
          </div>
          <ReviewMeta review={featured} />
        </figcaption>
      </figure>

      {others.length > 0 ? (
        <ul className="lx-quotes">
          {others.map((review, index) => (
            <li key={toText(review._id) || `review-${index}`} className="lx-quote">
              <div>
                <div className="lx-quote-top">
                  <RatingStars rating={review.rating} size="sm" />
                  <span>{formatDateTime(review.createdAt)}</span>
                </div>
                <p>{toText(review.comment) || 'Delivered as agreed.'}</p>
              </div>
              <div className="lx-quote-by">
                <ReviewMeta review={review} />
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
};

/* --------------------------------------------------------------------------
   Page
   -------------------------------------------------------------------------- */

export const HomePage = () => {
  const [data, setData] = useState(EMPTY_HOME);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchHomeData = async () => {
      try {
        const res = await api.get('/public/home');
        if (active && res && res.data && res.data.success) {
          setData(normalizeHome(res.data.data));
        }
      } catch (err) {
        console.error('Failed to load home page data:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchHomeData();
    return () => {
      active = false;
    };
  }, []);

  const { stats, topRatedTransporters, recentReviews } = data;

  const statItems = [
    { key: 'delivered', icon: CheckCircle, value: loading ? '–' : `${formatNumber(stats.deliveredShipments)}+`, label: 'Delivered shipments' },
    { key: 'carriers', icon: Truck, value: loading ? '–' : formatNumber(stats.transportersCount), label: 'Verified carriers' },
    { key: 'shippers', icon: Building, value: loading ? '–' : formatNumber(stats.suppliersCount), label: 'Industrial shippers' },
    { key: 'live', icon: Clock, value: 'Live', label: 'Real-time bidding' }
  ];

  const sectionFallback = (
    <EmptyState>This section could not be displayed. Refresh the page to try again.</EmptyState>
  );

  return (
    <div className="lx-root">
      <style>{STYLES}</style>
      <Navbar />

      <main>
        {/* Hero */}
        <section className="lx-hero">
          <div className="lx-wrap lx-hero-grid">
            <div>
              <span className="lx-pill">
                <ShieldCheck size={18} aria-hidden="true" />
                Verified Indian B2B freight bidding platform
              </span>
              <h1 className="lx-h1">Real-time freight auctions for enterprise shippers and carriers</h1>
              <p className="lx-hero-text">
                Eliminate freight broker commissions. Suppliers publish full truckload consignments with strict
                hard-close windows; verified transporters bid live with sub-second ranking transparency.
              </p>
              <div className="lx-actions">
                <Button to="/register" size="lg">
                  Register as shipper or carrier
                  <ArrowRight size={18} aria-hidden="true" />
                </Button>
                <Button to="/login" variant="secondary" size="lg">
                  Sign in to workspace
                </Button>
              </div>
            </div>
            <LiveLot />
          </div>
        </section>

        {/* Stats */}
        <section className="lx-ledger" aria-label="Platform activity">
          <div className="lx-wrap lx-ledger-grid">
            {statItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.key} className="lx-stat">
                  <div className="lx-stat-num">{item.value}</div>
                  <div className="lx-stat-label">
                    <Icon size={18} aria-hidden="true" />
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section className="lx-section" id="how-it-works">
          <div className="lx-wrap">
            <div className="lx-head-copy">
              <h2 className="lx-h2">How LoadX operates</h2>
              <p className="lx-lede">
                Transparent, contract-grade digital logistics procurement in three clear roles.
              </p>
            </div>

            <div className="lx-route">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="lx-step" data-tone={step.tone}>
                    <span className="lx-node" aria-hidden="true">
                      {index + 1}
                    </span>
                    <Card tone={step.card} className="lx-step-card">
                      <Icon className="lx-step-icon" size={26} aria-hidden="true" />
                      <h3>{step.title}</h3>
                      <p>{step.text}</p>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Top rated transporters */}
        <section className="lx-section lx-band" id="carriers">
          <div className="lx-wrap">
            <div className="lx-head">
              <div className="lx-head-copy">
                <h2 className="lx-h2">Top-rated transporters</h2>
                <p className="lx-lede">
                  Vetted fleet operators ranked by on-time delivery ratings and verified reviews.
                </p>
              </div>
              <Button to="/register" variant="outline" size="md">
                Join transporter network
              </Button>
            </div>

            <SectionBoundary fallback={sectionFallback}>
              {loading ? (
                <ul className="lx-roster">
                  <CarrierSkeleton />
                  <CarrierSkeleton />
                  <CarrierSkeleton />
                </ul>
              ) : topRatedTransporters.length === 0 ? (
                <EmptyState icon={Truck}>Transporter performance rankings are being aggregated.</EmptyState>
              ) : (
                <ul className="lx-roster">
                  {topRatedTransporters.map((carrier, index) => (
                    <CarrierRow key={toText(carrier._id) || `carrier-${index}`} carrier={carrier} />
                  ))}
                </ul>
              )}
            </SectionBoundary>
          </div>
        </section>

        {/* Reviews */}
        <section className="lx-section" id="reviews">
          <div className="lx-wrap">
            <div className="lx-head-copy">
              <h2 className="lx-h2">Shipper reviews and feedback</h2>
              <p className="lx-lede">
                Genuine post-delivery reviews recorded on completed consignment contracts.
              </p>
            </div>

            <SectionBoundary fallback={sectionFallback}>
              {loading ? (
                <div className="lx-featured" aria-hidden="true">
                  <span className="lx-skel" style={{ width: '80%', height: 22, marginBottom: 14 }} />
                  <span className="lx-skel" style={{ width: '60%', height: 22 }} />
                </div>
              ) : recentReviews.length === 0 ? (
                <EmptyState icon={Quote}>Completed delivery reviews will appear here.</EmptyState>
              ) : (
                <ReviewsBlock reviews={recentReviews} />
              )}
            </SectionBoundary>
          </div>
        </section>

        {/* Call to action */}
        <section className="lx-cta">
          <div className="lx-wrap lx-cta-grid">
            <div>
              <h2>Ready to modernize your freight procurement?</h2>
              <p>
                Join India&rsquo;s most dependable digital freight auction platform today. Fast onboarding with
                administrator verification.
              </p>
            </div>
            <div className="lx-cta-actions">
              <Button to="/register" variant="gold" size="lg">
                Register your fleet or factory
                <ArrowRight size={18} aria-hidden="true" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="lx-footer">
        <div className="lx-wrap lx-footer-inner">
          <Logo />
          <p>
            &copy; {new Date().getFullYear()} LoadX Logistics Exchange. All rights reserved. Built for Indian
            freight and fleet operations.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;