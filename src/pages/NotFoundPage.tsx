import { Link } from 'react-router-dom'
import { ArrowUpRight, Sparkles, BookOpen, Heart } from 'lucide-react'
import { useSeo } from '../lib/useSeo'

const navTiles = [
  {
    to: '/',
    icon: Sparkles,
    label: 'Home',
    blurb: 'Pull the spinner',
    accent: 'text-turmeric bg-turmeric/10',
  },
  {
    to: '/recipes',
    icon: BookOpen,
    label: 'Browse recipes',
    blurb: '150+ from the kitchen',
    accent: 'text-coriander bg-coriander/10',
  },
  {
    to: '/favorites',
    icon: Heart,
    label: 'Favorites',
    blurb: 'Your saved dishes',
    accent: 'text-chili bg-chili/10',
  },
] as const

export function NotFoundPage() {
  useSeo({
    title: '404 — Page not found | Pantry2Plate',
    description: 'The page you were looking for is not on the menu.',
    noIndex: true,
  })

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center">
        <Emblem />

        <p className="text-xs uppercase tracking-[0.25em] text-text-muted font-semibold mt-6 mb-3">
          Error 404
        </p>
        <h1 className="font-display-italic text-5xl sm:text-6xl font-extrabold leading-none mb-4 text-gradient-warm tracking-tight">
          Off the menu.
        </h1>
        <p className="text-text-muted leading-relaxed mb-8">
          The page you're looking for doesn't exist — maybe a typo, maybe it
          was retired.
        </p>

        <nav className="flex flex-col gap-2.5 text-left">
          {navTiles.map(({ to, icon: Icon, label, blurb, accent }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-3 p-3 rounded-xl bg-surface-secondary border border-border hover:border-turmeric/50 hover:bg-surface-tertiary transition-all no-underline"
            >
              <span
                className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${accent} transition-transform group-hover:scale-105`}
              >
                <Icon className="w-5 h-5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-text-primary">
                  {label}
                </span>
                <span className="block text-xs text-text-muted mt-0.5">
                  {blurb}
                </span>
              </span>
              <ArrowUpRight className="w-4 h-4 text-text-muted group-hover:text-turmeric group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0" />
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}

// The brand emblem — the favicon's fork+knife disc, with a single steam
// wisp drifting up from behind. Tells the dinner story in one glance.
function Emblem() {
  return (
    <svg
      viewBox="0 0 160 200"
      width="120"
      height="150"
      className="mx-auto"
      role="img"
      aria-label="Pantry2Plate emblem"
    >
      <defs>
        <linearGradient id="nf-disc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
      </defs>

      {/* Steam wisp behind the disc */}
      <path
        d="M 80 10 C 70 24, 92 36, 80 56"
        stroke="#a8a29e"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
        className="nf-steam"
      />

      {/* Brand disc */}
      <g transform="translate(80, 120)">
        <circle r="56" fill="url(#nf-disc)" />
        <g fill="white">
          <g transform="translate(-12, 0) rotate(-15)">
            <rect x="-1.5" y="-26" width="3" height="30" rx="1.5" />
            <rect x="-7" y="-26" width="3" height="12" rx="1.5" />
            <rect x="4" y="-26" width="3" height="12" rx="1.5" />
            <rect x="-7" y="-14" width="14" height="3" rx="1.5" />
            <rect x="-1.5" y="4" width="3" height="22" rx="1.5" />
          </g>
          <g transform="translate(12, 0) rotate(15)">
            <path d="M-1.5,-26 Q-2,-14 -4,-2 L-1.5,4 L1.5,4 Q2,-14 1.5,-26 Z" />
            <rect x="-1.5" y="4" width="3" height="22" rx="1.5" />
          </g>
        </g>
      </g>

      <style>{`
        @keyframes nf-steam-rise {
          0%   { transform: translateY(4px); opacity: 0.2; }
          50%  { opacity: 0.7; }
          100% { transform: translateY(-6px); opacity: 0.2; }
        }
        .nf-steam { animation: nf-steam-rise 3.5s ease-in-out infinite; transform-origin: center; }
        @media (prefers-reduced-motion: reduce) {
          .nf-steam { animation: none; }
        }
      `}</style>
    </svg>
  )
}
