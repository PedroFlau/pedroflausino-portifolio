import { ExtrudeGeometry, Path, Shape, ShapeGeometry } from 'three';

/** Dimensões da arte do crachá em pixels (/images/cracha.webp). */
export const ARTE_LARGURA_PX = 1342;
export const ARTE_ALTURA_PX = 2000;

/** Tamanho do cartão em unidades do mundo (mesma proporção da arte). */
export const CARTAO_ALTURA = 2.9;
export const CARTAO_LARGURA = CARTAO_ALTURA * (ARTE_LARGURA_PX / ARTE_ALTURA_PX);
/** Miolo extrudado + um bisel de cada lado. */
const MIOLO = 0.024;
const BISEL = 0.008;
export const CARTAO_ESPESSURA = MIOLO + 2 * BISEL;

const px = (v: number) => (v / ARTE_LARGURA_PX) * CARTAO_LARGURA;

/** Raio do canto, medido na arte (≈ 80px). */
const RAIO_CANTO = px(80);

/**
 * Furo do slot, na mesma posição do slot desenhado na arte (x 524–809, y 80–143),
 * com uma folga para engolir a borda pintada.
 */
export const SLOT = {
  largura: px(300),
  altura: px(72),
  /** Centro do furo, medido a partir do centro do cartão. */
  y: CARTAO_ALTURA / 2 - px(112),
};

/** Argola: passa pelo furo e abraça a borda de cima do cartão. */
export const ARGOLA_RAIO = 0.15;
export const ARGOLA_TUBO = 0.018;
export const ARGOLA_Y = SLOT.y + ARGOLA_RAIO;
/** Ponto do cartão (topo da argola) onde a fita se prende. */
export const ANCORA_Y = ARGOLA_Y + ARGOLA_RAIO;

/** Retângulo com cantos arredondados (Bézier) num Shape ou Path. */
function formaArredondada(alvo: Path, x: number, y: number, w: number, h: number, raio: number) {
  const r = Math.max(0, Math.min(raio, w / 2, h / 2));
  const k = r * 0.4477;
  alvo.moveTo(x + r, y);
  alvo.lineTo(x + w - r, y);
  alvo.bezierCurveTo(x + w - k, y, x + w, y + k, x + w, y + r);
  alvo.lineTo(x + w, y + h - r);
  alvo.bezierCurveTo(x + w, y + h - k, x + w - k, y + h, x + w - r, y + h);
  alvo.lineTo(x + r, y + h);
  alvo.bezierCurveTo(x + k, y + h, x, y + h - k, x, y + h - r);
  alvo.lineTo(x, y + r);
  alvo.bezierCurveTo(x, y + k, x + k, y, x + r, y);
}

/**
 * Corpo do cartão (extrusão com bisel, cantos arredondados e furo do slot) e a
 * face plana que recebe a arte. O UV da face cobre o cartão inteiro, então a
 * arte de 1342×2000 cai exatamente no lugar; frente e verso usam a mesma face.
 */
export function criarGeometriaCartao() {
  const L = CARTAO_LARGURA;
  const A = CARTAO_ALTURA;

  // O bisel cresce para fora: o contorno entra BISEL para o total fechar em L×A
  const contorno = new Shape();
  formaArredondada(contorno, -L / 2 + BISEL, -A / 2 + BISEL, L - 2 * BISEL, A - 2 * BISEL, RAIO_CANTO - BISEL);
  const furo = new Path();
  formaArredondada(
    furo,
    -SLOT.largura / 2 - BISEL,
    SLOT.y - SLOT.altura / 2 - BISEL,
    SLOT.largura + 2 * BISEL,
    SLOT.altura + 2 * BISEL,
    SLOT.altura / 2 + BISEL,
  );
  contorno.holes.push(furo);

  const corpo = new ExtrudeGeometry(contorno, {
    depth: MIOLO,
    bevelEnabled: true,
    bevelThickness: BISEL,
    bevelSize: BISEL,
    bevelSegments: 5,
    curveSegments: 24,
  });
  corpo.translate(0, 0, -MIOLO / 2);

  const face = new ShapeGeometry(contorno, 24);
  const pos = face.getAttribute('position');
  const uv = face.getAttribute('uv');
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) + L / 2) / L, (pos.getY(i) + A / 2) / A);
  }
  uv.needsUpdate = true;

  return { corpo, face };
}

/** Presilha metálica que morde a ponta da fita. */
export function criarGeometriaPresilha(larguraFita: number) {
  const w = larguraFita * 1.16;
  const h = 0.15;
  const bisel = 0.016;
  const forma = new Shape();
  formaArredondada(forma, -w / 2 + bisel, -h / 2 + bisel, w - 2 * bisel, h - 2 * bisel, 0.028);
  const geo = new ExtrudeGeometry(forma, {
    depth: 0.024,
    bevelEnabled: true,
    bevelThickness: bisel,
    bevelSize: bisel,
    bevelSegments: 6,
    curveSegments: 10,
  });
  geo.translate(0, 0, -0.012);
  return geo;
}
