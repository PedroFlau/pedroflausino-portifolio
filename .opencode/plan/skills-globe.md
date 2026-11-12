# Habilidades — globo 3D de skills (referência SkillsGlobe)

## Contexto

`habilidades` é um comando do terminal que renderiza `src/sections/Skills.tsx`
dentro de `.terminal-saida`. Hoje são 3 cards estáticos com tags.

Referências:

- Deploy: https://skills-globe.vercel.app/
- Código-fonte: `PROJETOS/React/SkillsGlobe` do repo
  `joaopauloaramuni/desenvolvimento-e-integracao-de-aplicacoes-web`
  (`SkillsGlobe.jsx`, `SkillsGlobe.css`, `SkillsSection.jsx`,
  `SkillsSection.css`, `data/skills.js`).

O site tem 4 temas: `dark` (dourado), `light` (azul), `system` (HUD ciano) e
`galactic_empire` (vermelho imperial). O globo precisa nascer em cada um.

## Decisões (respostas do grilling)

- **Q1** — Seguir a implementação do repo: nós circulares de 48px com ícone de
  tecnologia, nome no tooltip, link para a documentação. Ícones via
  `react-icons` (mesma lib do repo).
- **Q2** — Toolbar completa: chips por grupo + alternância Globo/Lista.
- **Q3** — Cores por tema: cada tema define 3 cores para as categorias. Os
  ícones são monocromáticos na cor da categoria (não usam a cor de marca do
  repo) para o globo pertencer ao tema.
- **Q4** — Visão Lista reaproveita os cards atuais (`.skills-grid`,
  `.skills-card`, `.tags`, `.tag`), filtrados pela categoria.

## Dados

`src/data/portfolio.ts` → `habilidades`, hoje `{ grupo, itens: string[] }`.
Passa a ser `{ grupo, itens: { nome, icone, link }[] }` (único consumidor:
`Skills.tsx`). Grupos e nomes continuam exatamente os atuais:

| Grupo | Skill | Ícone (`react-icons`) | Link |
| --- | --- | --- | --- |
| Linguagens | Java | `FaJava` (`react-icons/fa`) | https://dev.java/learn/ |
| Linguagens | C | `SiC` (`react-icons/si`) | https://en.cppreference.com/w/c |
| Linguagens | C++ | `SiCplusplus` | https://en.cppreference.com/w/cpp |
| Linguagens | JavaScript | `SiJavascript` | https://developer.mozilla.org/pt-BR/docs/Web/JavaScript |
| Front-end | HTML | `SiHtml5` | https://developer.mozilla.org/pt-BR/docs/Web/HTML |
| Front-end | CSS | `SiCss` | https://developer.mozilla.org/pt-BR/docs/Web/CSS |
| Ferramentas | Linux (CachyOS) | `SiLinux` | https://wiki.cachyos.org/ |
| Ferramentas | Git | `SiGit` | https://git-scm.com/book/pt-br/v2 |
| Ferramentas | GitHub | `SiGithub` | https://docs.github.com/pt |

Tipo: `import type { IconType } from 'react-icons'`.

## Arquivos

| Arquivo | Ação |
| --- | --- |
| `package.json`, `package-lock.json` | adicionar `react-icons@^5.7.0` |
| `src/data/portfolio.ts` | `habilidades` com `icone` + `link` |
| `src/components/SkillsGlobe.tsx` | novo — motor 3D + canvas + nós |
| `src/components/SkillsGlobe.css` | novo — globo e variantes de tema |
| `src/sections/Skills.tsx` | reescrever — toolbar, filtro, visão, lista |
| `src/sections/Skills.css` | novo — toolbar/hint/list complementares |

`src/index.css` **não** muda: `.skills-grid`, `.skills-card`, `.tags` e `.tag`
continuam iguais (modo lista e projetos).

## Interfaces

```ts
// src/components/SkillsGlobe.tsx
export type HabilidadeGlobo = { nome: string; grupo: string; icone: IconType; link: string };
export function SkillsGlobe({ skills, tema }: { skills: HabilidadeGlobo[]; tema: Tema }): JSX.Element;
```

- `slug(grupo)`: minúsculas, sem acentos, espaços → hífen (`Front-end` →
  `front-end`), aplicado em `data-grupo` nos nós.
- Cada skill vira `<li><a class="skills-globe-item" data-grupo="...">` com
  `href`, `target="_blank"`, `rel="noopener noreferrer"`, `aria-label` e o nome
  no `.skills-globe-label` (tooltip).
- Canvas `aria-hidden`.
- Cor da malha lida de `--skills-line` via `getComputedStyle` do container;
  fallback `#e3b341`. O efeito recebe `tema` como dependência e relê a variável
  ao trocar de tema.

## Tarefas por lote

### Lote 1 — dependência + dados (`package.json`, `package-lock.json`, `src/data/portfolio.ts`)

1. `npm install react-icons@^5.7.0` (não usar `--save-dev`); conferir que o
   lockfile registrou a versão.
2. Trocar o tipo e o conteúdo de `habilidades` conforme a tabela acima.
   `itens` deixa de ser `string[]`; nenhum outro arquivo consome o campo hoje.

**Critérios de aceite**

- [ ] `react-icons` em `dependencies`, lockfile atualizado.
- [ ] 9 itens, 3 grupos, nomes idênticos aos atuais; todos com `icone` e `link`.
- [ ] `npx tsc -b` passa (ajustar `Skills.tsx` só se o typecheck quebrar — o
      lote 3 reescreve o arquivo de qualquer forma).

### Lote 2 — globo (`src/components/SkillsGlobe.tsx`, `src/components/SkillsGlobe.css`)

Portar `SkillsGlobe.jsx`/`.css` do repo, adaptado:

- Distribuição Fibonacci; `rx=-0.3`, `ry=0`; raio `0.38 * min(w,h)`;
  perspectiva `4.2 * raio`; grade de 6 meridianos + 5 paralelos (`GRID_STEPS=64`).
- Auto-rotação `0.15 rad/s`; 25% com hover; `prefers-reduced-motion` desliga a
  auto-rotação (arrastar continua).
- Arrastar: Pointer Events, captura após `DRAG_THRESHOLD=6px`, inércia `0.92`,
  clamp de `rx` em `[-1.1, 1.1]`, `touch-action:none`, `user-select:none`,
  clique suprimido depois de arrasto.
- Projeção/hierarquia: `opacity 0.2+0.8*depth^1.5`,
  `scale (0.62+0.38*depth)*perspectiva`, `zIndex`, `pointerEvents`/`tabIndex`
  só com `depth>0.45`.
- Canvas: halo radial + grade com alpha 0.28 (frente) / 0.07 (fundo), DPR ≤ 2.
- `IntersectionObserver` pausa o rAF fora da tela; cleanup de rAF/observer.
- Sem re-render por frame: `style.transform/opacity/zIndex` direto.

CSS base (dark, GitHub dark):

- `.skills-globe`: `height: clamp(280px, 50vw, 440px)`, `width:100%`,
  `overflow:hidden`, `cursor:grab/grabbing`, `touch-action:none`.
- Nó: círculo 48px (40px ≤480px), fundo `var(--bg-alt)`, borda
  `color-mix(in srgb, var(--skill) 40%, var(--borda))`, ícone 26px (21px) em
  `var(--skill)`, sombra suave; hover/focus com anel e glow na cor da categoria.
- Tooltip: fundo `var(--bg-alt)`, borda e texto em `var(--skill)`, fonte
  `.72rem`.
- Cores por tema (no `.skills-globe`):
  - dark: `--skills-line:#e3b341`; A `#e3b341`, B `#58a6ff`, C `#3fb950`
  - light: `#0969da`; `#0969da`, `#8250df`, `#1a7f37`
  - system: `#38e1ff`; `#38e1ff`, `#9d8cff`, `#5eead4`
  - galactic_empire: `#ff4a52`; `#ff4a52`, `#b8bcc0`, `#6f8fa8`
- `[data-grupo='linguagens'] → --skill-a`; `front-end → --skill-b`;
  `ferramentas → --skill-c`.
- Variantes: system = raio 2px, fundo holográfico
  `linear-gradient(160deg, rgba(8,30,58,.92), rgba(2,11,24,.94))`, glow ciano;
  galactic = raio 0, `linear-gradient(160deg,#17191d,#0b0c0e)`, borda superior
  2px na cor da categoria, hover com glow vermelho; light = fundo branco e
  sombras claras.
- `prefers-reduced-motion`: sem transições nos nós/tooltip.

**Critérios de aceite**

- [ ] Um `<li>` por skill; ícone + `aria-label` + tooltip com o nome; link abre
      em nova aba.
- [ ] Arrastar gira, soltar mantém inércia, hover desacelera, clique após
      arrasto não navega.
- [ ] Malha + nós legíveis nos 4 temas, trocando sem recarregar (`tema` prop).
- [ ] Reduced motion sem rotação automática; rAF para fora da tela.
- [ ] `npx tsc -b` passa.

### Lote 3 — seção (`src/sections/Skills.tsx`, `src/sections/Skills.css`)

Portar `SkillsSection.jsx` adaptado:

- Estados `filtro` (`'Todas' | grupo`) e `visao` (`'globo' | 'lista'`); padrão
  `Todas`/`globo`.
- Chips: `Todas 9`, `Linguagens 4`, `Front-end 2`, `Ferramentas 3`, com
  `aria-pressed`; bolinha na cor da categoria.
- Toggle Globo/Lista com ícones inline (`FiGlobe`/`FiGrid` do repo → SVGs
  inline, sem segunda importação da lib) e `aria-pressed`.
- `<SkillsGlobe key={filtro} skills={filtradas} tema={tema} />` + dica
  “Arraste para girar · clique num ícone para abrir a documentação”.
- Lista: markup atual (`.skills-grid` > `.skills-card` > `.card-titulo` +
  `.tags` > `.tag`), filtrada por grupo.
- Manter `<h2 className="secao-titulo">habilidades</h2>` e `useTema()`.

CSS (base + 4 temas) para `.skills-section`, `.skills-toolbar`, `.skills-chips`,
`.skills-view`, `.skills-hint`:

- Base: chips/toggle em `var(--bg-alt)` com `var(--borda)` e
  `var(--texto-fraco)`; ativo `var(--accent)` + `var(--accent-contraste)`;
  badge de contagem discreto; `gap` de 1.25rem no wrapper.
- System: raio 2px, `var(--display)` maiúsculas + tracking, borda ciano, glow;
  GE: raio 0, `var(--display)` maiúsculas, ativo vermelho com texto branco.
- Abaixo de 480px: chips menores e toolbar sem overflow em 320px.
- `prefers-reduced-motion`: sem transições.

**Critérios de aceite**

- [ ] Contagens corretas; filtro afeta globo e lista; visão mantém o filtro.
- [ ] Globo e lista renderizam os 9 itens em “Todas”; modo lista usa as classes
      antigas sem alterar o visual atual.
- [ ] 320px sem scroll horizontal; 4 temas com identidade (dourado/azul/HUD/
      imperial).
- [ ] Reduced motion sem transições.
- [ ] `npm run lint` e `npx tsc -b && npx vite build` passam.

## Verificação

- Sem suíte de testes.
- `npm run lint`; `npx tsc -b && npx vite build` (chamar vite direto para não
  disparar o `prebuild` do WakaTime, que reescreve `src/data/wakatimeStats.ts`).
- Manual (`npm run dev` → `habilidades`): arrastar, filtrar, alternar visão,
  4 temas, 320px, reduced motion, clique nos links.

## Assunções / riscos

- Adicionar `react-icons` (~5.7.0) é necessário para os ícones; bundle cresce
  um pouco (só 9 ícones entram no build por tree-shaking).
- Cores de categoria substituem as cores de marca do repo — escolha consciente
  para os temas. Se preferir cores de marca, é só trocar `--skill`.
- 9 nós é pouco para o globo: a grade de meridianos/paralelos carrega o visual.
- Trocar de tema remonta o efeito do canvas e zera a inércia — aceitável.
- O typecheck do lote 1 pode exigir um ajuste mínimo em `Skills.tsx`; o lote 3
  reescreve o arquivo.
