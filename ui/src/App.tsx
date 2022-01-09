import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import { Container } from 'react-bootstrap'
import SeatDistribution from './components/SeatDistribution'
import Deputies from './components/Deputies'
import RegionView from './components/RegionView'
import TightestWinnerView from './components/TightestWinner'
import UeberhangsmandateView from './components/Ueberhangsmandate'
import RegionViewSingleVotes from './components/RegionViewSingleVotes'
import GewinnerView from './components/GewinnerParteien'
import KoalitionenView from './components/Koalitionen'
import Wahlzettel from './components/Wahlzettel'
import { Navbar } from 'react-bootstrap'
import { Nav } from 'react-bootstrap'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { JoblessnessBarChart } from './components/JoblessnessAnalysis'
import { HelperLogin } from './components/Login'
import { useEffect } from 'react'
import { ping } from './api'

function App(): JSX.Element {
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
      <Navbar bg='dark' variant='dark'>
        <Container>
          <Navbar.Brand href='#home'>Bundestagswahl</Navbar.Brand>
          <Nav className='me-auto'>
            <Nav.Link href='/sitzverteilung'>Sitzverteilung</Nav.Link>
            <Nav.Link href='/abgeordnete'>Abgeordnete</Nav.Link>
            <Nav.Link href='/wahlkreisuebersicht'>Wahlkreisübersicht</Nav.Link>
            <Nav.Link href='/knappste-sieger'>Knappste Sieger</Nav.Link>
            <Nav.Link href='/ueberhangsmandate'>Überhangsmandate</Nav.Link>
            <Nav.Link href='/wahlkreissieger'>Wahlkreissieger</Nav.Link>
            <Nav.Link href='/koalitionen'>Koalitionen</Nav.Link>
            <Nav.Link href='/arbeitslosigkeit'>
              Arbeitslosigkeit und ideologische Tendenzen
            </Nav.Link>
            <Nav.Link href='/login'>Login</Nav.Link>
            <Nav.Link href='/stimmabgabe'>Stimmabgabe</Nav.Link>
          </Nav>
        </Container>
      </Navbar>
      <Container className='App d-flex justify-content-center p-6 mt-5'>
        <Routes>
          <Route path='/sitzverteilung' element={<SeatDistribution />} />
          <Route path='/abgeordnete' element={<Deputies />} />
          <Route path='/wahlkreisuebersicht' element={<RegionView />} />
          <Route
            path='/region-single-votes'
            element={<RegionViewSingleVotes />}
          />
          <Route path='/knappste-sieger' element={<TightestWinnerView />} />
          <Route
            path='/ueberhangsmandate'
            element={<UeberhangsmandateView />}
          />
          <Route path='/wahlkreissieger' element={<GewinnerView />} />
          <Route path='/koalitionen' element={<KoalitionenView />} />
          <Route path='/arbeitslosigkeit' element={<JoblessnessBarChart />} />
          <Route path='/login' element={<HelperLogin setToken={setToken} />} />
          <Route
            path='/stimmabgabe'
            element={
              <Wahlzettel
                setToken={setToken}
                token={localStorage.getItem('token')}
              />
            }
          />
        </Routes>
      </Container>
    </Router>
  )
}

export default App
