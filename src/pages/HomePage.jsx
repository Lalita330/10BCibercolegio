import { Link } from 'react-router-dom'
import TeamPortrait from '../components/TeamPortrait'
import { team } from '../data/site'

const resources = [
  { number: '01', title: 'Permisos', copy: 'Solicitudes y autorizaciones', to: '/permisos', tone: 'brown' },
  { number: '02', title: 'Soporte', copy: 'Ayuda con accesos y plataformas', to: '/soporte', tone: 'purple' },
  { number: '03', title: 'Propuestas', copy: 'Ideas para construir en equipo', to: '/propuestas', tone: 'gold' },
  { number: '04', title: 'Quejas', copy: 'Un canal claro y responsable', to: '/quejas', tone: 'brown' },
  { number: '05', title: 'Cartas anónimas', copy: 'Mensajes para 10B', to: '/cartas-anonimas', tone: 'purple' },
  { number: '06', title: 'Horario', copy: 'Clases y recordatorios locales', to: '/horario', tone: 'gold' },
  { number: '07', title: 'Circulares', copy: 'Información institucional 2026', to: '/circulares', tone: 'brown' },
]

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-grain" aria-hidden="true" />
        <div className="hero-orb hero-orb-one" aria-hidden="true" />
        <div className="hero-orb hero-orb-two" aria-hidden="true" />
        <div className="hero-inner page-container">
          <div className="hero-copy">
            <p className="eyebrow"><span />Curso 10B · 2026</p>
            <h1>Un espacio seguro<br /><em>para el mejor grupo</em></h1>
            <p className="hero-lead">
              Aquí encuentras el horario, las propuestas y los avisos del curso, sin estar sufriendo.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/propuestas">
                Compartir una propuesta <span aria-hidden="true">↗</span>
              </Link>
              <Link className="text-link" to="/horario">
                Ver horario <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div className="podium" aria-label="Representantes de 10B">
            {team.map((person) => <TeamPortrait key={person.name} person={person} />)}
            <div className="podium-line" aria-hidden="true"><span>Equipo 10B</span></div>
          </div>
        </div>
        <div className="hero-foot page-container">
          <p>10B — 2026</p>
          <span className="hero-foot-line" />
          <span>Escuchar · Representar · Construir</span>
        </div>
      </section>

      <section className="resources-section">
        <div className="section-heading page-container">
          <p className="eyebrow eyebrow-dark"><span />Todo en un mismo lugar</p>
          <div className="heading-row">
            <h2>Espacios de 10B</h2>
            <p>Accesos directos para que cada gestión tome menos tiempo y cada voz encuentre su canal.</p>
          </div>
        </div>
        <div className="resource-grid page-container">
          {resources.map((resource) => (
            <Link className={`resource-card tone-${resource.tone}`} to={resource.to} key={resource.to}>
              <span className="resource-number">{resource.number}</span>
              <div>
                <h3>{resource.title}</h3>
                <p>{resource.copy}</p>
              </div>
              <span className="resource-arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="trust-section">
        <div className="trust-inner page-container">
          <div className="trust-mark" aria-hidden="true">
            <span className="trust-ring" />
            <span>10B</span>
          </div>
          <div className="trust-copy">
            <p className="eyebrow"><span />Privacidad desde el diseño</p>
            <h2>Tu información no vive aquí.</h2>
            <p>
              Los formularios se comunican directamente con sus plataformas oficiales. Este sitio no tiene cuentas, bases de datos ni seguimiento de estudiantes.
            </p>
          </div>
          <div className="trust-facts">
            <div><strong>0</strong><span>bases de datos propias</span></div>
            <div><strong>100%</strong><span>preferencias en tu dispositivo</span></div>
          </div>
        </div>
      </section>
    </>
  )
}
