import type { StatsWakaTime } from '../data/wakatimeStats';

/**
 * Pede as estatísticas ao vivo para /api/wakatime.
 *
 * Em produção quem responde é a função do Vercel (api/wakatime.js) — o
 * navegador não pode chamar o WakaTime direto porque a API não manda CORS.
 * No `npm run dev` e no `npm run preview` quem responde é o plugin do vite,
 * com a mesma lógica.
 *
 * Se a rota não existir (hospedagem 100% estática, por exemplo) a chamada
 * falha e o terminal continua com a foto gerada no build.
 */
export async function buscarStatsAoVivo(): Promise<StatsWakaTime> {
  const resposta = await fetch(`${import.meta.env.BASE_URL}api/wakatime`, {
    headers: { Accept: 'application/json' },
  });

  if (!resposta.ok) throw new Error(`WakaTime: HTTP ${resposta.status}`);

  const dados = (await resposta.json()) as StatsWakaTime;
  if (!Array.isArray(dados?.linguagens)) {
    throw new Error('WakaTime: resposta inesperada');
  }
  return dados;
}
