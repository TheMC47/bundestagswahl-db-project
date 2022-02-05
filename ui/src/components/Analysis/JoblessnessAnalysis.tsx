import { Bar } from 'react-chartjs-2'
import { JoblessnessDistricts, JoblessnessSummary } from '../../models'
import { useEffect, useState } from 'react'
import { getDistricts, getJoblessnessAnalysis } from '../../api'

import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Title,
} from 'chart.js'
import {
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  BarController,
  BarElement
)

export interface joblessnessAnalysisProps {
  dataLinks: JoblessnessSummary[]
  dataRechts: JoblessnessSummary[]
  districts: JoblessnessDistricts[]
}

export function JoblessnessBarChart(): JSX.Element {
  const [dataLinks, setDataLinks] = useState<JoblessnessSummary[]>([])
  const [dataRechts, setDataRechts] = useState<JoblessnessSummary[]>([])
  const [districts, setDistricts] = useState<JoblessnessDistricts[]>([])

  useEffect(() => {
    getJoblessnessAnalysis('l').then(d => {
      setDataLinks(d)
    })
  }, [])

  useEffect(() => {
    getJoblessnessAnalysis('r').then(d => setDataRechts(d))
  }, [])

  useEffect(() => {
    getDistricts().then(d => setDistricts(d))
  }, [])

  return (
    <>
      <div
        style={{
          alignContent: 'center',
          justifyContent: 'center',
          paddingTop: '50px',
          paddingBottom: '50px',
          display: 'flex',
        }}
      >
        <Typography
          fontWeight='600'
          color='#343a40'
          variant='h3'
          component='h3'
        >
          Mögliche Koalitionen
        </Typography>
      </div>

      <Grid container spacing={30} direction='row' justifyContent='center'>
        <Grid item xs={4}>
          <Table>
            <TableHead>
              <TableCell> Rank nack Arbeitslosigkeitquote </TableCell>
              <TableCell> Bundesland </TableCell>
              <TableCell> Linke </TableCell>
              <TableCell> Rechte </TableCell>
            </TableHead>
            <TableBody>
              {districts.map((d, i) => (
                <TableRow key={i}>
                  <TableCell>{d.rank}</TableCell>
                  <TableCell>{d.land}</TableCell>
                  <TableCell>
                    {(dataLinks[i]?.anzahlstimmen * 100).toFixed(2) || 0}
                  </TableCell>
                  <TableCell>
                    {(dataRechts[i]?.anzahlstimmen * 100).toFixed(2) || 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Grid>

        <Grid item xs={7}>
          <JoblessnessAnalysis
            dataLinks={dataLinks}
            dataRechts={dataRechts}
            districts={districts}
          />
        </Grid>
      </Grid>
    </>
  )
}

export function JoblessnessAnalysis({
  dataLinks,
  dataRechts,
  districts,
}: joblessnessAnalysisProps): JSX.Element {
  const title = 'Arbeitslosigkeit Analyse'

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
          bottom: 30,
        },
      },
    },
  }

  const barData = {
    labels: districts.map(d => d.land),
    datasets: [
      {
        label: 'Linke',
        data: dataLinks.map(d => d.anzahlstimmen),
        borderColor: '#C0003D',
        backgroundColor: '#C0003D',
      },
      {
        label: 'Rechte',
        data: dataRechts.map(d => d.anzahlstimmen),
        borderColor: '#004B76',
        backgroundColor: '#004B76',
      },
    ],
  }

  return <Bar data={barData} options={options} />
}
