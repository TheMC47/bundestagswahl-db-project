import { Bar } from 'react-chartjs-2';
import { JoblessnessDistricts, JoblessnessSummary } from '../models';
import { useEffect, useState } from 'react';
import { getDistricts, getJoblessnessAnalysis } from '../api';

import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  BarController,
  BarElement
} from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, BarController, BarElement);


export interface joblessnessAnalysisProps {
  dataLinks: JoblessnessSummary[];
  dataRechts: JoblessnessSummary[];
  districts: JoblessnessDistricts[];
}

export function JoblessnessBarChart(): JSX.Element {
  const [dataLinks, setDataLinks] = useState<JoblessnessSummary[]>([]);
  const [dataRechts, setDataRechts] = useState<JoblessnessSummary[]>([]);
  const [districts, setDistricts] = useState<JoblessnessDistricts[]>([]);

  useEffect(() => {
    getJoblessnessAnalysis('l').then(d => {
      setDataLinks(d)
    })

  }, [])

  useEffect(() => {
    getJoblessnessAnalysis('r').then(d => setDataRechts(d))
  }, [])

  useEffect(() => {
    getDistricts().then(d => setDistricts(d))
  }, [])


  return (
    <JoblessnessAnalysis dataLinks={dataLinks} dataRechts={dataRechts} districts={districts} />
  )
}

export function JoblessnessAnalysis({ dataLinks, dataRechts, districts }: joblessnessAnalysisProps): JSX.Element {
  const title = 'Arbeitslosigkeit Analyse'

  console.log(dataLinks.map(d => d.anzahlstimmen))
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
    labels: districts.map(d => d.land),
    datasets: [
      {
        label: 'Linke',
        data: dataLinks.map(d => d.anzahlstimmen),
        borderColor: '#C0003D',
        backgroundColor: '#C0003D',
      },
      {
        label: 'Rechte',
        data: dataRechts.map(d => d.anzahlstimmen),
        borderColor: '#004B76',
        backgroundColor: '#004B76',
      }
    ]
  };

  return (
    <Bar data={barData} options={options} />
  )

}



