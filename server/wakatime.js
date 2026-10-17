// ============================================================
//  Estatísticas do WakaTime — lógica compartilhada.
//
//  A API do WakaTime não manda cabeçalhos CORS, então o navegador não
//  consegue chamá-la direto: quem chama é o servidor. Esta rotina atende
//  /api/wakatime em três lugares:
//    • produção (Vercel)       -> a função api/wakatime.js
//    • npm run dev / preview   -> o plugin em vite.config.ts
//    • dados do build (fallback) -> scripts/wakatime.mjs
//
//  Privacidade: a API devolve também projetos, máquinas e dependências.
//  A resposta leva só os campos que o terminal usa (ver enxugar()).
// ============================================================

const API = 'https://wakatime.com/api/v1';
const RANGE = 'all_time';
const USUARIO_PADRAO = 'PedroFlau';
const TIMEOUT_MS = 10_000;
const CACHE_MS = 10 * 60 * 1000;
const MIN_SEGUNDOS = 60;
const MESES = 'jan feb mar apr may jun jul aug sep oct nov dec'.split(' ');

// ------------------------------------------------------------
//  Ajustes de exibição do comando
//  Nomes que não devem aparecer (comparação sem diferenciar maiúsculas).
// ------------------------------------------------------------
const OCULTAR = {
  editores: ['Opencode Cli'],
  linguagens: [],
};

function ocultar(itens, nomes) {
  if (!nomes?.length) return itens;
  const escondidos = new Set(nomes.map((nome) => nome.toLowerCase()));
  return itens.filter((item) => !escondidos.has(item.nome.toLowerCase()));
}

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

/** Fica só com o que o terminal usa. */
function enxugar(data, env) {
  return {
    usuario: usuario(env),
    perfil: perfil(env),
    geradoEm: hoje(),
    desde: desde(data),
    totalSegundos: Math.round(
      data.total_seconds_including_other_language ?? data.total_seconds ?? 0,
    ),
    mediaDiariaSegundos: Math.round(
      data.daily_average_including_other_language ?? data.daily_average ?? 0,
    ),
    diasAtivos: data.days_minus_holidays ?? null,
    diasTotais: data.days_including_holidays ?? null,
    linguagens: ocultar(lista(data.languages), OCULTAR.linguagens),
    editores: ocultar(lista(data.editors), OCULTAR.editores),
    categorias: lista(data.categories),
    sistemas: lista(data.operating_systems),
  };
}

/** Objeto vazio (para quando ainda não há dados nenhum). */
export function vazio(env) {
  return {
    usuario: usuario(env),
    perfil: perfil(env),
    geradoEm: hoje(),
    desde: null,
    totalSegundos: 0,
    mediaDiariaSegundos: 0,
    diasAtivos: null,
    diasTotais: null,
    linguagens: [],
    editores: [],
    categorias: [],
    sistemas: [],
  };
}

/** O WakaTime avisa que ainda está calculando (HTTP 202 / pending_update). */
class Calculando extends Error {}

// Vale a pena tentar de novo: falha de rede, 5xx ou limite de requisições.
const TENTATIVAS = 3;
const ESPERA_MS = 500;

async function buscarUmaVez(env) {
  const resposta = await fetch(
    `${API}/users/${encodeURIComponent(usuario(env))}/stats/${RANGE}`,
    {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );

  if (resposta.status === 202) throw new Calculando();
  if (!resposta.ok) {
    const erro = new Error(`WakaTime respondeu ${resposta.status}`);
    erro.status = resposta.status;
    throw erro;
  }

  const { data } = await resposta.json();
  if (data?.status === 'pending_update' || !Array.isArray(data?.languages)) {
    throw new Calculando();
  }
  return enxugar(data, env);
}

async function buscar(env) {
  let ultimoErro;

  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
    try {
      return await buscarUmaVez(env);
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

let cache = { em: 0, dados: null, promessa: null };

/**
 * Estatísticas prontas para o terminal. Fica 10 min na memória (e no cache
 * da CDN do Vercel): a resposta é a mesma para todos os visitantes.
 */
export async function obterStats(env = {}) {
  if (cache.dados && Date.now() - cache.em < CACHE_MS) return cache.dados;

  if (!cache.promessa) {
    cache.promessa = buscar(env)
      .then((dados) => {
        cache = { em: Date.now(), dados, promessa: null };
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
export async function responder(env = {}) {
  const cabecalhos = (cacheavel) => ({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': cacheavel
      ? 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600'
      : 'no-store',
  });

  try {
    const dados = await obterStats(env);
    return {
      status: 200,
      headers: cabecalhos(true),
      corpo: JSON.stringify({ ...dados, fonte: 'api' }),
    };
  } catch (erro) {
    const calculando = erro instanceof Calculando;
    console.error('WakaTime:', erro?.message ?? erro);
    return {
      status: calculando ? 202 : 502,
      headers: cabecalhos(false),
      corpo: JSON.stringify(
        calculando ? { data: { status: 'pending_update' } } : { erro: 'wakatime' },
      ),
    };
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

  const { status, headers, corpo } = await responder(env);
  res.statusCode = status;
  for (const [nome, valor] of Object.entries(headers)) res.setHeader(nome, valor);
  res.end(req.method === 'HEAD' ? undefined : corpo);
}
