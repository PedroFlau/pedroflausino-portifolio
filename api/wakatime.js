// Vercel Function: GET /api/wakatime
//
// O navegador não consegue chamar o WakaTime direto (a API não manda CORS),
// então esta função faz o meio de campo e devolve só os campos que o
// terminal usa. Toda a lógica está em server/wakatime.js — a mesma que o
// plugin do vite usa no `npm run dev` e no `npm run preview`.

import { atender } from '../server/wakatime.js';

export default function handler(req, res) {
  return atender(req, res, process.env);
}
