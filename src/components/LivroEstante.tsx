import type { CSSProperties, MouseEvent } from 'react';
import type { Livro } from '../data/biblioteca';
import { CapaLivro } from './CapaLivro';

type Props = {
  livro: Livro;
  indice: number;
  selecionado: boolean;
  onAbrir: (indice: number, gatilho: HTMLButtonElement) => void;
};

export function LivroEstante({
  livro,
  indice,
  selecionado,
  onAbrir,
}: Props) {
  const espessura = livro.espessura ?? 34 + (indice % 4) * 5;
  const altura = livro.altura ?? 190 + (indice % 3) * 16;
  const tamanhoTitulo =
    livro.titulo.length > 30
      ? '0.46rem'
      : livro.titulo.length > 24
        ? '0.52rem'
        : livro.titulo.length > 18
          ? '0.57rem'
          : '0.62rem';

  const estilo = {
    '--lombada': `${espessura}px`,
    '--altura': `${altura}px`,
    '--profundidade': '150px',
    '--cor-lombada': livro.corLombada,
    '--cor-texto': livro.corTexto ?? '#ffffff',
    '--titulo-tamanho': tamanhoTitulo,
  } as CSSProperties;

  function aoClicar(e: MouseEvent<HTMLButtonElement>) {
    onAbrir(indice, e.currentTarget);
  }

  return (
    <button
      type="button"
      className="livro-estante"
      style={estilo}
      data-selecionado={selecionado ? 'true' : undefined}
      onClick={aoClicar}
      title={livro.titulo}
      aria-label={`Abrir o livro ${livro.titulo}`}
      aria-pressed={selecionado}
    >
      <span className="livro-lombada" aria-hidden="true">
        <span className="livro-lombada-titulo">{livro.titulo}</span>
      </span>

      <span className="livro-capa" aria-hidden="true">
        <CapaLivro livro={livro} />
        <span className="livro-dica">abrir</span>
      </span>
    </button>
  );
}
