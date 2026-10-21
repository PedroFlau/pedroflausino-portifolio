import { habilidades } from '../data/portfolio';

export function Skills() {
  return (
    <section className="secao">
      <h2 className="secao-titulo">
        habilidades
      </h2>

      <div className="skills-grid">
        {habilidades.map((grupo) => (
          <div key={grupo.grupo} className="skills-card">
            <h3 className="card-titulo">{grupo.grupo}</h3>
            <div className="tags">
              {grupo.itens.map((item) => (
                <span key={item} className="tag">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
