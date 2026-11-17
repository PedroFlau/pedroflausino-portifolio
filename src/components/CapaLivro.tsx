import { numeralRomano, type Livro } from '../data/biblioteca';
import { coresDoLivro } from './coresLivro';
import { ArteCapa } from './ArteCapa';

type Props = {
  livro: Livro;
  variante?: 'normal' | 'modal' | 'holo';
};

/**
 * Capa do livro. Sem `capa` (imagem), é gerada pelo `modelo`: arte em SVG
 * (ArteCapa) + título e autor em HTML, medidos em cqw para a mesma capa
 * servir na estante (150px) e no modal (310px).
 */
export function CapaLivro({ livro, variante = 'normal' }: Props) {
  const classe = `capa-livro capa-livro--${variante} capa-livro--${livro.modelo}`;

  if (livro.capa) {
    return (
      <span className={`${classe} capa-livro--imagem`} style={coresDoLivro(livro)}>
        <img className="capa-livro-imagem" src={livro.capa} alt="" />
      </span>
    );
  }

  const volume = livro.serie ? numeralRomano(livro.serie.volume) : null;

  return (
    <span className={classe} style={coresDoLivro(livro)} data-cena={livro.cena}>
      <ArteCapa modelo={livro.modelo} cena={livro.cena} />

      {livro.modelo === 'insignia' && livro.serie && (
        <span className="capa-livro-faixa">
          <span>{livro.serie.nome}</span>
          <span>{volume}</span>
        </span>
      )}
      {livro.modelo === 'taro' && volume && (
        <span className="capa-livro-volume">{volume}</span>
      )}
      {livro.modelo === 'sombra' && (
        <span className="capa-livro-letra" aria-hidden="true">
          {livro.titulo.charAt(0)}
        </span>
      )}

      <span className="capa-livro-texto">
        <span className="capa-livro-titulo">{livro.titulo}</span>
        <span className="capa-livro-autor">{livro.autor}</span>
      </span>

      {livro.modelo === 'selo' && (
        // 蛊: primeiro caractere do título original (蛊真人)
        <span className="capa-livro-carimbo" aria-hidden="true">
          蛊
        </span>
      )}
    </span>
  );
}
