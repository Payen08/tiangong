import { useState, useEffect } from 'react';

export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeScreen: boolean;
  screenWidth: number;
}

export const useResponsive = (): ResponsiveState => {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 992;
  const isDesktop = screenWidth >= 992;
  const isLargeScreen = screenWidth >= 1600;

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeScreen,
    screenWidth,
  };
};

export default useResponsive;