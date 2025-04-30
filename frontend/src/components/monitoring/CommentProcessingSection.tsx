import React from 'react';

interface Props {
  batchSize: number;
  setBatchSize: (n: number) => void;
  startDate: string;
  setStartDate: (s: string) => void;
  endDate: string;
  setEndDate: (s: string) => void;
  removeStopwords: boolean;
  setRemoveStopwords: (b: boolean) => void;
  performLemmatization: boolean;
  setPerformLemmatization: (b: boolean) => void;
  anonymizePII: boolean;
  setAnonymizePII: (b: boolean) => void;
  anonymizeUsernames: boolean;
  setAnonymizeUsernames: (b: boolean) => void;
  analyzeSentiment: boolean;
  setAnalyzeSentiment: (b: boolean) => void;
  processingLoading: boolean;
  processingResult: string;
  handleProcessComments: () => void;
}

const CommentProcessingSection: React.FC<Props> = ({
  batchSize, setBatchSize, startDate, setStartDate, endDate, setEndDate,
  removeStopwords, setRemoveStopwords, performLemmatization, setPerformLemmatization,
  anonymizePII, setAnonymizePII, anonymizeUsernames, setAnonymizeUsernames,
  analyzeSentiment, setAnalyzeSentiment, processingLoading, processingResult, handleProcessComments
}) => (
  <div>
    <h3>Start Comment Processing</h3>
    <form style={{ marginBottom: 10 }} onSubmit={e => { e.preventDefault(); handleProcessComments(); }}>
      <div style={{ marginBottom: 8 }}>
        <label><b>Batch Size:</b> <input type="number" min={1} value={batchSize} onChange={e => setBatchSize(Number(e.target.value))} disabled={processingLoading} /></label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label><b>Start Date:</b> <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} disabled={processingLoading} /></label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label><b>End Date:</b> <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={processingLoading} /></label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label><input type="checkbox" checked={removeStopwords} onChange={e => setRemoveStopwords(e.target.checked)} disabled={processingLoading} /> Remove Stopwords</label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label><input type="checkbox" checked={performLemmatization} onChange={e => setPerformLemmatization(e.target.checked)} disabled={processingLoading} /> Perform Lemmatization</label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label><input type="checkbox" checked={anonymizePII} onChange={e => setAnonymizePII(e.target.checked)} disabled={processingLoading} /> Anonymize PII</label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label><input type="checkbox" checked={anonymizeUsernames} onChange={e => setAnonymizeUsernames(e.target.checked)} disabled={processingLoading} /> Anonymize Usernames</label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label><input type="checkbox" checked={analyzeSentiment} onChange={e => setAnalyzeSentiment(e.target.checked)} disabled={processingLoading} /> Analyze Sentiment</label>
      </div>
      <button type="submit" disabled={processingLoading} style={{ marginBottom: 10 }}>
        {processingLoading ? 'Processing...' : 'Start Data Processing'}
      </button>
    </form>
    {processingResult && <div style={{ color: processingResult.startsWith('Error') ? 'red' : 'green' }}>{processingResult}</div>}
  </div>
);

export default CommentProcessingSection;
