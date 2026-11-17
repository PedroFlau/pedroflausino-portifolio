import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { curriculo, perfil } from '../data/portfolio';

// three.js + física ficam num chunk separado, carregado depois da página
const Cracha = lazy(() => import('../components/cracha/Cracha'));

/** Arte estática exibida enquanto o crachá 3D carrega. */
function CrachaFallback() {
  return (
    <div className="cracha-fallback">
      <img
        src="/images/cracha.webp"
        alt={`Crachá de desenvolvedor de ${perfil.nome}`}
        width={1342}
        height={2000}
        fetchPriority="high"
      />
    </div>
  );
}

type Conexao = { saveData?: boolean; effectiveType?: string };

/** Economia de dados ou rede 2G: o 3D (~3 MB) só carrega se a pessoa tocar no crachá. */
function redeLimitada(): boolean {
  const conexao = (navigator as Navigator & { connection?: Conexao }).connection;
  return Boolean(conexao?.saveData || /(^|-)2g$/.test(conexao?.effectiveType ?? ''));
}

/**
 * Libera o crachá 3D depois que a página fica ociosa, para o three.js não
 * disputar banda e CPU com o primeiro render. Em rede limitada, espera um toque.
 */
function useCarregar3d(heroRef: React.RefObject<HTMLElement | null>): boolean {
  const [carregar, setCarregar] = useState(false);

  useEffect(() => {
    if (redeLimitada()) {
      const el = heroRef.current;
      if (!el) return;
      const liberar = () => setCarregar(true);
      el.addEventListener('pointerdown', liberar, { once: true });
      return () => el.removeEventListener('pointerdown', liberar);
    }
    // Safari ainda não tem requestIdleCallback
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(() => setCarregar(true), { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(() => setCarregar(true), 300);
    return () => clearTimeout(id);
  }, [heroRef]);

  return carregar;
}

/** Abertura exibida dentro do terminal (nome, resumo, botões e crachá 3D). */
export function Hero({
  onComando,
  temCurriculo = false,
}: {
  onComando?: (comando: string) => void;
  /** Mostra o botão de baixar o CV (só quando o PDF existe). */
  temCurriculo?: boolean;
}) {
  const heroRef = useRef<HTMLElement>(null);
  const colunaRef = useRef<HTMLDivElement>(null);
  const [crachaMontado, setCrachaMontado] = useState(false);
  const aoMontarCracha = useCallback(() => setCrachaMontado(true), []);
  const carregar3d = useCarregar3d(heroRef);

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
          {perfil.curso} · {perfil.universidade} · {perfil.subtitulo}
        </p>

        <p className="hero-descricao">
          {perfil.idade} anos, {perfil.cidade}. Monitor de Algoritmos e Estruturas
          de Dados I, programo em Java, C e TypeScript e procuro meu primeiro
          estágio.
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
            contato
          </a>
          {temCurriculo && (
            <a className="botao" href={curriculo.arquivo} download={curriculo.nomeDownload}>
              cv ↓
            </a>
          )}
        </div>
      </div>

      {/* Coluna vazia: reserva o espaço e serve de referência para o crachá */}
      <div className="hero-foto" ref={colunaRef}>
        {!crachaMontado && <CrachaFallback />}
      </div>

      {/* O canvas cobre o Hero inteiro (o cartão pode ser arrastado para fora da coluna) */}
      {carregar3d && (
        <Suspense fallback={null}>
          <Cracha heroRef={heroRef} colunaRef={colunaRef} onMontado={aoMontarCracha} />
        </Suspense>
      )}
    </section>
  );
}
