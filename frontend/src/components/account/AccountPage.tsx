import React, { useState } from 'react';
import Sidebar from '../layout/Sidebar';
import Header from '../layout/Header';
import '../../App.css';
import './AccountPage.css';
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
        <Header title="Account" showSearch={false} showExport={false} />
        <div className="main-content account-main-content">
          <div className="account-container">
            <div className="account-header">
              <h2>Account IAM</h2>
            </div>
            <div className="account-details-row">
              <div className="account-username">
                <strong>Username:</strong> {username}
              </div>
              <div className="account-roles">
                <strong>Roles:</strong> {roles.join(', ')}
              </div>
              {pendingRoles && pendingRoles.length > 0 && (
                <div className="account-pending-roles">
                  <strong>Pending Roles:</strong> {pendingRoles.join(', ')}
                </div>
              )}
            </div>
            <form onSubmit={handlePasswordUpdate} className="account-form">
              <label htmlFor="old-password" className="account-label">Old Password:</label>
              <input
                className="input-field"
                id="old-password"
                type="password"
                placeholder="Old Password"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                required
              />
              <label htmlFor="password" className="account-label account-label-margin">New Password:</label>
              <input
                className="input-field"
                id="password"
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <button className="account-btn" type="submit">Update Password</button>
              {passwordMsg && <div className="account-msg">{passwordMsg}</div>}
            </form>
            <form onSubmit={handleRoleRequest} className="account-form">
              <label htmlFor="role-request" className="account-label">Request Additional Role:</label>
              <select
                className="input-field"
                id="role-request"
                value={requestedRole}
                onChange={e => setRequestedRole(e.target.value)}
                required
                disabled={availableRoles.length === 0}
              >
                <option value="" disabled>
                  {availableRoles.length === 0 ? 'No roles available' : 'Select role'}
                </option>
                {availableRoles.map((r: string) => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
              <button className="account-btn" type="submit" disabled={availableRoles.length === 0}>Request Role</button>
              {roleMsg && <div className="account-msg">{roleMsg}</div>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
