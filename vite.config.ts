import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // 保留原来的入口，同时增加内容脚本入口
        main: resolve(__dirname, 'index.html'),
        content: resolve(__dirname, 'src/content.tsx'),
      },
      output: {
        // 可配置输出文件名，确保 content.tsx 打包后为 content.js
      },
    },
  },
});
