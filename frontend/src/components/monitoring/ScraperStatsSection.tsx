import React from 'react';

const ScraperStatsSection: React.FC<{ scraperStats: any }> = ({ scraperStats }) => (
  <div>
    <h2>Scraper Stats</h2>
    <ul>
      <li><b>Total Comments:</b> {scraperStats.data?.totalComments}</li>
      <li><b>Total Posts:</b> {scraperStats.data?.totalPosts}</li>
      <li><b>Total Pages:</b> {scraperStats.data?.totalPages}</li>
    </ul>
    <h3>Comments Per Page</h3>
    <table className="table table-striped">
      <thead><tr><th>Page ID</th><th>Comments</th></tr></thead>
      <tbody>
        {scraperStats.data?.commentsPerPage?.map((row: any) => (
          <tr key={row._id}><td>{row._id}</td><td>{row.count}</td></tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default ScraperStatsSection;
