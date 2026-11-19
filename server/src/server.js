const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const driverRoutes = require('./routes/driverRoutes');
const routeRoutes = require('./routes/routeRoutes');
const initTrackingSocket = require('./sockets/trackingSocket');
const gpsSimulator = require('./services/gpsSimulator');

const app = express();
const server = http.createServer(app);

// Configuración CORS flexible
const allowedOrigin = process.env.CLIENT_ORIGIN || '*';
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' })); // Permitir firmas en base64

// Inicializar Socket.io
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST']
  }
});

// Inyectar io en la app y en el simulador GPS
app.set('io', io);
gpsSimulator.setSocketInstance(io);
initTrackingSocket(io);

// Endpoint de Salud (Healthcheck para monitoreo en Implantación)
app.get('/healthz', async (req, res) => {
  try {
    await db.query('SELECT 1');
    return res.status(200).json({
      status: 'UP',
      uptimeSeconds: Math.floor(process.uptime()),
      database: 'CONNECTED',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(503).json({
      status: 'DOWN',
      database: 'DISCONNECTED',
      error: err.message
    });
  }
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/routes', routeRoutes);

// Servir frontend compilado de React (client/dist) en producción
const path = require('path');
const fs = require('fs');
const clientDistPath = path.resolve(__dirname, '../../client/dist');

if (fs.existsSync(clientDistPath)) {
  console.log(`[Static] Sirviendo interfaz web desde: ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  // Soporte SPA: Cualquier ruta que no sea API sirve index.html
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api') || req.url === '/healthz' || req.url.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  console.warn(`[Static Warning] No se encontró la carpeta ${clientDistPath}. Corriendo solo en modo API.`);
  app.get('/', (req, res) => {
    res.json({
      name: 'LogiTrack API',
      status: 'ONLINE',
      message: 'API operativa. Para ver la interfaz web, asegúrate de compilar client/dist.',
      endpoints: {
        health: '/healthz',
        auth: '/api/auth',
        orders: '/api/orders',
        tracking: '/api/orders/track/:trackingNumber'
      }
    });
  });
}

// Manejador 404 para rutas API no existentes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta API no encontrada: ${req.method} ${req.url}`
  });
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('[Server Unhandled Error]', err);
  res.status(500).json({
    success: false,
    message: 'Error interno en el servidor.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 [LogiTrack Server] Ejecutándose en el puerto ${PORT}`);
  console.log(`📡 [WebSockets] Telemetría en tiempo real activa`);
  console.log(`🩺 [Healthcheck] Disponible en http://localhost:${PORT}/healthz`);
  console.log(`=======================================================`);
});
