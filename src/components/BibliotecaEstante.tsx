import { useEffect, useRef, useState } from 'react';
import type { Livro } from '../data/biblioteca';
import { LivroDetalhe } from './LivroDetalhe';
import { LivroEstante } from './LivroEstante';

type Props = {
  livros: Livro[];
};

export function BibliotecaEstante({ livros }: Props) {
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
          {livros.map((livro, indice) => (
            <LivroEstante
              key={livro.id}
              livro={livro}
              indice={indice}
              selecionado={selecionado === indice}
              onAbrir={abrir}
            />
          ))}
        </div>
        <div className="estante-prateleira" aria-hidden="true" />
      </div>

      {aberto !== null && (
        <LivroDetalhe livro={livros[aberto]} onFechar={fechar} />
      )}
    </>
  );
}
