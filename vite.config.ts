import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // --- 在这里添加 base 属性 ---
  base: '/tiangong/', 
  // --------------------------
  
  plugins: [
    react(),  // 使用默认配置，避免babel-plugin-react-dev-locator依赖问题
    tsconfigPaths()
  ],
  build: {
    // 优化构建性能
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    // 分包策略，减少单个包大小
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
  },
  // 依赖预构建优化
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'antd',
      '@ant-design/icons',
      'react-router-dom',
      'three',
      'echarts',
      'clsx',
      'tailwind-merge',
      'dayjs',
      'zustand',
      'sonner',
      'lucide-react'
    ]
  },
  // 开发服务器配置
  server: {
    host: true,
    port: 5173
  }
})
