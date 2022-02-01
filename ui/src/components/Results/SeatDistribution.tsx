import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { getSitzVerteilung } from '../../api'
import { useEffect, useState } from 'react'
import { ElectionResult } from '../../models'

import {
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

ChartJS.register(ArcElement, Tooltip, Legend)

interface SeatDistributionProps {
  data: ElectionResult[]
  year: number
}

export default function SeatDistribution(): JSX.Element {
  const [data, setData] = useState<ElectionResult[]>([])
  const [year, setYear] = useState<number>(1)

  useEffect(() => {
    getSitzVerteilung().then(d => setData(d))
  }, [])

  const handleYearChange = (event: SelectChangeEvent<number>) => {
    setYear(event.target.value as number)
  }

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
          Sitzverteilung
        </Typography>
      </div>
      <div
        style={{
          alignContent: 'end',
          justifyContent: 'end',
          paddingRight: '50px',
          paddingTop: '5px',
          paddingBottom: '40px',
          display: 'flex',
        }}
      >
        <FormControl sx={{ width: 120 }}>
          <InputLabel id='demo-simple-select-label'>Jahr</InputLabel>
          <Select value={year} label='Jahr' onChange={handleYearChange}>
            <MenuItem value='1'>2021</MenuItem>
            <MenuItem value='2'>2017</MenuItem>
          </Select>
        </FormControl>
      </div>

      <div style={{ flexGrow: 1 }}>
        <Grid container spacing={50} direction='row' justifyContent='center'>
          <Grid item xs={6}>
            <SeatDistributionChart year={year} data={data} />
          </Grid>

          <Grid item xs={4}>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 200 }}>
                <TableHead>
                  <TableRow>
                    <TableCell align='center'>Partei</TableCell>
                    <TableCell align='center'>Anzahl Sitze</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data
                    .filter(d => d.wahl == year)
                    .map(row => (
                      <TableRow
                        key={row.kurzbezeichnung}
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                        }}
                      >
                        <TableCell align='center'>
                          {row.kurzbezeichnung}
                        </TableCell>
                        <TableCell align='center'>{row.sitze}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </div>
    </>
  )
}

export function SeatDistributionChart({
  data,
  year,
}: SeatDistributionProps): JSX.Element {
  const title = 'Sitzverteilung'
  const label = 'Sitzverteilung'

  const colorMap: Record<string, string> = {
    CDU: '#004B76',
    SPD: '#C0003D',
    AfD: '#80CDEC',
    FDP: '#F7BC3D',
    'DIE LINKE': '#5F316E',
    GRÜNE: '#008549',
    CSU: '#0076B6',
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
          bottom: 30,
        },
      },
    },
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
    hoverOffset: 2,
  }

  return <Doughnut data={chartData} options={options} />
}
