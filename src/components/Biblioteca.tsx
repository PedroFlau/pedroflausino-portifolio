import { useState } from 'react';
import {
  livros,
  type FiltroBiblioteca,
} from '../data/biblioteca';
import { useTema } from '../hooks/useTema';
import { BibliotecaEstante } from './BibliotecaEstante';
import { BibliotecaHolograma } from './BibliotecaHolograma';
import { FiltroStatus } from './FiltroStatus';
import './Biblioteca.css';

export function Biblioteca() {
  const { tema } = useTema();
  const [filtro, setFiltro] = useState<FiltroBiblioteca>('todos');
  const holograma = tema === 'system' || tema === 'galactic_empire';
  const filtrados =
    filtro === 'todos'
      ? livros
      : livros.filter((livro) => livro.status === filtro);

  const classe = holograma
    ? `biblioteca biblioteca-holo biblioteca-holo--${tema}`
    : 'biblioteca biblioteca-estante';

  return (
    <div className={classe}>
      <FiltroStatus filtro={filtro} aoMudar={setFiltro} livros={livros} />

      {filtrados.length === 0 ? (
        <p className="biblioteca-vazio" role="status">
          {filtro === 'todos'
            ? 'Nenhum livro cadastrado ainda.'
            : `Nenhum livro marcado como ${filtro} ainda.`}
        </p>
      ) : holograma ? (
        <BibliotecaHolograma key={filtro} livros={filtrados} />
      ) : (
        <BibliotecaEstante key={filtro} livros={filtrados} />
      )}
    </div>
  );
}
