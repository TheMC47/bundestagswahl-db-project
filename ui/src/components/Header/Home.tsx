import { Paper, Stack, } from '@mui/material'
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
