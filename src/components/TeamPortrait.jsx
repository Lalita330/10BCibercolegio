import { useState } from 'react'

export default function TeamPortrait({ person }) {
  const [imageAvailable, setImageAvailable] = useState(true)

  return (
    <article className={`team-member team-member-${person.position}`}>
      <div className="portrait-frame">
        {imageAvailable ? (
          <img
            src={`${import.meta.env.BASE_URL}${person.image.replace(/^\/+/, '')}`}
            alt={`Retrato de ${person.name}`}
            onError={() => setImageAvailable(false)}
          />
        ) : (
          <div className="portrait-placeholder" aria-hidden="true">
            <span className="silhouette-head" />
            <span className="silhouette-body" />
          </div>
        )}
        <span className="portrait-orbit" aria-hidden="true" />
      </div>
      <div className="member-copy">
        <span className="member-role">Representante 10B</span>
        <h2>{person.name}</h2>
      </div>
    </article>
  )
}
