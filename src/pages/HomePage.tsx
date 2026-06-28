import { useState, useCallback, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  TagIcon,
  CalendarDaysIcon,
  LightBulbIcon,
  AcademicCapIcon,
  TrophyIcon,
  StarIcon,
  ShieldCheckIcon,
  BoltIcon,
  ArrowRightIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import ThemeToggle from '../components/ui/ThemeToggle';
import { extractHandle, validateHandle } from '../utils/validators';
import { shake } from '../utils/motionVariants';

const FEATURES = [
  {
    icon: ChartBarIcon,
    label: 'Rating History',
    desc: 'Track your rating progress over time',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.12)',
  },
  {
    icon: TagIcon,
    label: 'Tag Analysis',
    desc: 'Discover your strengths and weaknesses',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.12)',
  },
  {
    icon: CalendarDaysIcon,
    label: 'Activity Heatmap',
    desc: 'Visualize your coding activity patterns',
    color: '#f472b6',
    bg: 'rgba(244,114,182,0.12)',
  },
  {
    icon: LightBulbIcon,
    label: 'AI Insights',
    desc: 'Get intelligent insights and recommendations',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.12)',
  },
  {
    icon: AcademicCapIcon,
    label: 'Practice Recommendations',
    desc: 'Find the best problems to improve',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.12)',
  },
  {
    icon: TrophyIcon,
    label: 'Achievements',
    desc: 'Unlock your coding milestones',
    color: '#22d3ee',
    bg: 'rgba(34,211,238,0.12)',
  },
];

// Pre-computed once at module load so the field is stable across renders
// (and avoids calling Math.random() during render).
const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 1.5 + 0.5,
  delay: Math.random() * 4,
  duration: Math.random() * 3 + 2,
}));

// Animated sparkle dots for background
function StarField() {
  const stars = STARS;

  return (
    <div className="cf-starfield">
      {stars.map((s) => (
        <div
          key={s.id}
          className="cf-star"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

// Fake mini rating chart lines (decorative left side)
function RatingChartDecor() {
  const points = [
    [0, 80], [60, 65], [120, 70], [180, 40], [240, 55],
    [300, 30], [360, 20], [420, 35], [480, 15], [520, 10],
  ];
  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');

  return (
    <div className="cf-chart-decor">
      <div className="cf-chart-label">
        <span className="cf-chart-label-title">Rating</span>
        <span className="cf-chart-label-val">2107</span>
        <span className="cf-chart-label-max">Max: 2345</span>
      </div>
      <svg viewBox="0 0 520 100" preserveAspectRatio="none" className="cf-chart-svg">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${path} L 520 100 L 0 100 Z`} fill="url(#chartFill)" />
        <path d={path} fill="none" stroke="url(#chartGrad)" strokeWidth="2" />
        <circle cx="480" cy="15" r="4" fill="#a855f7" />
        <circle cx="480" cy="15" r="7" fill="none" stroke="#a855f7" strokeOpacity="0.4" strokeWidth="2" />
      </svg>
    </div>
  );
}

// Donut decor for right side
function DonutDecor() {
  const r = 40, cx = 55, cy = 55;
  const circ = 2 * Math.PI * r;
  return (
    <div className="cf-donut-decor">
      <div className="cf-donut-label">
        <span className="cf-chart-label-title">Contests</span>
        <span className="cf-chart-label-val">145</span>
        <span className="cf-chart-label-max">Total</span>
      </div>
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="url(#donutGrad)"
          strokeWidth="10"
          strokeDasharray={`${circ * 0.72} ${circ * 0.28}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <defs>
          <linearGradient id="donutGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const handle = extractHandle(input.trim());
      const result = validateHandle(handle);
      if (!result.valid) {
        setError(result.error);
        setShakeKey((k) => k + 1);
        return;
      }
      setError(null);
      setLoading(true);
      navigate(`/user/${handle}`);
    },
    [input, navigate],
  );

  return (
    <>
      <style>{`
        /* ── reset / base ── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .cf-root {
          position: relative;
          min-height: 100vh;
          background: #05050f;
          color: #fff;
          font-family: 'Inter', 'Space Grotesk', system-ui, sans-serif;
          overflow-x: hidden;
          transition: background 0.3s ease, color 0.3s ease;
        }

        /* ── starfield ── */
        .cf-starfield {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }
        .cf-star {
          position: absolute;
          border-radius: 50%;
          background: #fff;
          opacity: 0;
          animation: twinkle linear infinite;
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.6; }
        }

        /* ── gradient blobs ── */
        .cf-blobs {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        .cf-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          animation: blobPulse 6s ease-in-out infinite alternate;
        }
        .cf-blob-1 { width: 500px; height: 500px; background: rgba(99,102,241,0.22); top: -120px; left: -100px; animation-delay: 0s; }
        .cf-blob-2 { width: 450px; height: 450px; background: rgba(168,85,247,0.18); bottom: -100px; right: -80px; animation-delay: 2s; }
        .cf-blob-3 { width: 350px; height: 350px; background: rgba(244,114,182,0.12); top: 35%; left: 50%; transform: translateX(-50%); animation-delay: 1s; }
        @keyframes blobPulse {
          from { opacity: 0.7; transform: scale(1); }
          to   { opacity: 1;   transform: scale(1.08); }
        }

        /* ── navbar ── */
        .cf-nav {
          position: relative;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 32px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(12px);
          background: rgba(5,5,15,0.5);
        }
        .cf-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.1rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        .cf-logo-icon {
          display: flex;
          gap: 3px;
          align-items: flex-end;
        }
        .cf-logo-bar {
          width: 5px;
          border-radius: 2px;
          background: linear-gradient(180deg, #818cf8, #6366f1);
        }
        .cf-logo-text span { color: #a78bfa; }
        .cf-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 999px;
          font-size: 0.78rem;
          color: rgba(255,255,255,0.7);
          background: rgba(255,255,255,0.04);
        }
        .cf-badge svg { width: 14px; height: 14px; color: #fbbf24; }

        /* ── main ── */
        .cf-main {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 64px 20px 80px;
          min-height: calc(100vh - 65px);
        }

        /* pill above title */
        .cf-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 6px 18px;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 999px;
          font-size: 0.78rem;
          color: rgba(255,255,255,0.55);
          background: rgba(255,255,255,0.04);
          margin-bottom: 28px;
          letter-spacing: 0.03em;
        }
        .cf-pill-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: rgba(255,255,255,0.25);
        }
        .cf-pill-bolt { width: 14px; height: 14px; color: #818cf8; }

        /* title */
        .cf-title {
          font-size: clamp(2.8rem, 7vw, 5.5rem);
          font-weight: 900;
          letter-spacing: -0.03em;
          text-align: center;
          line-height: 1.05;
          background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 40%, #f472b6 80%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 18px;
        }

        .cf-subtitle {
          max-width: 560px;
          text-align: center;
          color: rgba(255,255,255,0.5);
          font-size: clamp(0.9rem, 2vw, 1.05rem);
          line-height: 1.7;
          margin-bottom: 4px;
        }
        .cf-subtitle-accent {
          color: #a78bfa;
          font-weight: 600;
        }
        .cf-subtitle-accent2 {
          color: #f472b6;
          font-weight: 600;
        }

        /* decorative side elements */
        .cf-sides {
          position: relative;
          width: 100%;
          max-width: 1060px;
          display: flex;
          justify-content: center;
          margin-top: 36px;
        }
        .cf-chart-decor {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 4px;
          opacity: 0.35;
        }
        .cf-chart-svg {
          width: 180px;
          height: 60px;
        }
        .cf-chart-label {
          display: flex;
          flex-direction: column;
        }
        .cf-chart-label-title {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .cf-chart-label-val {
          font-size: 1.6rem;
          font-weight: 800;
          color: rgba(255,255,255,0.7);
          line-height: 1.1;
        }
        .cf-chart-label-max {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.3);
        }
        .cf-donut-decor {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          opacity: 0.35;
        }

        /* card / form */
        .cf-card {
          width: 100%;
          max-width: 580px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(16px);
          padding: 28px;
          z-index: 2;
        }
        .cf-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .cf-input-icon {
          position: absolute;
          left: 14px;
          width: 20px;
          height: 20px;
          color: rgba(255,255,255,0.3);
          pointer-events: none;
        }
        .cf-input {
          width: 100%;
          padding: 14px 14px 14px 44px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(10,10,30,0.7);
          color: #fff;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .cf-input::placeholder { color: rgba(255,255,255,0.25); }
        .cf-input:focus {
          border-color: rgba(129,140,248,0.6);
          box-shadow: 0 0 0 3px rgba(129,140,248,0.15);
        }
        .cf-hint {
          margin-top: 8px;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.28);
          padding-left: 4px;
        }
        .cf-error {
          margin-top: 6px;
          font-size: 0.8rem;
          color: #f87171;
          padding-left: 4px;
        }

        /* analyze button */
        .cf-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          margin-top: 14px;
          padding: 15px 24px;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
          cursor: pointer;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
          background-size: 200% 200%;
          animation: shimmer 3s ease infinite;
          transition: opacity 0.2s, transform 0.15s;
          letter-spacing: 0.01em;
          position: relative;
          overflow: hidden;
        }
        .cf-btn:hover { opacity: 0.92; transform: translateY(-1px); }
        .cf-btn:active { transform: translateY(0); }
        .cf-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .cf-btn-icon { width: 18px; height: 18px; }
        .cf-btn-arrow { width: 18px; height: 18px; margin-left: auto; }
        @keyframes shimmer {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* trust line */
        .cf-trust {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 14px;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.3);
        }
        .cf-trust svg { width: 13px; height: 13px; }
        .cf-trust-dot {
          width: 3px; height: 3px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
        }

        /* feature cards */
        .cf-features {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
          width: 100%;
          max-width: 920px;
          margin-top: 56px;
        }
        .cf-feat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 20px 12px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(8px);
          text-align: center;
          transition: transform 0.2s, border-color 0.2s, background 0.2s;
          cursor: default;
        }
        .cf-feat-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
        }
        .cf-feat-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 12px;
        }
        .cf-feat-icon { width: 22px; height: 22px; }
        .cf-feat-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: rgba(255,255,255,0.85);
          line-height: 1.3;
        }
        .cf-feat-desc {
          font-size: 0.68rem;
          color: rgba(255,255,255,0.35);
          line-height: 1.4;
        }

        /* ── footer ── */
        .cf-footer {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: 28px 20px 32px;
          border-top: 1px solid rgba(255,255,255,0.06);
          background: rgba(5,5,15,0.6);
          backdrop-filter: blur(12px);
        }
        .cf-footer-links {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .cf-footer-link {
          display: flex;
          align-items: center;
          gap: 7px;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          font-size: 0.82rem;
          font-weight: 500;
          padding: 6px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          transition: color 0.2s, border-color 0.2s, background 0.2s;
        }
        .cf-footer-link:hover {
          color: #a78bfa;
          border-color: rgba(167,139,250,0.35);
          background: rgba(167,139,250,0.08);
        }
        .cf-footer-link svg {
          width: 15px;
          height: 15px;
          flex-shrink: 0;
        }
        .cf-footer-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.28);
        }
        .cf-footer-dot {
          width: 3px; height: 3px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
        }
        .cf-footer-heart { color: #f472b6; }
        .cf-footer-version {
          display: inline-flex;
          align-items: center;
          padding: 2px 9px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          font-size: 0.7rem;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.04em;
        }

        /* ── responsive ── */
        @media (max-width: 1024px) {
          .cf-chart-decor, .cf-donut-decor { display: none; }
        }
        @media (max-width: 860px) {
          .cf-features { grid-template-columns: repeat(3, 1fr); }
          .cf-nav { padding: 14px 18px; }
        }
        @media (max-width: 520px) {
          .cf-features { grid-template-columns: repeat(2, 1fr); }
          .cf-main { padding: 40px 16px 60px; }
          .cf-card { padding: 20px; }
          .cf-title { font-size: 2.4rem; }
          .cf-footer-links { flex-wrap: wrap; justify-content: center; }
          .cf-footer-meta { flex-wrap: wrap; justify-content: center; text-align: center; }
        }

        /* ── light theme overrides (toggle-driven) ── */
        html.light .cf-root { background: #eef2f7; color: #0f172a; }
        html.light .cf-star { background: rgba(15,23,42,0.22); }
        html.light .cf-blob-1 { background: rgba(99,102,241,0.16); }
        html.light .cf-blob-2 { background: rgba(168,85,247,0.14); }
        html.light .cf-blob-3 { background: rgba(244,114,182,0.10); }
        html.light .cf-nav {
          background: rgba(255,255,255,0.7);
          border-bottom-color: rgba(15,23,42,0.08);
        }
        html.light .cf-logo-text { color: #0f172a; }
        html.light .cf-badge {
          border-color: rgba(15,23,42,0.12);
          color: rgba(15,23,42,0.7);
          background: rgba(15,23,42,0.04);
        }
        html.light .cf-pill {
          border-color: rgba(15,23,42,0.12);
          color: rgba(15,23,42,0.6);
          background: rgba(15,23,42,0.04);
        }
        html.light .cf-pill-dot { background: rgba(15,23,42,0.3); }
        html.light .cf-subtitle { color: rgba(15,23,42,0.6); }
        html.light .cf-chart-decor,
        html.light .cf-donut-decor { opacity: 0.5; }
        html.light .cf-chart-label-title { color: rgba(15,23,42,0.45); }
        html.light .cf-chart-label-val { color: rgba(15,23,42,0.7); }
        html.light .cf-chart-label-max { color: rgba(15,23,42,0.4); }
        html.light .cf-donut-decor circle:first-of-type { stroke: rgba(15,23,42,0.1); }
        html.light .cf-card {
          border-color: rgba(15,23,42,0.1);
          background: rgba(255,255,255,0.85);
          box-shadow: 0 8px 30px rgba(15,23,42,0.08);
        }
        html.light .cf-input {
          border-color: rgba(15,23,42,0.15);
          background: #ffffff;
          color: #0f172a;
        }
        html.light .cf-input::placeholder { color: rgba(15,23,42,0.4); }
        html.light .cf-input:focus {
          border-color: rgba(99,102,241,0.6);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
        }
        html.light .cf-input-icon { color: rgba(15,23,42,0.4); }
        html.light .cf-hint { color: rgba(15,23,42,0.45); }
        html.light .cf-error { color: #dc2626; }
        html.light .cf-trust { color: rgba(15,23,42,0.5); }
        html.light .cf-trust-dot { background: rgba(15,23,42,0.25); }
        html.light .cf-feat-card {
          border-color: rgba(15,23,42,0.08);
          background: rgba(255,255,255,0.82);
          box-shadow: 0 4px 16px rgba(15,23,42,0.05);
        }
        html.light .cf-feat-card:hover {
          border-color: rgba(15,23,42,0.16);
          background: #ffffff;
        }
        html.light .cf-feat-label { color: rgba(15,23,42,0.85); }
        html.light .cf-feat-desc { color: rgba(15,23,42,0.5); }
        html.light .cf-footer {
          background: rgba(255,255,255,0.7);
          border-top-color: rgba(15,23,42,0.08);
        }
        html.light .cf-footer-link {
          color: rgba(15,23,42,0.6);
          border-color: rgba(15,23,42,0.1);
          background: rgba(15,23,42,0.03);
        }
        html.light .cf-footer-link:hover {
          color: #6366f1;
          border-color: rgba(99,102,241,0.35);
          background: rgba(99,102,241,0.07);
        }
        html.light .cf-footer-meta { color: rgba(15,23,42,0.4); }
        html.light .cf-footer-dot { background: rgba(15,23,42,0.2); }
        html.light .cf-footer-version {
          border-color: rgba(15,23,42,0.1);
          background: rgba(15,23,42,0.04);
          color: rgba(15,23,42,0.45);
        }
      `}</style>

      <div className="cf-root">
        <StarField />
        <div className="cf-blobs">
          <div className="cf-blob cf-blob-1" />
          <div className="cf-blob cf-blob-2" />
          <div className="cf-blob cf-blob-3" />
        </div>

        {/* Navbar */}
        <nav className="cf-nav">
          <div className="cf-logo">
            <div className="cf-logo-icon">
              <div className="cf-logo-bar" style={{ height: 14 }} />
              <div className="cf-logo-bar" style={{ height: 20 }} />
              <div className="cf-logo-bar" style={{ height: 10 }} />
            </div>
            <span className="cf-logo-text">
              Codeforces <span>Insights</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="cf-badge">
              <StarIcon style={{ width: 14, height: 14, color: '#fbbf24' }} />
              Built for CP Enthusiasts
            </div>
            <ThemeToggle />
          </div>
        </nav>

        <main className="cf-main">
          {/* pill */}
          <motion.div
            className="cf-pill"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <BoltIcon className="cf-pill-bolt" />
            Data-Powered
            <div className="cf-pill-dot" />
            Beautiful
            <div className="cf-pill-dot" />
            Insightful
          </motion.div>

          {/* title */}
          <motion.h1
            className="cf-title"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Codeforces Insights
          </motion.h1>

          <motion.p
            className="cf-subtitle"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Unlock powerful analytics and beautiful visualizations for any Codeforces profile.
            Know your progress.{' '}
            <span className="cf-subtitle-accent">Improve.</span>{' '}
            <span className="cf-subtitle-accent2">Conquer.</span>
          </motion.p>

          {/* form inside side-decor wrapper */}
          <div className="cf-sides">
            <RatingChartDecor />
            <DonutDecor />

            <motion.div
              key={shakeKey}
              animate={error ? shake : undefined}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="cf-card"
            >
              <form onSubmit={handleSubmit}>
                <div className="cf-input-wrap">
                  <UserCircleIcon className="cf-input-icon" />
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => { setInput(e.target.value); setError(null); }}
                    placeholder="Enter handle or profile URL"
                    className="cf-input"
                    autoComplete="off"
                  />
                </div>
                {error
                  ? <p className="cf-error">{error}</p>
                  : <p className="cf-hint">Example: tourist or https://codeforces.com/profile/tourist</p>
                }
                <button
                  type="submit"
                  className="cf-btn"
                  disabled={loading}
                >
                  <BoltIcon className="cf-btn-icon" />
                  {loading ? 'Analyzing...' : 'Analyze'}
                  <ArrowRightIcon className="cf-btn-arrow" />
                </button>
              </form>

              <div className="cf-trust">
                <ShieldCheckIcon style={{ width: 13, height: 13 }} />
                100% Free
                <div className="cf-trust-dot" />
                No Login
                <div className="cf-trust-dot" />
                Instant Results
              </div>
            </motion.div>
          </div>

          {/* feature cards */}
          <div className="cf-features">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.label}
                  className="cf-feat-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.07 }}
                >
                  <div
                    className="cf-feat-icon-wrap"
                    style={{ background: f.bg }}
                  >
                    <Icon className="cf-feat-icon" style={{ color: f.color }} />
                  </div>
                  <span className="cf-feat-label">{f.label}</span>
                  <span className="cf-feat-desc">{f.desc}</span>
                </motion.div>
              );
            })}
          </div>
        </main>

        {/* Footer */}
        <footer className="cf-footer">
          <div className="cf-footer-links">
            {/* GitHub */}
            <a
              href="https://github.com/Santosh-Pathak/Codeforces-Profile-Visualizer"
              target="_blank"
              rel="noopener noreferrer"
              className="cf-footer-link"
              aria-label="GitHub repository"
            >
              {/* GitHub icon */}
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub
            </a>

            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/in/santosh-pathak-68a971214/"
              target="_blank"
              rel="noopener noreferrer"
              className="cf-footer-link"
              aria-label="LinkedIn profile"
            >
              {/* LinkedIn icon */}
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn
            </a>
          </div>

          <div className="cf-footer-meta">
            <span>Made with <span className="cf-footer-heart">♥</span> by Santosh Pathak</span>
            <div className="cf-footer-dot" />
            <span className="cf-footer-version">v1.0.0</span>
            <div className="cf-footer-dot" />
            <span>Open Source</span>
            <div className="cf-footer-dot" />
            <span>Powered by Codeforces API</span>
          </div>
        </footer>
      </div>
    </>
  );
}