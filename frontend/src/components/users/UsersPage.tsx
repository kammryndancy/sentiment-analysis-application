import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '../layout/Sidebar';
import Header from '../layout/Header';
import '../../App.css';
import { useContext } from 'react';
import { AuthContext } from '../../auth';

interface UserRow {
  username: string;
  roles: string[];
  createdAt: string;
  enabled: boolean;
  updatedAt: string;
  pendingRoles?: string[];
}

const UsersPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const isAdmin = auth?.roles?.includes('admin');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof UserRow>('username');
  const [sortAsc, setSortAsc] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/users/list', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setUsers(data.users);
        else setError(data.message || 'Failed to load users');
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load users');
        setLoading(false);
      });
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.roles.join(',').toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let vA = a[sortField];
      let vB = b[sortField];
      if (sortField === 'roles') {
        vA = (a.roles || []).join(',');
        vB = (b.roles || []).join(',');
      }
      if (sortField === 'createdAt' || sortField === 'updatedAt') {
        vA = new Date(a[sortField] as string).toISOString();
        vB = new Date(b[sortField] as string).toISOString();
      }
      if (sortField === 'enabled') {
        vA = a.enabled ? '1' : '0';
        vB = b.enabled ? '1' : '0';
      }
      if (vA === vB) return 0;
      if (vA == null) return 1;
      if (vB == null) return -1;
      return (vA > vB ? 1 : -1) * (sortAsc ? 1 : -1);
    });
  }, [filteredUsers, sortField, sortAsc]);

  const handleSort = (field: keyof UserRow) => {
    if (sortField === field) setSortAsc(a => !a);
    else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleEnableUser = async (username: string) => {
    setActionLoading(username + '-enable');
    try {
      const res = await fetch('/api/users/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users => users.map(u => u.username === username ? { ...u, enabled: true, updatedAt: new Date().toISOString() } : u));
      } else {
        setError(data.message || 'Failed to enable user');
      }
    } catch {
      setError('Failed to enable user');
    }
    setActionLoading(null);
  };

  const handleDisableUser = async (username: string) => {
    setActionLoading(username + '-disable');
    try {
      const res = await fetch('/api/users/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users => users.map(u => u.username === username ? { ...u, enabled: false, updatedAt: new Date().toISOString() } : u));
      } else {
        setError(data.message || 'Failed to disable user');
      }
    } catch {
      setError('Failed to disable user');
    }
    setActionLoading(null);
  };

  const handleApproveRole = async (username: string, role: string) => {
    setActionLoading(username + '-role-' + role);
    try {
      const res = await fetch('/api/users/approve-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, role })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users => users.map(u => u.username === username ? { ...u, roles: data.roles, pendingRoles: data.pendingRoles, updatedAt: new Date().toISOString() } : u));
      } else {
        setError(data.message || 'Failed to approve role');
      }
    } catch {
      setError('Failed to approve role');
    }
    setActionLoading(null);
  };

  const handleRemoveAdmin = async (username: string) => {
    if (!window.confirm(`Are you sure you want to remove admin role from ${username}?`)) return;
    setActionLoading(username + '-remove-admin');
    try {
      const res = await fetch('/api/users/remove-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, role: 'admin' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(users => users.map(u => u.username === username ? { ...u, roles: data.roles, updatedAt: new Date().toISOString() } : u));
      } else {
        setError(data.message || 'Failed to remove admin role');
      }
    } catch {
      setError('Failed to remove admin role');
    }
    setActionLoading(null);
  };

  return (
    <div className="dashboard-app">
      <Sidebar />
      <div className="main-area">
        <Header title="Users" />
        <div className="main-content">
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Search by username or role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: 8, width: 300 }}
            />
          </div>
          {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
          <div style={{ overflowX: 'auto' }}>
            <table className="table table-striped">
              <thead>
                <tr>
                  <th onClick={() => handleSort('username')} style={{ cursor: 'pointer' }}>Username {sortField === 'username' ? (sortAsc ? '▲' : '▼') : ''}</th>
                  <th onClick={() => handleSort('roles')} style={{ cursor: 'pointer' }}>Roles {sortField === 'roles' ? (sortAsc ? '▲' : '▼') : ''}</th>
                  <th onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer' }}>Created At {sortField === 'createdAt' ? (sortAsc ? '▲' : '▼') : ''}</th>
                  <th onClick={() => handleSort('updatedAt')} style={{ cursor: 'pointer' }}>Updated At {sortField === 'updatedAt' ? (sortAsc ? '▲' : '▼') : ''}</th>
                  <th onClick={() => handleSort('enabled')} style={{ cursor: 'pointer' }}>Enabled {sortField === 'enabled' ? (sortAsc ? '▲' : '▼') : ''}</th>
                  {isAdmin && <th>Pending Roles</th>}
                  {isAdmin && <th>Actions</th>}
                  {isAdmin && <th>Admin Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={isAdmin ? 8 : 5}>Loading...</td></tr>
                ) : sortedUsers.length === 0 ? (
                  <tr><td colSpan={isAdmin ? 8 : 5}>No users found</td></tr>
                ) : (
                  sortedUsers.map(u => (
                    <tr key={u.username}>
                      <td>{u.username}</td>
                      <td>{u.roles.join(', ')}</td>
                      <td>{new Date(u.createdAt).toLocaleString()}</td>
                      <td>{u.updatedAt ? new Date(u.updatedAt).toLocaleString() : '-'}</td>
                      <td>{u.enabled ? <span style={{ color: 'green' }}>Yes</span> : <span style={{ color: 'red' }}>No</span>}</td>
                      {isAdmin && <td>{(u.pendingRoles && u.pendingRoles.length > 0) ? u.pendingRoles.join(', ') : '-'}</td>}
                      {isAdmin && <td>
                        {u.enabled ? (
                          <button
                            className="btn btn-sm btn-danger"
                            disabled={actionLoading === u.username + '-disable' || u.username === auth?.username}
                            onClick={() => handleDisableUser(u.username)}
                            title={u.username === auth?.username ? 'You cannot disable your own account' : ''}
                          >{actionLoading === u.username + '-disable' ? 'Disabling...' : 'Disable User'}</button>
                        ) : (
                          <button
                            className="btn btn-sm btn-success"
                            disabled={actionLoading === u.username + '-enable'}
                            onClick={() => handleEnableUser(u.username)}
                          >{actionLoading === u.username + '-enable' ? 'Enabling...' : 'Enable User'}</button>
                        )}
                        {u.pendingRoles && u.pendingRoles.length > 0 && u.pendingRoles.map(role => (
                          <button
                            key={role}
                            className="btn btn-sm btn-primary"
                            style={{ marginLeft: 4 }}
                            disabled={actionLoading === u.username + '-role-' + role}
                            onClick={() => handleApproveRole(u.username, role)}
                          >{actionLoading === u.username + '-role-' + role ? `Approving ${role}...` : `Approve ${role}`}</button>
                        ))}
                      </td>}
                      {isAdmin && <td>
                        {u.roles.includes('admin') && auth.username !== u.username ? (
                          <button
                            className="danger-btn"
                            disabled={actionLoading === u.username + '-remove-admin'}
                            onClick={() => handleRemoveAdmin(u.username)}
                          >
                            Remove Admin
                          </button>
                        ) : null}
                      </td>}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
