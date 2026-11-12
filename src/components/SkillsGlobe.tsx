import {
  useEffect,
  useMemo,
  useRef,
  type MouseEvent as EventoMouse,
  type PointerEvent as EventoPonteiro,
} from 'react';
import type { IconType } from 'react-icons';
import type { Tema } from '../hooks/useTema';
import './SkillsGlobe.css';

/**
 * Globo 3D de habilidades feito só com React + CSS + <canvas> 2D.
 *
 *   1. As skills são espalhadas numa esfera com a "espiral de Fibonacci".
 *   2. A cada quadro cada ponto é girado nos eixos X e Y e projetado na tela
 *      com perspectiva (mais longe = menor e mais apagado).
 *   3. Os ícones são movidos direto no DOM (style.transform), sem re-render
 *      do React a cada quadro.
 *   4. A malha da esfera (meridianos e paralelos) é desenhada num <canvas>.
 *
 * Arraste para girar (mouse, caneta ou dedo). Cada ícone é um link para a
 * documentação da tecnologia.
 */

export type HabilidadeGlobo = {
  nome: string;
  grupo: string;
  icone: IconType;
  link: string;
};

type Ponto3D = { x: number; y: number; z: number };

const DRAG_THRESHOLD = 6; // px: acima disso o clique vira arrasto e não abre o link
const MAX_TILT = 1.1; // rad: limite da inclinação vertical
const GRID_STEPS = 64; // pontos por linha da grade
const VELOCIDADE_AUTO = 0.15; // rad/s
const INERCIA = 0.92; // desaceleração por quadro depois de soltar
const COR_PADRAO = '#e3b341'; // fallback se --skills-line não estiver disponível

type EstadoMovimento = {
  rx: number;
  ry: number;
  vx: number;
  vy: number;
  arrastando: boolean;
  hover: boolean;
  inicio: { x: number; y: number } | null;
  ultimo: { x: number; y: number } | null;
  movido: number;
};

/** Espiral de Fibonacci: distribui n pontos bem espalhados na esfera de raio 1. */
function esferaFibonacci(n: number): Ponto3D[] {
  const dourado = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: n }, (_, i) => {
    const y = 1 - (2 * (i + 0.5)) / n;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = dourado * i;
    return { x: Math.cos(theta) * r, y, z: Math.sin(theta) * r };
  });
}

/** Malha da esfera: 6 meridianos + 5 paralelos (pontos 3D de raio 1). */
function gradeEsfera(): Ponto3D[][] {
  const linhas: Ponto3D[][] = [];

  for (let m = 0; m < 6; m += 1) {
    const lon = (m / 6) * Math.PI;
    linhas.push(
      Array.from({ length: GRID_STEPS + 1 }, (_, i) => {
        const t = (i / GRID_STEPS) * Math.PI * 2;
        return {
          x: Math.cos(t) * Math.cos(lon),
          y: Math.sin(t),
          z: Math.cos(t) * Math.sin(lon),
        };
      }),
    );
  }

  for (const lat of [-60, -30, 0, 30, 60]) {
    const phi = (lat * Math.PI) / 180;
    linhas.push(
      Array.from({ length: GRID_STEPS + 1 }, (_, i) => {
        const t = (i / GRID_STEPS) * Math.PI * 2;
        return {
          x: Math.cos(phi) * Math.cos(t),
          y: Math.sin(phi),
          z: Math.cos(phi) * Math.sin(t),
        };
      }),
    );
  }

  return linhas;
}

const GRADE = gradeEsfera();

/** Gira o ponto em Y (giro horizontal) e depois em X (inclinação vertical). */
function girar(p: Ponto3D, rx: number, ry: number): Ponto3D {
  const cosY = Math.cos(ry);
  const sinY = Math.sin(ry);
  const x1 = p.x * cosY - p.z * sinY;
  const z1 = p.x * sinY + p.z * cosY;
  const cosX = Math.cos(rx);
  const sinX = Math.sin(rx);
  return { x: x1, y: p.y * cosX - z1 * sinX, z: p.y * sinX + z1 * cosX };
}

/** `Front-end` → `front-end`; `Inovação` → `inovacao` (sem acentos). */
function slug(grupo: string): string {
  return grupo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');
}

/** #rgb/#rrggbb → rgba(); qualquer outra notação volta sem alfa. */
function comAlfa(cor: string, alfa: number): string {
  const hex = cor.replace('#', '');
  const cheio =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex;

  if (!/^[0-9a-f]{6}$/i.test(cheio)) return cor;

  const n = Number.parseInt(cheio, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alfa})`;
}

function prefereMenosMovimento(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  );
}

export function SkillsGlobe({
  skills,
  tema,
}: {
  skills: HabilidadeGlobo[];
  tema: Tema;
}) {
  const palcoRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const itensRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const pontos = useMemo(() => esferaFibonacci(skills.length), [skills.length]);

  // Estado da animação em refs: muda a cada quadro e não precisa de re-render
  const movimento = useRef<EstadoMovimento>({
    rx: -0.3, // inclinação inicial
    ry: 0, // giro
    vx: 0, // velocidade do arrasto (inércia)
    vy: 0,
    arrastando: false,
    hover: false,
    inicio: null,
    ultimo: null,
    movido: 0,
  });

  /* -------------------------------------------------------------
     Loop de animação + malha no canvas
     ------------------------------------------------------------- */
  useEffect(() => {
    const palco = palcoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!palco || !canvas || !ctx) return;

    const reduzido = prefereMenosMovimento();
    const m = movimento.current;
    let cor = COR_PADRAO;
    let frame = 0;
    let ultimoTempo = performance.now();

    // A cor da malha vem do CSS do tema. O atributo data-theme é aplicado
    // pelo App num efeito (depois dos efeitos dos filhos), por isso o
    // MutationObserver: garante que a troca de tema repinta mesmo assim.
    const lerCor = () => {
      const valor = getComputedStyle(palco)
        .getPropertyValue('--skills-line')
        .trim();
      cor = valor || COR_PADRAO;
    };
    lerCor();

    const observadorTema = new MutationObserver(lerCor);
    observadorTema.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    const desenhar = (agora: number) => {
      const dt = Math.min((agora - ultimoTempo) / 1000, 0.05);
      ultimoTempo = agora;

      // Giro automático (mais lento com o mouse em cima) + inércia do arrasto
      if (!m.arrastando) {
        if (!reduzido) m.ry += VELOCIDADE_AUTO * dt * (m.hover ? 0.25 : 1);
        m.ry += m.vy;
        m.rx = Math.max(-MAX_TILT, Math.min(MAX_TILT, m.rx + m.vx));
        m.vx *= INERCIA;
        m.vy *= INERCIA;
      }

      const largura = palco.clientWidth;
      const altura = palco.clientHeight;
      const raio = Math.min(largura, altura) * 0.38;
      const camera = raio * 4.2; // distância da câmera: menor = perspectiva mais forte
      const cx = largura / 2;
      const cy = altura / 2;

      // Projeção 3D → 2D com perspectiva
      const projetar = (p: Ponto3D) => {
        const r = girar(p, m.rx, m.ry);
        const escala = camera / (camera - r.z * raio);
        return {
          x: cx + r.x * raio * escala,
          y: cy + r.y * raio * escala,
          z: r.z,
          escala,
        };
      };

      /* ---------- malha no canvas ---------- */
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (
        canvas.width !== Math.round(largura * dpr) ||
        canvas.height !== Math.round(altura * dpr)
      ) {
        canvas.width = Math.round(largura * dpr);
        canvas.height = Math.round(altura * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, largura, altura);

      // Halo atrás da esfera
      const halo = ctx.createRadialGradient(
        cx,
        cy,
        raio * 0.2,
        cx,
        cy,
        raio * 1.25,
      );
      halo.addColorStop(0, comAlfa(cor, 0.08));
      halo.addColorStop(1, comAlfa(cor, 0));
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, raio * 1.25, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 1;
      ctx.strokeStyle = cor;
      for (const linha of GRADE) {
        let anterior = projetar(linha[0]);
        for (let i = 1; i < linha.length; i += 1) {
          const atual = projetar(linha[i]);
          // Frente da esfera mais forte; fundo bem fraco
          ctx.globalAlpha = (anterior.z + atual.z) / 2 > 0 ? 0.28 : 0.07;
          ctx.beginPath();
          ctx.moveTo(anterior.x, anterior.y);
          ctx.lineTo(atual.x, atual.y);
          ctx.stroke();
          anterior = atual;
        }
      }
      ctx.globalAlpha = 1;

      /* ---------- ícones no DOM ---------- */
      pontos.forEach((ponto, i) => {
        const el = itensRef.current[i];
        if (!el) return;
        const { x, y, z, escala } = projetar(ponto);
        const profundidade = (z + 1) / 2; // 0 = atrás, 1 = na frente
        el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${(0.62 + 0.38 * profundidade) * escala})`;
        el.style.opacity = String(0.2 + 0.8 * profundidade ** 1.5);
        el.style.zIndex = String(Math.round(profundidade * 100));
        el.style.pointerEvents = profundidade > 0.45 ? 'auto' : 'none';
        // Ícones atrás do globo saem da ordem do Tab
        el.tabIndex = profundidade > 0.45 ? 0 : -1;
      });

      frame = requestAnimationFrame(desenhar);
    };

    const iniciar = () => {
      if (!frame) {
        ultimoTempo = performance.now();
        frame = requestAnimationFrame(desenhar);
      }
    };

    const pausar = () => {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    // Pausa de verdade o rAF enquanto o globo estiver fora da tela
    const observadorTela = new IntersectionObserver(([entrada]) => {
      if (entrada.isIntersecting) iniciar();
      else pausar();
    });
    observadorTela.observe(palco);

    iniciar();

    return () => {
      pausar();
      observadorTela.disconnect();
      observadorTema.disconnect();
    };
  }, [pontos, tema]);

  /* -------------------------------------------------------------
     Arrastar para girar (mouse, caneta ou dedo)
     ------------------------------------------------------------- */
  const aoPressionar = (evento: EventoPonteiro<HTMLDivElement>) => {
    const m = movimento.current;
    m.arrastando = true;
    m.inicio = { x: evento.clientX, y: evento.clientY };
    m.ultimo = { x: evento.clientX, y: evento.clientY };
    m.movido = 0;
    m.vx = 0;
    m.vy = 0;
  };

  const aoMover = (evento: EventoPonteiro<HTMLDivElement>) => {
    const m = movimento.current;
    if (!m.arrastando || !m.inicio || !m.ultimo) return;

    const dx = evento.clientX - m.ultimo.x;
    const dy = evento.clientY - m.ultimo.y;
    m.ultimo = { x: evento.clientX, y: evento.clientY };
    m.movido = Math.hypot(
      evento.clientX - m.inicio.x,
      evento.clientY - m.inicio.y,
    );

    // Só "captura" o ponteiro depois de arrastar de verdade: assim o clique
    // no ícone continua funcionando
    const palco = palcoRef.current;
    if (
      m.movido > DRAG_THRESHOLD &&
      palco &&
      !palco.hasPointerCapture(evento.pointerId)
    ) {
      palco.setPointerCapture(evento.pointerId);
    }

    m.ry += dx * 0.006;
    m.rx = Math.max(-MAX_TILT, Math.min(MAX_TILT, m.rx - dy * 0.006));
    m.vy = dx * 0.006;
    m.vx = -dy * 0.006;
  };

  const aoSoltar = () => {
    movimento.current.arrastando = false;
  };

  const aoSair = (evento: EventoPonteiro<HTMLDivElement>) => {
    const m = movimento.current;
    m.hover = false;
    // Com o ponteiro capturado o arrasto continua mesmo saindo do globo
    if (!palcoRef.current?.hasPointerCapture(evento.pointerId)) {
      m.arrastando = false;
    }
  };

  // Depois de um arrasto, o "click" que vem junto não abre o link.
  // detail === 0 é ativação por teclado (Enter/Espaço), que nunca é arrasto.
  const aoClicar = (evento: EventoMouse<HTMLDivElement>) => {
    if (evento.detail > 0 && movimento.current.movido > DRAG_THRESHOLD) {
      evento.preventDefault();
      evento.stopPropagation();
    }
  };

  return (
    <div
      ref={palcoRef}
      className="skills-globe"
      onPointerDown={aoPressionar}
      onPointerMove={aoMover}
      onPointerUp={aoSoltar}
      onPointerCancel={aoSoltar}
      onPointerEnter={() => {
        movimento.current.hover = true;
      }}
      onPointerLeave={aoSair}
      onClickCapture={aoClicar}
    >
      <canvas
        ref={canvasRef}
        className="skills-globe-canvas"
        aria-hidden="true"
      />

      <ul className="skills-globe-layer" aria-label="Habilidades">
        {skills.map((skill, i) => {
          const Icone = skill.icone;
          return (
            <li key={skill.nome}>
              <a
                ref={(elemento) => {
                  itensRef.current[i] = elemento;
                }}
                className="skills-globe-item"
                data-grupo={slug(skill.grupo)}
                href={skill.link}
                target="_blank"
                rel="noopener noreferrer"
                draggable={false}
                aria-label={skill.nome}
              >
                <Icone aria-hidden="true" />
                <span className="skills-globe-label">{skill.nome}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
