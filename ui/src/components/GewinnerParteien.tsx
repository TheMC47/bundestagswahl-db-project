import { useEffect, useState } from 'react';
import { ParteiGewinner, State } from '../models'
import { getGewinner, getStates } from '../api'
import { Container, Row, Table } from 'react-bootstrap';
import { Form } from 'react-bootstrap';

interface GewinnerTableProps {
  bundesland: State
}


export function GewinnerTable({ bundesland }: GewinnerTableProps): JSX.Element {
  const [gewinner, setGewinner] = useState<ParteiGewinner[]>([]);

  useEffect(() => {
    getGewinner(bundesland.id).then(ds => {
      setGewinner(ds)
    })
  }, [bundesland])

  return (
    <Table className="mt-5">
      <thead>
        <tr>
          <th className="align-top"> Partei </th>
          <th> Gewonnene Wahlkreise
            <Table borderless className="mb-0">
              <thead>
                <tr>
                  <th className="text-start">Kandidat</th>
                  <th className="text-end">Wahlkreis Nr.</th>
                </tr>
              </thead>
            </Table>
          </th>
          <th> Gewonnene Listeplätze
            <Table borderless className="mb-0">
              <thead>
                <tr>
                  <th className="text-start">Kandidat</th>
                  <th className="text-end">Listen.Nr.</th>
                </tr>
              </thead>
            </Table>
          </th>
        </tr>
      </thead>
      <tbody>
        {
          gewinner.map((d, i) =>
            <tr key={i}>
              <td>{d.partei}</td>
              <td>{d.gewinner.wahlkreise &&
                <Table borderless>
                  <tbody>
                    {d.gewinner.wahlkreise.map((g, j) =>
                      <tr key={j} className="">
                        <td className="text-start col-11">{g.kandidat}</td>
                        <td className="text-end float-right col-1">{g.wahlkreis}</td>
                      </tr>
                    )}
                  </tbody>
                </Table>}
              </td>
              <td>{d.gewinner.listenplaetze &&
                <Table borderless>
                  <tbody>
                    {d.gewinner.listenplaetze.map((g, j) =>
                      <tr key={j} className="">
                        <td className="text-start col-11">{g.kandidat}</td>
                        <td className="text-end float-right col-1">{g.listennummer}</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              }
              </td>
            </tr>
          )
        }
      </tbody>
    </Table>
  );

}
export default function GewinnerView(): JSX.Element {

  const [bundeslaender, setBundeslaender] = useState<State[]>([]);
  const [bundesland, setBundesland] = useState<State | undefined>(undefined);

  useEffect(() => {
    getStates().then((ss) => setBundeslaender(ss))

  }, [])

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setBundesland(bundeslaender.find((s) => s.id == +e.currentTarget.value))
  }

  return (
    <Container>
      <h2 className="mb-5">Wahlkreissieger</h2>
      <Row>
        <Form.Select onChange={handleStateChange} value={bundesland?.id || ''}>
          <option value="" disabled>Bundesland...</option>
          {bundeslaender.map((s) =>
            <option value={s.id} key={s.id}>{s.name}</option>
          )}
        </Form.Select>
      </Row>
      <Row>
        {bundesland && <GewinnerTable bundesland={bundesland} />}
      </Row>
    </Container>
  );
}
