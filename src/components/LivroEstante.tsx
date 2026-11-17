import type { CSSProperties, MouseEvent } from 'react';
import { numeralRomano, rotuloStatus, type Livro } from '../data/biblioteca';
import { MarcaCapa } from './ArteCapa';
import { CapaLivro } from './CapaLivro';
import { coresDoLivro } from './coresLivro';

type Props = {
  livro: Livro;
  indice: number;
  selecionado: boolean;
  onAbrir: (indice: number, gatilho: HTMLButtonElement) => void;
};

export function LivroEstante({ livro, indice, selecionado, onAbrir }: Props) {
  const espessura = livro.espessura ?? 44 + (indice % 4) * 5;
  const altura = livro.altura ?? 210 + (indice % 3) * 16;

  const estilo = {
    ...coresDoLivro(livro),
    '--lombada': `${espessura}px`,
    '--altura': `${altura}px`,
    '--profundidade': '150px',
    '--cor-lombada': livro.corLombada,
    '--cor-texto': livro.corTexto ?? '#ffffff',
  } as CSSProperties;

  function aoClicar(e: MouseEvent<HTMLButtonElement>) {
    onAbrir(indice, e.currentTarget);
  }

  const serie = livro.serie
    ? `, volume ${livro.serie.volume} de ${livro.serie.nome}`
    : '';

  return (
    <button
      type="button"
      className={`livro-estante livro-estante--${livro.modelo}`}
      style={estilo}
      data-selecionado={selecionado ? 'true' : undefined}
      data-status={livro.status}
      onClick={aoClicar}
      title={`${livro.titulo} · ${livro.autor}`}
      aria-label={`Abrir ${livro.titulo}, de ${livro.autor}${serie} (${rotuloStatus(livro.status)})`}
    >
      {/* Status: fita de marcador (lendo) ou cinta de papel (quero ler) */}
      {livro.status === 'lendo' && <span className="lombada-fita" aria-hidden="true" />}

      <span className="livro-lombada" aria-hidden="true">
        {livro.serie && (
          <span className="lombada-volume">{numeralRomano(livro.serie.volume)}</span>
        )}
        <span className="livro-lombada-titulo">{livro.titulo}</span>
        <MarcaCapa modelo={livro.modelo} />
        {livro.status === 'quero ler' && <span className="lombada-cinta" />}
      </span>

      <span className="livro-capa" aria-hidden="true">
        <CapaLivro livro={livro} />
        <span className="livro-dica">abrir</span>
      </span>
    </button>
  );
}
