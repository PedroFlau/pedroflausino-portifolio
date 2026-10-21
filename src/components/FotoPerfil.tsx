import { perfil } from '../data/portfolio';
import { useTema } from '../hooks/useTema';

export function FotoPerfil() {
  const { tema } = useTema();
  const temaImperio = tema === 'galactic_empire';

  return (
    <figure className={`foto-card${temaImperio ? ' foto-card--sith' : ''}`}>
      <img
        className="foto-perfil"
        src={temaImperio ? '/images/fotoSith.png' : '/images/minhafoto.jpeg'}
        alt={
          temaImperio
            ? `${perfil.nome} caracterizado como um Sith`
            : `Foto de ${perfil.nome}`
        }
      />
    </figure>
  );
}
