import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import {
  paginasDoLivro,
  rotuloPublicacao,
  rotuloStatus,
  type Livro,
  type TipoPagina,
} from '../data/biblioteca';

type Props = {
  livro: Livro;
  variante?: 'modal' | 'holo';
};

function Estrelas({ nota }: { nota: number }) {
  const valor = Math.max(0, Math.min(5, nota));

  return (
    <span
      className="carrossel-estrelas"
      aria-label={`Nota ${valor.toLocaleString('pt-BR')} de 5`}
    >
      <span className="carrossel-estrelas-icones" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((indice) => {
          const preenchimento = Math.max(0, Math.min(1, valor - indice));
          return (
            <span key={indice} className="estrela">
              <span className="estrela-fundo">★</span>
              <span
                className="estrela-cheia"
                style={{ width: `${preenchimento * 100}%` }}
              >
                ★
              </span>
            </span>
          );
        })}
      </span>
      <span className="carrossel-estrelas-valor">
        {valor.toLocaleString('pt-BR')}
      </span>
    </span>
  );
}

function ConteudoPagina({
  livro,
  pagina,
}: {
  livro: Livro;
  pagina: TipoPagina;
}) {
  switch (pagina) {
    case 'sobre':
      return <p className="carrossel-texto">{livro.sinopse}</p>;

    case 'ficha':
      return (
        <dl className="carrossel-ficha">
          <div>
            <dt>autor</dt>
            <dd>{livro.autor}</dd>
          </div>
          {livro.ano && (
            <div>
              <dt>ano</dt>
              <dd>{livro.ano}</dd>
            </div>
          )}
          {livro.genero && (
            <div>
              <dt>gênero</dt>
              <dd>{livro.genero}</dd>
            </div>
          )}
          <div>
            <dt>status</dt>
            <dd>{rotuloStatus(livro.status)}</dd>
          </div>
          <div>
            <dt>publicação</dt>
            <dd>{rotuloPublicacao(livro.publicacao)}</dd>
          </div>
          {livro.nota && (
            <div>
              <dt>nota</dt>
              <dd>
                <Estrelas nota={livro.nota} />
              </dd>
            </div>
          )}
          {livro.progresso !== undefined && (
            <div>
              <dt>progresso</dt>
              <dd>{livro.progresso}%</dd>
            </div>
          )}
          {livro.tags && livro.tags.length > 0 && (
            <div className="carrossel-ficha-tags">
              <dt>tags</dt>
              <dd>
                {livro.tags.map((tag) => (
                  <span key={tag} className="carrossel-tag">
                    {tag}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </dl>
      );

    case 'leitura': {
      const texto =
        livro.status === 'quero ler' ? livro.expectativa : livro.comentario;
      return (
        <div className="carrossel-leitura">
          <p className="carrossel-texto">
            {texto ??
              (livro.status === 'lendo'
                ? 'Ainda estou no começo; em breve escrevo mais sobre esta leitura.'
                : livro.status === 'quero ler'
                  ? 'Ainda não escrevi por que quero ler este livro.'
                  : 'Ainda não escrevi uma resenha deste livro.')}
          </p>
          {livro.status === 'lendo' && livro.progresso !== undefined && (
            <div className="carrossel-progresso">
              <div className="carrossel-progresso-topo">
                <span>progresso de leitura</span>
                <b>{livro.progresso}%</b>
              </div>
              <div
                className="carrossel-progresso-barra"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={livro.progresso}
              >
                <span style={{ width: `${livro.progresso}%` }} />
              </div>
            </div>
          )}
        </div>
      );
    }

    case 'citacao':
      return (
        <blockquote className="carrossel-citacao">
          <p>“{livro.citacao}”</p>
          <cite>— {livro.titulo}</cite>
        </blockquote>
      );
  }
}

export function CarrosselLivro({ livro, variante = 'modal' }: Props) {
  const paginas = paginasDoLivro(livro);
  const [indice, setIndice] = useState(0);
  const raizRef = useRef<HTMLElement>(null);

  useEffect(() => {
    raizRef.current?.focus({ preventScroll: true });
  }, []);

  const pagina = paginas[Math.min(indice, paginas.length - 1)];

  function navegar(delta: number) {
    setIndice((i) =>
      Math.max(0, Math.min(paginas.length - 1, i + delta)),
    );
  }

  function aoTeclar(e: KeyboardEvent<HTMLElement>) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      navegar(-1);
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      navegar(1);
    }
  }

  return (
    <section
      ref={raizRef}
      className={`carrossel-livro carrossel-livro--${variante}`}
      aria-label={`Páginas de ${livro.titulo}`}
      tabIndex={-1}
      onKeyDown={aoTeclar}
    >
      <header className="carrossel-cabecalho">
        <div className="carrossel-identidade">
          <span className={`carrossel-status carrossel-status--${livro.status}`}>
            {rotuloStatus(livro.status)}
          </span>
          <h3>{livro.titulo}</h3>
          <p>
            {livro.autor}
            {livro.ano ? ` · ${livro.ano}` : ''}
          </p>
        </div>
        {livro.nota && <Estrelas nota={livro.nota} />}
      </header>

      <div className="carrossel-pagina" aria-live="polite" key={pagina.id}>
        <h4>{pagina.titulo}</h4>
        <ConteudoPagina livro={livro} pagina={pagina.id} />
      </div>

      <footer className="carrossel-rodape">
        <button
          type="button"
          className="carrossel-seta"
          onClick={() => navegar(-1)}
          disabled={indice === 0}
          aria-label="Página anterior"
        >
          ‹
        </button>
        <span className="carrossel-posicao">
          {indice + 1} / {paginas.length}
        </span>
        <button
          type="button"
          className="carrossel-seta"
          onClick={() => navegar(1)}
          disabled={indice === paginas.length - 1}
          aria-label="Próxima página"
        >
          ›
        </button>
      </footer>
    </section>
  );
}
