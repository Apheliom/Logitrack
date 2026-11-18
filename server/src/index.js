const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const forensicRoutes = require('./routes/forensicRoutes');
const auditRoutes = require('./routes/auditRoutes');
const systemRoutes = require('./routes/systemRoutes');
const { db } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ extended: true, limit: '35mb' }));

// Logging de auditoría de red
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[NET-AUDIT] ${timestamp} | ${req.method} ${req.originalUrl} | IP: ${req.ip}`);
  next();
});

// Rutas de API
app.use('/api/forensics', forensicRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/system', systemRoutes);

// Servir frontend compilado de producción (Soporte integral para Render / Cloud Hosting)
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'SecuriTrace Forensic Engine',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    cryptoEngine: 'Node.js Native Crypto (FIPS 180-4 compliant SHA-256)',
    database: 'SQLite3 Forensic Ledger with Merkle Block Chaining',
    features: [
      'Zero-Disk Leakage In-Memory Buffers',
      'Tamper-Proof Merkle Ledger Chaining',
      'RFC 5424 SIEM Security Event Dispatcher',
      'Real-Time APM Observability Telemetry',
      'Disaster Recovery Plan (DRP) Snapshot Engine'
    ]
  });
});

// Fallback SPA routing para React
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) next();
  });
});

// Manejo centralizado de errores
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  res.status(500).json({
    success: false,
    error: 'Error interno en el motor de procesamiento forense',
    details: err.message
  });
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  🛡️  SecuriTrace Backend v1.2 Activo en Puerto ${PORT}`);
  console.log(`  🔗  API Base: http://localhost:${PORT}/api`);
  console.log(`  📡  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`  📊  APM Telemetry: http://localhost:${PORT}/api/system/telemetry`);
  console.log(`  🔒  Merkle Verify: http://localhost:${PORT}/api/audit/verify-chain`);
  console.log(`======================================================\n`);
});
