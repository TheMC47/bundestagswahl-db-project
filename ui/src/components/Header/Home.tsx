import { Paper, Stack, Typography, } from '@mui/material'
import re from './assets/f2.svg'


export default function LandingPage(): JSX.Element {
  return (
    <>
      <div
        style={{
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ededed',
          height: '110vh',
        }}
      >
        <div style={{ alignContent: 'center', justifyContent: 'center', display: "flex", height: 520 }}>

          <Typography
            fontWeight='600'
            color='#D3D3D3'
            align='center'
            justifySelf='center'
            variant='h2'
            component='h2'
            sx={{ paddingTop: 20 }}
          >
            Yecine Megdiche
            &
            Maisa Ben Salah
          </Typography>

        </div>


        <div style={{ height: 200 }}>
          <Paper
            elevation={0}
            component={Stack}
            direction='column'
            justifyContent='center'

            style={{
              backgroundColor: '#343a40',
            }}
          >
            <img src={re} style={{ height: 500, }}/>

          </Paper>
        </div>
      </div>
    </>
  )
}
