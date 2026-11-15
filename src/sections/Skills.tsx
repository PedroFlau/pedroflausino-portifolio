import { useMemo, useState } from 'react';
import { SkillsAtom, type HabilidadeAtomo } from '../components/SkillsAtom';
import { habilidades } from '../data/portfolio';
import { useTema } from '../hooks/useTema';
import './Skills.css';

type Visao = 'atomo' | 'lista';

const TODAS = 'Todas';

/** `Front-end` → `front-end`; mesmo slug usado em `SkillsAtom`. */
function slug(grupo: string): string {
  return grupo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');
}

function IconeAtomo() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="12" cy="12" rx="9.5" ry="4" />
      <ellipse cx="12" cy="12" rx="9.5" ry="4" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9.5" ry="4" transform="rotate(120 12 12)" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconeLista() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3.5" y="3.5" width="7" height="7" />
      <rect x="13.5" y="3.5" width="7" height="7" />
      <rect x="3.5" y="13.5" width="7" height="7" />
      <rect x="13.5" y="13.5" width="7" height="7" />
    </svg>
  );
}

export function Skills() {
  const { tema } = useTema();
  const [filtro, setFiltro] = useState<string>(TODAS);
  const [visao, setVisao] = useState<Visao>('atomo');

  const total = habilidades.reduce((soma, grupo) => soma + grupo.itens.length, 0);
  const filtros = [
    { rotulo: TODAS, contagem: total },
    ...habilidades.map((grupo) => ({
      rotulo: grupo.grupo,
      contagem: grupo.itens.length,
    })),
  ];

  const grupos = habilidades.filter(
    (grupo) => filtro === TODAS || grupo.grupo === filtro,
  );

  // O átomo recebe TODAS as skills (as 3 órbitas sempre existem). Vem de um
  // useMemo para o efeito do átomo não reiniciar a cada render.
  const todas: HabilidadeAtomo[] = useMemo(
    () =>
      habilidades.flatMap((grupo) =>
        grupo.itens.map((item) => ({
          nome: item.nome,
          grupo: grupo.grupo,
          icone: item.icone,
          link: item.link,
        })),
      ),
    [],
  );

  return (
    <section className="secao skills-section">
      <h2 className="secao-titulo">habilidades</h2>

      <div className="skills-toolbar">
        <div
          className="skills-chips"
          role="group"
          aria-label="Filtrar habilidades por categoria"
        >
          {filtros.map((opcao) => (
            <button
              key={opcao.rotulo}
              type="button"
              className="skills-chip"
              data-grupo={slug(opcao.rotulo)}
              aria-pressed={filtro === opcao.rotulo}
              onClick={() => setFiltro(opcao.rotulo)}
            >
              <span className="skills-chip-dot" aria-hidden="true" />
              <span>{opcao.rotulo}</span>
              <span className="skills-chip-contagem" aria-hidden="true">
                {opcao.contagem}
              </span>
            </button>
          ))}
        </div>

        <div
          className="skills-view"
          role="group"
          aria-label="Modo de visualização"
        >
          <button
            type="button"
            aria-pressed={visao === 'atomo'}
            aria-label="Átomo"
            title="Átomo"
            onClick={() => setVisao('atomo')}
          >
            <IconeAtomo />
          </button>
          <button
            type="button"
            aria-pressed={visao === 'lista'}
            aria-label="Ver como lista"
            title="Lista"
            onClick={() => setVisao('lista')}
          >
            <IconeLista />
          </button>
        </div>
      </div>

      {visao === 'atomo' ? (
        <div className="skills-visao">
          <SkillsAtom
            skills={todas}
            grupoAtivo={filtro === TODAS ? null : filtro}
            tema={tema}
          />
          <p className="skills-hint">
            Arraste para girar · clique num elétron para abrir a documentação
          </p>
        </div>
      ) : (
        <div className="skills-grid">
          {grupos.map((grupo) => (
            <div key={grupo.grupo} className="skills-card">
              <h3 className="card-titulo">{grupo.grupo}</h3>
              <div className="tags">
                {grupo.itens.map((item) => (
                  <span key={item.nome} className="tag">
                    {item.nome}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
