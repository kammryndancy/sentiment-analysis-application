import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth';
import '../../SharedStyles.css';
import './LoginPage.css';

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
    <div className="loginpage-container">
      <div className="loginpage-card">
        <h2 className="loginpage-title">Login</h2>
        <form className="loginpage-form" onSubmit={handleSubmit}>
          {error && <div className="loginpage-error">{error}</div>}
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
          <button className="loginpage-btn" type="submit">Login</button>
        </form>
        <div className="link" style={{ marginTop: 16 }}>
          Don't have an account? <Link className="link" to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
