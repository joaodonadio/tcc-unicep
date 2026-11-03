import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { proventosAgregados } from './scripts/proventosAgregados.mjs';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // API_BASE_URL e API_KEY NÃO têm o prefixo VITE_ de propósito: assim a chave
  // fica só no servidor de desenvolvimento/preview e nunca entra no pacote do
  // navegador. Em produção é preciso um proxy equivalente que injete X-API-Key.
  const env = loadEnv(mode, process.cwd(), '');
  // Só a API privada: nenhum proxy para serviço público (regra em src/test/lib/apiPublica.test.js).
  const proxy = {};
  if (env.API_BASE_URL) {
    proxy['/api'] = {
      target: env.API_BASE_URL,
      changeOrigin: true,
      rewrite: (caminho) => caminho.replace(/^\/api/, ''),
      headers: { 'X-API-Key': env.API_KEY ?? '' },
    };
  }

  return {
    plugins: [react(), proventosAgregados(env)],
    resolve: {
      alias: { '@': path.resolve(process.cwd(), 'src') },
    },
    // allowedHosts: aceita o link temporário do túnel da Cloudflare (cloudflared),
    // usado para mostrar o site rodando localmente a outra pessoa.
    server: { port: 5173, proxy, allowedHosts: ['.trycloudflare.com'] },
    preview: { proxy, allowedHosts: ['.trycloudflare.com'] },
    build: {
      // ECharts (core já modular) e three passam de 500 KB por natureza; os dois são lazy
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          // terceiros em chunks próprios: o cache deles sobrevive aos deploys do código do app
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (/[\\/]node_modules[\\/](echarts|zrender)[\\/]/.test(id)) return 'echarts';
            // o GLTFLoader (three/examples) fica no chunk do import dinâmico, fora do chunk 'three' usado pela ficha
            if (/[\\/]node_modules[\\/]three[\\/](?!examples[\\/])/.test(id)) return 'three';
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|@tanstack)[\\/]/.test(id)) return 'react';
            return undefined;
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.js'],
      globals: true,
      // testes sempre nos pacotes de public/dados, qualquer que seja o .env local
      env: { VITE_FONTE_DADOS: 'arquivos' },
    },
  };
});
