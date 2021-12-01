import React, { useEffect, useRef, RefObject, Component } from 'react';
import * as d3 from 'd3';
import { ElectionResult } from '../App';



class ResultBarChart extends Component {
  ref: RefObject<HTMLDivElement>
  data: ElectionResult[]
  title: string

  constructor( props: IResultBarChartProps ) {
    super(props)
    this.state = {

    }
    this.ref = React.createRef()
    this.data =
     [{
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
    }]
  this.title = 'Erstimmenanteil'
  }


  componentDidMount() {
      this.drawChart()
  }

  drawChart() {
        const size = 500
        const margin = 80;
        const svg = d3.select(this.ref.current).append('svg').attr('width', size).attr('height', size)
        const rectwidth = 95

        svg.selectAll('rect').data(this.data).enter().append('rect').attr('x', (d,i)=> 5 + i*(rectwidth + 5) )
        .attr('y', (d:ElectionResult) => d.value)
        .attr('width', rectwidth).attr('height', d => d.value)
        .attr('fill', d => d.color)

        svg.append('text')
        .attr('class', 'title')
        .attr('x', size / 2 + margin)
        .attr('y', 15)
        .attr('text-anchor', 'middle')
        .text(this.title)

  }

render()  {
    return (
      <div className="ResultBarChart" ref= {this.ref} />
    );
  }



}

interface IResultBarChartProps {
  data:ElectionResult[]
}



export default ResultBarChart;
