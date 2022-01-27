import { CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import './style.css'
import theme from './theme'
import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Header from "../Header/Header";
import LandingPage from "../Header/Home";
import SeatDistribution from '../Results/SeatDistribution'
import RegionView from "../Results/RegionView";
import TightestWinnerView from "../Analysis/TightestWinner";
import KoalitionenView from "../Analysis/Coalitions";
import { JoblessnessBarChart } from "../Analysis/JoblessnessAnalysis";
import UeberhangsmandateView from "../Analysis/Ueberhangsmandate";
import Abgeordnete from "../Results/abgeordnete";


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
