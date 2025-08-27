import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
    secondary: { main: '#f48fb1' },
    background: {
      default: '#0b0f14',
      paper: '#11161d'
    },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: 'Poppins, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Helvetica Neue, Arial, sans-serif',
    h2: { fontWeight: 600 },
    h5: { fontWeight: 600 },
  },
  components: {
    MuiContainer: {
      defaultProps: { maxWidth: 'md' }
    }
  }
})

export default theme
