import { useEffect, useState } from 'react'
import { Deputy } from '../../models'
import { getDeputies } from '../../api'
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

export default function Abgeordnete(): JSX.Element {
  const [deputies, setDeputies] = useState<Deputy[]>([])
  const [parties, setParties] = useState<string[]>([])
  const [party, setParty] = useState<string | undefined>(undefined)

  useEffect(() => {
    getDeputies().then(ds => {
      setDeputies(ds)
      setParties(
        ds
          .map(d => d.partei_kurzbezeichnung)
          .filter(function (elem, index, self) {
            return index === self.indexOf(elem)
          })
          .sort()
      )
    })
  }, [])

  const handlePartyChange = (e: SelectChangeEvent) => {
    console.log(e.target.value as string)
    setParty(e.target.value as string)
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
          Gewählte Abgeordnete
        </Typography>
      </div>
      <Grid container spacing={50} direction='row' justifyContent='center'>
        <Grid item xs={5}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align='center'>Name</TableCell>
                  {!party && <TableCell align='center'>Partei</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {!party &&
                  deputies.map((row, index) => (
                    <TableRow
                      key={index}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell align='center'>{row.name}</TableCell>
                      <TableCell align='center'>
                        {row.partei_kurzbezeichnung}
                      </TableCell>
                    </TableRow>
                  ))}
                {party &&
                  deputies
                    .filter(d => d.partei_kurzbezeichnung == party)
                    .map((row, index) => (
                      <TableRow
                        key={index}
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                        }}
                      >
                        <TableCell align='center'>{row.name}</TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid item xs={4}>
          <div
            style={{
              justifyContent: 'end',
              paddingRight: ' 25px',
              paddingTop: '5px',
              paddingBottom: '40px',
              display: 'flex',
            }}
          >
            <FormControl variant='filled' sx={{ width: 250, margin: 4 }}>
              <InputLabel id='demo-simple-select-label'>Partei</InputLabel>
              <Select value={party} label='Partei' onChange={handlePartyChange}>
                {parties.map((p, index) => (
                  <MenuItem value={p} key={index}>
                    {p}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </Grid>
      </Grid>
    </>
  )
}
