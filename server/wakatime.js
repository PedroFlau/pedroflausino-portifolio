// ============================================================
//  Estatísticas do WakaTime — lógica compartilhada.
//
//  A API do WakaTime não manda cabeçalhos CORS, então o navegador não
//  consegue chamá-la direto: quem chama é o servidor. Esta rotina atende
//  /api/wakatime?range=... em três lugares:
//    • produção (Vercel)         -> a função api/wakatime.js
//    • npm run dev / preview     -> o plugin em vite.config.ts
//    • dados do build (fallback) -> scripts/wakatime.mjs
//
//  Com o WAKATIME_ACCESS_TOKEN (OAuth) lê a própria conta ("current"), com
//  projetos, melhor dia e o tempo de hoje. Sem o token, usa o perfil público.
//
//  Privacidade: a resposta leva só os campos que o terminal usa
//  (ver enxugar()); projetos fora de PROJETOS_PUBLICOS (server/config.js)
//  são somados numa linha "projetos privados".
// ============================================================

import { projetoPublico } from './config.js';
import { chamarWakaTime, temToken } from './oauth.js';

const RANGE = 'all_time';
export const RANGES = ['last_7_days', 'last_30_days', 'last_6_months', 'last_year', 'all_time'];
const USUARIO_PADRAO = 'PedroFlau';
const TIMEOUT_MS = 10_000;
const CACHE_MS = 10 * 60 * 1000;
const MIN_SEGUNDOS = 60;
const MESES = 'jan feb mar apr may jun jul aug sep oct nov dec'.split(' ');

/** Usuário: variável de ambiente WAKATIME_USERNAME (opcional) > padrão. */
function usuario(env) {
  return String(env?.WAKATIME_USERNAME ?? '').trim() || USUARIO_PADRAO;
}

function perfil(env) {
  return `https://wakatime.com/@${usuario(env)}`;
}

/** Data local de hoje (YYYY-MM-DD) — evita "pular" um dia por causa do UTC. */
function hoje() {
  const agora = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}`;
}

/** "since May 14 2026" -> "2026-05-14" (a rota pública não manda "start"). */
function desde(data) {
  if (data.start) return String(data.start).slice(0, 10);
  const achado = /(\w{3})\w*\.? (\d{1,2}),? (\d{4})/.exec(data.human_readable_range ?? '');
  if (!achado) return null;
  const mes = MESES.indexOf(achado[1].toLowerCase());
  if (mes < 0) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${achado[3]}-${pad(mes + 1)}-${pad(achado[2])}`;
}

/** Listas da API -> [{ nome, segundos, porcento }]. */
function lista(itens) {
  if (!Array.isArray(itens)) return [];
  return itens
    .filter((item) => (item.total_seconds ?? 0) >= MIN_SEGUNDOS)
    .map((item) => ({
      nome: String(item.name),
      segundos: Math.round(item.total_seconds),
      porcento: Number(item.percent),
    }));
}

/** Projetos fora da lista pública viram uma linha só. */
function projetos(itens, env) {
  const todos = lista(itens);
  const publicos = todos.filter((p) => projetoPublico(p.nome, env));
  const privados = todos.filter((p) => !projetoPublico(p.nome, env));
  if (privados.length === 0) return publicos;
  return [
    ...publicos,
    {
      nome: `projetos privados (${privados.length})`,
      segundos: privados.reduce((soma, p) => soma + p.segundos, 0),
      porcento: privados.reduce((soma, p) => soma + p.porcento, 0),
    },
  ].sort((a, b) => b.segundos - a.segundos);
}

/** Fica só com o que o terminal usa. */
function enxugar(data, env, { range, modo, segundosHoje }) {
  return {
    usuario: usuario(env),
    perfil: perfil(env),
    geradoEm: hoje(),
    range,
    modo,
    desde: desde(data),
    totalSegundos: Math.round(
      data.total_seconds_including_other_language ?? data.total_seconds ?? 0,
    ),
    mediaDiariaSegundos: Math.round(
      data.daily_average_including_other_language ?? data.daily_average ?? 0,
    ),
    diasAtivos: data.days_minus_holidays ?? null,
    diasTotais: data.days_including_holidays ?? null,
    hojeSegundos: segundosHoje,
    melhorDia: data.best_day?.date
      ? {
          data: String(data.best_day.date).slice(0, 10),
          segundos: Math.round(data.best_day.total_seconds ?? 0),
        }
      : null,
    linguagens: lista(data.languages),
    editores: lista(data.editors),
    categorias: lista(data.categories),
    sistemas: lista(data.operating_systems),
    projetos: projetos(data.projects, env),
  };
}

/** Objeto vazio (para quando ainda não há dados nenhum). */
export function vazio(env) {
  return {
    usuario: usuario(env),
    perfil: perfil(env),
    geradoEm: hoje(),
    range: RANGE,
    modo: 'publico',
    desde: null,
    totalSegundos: 0,
    mediaDiariaSegundos: 0,
    diasAtivos: null,
    diasTotais: null,
    hojeSegundos: null,
    melhorDia: null,
    linguagens: [],
    editores: [],
    categorias: [],
    sistemas: [],
    projetos: [],
  };
}

/** O WakaTime avisa que ainda está calculando (HTTP 202 / pending_update). */
class Calculando extends Error {}

/** Erro com código para a página saber o que mostrar. */
function erroHttp(status) {
  const erro = new Error(`WakaTime respondeu ${status}`);
  erro.status = status;
  return erro;
}

// Vale a pena tentar de novo: falha de rede, 5xx ou limite de requisições.
const TENTATIVAS = 3;
const ESPERA_MS = 500;

/** Tempo de hoje (endpoint privado status_bar/today, escopo read_summaries). */
async function segundosDeHoje(env) {
  try {
    const resposta = await chamarWakaTime('/users/current/status_bar/today', env, {
      timeout: TIMEOUT_MS,
    });
    if (!resposta.ok) return null;
    const { data } = await resposta.json();
    const segundos = data?.grand_total?.total_seconds;
    return typeof segundos === 'number' ? Math.round(segundos) : null;
  } catch {
    return null;
  }
}

async function buscarUmaVez(env, range) {
  const comToken = temToken(env);
  const quem = comToken ? 'current' : encodeURIComponent(usuario(env));

  const [resposta, segundosHoje] = await Promise.all([
    chamarWakaTime(`/users/${quem}/stats/${range}`, env, {
      autenticar: comToken,
      timeout: TIMEOUT_MS,
    }),
    comToken ? segundosDeHoje(env) : Promise.resolve(null),
  ]);

  if (resposta.status === 202) throw new Calculando();
  if (!resposta.ok) throw erroHttp(resposta.status);

  const { data } = await resposta.json();
  if (data?.status === 'pending_update' || !Array.isArray(data?.languages)) {
    throw new Calculando();
  }
  return enxugar(data, env, {
    range,
    modo: comToken ? 'oauth' : 'publico',
    segundosHoje,
  });
}

async function buscar(env, range) {
  let ultimoErro;

  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
    try {
      return await buscarUmaVez(env, range);
    } catch (erro) {
      ultimoErro = erro;

      const valeTentar =
        !(erro instanceof Calculando) &&
        (!erro?.status || erro.status === 429 || erro.status >= 500);
      if (!valeTentar || tentativa === TENTATIVAS) throw erro;

      await new Promise((acordar) => setTimeout(acordar, ESPERA_MS * tentativa));
    }
  }

  throw ultimoErro;
}

// Um cache por período
const caches = new Map();

/**
 * Estatísticas prontas para o terminal. Fica 10 min na memória (e no cache
 * da CDN do Vercel): a resposta é a mesma para todos os visitantes.
 */
export async function obterStats(env = {}, range = RANGE) {
  const periodo = RANGES.includes(range) ? range : RANGE;
  const cache = caches.get(periodo) ?? { em: 0, dados: null, promessa: null };
  caches.set(periodo, cache);

  if (cache.dados && Date.now() - cache.em < CACHE_MS) return cache.dados;

  if (!cache.promessa) {
    cache.promessa = buscar(env, periodo)
      .then((dados) => {
        Object.assign(cache, { em: Date.now(), dados, promessa: null });
        return dados;
      })
      .catch((erro) => {
        cache.promessa = null;
        throw erro;
      });
  }
  return cache.promessa;
}

/** Resposta HTTP pronta: { status, headers, corpo }. */
export async function responder(env = {}, range = RANGE) {
  const cabecalhos = (cacheavel) => ({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': cacheavel
      ? 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600'
      : 'no-store',
  });
  const falha = (status, erro, mensagem) => ({
    status,
    headers: cabecalhos(false),
    corpo: JSON.stringify({ erro, mensagem }),
  });

  try {
    const dados = await obterStats(env, range);
    return {
      status: 200,
      headers: cabecalhos(true),
      corpo: JSON.stringify({ ...dados, fonte: 'api' }),
    };
  } catch (erro) {
    console.error('WakaTime:', erro?.message ?? erro);
    if (erro instanceof Calculando) {
      return falha(202, 'calculando', 'O WakaTime ainda está calculando este período.');
    }
    if (erro?.status === 401) {
      return falha(401, 'token_invalido', 'Token OAuth do WakaTime inválido ou revogado.');
    }
    if (erro?.status === 402 || erro?.status === 403) {
      return falha(403, 'sem_permissao', 'Este período não está disponível na conta do WakaTime.');
    }
    if (erro?.status === 404) {
      return falha(404, 'nao_encontrado', 'Usuário do WakaTime não encontrado.');
    }
    return falha(502, 'wakatime', 'Não foi possível falar com o WakaTime agora.');
  }
}

export const RANGE_WAKATIME = RANGE;
export const USUARIO_WAKATIME = USUARIO_PADRAO;

/**
 * Atende um request HTTP (Node). Usado pela função do Vercel e pelo plugin
 * do vite, para os dois se comportarem exatamente igual.
 */
export async function atender(req, res, env = {}) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.end();
    return;
  }

  const range = new URL(req.url ?? '/', 'http://localhost').searchParams.get('range') ?? RANGE;
  const { status, headers, corpo } = await responder(env, range);
  res.statusCode = status;
  for (const [nome, valor] of Object.entries(headers)) res.setHeader(nome, valor);
  res.end(req.method === 'HEAD' ? undefined : corpo);
}
