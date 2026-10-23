// ============================================================
//  "Codando agora": em que projeto estou mexendo no editor NESTE momento.
//
//  A extensão do WakaTime manda um "heartbeat" a cada ~2 min enquanto você
//  digita, com projeto, linguagem, branch e arquivo. Aqui lemos os
//  heartbeats do dia (GET /users/current/heartbeats?date=AAAA-MM-DD) e
//  olhamos o último: se chegou há até MINUTOS_ATIVO, estou codando.
//
//  Atende /api/codando em:
//    • produção (Vercel)     -> a função api/codando.js
//    • npm run dev / preview -> o plugin em vite.config.ts
//
//  Heartbeats são PRIVADOS: precisam do WAKATIME_ACCESS_TOKEN (escopo
//  read_heartbeats). Sem o token a rota responde 503 e o bloco some.
//
//  Privacidade:
//    • o arquivo (entity) nunca sai daqui: ele traz o caminho completo;
//    • projeto fora de PROJETOS_PUBLICOS vira "projeto privado" (sem branch);
//    • só heartbeats de arquivo contam (os de navegador são descartados).
// ============================================================

import { WAKATIME_CONFIG, projetoPublico } from './config.js';
import { chamarWakaTime, temToken } from './oauth.js';

const TIMEOUT_MS = 8_000;
const CACHE_MS = 60 * 1000;
const CACHE_EDITORES_MS = 60 * 60 * 1000;

const ATIVO_S = WAKATIME_CONFIG.MINUTOS_ATIVO * 60;
const PAUSA_S = WAKATIME_CONFIG.MINUTOS_PAUSA * 60;

// Nome do editor como o WakaTime manda → como aparece na tela
const EDITORES = {
  vscode: 'VS Code',
  cursor: 'Cursor',
  windsurf: 'Windsurf',
  vscodium: 'VSCodium',
  zed: 'Zed',
  vim: 'Vim',
  neovim: 'Neovim',
  nvim: 'Neovim',
  emacs: 'Emacs',
  sublime: 'Sublime Text',
  intellij: 'IntelliJ IDEA',
  idea: 'IntelliJ IDEA',
  pycharm: 'PyCharm',
  webstorm: 'WebStorm',
  androidstudio: 'Android Studio',
  xcode: 'Xcode',
  eclipse: 'Eclipse',
  visualstudio: 'Visual Studio',
  jupyter: 'Jupyter',
  opencode: 'Opencode Cli',
};

function nomeEditor(editor) {
  if (!editor) return null;
  const texto = String(editor);
  const chave = texto.toLowerCase().replace(/[\s_-]/g, '');
  return EDITORES[chave] ?? texto.charAt(0).toUpperCase() + texto.slice(1);
}

// "2026-10-23" no fuso da conta do WakaTime
const diaNoFuso = (ms) =>
  new Date(ms).toLocaleDateString('en-CA', { timeZone: WAKATIME_CONFIG.FUSO });

// Minutos desde a meia-noite no fuso da conta
function minutosDesdeMeiaNoite(ms) {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: WAKATIME_CONFIG.FUSO,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(ms));
  const valor = (tipo) => Number(partes.find((p) => p.type === tipo)?.value ?? 0);
  return valor('hour') * 60 + valor('minute');
}

async function chamar(caminho, env) {
  const resposta = await chamarWakaTime(`/users/current${caminho}`, env, { timeout: TIMEOUT_MS });
  if (!resposta.ok) {
    const erro = new Error(`WakaTime HTTP ${resposta.status} em ${caminho.split('?')[0]}`);
    erro.status = resposta.status;
    throw erro;
  }
  const json = await resposta.json();
  return Array.isArray(json?.data) ? json.data : [];
}

// id do user agent → nome do editor. Muda pouco: 1 h de cache.
let editores = { em: 0, mapa: new Map() };
async function mapaEditores(env) {
  if (Date.now() - editores.em < CACHE_EDITORES_MS) return editores.mapa;
  try {
    const lista = await chamar('/user_agents', env);
    editores = { em: Date.now(), mapa: new Map(lista.map((ua) => [ua.id, nomeEditor(ua.editor)])) };
  } catch (erro) {
    console.error('Codando agora (editores):', erro?.message ?? erro);
  }
  return editores.mapa;
}

const heartbeatsDoDia = async (dia, env) =>
  (await chamar(`/heartbeats?date=${dia}`, env))
    .filter((hb) => hb.type === 'file' && Number.isFinite(hb.time))
    .sort((a, b) => a.time - b.time);

// Soma como o WakaTime: intervalo entre dois heartbeats conta se < pausa
function somarSegundos(heartbeats) {
  let total = 0;
  for (let i = 1; i < heartbeats.length; i += 1) {
    const intervalo = heartbeats[i].time - heartbeats[i - 1].time;
    if (intervalo < PAUSA_S) total += intervalo;
  }
  return Math.round(total);
}

// Começo da sessão atual: volta do último heartbeat até achar uma pausa
function inicioDaSessao(heartbeats) {
  let i = heartbeats.length - 1;
  while (i > 0 && heartbeats[i].time - heartbeats[i - 1].time < PAUSA_S) i -= 1;
  return heartbeats[i].time;
}

async function montar(env) {
  const agora = Date.now();
  const hoje = diaNoFuso(agora);

  const [deHoje, editorPorId] = await Promise.all([
    heartbeatsDoDia(hoje, env),
    mapaEditores(env),
  ]);

  // Logo depois da meia-noite, a sessão pode ter começado ontem
  let heartbeats = deHoje;
  if (minutosDesdeMeiaNoite(agora) < WAKATIME_CONFIG.MINUTOS_PAUSA + WAKATIME_CONFIG.MINUTOS_ATIVO) {
    const ontem = diaNoFuso(agora - 24 * 60 * 60 * 1000);
    heartbeats = [...(await heartbeatsDoDia(ontem, env)), ...deHoje];
  }

  const hojeSegundos = somarSegundos(deHoje);
  const ultimo = heartbeats.at(-1);
  if (!ultimo) return { ativo: false, hojeSegundos, ultimo: null };

  const publico = projetoPublico(ultimo.project, env);
  if (!publico && !WAKATIME_CONFIG.MOSTRAR_PRIVADO) {
    return { ativo: false, hojeSegundos, ultimo: null };
  }

  return {
    ativo: agora / 1000 - ultimo.time <= ATIVO_S,
    hojeSegundos,
    ultimo: {
      publico,
      projeto: publico ? ultimo.project : null,
      branch: publico ? ultimo.branch || null : null,
      linguagem: ultimo.language || null,
      editor: editorPorId.get(ultimo.user_agent_id) ?? null,
      em: Math.round(ultimo.time * 1000), // ms
      inicioSessao: Math.round(inicioDaSessao(heartbeats) * 1000), // ms
      // Tempo de hoje só neste projeto (sem os heartbeats de ontem)
      projetoHojeSegundos: somarSegundos(deHoje.filter((hb) => hb.project === ultimo.project)),
    },
  };
}

// Vários visitantes no mesmo instante: uma chamada só ao WakaTime
let cache = { em: 0, dados: null, promessa: null };

async function obterCodando(env) {
  if (cache.dados && Date.now() - cache.em < CACHE_MS) return cache.dados;
  if (!cache.promessa) {
    cache.promessa = montar(env)
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

function enviar(res, status, corpo, cacheControl = 'no-store') {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cacheControl);
  res.end(JSON.stringify(corpo));
}

/** GET /api/codando */
export async function atenderCodando(req, res, env = {}) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return enviar(res, 405, { erro: 'metodo', mensagem: 'Use GET.' });
  }

  if (!temToken(env)) {
    return enviar(res, 503, {
      erro: 'sem_token',
      mensagem: 'O "codando agora" precisa do WAKATIME_ACCESS_TOKEN (heartbeats são privados).',
    });
  }

  try {
    const dados = await obterCodando(env);
    return enviar(res, 200, dados, 'public, max-age=0, s-maxage=60, stale-while-revalidate=60');
  } catch (erro) {
    console.error('Codando agora:', erro?.message ?? erro);
    if (erro?.status === 401) {
      return enviar(res, 401, { erro: 'token_invalido', mensagem: 'Token OAuth inválido ou revogado.' });
    }
    if (erro?.status === 403) {
      return enviar(res, 403, { erro: 'sem_permissao', mensagem: 'O token precisa do escopo read_heartbeats.' });
    }
    return enviar(res, 502, { erro: 'wakatime', mensagem: 'Não foi possível falar com o WakaTime agora.' });
  }
}
