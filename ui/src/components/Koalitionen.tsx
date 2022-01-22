import { useEffect, useState } from 'react';
import { ElectionResult, Koalition, } from '../models'
import { getKoalitionen, getSitzVerteilung } from '../api'
import { Bar } from "react-chartjs-2";
import { Grid, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";


export default function KoalitionenView(): JSX.Element {


  const [koalitionen, setKoalitionen] = useState<Koalition[]>([]);

  useEffect(() => {
    getKoalitionen().then((d) => setKoalitionen(d))
  }, [])


  return (
    <>
    <div style={{alignContent: 'center', justifyContent: 'center', paddingTop: "50px", paddingBottom: "50px",  display: "flex"}}>
      <Typography
        fontWeight='600'
        color = '#343a40'
        variant='h3'
        component='h3'
      >
        Mögliche Koalitionen
      </Typography>

    </div>
      <Grid container spacing={30}  direction='row' justifyContent="center">
        <Grid item  xs={4}>
          <Table>
            <TableHead>
              <TableCell > Koalition Nr </TableCell>
              <TableCell > Parteien </TableCell>
              <TableCell > Sitze </TableCell>

            </TableHead>
            <TableBody>
            {
              koalitionen.map((d, i) =>
                <TableRow key={i}>
                  <TableCell >{i + 1}</TableCell>
                  <TableCell >{d.koalition.join(', ')}</TableCell>
                  <TableCell >{d.sitze}</TableCell>
                </TableRow>
              )
            }
            </TableBody>
          </Table>
        </Grid>

        <Grid item xs={7}>
          <KoalitionenViewChart />
        </Grid>
      </Grid>

    </>
  );
}

interface DataSet {
  label: string
  dataset: number[]
  backgroundColor: string
}

export  function KoalitionenViewChart(): JSX.Element {


  const [koalitionen, setKoalitionen] = useState<Koalition[]>([]);
  const [seats, setSeats] = useState<ElectionResult[]>([]);
  const [parties, setParties] = useState<string[]>([]);

  useEffect(() => {
    getKoalitionen().then((d) => {
      setKoalitionen(d)
      setParties(d.map((k) => k.koalition).flat().filter(function(elem, index, self) {
        return index === self.indexOf(elem);
      }))
    })
  }, [])

  useEffect(() => {
    getSitzVerteilung().then(d => setSeats(d.filter(res => res.wahl == 1).filter(s => parties.indexOf(s.kurzbezeichnung) > -1)))
  }, [])


  const title ="Koalitionen"
  const options = {
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true
      }
    },
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
  const colorMap: Record<string, string> = {
    'CDU': '#004B76',
    'SPD': '#C0003D',
    'AfD': '#80CDEC',
    'FDP': '#F7BC3D',
    'DIE LINKE': '#5F316E',
    'GRÜNE': '#008549',
    'CSU': '#0076B6'
  }


  const barData = {
    labels: koalitionen.map((d, index) => "koalition " + ( index + 1)  as string ),
    datasets: seats.map(p => (
        { label: p.kurzbezeichnung,  data:  koalitionen.map(k => k.koalition.indexOf(p.kurzbezeichnung) > -1 ? p.sitze : 0 ) , backgroundColor: colorMap[p.kurzbezeichnung] }
      )
    )
  };

  return (
    <Bar data={barData} options={options} />
  );
}
