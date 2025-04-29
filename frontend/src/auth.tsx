import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  roles: string[];
  pendingRoles: string[];
  login: (username: string, password: string) => Promise<boolean | { success: boolean; message: string }>;
  logout: () => Promise<void>;
  loading: boolean;
  register: (username: string, password: string, role?: string) => Promise<{ success: boolean; message?: string }>;
  requestRole: (role: string) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [pendingRoles, setPendingRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Use VITE_API_BASE_URL or fallback to '' for relative paths
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

  useEffect(() => {
    // Check session on mount
    fetch(`${API_BASE}/api/auth/check`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        setIsAuthenticated(!!data.authenticated);
        setUsername(data.username || null);
        setRoles(data.roles || []);
        setPendingRoles(data.pendingRoles || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      const data = await res.json();
      setIsAuthenticated(true);
      setUsername(data.username);
      setRoles(data.roles || []);
      setPendingRoles(data.pendingRoles || []);
      return true;
    } else {
      let message = 'Invalid credentials';
      try {
        const data = await res.json();
        if (data && data.message) message = data.message;
      } catch {}
      setIsAuthenticated(false);
      setUsername(null);
      setRoles([]);
      setPendingRoles([]);
      return { success: false, message };
    }
  };

  const logout = async () => {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    setIsAuthenticated(false);
    setUsername(null);
    setRoles([]);
    setPendingRoles([]);
  };

  const register = async (username: string, password: string, role?: string) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password, role }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true };
    }
    return { success: false, message: data.message || 'Registration failed' };
  };

  // Request additional role
  const requestRole = async (role: string) => {
    const res = await fetch(`${API_BASE}/api/users/request-role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setPendingRoles(data.pendingRoles);
      return { success: true };
    }
    return { success: false, message: data.message || 'Role request failed' };
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        username,
        roles,
        pendingRoles,
        login,
        logout,
        loading,
        register,
        requestRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export { AuthContext };
