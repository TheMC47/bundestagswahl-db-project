import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { Col, Container } from 'react-bootstrap';
import SeatDistribution from './components/SeatDistribution';
import Deputies from './components/Deputies'

function App(): JSX.Element {

  return (
    <Container className="App d-flex justify-content-center">
      <Col className="mw-75">
        <SeatDistribution />
      </Col>
      <Col>
        <Deputies />
      </Col>
    </Container>
  );
}

export default App;
