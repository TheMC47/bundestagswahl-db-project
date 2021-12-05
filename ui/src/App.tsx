import { useEffect, useState } from 'react';
import './App.css';
import SeatDistributionChart, { SeatDistributionTable } from './components/SeatDistribution';

import { getSitzVerteilung } from './api'

import 'bootstrap/dist/css/bootstrap.min.css';
import { Col, Container, Form, Row } from 'react-bootstrap';

export interface ElectionResult {
  kurzbezeichnung: string;
  sitze: number;
  wahl: number;
}

function App(): JSX.Element {
  const [data, setData] = useState<ElectionResult[]>([]);
  const [year, setYear] = useState<number>(1);

  useEffect(() => {
    getSitzVerteilung().then(d => setData(d))
  }, [])

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setYear(+e.currentTarget.value)
  }

  return (
    <Container className="App d-flex justify-content-center">
      <div>
        <h2>Ergebnisse</h2>
        <Row>
          <Col>
            <SeatDistributionChart year={year} data={data} />
          </Col>
          <Col>
            <Form.Select onChange={handleYearChange}>
              <option value="1">2021</option>
              <option value="2">2017</option>
            </Form.Select>
          </Col>
        </Row>
        <Row>
          <SeatDistributionTable year={year} data={data} />
        </Row>
      </div>
    </Container>
  );
}

export default App;
