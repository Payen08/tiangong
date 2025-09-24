/**
 * 全局工具函数和常量
 */

// 开发环境判断
export const isDev = import.meta.env.DEV;

// 开发环境下的console日志包装器
export const devLog = {
  log: (...args: any[]) => {
    if (isDev) console.log(...args);
  },
  warn: (...args: any[]) => {
    if (isDev) console.warn(...args);
  },
  error: (...args: any[]) => {
    if (isDev) console.error(...args);
  },
  info: (...args: any[]) => {
    if (isDev) console.info(...args);
  }
};

// 生产环境下也需要显示的错误日志（用于关键错误）
export const prodError = (...args: any[]) => {
  console.error(...args);
};