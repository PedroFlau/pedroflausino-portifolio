import { useEffect, useRef, useState } from 'react';
import {
  rotuloPublicacao,
  rotuloStatus,
  type Livro,
} from '../data/biblioteca';
import { CapaLivro } from './CapaLivro';
import { CarrosselLivro } from './CarrosselLivro';

type Props = {
  livro: Livro;
  onFechar: () => void;
};

export function LivroDetalhe({ livro, onFechar }: Props) {
  const [aberto, setAberto] = useState(false);
  const fecharRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fecharRef.current?.focus();

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') onFechar();
    }

    document.addEventListener('keydown', aoTeclar);

    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [onFechar]);

  return (
    <div
      className="livro-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Livro ${livro.titulo}`}
      onClick={onFechar}
    >
      <div className="livro-modal" onClick={(e) => e.stopPropagation()}>
        <button
          ref={fecharRef}
          type="button"
          className="livro-modal-fechar"
          onClick={onFechar}
          aria-label="Fechar livro"
        >
          ×
        </button>

        {!aberto ? (
          <div className="livro-modal-capa">
            <button
              type="button"
              className="livro-3d"
              onClick={() => setAberto(true)}
              aria-label={`Abrir o livro ${livro.titulo}`}
            >
              <CapaLivro livro={livro} variante="modal" />
              <span className="livro-3d-dica">abrir livro</span>
            </button>

            <div className="livro-modal-info">
              <div className="livro-modal-selos">
                <span
                  className={`carrossel-status carrossel-status--${livro.status}`}
                >
                  {rotuloStatus(livro.status)}
                </span>
                <span className="livro-modal-publicacao">
                  {rotuloPublicacao(livro.publicacao)}
                </span>
              </div>
              <h2>{livro.titulo}</h2>
              <p className="livro-modal-autor">{livro.autor}</p>
              {livro.genero && (
                <p className="livro-modal-genero">
                  {livro.genero}
                  {livro.ano ? ` · ${livro.ano}` : ''}
                </p>
              )}
              <button
                type="button"
                className="biblioteca-botao"
                onClick={() => setAberto(true)}
              >
                abrir livro
              </button>
            </div>
          </div>
        ) : (
          <div className="livro-modal-leitura">
            <button
              type="button"
              className="biblioteca-voltar"
              onClick={() => setAberto(false)}
            >
              ← capa
            </button>
            <CarrosselLivro livro={livro} variante="modal" />
          </div>
        )}
      </div>
    </div>
  );
}
