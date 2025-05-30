import { useState, useEffect } from 'react';

interface AdminUser {
  id: number;
  username: string;
  role: string;
}

export function useAdminAuth() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const storedUser = localStorage.getItem('adminUser');

    if (token && storedUser) {
      try {
        setAdminUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored admin user:', error);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setAdminUser(null);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  };

  return {
    adminUser,
    loading,
    isAuthenticated: !!adminUser,
    logout,
    getAuthHeaders
  };
}