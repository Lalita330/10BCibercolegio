import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="not-found page-container">
      <span className="not-found-code">404</span>
      <p className="eyebrow"><span />Página no encontrada</p>
      <h1>Este camino no forma parte del mapa.</h1>
      <p>Vuelve a la portada para encontrar todos los espacios disponibles de 10B.</p>
      <Link className="button button-primary" to="/">Regresar al inicio</Link>
    </section>
  )
}
