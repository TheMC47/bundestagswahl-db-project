import { useEffect, useState } from 'react';
import { Deputy } from '../models'
import { getDeputies } from '../api'
import { Container, Table } from 'react-bootstrap';


export default function Deputies(): JSX.Element {
  const [deputies, setDeputies] = useState<Deputy[]>([]);

  useEffect(() => {
    getDeputies().then(ds => {
      setDeputies(ds)
    })
  }, [])

  return (
    <Container>
      <Table>
        <thead>
          <tr>
            <th> Name </th>
            <th> Partei </th>
          </tr>
        </thead>
        <tbody>
          {
            deputies.map((d, i) =>
              <tr key={i}>
                <td>{d.name}</td>
                <td>{d.partei_kurzbezeichnung}</td>
              </tr>
            )
          }
        </tbody>
      </Table>
    </Container>
  );
}
