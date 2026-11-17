import { useId, type CSSProperties } from 'react';
import type { CenaHorizonte, ModeloCapa } from '../data/biblioteca';

// Grafismos das capas geradas, em SVG. As cores vêm das variáveis da capa
// (--capa-cor, --capa-cor-2, --capa-texto, --capa-destaque), definidas em
// CapaLivro/LivroEstante, então o mesmo desenho serve para qualquer livro.

const cor = (v: string): CSSProperties => ({ fill: `var(${v})` });
const traco = (v: string, largura: number, opacidade = 1): CSSProperties => ({
  fill: 'none',
  stroke: `var(${v})`,
  strokeWidth: largura,
  opacity: opacidade,
});

/** Carta de tarô: moldura dupla, arco, olho com raios e lua crescente. */
function Taro() {
  const raios = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return {
      x1: 100 + Math.cos(a) * 41,
      y1: 128 + Math.sin(a) * 41,
      x2: 100 + Math.cos(a) * (i % 2 ? 49 : 55),
      y2: 128 + Math.sin(a) * (i % 2 ? 49 : 55),
    };
  });
  const cantos: [number, number][] = [
    [15, 15],
    [185, 15],
    [15, 285],
    [185, 285],
  ];
  return (
    <>
      <rect x="9" y="9" width="182" height="282" style={traco('--capa-destaque', 1.6)} />
      <rect x="15" y="15" width="170" height="270" style={traco('--capa-destaque', 0.6, 0.7)} />
      {cantos.map(([x, y]) => (
        <rect
          key={`${x}-${y}`}
          x={x - 4}
          y={y - 4}
          width="8"
          height="8"
          transform={`rotate(45 ${x} ${y})`}
          style={cor('--capa-destaque')}
        />
      ))}
      <path d="M38 104 Q100 34 162 104" style={traco('--capa-destaque', 0.8, 0.55)} />
      {raios.map((r, i) => (
        <line key={i} {...r} style={traco('--capa-destaque', 0.9, 0.75)} />
      ))}
      <circle cx="100" cy="128" r="35" style={traco('--capa-destaque', 1.2)} />
      <path
        d="M70 128 Q100 103 130 128 Q100 153 70 128Z"
        style={traco('--capa-destaque', 1.4)}
      />
      <circle cx="100" cy="128" r="10" style={cor('--capa-destaque')} />
      <circle cx="100" cy="128" r="4" style={cor('--capa-cor')} />
      <path
        d="M93 72 a11 11 0 1 0 15 13 a8.5 8.5 0 1 1 -15 -13z"
        style={cor('--capa-destaque')}
      />
      <line x1="52" y1="196" x2="148" y2="196" style={traco('--capa-destaque', 0.8, 0.7)} />
      <rect
        x="96"
        y="192"
        width="8"
        height="8"
        transform="rotate(45 100 196)"
        style={cor('--capa-destaque')}
      />
    </>
  );
}

/** Insígnia: pirâmide em contorno grosso, travessa e núcleo preenchido. */
function Insignia() {
  return (
    <>
      <polygon points="100,46 182,196 18,196" style={traco('--capa-destaque', 3.2, 0.95)} />
      <polygon
        points="100,84 150,178 50,178"
        style={{ ...cor('--capa-destaque'), opacity: 0.2 }}
      />
      <line x1="44" y1="140" x2="156" y2="140" style={traco('--capa-destaque', 2.2)} />
      <circle cx="100" cy="46" r="6" style={cor('--capa-destaque')} />
      <line x1="100" y1="196" x2="100" y2="226" style={traco('--capa-destaque', 2.2, 0.7)} />
    </>
  );
}

/** Sombra: vinheta e fios diagonais (a letra gigante é texto, em CapaLivro). */
function Sombra({ id }: { id: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}-vinheta`} cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor="var(--capa-cor-2)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.9" />
        </radialGradient>
      </defs>
      <rect width="200" height="300" fill={`url(#${id}-vinheta)`} />
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d={`M${-20 + i * 26} 300 Q${60 + i * 18} ${190 - i * 12} ${150 + i * 14} -10`}
          style={traco('--capa-destaque', 0.7, 0.16 + i * 0.03)}
        />
      ))}
    </>
  );
}

/** Selo: lua em traço, réguas verticais de pergaminho e serra em pincel. */
function Selo() {
  return (
    <>
      <circle cx="58" cy="70" r="26" style={traco('--capa-texto', 1, 0.28)} />
      <line x1="140" y1="18" x2="140" y2="282" style={traco('--capa-texto', 0.6, 0.25)} />
      <line x1="146" y1="18" x2="146" y2="282" style={traco('--capa-texto', 0.6, 0.18)} />
      <path
        d="M0 236 Q34 196 62 226 T120 210 T200 228 V300 H0Z"
        style={{ ...cor('--capa-texto'), opacity: 0.09 }}
      />
      <path
        d="M0 262 Q50 240 96 258 T200 250 V300 H0Z"
        style={{ ...cor('--capa-texto'), opacity: 0.07 }}
      />
    </>
  );
}

/** Horizonte: céu em gradiente, sol e camadas de dunas ou de serra. */
function Horizonte({ id, cena }: { id: string; cena: CenaHorizonte }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-ceu`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--capa-cor)" />
          <stop offset="70%" stopColor="var(--capa-cor-2)" />
        </linearGradient>
      </defs>
      <rect width="200" height="300" fill={`url(#${id}-ceu)`} />
      <circle cx="100" cy="184" r="34" style={{ ...cor('--capa-destaque'), opacity: 0.95 }} />
      {cena === 'dunas' ? (
        <>
          <path
            d="M0 204 Q52 182 104 200 T200 192 V300 H0Z"
            style={cor('--capa-cor-2')}
          />
          <path
            d="M0 232 Q64 208 124 230 T200 222 V300 H0Z"
            style={cor('--capa-cor')}
          />
          <path
            d="M0 262 Q70 242 142 260 T200 256 V300 H0Z"
            style={{ fill: '#000', opacity: 0.42 }}
          />
        </>
      ) : (
        <>
          <path
            d="M0 212 L36 168 L64 196 L104 142 L140 192 L168 170 L200 198 V300 H0Z"
            style={cor('--capa-cor-2')}
          />
          <path
            d="M0 240 L44 206 L84 232 L122 200 L164 236 L200 218 V300 H0Z"
            style={cor('--capa-cor')}
          />
          <path
            d="M0 268 L56 246 L110 264 L160 248 L200 262 V300 H0Z"
            style={{ fill: '#000', opacity: 0.42 }}
          />
          {/* Lâmina cravada na serra, diante do sol */}
          <line
            x1="100"
            y1="132"
            x2="100"
            y2="208"
            style={traco('--capa-texto', 1.8, 0.9)}
          />
          <line x1="89" y1="146" x2="111" y2="146" style={traco('--capa-texto', 1.8, 0.9)} />
        </>
      )}
    </>
  );
}

type Props = {
  modelo: ModeloCapa;
  cena?: CenaHorizonte;
};

/** Arte de fundo da capa (preenche a capa inteira, recortando as sobras). */
export function ArteCapa({ modelo, cena = 'dunas' }: Props) {
  const id = useId().replace(/:/g, '');
  return (
    <svg
      className="capa-livro-svg"
      viewBox="0 0 200 300"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      {modelo === 'taro' && <Taro />}
      {modelo === 'insignia' && <Insignia />}
      {modelo === 'sombra' && <Sombra id={id} />}
      {modelo === 'selo' && <Selo />}
      {modelo === 'horizonte' && <Horizonte id={id} cena={cena} />}
    </svg>
  );
}

/** Marca miniatura do modelo, no pé da lombada (como o logo de uma editora). */
export function MarcaCapa({ modelo }: { modelo: ModeloCapa }) {
  return (
    <svg className="lombada-marca" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      {modelo === 'taro' && (
        <>
          <path d="M3 10 Q10 3.5 17 10 Q10 16.5 3 10Z" style={traco('--capa-destaque', 1.3)} />
          <circle cx="10" cy="10" r="2.6" style={cor('--capa-destaque')} />
        </>
      )}
      {modelo === 'insignia' && (
        <polygon points="10,2.5 18,17 2,17" style={traco('--capa-destaque', 1.8)} />
      )}
      {modelo === 'sombra' && (
        <>
          <line x1="5" y1="17" x2="15" y2="3" style={traco('--capa-destaque', 1.6)} />
          <line x1="9" y1="17" x2="17" y2="6" style={traco('--capa-destaque', 1, 0.6)} />
        </>
      )}
      {modelo === 'selo' && (
        <rect x="3" y="3" width="14" height="14" rx="1.5" style={cor('--capa-destaque')} />
      )}
      {modelo === 'horizonte' && (
        <>
          <path d="M4 14 A6 6 0 0 1 16 14Z" style={cor('--capa-destaque')} />
          <line x1="1.5" y1="15.5" x2="18.5" y2="15.5" style={traco('--capa-destaque', 1.3)} />
        </>
      )}
    </svg>
  );
}
