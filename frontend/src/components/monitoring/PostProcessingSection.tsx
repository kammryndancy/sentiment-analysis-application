import React from 'react';
import './PostProcessingSection.css';

interface Props {
  postBatchSize: number;
  setPostBatchSize: (n: number) => void;
  postStartDate: string;
  setPostStartDate: (s: string) => void;
  postEndDate: string;
  setPostEndDate: (s: string) => void;
  postRemoveStopwords: boolean;
  setPostRemoveStopwords: (b: boolean) => void;
  postPerformLemmatization: boolean;
  setPostPerformLemmatization: (b: boolean) => void;
  postAnonymizePII: boolean;
  setPostAnonymizePII: (b: boolean) => void;
  postAnonymizeUsernames: boolean;
  setPostAnonymizeUsernames: (b: boolean) => void;
  postAnalyzeSentiment: boolean;
  setPostAnalyzeSentiment: (b: boolean) => void;
  postProcessingLoading: boolean;
  postProcessingResult: string;
  handleProcessPosts: () => void;
}

const PostProcessingSection: React.FC<Props> = ({
  postBatchSize, setPostBatchSize, postStartDate, setPostStartDate, postEndDate, setPostEndDate,
  postRemoveStopwords, setPostRemoveStopwords, postPerformLemmatization, setPostPerformLemmatization,
  postAnonymizePII, setPostAnonymizePII, postAnonymizeUsernames, setPostAnonymizeUsernames,
  postAnalyzeSentiment, setPostAnalyzeSentiment, postProcessingLoading, postProcessingResult, handleProcessPosts
}) => (
  <div className="postprocessing-section">
    <h2>Post Processing</h2>
    <form onSubmit={e => { e.preventDefault(); handleProcessPosts(); }} className="form-row">
      <div className="form-label">Batch Size:</div>
      <input type="number" min={1} value={postBatchSize} onChange={e => setPostBatchSize(Number(e.target.value))} disabled={postProcessingLoading} className="form-input" />
      <div className="form-label">Start Date:</div>
      <input type="date" value={postStartDate} onChange={e => setPostStartDate(e.target.value)} disabled={postProcessingLoading} className="form-input" />
      <div className="form-label">End Date:</div>
      <input type="date" value={postEndDate} onChange={e => setPostEndDate(e.target.value)} disabled={postProcessingLoading} className="form-input" />
      <div className="checkbox-row">
        <div className="form-label">Remove Stopwords:</div>
        <input type="checkbox" checked={postRemoveStopwords} onChange={e => setPostRemoveStopwords(e.target.checked)} disabled={postProcessingLoading} className="form-input" />
      </div>
      <div className="checkbox-row">
        <div className="form-label">Perform Lemmatization:</div>
        <input type="checkbox" checked={postPerformLemmatization} onChange={e => setPostPerformLemmatization(e.target.checked)} disabled={postProcessingLoading} className="form-input" />
      </div>
      <div className="checkbox-row">
        <div className="form-label">Anonymize PII:</div>
        <input type="checkbox" checked={postAnonymizePII} onChange={e => setPostAnonymizePII(e.target.checked)} disabled={postProcessingLoading} className="form-input" />
      </div>
      <div className="checkbox-row">
        <div className="form-label">Anonymize Usernames:</div>
        <input type="checkbox" checked={postAnonymizeUsernames} onChange={e => setPostAnonymizeUsernames(e.target.checked)} disabled={postProcessingLoading} className="form-input" />
      </div>
      <div className="checkbox-row">
        <div className="form-label">Analyze Sentiment:</div>
        <input type="checkbox" checked={postAnalyzeSentiment} onChange={e => setPostAnalyzeSentiment(e.target.checked)} disabled={postProcessingLoading} className="form-input" />
      </div>
      <button type="submit" disabled={postProcessingLoading} className="form-btn">
        {postProcessingLoading ? 'Processing...' : 'Start Post Processing'}
      </button>
    </form>
    {postProcessingLoading && <div className="processing-status">Processing...</div>}
    {postProcessingResult && <div className={`processing-status ${postProcessingResult.startsWith('Error') ? 'error' : 'success'}`}>{postProcessingResult}</div>}
  </div>
);

export default PostProcessingSection;
