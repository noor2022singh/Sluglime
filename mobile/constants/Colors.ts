const accentColor = '#6CA0DC'; 
const accentGradient = ['#030b21ff', '#0d2449ff', '#5a8ecfff']; // Deep blue to light blue gradient
const greyAccent = '#666666'; // Grey color for tabs
const backgroundDark = '#000000'; 
const cardDark = '#111111'; 
const textPrimary = '#FFFFFF';
const textSecondary = '#CCCCCC';
const divider = '#222222'; 
const error = '#FF6B6B';
const inputBackground = '#111111'; 
const shadow = '#000000';
const inputBorder = '#333333'; 

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: accentColor,
    accentGradient: accentGradient,
    greyAccent: greyAccent,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: accentColor,
    card: '#f5f5f5',
    divider: '#e0e0e0',
    error: error,
    inputBackground: '#f8f9fa',
    shadow: '#000000',
    inputBorder: '#e0e0e0',
  },
  dark: {
    text: textPrimary,
    textSecondary: textSecondary,
    background: backgroundDark,
    card: cardDark,
    tint: accentColor,
    accentGradient: accentGradient,
    greyAccent: greyAccent,
    icon: textSecondary,
    tabIconDefault: textSecondary,
    tabIconSelected: accentColor,
    divider: divider,
    error: error,
    inputBackground: inputBackground,
    shadow: shadow,
    inputBorder: inputBorder,
  },
};
