import React, { useEffect, useState } from 'react';
import Sidebar from '../layout/Sidebar';
import Header from '../layout/Header';
import '../../App.css';
import './MonitoringPage.css';
import ScraperStatsSection from './ScraperStatsSection';
import CommentsOverTimeSection from './CommentsOverTimeSection';
import DataProcessorStatsSection from './DataProcessorStatsSection';
import ScraperStatusSection from './ScraperStatusSection';
import CommentProcessingSection from './CommentProcessingSection';
import PostProcessingSection from './PostProcessingSection';
import RunScraperSection from './RunScraperSection';

const MonitoringPage: React.FC = () => {
  const [scraperStats, setScraperStats] = useState<any>(null);
  const [dataProcessorStats, setDataProcessorStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [batchSize, setBatchSize] = useState<number>(100);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [removeStopwords, setRemoveStopwords] = useState<boolean>(true);
  const [performLemmatization, setPerformLemmatization] = useState<boolean>(true);
  const [anonymizePII, setAnonymizePII] = useState<boolean>(true);
  const [anonymizeUsernames, setAnonymizeUsernames] = useState<boolean>(true);
  const [analyzeSentiment, setAnalyzeSentiment] = useState<boolean>(true);
  const [processingLoading, setProcessingLoading] = useState(false);
  const [processingResult, setProcessingResult] = useState<string>('');

  const [postBatchSize, setPostBatchSize] = useState<number>(100);
  const [postStartDate, setPostStartDate] = useState<string>('');
  const [postEndDate, setPostEndDate] = useState<string>('');
  const [postRemoveStopwords, setPostRemoveStopwords] = useState<boolean>(true);
  const [postPerformLemmatization, setPostPerformLemmatization] = useState<boolean>(true);
  const [postAnonymizePII, setPostAnonymizePII] = useState<boolean>(true);
  const [postAnonymizeUsernames, setPostAnonymizeUsernames] = useState<boolean>(true);
  const [postAnalyzeSentiment, setPostAnalyzeSentiment] = useState<boolean>(true);
  const [postProcessingLoading, setPostProcessingLoading] = useState(false);
  const [postProcessingResult, setPostProcessingResult] = useState<string>('');

  const [scraperStatus, setScraperStatus] = useState<any[]>([]);
  const [scraperStatusLoading, setScraperStatusLoading] = useState(false);
  const [scraperStatusError, setScraperStatusError] = useState<string | null>(null);

  const [processedCommentsOverTime, setProcessedCommentsOverTime] = useState<any[]>([]);
  const [processedPostsOverTime, setProcessedPostsOverTime] = useState<any[]>([]);
  const [commentsOverTimeLoading, setCommentsOverTimeLoading] = useState(false);
  const [commentsOverTimeError, setCommentsOverTimeError] = useState<string | null>(null);

  // Scraper run state
  const [scraperRunLoading, setScraperRunLoading] = useState(false);
  const [scraperRunResult, setScraperRunResult] = useState<string>('');
  const [scraperRunPageIds, setScraperRunPageIds] = useState<string>('');
  const [scraperRunDaysBack, setScraperRunDaysBack] = useState<number>(30);

  const handleRunScraper = async () => {
    setScraperRunLoading(true);
    setScraperRunResult('');
    try {
      const body: any = { daysBack: scraperRunDaysBack };
      const res = await fetch('/api/scraper/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setScraperRunResult('Scraper started: ' + data.message);
      } else {
        setScraperRunResult('Error: ' + (data.message || 'Failed to start scraper'));
      }
    } catch (err: any) {
      setScraperRunResult('Error: ' + (err.message || 'Failed to start scraper'));
    }
    setScraperRunLoading(false);
  };

  useEffect(() => {
    const fetchAllStats = async () => {
      setLoading(true);
      setError('');
      setCommentsOverTimeLoading(true);
      setCommentsOverTimeError(null);
      try {
        const [scraperRes, processorRes, scraperStatusRes] = await Promise.all([
          fetch('/api/scraper/stats', { credentials: 'include' }),
          fetch('/api/data-processor/stats', { credentials: 'include' }),
          fetch('/api/scraper/status')
        ]);
        const scraperData = await scraperRes.json();
        const processorData = await processorRes.json();
        const scraperStatusData = await scraperStatusRes.json();
        if (!scraperData.success) throw new Error(scraperData.message || 'Failed to load scraper stats');
        if (!processorData.success) throw new Error(processorData.message || 'Failed to load processor stats');
        if (!scraperStatusData.success) throw new Error(scraperStatusData.message || 'Failed to fetch scraper status');
        setScraperStats(scraperData);
        setDataProcessorStats(processorData.data);
        setScraperStatus(scraperStatusData.data);
        // Processed over time data
        if (scraperData.processedCommentsOverTime && scraperData.processedPostsOverTime) {
          setProcessedCommentsOverTime(scraperData.processedCommentsOverTime);
          setProcessedPostsOverTime(scraperData.processedPostsOverTime);
        } else {
          setCommentsOverTimeError(scraperData.message || 'Failed to fetch processed data over time');
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load stats');
        setCommentsOverTimeError(e.message || 'Failed to fetch processed data over time');
      }
      setLoading(false);
      setCommentsOverTimeLoading(false);
    };
    fetchAllStats();
  }, []);

  const handleProcessComments = async () => {
    setProcessingLoading(true);
    setProcessingResult('');
    try {
      const options = {
        batchSize,
        startDate: startDate || null,
        endDate: endDate || null,
        removeStopwords,
        performLemmatization,
        anonymizePII,
        anonymizeUsernames,
        analyzeSentiment,
      };
      const res = await fetch('/api/data-processor/process-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setProcessingResult('Data processing started successfully.');
      } else {
        setProcessingResult('Error: ' + (data.error || data.message));
      }
    } catch (err: any) {
      setProcessingResult('Error: ' + (err.message || 'Failed to start processing'));
    }
    setProcessingLoading(false);
  };

  const handleProcessPosts = async () => {
    setPostProcessingLoading(true);
    setPostProcessingResult('');
    try {
      const options = {
        batchSize: postBatchSize,
        startDate: postStartDate || null,
        endDate: postEndDate || null,
        removeStopwords: postRemoveStopwords,
        performLemmatization: postPerformLemmatization,
        anonymizePII: postAnonymizePII,
        anonymizeUsernames: postAnonymizeUsernames,
        analyzeSentiment: postAnalyzeSentiment,
      };
      const res = await fetch('/api/data-processor/process-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setPostProcessingResult('Post processing started successfully.');
      } else {
        setPostProcessingResult('Error: ' + (data.error || data.message));
      }
    } catch (err: any) {
      setPostProcessingResult('Error: ' + (err.message || 'Failed to start post processing'));
    }
    setPostProcessingLoading(false);
  };

  return (
    <div className="dashboard-app">
      <Sidebar />
      <div className="main-area">
        <Header title="Monitoring" showSearch={false} showExport={false}/>
        <div className="main-content">
          {loading ? <div className="monitoring-loading">Loading statistics...</div> : error ? <div className="monitoring-error">{error}</div> : (
            <div className="monitoring-grid">
              <div className="monitoring-grid-row">
                <ScraperStatsSection scraperStats={scraperStats} />
                <ScraperStatusSection scraperStatus={scraperStatus} loading={scraperStatusLoading} error={scraperStatusError} />
              </div>
              <div className="monitoring-grid-row">
                <DataProcessorStatsSection dataProcessorStats={dataProcessorStats} />
                <CommentsOverTimeSection 
                  processedCommentsOverTime={processedCommentsOverTime} 
                  processedPostsOverTime={processedPostsOverTime} 
                  loading={commentsOverTimeLoading} 
                  error={commentsOverTimeError} 
                />
              </div>
              <div className="monitoring-grid-row">
                <CommentProcessingSection
                  batchSize={batchSize}
                  setBatchSize={setBatchSize}
                  startDate={startDate}
                  setStartDate={setStartDate}
                  endDate={endDate}
                  setEndDate={setEndDate}
                  removeStopwords={removeStopwords}
                  setRemoveStopwords={setRemoveStopwords}
                  performLemmatization={performLemmatization}
                  setPerformLemmatization={setPerformLemmatization}
                  anonymizePII={anonymizePII}
                  setAnonymizePII={setAnonymizePII}
                  anonymizeUsernames={anonymizeUsernames}
                  setAnonymizeUsernames={setAnonymizeUsernames}
                  analyzeSentiment={analyzeSentiment}
                  setAnalyzeSentiment={setAnalyzeSentiment}
                  processingLoading={processingLoading}
                  processingResult={processingResult}
                  handleProcessComments={handleProcessComments}
                />
                <PostProcessingSection
                  postBatchSize={postBatchSize}
                  setPostBatchSize={setPostBatchSize}
                  postStartDate={postStartDate}
                  setPostStartDate={setPostStartDate}
                  postEndDate={postEndDate}
                  setPostEndDate={setPostEndDate}
                  postRemoveStopwords={postRemoveStopwords}
                  setPostRemoveStopwords={setPostRemoveStopwords}
                  postPerformLemmatization={postPerformLemmatization}
                  setPostPerformLemmatization={setPostPerformLemmatization}
                  postAnonymizePII={postAnonymizePII}
                  setPostAnonymizePII={setPostAnonymizePII}
                  postAnonymizeUsernames={postAnonymizeUsernames}
                  setPostAnonymizeUsernames={setPostAnonymizeUsernames}
                  postAnalyzeSentiment={postAnalyzeSentiment}
                  setPostAnalyzeSentiment={setPostAnalyzeSentiment}
                  postProcessingLoading={postProcessingLoading}
                  postProcessingResult={postProcessingResult}
                  handleProcessPosts={handleProcessPosts}
                />
              </div>
              <div className="monitoring-grid-row">
                <RunScraperSection
                  scraperRunLoading={scraperRunLoading}
                  scraperRunResult={scraperRunResult}
                  scraperRunDaysBack={scraperRunDaysBack}
                  setScraperRunDaysBack={setScraperRunDaysBack}
                  handleRunScraper={handleRunScraper}
                />
                <div />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonitoringPage;
