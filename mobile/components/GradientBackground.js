import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';

export const GradientBackground = ({ 
  children, 
  style, 
  colors, 
  start = { x: 0, y: 0 }, 
  end = { x: 1, y: 1 }, 
  ...props 
}) => {
  const gradientColors = colors || Colors.dark.accentGradient;
  
  return (
    <LinearGradient
      colors={gradientColors}
      start={start}
      end={end}
      style={style}
      {...props}
    >
      {children}
    </LinearGradient>
  );
};

export default GradientBackground;
