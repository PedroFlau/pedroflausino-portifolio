# Opção A — bugs de UI + escala tipográfica e tokens

Escopo aprovado pelo Pedro: corrigir os 5 bugs do review e consolidar tipografia,
raio e cores não-tematizadas. **Os 4 temas ficam.** Refatoração estrutural do CSS
(divisão de arquivos, eliminação de overrides por tema, escala de espaçamento
global) fica para a opção B, fora desta rodada.

## Regras gerais para o implementador

- Não renomear seletores nem reestruturar componentes. Troca de valor, não de arquitetura.
- Não introduzir dependência nova.
- Preservar o visual dos 4 temas (`dark`, `light`, `system`, `galactic_empire`). Toda regra nova
  deve usar tokens já existentes ou os tokens criados aqui.
- Texto de interface em português. Comentários em português, como no resto do repo.
- Rodar `npm run build` ao final de cada batch e corrigir o que quebrar.

---

## Batch 1 — Tokens de tipografia e raio, e fim das fontes ilegíveis

**Arquivos:** `src/index.css`

### 1.1 Bloco de tokens no `:root`

Adicionar logo depois de `--mono`:

```css
/* Escala tipográfica — nada abaixo de 12px */
--fs-2xs: 0.75rem;
--fs-xs: 0.8rem;
--fs-sm: 0.85rem;
--fs-base: 0.9rem;
--fs-md: 0.95rem;
--fs-1: 1rem;
--fs-lg: 1.1rem;
--fs-xl: 1.4rem;
--fs-hero: 2.4rem;

/* Raios */
--raio-sm: 6px;
--raio-md: 10px;
--raio-lg: 14px;
--raio-pill: 999px;

/* Espaçamento (usar só em regras novas ou já alteradas nesta rodada) */
--esp-1: 4px;
--esp-2: 8px;
--esp-3: 12px;
--esp-4: 16px;
--esp-5: 24px;
--esp-6: 32px;
--esp-7: 48px;
```

### 1.2 Substituir todos os `font-size` do `index.css` pelos tokens

Mapa obrigatório (o valor em `rem` é trocado pelo token correspondente):

| valor atual | token |
| --- | --- |
| 0.6 / 0.65 / 0.68 / 0.7 / 0.72 / 0.75 | `--fs-2xs` |
| 0.78 / 0.8 / 0.82 | `--fs-xs` |
| 0.85 / 0.88 | `--fs-sm` |
| 0.9 | `--fs-base` |
| 0.95 | `--fs-md` |
| 1 / 1rem | `--fs-1` |
| 1.05 / 1.1 / 1.15 | `--fs-lg` |
| 1.3 / 1.4 | `--fs-xl` |
| 1.9 / 2.2 / 2.4 | `--fs-hero` (o hero no mobile usa 1.9 → passa a `--fs-hero` com override de `clamp`, ver 1.4) |

Aplicar também nos blocos por tema (`[data-theme='system'] .hero-nome` etc.), senão os
tamanhos ilegíveis voltam por tema.

### 1.3 Raios

Trocar `border-radius` de superfícies compartilhadas pelos tokens:
`.botao` (8 → `--raio-md`), `.contato-card` (10 → `--raio-md`), `.cmd-card`,
`.mapa-botoes` (8 → `--raio-sm`), `.waka-periodo` (6 → `--raio-sm`),
`.ochip`/chips de filtro (pill → `--raio-pill`).
**Não** mexer nos raios decorativos de tema (`system` usa 2px de propósito, o holograma da
Biblioteca e a moldura da foto também) — esses são desenho, não inconsistência.

### 1.4 Nome do hero no celular

`@media (max-width: 640px) .hero-nome`: `font-size: clamp(1.75rem, 8vw, 2.2rem)` no lugar do
`1.9rem` fixo, para o nome não quebrar em duas linhas apertadas em telas de 360px.

### Critérios de aceite

- `grep -o "font-size: [0-9.]*rem" src/index.css` não retorna nenhum valor abaixo de `0.75rem`.
- Existem no máximo 9 valores distintos de `font-size` no arquivo, todos via `var(--fs-*)`.
- Nenhum seletor renomeado; `npm run build` passa.
- Os 4 temas continuam legíveis (nada de texto sumindo ou estourando).

---

## Batch 2 — WakaTime estourando a largura

**Arquivos:** `src/index.css`, `src/components/WakaTime.tsx` (só se precisar de marcador novo)

Problema medido: em 390px de viewport o documento tem 718px de largura; em 1440px, ~1468px.
Causa: `.waka-tabela` usa `grid-template-columns: max-content minmax(90px,1fr) max-content max-content`
e as colunas `max-content` (nome, tempo, %) não encolhem; o `subgrid` propaga a largura mínima
para `.waka-secao`/`.waka-linha`.

### 2.1 Desktop/tablet — conter a largura

- `.waka-tabela`: `width: 100%`, `grid-template-columns: minmax(0, 1fr) minmax(80px, 1.2fr) max-content max-content`.
- `.waka-nome`: adicionar `min-width: 0` (já tem `overflow: hidden` e `text-overflow: ellipsis`).

### 2.2 Celular — cada linha em duas linhas

Dentro do `@media (max-width: 640px)` já existente (ou um novo, se preferir manter separado):

```css
.waka-tabela { display: block; }
.waka-secao,
.waka-lista { display: block; }

.waka-linha {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    'nome tempo'
    'barra pct';
  column-gap: 10px;
  row-gap: 3px;
  padding: 5px 0;
}
.waka-nome  { grid-area: nome; }
.waka-tempo { grid-area: tempo; }
.waka-barra { grid-area: barra; }
.waka-pct   { grid-area: pct; }
```

O `<ul>`/`<li>` continuam os mesmos — é só CSS, sem tocar no componente.

### Critérios de aceite

- Em 390px: `document.documentElement.scrollWidth === window.innerWidth` (378).
- Em 1440px: `scrollWidth === innerWidth` (sem os ~100px de vazamento de hoje).
- Barras continuam alinhadas entre seções no desktop (subgrid preservado acima de 640px).
- Nome longo ("plu-cc-2026-2-ti2-4354100-...") é truncado com reticências, não empurra a linha.
- Os 4 temas sem quebra.

---

## Batch 3 — Conteúdo de desenvolvedor visível e cards tortos

**Arquivos:** `src/data/portfolio.ts`, `src/components/Terminal.tsx`, `src/sections/Contact.tsx`

### 3.1 Tirar instruções de desenvolvimento da interface

Nenhuma saída de comando pode mencionar `src/data/portfolio.ts`, `public/cv.pdf` ou
"preencha X". Substituir por uma linha neutra, por exemplo:
`<span className="text-gray">essa seção ainda está vazia.</span>`

### 3.2 Esconder o que não tem conteúdo

- Remover de `comandos` (e portanto da `ajuda`): `lattes`, `premios`, `steam`, `xbox` —
  hoje só respondem instrução de dev. Manter os dados no `portfolio.ts` para quando
  houver conteúdo.
- Digitar esses quatro nomes deve cair no mesmo caminho de "comando não encontrado" já
  existente, ou numa mensagem curta e neutra. Escolher um dos dois e usar o mesmo para os quatro.
- **Currículo (decidido):** `public/cv.pdf` tem 0 bytes. Remover `curriculo` de `comandos`
  e não renderizar o card até existir um PDF real. O arquivo `public/cv.pdf` fica onde está.
- Remover o projeto `Em breve` de `projetos` (o terceiro card). `Projects.tsx` não precisa mudar.

### 3.3 Card de contato

- Rótulo legível em vez de URL crua:
  - e-mail → `pedroflau1@gmail.com` (mantém)
  - github → `github.com/PedroFlau`
  - linkedin → `in/pedro-flausino-mendonca`
  (o `<a href>` continua com a URL completa)
- `.contato-card` (em `index.css`, junto do batch): `overflow-wrap: anywhere` e
  `align-items: stretch` no grid para os três cards terem a mesma altura e a linha
  "↗" não pular de posição.

### Critérios de aceite

- Nenhum texto do tipo "Preencha … em src/data/portfolio.ts" alcançável por qualquer comando.
- `ajuda` lista exatamente os comandos que devolvem conteúdo real.
- `projetos` mostra 2 cards, sem o "Em breve".
- Os três cards de contato têm a mesma altura e nenhuma URL quebra em duas linhas.
- `npm run build` passa.

---

## Batch 4 — Cor fora do tema e primeiro impacto no celular

**Arquivos:** `src/index.css`

### 4.1 Cor hardcoded

`.waka-agora { --waka-agora-cor: #3fb950 }` ignora o tema (no `galactic_empire` fica verde
num site vermelho). Criar `--ok` em cada um dos 4 temas — `#3fb950` no escuro, `#1a7f37` no
claro, `#38ffa8` no system, `#ff4a52` no galactic_empire (mesmos valores que a Biblioteca e o
Skills já usam como verde/acento) — e usar `var(--ok)`.

`.waka-agora` também usa `border-radius: 12px`: trocar por `--raio-lg`? Não — é card de
destaque, manter 12px é aceitável; só não introduzir valor novo.

### 4.2 Hero no celular

- `.foto-card` em `max-width: 640px`: `max-height: 44vh`, com `overflow: hidden` e
  `.foto-perfil { height: 100%; object-fit: cover; object-position: center 30% }`
  para a foto não ocupar uma tela inteira antes do conteúdo.
- `.hero-botoes` no mobile: `gap: var(--esp-2)` e `.botao { flex: 1 1 auto; min-width: 40%; }`
  para os três botões fecharem em duas colunas cheias em vez de 2 + 1 sobrando.
- `.terminal-hint` no mobile: `margin-bottom: var(--esp-5)` (hoje 28px, e com a foto menor
  o hero fica menos espremido).

### Critérios de aceite

- Nos 4 temas, o card "codando agora" usa a cor de destaque do tema.
- Em 390px, o primeiro screenshot sem rolar mostra nome, resumo, botões e ao menos o começo
  da foto; a dica de comandos aparece sem precisar passar de uma tela.
- Desktop inalterado (o `max-height` só vale no mobile).
- `npm run build` passa.

---

### 4.3 Barra de rolagem do terminal (adição da verificação visual)

Hoje só os temas `system` e `galactic_empire` estilizam a rolagem de `.terminal-scroll`;
em `dark` e `light` o Firefox desenha a barra nativa clara por cima do fundo escuro — visível
como uma faixa branca na direita em toda tela de celular.

Na regra base de `.terminal-scroll` (e fora dos blocos por tema), adicionar
`scrollbar-width: thin;` e `scrollbar-color: var(--borda) transparent;`.
Nos temas `dark` e `light`, adicionar `color-scheme: dark` / `color-scheme: light`
no bloco de tokens correspondente.

Critério: em 390px no tema dark não aparece faixa clara na borda direita.

## Verificação final (não é batch)

1. `npm run lint` e `npm run build`.
2. Screenshots das 8 seções em 1440px e das 5 principais em 390px, para comparar com
   `/tmp/opencode/full-*.png` e `m-*.png` do review.
3. Screenshots de `wakatime`, `habilidades`, `contato` e `projetos` nos 4 temas
   (trocar tema via `localStorage.setItem('tema', …)` no navegador de teste).

## Decisões fechadas

`public/cv.pdf` tem 0 bytes → o comando `curriculo` sai da ajuda e da renderização até
existir um PDF real. Quando o arquivo for substituído, é só devolvê-lo a `comandos`.
