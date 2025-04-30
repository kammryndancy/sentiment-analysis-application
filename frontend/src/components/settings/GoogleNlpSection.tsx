import React from 'react';

interface Props {
  isAdmin: boolean;
  googleKeyExists: boolean | null;
  googleKeyInput: string;
  googleKeySaving: boolean;
  googleKeySuccess: string;
  googleKeyError: string;
  handleGoogleKeyChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleGoogleKeySubmit: (e: React.FormEvent) => void;
}

const GoogleNlpSection: React.FC<Props> = ({
  isAdmin, googleKeyExists, googleKeyInput, googleKeySaving, googleKeySuccess, googleKeyError, handleGoogleKeyChange, handleGoogleKeySubmit
}) => (
  <section>
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
  </section>
);

export default GoogleNlpSection;
