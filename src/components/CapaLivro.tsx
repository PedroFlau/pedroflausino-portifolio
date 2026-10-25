import type { CSSProperties } from 'react';
import {
  rotuloPublicacao,
  rotuloStatus,
  type Livro,
} from '../data/biblioteca';

type Props = {
  livro: Livro;
  variante?: 'normal' | 'modal' | 'holo';
};

/** Capa gerada em CSS; se o livro tiver `capa`, ela substitui a arte. */
export function CapaLivro({ livro, variante = 'normal' }: Props) {
  const estilo = {
    '--capa-cor': livro.corCapa ?? livro.corLombada,
    '--capa-cor-2': livro.corLombada,
    '--capa-texto': livro.corTexto ?? '#ffffff',
  } as CSSProperties;

  return (
    <span
      className={`capa-livro capa-livro--${variante}`}
      style={estilo}
      data-status={livro.status}
    >
      {livro.capa ? (
        <>
          <img className="capa-livro-imagem" src={livro.capa} alt="" />
          <span className="capa-livro-status capa-livro-status--imagem">
            {rotuloStatus(livro.status)}
          </span>
          <span className="capa-livro-publicacao">
            {rotuloPublicacao(livro.publicacao)}
          </span>
        </>
      ) : (
        <>
          <span className="capa-livro-status">
            {rotuloStatus(livro.status)}
          </span>
          <span className="capa-livro-publicacao">
            {rotuloPublicacao(livro.publicacao)}
          </span>
          <span className="capa-livro-arte" aria-hidden="true" />
          <span className="capa-livro-titulo">{livro.titulo}</span>
          <span className="capa-livro-autor">{livro.autor}</span>
          <span className="capa-livro-marca" aria-hidden="true">
            ✦
          </span>
        </>
      )}
    </span>
  );
}
