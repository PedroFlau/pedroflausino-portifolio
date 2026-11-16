import { FiExternalLink } from 'react-icons/fi';
import { SiGithub } from 'react-icons/si';
import { projetos, type Projeto } from '../data/portfolio';
import { CabecalhoSecao } from '../components/CabecalhoSecao';

/** Prévia gerada (janela de terminal) para projetos sem screenshot. */
function PreviaGerada({ projeto }: { projeto: Projeto }) {
  return (
    <div className="projeto-previa projeto-previa--gerada" aria-hidden="true">
      <div className="projeto-previa-barra">
        <span />
        <span />
        <span />
        <code>~/{projeto.repo}</code>
      </div>
      <div className="projeto-previa-corpo">
        <code>
          <span className="text-accent">$</span> git clone {projeto.repo}
        </code>
        <code className="text-gray">{projeto.tecnologias.join(' · ')}</code>
      </div>
    </div>
  );
}

export function Projects() {
  return (
    <section className="secao">
      <CabecalhoSecao
        titulo="projetos"
        subtitulo="O que já construí, sozinho e em equipe"
        meta={`${projetos.length} ${projetos.length === 1 ? 'projeto' : 'projetos'}`}
      />

      <div className="projetos-grid">
        {projetos.map((p) => {
          // O card inteiro leva ao destino principal: a demo, se houver; senão o código
          const destino = p.demo ?? p.link;
          return (
            <article key={p.nome} className="projeto-card">
              {p.imagem ? (
                <img className="projeto-previa" src={p.imagem} alt="" loading="lazy" />
              ) : (
                <PreviaGerada projeto={p} />
              )}

              <div className="projeto-corpo">
                <div className="projeto-meta">
                  <span className={`selo selo--${p.status === 'no ar' ? 'ok' : 'neutro'}`}>
                    {p.status}
                  </span>
                  <span className="text-gray">
                    {p.ano} · {p.papel}
                  </span>
                </div>

                <h3 className="projeto-nome">
                  {destino ? (
                    <a
                      className="projeto-nome-link"
                      href={destino}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {p.nome}
                    </a>
                  ) : (
                    p.nome
                  )}
                </h3>

                <p className="projeto-descricao texto-corrido">{p.descricao}</p>

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
                        className="botao-icone botao-icone--primario"
                        href={p.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FiExternalLink aria-hidden="true" /> ver demo
                      </a>
                    )}
                    {p.link && (
                      <a
                        className="botao-icone"
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <SiGithub aria-hidden="true" /> código
                      </a>
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
