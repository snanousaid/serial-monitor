import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ──
export const login = async (username: string, password: string) => {
  const res = await api.post('/auth/login', { username, password });
  return res.data as { access_token: string; username: string };
};

// ── Devices ──
export interface DeviceRow {
  id: number;
  deviceId: string;
  type: string;
  _count: { events: number };
}

export const getDevices = async (): Promise<DeviceRow[]> =>
  (await api.get('/devices')).data;

export const getDevice = async (id: number) =>
  (await api.get(`/devices/${id}`)).data;

export const getDeviceEvents = async (id: number, page = 1, limit = 50) =>
  (await api.get(`/devices/${id}/events`, { params: { page, limit } })).data;

// ── Events ──
export interface EventRow {
  id: number;
  data: string;
  createdAt: string;
  device: { deviceId: string; type: string } | null;
}

export const getRecentEvents = async (limit = 50): Promise<EventRow[]> =>
  (await api.get('/events/recent', { params: { limit } })).data;

export interface EventsFilter {
  page?: number;
  limit?: number;
  deviceId?: string;
  type?: string;
  search?: string;
  from?: string;
  to?: string;
}

export const getEvents = async (q: EventsFilter = {}) =>
  (await api.get('/events', { params: q })).data as {
    events: EventRow[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

// ── Stats ──
export const getSummary = async () =>
  (await api.get('/stats/summary')).data as {
    devicesCount: number;
    eventsCount: number;
    todayCount: number;
    lastEvent: { id: number; data: string; createdAt: string; deviceId: string } | null;
  };

export const getHourly = async () =>
  (await api.get('/stats/hourly')).data as Array<{ hour: string; count: number }>;

export const getTopDevices = async () =>
  (await api.get('/stats/top-devices')).data as Array<{
    id: number; deviceId: string; type: string; eventCount: number;
  }>;

// ── Config ──
export const getConfig = async () =>
  (await api.get('/config')).data as {
    serial: { port: string; baudRate: number };
    mqtt: { broker: string; topic: string; clientId: string; hasAuth: boolean };
    simulation: { enabled: boolean };
    database: { path: string };
  };

export const toggleSimulation = async (enabled: boolean) =>
  (await api.post('/config/simulation', { enabled })).data as { enabled: boolean };

export default api;
