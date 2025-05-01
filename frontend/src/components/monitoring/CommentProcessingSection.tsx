import React from 'react';
import './CommentProcessingSection.css';

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
  <div className="commentprocessing-section">
    <h2>Comment Processing</h2>
    <form onSubmit={e => { e.preventDefault(); handleProcessComments(); }} className="form-row">
      <div className="form-label">Batch Size:</div>
      <input type="number" min={1} value={batchSize} onChange={e => setBatchSize(Number(e.target.value))} disabled={processingLoading} className="form-input" />
      <div className="form-label">Start Date:</div>
      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} disabled={processingLoading} className="form-input" />
      <div className="form-label">End Date:</div>
      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={processingLoading} className="form-input" />
      <div className="checkbox-row">
        <div className="form-label">Remove Stopwords:</div>
        <input type="checkbox" checked={removeStopwords} onChange={e => setRemoveStopwords(e.target.checked)} disabled={processingLoading} className="form-input" />
      </div>
      <div className="checkbox-row">
        <div className="form-label">Perform Lemmatization:</div>
        <input type="checkbox" checked={performLemmatization} onChange={e => setPerformLemmatization(e.target.checked)} disabled={processingLoading} className="form-input" />
      </div>
      <div className="checkbox-row">
        <div className="form-label">Anonymize PII:</div>
        <input type="checkbox" checked={anonymizePII} onChange={e => setAnonymizePII(e.target.checked)} disabled={processingLoading} className="form-input" />
      </div>
      <div className="checkbox-row">
        <div className="form-label">Anonymize Usernames:</div>
        <input type="checkbox" checked={anonymizeUsernames} onChange={e => setAnonymizeUsernames(e.target.checked)} disabled={processingLoading} className="form-input" />
      </div>
      <div className="checkbox-row">
        <div className="form-label">Analyze Sentiment:</div>
        <input type="checkbox" checked={analyzeSentiment} onChange={e => setAnalyzeSentiment(e.target.checked)} disabled={processingLoading} className="form-input" />
      </div>
      <button type="submit" disabled={processingLoading} className="form-btn">
        {processingLoading ? 'Processing...' : 'Start Data Processing'}
      </button>
    </form>
    {processingLoading && <div className="processing-status">Processing...</div>}
    {processingResult && <div className="processing-status">{processingResult}</div>}
  </div>
);

export default CommentProcessingSection;
