import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ORDEM_TEMAS, type Tema } from '../hooks/useTema';

/**
 * Seletor de temas inspirado no TUI do qylock
 * (https://github.com/Darkkal44/qylock), sem a etapa de SDDM.
 */
type Props = {
  temaAtual: Tema;
  aoAplicar: (tema: Tema) => void;
  aoFechar: () => void;
};

const DETALHES: Record<Tema, { descricao: string; cor: string; fundo: string }> = {
  dark: {
    descricao: 'terminal escuro · âmbar',
    cor: '#e3b341',
    fundo: '#0d1117',
  },
  light: {
    descricao: 'terminal claro · azul',
    cor: '#0969da',
    fundo: '#ffffff',
  },
  system: {
    descricao: 'painéis de status · ciano',
    cor: '#38e1ff',
    fundo: '#030a17',
  },
  galactic_empire: {
    descricao: 'Império Galáctico · vermelho imperial',
    cor: '#d92c31',
    fundo: '#08090b',
  },
};

const TEMAS = ORDEM_TEMAS.map((id) => ({ id, ...DETALHES[id] }));

export function SeletorTemas({ temaAtual, aoAplicar, aoFechar }: Props) {
  const [indice, setIndice] = useState(() =>
    Math.max(
      0,
      TEMAS.findIndex((t) => t.id === temaAtual),
    ),
  );
  const listaRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    listaRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const lista = listaRef.current;
    const item = lista?.children[indice] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [indice]);

  function mover(delta: number) {
    setIndice((i) => (i + delta + TEMAS.length) % TEMAS.length);
  }

  function aoTeclar(e: KeyboardEvent<HTMLElement>) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        mover(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        mover(-1);
        break;
      case 'Home':
        e.preventDefault();
        setIndice(0);
        break;
      case 'End':
        e.preventDefault();
        setIndice(TEMAS.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        aoAplicar(TEMAS[indice].id);
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        aoFechar();
        break;
      case 'Tab':
        // O seletor funciona como um command palette: o foco fica nele.
        e.preventDefault();
        break;
      default:
        break;
    }
  }

  return (
    <div
      className="temas-overlay"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <section
        className="temas-painel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="temas-titulo"
        onKeyDown={aoTeclar}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          listaRef.current?.focus({ preventScroll: true });
        }}
      >
        <header className="temas-header">
          <div className="temas-header-titulo" id="temas-titulo">
            <span className="temas-ornamento" aria-hidden="true">
              ✦
            </span>
            <span>Theme Setup</span>
            <span className="temas-ornamento" aria-hidden="true">
              ✦
            </span>
          </div>
          <p className="temas-header-sub">seletor de temas do portfólio</p>
        </header>

        <div className="temas-info">
          <p className="temas-info-titulo">
            <span aria-hidden="true">✦</span> temas disponíveis
          </p>
          <p className="temas-info-linha">
            <span aria-hidden="true">❯</span> {TEMAS.length} estilos carregados
          </p>
          <p className="temas-info-linha">
            <span aria-hidden="true">❯</span> use as setas e Enter para selecionar
          </p>
          <p className="temas-info-ok">
            <span aria-hidden="true">✔</span> sistema pronto
          </p>
        </div>

        <div className="temas-seletor">
          <div className="temas-prompt">
            <span className="temas-prompt-label">Select theme:</span>
            <span className="temas-prompt-valor">{TEMAS[indice].id}</span>
            <span className="temas-prompt-cursor" aria-hidden="true" />
          </div>
          <p className="temas-contagem">
            {indice + 1}/{TEMAS.length}
          </p>
          <p className="temas-instrucao">Use ↑ ↓ e Enter para selecionar</p>

          <ul
            className="temas-lista"
            role="listbox"
            aria-label="Temas disponíveis"
            aria-activedescendant={`tema-${TEMAS[indice].id}`}
            tabIndex={0}
            ref={listaRef}
          >
            {TEMAS.map((t, i) => (
              <li
                key={t.id}
                id={`tema-${t.id}`}
                role="option"
                aria-selected={i === indice}
                className={`temas-opcao${i === indice ? ' temas-opcao--ativa' : ''}`}
                onMouseEnter={() => setIndice(i)}
                onClick={() => aoAplicar(t.id)}
              >
                <span
                  className="temas-swatch"
                  style={{
                    background: t.fundo,
                    boxShadow: `inset 0 -3px 0 ${t.cor}`,
                  }}
                  aria-hidden="true"
                />
                <span className="temas-texto">
                  <span className="temas-nome">{t.id}</span>
                  <span className="temas-descricao">{t.descricao}</span>
                </span>
                {t.id === temaAtual && (
                  <span className="temas-atual">
                    <span aria-hidden="true">✔</span> atual
                  </span>
                )}
              </li>
            ))}
          </ul>

          <div className="temas-rodape">
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd> navegar
            </span>
            <span>
              <kbd>Enter</kbd> aplicar
            </span>
            <span>
              <kbd>Esc</kbd> fechar
            </span>
            <button
              type="button"
              className="temas-fechar"
              onClick={aoFechar}
              aria-label="Fechar seletor de temas"
            >
              ✕ fechar
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
