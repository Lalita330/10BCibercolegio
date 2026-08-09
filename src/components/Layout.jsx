import { useEffect, useLayoutEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { navigation } from '../data/site'

const THEME_STORAGE_KEY = 'representacion10b.theme.v2'

function readTheme() {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function Brand() {
  return (
    <NavLink className="brand" to="/" aria-label="Ir a la portada">
      <span className="brand-mark" aria-hidden="true">10B</span>
      <span className="brand-copy">
        <strong>Representación</strong>
        <small>Cibercolegio UCN · 2026</small>
      </span>
    </NavLink>
  )
}

function NavItems({ onNavigate }) {
  return navigation.map((item) => (
    <NavLink
      key={item.path}
      to={item.path}
      end={item.path === '/'}
      onClick={onNavigate}
      className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
    >
      <span className="nav-index" aria-hidden="true">{item.icon}</span>
      <span>{item.shortLabel ?? item.label}</span>
    </NavLink>
  ))
}

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState(readTheme)
  const location = useLocation()

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // El tema sigue funcionando durante la sesión aunque el almacenamiento esté bloqueado.
    }
    const frame = window.requestAnimationFrame(() => {
      document.documentElement.classList.add('theme-ready')
    })
    return () => window.cancelAnimationFrame(frame)
  }, [theme])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen)
    return () => document.body.classList.remove('menu-open')
  }, [menuOpen])

  return (
    <div className="site-shell">
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Navegación principal">
            <NavItems />
          </nav>
          <div className="header-actions">
            <button
              className={`theme-toggle is-${theme}`}
              type="button"
              aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
              title={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
              aria-pressed={theme === 'light'}
              onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
            >
              <span className="theme-icon theme-icon-sun" aria-hidden="true">☼</span>
              <span className="theme-icon theme-icon-moon" aria-hidden="true">☾</span>
              <span className="sr-only">Tema {theme === 'dark' ? 'oscuro' : 'claro'}</span>
            </button>
            <button
              className="menu-button"
              type="button"
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              onClick={() => setMenuOpen((current) => !current)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <div
        className={`menu-scrim${menuOpen ? ' is-open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
      <nav
        id="mobile-navigation"
        className={`mobile-nav${menuOpen ? ' is-open' : ''}`}
        aria-label="Navegación móvil"
        aria-hidden={!menuOpen}
      >
        <div className="mobile-nav-heading">
          <span>Explorar el sitio</span>
          <span className="mobile-nav-rule" />
        </div>
        <NavItems onNavigate={() => setMenuOpen(false)} />
        <p className="mobile-nav-note">Ocho espacios. Un solo punto de encuentro para 10B.</p>
      </nav>

      <main id="contenido">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <span className="footer-kicker">Equipo de Representación</span>
            <p>Curso 10B · Cibercolegio UCN · 2026</p>
          </div>
          <p className="privacy-note">
            Este sitio no recopila respuestas ni datos personales. Las preferencias de avisos permanecen únicamente en este dispositivo.
          </p>
          <NavLink to="/" className="footer-mark" aria-label="Volver al inicio">10B</NavLink>
        </div>
      </footer>
    </div>
  )
}
