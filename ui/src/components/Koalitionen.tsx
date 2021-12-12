import { useEffect, useState } from 'react';
import { Koalition, } from '../models'
import { getKoalitionen } from '../api'
import { Container, Table } from 'react-bootstrap';


export default function KoalitionenView(): JSX.Element {


  const [koalitionen, setKoalitionen] = useState<Koalition[]>([]);

  useEffect(() => {
    getKoalitionen().then((d) => setKoalitionen(d))
  }, [])


  return (
    <Container className="col-5">
      <Table>
        <thead>
          <tr>
            <th className="text-start"> Parteien </th>
            <th className="text-end"> Sitze </th>
          </tr>
        </thead>
        <tbody>
          {
            koalitionen.map((d, i) =>
              <tr key={i}>
                <td className="text-start">{d.koalition.join(', ')}</td>
                <td className="text-end">{d.sitze}</td>
              </tr>
            )
          }
        </tbody>
      </Table>
    </Container>
  );
}
