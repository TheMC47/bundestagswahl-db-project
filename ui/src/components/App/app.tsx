import { CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import './style.css'
import theme from './theme'
import React, { useEffect } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Header from '../Header/Header'
import LandingPage from '../Header/Home'
import SeatDistribution from '../Results/SeatDistribution'
import RegionView from '../Results/RegionView'
import RegionViewSingle from '../Results/RegionViewSingle'
import TightestWinnerView from '../Analysis/TightestWinner'
import KoalitionenView from '../Analysis/Coalitions'
import { JoblessnessBarChart } from '../Analysis/JoblessnessAnalysis'
import UeberhangsmandateView from '../Analysis/Ueberhangsmandate'
import Abgeordnete from '../Results/abgeordnete'
import { ping } from '../../api'
import Wahlzettel from '../Voting/Wahlzettel'
import { HelperLogin } from '../Voting/Login'
import { Helmet } from 'react-helmet'

export default function App(): JSX.Element {
  const setToken = (token: string | undefined) => {
    if (token) return localStorage.setItem('token', token)
    localStorage.removeItem('token')
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    ping(token).catch(() => localStorage.removeItem('token'))
  }, [])

  return (
    <Router>
      <Helmet>
        <title>Bundestagswahlen</title>
      </Helmet>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Header />
        <Routes>
          <Route path='/' element={<LandingPage />} />
          <Route path='/sitzverteilung' element={<SeatDistribution />} />
          <Route path='/knappste-sieger' element={<TightestWinnerView />} />
          <Route path='/ergebnisse' element={<RegionView />} />
          <Route path='/ergebnisse-einzelstimmen' element={<RegionViewSingle />} />
          <Route path='/abgeordnete' element={<Abgeordnete />} />
          <Route
            path='/ueberhangsmandate'
            element={<UeberhangsmandateView />}
          />
          <Route path='/koalitionen' element={<KoalitionenView />} />
          <Route path='/arbeitslosigkeit' element={<JoblessnessBarChart />} />
          <Route
            path='/stimmabgabe'
            element={
              <Wahlzettel
                setToken={setToken}
                token={localStorage.getItem('token')}
              />
            }
          />
          <Route path='/login' element={<HelperLogin setToken={setToken} />} />
        </Routes>
      </ThemeProvider>
    </Router>
  )
}
