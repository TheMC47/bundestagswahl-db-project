import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { Container } from 'react-bootstrap';
import SeatDistribution from './components/SeatDistribution';
import Deputies from './components/Deputies'
import RegionView from './components/RegionView'
import TightestWinnerView from './components/TightestWinner';
import UeberhangsmandateView from './components/Ueberhangsmandate';
import RegionViewSingleVotes from './components/RegionViewSingleVotes'
import GewinnerView from './components/GewinnerParteien'
import KoalitionenView from './components/Koalitionen'
import { Navbar } from 'react-bootstrap';
import { Nav } from 'react-bootstrap';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App(): JSX.Element {

  return (
    <Router>
      <Navbar bg="dark" variant="dark">
        <Container>
          <Navbar.Brand href="#home">Bundestagswahl</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link href="/seat-distribution">Seat Distribution</Nav.Link>
            <Nav.Link href="/deputies">Deputies List</Nav.Link>
            <Nav.Link href="/region">Region Results</Nav.Link>
            <Nav.Link href="/tightest-winners">Knappste Ergebnisse</Nav.Link>
            <Nav.Link href="/ueberhangsmandate">Überhangsmandate</Nav.Link>
            <Nav.Link href="/gewinner">Gewinnerparteien</Nav.Link>
            <Nav.Link href="/koalitionen">Koalitionen</Nav.Link>
          </Nav>
        </Container>
      </Navbar>
      <Container className="App d-flex justify-content-center p-6 mt-5">
        <Routes>
          <Route path="/seat-distribution" element={<SeatDistribution />} />
          <Route path="/deputies" element={<Deputies />} />
          <Route path="/region" element={<RegionView />} />
          <Route path="/region-single-votes" element={<RegionViewSingleVotes />} />
          <Route path="/tightest-winners" element={<TightestWinnerView />} />
          <Route path="/ueberhangsmandate" element={<UeberhangsmandateView />} />
          <Route path="/gewinner" element={<GewinnerView />} />
          <Route path="/koalitionen" element={<KoalitionenView />} />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;
