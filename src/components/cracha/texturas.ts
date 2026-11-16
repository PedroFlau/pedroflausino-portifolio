import {
  CanvasTexture,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
} from 'three';

/** Dimensões da arte do crachá (mesma proporção de /images/cracha.png). */
export const CRACHA_LARGURA = 1342;
export const CRACHA_ALTURA = 2000;

const FONTE_CONDENSADA =
  '"Anton", "Bebas Neue", "Impact", "Oswald", "Arial Narrow", sans-serif';
const FONTE_TEXTO = '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif';

const MOLDURA = '#121019';

/**
 * Textura da fita: "flausino.dev" sobre tecido preto, com costura nas bordas.
 * O eixo U corre ao longo da fita (repete) e o V atravessa a largura.
 */
export function criarTexturaTira(corTexto: string, corSufixo = corTexto): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;
  const { width: W, height: H } = canvas;

  ctx.fillStyle = '#0d0d10';
  ctx.fillRect(0, 0, W, H);

  // Trama: fios finos atravessando a fita
  ctx.fillStyle = 'rgba(255,255,255,0.045)';
  for (let x = 0; x < W; x += 4) ctx.fillRect(x, 0, 1, H);

  // Costura perto das bordas
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  for (let x = 0; x < W; x += 16) {
    ctx.fillRect(x, H * 0.075, 9, 3);
    ctx.fillRect(x, H * 0.925 - 3, 9, 3);
  }

  // "flausino" + ".dev" (o sufixo pode ter a cor de detalhe do tema), centralizados no tile
  ctx.font = `800 62px ${FONTE_TEXTO}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const larguraNome = ctx.measureText('flausino').width;
  const inicio = (W - larguraNome - ctx.measureText('.dev').width) / 2;
  ctx.fillStyle = corTexto;
  ctx.fillText('flausino', inicio, H / 2 + 4);
  ctx.fillStyle = corSufixo;
  ctx.fillText('.dev', inicio + larguraNome, H / 2 + 4);

  const textura = new CanvasTexture(canvas);
  textura.colorSpace = SRGBColorSpace;
  textura.wrapS = textura.wrapT = RepeatWrapping;
  return textura;
}

/** Monta um normal map (repetível) a partir de uma função de altura. */
function normalDeAltura(tam: number, altura: (x: number, y: number) => number, forca: number) {
  const dados = new Uint8Array(tam * tam * 4);
  for (let y = 0; y < tam; y++) {
    for (let x = 0; x < tam; x++) {
      const dx = (altura(x - 1, y) - altura(x + 1, y)) * forca;
      const dy = (altura(x, y - 1) - altura(x, y + 1)) * forca;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * tam + x) * 4;
      dados[i] = (dx / len / 2 + 0.5) * 255;
      dados[i + 1] = (dy / len / 2 + 0.5) * 255;
      dados[i + 2] = (1 / len / 2 + 0.5) * 255;
      dados[i + 3] = 255;
    }
  }
  const textura = new DataTexture(dados, tam, tam, RGBAFormat);
  textura.wrapS = textura.wrapT = RepeatWrapping;
  textura.magFilter = LinearFilter;
  textura.minFilter = LinearMipmapLinearFilter;
  textura.generateMipmaps = true;
  textura.needsUpdate = true;
  return textura;
}

/** Normal map de tecido trançado para a fita. */
export function criarNormalTrama(): DataTexture {
  const TAM = 128;
  const CELULAS = 8;
  const arco = (v: number) => Math.sqrt(Math.max(0, 1 - 4 * v * v));
  const altura = (x: number, y: number) => {
    const cx = ((((x % TAM) + TAM) % TAM) / TAM) * CELULAS;
    const cy = ((((y % TAM) + TAM) % TAM) / TAM) * CELULAS;
    const u = cx - Math.floor(cx) - 0.5;
    const v = cy - Math.floor(cy) - 0.5;
    const par = (Math.floor(cx) + Math.floor(cy)) % 2 === 0;
    const fioU = arco(u) * (0.55 + 0.45 * Math.cos(v * Math.PI * (par ? 1 : 0.6)));
    const fioV = arco(v) * (0.55 + 0.45 * Math.cos(u * Math.PI * (par ? 0.6 : 1)));
    return par ? Math.max(fioU, fioV * 0.7) : Math.max(fioV, fioU * 0.7);
  };
  const textura = normalDeAltura(TAM, altura, 1.6);
  // U = 4 larguras de fita por tile; V = 1 largura → células quadradas
  textura.repeat.set(8, 2);
  return textura;
}

/** Normal map de grão fino para a superfície do cartão. */
export function criarNormalPapel(): DataTexture {
  const TAM = 128;
  let semente = 7;
  const ruido = Float32Array.from({ length: TAM * TAM }, () => {
    semente = (semente * 1664525 + 1013904223) >>> 0;
    return semente / 4294967296;
  });
  const altura = (x: number, y: number) => {
    let soma = 0;
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        soma += ruido[((y + j + TAM) % TAM) * TAM + ((x + i + TAM) % TAM)];
      }
    }
    return soma / 9;
  };
  const textura = normalDeAltura(TAM, altura, 1.6);
  textura.repeat.set(5, 7);
  return textura;
}

/**
 * Frente do crachá a partir da arte pronta: a moldura, o slot e o gancho do
 * topo estão pintados no PNG. O furo e a argola agora são geometria, então o
 * gancho pintado é coberto (o resto dele cai dentro do furo do slot).
 */
export function prepararArteFrente(arte: CanvasImageSource): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = CRACHA_LARGURA;
  canvas.height = CRACHA_ALTURA;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = MOLDURA;
  ctx.fillRect(0, 0, CRACHA_LARGURA, CRACHA_ALTURA);
  ctx.drawImage(arte, 0, 0, CRACHA_LARGURA, CRACHA_ALTURA);

  // Gancho sobre a moldura (acima do painel, que começa em y = 68)
  ctx.fillStyle = MOLDURA;
  ctx.fillRect(560, 0, 230, 68);
  // Faixa do painel entre a moldura e o furo
  ctx.fillStyle = '#ebe6d3';
  ctx.fillRect(560, 68, 230, 14);

  const textura = new CanvasTexture(canvas);
  textura.colorSpace = SRGBColorSpace;
  return textura;
}

/** Verso do crachá: marca, um bloco de terminal com os contatos e a faixa de baixo. */
export function desenharVersoCracha(
  estilo: EstiloCracha | 'padrao',
  dados: { nome: string; github: string; email: string; cidade: string },
  destaque = '#e3b341',
): CanvasTexture {
  const sith = estilo === 'sith';
  const escuro = estilo === 'escuro';
  const W = CRACHA_LARGURA;
  const H = CRACHA_ALTURA;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const CLARO = sith ? '#ece6d6' : escuro ? '#e6edf3' : '#ebe6d3';
  const DESTAQUE = sith ? '#bc1e22' : escuro ? destaque : '#8795f0';
  const FUNDO = sith
    ? ['#17171b', '#0f0f12']
    : escuro
      ? ['#161b22', '#0d1117']
      : ['#1a2060', '#111642'];
  const TINTA = sith ? '#0b0b0e' : escuro ? '#0d1117' : '#151a52';
  const MONO = '"JetBrains Mono", "Fira Code", "DejaVu Sans Mono", Menlo, Consolas, monospace';

  ctx.fillStyle = MOLDURA;
  ctx.fillRect(0, 0, W, H);

  const px = 50;
  const py = 68;
  const pw = W - 100;
  const ph = H - 128;
  ctx.save();
  retanguloArredondado(ctx, px, py, pw, ph, 18);
  ctx.clip();

  const fundo = ctx.createLinearGradient(0, py, 0, py + ph);
  fundo.addColorStop(0, FUNDO[0]);
  fundo.addColorStop(1, FUNDO[1]);
  ctx.fillStyle = fundo;
  ctx.fillRect(px, py, pw, ph);

  // Grade sutil
  ctx.globalAlpha = 0.07;
  ctx.strokeStyle = estilo === 'padrao' ? CLARO : DESTAQUE;
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
  ctx.globalAlpha = 1;

  // Linha de identificação, abaixo do furo
  ctx.fillStyle = DESTAQUE;
  ctx.font = `700 38px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(sith ? '// GALACTIC EMPIRE · DARK SIDE' : '// PUC MINAS · CIÊNCIA DA COMPUTAÇÃO', W / 2, 250);

  // Marca
  ctx.strokeStyle = DESTAQUE;
  ctx.fillStyle = DESTAQUE;
  ctx.lineWidth = 3;
  molduraComPontos(ctx, 110, 330, 1122, 600);
  ctx.fillStyle = CLARO;
  textoEncaixado(ctx, 'FLAUSINO', 150, 350, 1042, 310);
  ctx.fillStyle = DESTAQUE;
  textoEncaixado(ctx, '.DEV', 150, 670, 520, 230);
  ctx.fillStyle = CLARO;
  ctx.globalAlpha = 0.75;
  ctx.font = `500 40px ${FONTE_TEXTO}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('portfolio', 720, 800);
  ctx.fillText(sith ? 'sith edition' : 'full stack', 720, 852);
  ctx.globalAlpha = 1;

  // Bloco de terminal com os contatos
  const linhas: [string, string][] = [
    ['$', 'whoami'],
    ['', dados.nome.toLowerCase()],
    ['$', 'cat contato.txt'],
    ['', dados.github],
    ['', dados.email],
  ];
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  retanguloArredondado(ctx, 110, 1010, 1122, 540, 20);
  ctx.fill();
  ctx.strokeStyle = DESTAQUE;
  ctx.lineWidth = 3;
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i === 0 ? DESTAQUE : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(160 + i * 42, 1062, 12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.font = `500 46px ${MONO}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  linhas.forEach(([prompt, texto], i) => {
    const y = 1180 + i * 78;
    if (prompt) {
      ctx.fillStyle = DESTAQUE;
      ctx.fillText(prompt, 160, y);
    }
    ctx.fillStyle = CLARO;
    ctx.globalAlpha = prompt ? 1 : 0.82;
    ctx.fillText(texto, 215, y, 980);
    ctx.globalAlpha = 1;
  });

  // Faixa inferior com código de barras
  ctx.fillStyle = estilo === 'padrao' ? CLARO : DESTAQUE;
  ctx.fillRect(px, 1660, pw, py + ph - 1660);
  ctx.fillStyle = TINTA;
  let x = 140;
  for (let i = 0; x < 620; i++) {
    const largura = 4 + ((i * 7) % 5) * 3;
    ctx.fillRect(x, 1730, largura, 130);
    x += largura + 6 + ((i * 3) % 4) * 2;
  }
  ctx.font = `800 54px ${FONTE_TEXTO}`;
  ctx.textAlign = 'left';
  ctx.fillText(dados.cidade.toUpperCase(), 690, 1785, 520);
  ctx.font = `500 38px ${MONO}`;
  ctx.fillText('ID · PF-2026', 690, 1845);

  ctx.restore();

  const textura = new CanvasTexture(canvas);
  textura.colorSpace = SRGBColorSpace;
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

export type EstiloCracha = 'sith' | 'escuro';

/** Escurece uma cor #rrggbb misturando com preto. */
function escurecer(cor: string, fator: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(cor.trim());
  if (!m) return cor;
  const n = parseInt(m[1], 16);
  const canal = (v: number) => Math.round(v * (1 - fator));
  return `rgb(${canal(n >> 16)}, ${canal((n >> 8) & 255)}, ${canal(n & 255)})`;
}

/** Paleta e textos da frente/verso desenhados em canvas, por tema. */
function paletaCracha(estilo: EstiloCracha, destaque: string) {
  return estilo === 'sith'
    ? {
        destaque: '#bc1e22',
        destaqueEscuro: '#6e0d10',
        /** Texto sobre a cor de destaque. */
        sobreDestaque: '#ece6d6',
        claro: '#ece6d6',
        cinza: '#64696c',
        grade: 'rgba(188,30,34,0.07)',
        vinheta: 'rgba(60,0,4,0.55)',
        selo: 'SITH',
        marca: ['GALACTIC', 'EMPIRE'],
        lateral: 'DARK SIDE',
      }
    : {
        destaque,
        destaqueEscuro: escurecer(destaque, 0.35),
        sobreDestaque: '#0d1117',
        claro: '#e6edf3',
        cinza: '#8b949e',
        grade: 'rgba(255,255,255,0.045)',
        vinheta: 'rgba(0,0,0,0.5)',
        selo: 'JUNIOR',
        marca: ['PUC', 'MINAS'],
        lateral: 'FULL STACK',
      };
}

/**
 * Frente do crachá desenhada em canvas, com o mesmo layout da arte original e a
 * paleta do tema: 'sith' (galactic_empire) ou 'escuro' (painel escuro com a cor
 * de detalhe do tema, passada em `destaque`).
 */
export function desenharCrachaTema(
  foto: HTMLImageElement,
  estilo: EstiloCracha,
  destaque = '#e3b341',
  /**
   * A mesma foto com o fundo removido (imagem com transparência, mesmas dimensões).
   * Com ela a pessoa sai da moldura da foto, como na arte do tema claro; sem
   * ela a foto fica inteira dentro da janela.
   */
  recorte: HTMLImageElement | null = null,
): CanvasTexture {
  const W = CRACHA_LARGURA;
  const H = CRACHA_ALTURA;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const P = paletaCracha(estilo, destaque);
  const sith = estilo === 'sith';

  // Corpo externo (moldura)
  ctx.fillStyle = sith ? '#0b0b0e' : MOLDURA;
  ctx.fillRect(0, 0, W, H);

  // Painel interno
  const px = 50;
  const py = 68;
  const pw = W - 100;
  const ph = H - 128;
  ctx.save();
  retanguloArredondado(ctx, px, py, pw, ph, 18);
  ctx.clip();

  const fundo = ctx.createLinearGradient(0, py, 0, py + ph);
  fundo.addColorStop(0, sith ? '#17171b' : '#161b22');
  fundo.addColorStop(1, sith ? '#0f0f12' : '#0d1117');
  ctx.fillStyle = fundo;
  ctx.fillRect(px, py, pw, ph);

  // Grade sutil
  ctx.strokeStyle = P.grade;
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

  // Selo
  ctx.fillStyle = P.destaque;
  ctx.fillRect(190, 120, 288, 76);
  ctx.fillStyle = P.sobreDestaque;
  ctx.font = `900 58px ${FONTE_TEXTO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(P.selo, 334, 160, 260);

  // Linha do selo até a moldura
  ctx.strokeStyle = P.destaque;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(478, 174);
  ctx.lineTo(630, 174);
  ctx.lineTo(630, 225);
  ctx.stroke();

  // Emblema
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(905, 145, 46, 0, Math.PI * 2);
  ctx.stroke();
  if (sith) {
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
  } else {
    ctx.fillStyle = P.destaque;
    ctx.font = `800 34px ${FONTE_TEXTO}`;
    ctx.fillText('</>', 905, 147);
  }
  ctx.fillStyle = P.cinza;
  ctx.textAlign = 'left';
  ctx.font = `800 40px ${FONTE_TEXTO}`;
  ctx.fillText(P.marca[0], 975, 125);
  ctx.fillText(P.marca[1], 975, 168);

  // Moldura + "DEVELOPER"
  ctx.strokeStyle = P.destaque;
  ctx.fillStyle = P.destaque;
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
  let escala: number;
  let fotoX: number;
  let fotoY: number;
  if (recorte) {
    // Pessoa maior que a janela: cabeça sobre o "DEVELOPER", ombros até a faixa de baixo
    escala = sith ? 0.767 : 1.2;
    fotoX = sith ? 71 : -436;
    fotoY = 1660 - foto.naturalHeight * escala;
  } else {
    // Foto inteira dentro da janela (a do tema escuro tem o rosto à direita e mais abaixo)
    escala = Math.max(fw / foto.naturalWidth, fh / foto.naturalHeight) * (sith ? 1 : 1.15);
    fotoX = fx + (fw - foto.naturalWidth * escala) * (sith ? 0.5 : 0.96);
    fotoY = fy + (fh - foto.naturalHeight * escala) * (sith ? 0.3 : 1);
  }
  const dw = foto.naturalWidth * escala;
  const dh = foto.naturalHeight * escala;
  ctx.drawImage(foto, fotoX, fotoY, dw, dh);
  const vinheta = ctx.createRadialGradient(
    fx + fw / 2, fy + fh / 2, fw * 0.35,
    fx + fw / 2, fy + fh / 2, fw * 0.85,
  );
  vinheta.addColorStop(0, 'rgba(0,0,0,0)');
  vinheta.addColorStop(1, P.vinheta);
  ctx.fillStyle = vinheta;
  ctx.fillRect(fx, fy, fw, fh);
  ctx.restore();
  ctx.strokeStyle = P.destaque;
  ctx.lineWidth = 6;
  ctx.strokeRect(fx, fy, fw, fh);

  // Texto lateral na vertical: a moldura fica atrás da pessoa e o texto na frente
  ctx.lineWidth = 3;
  ctx.fillStyle = P.destaque;
  molduraComPontos(ctx, 965, 580, 270, 1040);
  // Pessoa recortada por cima da janela, alinhada com a foto de fundo
  if (recorte) ctx.drawImage(recorte, fotoX, fotoY, dw, dh);
  ctx.fillStyle = P.destaque;
  ctx.save();
  ctx.translate(1000, 1590);
  ctx.rotate(-Math.PI / 2);
  textoEncaixado(ctx, P.lateral, 0, 0, 980, 200);
  ctx.restore();

  // Plaquinha com o nome
  ctx.fillStyle = '#0b0b0e';
  ctx.fillRect(295, 1320, 490, 130);
  ctx.strokeStyle = P.destaque;
  ctx.lineWidth = 6;
  ctx.strokeRect(295, 1320, 490, 130);
  ctx.fillStyle = P.claro;
  ctx.font = `900 84px ${FONTE_TEXTO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PEDRO', 540, 1388);

  // Faixa inferior
  const faixa = ctx.createLinearGradient(0, 1660, 0, py + ph);
  faixa.addColorStop(0, P.destaque);
  faixa.addColorStop(1, P.destaqueEscuro);
  ctx.fillStyle = faixa;
  ctx.fillRect(px, 1660, pw, py + ph - 1660);
  ctx.fillStyle = P.sobreDestaque;
  textoEncaixado(ctx, 'PORTFOLIO', 140, 1725, 470, 150);

  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = P.sobreDestaque;
  ctx.lineWidth = 3;
  retanguloArredondado(ctx, 680, 1770, 155, 62, 31);
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.ellipse(712 + i * 23, 1801, 14, 24, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = P.sobreDestaque;
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
