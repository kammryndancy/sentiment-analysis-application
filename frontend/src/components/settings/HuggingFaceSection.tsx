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
    <h2>Hugging Face</h2>
    <form onSubmit={handleHfSubmit} className="settings-section-form">
        <div className="settings-label-badge-row">
          <label htmlFor="huggingface_api_key" className="settings-section-label">
            API Key:
          </label>
          <span className={`settings-section-badge ${hfKeyExists ? "badge-success" : "badge-error"}`}> 
            {hfKeyExists ? (
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
              id="huggingface_api_key"
              name="huggingface_api_key"
              value={hfKeyInput}
              onChange={handleHfKeyChange}
              className="form-control settings-section-input input-field"
              autoComplete="new-password"
              placeholder={hfKeyExists ? 'Key is set (enter new to update)' : 'Enter API key'}
            />
          </>
        ) : (
          <></>
        )}
        <div className="settings-label-badge-row">
        <label htmlFor="huggingface_model_id" className="settings-section-label">Sentiment Model:</label>
        <span className={`settings-section-badge ${hfSelectedModel ? "badge-success" : "badge-error"}`}> 
            {hfSelectedModel ? (
              <>
                <span className="badge-dot badge-dot-success" />
                Model is set/configured
              </>
            ) : (
              <>
                <span className="badge-dot badge-dot-error" />
                No model set/configured
              </>
            )}
          </span>
        </div>
        {isAdmin ? (
          <select
            id="huggingface_model_id"
            name="huggingface_model_id"
            value={hfSelectedModel}
            onChange={handleHfModelChange}
            className="form-control settings-section-input input-field"
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
          <>
            {(() => {
              const selected = hfModels.find(m => m.model_id === hfSelectedModel);
              return selected ? (
                <div className="settings-section-status">
                  <span>{selected.name} - {selected.description}</span>
                </div>
              ) : (
                <></>
              );
            })()}
          <div className="settings-section-info-msg">
            You need admin role to update these fields.
          </div>
          </>
        )}
      {isAdmin && (
        <>
          {hfKeyError && <div className="settings-section-error">{hfKeyError}</div>}
          {hfKeySuccess && <div className="settings-section-success">{hfKeySuccess}</div>}
          <button type="submit" className="settings-section-btn" disabled={hfKeySaving}>
            {hfKeySaving ? 'Saving...' : 'Save Hugging Face Settings'}
          </button>
        </>
      )}
    </form>
  </section>
);

export default HuggingFaceSection;
