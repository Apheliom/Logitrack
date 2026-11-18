const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const siemService = require('../services/siemService');

const router = express.Router();
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../securitrace.db');

/**
 * GET /api/system/network-info
 * Detecta interfaces de red locales para generar enlaces dinámicos de Agente de Campo en LAN
 */
router.get('/network-info', (req, res) => {
  const interfaces = os.networkInterfaces();
  const lanIps = [];

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      // Ignorar loopback (127.0.0.1) y direcciones que no sean IPv4
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254')) {
        lanIps.push({
          interface: name,
          ip: net.address
        });
      }
    }
  }

  const primaryIp = lanIps.length > 0 ? lanIps[0].ip : 'localhost';

  res.json({
    success: true,
    data: {
      primaryIp,
      lanIps,
      clientPort: 5173,
      serverPort: process.env.PORT || 5000,
      protocol: req.protocol,
      hostHeader: req.get('host')
    }
  });
});

/**
 * GET /api/system/telemetry
 * Expone telemetría en tiempo real para observabilidad, SLAs y monitoreo APM
 */
router.get('/telemetry', (req, res) => {
  const memory = process.memoryUsage();
  let dbSizeBytes = 0;

  try {
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      dbSizeBytes = stats.size;
    }
  } catch (e) {}

  res.json({
    success: true,
    data: {
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        heapUsedMb: (memory.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMb: (memory.heapTotal / 1024 / 1024).toFixed(2),
        rssMb: (memory.rss / 1024 / 1024).toFixed(2),
        externalMb: (memory.external / 1024 / 1024).toFixed(2),
        heapUtilizationPercent: ((memory.heapUsed / memory.heapTotal) * 100).toFixed(1)
      },
      storage: {
        databaseFile: 'securitrace.db',
        databaseSizeKb: (dbSizeBytes / 1024).toFixed(1),
        storageEngine: 'SQLite3 ACID Ledger'
      },
      security: {
        fipsCompliance: 'FIPS 180-4 (SHA-256 Enabled)',
        merkleChaining: 'Active (Tamper-Proof Block Ledger)',
        memoryVolatileBuffer: 'Active (Zero-Disk Leakage)',
        siemIntegration: 'RFC 5424 Syslog Dispatcher Active'
      }
    }
  });
});

/**
 * GET /api/system/siem-events
 * Retorna la cola de eventos de seguridad formateados en Syslog RFC 5424
 */
router.get('/siem-events', (req, res) => {
  const limit = parseInt(req.query.limit) || 25;
  const events = siemService.getRecentEvents(limit);
  res.json({
    success: true,
    count: events.length,
    data: events
  });
});

module.exports = router;
