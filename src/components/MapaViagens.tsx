import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { LAND_DOTS } from '../data/landDots';
import { paisesVisitados, viagens } from '../data/portfolio';
import { useTema } from '../hooks/useTema';
import { Passaporte } from './Passaporte';

type Modo = 'mapa' | 'globo';
type Ponto = [number, number];
type Giro = { lng: number; lat: number };
type Caixa = { x1: number; y1: number; x2: number; y2: number };
type Alvo = { x: number; y: number; opacidade: number };
type Alinhamento = 'left' | 'right' | 'center';
type Escolha = {
  x: number;
  y: number;
  alinhamento: Alinhamento;
  caixa: Caixa;
  livre: boolean;
};

const D2R = Math.PI / 180;
const FONTE = "'Fira Code', 'Courier New', monospace";

/** Pontos de terra (lng, lat) pré-gerados em src/data/landDots.ts. */
const TERRA: Ponto[] = LAND_DOTS.split(' ').map((par) => {
  const [lng, lat] = par.split(',');
  return [Number(lng), Number(lat)];
});

/** Nome curto das cidades (sem o país). */
const CIDADES = viagens.map((v) => ({ ...v, curto: v.lugar.split(',')[0] }));

/** Posições onde o rótulo pode ficar, em ordem de preferência. */
const POSICOES: [number, number, Alinhamento][] = [
  [9, -10, 'left'],
  [9, 13, 'left'],
  [-9, -10, 'right'],
  [-9, 13, 'right'],
  [9, 27, 'left'],
  [-9, -24, 'right'],
  [9, -27, 'left'],
  [-9, 27, 'right'],
  [0, 40, 'center'],
  [0, -37, 'center'],
  [30, -12, 'left'],
  [-30, 15, 'right'],
];

function colide(a: Caixa, ocupadas: Caixa[]): boolean {
  return ocupadas.some(
    (b) => a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1,
  );
}

/** Área total sobreposta (usada quando nenhuma posição livre é encontrada). */
function sobreposicao(a: Caixa, ocupadas: Caixa[]): number {
  let total = 0;
  for (const b of ocupadas) {
    const w = Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1);
    const h = Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1);
    if (w > 0 && h > 0) total += w * h;
  }
  return total;
}

/** Desenha os marcadores e distribui os rótulos evitando sobreposição. */
function desenharMarcadores(
  ctx: CanvasRenderingContext2D,
  alvos: Alvo[],
  accent: string,
  rotulos: string[],
) {
  // Reserva o espaço das bolinhas para nenhum rótulo cobrir outra cidade
  const ocupadas: Caixa[] = alvos.map((a) => ({
    x1: a.x - 7,
    y1: a.y - 7,
    x2: a.x + 7,
    y2: a.y + 7,
  }));

  // Bolinhas
  alvos.forEach((a) => {
    ctx.globalAlpha = a.opacidade * 0.18;
    ctx.beginPath();
    ctx.arc(a.x, a.y, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();

    ctx.globalAlpha = a.opacidade;
    ctx.beginPath();
    ctx.arc(a.x, a.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Rótulos: tenta a primeira posição livre; se não houver, usa a que
  // sobrepõe menos e liga o texto à cidade com uma linha-guia.
  ctx.fillStyle = accent;
  alvos.forEach((a, i) => {
    const texto = rotulos[i];
    const largura = ctx.measureText(texto).width + 6;
    const altura = 13;

    let escolhida: Escolha | null = null;
    let melhor: { peso: number; opcao: Escolha } | null = null;

    for (const [dx, dy, alinhamento] of POSICOES) {
      const x = a.x + dx;
      const y = a.y + dy;
      const x1 =
        alinhamento === 'left'
          ? x
          : alinhamento === 'right'
            ? x - largura
            : x - largura / 2;
      const caixa = { x1, y1: y - altura / 2, x2: x1 + largura, y2: y + altura / 2 };
      const opcao = { x, y, alinhamento, caixa, livre: true };

      if (!colide(caixa, ocupadas)) {
        escolhida = opcao;
        break;
      }
      const peso = sobreposicao(caixa, ocupadas);
      if (!melhor || peso < melhor.peso) melhor = { peso, opcao };
    }

    if (!escolhida && melhor) escolhida = { ...melhor.opcao, livre: false };
    if (!escolhida) return;

    ocupadas.push(escolhida.caixa);
    const { x, y, alinhamento, livre } = escolhida;

    // Linha-guia quando o texto fica longe da cidade
    if (Math.hypot(x - a.x, y - a.y) > 16 || !livre) {
      const ancoraX = alinhamento === 'left' ? x - 2 : alinhamento === 'right' ? x + 2 : x;
      ctx.globalAlpha = a.opacidade * 0.4;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(ancoraX, y);
      ctx.stroke();
    }

    ctx.globalAlpha = a.opacidade;
    ctx.textAlign = alinhamento;
    ctx.fillText(texto, x, y);
    ctx.globalAlpha = 1;
  });
}

/** Mapa-múndi em grade de pontos (projeção equirretangular). */
function pintarMapa(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  accent: string,
  fraco: string,
) {
  const escala = Math.min(w / 360, h / 180);
  const offX = (w - 360 * escala) / 2;
  const offY = (h - 180 * escala) / 2;
  const px = (lng: number) => offX + (lng + 180) * escala;
  const py = (lat: number) => offY + (90 - lat) * escala;

  // Continentes em pontilhado
  const d = Math.max(1.2, escala * 0.9);
  ctx.fillStyle = fraco;
  ctx.globalAlpha = 0.32;
  for (let i = 0; i < TERRA.length; i++) {
    const ponto = TERRA[i];
    ctx.fillRect(px(ponto[0]) - d / 2, py(ponto[1]) - d / 2, d, d);
  }
  ctx.globalAlpha = 1;

  // Linha do Equador (referência discreta)
  ctx.strokeStyle = fraco;
  ctx.globalAlpha = 0.12;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(offX, py(0));
  ctx.lineTo(offX + 360 * escala, py(0));
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Lugares visitados
  ctx.font = `600 ${Math.max(10, Math.round(escala * 4))}px ${FONTE}`;
  ctx.textBaseline = 'middle';
  desenharMarcadores(
    ctx,
    CIDADES.map((c) => ({ x: px(c.lng), y: py(c.lat), opacidade: 1 })),
    accent,
    CIDADES.map((c) => c.curto),
  );
}

/** Projeta (lng, lat) numa esfera giratória (projeção ortográfica). */
function projetarGlobo(
  lng: number,
  lat: number,
  giro: Giro,
  cx: number,
  cy: number,
  raio: number,
): [number, number, number] {
  const lambda = (lng + giro.lng) * D2R;
  const phi = lat * D2R;
  const phi0 = giro.lat * D2R;
  const cosPhi = Math.cos(phi);

  const x = cosPhi * Math.sin(lambda);
  const y = Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * cosPhi * Math.cos(lambda);
  const z = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * cosPhi * Math.cos(lambda);

  return [cx + raio * x, cy - raio * y, z];
}

/** Traça uma linha seguindo a curvatura da esfera (só a parte visível). */
function tracarLinha(
  ctx: CanvasRenderingContext2D,
  pontos: Ponto[],
  giro: Giro,
  cx: number,
  cy: number,
  raio: number,
) {
  ctx.beginPath();
  let desenhando = false;
  for (const [lng, lat] of pontos) {
    const [x, y, z] = projetarGlobo(lng, lat, giro, cx, cy, raio);
    if (z > 0) {
      if (desenhando) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
      desenhando = true;
    } else {
      desenhando = false;
    }
  }
  ctx.stroke();
}

/** Globo terrestre de pontos. */
function pintarGlobo(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  accent: string,
  fraco: string,
  giro: Giro,
) {
  const raio = Math.min(w, h) / 2 - 24;
  const cx = w / 2;
  const cy = h / 2;

  // Corpo do planeta
  ctx.beginPath();
  ctx.arc(cx, cy, raio, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.06;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Contorno
  ctx.strokeStyle = fraco;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, raio, 0, Math.PI * 2);
  ctx.stroke();

  // Grade (meridianos e paralelos)
  ctx.globalAlpha = 0.16;
  for (let m = -180; m < 180; m += 30) {
    const linha: Ponto[] = [];
    for (let lat = -90; lat <= 90; lat += 4) linha.push([m, lat]);
    tracarLinha(ctx, linha, giro, cx, cy, raio);
  }
  for (let p = -60; p <= 60; p += 30) {
    const linha: Ponto[] = [];
    for (let lng = -180; lng <= 180; lng += 4) linha.push([lng, p]);
    tracarLinha(ctx, linha, giro, cx, cy, raio);
  }
  ctx.globalAlpha = 1;

  // Continentes
  ctx.fillStyle = fraco;
  for (let i = 0; i < TERRA.length; i++) {
    const ponto = TERRA[i];
    const [x, y, z] = projetarGlobo(ponto[0], ponto[1], giro, cx, cy, raio);
    if (z <= 0) continue;
    ctx.globalAlpha = 0.22 + 0.6 * z;
    const d = 1.4 + 1.1 * z;
    ctx.fillRect(x - d / 2, y - d / 2, d, d);
  }
  ctx.globalAlpha = 1;

  // Lugares visitados
  ctx.font = `600 11px ${FONTE}`;
  ctx.textBaseline = 'middle';

  const visiveis: Alvo[] = [];
  const rotulos: string[] = [];
  CIDADES.forEach((c) => {
    const [x, y, z] = projetarGlobo(c.lng, c.lat, giro, cx, cy, raio);
    if (z <= 0.02) return;
    visiveis.push({ x, y, opacidade: Math.min(1, 0.35 + z) });
    rotulos.push(c.curto);
  });
  desenharMarcadores(ctx, visiveis, accent, rotulos);
}

export function MapaViagens() {
  const { tema } = useTema();
  const [modo, setModo] = useState<Modo>('mapa');
  const [passaporteAberto, setPassaporteAberto] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const giroRef = useRef<Giro>({ lng: 40, lat: 18 });
  const arrastoRef = useRef({ ativo: false, x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const estilos = getComputedStyle(document.documentElement);
    const accent = estilos.getPropertyValue('--accent').trim() || '#e3b341';
    const fraco = estilos.getPropertyValue('--texto-fraco').trim() || '#8b949e';

    let cancelado = false;
    let raf = 0;

    const ajustar = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth || 640;
      const h = canvas.clientHeight || 380;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      return { w, h, dpr };
    };

    const desenhar = () => {
      const { w, h, dpr } = ajustar();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (modo === 'mapa') pintarMapa(ctx, w, h, accent, fraco);
      else pintarGlobo(ctx, w, h, accent, fraco, giroRef.current);
    };

    const animar = () => {
      if (cancelado) return;
      if (!arrastoRef.current.ativo) {
        giroRef.current.lng = ((((giroRef.current.lng + 0.12) % 360) + 540) % 360) - 180;
      }
      desenhar();
      raf = requestAnimationFrame(animar);
    };

    const observador = new ResizeObserver(desenhar);
    observador.observe(canvas);

    if (modo === 'globo') raf = requestAnimationFrame(animar);
    else desenhar();

    return () => {
      cancelado = true;
      cancelAnimationFrame(raf);
      observador.disconnect();
    };
  }, [modo, tema]);

  const aoPressionar = (e: PointerEvent<HTMLCanvasElement>) => {
    if (modo !== 'globo') return;
    arrastoRef.current = { ativo: true, x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const aoMover = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!arrastoRef.current.ativo) return;
    const dx = e.clientX - arrastoRef.current.x;
    const dy = e.clientY - arrastoRef.current.y;
    arrastoRef.current.x = e.clientX;
    arrastoRef.current.y = e.clientY;
    giroRef.current.lng += dx * 0.35;
    giroRef.current.lat = Math.max(-85, Math.min(85, giroRef.current.lat + dy * 0.35));
  };

  const aoSoltar = () => {
    arrastoRef.current.ativo = false;
  };

  return (
    <div className="mapa-viagens">
      <div className="mapa-topo">
        <div className="mapa-botoes">
          <button
            type="button"
            className={modo === 'mapa' ? 'ativo' : ''}
            onClick={() => setModo('mapa')}
          >
            🗺 mapa-múndi
          </button>
          <button
            type="button"
            className={modo === 'globo' ? 'ativo' : ''}
            onClick={() => setModo('globo')}
          >
            🌍 globo terrestre
          </button>
        </div>
        <div className="mapa-acoes">
          <span className="text-gray mapa-contagem">
            {viagens.length} lugares · {paisesVisitados.length} países
          </span>
          <button
            type="button"
            className="passaporte-abrir"
            onClick={() => setPassaporteAberto(true)}
          >
            🛂 passaporte
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className={'mapa-canvas' + (modo === 'globo' ? ' globo' : '')}
        onPointerDown={aoPressionar}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        onPointerCancel={aoSoltar}
      />

      <p className="cmd-aviso mapa-legenda">
        {modo === 'globo'
          ? '🌍 arraste o planeta para girar'
          : '🗺 os pontos claros formam os continentes; os marcadores são os lugares que já visitei'}
      </p>

      {passaporteAberto && (
        <Passaporte onFechar={() => setPassaporteAberto(false)} />
      )}
    </div>
  );
}
