import type { ReactNode } from 'react';

type Props = {
  /** Nome da seção (o mesmo do comando: "sobre", "projetos"...). */
  titulo: string;
  /** Uma linha curta explicando o que vem abaixo. */
  subtitulo?: ReactNode;
  /** Contagem ou status à direita (ex.: "2 projetos"). */
  meta?: ReactNode;
};

/**
 * Cabeçalho único das saídas do terminal. Mantém a classe `.secao-titulo`
 * para herdar as decorações de cada tema (system, galactic_empire).
 */
export function CabecalhoSecao({ titulo, subtitulo, meta }: Props) {
  return (
    <header className="secao-cabecalho">
      <div className="secao-cabecalho-linha">
        <h2 className="secao-titulo">
          <span className="secao-hash" aria-hidden="true">
            #
          </span>
          {titulo}
        </h2>
        {meta && <span className="secao-meta">{meta}</span>}
      </div>
      {subtitulo && <p className="secao-subtitulo">{subtitulo}</p>}
    </header>
  );
}
