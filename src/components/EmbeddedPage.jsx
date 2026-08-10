import { useEffect, useRef, useState } from 'react'

export default function EmbeddedPage({ page }) {
  const [loaded, setLoaded] = useState(false)
  const [slow, setSlow] = useState(false)
  const timeoutRef = useRef(null)
  const contentType = page.provider.includes('Forms') ? 'formulario' : 'contenido'

  useEffect(() => {
    setLoaded(false)
    setSlow(false)
    timeoutRef.current = window.setTimeout(() => setSlow(true), 8000)
    return () => window.clearTimeout(timeoutRef.current)
  }, [page.embedUrl])

  function handleLoad() {
    window.clearTimeout(timeoutRef.current)
    setLoaded(true)
    setSlow(false)
  }

  return (
    <section className={`embed-page accent-${page.accent}`}>
      <div className="page-intro page-container">
        <div>
          <p className="eyebrow"><span />{page.eyebrow}</p>
          <h1>{page.title}</h1>
        </div>
        <div className="intro-aside">
          <p>{page.description}</p>
          <span className="provider-label">Servicio externo · {page.provider}</span>
        </div>
      </div>

      <div className="embed-wrap page-container">
        <div className={`embed-status${loaded ? ' is-loaded' : ''}`} aria-live="polite">
          <span className="status-dot" />
          {loaded ? 'Contenido conectado' : 'Conectando de forma segura…'}
        </div>
        <div className={`embed-compat${slow ? ' is-prominent' : ''}`}>
          <div>
            <strong>{slow ? `¿No aparece el ${contentType}?` : 'Vista integrada'}</strong>
            <p>Si tu navegador bloquea servicios externos, usa el acceso directo.</p>
          </div>
          <a
            className="embed-direct-link"
            href={page.directUrl}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
          >
            Abrir {contentType} <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="iframe-shell">
          {!loaded && (
            <div className="embed-loader" aria-hidden="true">
              <span className="loader-mark">10B</span>
              <span className="loader-line" />
              <span className="loader-line short" />
            </div>
          )}
          <iframe
            src={page.embedUrl}
            title={page.title}
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
            referrerPolicy="strict-origin-when-cross-origin"
            loading="lazy"
            onLoad={handleLoad}
          />
        </div>

      </div>
    </section>
  )
}
