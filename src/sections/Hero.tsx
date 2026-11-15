import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import { perfil } from '../data/portfolio';

// three.js + física ficam num chunk separado, carregado depois da página
const Cracha = lazy(() => import('../components/cracha/Cracha'));

/** Arte estática exibida enquanto o crachá 3D carrega. */
function CrachaFallback() {
  return (
    <div className="cracha-fallback">
      <img src="/images/cracha.png" alt={`Crachá de desenvolvedor de ${perfil.nome}`} />
    </div>
  );
}

/** Abertura exibida dentro do terminal (nome, resumo, botões e crachá 3D). */
export function Hero({ onComando }: { onComando?: (comando: string) => void }) {
  const heroRef = useRef<HTMLElement>(null);
  const colunaRef = useRef<HTMLDivElement>(null);
  const [crachaMontado, setCrachaMontado] = useState(false);
  const aoMontarCracha = useCallback(() => setCrachaMontado(true), []);

  return (
    <section className="hero" ref={heroRef}>
      <div className="hero-texto">
        <p className="hero-comando">
          <span className="text-accent">pedro@portfolio</span>
          <span className="text-gray">:~$ </span>
          <span>whoami</span>
        </p>

        <h1 className="hero-nome">
          {perfil.primeiroNome}{' '}
          <span className="text-accent">Flausino Mendonça</span>
        </h1>

        <p className="hero-titulo">
          {perfil.titulo} · {perfil.subtitulo}
        </p>

        <p className="hero-descricao">
          {perfil.idade} anos · {perfil.cidade}. Construindo minha base em
          programação e transformando estudo em projetos reais.
        </p>

        <div className="hero-botoes">
          <button
            type="button"
            className="botao botao-primario"
            onClick={() => onComando?.('projetos')}
          >
            ver projetos
          </button>
          <a
            className="botao"
            href={perfil.links.github}
            target="_blank"
            rel="noopener noreferrer"
          >
            github ↗
          </a>
          <a className="botao" href={`mailto:${perfil.links.email}`}>
            contato ↗
          </a>
        </div>
      </div>

      {/* Coluna vazia: reserva o espaço e serve de referência para o crachá */}
      <div className="hero-foto" ref={colunaRef}>
        {!crachaMontado && <CrachaFallback />}
      </div>

      {/* O canvas cobre o Hero inteiro (o cartão pode ser arrastado para fora da coluna) */}
      <Suspense fallback={null}>
        <Cracha heroRef={heroRef} colunaRef={colunaRef} onMontado={aoMontarCracha} />
      </Suspense>
    </section>
  );
}
