import { projetos } from '../data/portfolio';

export function Projects() {
  return (
    <section className="secao">
      <h2 className="secao-titulo">
        <span className="text-gray">##</span> projetos
      </h2>

      <div className="projetos-grid">
        {projetos.map((p) => (
          <article key={p.nome} className="projeto-card">
            <h3 className="projeto-nome">
              <span className="text-accent">▸</span> {p.nome}
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
          </article>
        ))}
      </div>
    </section>
  );
}
