import { perfil, formacao } from '../data/portfolio';

export function About() {
  return (
    <section className="secao">
      <h2 className="secao-titulo">
        <span className="text-gray">##</span> sobre
      </h2>

      <div className="sobre-grid">
        <div className="sobre-bio">
          {perfil.bio.map((paragrafo, i) => (
            <p key={i}>{paragrafo}</p>
          ))}
        </div>

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
      </div>
    </section>
  );
}
