import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000');

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [driverLocations, setDriverLocations] = useState({});
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WebSocket] Conectado al servidor de telemetría.');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[WebSocket] Desconectado del servidor de telemetría.');
      setIsConnected(false);
    });

    // Telemetría GPS en tiempo real de repartidores
    socket.on('telemetry:driver_location', (data) => {
      setDriverLocations((prev) => ({
        ...prev,
        [data.driver_id]: {
          lat: data.lat,
          lng: data.lng,
          lastPing: data.last_ping || new Date().toISOString(),
          status: data.status,
          name: data.driver_name
        }
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const subscribeToOrder = (trackingNumber) => {
    if (socketRef.current) {
      socketRef.current.emit('subscribe:order_tracking', trackingNumber);
    }
  };

  const unsubscribeFromOrder = (trackingNumber) => {
    if (socketRef.current) {
      socketRef.current.emit('unsubscribe:order_tracking', trackingNumber);
    }
  };

  const sendDriverGPS = (gpsData) => {
    if (socketRef.current) {
      socketRef.current.emit('driver:send_gps', gpsData);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        driverLocations,
        subscribeToOrder,
        unsubscribeFromOrder,
        sendDriverGPS
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket debe ser utilizado dentro de un SocketProvider');
  }
  return context;
};
