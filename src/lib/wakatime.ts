import type { RangeWakaTime, StatsWakaTime } from '../data/wakatimeStats';

/** Erro com o código que o servidor mandou (ver server/wakatime.js). */
export class ErroWakaTime extends Error {
  codigo: string;
  constructor(codigo: string, mensagem: string) {
    super(mensagem);
    this.codigo = codigo;
  }
}

/** Cada período já buscado fica guardado: trocar 7d → 30d → 7d não repete a chamada. */
const cache = new Map<RangeWakaTime, StatsWakaTime>();

const ehJson = (resposta: Response) =>
  resposta.headers.get('content-type')?.includes('application/json') ?? false;

/**
 * Pede as estatísticas ao vivo para /api/wakatime?range=...
 *
 * Em produção quem responde é a função do Vercel (api/wakatime.js) — o
 * navegador não pode chamar o WakaTime direto porque a API não manda CORS.
 * No `npm run dev` e no `npm run preview` quem responde é o plugin do vite,
 * com a mesma lógica.
 *
 * Se a rota não existir (hospedagem 100% estática, por exemplo) a chamada
 * falha e o terminal continua com a foto gerada no build.
 */
export async function buscarStatsAoVivo(range: RangeWakaTime = 'all_time'): Promise<StatsWakaTime> {
  const guardado = cache.get(range);
  if (guardado) return guardado;

  const resposta = await fetch(`${import.meta.env.BASE_URL}api/wakatime?range=${range}`, {
    headers: { Accept: 'application/json' },
  });

  if (!ehJson(resposta)) throw new ErroWakaTime('sem_api', 'A rota /api/wakatime não existe aqui.');

  const corpo = await resposta.json();
  if (resposta.status === 202) {
    throw new ErroWakaTime('calculando', corpo?.mensagem ?? 'O WakaTime ainda está calculando.');
  }
  if (!resposta.ok) {
    throw new ErroWakaTime(corpo?.erro ?? 'wakatime', corpo?.mensagem ?? `HTTP ${resposta.status}`);
  }

  const dados = corpo as StatsWakaTime;
  if (!Array.isArray(dados?.linguagens)) {
    throw new ErroWakaTime('resposta', 'WakaTime: resposta inesperada');
  }
  cache.set(range, dados);
  return dados;
}

/* ===================== "Codando agora" (/api/codando) ===================== */

export type CodandoAgora = {
  ativo: boolean;
  hojeSegundos: number;
  ultimo: {
    publico: boolean;
    projeto: string | null;
    branch: string | null;
    linguagem: string | null;
    editor: string | null;
    /** Último heartbeat (ms). */
    em: number;
    /** Começo da sessão atual (ms). */
    inicioSessao: number;
    projetoHojeSegundos: number;
  } | null;
};

/**
 * ok           → dados prontos
 * indisponivel → sem token, sem a rota (site estático): para de perguntar
 * erro         → falha passageira: tenta de novo no próximo ciclo
 */
export type ResultadoCodando =
  | { status: 'ok'; dados: CodandoAgora }
  | { status: 'indisponivel' }
  | { status: 'erro' };

export async function buscarCodandoAgora(): Promise<ResultadoCodando> {
  try {
    const resposta = await fetch(`${import.meta.env.BASE_URL}api/codando`, {
      headers: { Accept: 'application/json' },
    });
    if (!ehJson(resposta) || resposta.status === 503) return { status: 'indisponivel' };
    if (!resposta.ok) return { status: 'erro' };

    const dados = (await resposta.json()) as CodandoAgora;
    return typeof dados?.ativo === 'boolean' ? { status: 'ok', dados } : { status: 'erro' };
  } catch {
    return { status: 'erro' };
  }
}
