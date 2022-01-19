
import { CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import React from 'react'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'

interface AppState {
  page: string
  progress: number
}

class App extends React.Component<unknown, AppState> {
  state: AppState = {
    page: 'landing',
    progress: 100,
  }

  render(): JSX.Element {
    return (
      <Router>
          <CssBaseline />
          <Routes>
          </Routes>
      </Router>
    )
  }
}

export default App
