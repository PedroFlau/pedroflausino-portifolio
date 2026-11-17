import { useEffect, useState } from 'react';
import { curriculo } from '../data/portfolio';

/**
 * Verifica uma vez por visita se o PDF do currículo existe de verdade.
 * O arquivo em public/cv.pdf pode estar vazio (placeholder) e, em dev, o Vite
 * responde index.html para caminhos que não existem; por isso o teste confere
 * o tipo e o tamanho, não só o status.
 */
let verificacao: Promise<boolean> | null = null;

function verificar(): Promise<boolean> {
  verificacao ??= fetch(curriculo.arquivo, { method: 'HEAD' })
    .then((r) => {
      const tipo = r.headers.get('content-type') ?? '';
      const tamanho = Number(r.headers.get('content-length') ?? '0');
      return r.ok && tipo.includes('pdf') && tamanho > 0;
    })
    .catch(() => false);
  return verificacao;
}

/** true quando há um CV em PDF para baixar. */
export function useCurriculo(): boolean {
  const [disponivel, setDisponivel] = useState(false);
  useEffect(() => {
    let ativo = true;
    verificar().then((ok) => {
      if (ativo) setDisponivel(ok);
    });
    return () => {
      ativo = false;
    };
  }, []);
  return disponivel;
}
