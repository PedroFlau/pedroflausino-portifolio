import { perfil } from '../data/portfolio';

export function FotoPerfil() {
  return (
    <figure className="foto-card">
      <img
        className="foto-perfil"
        src="/images/minhafoto.jpeg"
        alt={`Foto de ${perfil.nome}`}
      />
    </figure>
  );
}
