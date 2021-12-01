import React, { useEffect, useRef } from 'react';
import { select } from 'd3';
import { ElectionResults } from '../App';

/* export const useD3 = (renderChartFn, dependencies) => {
*   const ref = React.useRef();
*
*   React.useEffect(() => {
*     renderChartFn(d3.select(ref.current));
*     return () => { };
*   }, dependencies);
*   return ref;
* } */

function ResultBarChart({ data }: ElectionResults): JSX.Element {
  /* const ref = useD3(
*   (svg) => {
*     const height = 500;
*     const width = 500;
*     const margin = { top: 20, right: 30, bottom: 30, left: 40 };

*     const x = d3
*       .scaleBand()
*       .domain(data.map((d) => d.candidate))
*       .rangeRound([margin.left, width - margin.right])
*       .padding(0.1);

*     const y1 = d3
*       .scaleLinear()
*       .domain([0, d3.max(data, (d) => d.value)])
*       .rangeRound([height - margin.bottom, margin.top]);

*     const xAxis = (g) =>
*       g.attr('transform', `translate(0,${height - margin.bottom})`).call(
*         d3
*           .axisBottom(x)
*           .tickValues(
*             d3
*               .ticks(...d3.extent(x.domain()), width / 40)
*               .filter((v) => x(v) !== undefined)
*           )
*           .tickSizeOuter(0)
*       );

*     const y1Axis = (g) =>
*       g
*         .attr('transform', `translate(${margin.left},0)`)
*         .style('color', 'steelblue')
*         .call(d3.axisLeft(y1).ticks(null, 's'))
*         .call((g) => g.select('.domain').remove())
*         .call((g) =>
*           g
*             .append('text')
*             .attr('x', -margin.left)
*             .attr('y', 10)
*             .attr('fill', 'currentColor')
*             .attr('text-anchor', 'start')
*             .text(data.y1)
*         );

*     svg.select('.x-axis').call(xAxis);
*     svg.select('.y-axis').call(y1Axis);

*     svg
*       .select('.plot-area')
*       .attr('fill', 'steelblue')
*       .selectAll('.bar')
*       .data(data)
*       .join('rect')
*       .attr('class', 'bar')
*       .attr('x', (d) => x(d.candidate))
*       .attr('width', x.bandwidth())
*       .attr('y', (d) => y1(d.value))
*       .attr('height', (d) => y1(0) - y1(d.value));
*   },
*   [data.length]
* ); */

  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    console.log(data)

    const svg = select(ref.current)
    const height = 500;
    const width = 500;
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };

    /* const x = d3
*   .scaleBand()
*   .domain(data.map((d) => d.candidate))
*   .rangeRound([margin.left, width - margin.right])
*   .padding(0.1);

* const y1 = d3
*   .scaleLinear()
*   .domain([0, 100])
*   .rangeRound([height - margin.bottom, margin.top]); */

    /* const xAxis = (g) =>
* g.attr('transform', `translate(0,${height - margin.bottom})`).call(
*   d3
*     .axisBottom(x)
*     .tickValues(
*       ticks(...d3.extent(x.domain()), width / 40)
*         .filter((v) => x(v) !== undefined)
*     )
*     .tickSizeOuter(0)
* );
*/
    /* const y1Axis = (g) =>
*   g
*     .attr('transform', `translate(${margin.left},0)`)
*     .style('color', 'steelblue')
*     .call(d3.axisLeft(y1).ticks(null, 's'))
*     .call((g) => g.select('.domain').remove())
*     .call((g) =>
*       g
*         .append('text')
*         .attr('x', -margin.left)
*         .attr('y', 10)
*         .attr('fill', 'currentColor')
*         .attr('text-anchor', 'start')
*         .text(data.y1)
*     );

* svg.select('.x-axis').call(xAxis);
* svg.select('.y-axis').call(y1Axis); */

    svg
      .selectAll('.bar')
      .data(data)
      .join('rect')
      /* .attr('class', 'bar') */
      .attr('x', (d, i) => i*30)
      .attr('width', 30)
      .attr('y', (d, _) => d.value)
    /* .attr('height', (d) => y1(0) - y1(d.value)); */
  })

  return (
    <svg
      ref={ref}
      style={{
        height: 500,
        width: '100%',
        marginRight: '0px',
        marginLeft: '0px',
      }}
    >
    </svg>
  );
}

export default ResultBarChart;
