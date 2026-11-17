import type { CSSProperties } from 'react';
import type { Livro } from '../data/biblioteca';

/** Variáveis de cor compartilhadas pela capa e pela lombada. */
export function coresDoLivro(livro: Livro): CSSProperties {
  return {
    '--capa-cor': livro.corCapa ?? livro.corLombada,
    '--capa-cor-2': livro.corLombada,
    '--capa-texto': livro.corTexto ?? '#ffffff',
    '--capa-destaque': livro.corDestaque ?? livro.corTexto ?? '#ffffff',
  } as CSSProperties;
}
