import React, { useEffect, useState } from 'react';
import '../../SharedStyles.css';

interface UserPendingRoles {
  username: string;
  roles: string[];
  pendingRoles: string[];
}

const AdminRoleRequestsPage: React.FC = () => {
  const [users, setUsers] = useState<UserPendingRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const fetchPendingRoles = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/users/pending-roles', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users);
      } else {
        setError(data.message || 'Failed to fetch');
      }
    } catch (e) {
      setError('Server error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPendingRoles();
  }, []);

  const handleAction = async (username: string, role: string, approve: boolean) => {
    setActionMsg('');
    const endpoint = approve ? '/api/users/approve-role' : '/api/users/reject-role';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, role }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setActionMsg(approve ? 'Role approved.' : 'Role rejected.');
      fetchPendingRoles();
    } else {
      setActionMsg(data.message || 'Action failed.');
    }
  };

  return (
    <div className="page-container">
      <div className="form-card" style={{ maxWidth: 600 }}>
        <div className="form-title">Pending Role Requests</div>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="form-error">{error}</div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center' }}>No pending role requests.</div>
        ) : (
          <table style={{ width: '100%', marginTop: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 6 }}>Username</th>
                <th style={{ textAlign: 'left', padding: 6 }}>Current Roles</th>
                <th style={{ textAlign: 'left', padding: 6 }}>Pending Role</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                user.pendingRoles.map(role => (
                  <tr key={user.username + role}>
                    <td style={{ padding: 6 }}>{user.username}</td>
                    <td style={{ padding: 6 }}>{user.roles.join(', ')}</td>
                    <td style={{ padding: 6 }}>{role}</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>
                      <button
                        className="primary-btn"
                        style={{ marginRight: 6 }}
                        onClick={() => handleAction(user.username, role, true)}
                      >
                        Approve
                      </button>
                      <button
                        className="primary-btn"
                        style={{ background: '#e57373', color: '#fff' }}
                        onClick={() => handleAction(user.username, role, false)}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        )}
        {actionMsg && <div className="form-success" style={{ marginTop: 12 }}>{actionMsg}</div>}
      </div>
    </div>
  );
};

export default AdminRoleRequestsPage;
