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

// Manejador 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.url}`
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
