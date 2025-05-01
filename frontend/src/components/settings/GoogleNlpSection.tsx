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
    <h2>Google Cloud NLP</h2>
    <form onSubmit={handleGoogleKeySubmit} className="settings-section-form">
      <div className="settings-label-badge-row">
        <label htmlFor="google_nlp_api_key" className="settings-section-label">API Key:</label>
        <span className={`settings-section-badge ${googleKeyExists ? "badge-success" : "badge-error"}`}>
          {googleKeyExists ? (
            <>
              <span className="badge-dot badge-dot-success" />
              Key is set/configured
            </>
          ) : (
            <>
              <span className="badge-dot badge-dot-error" />
              No key set/configured
            </>
          )}
        </span>
      </div>
        {isAdmin ? (
          <>
            <input
              type="password"
              id="google_nlp_api_key"
              name="google_nlp_api_key"
              value={googleKeyInput}
              onChange={handleGoogleKeyChange}
              className="form-control settings-section-input input-field"
              required
              autoComplete="new-password"
              placeholder={googleKeyExists ? 'Key is set (enter new to update)' : 'Enter API key'}
            />
          </>
        ) : (
          <div className="settings-section-info-msg">
          You need admin role to update these fields.
        </div>
        )}
      {isAdmin && (
        <>
          {googleKeyError && <div className="settings-section-error">{googleKeyError}</div>}
          {googleKeySuccess && <div className="settings-section-success">{googleKeySuccess}</div>}
          <button type="submit" className="settings-section-btn" disabled={googleKeySaving}>
            {googleKeySaving ? 'Saving...' : (googleKeyExists ? 'Update' : 'Save')} Key
          </button>
        </>
      )}
    </form>
  </section>
);

export default GoogleNlpSection;
