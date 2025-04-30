import React from 'react';

const DataProcessorStatsSection: React.FC<{ dataProcessorStats: any }> = ({ dataProcessorStats }) => (
  <div>
    <h2>Data Processor Stats</h2>
    <ul>
      {dataProcessorStats.data && Object.entries(dataProcessorStats.data).map(([key, value]) => (
        <li key={key}><b>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</b> {String(value)}</li>
      ))}
    </ul>
  </div>
);

export default DataProcessorStatsSection;
