import { perfil, formacao, trajetoria } from '../data/portfolio';
import { CabecalhoSecao } from '../components/CabecalhoSecao';

export function About() {
  return (
    <section className="secao">
      <CabecalhoSecao
        titulo="sobre"
        subtitulo={`${perfil.titulo} · ${perfil.cidade}`}
      />

      <div className="sobre-grid">
        <div className="sobre-bio texto-corrido">
          {perfil.bio.map((paragrafo, i) => (
            <p key={i}>{paragrafo}</p>
          ))}
        </div>

        <aside className="sobre-lateral">
          <div className="sobre-card">
            <h3 className="card-titulo">formação</h3>
            {formacao.map((f) => (
              <div key={f.titulo} className="formacao-item">
                <strong>{f.titulo}</strong>
                <span className="text-gray">{f.local}</span>
                <span className="text-accent">{f.periodo}</span>
              </div>
            ))}
          </div>

          {trajetoria.length > 0 && (
            <div className="sobre-card">
              <h3 className="card-titulo">trajetória</h3>
              <ol className="timeline">
                {trajetoria.map((t) => (
                  <li key={`${t.quando}-${t.titulo}`} className="timeline-item">
                    <span className="timeline-quando">{t.quando}</span>
                    <span className="timeline-titulo">{t.titulo}</span>
                    {t.detalhe && <span className="timeline-detalhe">{t.detalhe}</span>}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
