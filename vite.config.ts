import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    react(),  // 使用默认配置，避免babel-plugin-react-dev-locator依赖问题
    tsconfigPaths()
  ],
})