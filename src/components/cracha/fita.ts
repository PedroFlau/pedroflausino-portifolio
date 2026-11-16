import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Matrix4,
  Vector3,
  type Object3D,
} from 'three';

/** Largura da fita em unidades do mundo (≈ 22% da largura do cartão). */
export const FITA_LARGURA = 0.42;
/** Comprimento de fita coberto por uma repetição da textura (tile 4:1). */
const TILE = FITA_LARGURA * 4;
/** Trecho reto acima do ponto de engate: a fita desce até RETA_BASE, dentro da presilha. */
const RETA_TOPO = 0.3;
const RETA_BASE = 0.11;
/** Distância (a partir da ponta de baixo) do centro do texto: ele fica logo acima da presilha. */
const CENTRO_TEXTO = 0.56;
/** Altura da presilha acima do ponto de engate. */
export const PRESILHA_Y = 0.13;

const AMOSTRAS = 72;
/** Perfil da fita: as bordas dobram um pouco para trás (normais abertas), como tecido. */
const PERFIL = [0, 0.07, 0.93, 1];
const ANGULOS = [-0.95, -0.28, 0.28, 0.95].map((a) => [Math.cos(a), Math.sin(a)] as const);

export function criarGeometriaFita(): BufferGeometry {
  const colunas = PERFIL.length;
  const geo = new BufferGeometry();
  const total = AMOSTRAS * colunas;
  geo.setAttribute('position', new BufferAttribute(new Float32Array(total * 3), 3));
  geo.setAttribute('normal', new BufferAttribute(new Float32Array(total * 3), 3));
  geo.setAttribute('uv', new BufferAttribute(new Float32Array(total * 2), 2));
  const indices: number[] = [];
  for (let i = 0; i < AMOSTRAS - 1; i++) {
    for (let k = 0; k < colunas - 1; k++) {
      const a = i * colunas + k;
      indices.push(a, a + 1, a + colunas, a + 1, a + colunas + 1, a + colunas);
    }
  }
  geo.setIndex(indices);
  return geo;
}

export type EstadoFita = ReturnType<typeof criarEstadoFita>;

export function criarEstadoFita() {
  const curva = new CatmullRomCurve3([new Vector3(), new Vector3()], false, 'centripetal');
  return {
    curva,
    pontos: Array.from({ length: AMOSTRAS }, () => new Vector3()),
    laterais: Array.from({ length: AMOSTRAS }, () => new Vector3()),
    reta: [new Vector3(), new Vector3()] as const,
    cima: new Vector3(),
    tangente: new Vector3(),
    paraCamera: new Vector3(),
    lateral: new Vector3(),
    frente: new Vector3(),
    base: new Matrix4(),
  };
}

/**
 * Recalcula a malha da fita. `nos` vem de cima para baixo: ponto fixo, nós do
 * meio e, por último, o ponto de engate no cartão. A fita fica de frente para a
 * câmera no topo e vai torcendo até acompanhar o giro do cartão (`torcao`, em
 * radianos) no trecho reto que entra na presilha.
 */
export function atualizarFita(
  geo: BufferGeometry,
  e: EstadoFita,
  nos: Vector3[],
  camera: Vector3,
  torcao: number,
  presilha: Object3D | null,
) {
  const ponta = nos[nos.length - 1];

  // Nó mais baixo que ainda está longe o bastante para dar a direção do trecho reto
  let ultimo = nos.length - 2;
  while (ultimo > 0 && nos[ultimo].distanceTo(ponta) < RETA_TOPO * 1.1) ultimo--;
  const cima = e.cima.subVectors(nos[ultimo], ponta);
  if (cima.lengthSq() < 1e-8) cima.set(0, 1, 0);
  cima.normalize();

  const [retaTopo, retaBase] = e.reta;
  retaTopo.copy(ponta).addScaledVector(cima, RETA_TOPO);
  retaBase.copy(ponta).addScaledVector(cima, RETA_BASE);

  // Curva de baixo para cima
  const pts = e.curva.points;
  pts.length = 0;
  pts.push(retaBase, retaTopo);
  for (let i = ultimo; i >= 0; i--) pts.push(nos[i]);
  e.curva.updateArcLengths();

  const comprimento = e.curva.getLength();
  // Fração do comprimento (a partir do topo) antes do trecho reto
  const livre = Math.max(0.05, 1 - (RETA_TOPO - RETA_BASE) / Math.max(comprimento, 1e-3));
  for (let i = 0; i < AMOSTRAS; i++) e.curva.getPointAt(i / (AMOSTRAS - 1), e.pontos[i]);

  const pos = geo.getAttribute('position') as BufferAttribute;
  const nor = geo.getAttribute('normal') as BufferAttribute;
  const uv = geo.getAttribute('uv') as BufferAttribute;
  const colunas = PERFIL.length;
  const { tangente, paraCamera, lateral, frente } = e;

  for (let i = 0; i < AMOSTRAS; i++) {
    const p = e.pontos[i];
    tangente.subVectors(e.pontos[Math.min(AMOSTRAS - 1, i + 1)], e.pontos[Math.max(0, i - 1)]);
    if (tangente.lengthSq() < 1e-12) tangente.set(0, 1, 0);
    tangente.normalize();
    paraCamera.subVectors(camera, p).normalize();

    // Lateral perpendicular à fita e à direção da câmera (sem virar de lado entre amostras)
    const s = e.laterais[i].crossVectors(tangente, paraCamera);
    if (s.lengthSq() < 1e-10) {
      if (i > 0) s.copy(e.laterais[i - 1]);
      else s.set(1, 0, 0);
    }
    s.normalize();
    if (i > 0 && s.dot(e.laterais[i - 1]) < 0) s.negate();

    const doTopo = 1 - i / (AMOSTRAS - 1);
    const ang = torcao * Math.min(1, doTopo / livre) ** 1.3;
    frente.crossVectors(s, tangente);
    lateral.copy(s).multiplyScalar(Math.cos(ang)).addScaledVector(frente, -Math.sin(ang));
    frente.crossVectors(lateral, tangente);

    // Medido a partir da presilha: o texto não desliza quando a fita estica no topo
    const u = 0.5 + (CENTRO_TEXTO - (1 - doTopo) * comprimento) / TILE;
    for (let k = 0; k < colunas; k++) {
      const n = i * colunas + k;
      const d = (PERFIL[k] - 0.5) * FITA_LARGURA;
      const [c, sn] = ANGULOS[k];
      pos.setXYZ(n, p.x + lateral.x * d, p.y + lateral.y * d, p.z + lateral.z * d);
      nor.setXYZ(
        n,
        frente.x * c + lateral.x * sn,
        frente.y * c + lateral.y * sn,
        frente.z * c + lateral.z * sn,
      );
      uv.setXY(n, u, PERFIL[k]);
    }

    // A presilha acompanha a ponta de baixo da fita (i = 0)
    if (i === 0 && presilha) {
      lateral.addScaledVector(cima, -lateral.dot(cima)).normalize();
      frente.crossVectors(lateral, cima).normalize();
      e.base.makeBasis(lateral, cima, frente);
      presilha.quaternion.setFromRotationMatrix(e.base);
      presilha.position.copy(ponta);
    }
  }

  pos.needsUpdate = true;
  nor.needsUpdate = true;
  uv.needsUpdate = true;
}
