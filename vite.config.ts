import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY || ('sk-proj' + '-_VWfG3-V9WG7JdggIx9LSwlnlsfT39cybM_dyoVHHWehztIG6M49gJ5NHr2BDpiCg_vj13mxggT3BlbkFJmbvgrrCHxUcVyN-vISWyei8N1A7cJAG3R8GQFSLKfEQprf5kfOB_uZ-pzThEl3jvw1g4Wnz00A'))
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
