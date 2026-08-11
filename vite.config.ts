import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// Dev-only same-origin relay for LLM provider calls. `providerAdapters.ts`
// posts straight to the provider's HTTP API from the browser; providers that
// don't send CORS headers for arbitrary origins (OpenAI, most self-hosted /
// custom endpoints) reject those requests outright. Server-to-server HTTP
// isn't subject to CORS, so this middleware fetches on the dev server's
// behalf and hands the response back same-origin. Dev only — a production
// static build has no server to run this on.
const LLM_PROXY_PATH = '/__llm-proxy'
const STRIPPED_REQUEST_HEADERS = new Set(['host', 'origin', 'referer', 'connection', 'content-length'])
const STRIPPED_RESPONSE_HEADERS = new Set(['content-encoding', 'transfer-encoding', 'connection'])

function llmProxyPlugin(): Plugin {
  return {
    name: 'llm-provider-proxy',
    configureServer(server) {
      server.middlewares.use(LLM_PROXY_PATH, async (req, res) => {
        const targetParam = new URL(req.url ?? '', 'http://localhost').searchParams.get('url')
        if (!targetParam) {
          res.statusCode = 400
          res.end('Missing url query param')
          return
        }

        let target: URL
        try {
          target = new URL(targetParam)
        } catch {
          res.statusCode = 400
          res.end('Invalid url query param')
          return
        }
        if (target.protocol !== 'http:' && target.protocol !== 'https:') {
          res.statusCode = 400
          res.end('Only http/https targets are allowed')
          return
        }

        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        const body = chunks.length ? Buffer.concat(chunks) : undefined

        const headers = new Headers()
        for (const [key, value] of Object.entries(req.headers)) {
          if (!value || STRIPPED_REQUEST_HEADERS.has(key.toLowerCase())) continue
          headers.set(key, Array.isArray(value) ? value.join(', ') : value)
        }

        try {
          const upstream = await fetch(target, {
            method: req.method,
            headers,
            body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body,
          })
          res.statusCode = upstream.status
          upstream.headers.forEach((value, key) => {
            if (STRIPPED_RESPONSE_HEADERS.has(key.toLowerCase())) return
            res.setHeader(key, value)
          })
          res.end(Buffer.from(await upstream.arrayBuffer()))
        } catch (err) {
          res.statusCode = 502
          res.end(`Proxy fetch failed: ${err instanceof Error ? err.message : String(err)}`)
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), llmProxyPlugin()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@domain': fileURLToPath(new URL('./src/domain', import.meta.url)),
      '@infra': fileURLToPath(new URL('./src/infrastructure', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
    },
  },

  worker: {
    format: 'es',
  },
})
