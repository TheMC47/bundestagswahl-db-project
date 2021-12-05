import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { ElectionResult } from '../App';


ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
  data: ElectionResult[],
  title: string,
  label: string
}

const colorMap: Record<string, string> = {
  'CDU': '#004B76',
  'SPD': '#C0003D',
  'AfD': '#80CDEC',
  'FDP': '#F7BC3D',
  'DIE LINKE': '#5F316E',
  'GRÜNE': '#008549',
  'CSU': '#0076B6'
}

function getData(data: ElectionResult[], label: string) {
  return {
    labels: data.map(d => d.kurzbezeichnung),
    datasets: [
      {
        label: label,
        data: data.map(d => d.sitze),
        backgroundColor: data.map(d => colorMap[d.kurzbezeichnung]),

      },
    ],
    hoverOffset: 2
  };

}

function getOptions(title: string) {
  return {
    rotation: -90,
    circumference: 180,
    tooltip: {
      enabled: false
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
}

export default function SeatDistributionChart(props: PieChartProps): JSX.Element {
  return (
    <Doughnut data={getData(props.data, props.label)} options={getOptions(props.title)} />
  )
}

