import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// 从localStorage获取初始认证状态
const getInitialAuthState = () => {
  try {
    const storedUser = localStorage.getItem('user');
    const storedAuth = localStorage.getItem('isAuthenticated');
    return {
      user: storedUser ? JSON.parse(storedUser) : null,
      isAuthenticated: storedAuth === 'true'
    };
  } catch {
    return {
      user: null,
      isAuthenticated: false
    };
  }
};

export const useAuthStore = create<AuthState>((set) => {
  const initialState = getInitialAuthState();
  
  return {
    user: initialState.user,
    isAuthenticated: initialState.isAuthenticated,
    login: async (username: string, password: string) => {
      // 模拟登录
      if (username === 'admin' && password === '123456') {
        const user: User = {
          id: '1',
          username: 'admin',
          name: '管理员',
          email: 'admin@example.com',
          role: '超级管理员',
          status: 'active'
        };
        // 保存到localStorage
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('isAuthenticated', 'true');
        set({ user, isAuthenticated: true });
        return true;
      }
      return false;
    },
    logout: () => {
      // 清除localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      set({ user: null, isAuthenticated: false });
    },
  };
});

interface AppState {
  collapsed: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  collapsed: false,
  toggleSidebar: () => set((state: AppState) => ({ collapsed: !state.collapsed })),
}));