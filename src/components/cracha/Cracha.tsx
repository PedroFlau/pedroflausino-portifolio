import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Canvas, events, useThree, type EventManager, type RootState } from '@react-three/fiber';
import { Environment, Lightformer, useTexture } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { SRGBColorSpace, type Texture } from 'three';
import { useTema } from '../../hooks/useTema';
import { perfil } from '../../data/portfolio';
import { Lanyard, QUEDA_TOTAL } from './Lanyard';
import { criarTexturaTira, desenharCrachaSith } from './texturas';

const ARTE_CRACHA = '/images/cracha.png';
const FOTO_SITH = '/images/fotoSith.png';
const FOV = 25;
/** Folga (px) entre a base do cartão e o fim da coluna .hero-foto. */
const FOLGA_BASE_PX = 16;
/** Celular: quanto a tira começa acima do topo da coluna (abaixo dos botões). */
const TETO_ACIMA_COLUNA_PX = 40;
/** Desktop: quanto o ponto fixo fica acima da borda visível (some atrás da topbar). */
const ALEM_DA_BORDA_PX = 30;
/** Coluna a menos disso do topo do Hero = layout de desktop (duas colunas). */
const LIMITE_DESKTOP_PX = 120;

type Layout = {
  /** Distância da câmera para manter a escala px/unidade da coluna. */
  z: number;
  /** Ponto fixo da tira em coordenadas do mundo. */
  ancora: [number, number];
};

/**
 * Mede o canvas (que cobre o Hero inteiro) e a coluna .hero-foto, e converte:
 * a tira sai logo acima da coluna ("do teto"; no desktop é o topo do canvas, no
 * celular fica abaixo dos botões), centralizada na coluna, e a escala é
 * escolhida para a base do cartão parar logo acima do fim da coluna — assim o
 * cartão inteiro sempre cabe, em qualquer altura de tela.
 */
function useLayout(
  canvasRef: RefObject<HTMLDivElement | null>,
  colunaRef: RefObject<HTMLElement | null>,
  heroRef: RefObject<HTMLElement | null>,
): Layout | null {
  const [layout, setLayout] = useState<Layout | null>(null);

  useLayoutEffect(() => {
    const canvasEl = canvasRef.current;
    const colunaEl = colunaRef.current;
    const heroEl = heroRef.current;
    if (!canvasEl || !colunaEl || !heroEl) return;
    const scrollEl = heroEl.closest<HTMLElement>('.terminal-scroll');

    const medir = () => {
      const c = canvasEl.getBoundingClientRect();
      const col = colunaEl.getBoundingClientRect();
      if (!c.height || !col.height) return;
      const hero = heroEl.getBoundingClientRect();
      // Desktop: a tira sai de trás da topbar (ponto fixo acima do início do conteúdo).
      // Celular: começa logo acima da coluna, para não cruzar o texto.
      const desktop = col.top - hero.top < LIMITE_DESKTOP_PX;
      const padTopo = scrollEl ? parseFloat(getComputedStyle(scrollEl).paddingTop) || 0 : 0;
      const teto = desktop
        ? Math.max(c.top, hero.top - padTopo - ALEM_DA_BORDA_PX)
        : Math.max(c.top, col.top - TETO_ACIMA_COLUNA_PX);
      const alturaUtil = col.bottom - teto - FOLGA_BASE_PX;
      const pxPorUnidade = alturaUtil / QUEDA_TOTAL;
      const z = c.height / pxPorUnidade / (2 * Math.tan(((FOV / 2) * Math.PI) / 180));
      const x = (col.left + col.width / 2 - (c.left + c.width / 2)) / pxPorUnidade;
      const y = (c.top + c.height / 2 - teto) / pxPorUnidade;
      setLayout((ant) =>
        ant &&
        Math.abs(ant.z - z) < 1e-3 &&
        Math.abs(ant.ancora[0] - x) < 1e-3 &&
        Math.abs(ant.ancora[1] - y) < 1e-3
          ? ant
          : { z, ancora: [x, y] },
      );
    };

    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(canvasEl);
    obs.observe(colunaEl);
    obs.observe(heroEl);
    return () => obs.disconnect();
  }, [canvasRef, colunaRef, heroRef]);

  return layout;
}

/** Ajusta a distância da câmera quando o layout muda. */
function AjusteCamera({ z }: { z: number }) {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    camera.position.set(0, 0, z);
    camera.updateProjectionMatrix();
  }, [camera, z]);
  return null;
}

/**
 * Os eventos vêm da <section> do Hero (eventSource), não do canvas. O cálculo
 * padrão do R3F usa offsetX/Y relativos ao alvo do evento, então aqui o ponteiro
 * é calculado com clientX/Y relativos ao retângulo do canvas.
 */
function eventosDoHero(store: Parameters<typeof events>[0]): EventManager<HTMLElement> {
  return {
    ...events(store),
    compute(event: PointerEvent, state: RootState) {
      const r = state.gl.domElement.getBoundingClientRect();
      state.pointer.set(
        ((event.clientX - r.left) / r.width) * 2 - 1,
        -((event.clientY - r.top) / r.height) * 2 + 1,
      );
      state.raycaster.setFromCamera(state.pointer, state.camera);
    },
  } as EventManager<HTMLElement>;
}

function useMovimentoReduzido() {
  const [reduzido] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  return reduzido;
}

/** Monta a textura Sith quando o tema imperial está ativo (carrega a foto sob demanda). */
function useTexturaSith(ativo: boolean): Texture | null {
  const [textura, setTextura] = useState<Texture | null>(null);

  useEffect(() => {
    if (!ativo || textura) return;
    let cancelado = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelado) setTextura(desenharCrachaSith(img));
    };
    img.src = FOTO_SITH;
    return () => {
      cancelado = true;
    };
  }, [ativo, textura]);

  useEffect(() => () => textura?.dispose(), [textura]);

  return ativo ? textura : null;
}

type CenaProps = {
  sith: boolean;
  arrastandoRef: RefObject<boolean>;
  calmo: boolean;
  ancora: [number, number];
};

function Cena({ sith, arrastandoRef, calmo, ancora }: CenaProps) {
  const arte = useTexture(ARTE_CRACHA, (t) => {
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
  });
  const texturaSith = useTexturaSith(sith);

  const anisotropia = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  const texturaTira = useMemo(() => {
    const t = criarTexturaTira(sith ? '#e6e1d3' : '#f2f2f2');
    t.anisotropy = anisotropia;
    return t;
  }, [sith, anisotropia]);
  useEffect(() => () => texturaTira.dispose(), [texturaTira]);

  return (
    <>
      <ambientLight intensity={Math.PI} />
      <Physics interpolate gravity={[0, -40, 0]} timeStep={1 / 60}>
        <Lanyard
          texturaCartao={texturaSith ?? arte}
          texturaTira={texturaTira}
          arrastandoRef={arrastandoRef}
          calmo={calmo}
          ancora={ancora}
        />
      </Physics>
      <Environment blur={0.75}>
        <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
        <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
        <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
        <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
      </Environment>
    </>
  );
}

type CrachaProps = {
  /** <section> do Hero: recebe os eventos de ponteiro (o canvas não bloqueia cliques). */
  heroRef: RefObject<HTMLElement | null>;
  /** Coluna .hero-foto: define posição e escala do crachá. */
  colunaRef: RefObject<HTMLElement | null>;
  /** Avisado quando o componente monta (o Hero esconde a imagem de carregamento). */
  onMontado?: () => void;
};

/**
 * Crachá 3D pendurado numa tira, com física (arrastável). O canvas cobre o Hero
 * inteiro, para o cartão poder ser arrastado para fora da coluna sem ser cortado.
 */
export default function Cracha({ heroRef, colunaRef, onMontado }: CrachaProps) {
  const { tema } = useTema();
  const sith = tema === 'galactic_empire';
  const calmo = useMovimentoReduzido();

  const containerRef = useRef<HTMLDivElement>(null);
  const arrastandoRef = useRef(false);
  const [visivel, setVisivel] = useState(true);
  const layout = useLayout(containerRef, colunaRef, heroRef);

  useEffect(() => {
    onMontado?.();
  }, [onMontado]);

  // Pausa a renderização quando o hero sai da tela
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entrada]) => setVisivel(entrada.isIntersecting));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // No toque: rolar a página normalmente, exceto enquanto o crachá está sendo arrastado
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const aoMover = (e: TouchEvent) => {
      if (arrastandoRef.current) e.preventDefault();
    };
    el.addEventListener('touchmove', aoMover, { passive: false });
    return () => el.removeEventListener('touchmove', aoMover);
  }, [heroRef]);

  return (
    <div
      ref={containerRef}
      className="cracha"
      role="img"
      aria-label={
        sith
          ? `Crachá de ${perfil.nome} na versão Sith, pendurado numa tira escrita flausino.dev`
          : `Crachá de desenvolvedor de ${perfil.nome}, pendurado numa tira escrita flausino.dev`
      }
    >
      {layout && (
        <Canvas
          camera={{ position: [0, 0, layout.z], fov: FOV }}
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true }}
          frameloop={visivel ? 'always' : 'never'}
          eventSource={heroRef as RefObject<HTMLElement>}
          events={eventosDoHero}
        >
          <AjusteCamera z={layout.z} />
          <Suspense fallback={null}>
            <Cena sith={sith} arrastandoRef={arrastandoRef} calmo={calmo} ancora={layout.ancora} />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
