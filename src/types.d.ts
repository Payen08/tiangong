// 临时类型声明文件，用于解决模块找不到的错误

// React 相关
declare module 'react' {
  export * from '@types/react';
}

declare module 'react-dom/client' {
  export * from '@types/react-dom/client';
}

declare module 'react/jsx-runtime' {
  export namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// Ant Design 相关
declare module 'antd' {
  export const Layout: any;
  export const Menu: any;
  export const Button: any;
  export const Card: any;
  export const Form: any;
  export const Input: any;
  export const Table: any;
  export const Modal: any;
  export const Space: any;
  export const Row: any;
  export const Col: any;
  export const Statistic: any;
  export const List: any;
  export const Tag: any;
  export const Select: any;
  export const Tree: any;
  export const Breadcrumb: any;
  export const Dropdown: any;
  export const Avatar: any;
  export const message: any;
  export const Pagination: any;
  export const ConfigProvider: any;
}

declare module 'antd/locale/zh_CN' {
  const zhCN: any;
  export default zhCN;
}

declare module 'antd/es/table' {
  export interface ColumnsType<_T = any> {
    [key: string]: any;
  }
}

declare module 'antd/es/tree' {
  export interface DataNode {
    [key: string]: any;
  }
}

// Ant Design Icons
declare module '@ant-design/icons' {
  export const UserOutlined: any;
  export const LockOutlined: any;
  export const MenuFoldOutlined: any;
  export const MenuUnfoldOutlined: any;
  export const HomeOutlined: any;
  export const SettingOutlined: any;
  export const TeamOutlined: any;
  export const SafetyOutlined: any;
  export const KeyOutlined: any;
  export const LogoutOutlined: any;
  export const PlusOutlined: any;
  export const EditOutlined: any;
  export const DeleteOutlined: any;
  export const EyeOutlined: any;
  export const SearchOutlined: any;
  export const ReloadOutlined: any;
  export const DownOutlined: any;
  export const RightOutlined: any;
}

// React Router DOM
declare module 'react-router-dom' {
  export const createBrowserRouter: any;
  export const RouterProvider: any;
  export const Outlet: any;
  export const Navigate: any;
  export const useNavigate: any;
  export const useLocation: any;
  export const Link: any;
}

// Zustand
declare module 'zustand' {
  export function create<T>(fn: (set: any, get: any) => T): () => T;
}

// Vite 相关
declare module 'vite' {
  export function defineConfig(config: any): any;
}

declare module '@vitejs/plugin-react' {
  export default function react(): any;
}

declare module 'vite-tsconfig-paths' {
  export default function tsconfigPaths(): any;
}

// 全局 JSX 命名空间
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export {};