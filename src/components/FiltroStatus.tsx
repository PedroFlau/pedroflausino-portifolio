import type { FiltroBiblioteca, Livro } from '../data/biblioteca';

type Props = {
  filtro: FiltroBiblioteca;
  aoMudar: (filtro: FiltroBiblioteca) => void;
  livros: Livro[];
};

const OPCOES: { id: FiltroBiblioteca; rotulo: string }[] = [
  { id: 'todos', rotulo: 'todos' },
  { id: 'lendo', rotulo: 'lendo' },
  { id: 'lido', rotulo: 'lido' },
  { id: 'quero ler', rotulo: 'quero ler' },
];

export function FiltroStatus({ filtro, aoMudar, livros }: Props) {
  function contar(id: FiltroBiblioteca) {
    if (id === 'todos') return livros.length;
    return livros.filter((livro) => livro.status === id).length;
  }

  return (
    <nav className="biblioteca-filtros" aria-label="Filtrar livros por status">
      {OPCOES.map((opcao) => (
        <button
          key={opcao.id}
          type="button"
          className="biblioteca-filtro"
          aria-pressed={filtro === opcao.id}
          onClick={() => aoMudar(opcao.id)}
        >
          <span>{opcao.rotulo}</span>
          <span className="biblioteca-filtro-contagem" aria-hidden="true">
            {contar(opcao.id)}
          </span>
        </button>
      ))}
    </nav>
  );
}
