import React from 'react';
import * as d3 from 'd3';

export interface CommentOverTimeDatum {
  _id: { year: number; month: number; day: number };
  count: number;
}

const CommentsOverTimeChart: React.FC<{ data: CommentOverTimeDatum[] }> = ({ data }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!data || data.length === 0) return;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    d3.select(ref.current).selectAll('*').remove();

    const svg = d3
      .select(ref.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const formattedData = data.map((d: CommentOverTimeDatum) => ({
      date: new Date(d._id.year, d._id.month - 1, d._id.day),
      count: d.count
    }));

    const x = d3
      .scaleTime()
      .domain(d3.extent(formattedData, (d: { date: Date; count: number }) => d.date) as [Date, Date])
      .range([0, width]);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(formattedData, (d: { date: Date; count: number }) => d.count) || 1])
      .range([height, 0]);

    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(10).tickFormat(d3.timeFormat('%b %d, %Y')))
      .selectAll('text')
      .attr('transform', 'rotate(-40)')
      .style('text-anchor', 'end');

    svg.append('g').call(d3.axisLeft(y));

    svg
      .append('path')
      .datum(formattedData)
      .attr('fill', 'none')
      .attr('stroke', '#0074d9')
      .attr('stroke-width', 2)
      .attr('d', d3
        .line<{ date: Date; count: number }>()
        .x((d: { date: Date; count: number }) => x(d.date))
        .y((d: { date: Date; count: number }) => y(d.count))
      );

    svg
      .selectAll('dot')
      .data(formattedData)
      .enter()
      .append('circle')
      .attr('cx', (d: { date: Date; count: number }) => x(d.date))
      .attr('cy', (d: { date: Date; count: number }) => y(d.count))
      .attr('r', 4)
      .attr('fill', '#0074d9');
  }, [data]);

  return <div ref={ref}></div>;
};

export default CommentsOverTimeChart;
