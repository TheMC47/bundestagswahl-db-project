import { useEffect, useState } from 'react';
import './App.css';
import SeatDistributionChart from './components/SeatDistribution';

import { getSitzVerteilung } from './api'

export interface ElectionResult {
  kurzbezeichnung: string;
  sitze: number;
  wahl: number;
}

function App(): JSX.Element {
  const [data, setData] = useState<ElectionResult[]>([]);

  useEffect(() => {
    getSitzVerteilung(2021).then(d => setData(d))
  }, [])

  return (
    <div className="App">
      <h2>Ergebnisse</h2>
      <div style={{
        maxWidth: '700px',
        margin: '0 auto'
      }}>
        <SeatDistributionChart data={data} title='X' label='yy' />
      </div>

    </div>
  );
}

export default App;
