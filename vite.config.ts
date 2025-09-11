// import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
// import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import analyzer from 'rollup-plugin-analyzer'
import path from 'path'
// https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
      build: {
          sourcemap: true,
          rollupOptions: {
              output: {
                  manualChunks: {
                      recharts: ['recharts'],
                      'react-vendor': ['react', 'react-dom'],
                      'ui-vendor': ['framer-motion', 'lucide-react'],
                  },
              },
              plugins: [
                  ...(process.env.ANALYZE === 'true'
                      ? [
                            analyzer({
                                summaryOnly: true,
                                limit: 20,
                                writeTo: analysis => {
                                    console.log('\n=== Bundle Analysis ===')
                                    console.log(analysis)
                                    console.log('======================\n')
                                },
                            }),
                        ]
                      : []),
              ],
          },
      },
      plugins: [
          react(),
          tailwindcss(),
      ],
      optimizeDeps: {
        include: ['diff2html']

      },
      define: {
          'process.env': JSON.stringify(env),
      },
      resolve: {
          alias: {
              '@': path.resolve(__dirname, './src'),
          },
      },
  }
})