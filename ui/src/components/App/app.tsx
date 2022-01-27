import { CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import './style.css'
import theme from './theme'
import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Header from "../Header/header";
import LandingPage from "../Header/home";
import SeatDistribution from '../SeatDistribution'
import RegionView from "../RegionView";
import TightestWinnerView from "../TightestWinner";
import KoalitionenView from "../Koalitionen";
import { JoblessnessBarChart } from "../JoblessnessAnalysis";
import UeberhangsmandateView from "../Ueberhangsmandate";
import Abgeordnete from "../abgeordnete";


class App extends React.Component<unknown> {


  render(): JSX.Element {
    return (
      <Router>
        <ThemeProvider theme={theme}>
          <CssBaseline/>
          <Header/>
          <Routes>
            <Route path='/' element={<LandingPage/>}/>
            <Route path='/sitzverteilung' element={<SeatDistribution/>}/>
            <Route path='/knappste-sieger' element={<TightestWinnerView/>}/>
            <Route path='/wahlkreisuebersicht' element={<RegionView/>}/>
            <Route path='/abgeordnete' element={<Abgeordnete/>}/>
            <Route path='/ueberhangsmandate' element={<UeberhangsmandateView/>}/>
            <Route path='/koalitionen' element={<KoalitionenView/>}/>
            <Route path='/arbeitslosigkeit' element={<JoblessnessBarChart/>}/>
          </Routes>
        </ThemeProvider>
      </Router>

    )
  }
}

export default App
