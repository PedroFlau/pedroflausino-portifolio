import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import type { Livro } from '../data/biblioteca';
import { useTema } from '../hooks/useTema';
import crestImperial from '../assets/imperial-crest.svg';
import { CarrosselLivro } from './CarrosselLivro';

type Props = {
  livros: Livro[];
};

export function BibliotecaHolograma({ livros }: Props) {
  const { tema } = useTema();
  const [selecionado, setSelecionado] = useState<number | null>(null);
  const [indiceAtivo, setIndiceAtivo] = useState(0);
  const listaRef = useRef<HTMLUListElement>(null);
  const livro = selecionado !== null ? livros[selecionado] : null;

  useEffect(() => {
    if (selecionado === null) {
      listaRef.current?.focus({ preventScroll: true });
    }
  }, [selecionado]);

  useEffect(() => {
    if (selecionado !== null) return;
    const itens =
      listaRef.current?.querySelectorAll<HTMLElement>('.holo-livro');
    itens?.[indiceAtivo]?.scrollIntoView({ block: 'nearest' });
  }, [indiceAtivo, selecionado, livros]);

  function aoTeclarLista(e: KeyboardEvent<HTMLUListElement>) {
    if (livros.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setIndiceAtivo((i) => Math.min(livros.length - 1, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setIndiceAtivo((i) => Math.max(0, i - 1));
        break;
      case 'Home':
        e.preventDefault();
        setIndiceAtivo(0);
        break;
      case 'End':
        e.preventDefault();
        setIndiceAtivo(livros.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        setSelecionado(indiceAtivo);
        break;
      default:
        break;
    }
  }

  return (
    <div className="holo-cena">
      <div className="holo-painel-wrap">
        <span className="holo-aba" aria-hidden="true" />

        <div className="holo-painel">
          <span className="holo-canto" aria-hidden="true" />

          <div className="holo-conteudo">
            {!livro ? (
              <>
                <header className="holo-cabecalho">
                  <div>
                    <span className="holo-etiqueta">
                      arquivo de leitura
                    </span>
                    <h3>acervo</h3>
                  </div>
                  <span className="holo-contagem">
                    {String(livros.length).padStart(2, '0')} volumes
                  </span>
                </header>

                <ul
                  ref={listaRef}
                  className="holo-lista"
                  role="listbox"
                  aria-label="Livros da biblioteca"
                  aria-activedescendant={`holo-livro-${livros[indiceAtivo]?.id ?? ''}`}
                  tabIndex={0}
                  onKeyDown={aoTeclarLista}
                >
                  {livros.map((item, indice) => (
                    <li key={item.id}>
                      <button
                        id={`holo-livro-${item.id}`}
                        type="button"
                        className="holo-livro"
                        role="option"
                        aria-selected={indice === indiceAtivo}
                        tabIndex={-1}
                        onClick={() => {
                          setIndiceAtivo(indice);
                          setSelecionado(indice);
                        }}
                        onMouseEnter={() => setIndiceAtivo(indice)}
                      >
                        <span>{item.titulo}</span>
                      </button>
                    </li>
                  ))}
                </ul>

                <p className="holo-dica">
                  ↑ ↓ navegar · Enter abrir
                </p>
              </>
            ) : (
              <div className="holo-leitura">
                <header className="holo-cabecalho holo-cabecalho--livro">
                  <button
                    type="button"
                    className="holo-voltar"
                    onClick={() => setSelecionado(null)}
                  >
                    ← arquivo
                  </button>
                  <span className="holo-etiqueta">
                    volume {String((selecionado ?? 0) + 1).padStart(2, '0')}
                  </span>
                </header>

                <CarrosselLivro
                  key={livro.id}
                  livro={livro}
                  variante="holo"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="holo-feixe" aria-hidden="true" />
      <div className="holo-projetor" aria-hidden="true">
        {tema === 'galactic_empire' && (
          <img className="holo-crest" src={crestImperial} alt="" />
        )}
        <span className="holo-projetor-luz" />
      </div>
      <div className="holo-base" aria-hidden="true" />
    </div>
  );
}
