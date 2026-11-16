import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import {
  BallCollider,
  CuboidCollider,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RapierRigidBody,
  type RigidBodyProps,
} from '@react-three/rapier';
import * as THREE from 'three';
import {
  ANCORA_Y,
  ARGOLA_RAIO,
  ARGOLA_TUBO,
  ARGOLA_Y,
  CARTAO_ALTURA,
  CARTAO_ESPESSURA,
  CARTAO_LARGURA,
  criarGeometriaCartao,
  criarGeometriaPresilha,
} from './geometria';
import {
  atualizarFita,
  criarEstadoFita,
  criarGeometriaFita,
  FITA_LARGURA,
  PRESILHA_Y,
} from './fita';

/** Comprimento de cada um dos 3 segmentos da corda (fita mais curta = cartão mais alto). */
export const SEGMENTO = 0.4;
/** Queda total do ponto fixo até a base do cartão, em unidades do mundo. */
export const QUEDA_TOTAL = 3 * SEGMENTO + ANCORA_Y + CARTAO_ALTURA / 2;

/** Toque curto e parado = virar o cartão (em vez de arrastar). */
const TOQUE_MAX_PX = 6;
const TOQUE_MAX_MS = 450;

const COR_MOLDURA = '#121019';
const METAL = { color: '#d9dce2', metalness: 1, roughness: 0.16 } as const;
const ACABAMENTO = {
  roughness: 0.42,
  clearcoat: 0.7,
  clearcoatRoughness: 0.06,
  normalScale: new THREE.Vector2(0.06, 0.06),
} as const;
const TECIDO = {
  normalScale: new THREE.Vector2(0.7, 0.7),
  roughness: 0.68,
  sheen: 0.45,
  sheenRoughness: 0.42,
  sheenColor: new THREE.Color(0.2, 0.2, 0.22),
} as const;

type Props = {
  texturaFrente: THREE.Texture;
  texturaVerso: THREE.Texture;
  texturaTira: THREE.Texture;
  normalTrama: THREE.Texture;
  normalPapel: THREE.Texture;
  /** Ref compartilhada para o container saber quando o crachá está sendo arrastado. */
  arrastandoRef: RefObject<boolean>;
  /** prefers-reduced-motion: começa já pendurado (sem balanço de entrada) e mais amortecido. */
  calmo: boolean;
  /** Ponto fixo da fita (topo da coluna do crachá), em coordenadas do mundo. */
  ancora: [number, number];
};

export function Lanyard({
  texturaFrente,
  texturaVerso,
  texturaTira,
  normalTrama,
  normalPapel,
  arrastandoRef,
  calmo,
  ancora,
}: Props) {
  const presilha = useRef<THREE.Group>(null);
  const fixo = useRef<RapierRigidBody>(null!);
  const j1 = useRef<RapierRigidBody>(null!);
  const j2 = useRef<RapierRigidBody>(null!);
  const j3 = useRef<RapierRigidBody>(null!);
  const cartao = useRef<RapierRigidBody>(null!);

  const geo = useMemo(
    () => ({
      ...criarGeometriaCartao(),
      presilha: criarGeometriaPresilha(FITA_LARGURA),
      fita: criarGeometriaFita(),
    }),
    [],
  );
  useEffect(
    () => () => {
      geo.corpo.dispose();
      geo.face.dispose();
      geo.presilha.dispose();
      geo.fita.dispose();
    },
    [geo],
  );

  // Mesma textura da fita com o V invertido: vista por trás, lê na direção certa
  const tiraVerso = useMemo(() => {
    const t = texturaTira.clone();
    t.repeat.y = -1;
    t.needsUpdate = true;
    return t;
  }, [texturaTira]);
  useEffect(() => () => tiraVerso.dispose(), [tiraVerso]);

  // Estado mutável da simulação visual (fora do React: muda a cada frame)
  const sim = useRef({
    fita: criarEstadoFita(),
    /** Nós da fita, de cima para baixo: fixo, j1 e j2 suavizados, engate. */
    nos: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()],
    suavizado: false,
    /** Giro (yaw) acumulado do cartão, sem saltos de ±π: dá a torção da fita. */
    giro: 0,
    /** Para onde a mola de giro puxa: 0 = frente, ±π = verso. */
    alvo: 0,
    toque: null as { x: number; y: number; t: number } | null,
    vec: new THREE.Vector3(),
    dir: new THREE.Vector3(),
    quat: new THREE.Quaternion(),
    euler: new THREE.Euler(0, 0, 0, 'YXZ'),
  });

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
    const s = sim.current;
    const { vec, dir, quat, euler, nos } = s;

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

    // Nós do meio suavizados (evita tremido na fita)
    const p0 = fixo.current.translation();
    const p3 = j3.current.translation();
    nos[0].set(p0.x, p0.y, p0.z);
    nos[3].set(p3.x, p3.y, p3.z);
    [j1, j2].forEach((corpo, i) => {
      const atual = corpo.current.translation();
      const alvo = vec.set(atual.x, atual.y, atual.z);
      const no = nos[i + 1];
      if (!s.suavizado) no.copy(alvo);
      const dist = Math.max(0.1, Math.min(1, no.distanceTo(alvo)));
      // Limitado a 1: com FPS baixo (celular fraco) o fator passaria de 1 e a fita divergiria
      no.lerp(alvo, Math.min(1, delta * dist * 50));
    });
    s.suavizado = true;

    // Giro acumulado do cartão em torno do próprio eixo vertical
    const r = cartao.current.rotation();
    euler.setFromQuaternion(quat.set(r.x, r.y, r.z, r.w));
    // Mantém o acumulado sempre equivalente ao giro real (módulo 2π): assim a mola
    // para com o cartão exatamente de frente, sem herdar erro do balanço de entrada.
    const dif = euler.y - s.giro;
    s.giro += dif - Math.PI * 2 * Math.round(dif / (Math.PI * 2));

    atualizarFita(geo.fita, s.fita, nos, state.camera.position, s.giro, presilha.current);

    // Mola no giro, com amortecimento, puxando para a face escolhida (frente ou
    // verso). Proporcional ao tempo do frame, para não depender do FPS.
    if (!arrastado) {
      const av = cartao.current.angvel();
      const f = Math.min(1, delta * 60);
      const vy = av.y * (1 - 0.12 * f) - (s.giro - s.alvo) * 0.35 * f;
      cartao.current.setAngvel({ x: av.x, y: vy, z: av.z }, true);
    }
  });

  const aoPressionar = (e: ThreeEvent<PointerEvent>) => {
    if (!cartao.current) return;
    e.stopPropagation();
    // Evita selecionar o texto do Hero que está por baixo do cartão
    e.nativeEvent.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    sim.current.toque = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY, t: performance.now() };
    const t = cartao.current.translation();
    setArrastado(new THREE.Vector3().copy(e.point).sub(new THREE.Vector3(t.x, t.y, t.z)));
  };

  const aoSoltar = (e: ThreeEvent<PointerEvent>) => {
    (e.target as Element).releasePointerCapture(e.pointerId);
    const s = sim.current;
    const toque = s.toque;
    s.toque = null;
    if (
      toque &&
      e.type === 'pointerup' &&
      performance.now() - toque.t < TOQUE_MAX_MS &&
      Math.hypot(e.nativeEvent.clientX - toque.x, e.nativeEvent.clientY - toque.y) < TOQUE_MAX_PX
    ) {
      // Vira e, no toque seguinte, desvira pelo mesmo caminho (a fita destorce)
      s.alvo = s.alvo === 0 ? Math.PI : 0;
    }
    setArrastado(false);
  };

  // Sem movimento reduzido: começa na horizontal e cai balançando (igual à referência).
  // Com movimento reduzido: já começa pendurado na vertical.
  const pos = (i: number): [number, number, number] =>
    calmo ? [0, -i * SEGMENTO, 0] : [i * SEGMENTO * 0.9, 0, 0];
  const posCartao: [number, number, number] = calmo
    ? [0, -3 * SEGMENTO - ANCORA_Y, 0]
    : [3 * SEGMENTO * 0.9 + 0.5, 0, 0];

  const zFace = CARTAO_ESPESSURA / 2 + 0.0005;

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
          <CuboidCollider args={[CARTAO_LARGURA / 2, CARTAO_ALTURA / 2, CARTAO_ESPESSURA / 2]} />
          <group
            onPointerOver={() => setEmCima(true)}
            onPointerOut={() => setEmCima(false)}
            onPointerDown={aoPressionar}
            onPointerUp={aoSoltar}
            onPointerCancel={aoSoltar}
          >
            {/* Corpo: borda arredondada com bisel e furo do slot */}
            <mesh geometry={geo.corpo}>
              <meshPhysicalMaterial
                color={COR_MOLDURA}
                roughness={0.35}
                clearcoat={1}
                clearcoatRoughness={0.08}
              />
            </mesh>
            {/* Frente */}
            <mesh geometry={geo.face} position={[0, 0, zFace]}>
              <meshPhysicalMaterial map={texturaFrente} normalMap={normalPapel} {...ACABAMENTO} />
            </mesh>
            {/* Verso */}
            <mesh geometry={geo.face} position={[0, 0, -zFace]} rotation={[0, Math.PI, 0]}>
              <meshPhysicalMaterial map={texturaVerso} normalMap={normalPapel} {...ACABAMENTO} />
            </mesh>
            {/* Argola metálica atravessando o furo */}
            <mesh position={[0, ARGOLA_Y, 0]} rotation={[0, Math.PI / 2 - 0.7, 0]}>
              <torusGeometry args={[ARGOLA_RAIO, ARGOLA_TUBO, 18, 72]} />
              <meshStandardMaterial {...METAL} />
            </mesh>
          </group>
        </RigidBody>
      </group>

      {/* Presilha: segue a ponta da fita (posicionada em atualizarFita) */}
      <group ref={presilha}>
        <mesh geometry={geo.presilha} position={[0, PRESILHA_Y, 0]}>
          <meshStandardMaterial {...METAL} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.045, 0.013, 14, 40]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
      </group>

      {/* Fita: frente e verso em malhas separadas, para o texto do verso não sair espelhado */}
      <mesh geometry={geo.fita} frustumCulled={false}>
        <meshPhysicalMaterial map={texturaTira} normalMap={normalTrama} {...TECIDO} />
      </mesh>
      <mesh geometry={geo.fita} frustumCulled={false}>
        <meshPhysicalMaterial
          map={tiraVerso}
          normalMap={normalTrama}
          {...TECIDO}
          side={THREE.BackSide}
        />
      </mesh>
    </>
  );
}
