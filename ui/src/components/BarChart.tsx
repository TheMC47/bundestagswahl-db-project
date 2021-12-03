import React, { useEffect, useRef, RefObject, Component } from 'react';
import * as d3 from 'd3';
import { ElectionResult } from '../App';
import {select} from 'd3-selection'

interface BarChartProps {
  data : ElectionResult[],
 title: string
}

export default function BarChart(props: BarChartProps){
  const ref = useRef<SVGSVGElement | null> (null);
  const width = 1000 ;
  const height = 600;
  const margin = {
    top: 60,
    bottom: 100,
    left: 80,
    right: 40
};



  useEffect(() => {
    drawChart()
  }, [])

  function drawChart() {
    const svg = d3.select('body').append('svg').attr('width', width).attr('height', height)

    const chart = svg.append('g')
    .classed('display', true)
    .attr('transform', `translate(${margin.left},${margin.top})`);

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom

    const bars =chart.selectAll('rect')
    .data(props.data)
    .enter()
    .append('rect')

    const xScale = d3
    .scaleBand()
    .range([0, chartWidth])
    .domain(props.data.map((s) => s.candidate))
    .padding(0.2);

  const yScale = d3.scaleLinear().range([chartHeight, 0]).domain([0, 100]);

  const xAxis = d3.axisBottom(xScale);
  chart.append('g').classed('x axis', true)
  .attr('transform', `translate(0,${chartHeight})`)
  .call(xAxis);

  const yAxis = d3.axisLeft(yScale)
    .ticks(10)


chart.append('g')
    .classed('y axis', true)
    .attr('transform', 'translate(0,0)')
    .call(yAxis);



    bars
    .attr('x', (d) => xScale(d.candidate) || null)
    .attr('y', (d: ElectionResult) => yScale(d.value))
    .attr('width', xScale.bandwidth())
    .attr('height', (d) => chartHeight- yScale(d.value))
    .attr('fill', (d) => d.color)
    .on('mouseenter', function (actual, i) {
      d3.selectAll('.value').attr('opacity', 0);

      d3.select(this).transition().duration(300).attr('opacity', 0.6);

      const y = yScale(actual.value);

      bars
        .append('text')
        .attr('class', 'divergence')
        .attr('x', (d) => width / 2 )
        .attr('y', (a) => 15 )
        .attr('fill', 'red')
        .attr('text-anchor', 'middle')
        .text((a, idx) => {
          console.log(a == i ? a.value : '');
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
    .attr('x', width / 2 )
    .attr('y', 15)
    .attr('text-anchor', 'middle')
    .text(props.title);
  }



  return (
    <div className="chart">
        <svg ref = {ref}/>
    </div>

)

}


