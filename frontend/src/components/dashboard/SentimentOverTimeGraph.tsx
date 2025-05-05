import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface SentimentOverTimeGraphProps {
  data: Array<{ date: string, sentiment: number }>;
  label: string;
}

const SentimentOverTimeGraph: React.FC<SentimentOverTimeGraphProps> = ({ data, label }) => {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data || data.length === 0) return;
    const margin = { top: 30, right: 30, bottom: 40, left: 50 };
    const width = 1000 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Clear previous render
    d3.select(ref.current).selectAll('*').remove();

    // Parse dates
    const parseDate = d3.timeParse('%Y-%m-%d');
    const formattedData = data.map(d => ({ ...d, date: parseDate(d.date) as Date }));

    // Scales
    const x = d3.scaleTime()
      .domain(d3.extent(formattedData, d => d.date) as [Date, Date])
      .range([0, width]);
    const y = d3.scaleLinear()
      .domain([
        d3.min(formattedData, d => d.sentiment)! < 0 ? d3.min(formattedData, d => d.sentiment)! : 0,
        d3.max(formattedData, d => d.sentiment)! > 0 ? d3.max(formattedData, d => d.sentiment)! : 0
      ])
      .nice()
      .range([height, 0]);

    const svg = d3.select(ref.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat((domainValue, i) => {
        if (domainValue instanceof Date) {
          return d3.timeFormat('%b %d')(domainValue);
        }
        return '';
      }))
      .selectAll('text')
      .style('fill', '#aaa');

    // Y axis
    svg.append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .style('fill', '#aaa');

    // Line
    svg.append('path')
      .datum(formattedData)
      .attr('fill', 'none')
      .attr('stroke', '#8ff0a4')
      .attr('stroke-width', 2.5)
      .attr('d', d3.line<any>()
        .x(d => x(d.date))
        .y(d => y(d.sentiment))
      );

    // Dots
    svg.selectAll('circle')
      .data(formattedData)
      .enter()
      .append('circle')
      .attr('cx', d => x(d.date))
      .attr('cy', d => y(d.sentiment))
      .attr('r', 4)
      .attr('fill', '#4cbb6c')
      .attr('stroke', '#222');

    // Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#8ff0a4')
      .attr('font-size', 16)
      .text(`${label} Sentiment Scores`);
  }, [data, label]);

  return (
    <div className="sentiment-over-time-graph">
      <svg ref={ref} style={{ width: '100%', height: 300, background: '#1c271c', borderRadius: 10 }} />
    </div>
  );
};

export default SentimentOverTimeGraph;
