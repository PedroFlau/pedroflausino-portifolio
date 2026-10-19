import { projetos } from '../data/portfolio';

export function Projects() {
  return (
    <section className="secao">
      <h2 className="secao-titulo">
        <span className="text-gray">##</span> projetos
      </h2>

      <div className="projetos-grid">
        {projetos.map((p) => (
          <article
            key={p.nome}
            className={`projeto-card${p.demo ? ' projeto-card--clicavel' : ''}`}
          >
            <h3 className="projeto-nome">
              <span className="text-accent">▸</span>{' '}
              {p.demo ? (
                <a
                  className="projeto-nome-link"
                  href={p.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {p.nome}
                </a>
              ) : (
                p.nome
              )}
            </h3>
            <p className="projeto-descricao">{p.descricao}</p>

            {p.tecnologias.length > 0 && (
              <div className="tags">
                {p.tecnologias.map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))}
              </div>
            )}

            {(p.link || p.demo) && (
              <div className="projeto-links">
                {p.demo && (
                  <a
                    className="projeto-link"
                    href={p.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ver demo ↗
                  </a>
                )}
                {p.link && (
                  <a
                    className="projeto-link"
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ver no github ↗
                  </a>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
