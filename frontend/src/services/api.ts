import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// Injecte automatiquement le token JWT dans chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ──
export const login = async (username: string, password: string) => {
  const res = await api.post('/auth/login', { username, password });
  return res.data as { access_token: string; username: string };
};

// ── Devices ──
export const getDevices = async () => {
  const res = await api.get('/devices');
  return res.data as Array<{
    id: number;
    deviceId: string;
    type: string;
    _count: { events: number };
  }>;
};

export const getDevice = async (id: number) => {
  const res = await api.get(`/devices/${id}`);
  return res.data;
};

export const getDeviceEvents = async (id: number, page = 1, limit = 50) => {
  const res = await api.get(`/devices/${id}/events`, {
    params: { page, limit },
  });
  return res.data as {
    events: Array<{ id: number; data: string; createdAt: string }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

// ── Events ──
export const getRecentEvents = async (limit = 20) => {
  const res = await api.get('/events', { params: { limit } });
  return res.data as Array<{
    id: number;
    data: string;
    createdAt: string;
    device: { deviceId: string; type: string };
  }>;
};

export default api;
