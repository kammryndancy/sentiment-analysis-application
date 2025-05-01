import React from 'react';

interface Props {
  loading: boolean;
  credentials: { facebook_app_id: string; facebook_app_secret: string };
  error: string;
  success: string;
  saving: boolean;
  isAdmin: boolean;
  facebookCredsSet: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

const FacebookCredentialsSection: React.FC<Props> = ({
  loading, credentials, error, success, saving, isAdmin, handleChange, handleSubmit, facebookCredsSet
}) => (
  <div>
    <h2>Facebook API Credentials</h2>
    {loading ? (
      <div>Loading...</div>
    ) : (
      <form onSubmit={handleSubmit} className="settings-section-form">
        <div className="settings-label-badge-row">
          <label htmlFor="facebook_app_id" className="settings-section-label">
            App ID:
          </label>
          <span className={`settings-section-badge ${facebookCredsSet ? "badge-success" : "badge-error"}`}>
            {facebookCredsSet ? (
              <>
                <span className="badge-dot badge-dot-success" />
                Credentials set/configured
              </>
            ) : (
              <>
                <span className="badge-dot badge-dot-error" />
                Not configured
              </>
            )}
          </span>
        </div>
        {isAdmin ? (
          <input
          type="text"
          id="facebook_app_id"
          name="facebook_app_id"
          value={credentials.facebook_app_id}
          onChange={handleChange}
          className="form-control settings-section-input input-field"
          placeholder="Enter Facebook App ID"
          required
          />  
        ) : (
          <>
          </>
        )}
        <div className="settings-label-badge-row">
        <label htmlFor="facebook_app_secret" className="settings-section-label">
          App Secret:
          </label>
        <span className={`settings-section-badge ${facebookCredsSet ? "badge-success" : "badge-error"}`}>
          {facebookCredsSet ? (
            <>
              <span className="badge-dot badge-dot-success" />
              Credentials set/configured
            </>
          ) : (
            <>
              <span className="badge-dot badge-dot-error" />
              Not configured
            </>
          )}
        </span>
        </div>
        {isAdmin ? (
            <input
            type="password"
            id="facebook_app_secret"
            name="facebook_app_secret"
            value={credentials.facebook_app_secret}
            onChange={handleChange}
            className="form-control settings-section-input input-field"
            placeholder="Enter Facebook App Secret"
            required
            autoComplete="current-password"
          />
        ) : (
          <div className="settings-section-info-msg">
            You need admin role to update these fields.
          </div>
        )}
        {isAdmin ? (
          <>
            {error && <div className="settings-section-error">{error}</div>}
            {success && <div className="settings-section-success">{success}</div>}
            <button type="submit" className="settings-section-btn" disabled={saving}>
              {saving ? 'Saving...' : 'Save Facebook Credentials'}
            </button>
          </>
        ) : (
          <></>
        )}
      </form>
    )}
  </div>
);

export default FacebookCredentialsSection;
