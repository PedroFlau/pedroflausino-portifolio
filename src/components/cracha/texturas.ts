import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';

/** Dimensões da arte do crachá (mesma proporção de /images/cracha.png). */
export const CRACHA_LARGURA = 1342;
export const CRACHA_ALTURA = 2000;

const FONTE_CONDENSADA =
  '"Anton", "Bebas Neue", "Impact", "Oswald", "Arial Narrow", sans-serif';
const FONTE_TEXTO = '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif';

/**
 * Textura da tira: "flausino.dev" repetido sobre fundo preto.
 * O meshline mapeia o eixo U ao longo da tira, então o texto é desenhado na
 * horizontal e repetido com RepeatWrapping.
 */
export function criarTexturaTira(corTexto: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0d0d10';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Costura nas bordas da tira
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.setLineDash([10, 8]);
  ctx.lineWidth = 4;
  for (const y of [16, canvas.height - 16]) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Só o nome, centralizado no tile (o tile se repete ao longo da tira)
  ctx.fillStyle = corTexto;
  ctx.font = `800 100px ${FONTE_TEXTO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('flausino.dev', canvas.width / 2, canvas.height / 2 + 4);

  const textura = new CanvasTexture(canvas);
  textura.colorSpace = SRGBColorSpace;
  textura.wrapS = textura.wrapT = RepeatWrapping;
  return textura;
}

function retanguloArredondado(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Escreve um texto encaixado (esticando/encolhendo na horizontal) num retângulo. */
function textoEncaixado(
  ctx: CanvasRenderingContext2D,
  texto: string,
  x: number,
  y: number,
  largura: number,
  altura: number,
) {
  ctx.save();
  ctx.font = `900 ${altura}px ${FONTE_CONDENSADA}`;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  const medida = ctx.measureText(texto);
  const escala = largura / medida.width;
  ctx.translate(x, y + altura * 0.88);
  ctx.scale(escala, 1);
  ctx.fillText(texto, 0, 0);
  ctx.restore();
}

function pontoCanto(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.fill();
}

function molduraComPontos(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.strokeRect(x, y, w, h);
  pontoCanto(ctx, x, y);
  pontoCanto(ctx, x + w, y);
  pontoCanto(ctx, x, y + h);
  pontoCanto(ctx, x + w, y + h);
}

/**
 * Versão Sith do crachá (tema galactic_empire), desenhada em canvas com o
 * mesmo layout da arte original e a paleta imperial.
 */
export function desenharCrachaSith(foto: HTMLImageElement): CanvasTexture {
  const W = CRACHA_LARGURA;
  const H = CRACHA_ALTURA;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const VERMELHO = '#bc1e22';
  const VERMELHO_ESCURO = '#6e0d10';
  const CINZA = '#64696c';
  const CLARO = '#ece6d6';

  // Corpo externo (borda escura arredondada; cantos ficam transparentes)
  ctx.fillStyle = '#0b0b0e';
  retanguloArredondado(ctx, 0, 0, W, H, 70);
  ctx.fill();

  // Painel interno
  const px = 50;
  const py = 68;
  const pw = W - 100;
  const ph = H - 128;
  ctx.save();
  retanguloArredondado(ctx, px, py, pw, ph, 18);
  ctx.clip();

  const fundo = ctx.createLinearGradient(0, py, 0, py + ph);
  fundo.addColorStop(0, '#17171b');
  fundo.addColorStop(1, '#0f0f12');
  ctx.fillStyle = fundo;
  ctx.fillRect(px, py, pw, ph);

  // Grade sutil
  ctx.strokeStyle = 'rgba(188,30,34,0.07)';
  ctx.lineWidth = 2;
  for (let x = px; x < px + pw; x += 44) {
    ctx.beginPath();
    ctx.moveTo(x, py);
    ctx.lineTo(x, py + ph);
    ctx.stroke();
  }
  for (let y = py; y < py + ph; y += 44) {
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px + pw, y);
    ctx.stroke();
  }

  // Selo "SITH"
  ctx.fillStyle = VERMELHO;
  ctx.fillRect(190, 120, 288, 76);
  ctx.fillStyle = CLARO;
  ctx.font = `900 58px ${FONTE_TEXTO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SITH', 334, 160);

  // Linha do selo até a moldura
  ctx.strokeStyle = VERMELHO;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(478, 158);
  ctx.lineTo(630, 158);
  ctx.lineTo(630, 225);
  ctx.stroke();

  // Emblema "GALACTIC EMPIRE"
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(905, 145, 46, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 4;
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(905 + Math.cos(a) * 14, 145 + Math.sin(a) * 14);
    ctx.lineTo(905 + Math.cos(a) * 42, 145 + Math.sin(a) * 42);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(905, 145, 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = CINZA;
  ctx.textAlign = 'left';
  ctx.font = `800 40px ${FONTE_TEXTO}`;
  ctx.fillText('GALACTIC', 975, 125);
  ctx.fillText('EMPIRE', 975, 168);

  // Moldura + "DEVELOPER"
  ctx.strokeStyle = VERMELHO;
  ctx.fillStyle = VERMELHO;
  ctx.lineWidth = 3;
  molduraComPontos(ctx, 110, 225, 1125, 280);
  textoEncaixado(ctx, 'DEVELOPER', 145, 235, 1030, 260);

  // Janela da foto
  const fx = 160;
  const fy = 560;
  const fw = 780;
  const fh = 1040;
  ctx.save();
  ctx.beginPath();
  ctx.rect(fx, fy, fw, fh);
  ctx.clip();
  const escala = Math.max(fw / foto.naturalWidth, fh / foto.naturalHeight);
  const dw = foto.naturalWidth * escala;
  const dh = foto.naturalHeight * escala;
  ctx.drawImage(foto, fx + (fw - dw) / 2, fy + (fh - dh) * 0.3, dw, dh);
  // Vinheta vermelha
  const vinheta = ctx.createRadialGradient(
    fx + fw / 2, fy + fh / 2, fw * 0.35,
    fx + fw / 2, fy + fh / 2, fw * 0.85,
  );
  vinheta.addColorStop(0, 'rgba(0,0,0,0)');
  vinheta.addColorStop(1, 'rgba(60,0,4,0.55)');
  ctx.fillStyle = vinheta;
  ctx.fillRect(fx, fy, fw, fh);
  ctx.restore();
  ctx.strokeStyle = VERMELHO;
  ctx.lineWidth = 6;
  ctx.strokeRect(fx, fy, fw, fh);

  // "DARK SIDE" na vertical
  ctx.lineWidth = 3;
  ctx.fillStyle = VERMELHO;
  molduraComPontos(ctx, 965, 580, 270, 1040);
  ctx.save();
  ctx.translate(1000, 1590);
  ctx.rotate(-Math.PI / 2);
  textoEncaixado(ctx, 'DARK SIDE', 0, 0, 980, 200);
  ctx.restore();

  // Plaquinha com o nome
  ctx.fillStyle = '#0b0b0e';
  ctx.fillRect(295, 1320, 490, 130);
  ctx.strokeStyle = VERMELHO;
  ctx.lineWidth = 6;
  ctx.strokeRect(295, 1320, 490, 130);
  ctx.fillStyle = CLARO;
  ctx.font = `900 84px ${FONTE_TEXTO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PEDRO', 540, 1388);

  // Faixa inferior
  const faixa = ctx.createLinearGradient(0, 1660, 0, py + ph);
  faixa.addColorStop(0, VERMELHO);
  faixa.addColorStop(1, VERMELHO_ESCURO);
  ctx.fillStyle = faixa;
  ctx.fillRect(px, 1660, pw, py + ph - 1660);
  ctx.fillStyle = CLARO;
  textoEncaixado(ctx, 'PORTFOLIO', 140, 1725, 470, 150);

  ctx.strokeStyle = 'rgba(236,230,214,0.45)';
  ctx.lineWidth = 3;
  retanguloArredondado(ctx, 680, 1770, 155, 62, 31);
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.ellipse(712 + i * 23, 1801, 14, 24, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = CLARO;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `500 40px ${FONTE_TEXTO}`;
  ctx.fillText("Don't repeat", 862, 1795);
  ctx.fillText('yourself', 862, 1842);

  ctx.restore();

  const textura = new CanvasTexture(canvas);
  textura.colorSpace = SRGBColorSpace;
  textura.anisotropy = 8;
  return textura;
}
