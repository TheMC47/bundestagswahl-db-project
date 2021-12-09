import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { Col, Container, Row } from 'react-bootstrap';
import SeatDistribution from './components/SeatDistribution';
import Deputies from './components/Deputies'
import RegionView from './components/RegionView'

function App(): JSX.Element {


  return (
    <Container className="App d-flex justify-content-center">
      <Row>
        <Col className="mw-75">
          <SeatDistribution />
        </Col>
        <Col>
          <Deputies />
        </Col>
      </Row>
      <Row>
        <RegionView />
      </Row>
    </Container>
  );
}

export default App;
