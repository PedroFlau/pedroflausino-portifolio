import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin, type PreviewServer, type ViteDevServer } from 'vite'
import { atenderCodando } from './server/codando.js'
import { atender } from './server/wakatime.js'

// Em produção quem atende /api/wakatime e /api/codando são as funções do
// Vercel (pasta api/). Este plugin reproduz as mesmas rotas no `npm run dev`
// e no `npm run preview` — chamando as mesmas funções — para dar pra testar
// ao vivo sem precisar publicar.
function apiWakaTime(env: Record<string, string | undefined>): Plugin {
  const montar = (servidor: ViteDevServer | PreviewServer) => {
    servidor.middlewares.use('/api/wakatime', (req, res) => atender(req, res, env))
    servidor.middlewares.use('/api/codando', (req, res) => atenderCodando(req, res, env))
  }

  return {
    name: 'api-wakatime',
    configureServer: montar,
    configurePreviewServer: montar,
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Prefixo '' lê TODAS as variáveis do .env.local, inclusive as sem VITE_
  // (o WAKATIME_ACCESS_TOKEN). Isso não as expõe: para o navegador continuam
  // indo só as VITE_*.
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') }

  return {
    plugins: [react(), apiWakaTime(env)],
  }
})
