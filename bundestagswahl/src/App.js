import React, { useEffect, useState } from 'react';
import './App.css';
import ResultBarChart from './components/ResultBarChart';
import { scaleBand, scaleLinear } from 'd3-scale';
import { transition } from 'd3-transition';
import * as d3 from 'd3'
import ProppTypes from "prop-types";


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
},
];




function App() {
  const [data, setData] = useState([sample]);

  return (
      <div className="App">
          <h2>Graphs with React</h2>
          <ResultBarChart data = {data}/>
      </div>
  );
}

export default App;
