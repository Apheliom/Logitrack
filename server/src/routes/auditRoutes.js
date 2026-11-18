const express = require('express');
const path = require('path');
const { 
  getAllAuditLogs, 
  getAuditLogById, 
  insertAuditLog, 
  clearAuditLogs,
  verifyLedgerIntegrity,
  createDatabaseBackup,
  listBackups
} = require('../db');

const router = express.Router();

/**
 * GET /api/audit/logs
 * Retorna todos los registros de auditoría forense con sus hashes de bloque
 */
router.get('/logs', (req, res) => {
  getAllAuditLogs((err, logs) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, count: logs.length, data: logs });
  });
});

/**
 * GET /api/audit/verify-chain
 * Verifica criptográficamente que ningún bloque de la base de datos haya sido adulterado
 */
router.get('/verify-chain', (req, res) => {
  verifyLedgerIntegrity((err, report) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, data: report });
  });
});

/**
 * POST /api/audit/backup
 * Genera un snapshot firmado con SHA-256 para el Plan de Recuperación ante Desastres (DRP)
 */
router.post('/backup', (req, res) => {
  createDatabaseBackup((err, backup) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, data: backup });
  });
});

/**
 * GET /api/audit/backups
 * Lista los snapshots de respaldo disponibles
 */
router.get('/backups', (req, res) => {
  listBackups((err, backups) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, count: backups.length, data: backups });
  });
});

/**
 * GET /api/audit/backups/download/:filename
 * Descarga el archivo binario SQLite del respaldo para custodia externa
 */
router.get('/backups/download/:filename', (req, res) => {
  const filename = req.params.filename;
  // Sanitizar path para evitar Directory Traversal
  const safeFilename = path.basename(filename);
  const filePath = path.join(__dirname, '../../backups', safeFilename);
  res.download(filePath, safeFilename);
});

/**
 * GET /api/audit/logs/:id
 */
router.get('/logs/:id', (req, res) => {
  getAuditLogById(req.params.id, (err, log) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (!log) {
      return res.status(404).json({ success: false, error: 'Registro pericial no localizado.' });
    }
    res.json({ success: true, data: log });
  });
});

/**
 * POST /api/audit/logs
 */
router.post('/logs', (req, res) => {
  insertAuditLog(req.body, (err, saved) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, data: saved });
  });
});

/**
 * GET /api/audit/export
 */
router.get('/export', (req, res) => {
  getAllAuditLogs((err, logs) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }

    const report = {
      project: 'SecuriTrace Forensic Platform',
      version: '1.0.0-PROD',
      systemImplementationCourse: 'Implantación de Sistemas - Universidad',
      exportedAt: new Date().toISOString(),
      reportSigner: 'Ingeniería en Sistemas - Laboratorio de Ciberseguridad Forense',
      totalEvidencesCollected: logs.length,
      evidenceSummary: {
        criticalAnomalies: logs.filter(l => l.risk_score >= 60).length,
        suspicious: logs.filter(l => l.risk_score >= 30 && l.risk_score < 60).length,
        verifiedAuthentic: logs.filter(l => l.risk_score < 30).length
      },
      auditChain: logs
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=SecuriTrace_AuditReport_${Date.now()}.json`);
    res.send(JSON.stringify(report, null, 2));
  });
});

/**
 * DELETE /api/audit/clear
 */
router.delete('/clear', (req, res) => {
  clearAuditLogs((err, result) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, message: 'Cadena de custodia reseteada para laboratorio.', details: result });
  });
});

module.exports = router;
