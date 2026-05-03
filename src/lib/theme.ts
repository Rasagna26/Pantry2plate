export function initTheme() {
  const stored = localStorage.getItem('pantry2plate-theme')
  if (stored === 'light') return
  if (stored === 'dark' || window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark')
  }
}

export function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark')
  localStorage.setItem('pantry2plate-theme', isDark ? 'dark' : 'light')
  return isDark
}

export function isDarkMode() {
  return document.documentElement.classList.contains('dark')
}

// Initialize on load
initTheme()
