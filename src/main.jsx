import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import CssBaseline from '@mui/material/CssBaseline'
import { RequestModalProvider } from '@/context/RequestModalContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RequestModalProvider>
      <CssBaseline />
      <App />
    </RequestModalProvider>
  </React.StrictMode>
)
