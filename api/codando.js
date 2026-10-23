// Vercel Function: GET /api/codando
//
// Em que projeto estou mexendo no editor agora (heartbeats do WakaTime).
// Lê WAKATIME_ACCESS_TOKEN das Environment Variables da Vercel
// (WAKATIME_APP_ID, WAKATIME_APP_SECRET e WAKATIME_REFRESH_TOKEN deixam a
// renovação automática ligada). A lógica fica em server/codando.js — a
// mesma que o plugin do vite usa no `npm run dev` e no `npm run preview`.

import { atenderCodando } from '../server/codando.js';

export default function handler(req, res) {
  return atenderCodando(req, res, process.env);
}
