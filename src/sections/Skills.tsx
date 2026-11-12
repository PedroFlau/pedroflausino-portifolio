import { useState } from 'react';
import { SkillsGlobe, type HabilidadeGlobo } from '../components/SkillsGlobe';
import { habilidades } from '../data/portfolio';
import { useTema } from '../hooks/useTema';
import './Skills.css';

type Visao = 'globo' | 'lista';

const TODAS = 'Todas';

/** `Front-end` → `front-end`; mesmo slug usado em `SkillsGlobe`. */
function slug(grupo: string): string {
  return grupo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');
}

function IconeGlobo() {
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
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3 12h18M4.5 7.5h15M4.5 16.5h15" />
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
  const [visao, setVisao] = useState<Visao>('globo');

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

  // O globo recebe a lista achatada; a visão lista mantém os cards por grupo.
  const filtradas: HabilidadeGlobo[] = grupos.flatMap((grupo) =>
    grupo.itens.map((item) => ({
      nome: item.nome,
      grupo: grupo.grupo,
      icone: item.icone,
      link: item.link,
    })),
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
            aria-pressed={visao === 'globo'}
            aria-label="Ver como globo"
            title="Globo"
            onClick={() => setVisao('globo')}
          >
            <IconeGlobo />
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

      {visao === 'globo' ? (
        <div className="skills-visao">
          <SkillsGlobe key={filtro} skills={filtradas} tema={tema} />
          <p className="skills-hint">
            Arraste para girar · clique num ícone para abrir a documentação
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
