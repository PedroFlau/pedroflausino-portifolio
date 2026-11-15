import {
  useEffect,
  useMemo,
  useRef,
  type MouseEvent as EventoMouse,
  type PointerEvent as EventoPonteiro,
} from 'react';
import type { IconType } from 'react-icons';
import type { Tema } from '../hooks/useTema';
import './SkillsAtom.css';

/**
 * Átomo 3D de habilidades feito só com React + CSS + <canvas> 2D.
 *
 *   1. Cada categoria é uma órbita elíptica (círculo 3D inclinado e girado em
 *      Z), desenhada no <canvas> com alpha maior na frente.
 *   2. As skills são os elétrons: cada uma percorre sua órbita com fase
 *      própria e é um link para a documentação da tecnologia.
 *   3. O núcleo é decorativo: 8 esferas (4 prótons + 4 nêutrons) com gradiente
 *      de brilho, ordenadas por profundidade.
 *   4. Os ícones são movidos direto no DOM (style.transform), sem re-render do
 *      React a cada quadro.
 *
 * Arraste para girar (mouse, caneta ou dedo). Hover desacelera a rotação.
 */

export type HabilidadeAtomo = {
  nome: string;
  grupo: string;
  icone: IconType;
  link: string;
};

type Ponto3D = { x: number; y: number; z: number };

const DRAG_THRESHOLD = 6; // px: acima disso o clique vira arrasto e não abre o link
const MAX_TILT = 1.2; // rad: limite da inclinação vertical
const VELOCIDADE_AUTO = 0.12; // rad/s: giro automático do átomo
const INERCIA = 0.92; // desaceleração por quadro depois de soltar
const AMOSTRAS_ORBITA = 96; // pontos por órbita
const INCLINACAO_BASE = 1.05; // rad: inclinação do círculo em torno de X
const COR_PADRAO = '#e3b341'; // fallback se --skills-line não estiver disponível

/** Categorias na ordem das órbitas: o índice no array é o índice da órbita. */
const CAMADAS = ['linguagens', 'front-end', 'ferramentas'] as const;

/** Velocidade (rad/s) e órbita de cada categoria. */
const ORBITAS: Record<string, { indice: number; velocidade: number }> = {
  linguagens: { indice: 0, velocidade: 0.34 },
  'front-end': { indice: 1, velocidade: -0.28 },
  ferramentas: { indice: 2, velocidade: 0.24 },
};

/**
 * Núcleo decorativo: 4 prótons e 4 nêutrons em posições fixas (cluster).
 * Os offsets ficam em torno de ±0.55 e são escalados por `raio * 0.27`.
 */
const NUCLEO: (Ponto3D & { proton: boolean })[] = [
  { x: -0.5, y: -0.3, z: -0.12, proton: true },
  { x: 0.46, y: -0.44, z: 0.1, proton: false },
  { x: 0.06, y: 0.08, z: -0.46, proton: true },
  { x: -0.16, y: 0.5, z: 0.04, proton: false },
  { x: 0.5, y: 0.14, z: -0.3, proton: true },
  { x: -0.46, y: 0.1, z: 0.34, proton: false },
  { x: 0.1, y: -0.16, z: 0.5, proton: true },
  { x: -0.06, y: 0.44, z: 0.4, proton: false },
];

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

/** Ponto da órbita `indice` (0/1/2) no ângulo `theta`, antes do giro global. */
function pontoOrbita(indice: number, theta: number): Ponto3D {
  const inclinacao = INCLINACAO_BASE + indice * 0.03;
  const x = Math.cos(theta);
  const y = Math.sin(theta) * Math.cos(inclinacao);
  const z = Math.sin(theta) * Math.sin(inclinacao);
  const rotZ = (indice * Math.PI) / 3;
  const cosZ = Math.cos(rotZ);
  const sinZ = Math.sin(rotZ);
  return { x: x * cosZ - y * sinZ, y: x * sinZ + y * cosZ, z };
}

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

export function SkillsAtom({
  skills,
  grupoAtivo,
  tema,
}: {
  skills: HabilidadeAtomo[];
  grupoAtivo: string | null;
  tema: Tema;
}) {
  const palcoRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const itensRef = useRef<(HTMLAnchorElement | null)[]>([]);

  // Órbita e posição dentro da órbita de cada elétron (derivado das skills)
  const eletrons = useMemo(() => {
    const totais = new Map<string, number>();
    for (const skill of skills) {
      const chave = slug(skill.grupo);
      totais.set(chave, (totais.get(chave) ?? 0) + 1);
    }

    const vistos = new Map<string, number>();
    return skills.map((skill) => {
      const chave = slug(skill.grupo);
      const posicao = vistos.get(chave) ?? 0;
      vistos.set(chave, posicao + 1);
      return {
        chave,
        orbita: ORBITAS[chave] ?? ORBITAS.linguagens,
        posicao,
        total: totais.get(chave) ?? 1,
      };
    });
  }, [skills]);

  // Estado da animação em refs: muda a cada quadro e não precisa de re-render
  const movimento = useRef<EstadoMovimento>({
    rx: -0.32, // inclinação inicial
    ry: 0.2, // giro inicial
    vx: 0, // velocidade do arrasto (inércia)
    vy: 0,
    arrastando: false,
    hover: false,
    inicio: null,
    ultimo: null,
    movido: 0,
  });

  // Fase de cada órbita: em ref para o filtro (que refaz o efeito) não
  // reiniciar o movimento dos elétrons
  const tempoRef = useRef<number[]>([0, 0.7, 1.4]);

  /* -------------------------------------------------------------
     Loop de animação + órbitas e núcleo no canvas
     ------------------------------------------------------------- */
  useEffect(() => {
    const palco = palcoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!palco || !canvas || !ctx) return;

    const reduzido = prefereMenosMovimento();
    const m = movimento.current;
    const tempo = tempoRef.current;
    // A prop vem com o nome do grupo ("Front-end"); o canvas compara por slug
    const grupo = grupoAtivo ? slug(grupoAtivo) : null;

    let corLinha = COR_PADRAO;
    let corProton = COR_PADRAO;
    let corNeutron = COR_PADRAO;
    let corHalo = COR_PADRAO;
    const corOrbita: Record<string, string> = {};
    let frame = 0;
    let ultimoTempo = performance.now();

    // As cores vêm do CSS do tema. As `--atom-*` apontam para `--skill-*`, e o
    // getComputedStyle resolve a substituição. `data-theme` é aplicado pelo App
    // num efeito (depois dos efeitos dos filhos), por isso o MutationObserver:
    // garante que a troca de tema repinta mesmo assim.
    const lerCor = (nome: string, padrao: string) => {
      const valor = getComputedStyle(palco).getPropertyValue(nome).trim();
      return valor && !valor.startsWith('var(') ? valor : padrao;
    };

    const lerCores = () => {
      corLinha = lerCor('--skills-line', COR_PADRAO);
      corProton = lerCor('--atom-proton', corLinha);
      corNeutron = lerCor('--atom-neutron', corLinha);
      corHalo = lerCor('--atom-halo', corLinha);
      for (const chave of CAMADAS) {
        corOrbita[chave] = lerCor(`--atom-${chave}`, corLinha);
      }
    };
    lerCores();

    const observadorTema = new MutationObserver(lerCores);
    observadorTema.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    const desenhar = (agora: number) => {
      const dt = reduzido ? 0 : Math.min((agora - ultimoTempo) / 1000, 0.05);
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
      const raio = Math.min(largura, altura) * 0.4;
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

      // Halo atrás do átomo
      const halo = ctx.createRadialGradient(
        cx,
        cy,
        raio * 0.15,
        cx,
        cy,
        raio * 1.3,
      );
      halo.addColorStop(0, comAlfa(corHalo, 0.08));
      halo.addColorStop(1, comAlfa(corHalo, 0));
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, raio * 1.3, 0, Math.PI * 2);
      ctx.fill();

      /* ---------- órbitas ---------- */
      ctx.lineWidth = 1.2;
      for (const chave of CAMADAS) {
        const ativa = !grupo || grupo === chave;
        const frente = ativa ? 0.32 : 0.12;
        const tras = ativa ? 0.1 : 0.04;

        const pontos: { x: number; y: number; z: number }[] = [];
        for (let i = 0; i <= AMOSTRAS_ORBITA; i += 1) {
          const theta = (i / AMOSTRAS_ORBITA) * Math.PI * 2;
          pontos.push(projetar(pontoOrbita(ORBITAS[chave].indice, theta)));
        }

        ctx.strokeStyle = corOrbita[chave] || corLinha;
        for (let i = 1; i < pontos.length; i += 1) {
          const anterior = pontos[i - 1];
          const atual = pontos[i];
          // Frente da órbita mais forte; fundo bem fraco
          ctx.globalAlpha = (anterior.z + atual.z) / 2 > 0 ? frente : tras;
          ctx.beginPath();
          ctx.moveTo(anterior.x, anterior.y);
          ctx.lineTo(atual.x, atual.y);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      /* ---------- núcleo ---------- */
      // Escala do cluster: offsets normalizados × 0.27 do raio do átomo
      const esferas = NUCLEO.map((nucleon) => ({
        ...projetar({
          x: nucleon.x * 0.27,
          y: nucleon.y * 0.27,
          z: nucleon.z * 0.27,
        }),
        proton: nucleon.proton,
      })).sort((a, b) => a.z - b.z); // z crescente: fundo primeiro

      for (const esfera of esferas) {
        const r = raio * 0.115 * esfera.escala;
        ctx.beginPath();
        ctx.arc(esfera.x, esfera.y, r, 0, Math.PI * 2);
        ctx.fillStyle = esfera.proton ? corProton : corNeutron;
        ctx.fill();

        // Brilho: claro no topo-esquerdo, escuro na borda
        const brilho = ctx.createRadialGradient(
          esfera.x - r * 0.35,
          esfera.y - r * 0.35,
          r * 0.1,
          esfera.x,
          esfera.y,
          r * 1.05,
        );
        brilho.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
        brilho.addColorStop(0.55, 'rgba(255, 255, 255, 0)');
        brilho.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
        ctx.fillStyle = brilho;
        ctx.fill();
      }

      /* ---------- elétrons no DOM ---------- */
      eletrons.forEach((eletron, i) => {
        const el = itensRef.current[i];
        if (!el) return;

        const theta =
          tempo[eletron.orbita.indice] +
          (eletron.posicao * Math.PI * 2) / eletron.total;
        const { x, y, z, escala } = projetar(
          pontoOrbita(eletron.orbita.indice, theta),
        );
        const profundidade = (z + 1) / 2; // 0 = atrás, 1 = na frente
        const ativo = !grupo || eletron.chave === grupo;

        el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${(0.62 + 0.38 * profundidade) * escala})`;
        el.style.opacity = String(
          (0.2 + 0.8 * profundidade ** 1.5) * (ativo ? 1 : 0.3),
        );
        el.style.zIndex = String(Math.round(profundidade * 100));
        el.style.pointerEvents =
          ativo && profundidade > 0.45 ? 'auto' : 'none';
        // Elétrons atrás do átomo (ou de categoria filtrada) saem do Tab
        el.tabIndex = ativo && profundidade > 0.45 ? 0 : -1;
      });

      // Avança a fase de cada órbita (dt congelado em reduced motion)
      for (const chave of CAMADAS) {
        const { indice, velocidade } = ORBITAS[chave];
        tempo[indice] += velocidade * dt;
      }

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

    // Pausa de verdade o rAF enquanto o átomo estiver fora da tela
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
  }, [eletrons, grupoAtivo, tema]);

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
    // Com o ponteiro capturado o arrasto continua mesmo saindo do átomo
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
      className="skills-atom"
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
        className="skills-atom-canvas"
        aria-hidden="true"
      />

      <ul className="skills-atom-layer" aria-label="Habilidades">
        {skills.map((skill, i) => {
          const Icone = skill.icone;
          return (
            <li key={skill.nome}>
              <a
                ref={(elemento) => {
                  itensRef.current[i] = elemento;
                }}
                className="skills-atom-item"
                data-grupo={slug(skill.grupo)}
                href={skill.link}
                target="_blank"
                rel="noopener noreferrer"
                draggable={false}
                aria-label={skill.nome}
              >
                <Icone aria-hidden="true" />
                <span className="skills-atom-label">{skill.nome}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
