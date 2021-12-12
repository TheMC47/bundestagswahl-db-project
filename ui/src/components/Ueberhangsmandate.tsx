import { useEffect, useState } from 'react';
import { Ueberhangsmandate } from '../models'
import { getUeberhangsmandate } from '../api';
import { Col, Container, Form, Row, Table } from 'react-bootstrap';


export default function UeberhangsmandateView(): JSX.Element {

  const [data, setData] = useState<Ueberhangsmandate[]>([]);
  const [year, setYear] = useState<number>(1);


  useEffect(() => {
    getUeberhangsmandate(year).then(d => setData(d))
  }, [year])


  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setYear(+e.currentTarget.value)
  }

  return (
    <Container>
      <Row>
        <Col>
          <Form.Select onChange={handleYearChange}>
            <option value="1">2021</option>
            <option value="2">2017</option>
          </Form.Select>
        </Col>
      </Row>
      <Col>
        <Table>
          <thead>
            <tr>
              <th>Partei</th>
              <th>Bundesland</th>
              <th>Überhangmandate</th>
            </tr>
          </thead>
          <tbody>
            {
              data.map((d, index) =>
                <tr key={index}>
                  <td>{d.partei}</td>
                  <td>{d.land}</td>
                  <td>{d.ueberhange}</td>
                </tr>
              )
            }
          </tbody>
        </Table>
      </Col>
    </Container>
  );
}
