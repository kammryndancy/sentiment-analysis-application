import React from 'react';
import * as d3 from 'd3';

export interface CommentOverTimeDatum {
  _id: { year: number; month: number; day: number };
  count: number;
}

interface CommentsOverTimeChartProps {
  processedCommentsOverTime?: CommentOverTimeDatum[];
  processedPostsOverTime?: CommentOverTimeDatum[];
}

const CommentsOverTimeChart: React.FC<CommentsOverTimeChartProps> = ({ processedCommentsOverTime = [], processedPostsOverTime = [] }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if ((!processedCommentsOverTime || processedCommentsOverTime.length === 0) && (!processedPostsOverTime || processedPostsOverTime.length === 0)) return;
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

    function formatData(data: CommentOverTimeDatum[] = []) {
      return (data || []).map((d: CommentOverTimeDatum) => ({
        date: new Date(d._id.year, d._id.month - 1, d._id.day),
        count: d.count
      }));
    }

    const processedCommentData = formatData(processedCommentsOverTime);
    const processedPostData = formatData(processedPostsOverTime);

    // Merge all dates
    const allDates = Array.from(new Set([
      ...processedCommentData.map(d => d.date.getTime()),
      ...processedPostData.map(d => d.date.getTime())
    ])).map(t => new Date(t));
    allDates.sort((a, b) => a.getTime() - b.getTime());

    const x = d3
      .scaleTime()
      .domain(d3.extent(allDates) as [Date, Date])
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max([
          d3.max(processedCommentData, d => d.count) || 1,
          d3.max(processedPostData, d => d.count) || 1
        ]) || 1
      ])
      .range([height, 0]);

    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(10).tickFormat(d3.timeFormat('%b %d, %Y')))
      .selectAll('text')
      .attr('transform', 'rotate(-40)')
      .style('text-anchor', 'end');

    svg.append('g').call(d3.axisLeft(y));

    // Draw lines for each dataset
    svg
      .append('path')
      .datum(processedCommentData)
      .attr('fill', 'none')
      .attr('stroke', '#2ecc40')
      .attr('stroke-width', 2)
      .attr('d', d3
        .line<{ date: Date; count: number }>()
        .x((d: { date: Date; count: number }) => x(d.date))
        .y((d: { date: Date; count: number }) => y(d.count))
      );
    svg
      .append('path')
      .datum(processedPostData)
      .attr('fill', 'none')
      .attr('stroke', '#ff851b')
      .attr('stroke-width', 2)
      .attr('d', d3
        .line<{ date: Date; count: number }>()
        .x((d: { date: Date; count: number }) => x(d.date))
        .y((d: { date: Date; count: number }) => y(d.count))
      );

    // Draw dots for each dataset
    svg
      .selectAll('dot-processed-comment')
      .data(processedCommentData)
      .enter()
      .append('circle')
      .attr('cx', (d: { date: Date; count: number }) => x(d.date))
      .attr('cy', (d: { date: Date; count: number }) => y(d.count))
      .attr('r', 4)
      .attr('fill', '#2ecc40');

    svg
      .selectAll('dot-processed-post')
      .data(processedPostData)
      .enter()
      .append('circle')
      .attr('cx', (d: { date: Date; count: number }) => x(d.date))
      .attr('cy', (d: { date: Date; count: number }) => y(d.count))
      .attr('r', 4)
      .attr('fill', '#ff851b');

    // Add legend
    const legendData = [
      { label: 'Processed Comments', color: '#2ecc40' },
      { label: 'Processed Posts', color: '#ff851b' }
    ];
    const legend = svg.append('g').attr('transform', `translate(0, -10)`);
    legendData.forEach((item, i) => {
      legend
        .append('rect')
        .attr('x', i * 180)
        .attr('y', 0)
        .attr('width', 16)
        .attr('height', 8)
        .attr('fill', item.color);
      legend
        .append('text')
        .attr('x', i * 180 + 22)
        .attr('y', 8)
        .text(item.label)
        .style('font-size', '13px')
        .attr('alignment-baseline', 'middle');
    });
  }, [processedCommentsOverTime, processedPostsOverTime]);

  return <div ref={ref}></div>;
};

export default CommentsOverTimeChart;
