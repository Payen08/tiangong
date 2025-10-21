import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
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
          // 将大型库分离到单独的包中
          'vendor-react': ['react', 'react-dom'],
          'vendor-antd': ['antd', '@ant-design/icons'],
          'vendor-router': ['react-router-dom'],
          'vendor-three': ['three'],
          'vendor-echarts': ['echarts'],
          'vendor-utils': ['clsx', 'tailwind-merge', 'dayjs', 'zustand']
        }
      }
    },
    // 设置包大小警告阈值
    chunkSizeWarningLimit: 1000
  },
  // 优化依赖预构建
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
      'zustand'
    ]
  },
  // 服务器配置
  server: {
    host: true,
    port: 5173
  }
})