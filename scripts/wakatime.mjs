#!/usr/bin/env node
/**
 * Gera src/data/wakatimeStats.ts: os dados do WakaTime que entram no bundle.
 *
 * Serve de "foto" instantânea pro terminal: a página já abre com números e,
 * se a rota /api/wakatime estiver disponível (é o caso no Vercel), eles são
 * atualizados ao vivo em seguida. Se o proxy não existir, esta foto é o que
 * aparece — por isso ela também é usada como rede de segurança.
 *
 * Uso:
 *   npm run wakatime                 (o "npm run build" já roda antes)
 *   WAKATIME_USERNAME=nick npm run wakatime
 *
 * Se o download falhar, o arquivo anterior é mantido (o build não quebra).
 */

import { existsSync, writeFileSync } from 'node:fs';
import { RANGE_WAKATIME, obterStats, vazio } from '../server/wakatime.js';

const DESTINO = new URL('../src/data/wakatimeStats.ts', import.meta.url);

const TIPOS = `export type FonteWakaTime = 'api' | 'build';

export type RangeWakaTime =
  | 'last_7_days'
  | 'last_30_days'
  | 'last_6_months'
  | 'last_year'
  | 'all_time';

export type ItemWakaTime = {
  nome: string;
  segundos: number;
  porcento: number;
};

export type StatsWakaTime = {
  /** Perfil do WakaTime (lido de src/data/portfolio.ts). */
  usuario: string;
  perfil: string;
  /** Data (YYYY-MM-DD) dos dados. */
  geradoEm: string;
  /** Período dos dados (padrão: all_time). */
  range?: RangeWakaTime;
  /** "oauth" quando lido com o token; "publico" quando veio do perfil público. */
  modo?: 'oauth' | 'publico';
  /** Início do histórico no WakaTime (YYYY-MM-DD). */
  desde: string | null;
  totalSegundos: number;
  mediaDiariaSegundos: number;
  diasAtivos: number | null;
  diasTotais: number | null;
  /** Tempo de hoje (só com o token). */
  hojeSegundos?: number | null;
  /** Dia com mais tempo no período. */
  melhorDia?: { data: string; segundos: number } | null;
  linguagens: ItemWakaTime[];
  editores: ItemWakaTime[];
  categorias: ItemWakaTime[];
  sistemas: ItemWakaTime[];
  /** Projetos (só com o token). */
  projetos?: ItemWakaTime[];
  /** "api" quando veio da rota ao vivo; "build" quando é a foto do build. */
  fonte?: FonteWakaTime;
};`;

function escrever(dados) {
  const conteudo = `// ============================================================
//  GERADO AUTOMATICAMENTE por scripts/wakatime.mjs — NÃO EDITE À MÃO.
//  Atualize com:  npm run wakatime
//  Fonte: https://wakatime.com/api/v1/users/${dados.usuario}/stats/${RANGE_WAKATIME}
// ============================================================

${TIPOS}

export const wakatimeStats: StatsWakaTime = ${JSON.stringify(dados, null, 2)};
`;

  writeFileSync(DESTINO, conteudo);
}

try {
  const dados = await obterStats(process.env);
  escrever({ ...dados, fonte: 'build' });
  console.log(
    `WakaTime: foto do build atualizada de ${dados.usuario} ` +
      `(${(dados.totalSegundos / 3600).toFixed(1)} h no total).`,
  );
} catch (erro) {
  const motivo = erro instanceof Error ? erro.message : String(erro);
  if (existsSync(DESTINO)) {
    console.warn(
      `WakaTime: não deu para atualizar (${motivo}). Mantendo os dados anteriores.`,
    );
  } else {
    console.warn(`WakaTime: não deu para atualizar (${motivo}). Gerando arquivo vazio.`);
    escrever({ ...vazio(process.env), fonte: 'build' });
  }
}
