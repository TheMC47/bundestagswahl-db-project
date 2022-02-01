import { useEffect, useState } from 'react'
import { Ueberhangsmandate } from '../../models'
import { getUeberhangsmandate } from '../../api'
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

export default function UeberhangsmandateView(): JSX.Element {
  const [data, setData] = useState<Ueberhangsmandate[]>([])
  const [year, setYear] = useState<number>(1)

  useEffect(() => {
    getUeberhangsmandate(year).then(d => setData(d))
  }, [year])

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
          Überhangsmandate
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
            <TableCell>Partei</TableCell>
            <TableCell>Bundesland</TableCell>
            <TableCell>Überhangmandate</TableCell>
          </TableHead>
          <TableBody>
            {data.map((d, index) => (
              <TableRow key={index}>
                <TableCell>{d.partei}</TableCell>
                <TableCell>{d.land}</TableCell>
                <TableCell>{d.ueberhange}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
