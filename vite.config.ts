import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin, type PreviewServer, type ViteDevServer } from 'vite'
import { atender } from './server/wakatime.js'

// Em produção quem atende /api/wakatime é a função do Vercel
// (api/wakatime.js). Este plugin reproduz a mesma rota no `npm run dev` e no
// `npm run preview` — chamando a mesma função — para dar pra testar o comando
// ao vivo sem precisar publicar.
function apiWakaTime(): Plugin {
  const montar = (servidor: ViteDevServer | PreviewServer) => {
    servidor.middlewares.use('/api/wakatime', (req, res) => atender(req, res, process.env))
  }

  return {
    name: 'api-wakatime',
    configureServer: montar,
    configurePreviewServer: montar,
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiWakaTime()],
})
