import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth';
import '../../SharedStyles.css';
import styles from './LoginPage.module.css';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(username, password);
    if (success === true) {
      navigate('/dashboard');
    } else if (success && success.message) {
      setError(success.message);
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className={styles['login-root']}>
      <div>
        <h2 className="form-title">Login</h2>
        <form className="form-card" onSubmit={handleSubmit}>
          <input
            className="input-field"
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <input
            className="input-field"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button className="primary-btn" type="submit">Login</button>
          {error && <div className="form-error">{error}</div>}
        </form>
        <div className="link" style={{ marginTop: 16 }}>
          Don't have an account? <Link className="link" to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
