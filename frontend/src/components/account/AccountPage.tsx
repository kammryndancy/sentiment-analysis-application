import React, { useState } from 'react';
import Sidebar from '../layout/Sidebar';
import Header from '../layout/Header';
import '../../App.css';
import { useAuth } from '../../auth';

const ALL_ROLES = ['admin', 'user'];

const AccountPage: React.FC = () => {
  const { username, roles, pendingRoles, requestRole } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [requestedRole, setRequestedRole] = useState('');
  const [roleMsg, setRoleMsg] = useState('');

  // Only show roles not already assigned or pending
  const availableRoles = ALL_ROLES.filter(
    r => !roles.includes(r) && !pendingRoles.includes(r)
  );

  // Update password via backend
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg('');
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      setPasswordMsg('Both old and new password are required. New password must be at least 6 characters.');
      return;
    }
    try {
      const res = await fetch('/api/users/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordMsg('Password updated successfully!');
        setOldPassword('');
        setNewPassword('');
      } else {
        setPasswordMsg(data.message || 'Password update failed.');
      }
    } catch {
      setPasswordMsg('Server error.');
    }
  };

  // Request new role
  const handleRoleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleMsg('');
    if (!requestedRole) return;
    const res = await requestRole(requestedRole);
    if (res.success) {
      setRoleMsg('Role request submitted for admin approval.');
      setRequestedRole('');
    } else {
      setRoleMsg(res.message || 'Role request failed.');
    }
  };

  return (
    <div className="dashboard-app">
      <Sidebar />
      <div className="main-area">
        <Header title="Account Settings" showSearch={false} showExport={false} />
        <div className="main-content" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
          <div style={{ maxWidth: 480, width: '100%', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001', padding: 32, margin: '40px 0' }}>
            <div style={{ marginBottom: 12, textAlign: 'center', color: '#222' }}>
              <strong>Username:</strong> {username}
            </div>
            <div style={{ marginBottom: 18, textAlign: 'center', color: '#222' }}>
              <strong>Your Roles:</strong> {roles.join(', ')}
            </div>
            {pendingRoles && pendingRoles.length > 0 && (
              <div style={{ marginBottom: 18, textAlign: 'center', color: '#888' }}>
                <strong>Pending Roles:</strong> {pendingRoles.join(', ')}
              </div>
            )}
            <form onSubmit={handlePasswordUpdate} style={{ marginBottom: 24 }}>
              <label htmlFor="old-password" style={{ fontWeight: 500, color: '#222' }}>Old Password:</label>
              <input
                className="input-field"
                id="old-password"
                type="password"
                placeholder="Old Password"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                required
                style={{ color: '#222', background: '#f7f8fa', border: '1px solid #ccc' }}
              />
              <label htmlFor="password" style={{ fontWeight: 500, marginTop: 8, color: '#222' }}>New Password:</label>
              <input
                className="input-field"
                id="password"
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                style={{ color: '#222', background: '#f7f8fa', border: '1px solid #ccc' }}
              />
              <button className="primary-btn" type="submit" style={{ width: '100%', marginTop: 16 }}>Update Password</button>
              {passwordMsg && <div className="form-success" style={{ marginTop: 10 }}>{passwordMsg}</div>}
            </form>
            <form onSubmit={handleRoleRequest}>
              <label htmlFor="role-request" style={{ fontWeight: 500, color: '#222' }}>Request Additional Role:</label>
              <select
                className="input-field"
                id="role-request"
                value={requestedRole}
                onChange={e => setRequestedRole(e.target.value)}
                required
                disabled={availableRoles.length === 0}
                style={{ color: '#222', background: '#f7f8fa', border: '1px solid #ccc' }}
              >
                <option value="" disabled>
                  {availableRoles.length === 0 ? 'No roles available' : 'Select role'}
                </option>
                {availableRoles.map((r: string) => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
              <button className="primary-btn" type="submit" disabled={availableRoles.length === 0} style={{ width: '100%', marginTop: 10 }}>Request Role</button>
              {roleMsg && <div className="form-success" style={{ marginTop: 10 }}>{roleMsg}</div>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
