import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Col, Container, Form, Row, Table } from 'react-bootstrap';
import { Doughnut } from 'react-chartjs-2';
import { getSitzVerteilung } from '../api'
import { useEffect, useState } from 'react';
import { ElectionResult } from '../models'


ChartJS.register(ArcElement, Tooltip, Legend);

interface SeatDistributionProps {
  data: ElectionResult[]
  year: number
}


export default function SeatDistribution(props: {year: number}): JSX.Element {

  const [data, setData] = useState<ElectionResult[]>([]);

  useEffect(() => {
    getSitzVerteilung().then(d => setData(d))
  }, [])

  return (
    <Container>
      <Row>
        <Col>
          <SeatDistributionChart year={props.year} data={data} />
        </Col>
      </Row>
      <Row>
        <SeatDistributionTable year={props.year} data={data} />
      </Row>
    </Container>
  );

}

export function SeatDistributionTable({ data, year }: SeatDistributionProps): JSX.Element {
  const filteredData = data.filter(d => d.wahl == year)

  return (
    <Table>
      <thead>
        <tr>
          <th>Partei</th>
          <th>Anzahl Sitze</th>
        </tr>
      </thead>
      <tbody>
        {
          filteredData.map((d) =>
            <tr key={d.kurzbezeichnung}>
              <td>{d.kurzbezeichnung}</td>
              <td>{d.sitze}</td>
            </tr>
          )
        }
      </tbody>
    </Table>
  )
}

export function SeatDistributionChart({ data, year }: SeatDistributionProps): JSX.Element {

  const title = 'Sitzverteilung'
  const label = 'Sitzverteilung'

  const colorMap: Record<string, string> = {
    'CDU': '#004B76',
    'SPD': '#C0003D',
    'AfD': '#80CDEC',
    'FDP': '#F7BC3D',
    'DIE LINKE': '#5F316E',
    'GRÜNE': '#008549',
    'CSU': '#0076B6'
  }

  const options = {
    rotation: -90,
    circumference: 180,
    tooltip: {
      enabled: true,
    },
    cutoutPercentage: 95,
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: title,
        padding: {
          top: 10,
          bottom: 30
        }
      }
    }
  }


  const filteredData = data.filter(d => d.wahl == year)
  const chartData = {
    labels: filteredData.map(d => d.kurzbezeichnung),
    datasets: [
      {
        label: label,
        data: filteredData.map(d => d.sitze),
        backgroundColor: filteredData.map(d => colorMap[d.kurzbezeichnung]),
      },
    ],
    hoverOffset: 2
  };

  return (
    <Doughnut data={chartData} options={options} />
  )
}
