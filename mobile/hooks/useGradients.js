import { Colors } from '../constants/Colors';

// Hook to get gradient colors based on theme
export const useGradientColors = (theme = 'dark') => {
  return {
    accent: Colors[theme].accentGradient,
    primary: Colors[theme].accentGradient,
    // You can add more gradient variations here
    success: ['#4CAF50', '#45A049', '#3D8B40'],
    error: ['#FF6B6B', '#FF5252', '#E53935'],
    warning: ['#FF9800', '#F57C00', '#E65100'],
  };
};

// Helper function to get gradient props
export const getGradientProps = (type = 'accent', theme = 'dark') => {
  const gradients = useGradientColors(theme);
  return {
    colors: gradients[type] || gradients.accent,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  };
};

export default { useGradientColors, getGradientProps };
