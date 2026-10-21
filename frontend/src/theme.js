import { createTheme } from '@mui/material/styles';

export const bourbonTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#F5A623', // Bourbon Amber Gold
      light: '#FFBA42',
      dark: '#D48806',
      contrastText: '#121212',
    },
    secondary: {
      main: '#1877F2', // Unbox-ED Electric Blue
      light: '#4B9BFF',
      dark: '#0C55B5',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#0B0D11',
      paper: '#14171F',
    },
    text: {
      primary: '#F0F3F6',
      secondary: '#94A3B8',
    },
    divider: 'rgba(245, 166, 35, 0.15)',
  },
  typography: {
    fontFamily: '"Roboto", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontWeight: 800, color: '#F5A623', letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, color: '#F5A623', letterSpacing: '-0.01em' },
    h3: { fontWeight: 700, color: '#F0F3F6' },
    h4: { fontWeight: 700, color: '#F0F3F6' },
    h5: { fontWeight: 600, color: '#F5A623' },
    h6: { fontWeight: 600, color: '#F0F3F6' },
    subtitle1: { color: '#94A3B8' },
    subtitle2: { color: '#64748B' },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0B0D11',
          scrollbarColor: '#2D3748 #0B0D11',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: 8,
            height: 8,
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: '#2D3748',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(20, 23, 31, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(245, 166, 35, 0.12)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          background: 'linear-gradient(135deg, #F5A623 0%, #D48806 100%)',
          boxShadow: '0 4px 14px rgba(245, 166, 35, 0.35)',
          '&:hover': {
            background: 'linear-gradient(135deg, #FFBA42 0%, #F5A623 100%)',
            boxShadow: '0 6px 20px rgba(245, 166, 35, 0.5)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid rgba(245, 166, 35, 0.15)',
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          color: '#F5A623',
        },
      },
    },
  },
});
