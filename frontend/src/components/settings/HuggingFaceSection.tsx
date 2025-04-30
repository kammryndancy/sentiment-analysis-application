import React from 'react';

interface Model {
  model_id: string;
  name: string;
  description: string;
}

interface Props {
  isAdmin: boolean;
  hfKeyExists: boolean | null;
  hfKeyInput: string;
  hfKeySaving: boolean;
  hfKeySuccess: string;
  hfKeyError: string;
  hfModels: Model[];
  hfSelectedModel: string;
  handleHfKeyChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleHfModelChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleHfSubmit: (e: React.FormEvent) => void;
}

const HuggingFaceSection: React.FC<Props> = ({
  isAdmin, hfKeyExists, hfKeyInput, hfKeySaving, hfKeySuccess, hfKeyError, hfModels, hfSelectedModel, handleHfKeyChange, handleHfModelChange, handleHfSubmit
}) => (
  <section>
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
  </section>
);

export default HuggingFaceSection;
