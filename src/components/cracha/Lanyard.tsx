import { useEffect, useRef, useState, type RefObject } from 'react';
import { extend, useFrame, useThree, type ThreeElement, type ThreeEvent } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import {
  BallCollider,
  CuboidCollider,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RapierRigidBody,
  type RigidBodyProps,
} from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import * as THREE from 'three';

extend({ MeshLineGeometry, MeshLineMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    meshLineGeometry: ThreeElement<typeof MeshLineGeometry>;
    meshLineMaterial: Omit<ThreeElement<typeof MeshLineMaterial>, 'args'>;
  }
}

/** Tamanho do cartão em unidades do mundo (proporção da arte 1342×2000). */
const CARTAO_ALTURA = 2.9;
const CARTAO_LARGURA = CARTAO_ALTURA * (1342 / 2000);
const CARTAO_ESPESSURA = 0.03;
/** Ponto do cartão (acima do centro) onde a tira se prende. */
const ANCORA_Y = CARTAO_ALTURA / 2 + 0.25;
/** Comprimento (em unidades do mundo) de cada repetição de "flausino.dev" na tira. */
const COMPRIMENTO_TILE = 1.1;
/** Comprimento de cada um dos 3 segmentos da corda (tira mais curta = cartão mais alto). */
export const SEGMENTO = 0.4;
/** Queda total do ponto fixo até a base do cartão, em unidades do mundo. */
export const QUEDA_TOTAL = 3 * SEGMENTO + ANCORA_Y + CARTAO_ALTURA / 2;

type Props = {
  texturaCartao: THREE.Texture;
  texturaTira: THREE.Texture;
  /** Ref compartilhada para o container saber quando o crachá está sendo arrastado. */
  arrastandoRef: RefObject<boolean>;
  /** prefers-reduced-motion: começa já pendurado (sem balanço de entrada) e mais amortecido. */
  calmo: boolean;
  /** Ponto fixo da tira (topo da coluna do crachá), em coordenadas do mundo. */
  ancora: [number, number];
};

export function Lanyard({ texturaCartao, texturaTira, arrastandoRef, calmo, ancora }: Props) {
  const tira = useRef<THREE.Mesh<MeshLineGeometry, MeshLineMaterial>>(null);
  const fixo = useRef<RapierRigidBody>(null!);
  const j1 = useRef<RapierRigidBody>(null!);
  const j2 = useRef<RapierRigidBody>(null!);
  const j3 = useRef<RapierRigidBody>(null!);
  const cartao = useRef<RapierRigidBody>(null!);

  // Posições suavizadas dos segmentos do meio (evita tremido na tira)
  const suavizado = useRef<{ j1: THREE.Vector3 | null; j2: THREE.Vector3 | null }>({
    j1: null,
    j2: null,
  });

  const [aux] = useState(() => ({
    vec: new THREE.Vector3(),
    dir: new THREE.Vector3(),
    ang: new THREE.Vector3(),
    quat: new THREE.Quaternion(),
    euler: new THREE.Euler(0, 0, 0, 'YXZ'),
  }));
  const [curva] = useState(() => {
    const c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
    ]);
    c.curveType = 'chordal';
    return c;
  });

  const { width, height } = useThree((s) => s.size);
  // Elemento que recebe os eventos (a <section> do Hero): o cursor vai nele,
  // já que o canvas tem pointer-events: none.
  const lerEstado = useThree((s) => s.get);

  // Posição inicial do grupo fica congelada; depois a âncora move só o ponto fixo
  // (a corda puxa o resto), sem recriar os corpos.
  const [ancoraInicial] = useState(ancora);
  const [ax, ay] = ancora;
  useEffect(() => {
    if (!fixo.current) return;
    fixo.current.setTranslation({ x: ax, y: ay, z: 0 }, true);
    [j1, j2, j3, cartao].forEach((r) => r.current?.wakeUp());
  }, [ax, ay]);

  const [arrastado, setArrastado] = useState<THREE.Vector3 | false>(false);
  const [emCima, setEmCima] = useState(false);

  const segmento: RigidBodyProps = {
    type: 'dynamic',
    canSleep: true,
    colliders: false,
    angularDamping: 4,
    linearDamping: 4,
  };

  useRopeJoint(fixo, j1, [[0, 0, 0], [0, 0, 0], SEGMENTO]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], SEGMENTO]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], SEGMENTO]);
  useSphericalJoint(j3, cartao, [
    [0, 0, 0],
    [0, ANCORA_Y, 0],
  ]);

  useEffect(() => {
    arrastandoRef.current = arrastado !== false;
  }, [arrastado, arrastandoRef]);

  useEffect(() => {
    if (!emCima && !arrastado) return;
    const el = (lerEstado().events.connected as HTMLElement | undefined) ?? document.body;
    el.style.cursor = arrastado ? 'grabbing' : 'grab';
    return () => {
      el.style.cursor = '';
    };
  }, [emCima, arrastado, lerEstado]);

  useFrame((state, delta) => {
    const { vec, dir, ang, quat, euler } = aux;

    if (arrastado && cartao.current) {
      // Projeta o ponteiro no plano z=0 e leva o cartão até lá
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [cartao, j1, j2, j3, fixo].forEach((r) => r.current?.wakeUp());
      cartao.current.setNextKinematicTranslation({
        x: vec.x - arrastado.x,
        y: vec.y - arrastado.y,
        z: vec.z - arrastado.z,
      });
    }

    if (!fixo.current || !j1.current || !j2.current || !j3.current || !cartao.current) return;

    const s = suavizado.current;
    const minVel = 0;
    const maxVel = 50;
    (['j1', 'j2'] as const).forEach((k) => {
      const corpo = (k === 'j1' ? j1 : j2).current!;
      const atual = corpo.translation();
      if (!s[k]) s[k] = new THREE.Vector3(atual.x, atual.y, atual.z);
      const alvo = vec.set(atual.x, atual.y, atual.z);
      const dist = Math.max(0.1, Math.min(1, s[k]!.distanceTo(alvo)));
      // Limitado a 1: com FPS baixo (celular fraco) o fator passaria de 1 e a tira divergiria
      s[k]!.lerp(alvo, Math.min(1, delta * (minVel + dist * (maxVel - minVel))));
    });

    const p3 = j3.current.translation();
    const p0 = fixo.current.translation();
    curva.points[0].set(p3.x, p3.y, p3.z);
    curva.points[1].copy(s.j2!);
    curva.points[2].copy(s.j1!);
    curva.points[3].set(p0.x, p0.y, p0.z);
    if (tira.current) {
      // Pontos espaçados por comprimento de arco: o UV do meshline é por índice de
      // ponto, então espaçamento uniforme evita letras esticadas/encolhidas.
      tira.current.geometry.setPoints(curva.getSpacedPoints(48));
      // Repetição proporcional ao comprimento: o texto mantém o tamanho ao esticar.
      tira.current.material.repeat.x = curva.getLength() / COMPRIMENTO_TILE;
    }

    // Faz o cartão voltar a ficar de frente: mola no ângulo de giro (yaw) com
    // amortecimento na velocidade — sem o amortecimento ele fica oscilando de lado.
    // Proporcional ao tempo do frame, para não depender do FPS.
    if (!arrastado) {
      const av = cartao.current.angvel();
      const r = cartao.current.rotation();
      ang.set(av.x, av.y, av.z);
      euler.setFromQuaternion(quat.set(r.x, r.y, r.z, r.w));
      const f = Math.min(1, delta * 60);
      const vy = ang.y * (1 - 0.12 * f) - euler.y * 0.35 * f;
      cartao.current.setAngvel({ x: ang.x, y: vy, z: ang.z }, true);
    }
  });

  const aoPressionar = (e: ThreeEvent<PointerEvent>) => {
    if (!cartao.current) return;
    e.stopPropagation();
    // Evita selecionar o texto do Hero que está por baixo do cartão
    e.nativeEvent.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    const t = cartao.current.translation();
    setArrastado(new THREE.Vector3().copy(e.point).sub(new THREE.Vector3(t.x, t.y, t.z)));
  };

  const aoSoltar = (e: ThreeEvent<PointerEvent>) => {
    (e.target as Element).releasePointerCapture(e.pointerId);
    setArrastado(false);
  };

  // Sem movimento reduzido: começa na horizontal e cai balançando (igual à referência).
  // Com movimento reduzido: já começa pendurado na vertical.
  const pos = (i: number): [number, number, number] =>
    calmo ? [0, -i * SEGMENTO, 0] : [i * SEGMENTO * 0.9, 0, 0];
  const posCartao: [number, number, number] = calmo
    ? [0, -3 * SEGMENTO - ANCORA_Y, 0]
    : [3 * SEGMENTO * 0.9 + 0.5, 0, 0];

  return (
    <>
      <group position={[ancoraInicial[0], ancoraInicial[1], 0]}>
        <RigidBody ref={fixo} {...segmento} type="fixed" />
        <RigidBody position={pos(1)} ref={j1} {...segmento}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={pos(2)} ref={j2} {...segmento}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={pos(3)} ref={j3} {...segmento}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={posCartao}
          ref={cartao}
          {...segmento}
          angularDamping={calmo ? 6 : 2}
          linearDamping={calmo ? 6 : 2}
          type={arrastado ? 'kinematicPosition' : 'dynamic'}
        >
          <CuboidCollider args={[CARTAO_LARGURA / 2, CARTAO_ALTURA / 2, CARTAO_ESPESSURA]} />
          <group
            onPointerOver={() => setEmCima(true)}
            onPointerOut={() => setEmCima(false)}
            onPointerDown={aoPressionar}
            onPointerUp={aoSoltar}
            onPointerCancel={aoSoltar}
          >
            {/* Corpo do cartão (borda e verso) */}
            <RoundedBox
              args={[CARTAO_LARGURA, CARTAO_ALTURA, CARTAO_ESPESSURA]}
              radius={0.012}
              smoothness={2}
            >
              <meshPhysicalMaterial
                color="#0c0c10"
                roughness={0.5}
                clearcoat={1}
                clearcoatRoughness={0.25}
              />
            </RoundedBox>

            {/* Arte da frente */}
            <mesh position={[0, 0, CARTAO_ESPESSURA / 2 + 0.001]}>
              <planeGeometry args={[CARTAO_LARGURA, CARTAO_ALTURA]} />
              <meshPhysicalMaterial
                map={texturaCartao}
                transparent
                alphaTest={0.5}
                roughness={0.35}
                clearcoat={1}
                clearcoatRoughness={0.15}
                metalness={0.05}
              />
            </mesh>

            {/* Argola metálica que entra no furo do cartão */}
            <mesh position={[0, CARTAO_ALTURA / 2 - 0.02, 0]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.11, 0.022, 12, 32]} />
              <meshStandardMaterial color="#c9ced6" metalness={1} roughness={0.25} />
            </mesh>
            {/* Presilha que prende a tira */}
            <mesh position={[0, ANCORA_Y - 0.06, 0]}>
              <boxGeometry args={[0.2, 0.14, 0.06]} />
              <meshStandardMaterial color="#9aa0a8" metalness={1} roughness={0.3} />
            </mesh>
          </group>
        </RigidBody>
      </group>

      <mesh ref={tira} frustumCulled={false}>
        <meshLineGeometry />
        {/* Cor padrão do meshline já é branca (a textura dá a cor). depthTest ligado
            para a tira ficar atrás do cartão quando ele gira na frente dela. */}
        <meshLineMaterial
          resolution={new THREE.Vector2(width, height)}
          useMap={1}
          map={texturaTira}
          repeat={new THREE.Vector2(3, -1)}
          lineWidth={1.5}
        />
      </mesh>
    </>
  );
}
