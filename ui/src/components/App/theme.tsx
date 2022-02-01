import { createTheme, responsiveFontSizes } from '@mui/material'

const defaultTheme = responsiveFontSizes(
  createTheme({
    typography: {
      fontFamily: "'Poppins', sans-serif",
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            background: '#ffffff',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: '0.375rem',
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableRipple: true,
        },
        styleOverrides: {
          root: {
            padding: '1rem 1rem',
            borderRadius: '.375rem',
            margin: '0rem',
          },
        },
      },
      MuiAutocomplete: {
        styleOverrides: {
          paper: {
            backgroundColor: '#ffffff',
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            color: 'white',
            '&:hover': {
              color: 'white',
            },
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          colorPrimary: {
            backgroundColor: '#bdbdbd',
          },
          barColorPrimary: {
            backgroundColor: '#757575',
          },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            fontSize: 16,
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: 16,
          },
        },
      },
    },

    palette: {
      mode: 'light',
      primary: {
        main: '#999999',
      },
      secondary: {
        main: '#000000',
      },
      success: {
        main: '#2DD881',
      },
      info: {
        main: '#0E7C7B',
      },
      background: {
        default: '#fff',
      },
    },
  })
)
export default defaultTheme
