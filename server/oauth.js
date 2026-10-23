// ============================================================
//  Autenticação com o WakaTime por token OAuth.
//
//  A partir de 01/11/2026 a API key do WakaTime só serve para os plugins
//  mandarem dados. Para LER (stats, status_bar, heartbeats) a API exige um
//  token OAuth em "Authorization: Bearer <token>".
//
//  Variáveis de ambiente (sem VITE_: ficam só no servidor):
//    WAKATIME_ACCESS_TOKEN   → token OAuth (npm run wakatime:oauth)
//    WAKATIME_APP_ID         ┐ opcionais: renovação automática quando a API
//    WAKATIME_APP_SECRET     │ responde 401 (token expirado/revogado)
//    WAKATIME_REFRESH_TOKEN  ┘
// ============================================================

export const WAKATIME_API = 'https://wakatime.com/api/v1';
const URL_TOKEN = 'https://wakatime.com/oauth/token';
const TIMEOUT_RENOVAR_MS = 8_000;

const limpo = (valor) => String(valor ?? '').trim();

// Token renovado nesta instância da função (null = usar o do env)
let tokenRenovado = null;
let renovando = null;

export const temToken = (env) => Boolean(limpo(env?.WAKATIME_ACCESS_TOKEN));

const tokenAtual = (env) => tokenRenovado ?? limpo(env?.WAKATIME_ACCESS_TOKEN);

const podeRenovar = (env) =>
  Boolean(
    limpo(env?.WAKATIME_APP_ID) &&
      limpo(env?.WAKATIME_APP_SECRET) &&
      limpo(env?.WAKATIME_REFRESH_TOKEN),
  );

// O WakaTime pode responder em JSON ou em form-urlencoded
function lerToken(texto) {
  try {
    return JSON.parse(texto);
  } catch {
    return Object.fromEntries(new URLSearchParams(texto));
  }
}

// Vários 401 ao mesmo tempo: uma renovação só
function renovar(env) {
  if (!renovando) {
    renovando = (async () => {
      const resposta = await fetch(URL_TOKEN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: new URLSearchParams({
          client_id: limpo(env.WAKATIME_APP_ID),
          client_secret: limpo(env.WAKATIME_APP_SECRET),
          grant_type: 'refresh_token',
          refresh_token: limpo(env.WAKATIME_REFRESH_TOKEN),
        }),
        signal: AbortSignal.timeout(TIMEOUT_RENOVAR_MS),
      });
      const texto = await resposta.text();
      if (!resposta.ok) throw new Error(`OAuth HTTP ${resposta.status} ao renovar o token`);

      const dados = lerToken(texto);
      if (!dados.access_token) throw new Error('OAuth: resposta sem access_token');

      tokenRenovado = dados.access_token;
      console.warn(
        'WakaTime: token OAuth renovado. Rode npm run wakatime:oauth e troque o WAKATIME_ACCESS_TOKEN na Vercel.',
      );
    })().finally(() => {
      renovando = null;
    });
  }
  return renovando;
}

/**
 * GET na API do WakaTime. Devolve o Response.
 *   autenticar: true  → manda o token OAuth (dados da própria conta)
 *   autenticar: false → sem token (perfil público)
 */
export async function chamarWakaTime(caminho, env, { autenticar = true, timeout = 10_000 } = {}) {
  const pedir = () => {
    const headers = { Accept: 'application/json' };
    if (autenticar) headers.Authorization = `Bearer ${tokenAtual(env)}`;
    return fetch(`${WAKATIME_API}${caminho}`, { headers, signal: AbortSignal.timeout(timeout) });
  };

  const resposta = await pedir();

  if (autenticar && resposta.status === 401 && podeRenovar(env)) {
    try {
      await renovar(env);
    } catch (erro) {
      console.error('WakaTime:', erro?.message ?? erro);
      return resposta;
    }
    return pedir();
  }

  return resposta;
}
