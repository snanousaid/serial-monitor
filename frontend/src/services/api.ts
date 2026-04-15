import axios from 'axios';

const API_BASE = import.meta.env.DEV ? 'http://localhost/api/v2' : '/api/v2';
const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('username');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

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

// ── Modem / SIM ──
export const getModemPlatform = async () =>
  (await api.get('/modem/platform')).data as { linux: boolean };

export interface NmConnection { name: string; uuid: string; type: string; device: string; }
export const getModemConnections = async () =>
  (await api.get('/modem/connections')).data as NmConnection[];

export const getModemStatus = async () =>
  (await api.get('/modem/status')).data as {
    linux: boolean;
    port: string;
    baudRate: number;
    cpin?: string; cpinError?: string;
    iccid?: string | null; iccidError?: string;
    imsi?: string | null; imsiError?: string;
  };

export const unlockSimPin = async (pin: string) =>
  (await api.post('/modem/unlock', { pin })).data as { ok: boolean; response: string };

export const restartModem = async () =>
  (await api.post('/modem/restart-modem')).data as { ok: boolean; response: string };

export const restartPppd = async () =>
  (await api.post('/modem/restart-pppd')).data as { ok: boolean };

export default api;
