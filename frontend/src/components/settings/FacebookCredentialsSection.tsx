import React from 'react';

interface Props {
  loading: boolean;
  credentials: { facebook_app_id: string; facebook_app_secret: string };
  error: string;
  success: string;
  saving: boolean;
  isAdmin: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

const FacebookCredentialsSection: React.FC<Props> = ({
  loading, credentials, error, success, saving, isAdmin, handleChange, handleSubmit
}) => (
  <section>
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
  </section>
);

export default FacebookCredentialsSection;
