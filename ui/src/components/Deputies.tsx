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
    <Container className="col-6">
      <h2 className="mb-5">Abgeordnete</h2>
      <Table>
        <thead>
          <tr>
            <th className="text-start"> Name </th>
            <th className="text-end"> Partei </th>
          </tr>
        </thead>
        <tbody>
          {
            deputies.map((d, i) =>
              <tr key={i}>
                <td className="text-start">{d.name}</td>
                <td className="text-end">{d.partei_kurzbezeichnung}</td>
              </tr>
            )
          }
        </tbody>
      </Table>
    </Container>
  );
}
