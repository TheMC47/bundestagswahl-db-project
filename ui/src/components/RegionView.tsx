import { useEffect, useState } from 'react';
import { ElectionRegionResult, Region, RegionSummary, State } from '../models'
import { getResults, getRegionSummary, getStatesAndRegions } from '../api'
import { Container, Row, Table } from 'react-bootstrap';
import { Form } from 'react-bootstrap';
import { Col } from 'react-bootstrap';


export interface RegionProps {
  region: Region
}

export function PerPartyResults({ region }: RegionProps): JSX.Element {
  const [results, setResults] = useState<ElectionRegionResult[]>([]);

  useEffect(() => {
    getResults(region.id).then(ds => {
      setResults(ds)
    })
  }, [region])

  return (
    <Table>
      <thead>
        <tr>
          <th> Partei </th>
          <th> Erststimmen 2021 </th>
          <th> (%) </th>
          <th> Erststimmen 2017 </th>
          <th> (%) </th>
          <th> Unterschied (%) </th>
          <th> Zweitstimmen 2021 </th>
          <th> (%) </th>
          <th> Zweitstimmen 2017 </th>
          <th> (%) </th>
          <th> Unterschied (%) </th>
        </tr>
      </thead>
      <tbody>
        {
          results.map((d, i) =>
            <tr key={i + d.kurzbezeichnung + region}>
              <td>{d.kurzbezeichnung}</td>
              <td>{d.erststimmen_anzahl_2021}</td>
              <td>{d.erststimmen_prozent_2021}</td>
              <td>{d.erststimmen_anzahl_2017}</td>
              <td>{d.erststimmen_prozent_2017}</td>
              <td>{d.unterschied_erststimmen}</td>
              <td>{d.zweitstimmen_anzahl_2021}</td>
              <td>{d.zweitstimmen_prozent_2021}</td>
              <td>{d.zweitstimmen_anzahl_2017}</td>
              <td>{d.zweitstimmen_prozent_2017}</td>
              <td>{d.unterschied_zweitstimmen}</td>
            </tr>
          )
        }
      </tbody>
    </Table>
  );

}

export function RegionSummaryView({ region }: RegionProps): JSX.Element {

  const [regionSummary, setRegionSummary] = useState<RegionSummary | undefined>(undefined);

  useEffect(() => {
    getRegionSummary(region.id).then(data => {
      setRegionSummary(data)
    }
  )}, [region])

  return (
    <Row>
      <Col>
        <strong>Gewinner:</strong> {regionSummary?.gewinner} ({regionSummary?.sieger_partei})
      </Col>
      <Col>
        <strong>Wahlbeteiligung:</strong> {regionSummary?.wahlbeteiligung}%
      </Col>
    </Row>
  );
}


export default function RegionView(): JSX.Element {


  const [statesAndRegions, setStates] = useState<State[]>([]);
  const [state, setState] = useState<State | undefined>(undefined);
  const [region, setRegion] = useState<Region | undefined>(undefined);

  useEffect(() => {
    getStatesAndRegions().then((ss) => setStates(ss))

  }, [])

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setState(statesAndRegions.find((s) => s.id == +e.currentTarget.value))
    setRegion(undefined)
  }

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setRegion(state?.wahlkreise.find((r) => r.id == +e.currentTarget.value))
  }

  return (
    <Container>
      <h2 className="mb-5">Wahlkreisübersicht</h2>
      <Row>
        <Col>
          <Row>
            <Col>
              <Form.Select onChange={handleStateChange} value={state?.id || ''}>
                <option value="" disabled>Bundesland...</option>
                {statesAndRegions.map((s) =>
                  <option value={s.id} key={s.id}>{s.name}</option>
                )}
              </Form.Select>
            </Col>
            <Col>
              {state && <Form.Select onChange={handleRegionChange} value={region?.id || ''}>
                <option value="" disabled>Wahlkreis...</option>
                {state.wahlkreise.map(r =>
                  <option value={r.id} key={r.id}>{r.name}</option>
                )}
              </Form.Select>
              }
            </Col>
          </Row>
        </Col>
        <Col>
          {region && <RegionSummaryView region={region} />}
        </Col>
      </Row>
      <div className="mt-5">
        <hr />
        {region && <PerPartyResults region={region} />}
      </div>
    </Container>
  );
}
