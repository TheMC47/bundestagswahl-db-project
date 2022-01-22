import { useEffect, useRef, useState } from 'react';
import { ElectionRegionResult, Region, RegionSummary, State } from '../models'
import { getResults, getRegionSummary, getStatesAndRegions, getResultsSingleVotes } from '../api'
import { Row, Table } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import {
  Box,
  FormControl,
  InputLabel, MenuItem, Select,
  SelectChangeEvent, Tab,
  TableBody,
  TableCell,
  TableHead,
  TableRow, Tabs,
  Typography
} from "@mui/material";
import TabContext from '@mui/lab/TabContext';



import { Bar } from "react-chartjs-2";
import { TabPanel } from "@mui/lab";


export interface RegionProps {
  region: Region
}

const colorMap_2021: Record<string, string> = {
  'CDU': 'rgba(0, 75, 118, 1)',
  'SPD': 'rgba(192, 0, 61, 1)',
  'AfD': 'rgba(128, 205, 236, 1)',
  'FDP': 'rgba(247, 188, 61, 1)',
  'DIE LINKE': 'rgba(95, 49, 110, 1)',
  'GRÜNE': 'rgba(0, 133, 73, 1)',
  'CSU': 'rgba(0, 118, 182, 1)',
  'sonstiges': 'rgba(151, 151, 151, 1)'
}

const colorMap_2017: Record<string, string> = {
  'CDU': 'rgba(0, 75, 118, 0.4)',
  'SPD': 'rgba(192, 0, 61, 0.4)',
  'AfD': 'rgba(128, 205, 236, 0.4)',
  'FDP': 'rgba(247, 188, 61, 0.4)',
  'DIE LINKE': 'rgba(95, 49, 110, 0.4)',
  'GRÜNE': 'rgba(0, 133, 73, 0.4)',
  'CSU': 'rgba(0, 118, 182, 0.4)',
  'sonstiges': 'rgba(151, 151, 151, 0.4)'
}

const parteien = ['CDU', 'SPD', 'AfD','FDP', 'DIE LINKE', 'GRÜNE', 'CSU']



export function PerPartyResults({ region }: RegionProps): JSX.Element {
  const [results, setResults] = useState<ElectionRegionResult[]>([]);

  useEffect(() => {
    getResults(region.id).then(ds => {
      setResults(ds)
    })
  }, [region])

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell> Partei </TableCell>
          <TableCell> Erststimmen 2021 </TableCell>
          <TableCell> (%) </TableCell>
          <TableCell> Erststimmen 2017 </TableCell>
          <TableCell> (%) </TableCell>
          <TableCell> Unterschied (%) </TableCell>
          <TableCell> Zweitstimmen 2021 </TableCell>
          <TableCell> (%) </TableCell>
          <TableCell> Zweitstimmen 2017 </TableCell>
          <TableCell> (%) </TableCell>
          <TableCell> Unterschied (%) </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {
          results.map((d, i) =>
            <TableRow key={i + d.kurzbezeichnung + region}>
              <TableCell>{d.kurzbezeichnung}</TableCell>
              <TableCell>{d.erststimmen_anzahl_2021}</TableCell>
              <TableCell>{d.erststimmen_prozent_2021}</TableCell>
              <TableCell>{d.erststimmen_anzahl_2017}</TableCell>
              <TableCell>{d.erststimmen_prozent_2017}</TableCell>
              <TableCell>{d.unterschied_erststimmen}</TableCell>
              <TableCell>{d.zweitstimmen_anzahl_2021}</TableCell>
              <TableCell>{d.zweitstimmen_prozent_2021}</TableCell>
              <TableCell>{d.zweitstimmen_anzahl_2017}</TableCell>
              <TableCell>{d.zweitstimmen_prozent_2017}</TableCell>
              <TableCell>{d.unterschied_zweitstimmen}</TableCell>
            </TableRow>
          )
        }
      </TableBody>
    </Table>
  );


}

interface stimmeanteil {
  partei: string;
  anteil_2021: number
  anteil_2017: number
}

export function ChartPartyZweitstimme({ region }: RegionProps): JSX.Element {
  const [results, setResults] = useState<stimmeanteil[]>([]);
  useEffect(() => {
    getResults(region.id).then(ds => {
      const sonstiges_2021 = ds.filter((d) => parteien.indexOf(d.kurzbezeichnung) == - 1).reduce((sum, current) => sum + ( current.zweitstimmen_prozent_2021 || 0), 0)
      const sonstiges_2017= ds.filter((d) => parteien.indexOf(d.kurzbezeichnung) == - 1).reduce((sum, current) => sum + ( current.zweitstimmen_prozent_2017 || 0), 0)
      const newResults = ds.filter((d) => parteien.indexOf(d.kurzbezeichnung) > - 1).map((d) =>{
        return {partei: d.kurzbezeichnung , anteil_2021: d.zweitstimmen_prozent_2021 || 0, anteil_2017: d.zweitstimmen_prozent_2017 || 0}
      })
      newResults.push({partei:'sonstiges', anteil_2021: sonstiges_2021, anteil_2017: sonstiges_2017})
      setResults(newResults)
    })
  }, [region])
  const title = 'Zweitstimmenanteile'

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

  const barData = {
    labels: results.map(d => d.partei),
    datasets: [{
        label: "Bundestagswahl 2021",
        data: results.map(d => d.anteil_2021),
        backgroundColor: results.map(d => colorMap_2021[d.partei])

      }, {
      label: "Bundestagswahl 2017",
      data: results.map(d => d.anteil_2017),
      backgroundColor: results.map(d => colorMap_2017[d.partei])

},
    ]
  };
  return (
    <Bar  data={barData} options={options} />
  )
}



export function ChartPartyErststimme({ region }: RegionProps): JSX.Element {
  const [results, setResults] = useState<stimmeanteil[]>([]);
  useEffect(() => {
    getResults(region.id).then(ds => {
      const sonstiges_2021 = ds.filter((d) => parteien.indexOf(d.kurzbezeichnung) == - 1).reduce((sum, current) => sum + ( current.erststimmen_prozent_2021 || 0), 0)
      const sonstiges_2017= ds.filter((d) => parteien.indexOf(d.kurzbezeichnung) == - 1).reduce((sum, current) => sum + ( current.erststimmen_prozent_2017 || 0), 0)
      const newResults = ds.filter((d) => parteien.indexOf(d.kurzbezeichnung) > - 1).map((d) =>{
        return {partei: d.kurzbezeichnung , anteil_2021: d.erststimmen_prozent_2021 || 0, anteil_2017: d.erststimmen_prozent_2017 || 0}
      })
      newResults.push({partei:'sonstiges', anteil_2021: sonstiges_2021, anteil_2017: sonstiges_2017})
      setResults(newResults)
    })
  }, [region])
  const title = 'Erststimmenanteile'

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

  const barData = {
    labels: results.map(d => d.partei),
    datasets: [{
      label: "Bundestagswahl 2021",
      data: results.map(d => d.anteil_2021),
      backgroundColor: results.map(d => colorMap_2021[d.partei])

    }, {
      label: "Bundestagswahl 2017",
      data: results.map(d => d.anteil_2017),
      backgroundColor: results.map(d => colorMap_2017[d.partei])

    },
    ]
  };
  return (
    <Bar data={barData} options={options} />
  )
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
        <strong>Wahlbeteiligung:</strong> {regionSummary?.wahlbeteiligung}%
      </Col>
      <Col>
        <strong>Gewinner:</strong> {regionSummary?.gewinner} ({regionSummary?.sieger_partei})
      </Col>

    </Row>
  );
}


export default function RegionView(): JSX.Element {


  const [statesAndRegions, setStates] = useState<State[]>([]);
  const [state, setState] = useState<State | undefined>();
  const [region, setRegion] = useState<Region | undefined >();

  const [value, setValue] = useState('1');

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  useEffect(() => {
    getStatesAndRegions().then((ss) => setStates(ss))

  }, [])

  const handleStateChange = (e: SelectChangeEvent<number>) => {
    const newState = statesAndRegions.find((s) => s.id == e.target.value )
    setState(newState)

  }

  const handleRegionChange = (e: SelectChangeEvent<number>) => {

    const newRegion =state?.wahlkreise.find((r) => r.id == e.target.value )

    setRegion(newRegion)
    console.log(newRegion)
  }

  return (
    <>
      <div style={{alignContent: 'center', justifyContent: 'center', paddingTop: "50px", paddingBottom: "50px",  display: "flex"}}>
        <Typography
          fontWeight='600'
          color = '#343a40'
          variant='h3'
          component='h3'
        >
          Wahlkreisübersicht
        </Typography>
      </div>
        <div style={{  justifyContent: 'start', paddingRight: ' 25px', paddingTop: "5px", paddingBottom: "40px", display: "flex"}}>
            <FormControl  variant = 'filled'  sx={{ width: 250 ,  margin: 4 }}>
              <InputLabel id="demo-simple-select-label">Bundesland...</InputLabel>
              <Select
                value= {state?.id || 0 }
                label="Bundesland"
                onChange={handleStateChange}
                type='number'
              >

                {statesAndRegions.map((s) =>
                  <MenuItem value={s.id} key={s.id}>{s.name}</MenuItem>
                )}
              </Select>
            </FormControl>
            {state && <FormControl variant='filled' sx={{ width: 250, margin: 4 }} >
                <InputLabel id="demo-simple-select-label">Wahlkreis...</InputLabel>
                <Select
                    value={region?.id || 0}
                    label="Wahlkreis"
                    onChange={handleRegionChange}
                    type='number'
                >

                  {state.wahlkreise.map(r =>
                    <MenuItem value={r.id} key={r.id}>{r.name}</MenuItem>
                  )}
                </Select>
            </FormControl>
            }

        </div>
      <TabContext value={value}>

      <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
        <Tabs value={value} onChange={handleChange} centered>
          <Tab label="Übersicht" value="0"/>
          <Tab label="Erststimmenanteile" value="1"/>
          <Tab label="Zweitstimmenanteile" value = "2"/>
          <Tab label="Ergebnistabelle" value = "3"/>
        </Tabs>
      </Box>
        <TabPanel value="0">

        <div style={{  justifyContent: 'center', alignContent: "center",  paddingBottom: "40px",  display: "flex"}}>
          {region && <RegionSummaryView region={region} />}

        </div>
        </TabPanel>

        <TabPanel value="1">
          {region &&
          <div style={ {width: "1000px", height: "600px", justifyContent: 'center',  display: "flex"}}>
              <ChartPartyErststimme region={region}/>
          </div>
          }
        </TabPanel>
        <TabPanel value="2">
          <div style={ {width: "1000px", height: "600px", justifyContent: 'center',  display: "flex"}} >
            {region &&

            <ChartPartyZweitstimme region={region}/>
            }
          </div>
        </TabPanel>
        <TabPanel value="3">
          <div style={{  justifyContent: 'center', alignContent: "center",  display: "flex"}}>
            {region && <PerPartyResults region={region} />}
          </div>
        </TabPanel>
      </TabContext>

    </>
  );
}
