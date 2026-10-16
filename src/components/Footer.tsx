import { perfil } from '../data/portfolio';

export function Footer() {
  const ano = new Date().getFullYear();

  return (
    <footer className="footer">
      <span className="text-gray">
        © {ano} {perfil.nome}
      </span>
      <span className="text-gray">feito com React + Vite ☕</span>
    </footer>
  );
}
