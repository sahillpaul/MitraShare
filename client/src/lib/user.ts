import { useState, useEffect } from 'react';
import axios from 'axios';

export function useUser() {
  const [user, setUser] = useState<{name?: string} | null>(() => {
    try {
      const cached = localStorage.getItem('mitrashare_user_cache');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('/api/users/me');
        setUser(res.data.user);
        localStorage.setItem('mitrashare_user_cache', JSON.stringify(res.data.user));
      } catch (error) {
        console.error("Failed to fetch user");
      }
    };
    fetchUser();
  }, []);

  return user;
}

export function getInitials(name?: string) {
  if (!name) return '';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}
