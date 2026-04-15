import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connectSocket = (): Socket => {
  if (socket && socket.connected) return socket;

  const token = localStorage.getItem('access_token');

  const url = import.meta.env.DEV ? 'http://localhost/serial' : '/serial';
  socket = io(url, {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('[Socket] Connecté au serveur WebSocket');
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Déconnecté du serveur WebSocket');
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const onNewEvent = (
  callback: (payload: { event: any; device: any }) => void,
) => {
  // Utilise le socket existant sans en créer un nouveau
  const s = socket ?? connectSocket();
  s.on('new-event', callback);
};

export const offNewEvent = () => {
  socket?.off('new-event');
};

export const getSocket = (): Socket | null => socket;
