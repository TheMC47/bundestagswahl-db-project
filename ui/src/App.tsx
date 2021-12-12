import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { Container } from 'react-bootstrap';
import SeatDistribution from './components/SeatDistribution';
import Deputies from './components/Deputies'
import RegionView from './components/RegionView'
import TightestWinnerView from './components/TightestWinner';
import UeberhangsmandateView from './components/Ueberhangsmandate';
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
          </Nav>
        </Container>
      </Navbar>
      <Container className="App d-flex justify-content-center p-6 mt-5">
        <Routes>
          <Route path="/seat-distribution" element={<SeatDistribution />} />
          <Route path="/deputies" element={<Deputies />} />
          <Route path="/region" element={<RegionView />} />
          <Route path="/tightest-winners" element={<TightestWinnerView />} />
          <Route path="/ueberhangsmandate" element={<UeberhangsmandateView />} />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;
