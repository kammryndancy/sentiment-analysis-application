import React, { useEffect, useState } from 'react';
import Sidebar from '../layout/Sidebar';
import Header from '../layout/Header';
import '../../App.css';
import { useContext } from 'react';
import { AuthContext } from '../../auth';

const SettingsPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const isAdmin = auth?.roles?.includes('admin');

  const [credentials, setCredentials] = useState({
    facebook_app_id: '',
    facebook_app_secret: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // --- Google Cloud NLP Key State ---
  const [googleKeyExists, setGoogleKeyExists] = useState<boolean | null>(null);
  const [googleKeyInput, setGoogleKeyInput] = useState('');
  const [googleKeySaving, setGoogleKeySaving] = useState(false);
  const [googleKeySuccess, setGoogleKeySuccess] = useState('');
  const [googleKeyError, setGoogleKeyError] = useState('');

  // --- Hugging Face Key/Model State ---
  const [hfKeyExists, setHfKeyExists] = useState<boolean | null>(null);
  const [hfKeyInput, setHfKeyInput] = useState('');
  const [hfKeySaving, setHfKeySaving] = useState(false);
  const [hfKeySuccess, setHfKeySuccess] = useState('');
  const [hfKeyError, setHfKeyError] = useState('');
  const [hfModels, setHfModels] = useState<{model_id: string, name: string, description: string}[]>([]);
  const [hfSelectedModel, setHfSelectedModel] = useState('');

  useEffect(() => {
    // Fetch current credentials from backend
    fetch('/api/settings/facebook-credentials', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data.facebook_app_id) {
          setCredentials({
            facebook_app_id: data.facebook_app_id,
            facebook_app_secret: data.facebook_app_secret
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load credentials');
        setLoading(false);
      });
    // Fetch Google NLP Key status
    fetch('/api/settings/google-nlp-key-status', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setGoogleKeyExists(!!data.googleCloudNLPKeyExists))
      .catch(() => setGoogleKeyExists(false));
    // Fetch Hugging Face Key status
    fetch('/api/settings/huggingface-key-status', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setHfKeyExists(!!data.huggingFaceKeyExists))
      .catch(() => setHfKeyExists(false));
    // Fetch Hugging Face models
    fetch('/api/settings/huggingface-models', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setHfModels(data.models || []));
    // Fetch Hugging Face selected model
    fetch('/api/settings/huggingface-selection', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setHfSelectedModel(data.huggingface_model_id || ''));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/settings/facebook-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          facebook_app_id: credentials.facebook_app_id,
          facebook_app_secret: credentials.facebook_app_secret
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Credentials saved successfully!');
      } else {
        setError(data.error || 'Failed to save credentials');
      }
    } catch (err) {
      setError('Failed to save credentials');
    }
    setSaving(false);
  };

  const handleGoogleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGoogleKeyInput(e.target.value);
  };
  const handleGoogleKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleKeySaving(true);
    setGoogleKeySuccess('');
    setGoogleKeyError('');
    try {
      const res = await fetch('/api/settings/google-nlp-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ google_cloud_nlp_api_key: googleKeyInput })
      });
      const data = await res.json();
      if (data.success) {
        setGoogleKeySuccess('Google Cloud NLP API key updated!');
        setGoogleKeyExists(true);
        setGoogleKeyInput('');
      } else {
        setGoogleKeyError(data.error || 'Failed to save key');
      }
    } catch (err) {
      setGoogleKeyError('Failed to save key');
    }
    setGoogleKeySaving(false);
  };

  const handleHfKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHfKeyInput(e.target.value);
  };
  const handleHfModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setHfSelectedModel(e.target.value);
  };
  const handleHfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHfKeySaving(true);
    setHfKeySuccess('');
    setHfKeyError('');
    try {
      const res = await fetch('/api/settings/huggingface-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          huggingface_api_key: hfKeyInput || undefined,
          huggingface_model_id: hfSelectedModel || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setHfKeySuccess('Hugging Face settings updated!');
        if (hfKeyInput) setHfKeyExists(true);
        setHfKeyInput('');
      } else {
        setHfKeyError(data.error || 'Failed to save Hugging Face settings');
      }
    } catch (err) {
      setHfKeyError('Failed to save Hugging Face settings');
    }
    setHfKeySaving(false);
  };

  return (
    <div className="dashboard-app">
      <Sidebar />
      <div className="main-area">
        <Header title="Settings" />
        <div className="main-content">
          {isAdmin && (
            <>
              <h2>Facebook API Credentials</h2>
              {loading ? (
                <div>Loading...</div>
              ) : (
                <form onSubmit={handleSubmit} style={{ maxWidth: 500, margin: '0 auto' }}>
                  <div className="form-group">
                    <label htmlFor="facebook_app_id">App ID</label>
                    <input
                      type="text"
                      id="facebook_app_id"
                      name="facebook_app_id"
                      value={credentials.facebook_app_id}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="facebook_app_secret">App Secret</label>
                    <input
                      type="password"
                      id="facebook_app_secret"
                      name="facebook_app_secret"
                      value={credentials.facebook_app_secret}
                      onChange={handleChange}
                      className="form-control"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
                  {success && <div style={{ color: 'green', marginBottom: 10 }}>{success}</div>}
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Credentials'}
                  </button>
                </form>
              )}
              <hr style={{ margin: '2rem 0' }} />
            </>
          )}

          {/* Google Cloud NLP Section */}
          <h2>Google Cloud NLP API Key</h2>
          <form onSubmit={handleGoogleKeySubmit} style={{ maxWidth: 500, margin: '0 auto' }}>
            <div className="form-group">
              <label htmlFor="google_cloud_nlp_api_key">Google Cloud NLP API Key</label>
              {isAdmin ? (
                <>
                  <input
                    type="password"
                    id="google_cloud_nlp_api_key"
                    name="google_cloud_nlp_api_key"
                    value={googleKeyInput}
                    onChange={handleGoogleKeyChange}
                    className="form-control"
                    required
                    autoComplete="new-password"
                    placeholder={googleKeyExists ? 'Key is set (enter new to update)' : 'Enter API key'}
                  />
                  <div style={{ marginTop: 5 }}>
                    {googleKeyExists ? (
                      <span style={{ color: 'green' }}>&#10003; Key is set</span>
                    ) : (
                      <span style={{ color: 'red' }}>No key set</span>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ marginTop: 5 }}>
                  {googleKeyExists ? (
                    <span style={{ color: 'green' }}>&#10003; Key is set</span>
                  ) : (
                    <span style={{ color: 'red' }}>No key set</span>
                  )}
                </div>
              )}
            </div>
            {isAdmin && (
              <>
                {googleKeyError && <div style={{ color: 'red', marginBottom: 10 }}>{googleKeyError}</div>}
                {googleKeySuccess && <div style={{ color: 'green', marginBottom: 10 }}>{googleKeySuccess}</div>}
                <button type="submit" className="btn btn-primary" disabled={googleKeySaving}>
                  {googleKeySaving ? 'Saving...' : (googleKeyExists ? 'Update Key' : 'Set Key')}
                </button>
              </>
            )}
          </form>

          <hr style={{ margin: '2rem 0' }} />
          <h2>Hugging Face API Key & Model</h2>
          <form onSubmit={handleHfSubmit} style={{ maxWidth: 500, margin: '0 auto' }}>
            <div className="form-group">
              <label htmlFor="huggingface_api_key">Hugging Face API Key</label>
              {isAdmin ? (
                <>
                  <input
                    type="password"
                    id="huggingface_api_key"
                    name="huggingface_api_key"
                    value={hfKeyInput}
                    onChange={handleHfKeyChange}
                    className="form-control"
                    autoComplete="new-password"
                    placeholder={hfKeyExists ? 'Key is set (enter new to update)' : 'Enter API key'}
                  />
                  <div style={{ marginTop: 5 }}>
                    {hfKeyExists ? (
                      <span style={{ color: 'green' }}>&#10003; Key is set</span>
                    ) : (
                      <span style={{ color: 'red' }}>No key set</span>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ marginTop: 5 }}>
                  {hfKeyExists ? (
                    <span style={{ color: 'green' }}>&#10003; Key is set</span>
                  ) : (
                    <span style={{ color: 'red' }}>No key set</span>
                  )}
                </div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="huggingface_model_id">Sentiment Model</label>
              {isAdmin ? (
                <select
                  id="huggingface_model_id"
                  name="huggingface_model_id"
                  value={hfSelectedModel}
                  onChange={handleHfModelChange}
                  className="form-control"
                  required
                >
                  <option value="" disabled>Select a model...</option>
                  {hfModels.map(m => (
                    <option key={m.model_id} value={m.model_id}>
                      {m.name} - {m.description}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ marginTop: 5 }}>
                  {(() => {
                    const selected = hfModels.find(m => m.model_id === hfSelectedModel);
                    return selected ? (
                      <span>{selected.name} - {selected.description}</span>
                    ) : (
                      <span style={{ color: 'red' }}>No model selected</span>
                    );
                  })()}
                </div>
              )}
            </div>
            {isAdmin && (
              <>
                {hfKeyError && <div style={{ color: 'red', marginBottom: 10 }}>{hfKeyError}</div>}
                {hfKeySuccess && <div style={{ color: 'green', marginBottom: 10 }}>{hfKeySuccess}</div>}
                <button type="submit" className="btn btn-primary" disabled={hfKeySaving}>
                  {hfKeySaving ? 'Saving...' : 'Save Hugging Face Settings'}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
