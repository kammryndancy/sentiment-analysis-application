import React from 'react';

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
  <div>
    <h3>Start Post Processing</h3>
    <form style={{ marginBottom: 10 }} onSubmit={e => { e.preventDefault(); handleProcessPosts(); }}>
      <div style={{ marginBottom: 8 }}>
        <label><b>Batch Size:</b> <input type="number" min={1} value={postBatchSize} onChange={e => setPostBatchSize(Number(e.target.value))} disabled={postProcessingLoading} /></label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label><b>Start Date:</b> <input type="date" value={postStartDate} onChange={e => setPostStartDate(e.target.value)} disabled={postProcessingLoading} /></label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label><b>End Date:</b> <input type="date" value={postEndDate} onChange={e => setPostEndDate(e.target.value)} disabled={postProcessingLoading} /></label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label><input type="checkbox" checked={postRemoveStopwords} onChange={e => setPostRemoveStopwords(e.target.checked)} disabled={postProcessingLoading} /> Remove Stopwords</label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label><input type="checkbox" checked={postPerformLemmatization} onChange={e => setPostPerformLemmatization(e.target.checked)} disabled={postProcessingLoading} /> Perform Lemmatization</label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label><input type="checkbox" checked={postAnonymizePII} onChange={e => setPostAnonymizePII(e.target.checked)} disabled={postProcessingLoading} /> Anonymize PII</label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label><input type="checkbox" checked={postAnonymizeUsernames} onChange={e => setPostAnonymizeUsernames(e.target.checked)} disabled={postProcessingLoading} /> Anonymize Usernames</label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label><input type="checkbox" checked={postAnalyzeSentiment} onChange={e => setPostAnalyzeSentiment(e.target.checked)} disabled={postProcessingLoading} /> Analyze Sentiment</label>
      </div>
      <button type="submit" disabled={postProcessingLoading} style={{ marginBottom: 10 }}>
        {postProcessingLoading ? 'Processing...' : 'Start Post Processing'}
      </button>
    </form>
    {postProcessingResult && <div style={{ color: postProcessingResult.startsWith('Error') ? 'red' : 'green' }}>{postProcessingResult}</div>}
  </div>
);

export default PostProcessingSection;
