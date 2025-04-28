import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth';
import '../../SharedStyles.css';

const RegisterPage: React.FC = () => {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const res = await register(username, password, role);
    if (res.success) {
      setSuccess('Registration successful! Logging you in...');
      // Auto-login after registration
      await login(username, password);
      navigate('/dashboard');
    } else {
      setError(res.message || 'Registration failed');
    }
  };

  return (
    <div className="page-container">
      <h2 className="form-title">Register</h2>
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
        <select className="input-field" value={role} onChange={e => setRole(e.target.value)}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button className="primary-btn" type="submit">Register</button>
        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}
      </form>
      <div className="link">
        Already have an account? <Link to="/login">Login</Link>
      </div>
    </div>
  );
};

export default RegisterPage;
