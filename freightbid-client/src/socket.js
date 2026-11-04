import { io } from 'socket.io-client';

export const getSocketURL = () => {
  let url = (import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000').trim();

  // If missing protocol (e.g. "loadx-production.up.railway.app")
  if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
    url = `https://${url}`;
  }

  // Strip trailing /api or slashes to connect to the socket server root
  url = url.replace(/\/api\/?$/i, '').replace(/\/+$/, '');
  return url || 'http://localhost:5000';
};

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const url = getSocketURL();
    socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000
    });
  }
  return socket;
};

export default getSocket;
