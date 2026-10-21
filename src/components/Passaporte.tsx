import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { paisesVisitados } from '../data/portfolio';

/** Carimbos por página e por "trama" (as duas páginas abertas). */
const POR_PAGINA = 2;
const POR_TRAMA = POR_PAGINA * 2;

const TINTAS = ['#1f4e8c', '#8c2f39', '#2f6e4f', '#6b4a8c'];
const ROTACOES = [-6, 4, -3, 6, -5, 2, 5, -2];

function dividir<T>(lista: T[], tamanho: number): T[][] {
  const paginas: T[][] = [];
  for (let i = 0; i < lista.length; i += tamanho) {
    paginas.push(lista.slice(i, i + tamanho));
  }
  return paginas.length > 0 ? paginas : [[]];
}

function Carimbo({ pais, indice }: { pais: string; indice: number }) {
  const estilo = {
    '--tinta': TINTAS[indice % TINTAS.length],
    '--rotacao': `${ROTACOES[indice % ROTACOES.length]}deg`,
  } as CSSProperties;

  return (
    <span className="passaporte-carimbo" style={estilo}>
      <span className="passaporte-carimbo-pais">{pais}</span>
      <span className="passaporte-carimbo-info">✈ visitado</span>
    </span>
  );
}

export function Passaporte({ onFechar }: { onFechar: () => void }) {
  const paginas = dividir(paisesVisitados, POR_TRAMA);
  const [indice, setIndice] = useState(0);
  const fecharRef = useRef<HTMLButtonElement | null>(null);

  const anterior = () => setIndice((i) => Math.max(0, i - 1));
  const proxima = () => setIndice((i) => Math.min(paginas.length - 1, i + 1));

  useEffect(() => {
    fecharRef.current?.focus();

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
      if (e.key === 'ArrowRight') proxima();
      if (e.key === 'ArrowLeft') anterior();
    };
    document.addEventListener('keydown', aoTeclar);

    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener('keydown', aoTeclar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFechar, paginas.length]);

  const base = indice * POR_TRAMA;
  const esquerda = paginas[indice].slice(0, POR_PAGINA);
  const direita = paginas[indice].slice(POR_PAGINA);

  return (
    <div
      className="passaporte-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Passaporte de viagens"
      onClick={onFechar}
    >
      <div className="passaporte-caixa" onClick={(e) => e.stopPropagation()}>
        <button
          ref={fecharRef}
          type="button"
          className="passaporte-fechar"
          onClick={onFechar}
          aria-label="Fechar passaporte"
        >
          ×
        </button>

        <div className="passaporte" key={indice}>
          <div className="passaporte-pagina">
            <header className="passaporte-pagina-topo">
              <span className="passaporte-titulo">PASSAPORTE</span>
              <span className="passaporte-sub">viagens</span>
            </header>
            <div className="passaporte-carimbos">
              {esquerda.map((pais, i) => (
                <Carimbo key={pais} pais={pais} indice={base + i} />
              ))}
            </div>
            <span className="passaporte-numero">
              {String(indice * 2 + 1).padStart(2, '0')}
            </span>
          </div>

          <div className="passaporte-pagina">
            <header className="passaporte-pagina-topo">
              <span className="passaporte-titulo">SELOS DE ENTRADA</span>
              <span className="passaporte-sub">países visitados</span>
            </header>
            <div className="passaporte-carimbos">
              {direita.map((pais, i) => (
                <Carimbo key={pais} pais={pais} indice={base + POR_PAGINA + i} />
              ))}
            </div>
            <span className="passaporte-numero">
              {String(indice * 2 + 2).padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="passaporte-controles">
          <button
            type="button"
            className="passaporte-seta"
            onClick={anterior}
            disabled={indice === 0}
            aria-label="Página anterior"
          >
            ‹
          </button>

          <span className="passaporte-posicao">
            {indice + 1} / {paginas.length}
          </span>

          <button
            type="button"
            className="passaporte-seta"
            onClick={proxima}
            disabled={indice === paginas.length - 1}
            aria-label="Próxima página"
          >
            ›
          </button>
        </div>

        <div className="passaporte-pontos">
          {paginas.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`passaporte-ponto${i === indice ? ' ativo' : ''}`}
              onClick={() => setIndice(i)}
              aria-label={`Ir para a página ${i + 1}`}
              aria-current={i === indice}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
