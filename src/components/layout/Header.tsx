import { Link, useLocation } from 'react-router-dom'
import { Moon, Sun, UtensilsCrossed } from 'lucide-react'
import { cn } from '../../lib/cn'
import { toggleTheme, isDarkMode } from '../../lib/theme'
import { useState } from 'react'

const navItems = [
  { path: '/', label: 'Spin' },
  { path: '/recipes', label: 'Browse' },
  { path: '/pantry', label: 'Pantry' },
  { path: '/favorites', label: 'Favorites' },
  { path: '/preferences', label: 'Settings' },
]

export function Header() {
  const location = useLocation()
  const [dark, setDark] = useState(isDarkMode())

  return (
    <header className="hidden lg:flex items-center justify-between px-6 py-3 border-b border-border bg-surface-secondary/50 backdrop-blur-sm sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2 no-underline">
        <UtensilsCrossed className="w-6 h-6 text-turmeric" />
        <span className="font-heading text-xl font-bold text-text-primary">
          Pantry2Plate
        </span>
      </Link>

      <nav className="flex items-center gap-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors no-underline',
              location.pathname === item.path
                ? 'bg-turmeric/10 text-turmeric'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-tertiary',
            )}
          >
            {item.label}
          </Link>
        ))}

        <button
          onClick={() => setDark(toggleTheme())}
          className="ml-2 p-2 rounded-lg hover:bg-surface-tertiary transition-colors text-text-secondary"
          aria-label="Toggle theme"
        >
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </nav>
    </header>
  )
}
