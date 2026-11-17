import { useEffect, useMemo, useRef, useState } from 'react';
import { agruparPorSerie, type Livro } from '../data/biblioteca';
import { LivroDetalhe } from './LivroDetalhe';
import { LivroEstante } from './LivroEstante';

type Props = {
  livros: Livro[];
};

export function BibliotecaEstante({ livros }: Props) {
  // Séries juntas, em ordem de volume; o índice é o da ordem na estante
  const grupos = useMemo(() => agruparPorSerie(livros), [livros]);
  const ordenados = useMemo(() => grupos.flatMap((g) => g.livros), [grupos]);
  const temLendo = livros.some((l) => l.status === 'lendo');
  const temQueroLer = livros.some((l) => l.status === 'quero ler');
  const [selecionado, setSelecionado] = useState<number | null>(null);
  const [aberto, setAberto] = useState<number | null>(null);
  const gatilhoRef = useRef<HTMLButtonElement | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  function abrir(indice: number, gatilho: HTMLButtonElement) {
    gatilhoRef.current = gatilho;
    const compacto = window.matchMedia(
      '(max-width: 760px), (hover: none), (prefers-reduced-motion: reduce)',
    ).matches;

    if (compacto) {
      setAberto(indice);
      return;
    }

    setSelecionado(indice);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setAberto(indice);
      timerRef.current = null;
    }, 420);
  }

  function fechar() {
    setAberto(null);
    // O livro volta para a estante
    setSelecionado(null);
    requestAnimationFrame(() => gatilhoRef.current?.focus());
  }

  return (
    <>
      <p className="biblioteca-instrucao">
        {selecionado === null
          ? 'clique na lombada para tirar o livro da estante'
          : 'clique na capa para abrir o livro'}
      </p>

      <div className="estante-palco">
        <div
          className={`estante-livros${
            selecionado !== null ? ' estante-livros--foco' : ''
          }`}
        >
          {grupos.map((grupo) => (
            <div
              key={grupo.serie ?? grupo.livros[0].id}
              className={`estante-grupo${grupo.serie ? ' estante-grupo--serie' : ''}`}
            >
              {grupo.livros.map((livro) => {
                const indice = ordenados.indexOf(livro);
                return (
                  <LivroEstante
                    key={livro.id}
                    livro={livro}
                    indice={indice}
                    selecionado={selecionado === indice}
                    onAbrir={abrir}
                  />
                );
              })}
              {grupo.serie && grupo.livros.length > 1 && (
                <span className="estante-serie" aria-hidden="true">
                  {grupo.serie}
                </span>
              )}
            </div>
          ))}
          <div className="estante-prateleira" aria-hidden="true" />
        </div>
      </div>

      {(temLendo || temQueroLer) && (
        <p className="estante-legenda">
          {temLendo && (
            <span>
              <span className="legenda-fita" aria-hidden="true" /> fita: lendo agora
            </span>
          )}
          {temQueroLer && (
            <span>
              <span className="legenda-cinta" aria-hidden="true" /> cinta: quero ler
            </span>
          )}
        </p>
      )}

      {aberto !== null && (
        <LivroDetalhe livro={ordenados[aberto]} onFechar={fechar} />
      )}
    </>
  );
}
