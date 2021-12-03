import React, { useEffect, useRef, RefObject, Component } from 'react';
import * as d3 from 'd3';
import { ElectionResult } from '../App';



class ResultBarChart extends Component {
  ref: RefObject<HTMLDivElement>;
  data: ElectionResult[];
  title: string;

  constructor(props: IResultBarChartProps) {
    super(props);
    this.state = {};
    this.ref = React.createRef();
    this.data = [
      {
        candidate: 'AFD',
        value: 25,
        color: '#000000',
      },
      {
        candidate: 'SPD',
        value: 30,
        color: '#00a2ee',
      },
      {
        candidate: 'Grüne',
        value: 40,
        color: '#fbcb39',
      },
      {
        candidate: 'FDP',
        value: 50,
        color: '#ff0000',
      },
    ];
    this.title = 'Erstimmenanteil';
  }

  componentDidMount() {
    this.drawChart();
  }

  drawChart() {
    const size = 500;
    const margin = 60;
    const svgContainer = d3.select('#container');
    const width = 800 - 2 * margin;
    const height = 800 - 2 * margin;
    const svg = d3
      .select(this.ref.current)
      .append('svg')
      .attr('width', width )
      .attr('height', height + 2 * margin);
    const rectwidth = 60;

    const xScale = d3
      .scaleBand()
      .range([0, width])
      .domain(this.data.map((s) => s.candidate))
      .padding(0.1);

    const yScale = d3.scaleLinear().range([height, 0]).domain([0, 100]);

    svg
      .append('g')
      .attr('transform', `translate(0, ${height + margin})`)
      .call(d3.axisBottom(xScale));

    svg
      .append('g')
      .attr('transform', `translate(0, ${margin })`)
      .call(d3.axisLeft(yScale));

    const barGroups = svg.selectAll().data(this.data).enter().append('g');
    barGroups
      .append('rect')
      .attr('x', (d) => xScale(d.candidate) || null)
      .attr('y', (d: ElectionResult) => d.value)
      .attr('width', xScale.bandwidth())
      .attr('height', (d) => height + margin - d.value)
      .attr('fill', (d) => d.color)
      .on('mouseenter', function (actual, i) {
        d3.selectAll('.value').attr('opacity', 0);

        d3.select(this).transition().duration(300).attr('opacity', 0.6);

        const y = yScale(actual.value);

        barGroups
          .append('text')
          .attr('class', 'divergence')
          .attr('x', (d) => xScale(d.candidate) || 0 + 2 * xScale.bandwidth()  )
          .attr('y', (a) => yScale(a.value))
          .attr('fill', 'black')
          .attr('text-anchor', 'middle')
          .text((a, idx) => {
            return a == i ? a.value : '';
          });
      })
      .on('mouseleave', function () {
        d3.selectAll('.value').attr('opacity', 1);

        d3.select(this).transition().duration(300).attr('opacity', 1);

        svg.selectAll('#limit').remove();
        svg.selectAll('.divergence').remove();
      });

    svg
      .append('text')
      .attr('class', 'title')
      .attr('x', width / 2 + margin)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .text(this.title);
  }

  render() {
    return <div className="ResultBarChart" ref={this.ref} />;
  }
}

interface IResultBarChartProps {
  data: ElectionResult[];
}

export default ResultBarChart;
