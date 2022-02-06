import { useEffect, useState } from 'react'
import { Party, TightestWinner } from '../../models'
import { getParties, getTightestWinner } from '../../api'
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

export interface PartyProps {
  party: Party
  year: number
}

export default function TightestWinnerView(): JSX.Element {
  const [party, setParty] = useState<Party | undefined>(undefined)
  const [parties, setParties] = useState<Party[]>([])
  const [year, setYear] = useState<number | undefined>(undefined)

  useState(() => {
    getParties().then(p => setParties(p))
  })

  const handlePartyChange = (e: SelectChangeEvent<number>) => {
    setParty(parties.find(p => p.id == e.target.value))
  }

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
          Top knappste Siege
        </Typography>
      </div>

      <div
        style={{
          justifyContent: 'start',
          paddingRight: ' 25px',
          paddingTop: '5px',
          paddingBottom: '40px',
          display: 'flex',
        }}
      >
        <FormControl sx={{ width: 120, margin: 4 }}>
          <InputLabel id='demo-simple-select-label'>Jahr</InputLabel>
          <Select value={year} label='Jahr' onChange={handleYearChange}>
            <MenuItem value='1'>2021</MenuItem>
            <MenuItem value='2'>2017</MenuItem>
          </Select>
        </FormControl>

        {year && (
          <FormControl sx={{ width: 250, margin: 4 }}>
            <InputLabel id='demo-simple-select-label'>Partei</InputLabel>
            <Select
              value={party?.id || 0}
              label='Partei'
              onChange={handlePartyChange}
              type='number'
            >
              {parties.map(r => (
                <MenuItem value={r.id} key={r.id}>
                  {r.kurzbezeichnung != '' ? r.kurzbezeichnung : r.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </div>
      {year && party && <PerPartyResults party={party} year={year} />}
    </>
  )
}

export function PerPartyResults({ party, year }: PartyProps): JSX.Element {
  const [results, setResults] = useState<TightestWinner[]>([])

  useEffect(() => {
    getTightestWinner(year, party.id).then(ds => {
      setResults(ds)
    })
  }, [party, year])

  return (
    <div
      style={{
        alignContent: 'center',
        justifyContent: 'center',
        paddingRight: '50px',
        paddingTop: '5px',
        paddingBottom: '40px',
        display: 'flex',
      }}
    >
      <Table sx={{ width: 500 }}>
        <TableHead>
          <TableCell> Rank</TableCell>
          <TableCell> Wahlkreise</TableCell>
          <TableCell> Differenz</TableCell>
        </TableHead>
        <TableBody>
          {results.map((d, i) => (
            <TableRow key={i}>
              <TableCell>{d.rank}</TableCell>
              <TableCell>{d.wahlkreis}</TableCell>
              <TableCell>
                <Typography
                  sx={{ color: d.siege ? 'rgb(0,118,0)' : '#cc0000' }}
                >
                  {(d.siege ? '+' : '-') + d.vorsprung}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
