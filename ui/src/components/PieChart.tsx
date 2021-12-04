import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import styled from '@emotion/styled';
import { ElectionResult } from '../App';


ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
  data: ElectionResult[],
  title: string,
  label: string
}

function getData(data: ElectionResult[], label: string) {
  return {
    labels: data.map(d => d.candidate),
    datasets: [
      {
        label: label,
        data: data.map(d => d.value),
        backgroundColor: data.map(d => d.color),

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




const ChartWrapper = styled.div`
  max-width: 700px;
  margin: 0 auto;
`;


export default function PieChart(props: PieChartProps): JSX.Element {
  return (
    <ChartWrapper>
      <Doughnut data={getData(props.data, props.label)} options={getOptions(props.title)} />
    </ChartWrapper>
  )
}

