import { useEffect, useState } from 'react';
import { Party, TightestWinner } from '../models'
import { getParties, getTightestWinner } from '../api'
import { Container, Form, Row, Table } from 'react-bootstrap';


export interface PartyProps {
  party: Party;
  year: number;
}


export default function TightestWinnerView(): JSX.Element {
  const [party, setParty] = useState<Party | undefined>(undefined);
  const [parties, setParties] = useState<Party[]>([]);
  const [year, setYear] = useState<number | undefined>(undefined);

  useState(() => {
    getParties().then((p) => setParties(p))
  })

  const handlePartyChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setParty(parties.find((p) => p.id == +e.currentTarget.value))
  }
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setYear(+e.currentTarget.value)
  }
  return (
    <Container>
      <Row>
        <Form.Select onChange={handleYearChange}>
          <option value="" selected disabled>Jahr...</option>
          <option value="1">2021</option>
          <option value="2">2017</option>
        </Form.Select>
        {year &&
          <Form.Select onChange={handlePartyChange} value={party?.id}>
            <option value="" selected disabled>Partei...</option>
            {parties.map(p =>
              <option value={p.id} key={p.id}>{(p.kurzbezeichnung != '') ? p.kurzbezeichnung : p.name}</option>
            )}
          </Form.Select>
        }
      </Row>
      {year && party && <PerPartyResults party={party} year={year} />}
    </Container>
  );
}

export function PerPartyResults({ party, year }: PartyProps): JSX.Element {
  const [results, setResults] = useState<TightestWinner[]>([]);

  useEffect(() => {
    getTightestWinner(year, party.id).then(ds => {
      setResults(ds)
    })
  }, [party])

  return (
    <Container>
      <Row>
        <div>
          <h2> Top knappste {results[0] && results[0].siege ? 'Siege' : 'Besiegte'}</h2>
        </div>
      </Row>
      <Table>
        <thead>
          <tr>
            <th> Rank</th>
            <th> Wahlkreise</th>
          </tr>
        </thead>
        <tbody>
          {

            results.map((d, i) =>
              <tr key={i}>
                <td>{d.rank}</td>
                <td>{d.wahlkreis}</td>
              </tr>
            )
          }
        </tbody>
      </Table>
    </Container>
  );

}



