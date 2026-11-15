# Habilidades — átomo 3D no lugar do globo

## Contexto

O globo de skills está pronto e commitado (`SkillsGlobe.tsx/.css`,
`Skills.tsx/.css`). A ideia agora é trocar o globo por um átomo 3D como o da
imagem de referência: núcleo de prótons/neutrons e 3 órbitas elípticas
cruzadas com elétrons (as skills).

Mesma técnica do globo: projeção 3D em canvas 2D + nós em DOM, sem three.js e
sem dependência nova. O arrasto, a inércia, o tooltip, os links, os chips de
categoria, o modo lista, os 4 temas e o `prefers-reduced-motion` continuam
funcionando.

## Conceito visual

- Núcleo central: aglomerado de ~8 esferas (prótons/neutrons) desenhadas no
  canvas com gradiente radial e ordenadas por profundidade.
- 3 órbitas: círculos 3D inclinados, girados em Z a 0°, 60° e 120° (como na
  imagem), desenhados como elipses com alpha maior na frente.
- 9 elétrons: um por skill, com o ícone da tecnologia, cor da categoria,
  tooltip e link. Cada elétron percorre sua órbita com fase própria.
- O átomo inteiro gira no arrasto (com inércia) e sozinho devagar; hover
  desacelera. Reduced motion congela a rotação e as órbitas (o arrasto
  continua).

### Mapeamento

- 1 órbita por categoria (Q1): Linguagens → órbita 0, Front-end → órbita 1,
  Ferramentas → órbita 2. Quantidades 4/2/3 são naturais (elétrons por camada).
- Núcleo é decorativo, não representa skills (Q2).
- Paleta do núcleo acompanha o tema (Q3): prótons na cor de destaque, neutrons
  na cor secundária; elétrons/órbitas nas cores das categorias (as mesmas
  `--skill-a/b/c` do globo).
- Filtro mantém as 3 órbitas e esmaece as categorias inativas (Q4): a órbita e
  os elétrons do grupo ativo ficam em destaque; os demais ficam com ~30% da
  opacidade e sem interação. O núcleo permanece.

## Arquivos

| Arquivo | Ação |
| --- | --- |
| `src/components/SkillsAtom.tsx` | novo — motor do átomo |
| `src/components/SkillsAtom.css` | novo — átomo + variantes de tema |
| `src/sections/Skills.tsx` | import/tipo, estado `atomo`, ícone do toggle, dica |
| `src/components/SkillsGlobe.tsx` | remover |
| `src/components/SkillsGlobe.css` | remover |

`src/data/portfolio.ts` não muda (ícone/link/grupo já existem). `Skills.css`
não muda (só o comentário de cabeçalho menciona “globo”; deixar).

## Interfaces

```ts
// src/components/SkillsAtom.tsx
export type HabilidadeAtomo = { nome: string; grupo: string; icone: IconType; link: string };
export function SkillsAtom({ skills, grupoAtivo, tema }: {
  skills: HabilidadeAtomo[];       // TODAS as skills (as 3 órbitas sempre existem)
  grupoAtivo: string | null;       // null = "Todas"; senão o nome do grupo destacado
  tema: Tema;
}): JSX.Element;
```

- `slug(grupo)` idêntico ao de `Skills.tsx` (`Front-end` → `front-end`).
- Cada skill vira `<li><a class="skills-atom-item" data-grupo="..." href=...>` com
  `aria-label`, ícone `aria-hidden` e `.skills-atom-label` (tooltip).
- Canvas `aria-hidden`. Núcleo é decoração (sem DOM, sem foco).
- Cor das órbitas lida de `--atom-<slug>` (fallback `--skills-line` → `#e3b341`);
  prótons/neutrons de `--atom-proton` / `--atom-neutron`; relidos no
  `MutationObserver` de `data-theme` (o mesmo motivo do globo) e com `tema` nas
  deps do efeito.

## Matemática (implementar como abaixo)

Constantes:

```ts
const DRAG_THRESHOLD = 6;
const MAX_TILT = 1.2;
const VELOCIDADE_AUTO = 0.12;        // rad/s (rotação do átomo)
const INERCIA = 0.92;
const AMOSTRAS_ORBITA = 96;
const INCLINACAO_BASE = 1.05;        // rad (tilt do círculo em torno de X)
const ORBITAS = {
  linguagens:   { indice: 0, velocidade:  0.34 },
  'front-end':  { indice: 1, velocidade: -0.28 },
  ferramentas:  { indice: 2, velocidade:  0.24 },
};
```

Ponto base da órbita `indice` (0/1/2) no ângulo `theta`, raio 1:

```
x  = cos(theta)
y  = sin(theta) * cos(inclinacao)      // inclinacao = INCLINACAO_BASE + indice*0.03
z  = sin(theta) * sin(inclinacao)
rotZ = indice * PI / 3
x' = x*cos(rotZ) - y*sin(rotZ)
y' = x*sin(rotZ) + y*cos(rotZ)
```

Depois aplicar a rotação global `girar(p, rx, ry)` (mesma função do globo) e a
projeção com perspectiva (`raio = 0.40 * min(w,h)`, `camera = 4.2 * raio`).

- Elétron `i` de `n` no grupo: `theta = base + i * 2PI/n`, com
  `base += velocidade * dt` por quadro; fase inicial `indice * 0.7` para
  desencontrar as órbitas. `dt` congelado em reduced motion.
- Órbita desenhada com `AMOSTRAS_ORBITA` pontos, alpha `0.32` (z > 0) / `0.10`
  (z ≤ 0) na categoria ativa; `0.12` / `0.04` nas inativas, `lineWidth 1.2`,
  cor `--atom-<slug>`.
- Elétron inativo (`grupo !== grupoAtivo` quando há filtro): multiplica a
  opacidade por `0.3`, `pointer-events: none` e `tabIndex = -1`; continua
  visível. Os elétrons ativos seguem a fórmula normal.
- Fase das órbitas em ref (`tempoRef`) para o filtro não reiniciar o movimento;
  `grupoAtivo` entra nas deps do efeito só para redesenhar.
- Núcleo: 8 esferas em posições fixas normalizadas (cluster), escala
  `raio * 0.27`, raio de cada esfera `raio * 0.115`; projetar, ordenar por `z`
  crescente e desenhar. Preenchimento com cor base + gradiente radial de
  brilho (`rgba(255,255,255,.55)` no topo-esquerdo → `rgba(0,0,0,.28)` na borda).
- Halo atrás do átomo: gradiente radial de `--atom-halo` (alpha 0.08 → 0).
- Nós DOM: mesma fórmula de profundidade do globo
  (`opacity 0.2 + 0.8*depth^1.5`, `scale (0.62+0.38*depth)*perspectiva`,
  `zIndex`, `pointerEvents`/`tabIndex` só com `depth > 0.45`).

## Tarefas

### Lote 1 — componente (`src/components/SkillsAtom.tsx`, `SkillsAtom.css`)

Portar a base do `SkillsGlobe` (learning curve já resolvida) e trocar a esfera
pelo átomo:

- Remover `esferaFibonacci`/`gradeEsfera`; adicionar as órbitas e o núcleo.
- Manter: DPR ≤ 2, `IntersectionObserver` pausando o rAF, halo, `girar`,
  `slug`, `comAlfa`, `prefereMenosMovimento`, MutationObserver do tema,
  drag/inércia/clique suprimido, reduced motion.
- `tempo` das órbitas em ref ou variável do efeito; zera só no remonte.
- CSS: classes `.skills-atom*` (não reutilizar `.skills-globe*`), altura
  `clamp(300px, 55vw, 460px)`, nós 46px (40px ≤480px), ícones 24px (21px),
  tooltip, variantes dos 4 temas.
- Cores por tema no container:
  - dark: `--atom-proton:#e3b341`, `--atom-neutron:#58a6ff`, `--skills-line:#e3b341`
  - light: `--atom-proton:#0969da`, `--atom-neutron:#8250df`, `--skills-line:#0969da`
  - system: `--atom-proton:#38e1ff`, `--atom-neutron:#9d8cff`, `--skills-line:#38e1ff`
  - galactic_empire: `--atom-proton:#ff4a52`, `--atom-neutron:#b8bcc0`, `--skills-line:#ff4a52`
  - `--atom-linguagens: var(--skill-a)`, `--atom-front-end: var(--skill-b)`,
    `--atom-ferramentas: var(--skill-c)` e `--skill-a/b/c` iguais aos do globo.
- Variantes: system = nós raio 2px + fundo holográfico + glow ciano; galactic =
  raio 0 + fundo `#131519` + borda superior 2px + glow vermelho; light = nós
  brancos; dark = base.

**Critérios de aceite**

- [ ] 3 órbitas cruzadas visíveis, cada uma na cor da categoria; núcleo
      aglomerado, sombreado e ordenado por profundidade.
- [ ] 9 elétrons com ícone, `aria-label`, tooltip, `data-grupo` e link em nova aba.
- [ ] Arrastar gira com inércia; auto-rotação; hover desacelera; clique após
      arrasto não navega; teclado funciona.
- [ ] Filtro (`grupoAtivo`): as 3 órbitas continuam; as categorias inativas
      ficam esmaecidas (~30%) e sem interação; a ativa em destaque.
- [ ] Reduced motion: sem rotação automática e sem órbita; arrasto continua.
- [ ] rAF pausado fora da tela; observers/listeners limpos no unmount.
- [ ] Troca de tema repinta sem recarregar.
- [ ] `npx tsc -b` e `npm run lint` passam.

### Lote 2 — integração (`src/sections/Skills.tsx` + remoção dos arquivos do globo)

- Trocar imports: `SkillsAtom`, `HabilidadeAtomo`.
- Estado `Visao = 'atomo' | 'lista'`, padrão `'atomo'`.
- Passar TODAS as skills (`skills={todas}`) e `grupoAtivo={filtro === TODAS ? null : filtro}`;
  sem `key={filtro}` (o átomo não remonta; a fase das órbitas é preservada).
- Toggle: ícone de átomo (3 elipses + núcleo, SVG inline) no lugar do globo;
  `aria-label`/`title` “Átomo”; texto da dica “Arraste para girar · clique num
  elétron para abrir a documentação”.
- Remover `src/components/SkillsGlobe.tsx` e `SkillsGlobe.css`; conferir que
  não sobrou nenhuma referência a `SkillsGlobe`, `HabilidadeGlobo` ou
  `skills-globe` em `src/`.
- Chips, contagens, filtro e modo lista não mudam.

**Critérios de aceite**

- [ ] `grep -rn "SkillsGlobe\|HabilidadeGlobo\|skills-globe" src` sem resultados.
- [ ] Átomo e lista funcionam; filtro e contagens inalterados.
- [ ] 320px sem scroll horizontal; 4 temas com identidade.
- [ ] `npm run lint`, `npx tsc -b` e `npx vite build` passam.

## Verificação

- Sem suíte de testes.
- `npm run lint`; `npx tsc -b && npx vite build` (vite direto para não rodar o
  `prebuild` do WakaTime, que reescreve `wakatimeStats.ts`).
- Manual (`npm run dev` → `habilidades`): arrastar, auto-rotação, hover, links,
  filtros, modo lista, 4 temas, 320px e reduced motion.
- Nada de arquivo temporário no repo; se precisar de harness, usar
  `/tmp/opencode` e apagar.

## Riscos

- Núcleo em canvas: os elétrons (DOM) sempre ficam por cima; com órbitas de
  raio 0.40 e núcleo ~0.27, não há sobreposição, então não deve aparecer.
- 3 órbitas com 4/2/3 elétrons: no filtro, as 3 continuam desenhadas e as
  inativas esmaecem; elétrons inativos ficam visíveis, mas sem interação.
- A leitura de `var()` dentro de `var(--atom-*)` via `getComputedStyle` resolve
  no valor computado; se algum navegador devolver vazio, o fallback é
  `--skills-line`/`#e3b341`.
- Renomear sem sobrar referência: conferir com grep no Lote 2.
