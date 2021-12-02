import { useState } from 'react';
import './App.css';
import ResultBarChart from './components/ResultBarChart';

export interface ElectionResult {
  candidate: string,
  value: number,
  color: string
}

export interface ElectionResults {
  data: ElectionResult[]
}


const sample = [{
  candidate: 'AFD',
  value: 25,
  color: '#000000'
},
{
  candidate: 'SPD',
  value: 30,
  color: '#00a2ee'
},
{
  candidate: 'Grüne',
  value: 40,
  color: '#fbcb39'
}];




function App(): JSX.Element {
  const [data, _setData] = useState<ElectionResult[]>(sample);

  return (
    <div className="App">
      <h2>Ergebnisse</h2>
      <ResultBarChart/>
    </div>
  );
}

export default App;
