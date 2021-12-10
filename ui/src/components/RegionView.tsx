import { useEffect, useState } from 'react';
import { ElectionRegionResult, Region, RegionSummary } from '../models'
import { getResults, getRegions, getRegionSummary } from '../api'
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
    <Container>
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
    </Container>
  );

}

export function RegionSummaryView({ region }: RegionProps): JSX.Element {

  const [regionSummary, setRegionSummary] = useState<RegionSummary | undefined>(undefined);

  useEffect(() => {
    getRegionSummary(region.id).then(data => {
      setRegionSummary(data)
    }
    )
  })

  return (
    <Container>
      <Row>
        <Col>
          <strong>Gewinner:</strong> {regionSummary?.gewinner} ({regionSummary?.sieger_partei})
        </Col>
        <Col>
          <strong>Wahlbeteiligung:</strong> {regionSummary?.wahlbeteiligung}%
        </Col>
      </Row>
    </Container>
  );
}


export default function RegionView(): JSX.Element {
  const [region, setRegion] = useState<Region | undefined>(undefined);
  const [regions, setRegions] = useState<Region[]>([]);

  useEffect(() => {
    getRegions().then((rs) => setRegions(rs))
  }, [])

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setRegion(regions[+e.currentTarget.value])
  }

  return (
    <Container>
      <Form.Select onChange={handleRegionChange} value={region?.id}>
        <option value="" selected disabled>Wahlkreis...</option>
        {regions.map(r =>
          <option value={r.id} key={r.id}>{r.name}</option>
        )}
      </Form.Select>
      {region && <RegionSummaryView region={region} />}
      {region && <PerPartyResults region={region} />}
    </Container>
  );
}
