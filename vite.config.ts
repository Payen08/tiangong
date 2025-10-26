import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    react(),  // 使用默认配置，避免babel-plugin-react-dev-locator依赖问题
    tsconfigPaths()
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 将 React 相关库分离到独立的 chunk
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // 将 Ant Design 相关库分离到独立的 chunk
          'antd-vendor': ['antd', '@ant-design/icons'],
          // 将 Three.js 分离到独立的 chunk
          'three-vendor': ['three'],
          // 将 ECharts 分离到独立的 chunk
          'echarts-vendor': ['echarts'],
          // 将其他工具库分离到独立的 chunk
          'utils-vendor': ['dayjs', 'clsx', 'tailwind-merge', 'zustand', 'sonner', 'lucide-react']
        }
      }
    },
    // 调整 chunk 大小警告限制
    chunkSizeWarningLimit: 1000
  }
})
