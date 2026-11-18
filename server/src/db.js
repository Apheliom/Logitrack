const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../securitrace.db');
const backupDir = path.join(__dirname, '../backups');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[DATABASE] Error conectando a SQLite:', err.message);
  } else {
    console.log(`[DATABASE] Base de datos forense conectada en: ${dbPath}`);
    initializeSchema();
  }
});

const GENESIS_PREV_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

function initializeSchema() {
  const schemaQuery = `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      evidence_id TEXT UNIQUE NOT NULL,
      filename TEXT NOT NULL,
      file_hash TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT,
      risk_score INTEGER NOT NULL,
      verdict TEXT NOT NULL,
      anomalies_detected TEXT,
      metadata_summary TEXT,
      operator TEXT DEFAULT 'Perito_Forense_UNIX_01',
      session_type TEXT DEFAULT 'FILE_ANALYSIS',
      prev_hash TEXT DEFAULT '${GENESIS_PREV_HASH}',
      block_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.run(schemaQuery, (err) => {
    if (!err) {
      // Migración defensiva en caliente para bases de datos existentes
      db.run(`ALTER TABLE audit_logs ADD COLUMN prev_hash TEXT DEFAULT '${GENESIS_PREV_HASH}'`, () => {});
      db.run(`ALTER TABLE audit_logs ADD COLUMN block_hash TEXT`, () => {});
      seedDemoDataIfEmpty();
    }
  });
}

function calculateBlockHash(prevHash, evidenceId, fileHash, riskScore, timestamp) {
  const payload = `${prevHash}|${evidenceId}|${fileHash}|${riskScore}|${timestamp}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

function seedDemoDataIfEmpty() {
  db.get('SELECT COUNT(*) as count FROM audit_logs', [], (err, row) => {
    if (!err && row && row.count === 0) {
      console.log('[DATABASE] Precargando casos testigo con sellado Merkle para defensa...');
      const sampleCase1 = {
        evidence_id: 'EVD-202611-001',
        filename: 'id_document_passport_scan.jpg',
        file_hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
        file_size: 245120,
        mime_type: 'image/jpeg',
        risk_score: 92,
        verdict: 'MANIPULADO_ALTO_RIESGO',
        anomalies_detected: [
          'Firma de software de manipulación: Adobe Photoshop 2025 (Windows)',
          'Discrepancia en fechas de captura y modificación: Delta 1,420 días',
          'Eliminación intencional de datos de sensor/cámara (Make/Model)'
        ],
        metadata_summary: {
          software: 'Adobe Photoshop 25.0',
          modifyDate: '2026-11-10T18:22:10Z'
        },
        operator: 'Auditor_Sistemas_Univ',
        session_type: 'FILE_ANALYSIS'
      };

      const sampleCase2 = {
        evidence_id: 'EVD-202611-002',
        filename: 'ceo_authorization_voice_note.wav',
        file_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        file_size: 512040,
        mime_type: 'audio/wav',
        risk_score: 88,
        verdict: 'VOZ_SINTETICA_DEEPFAKE',
        anomalies_detected: [
          'Corte abrupto en formantes superiores a 7.8 kHz',
          'Cadencia prosódica monótona característica de modelos neuronales VITS'
        ],
        metadata_summary: {
          sampleRate: '44100 Hz',
          numChannels: 'Mono'
        },
        operator: 'Auditor_Sistemas_Univ',
        session_type: 'AUDIO_SYNTHESIS'
      };

      insertAuditLog(sampleCase1, () => {
        insertAuditLog(sampleCase2, () => {});
      });
    }
  });
}

/**
 * Inserción con Encadenamiento Criptográfico de Bloques (Merkle Chain)
 */
function insertAuditLog(log, callback) {
  // 1. Obtener el hash del último bloque registrado para encadenar
  db.get(`SELECT block_hash FROM audit_logs ORDER BY id DESC LIMIT 1`, [], (err, lastRow) => {
    const prevHash = (lastRow && lastRow.block_hash) ? lastRow.block_hash : GENESIS_PREV_HASH;
    const evidenceId = log.evidence_id || `EVD-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const timestamp = log.created_at || new Date().toISOString();
    const blockHash = calculateBlockHash(prevHash, evidenceId, log.file_hash, log.risk_score, timestamp);

    const query = `
      INSERT INTO audit_logs (
        evidence_id, filename, file_hash, file_size, mime_type,
        risk_score, verdict, anomalies_detected, metadata_summary,
        operator, session_type, prev_hash, block_hash, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      evidenceId,
      log.filename,
      log.file_hash,
      log.file_size,
      log.mime_type || 'application/octet-stream',
      log.risk_score,
      log.verdict,
      typeof log.anomalies_detected === 'string' ? log.anomalies_detected : JSON.stringify(log.anomalies_detected || []),
      typeof log.metadata_summary === 'string' ? log.metadata_summary : JSON.stringify(log.metadata_summary || {}),
      log.operator || 'Auditor_Pericial',
      log.session_type || 'FILE_ANALYSIS',
      prevHash,
      blockHash,
      timestamp
    ];

    db.run(query, params, function (err) {
      if (err) {
        console.error('[DATABASE] Error insertando registro forense:', err.message);
        if (callback) callback(err, null);
      } else {
        if (callback) callback(null, { id: this.lastID, evidence_id: evidenceId, block_hash: blockHash });
      }
    });
  });
}

/**
 * Verificación Integral de la Cadena de Custodia Inmutable (Tamper-Proof Audit)
 * Recorre todos los registros y comprueba que ningún bloque haya sido alterado en SQLite
 */
function verifyLedgerIntegrity(callback) {
  db.all(`SELECT id, evidence_id, file_hash, risk_score, created_at, prev_hash, block_hash FROM audit_logs ORDER BY id ASC`, [], (err, rows) => {
    if (err) return callback(err, null);
    if (!rows || rows.length === 0) {
      return callback(null, { isChainValid: true, totalBlocks: 0, status: 'EMPTY_LEDGER' });
    }

    let expectedPrevHash = GENESIS_PREV_HASH;
    let corruptedBlock = null;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      // 1. Validar que el prev_hash coincida con el bloque anterior
      if (row.prev_hash && row.prev_hash !== expectedPrevHash) {
        corruptedBlock = {
          blockIndex: i + 1,
          id: row.id,
          evidence_id: row.evidence_id,
          reason: `Discrepancia en enlace de cadena: prev_hash (${row.prev_hash}) no coincide con bloque previo (${expectedPrevHash})`
        };
        break;
      }

      // 2. Re-calcular el hash del bloque para verificar que los datos internos no fueron modificados
      const recalculatedHash = calculateBlockHash(row.prev_hash || GENESIS_PREV_HASH, row.evidence_id, row.file_hash, row.risk_score, row.created_at);
      if (row.block_hash && row.block_hash !== recalculatedHash) {
        corruptedBlock = {
          blockIndex: i + 1,
          id: row.id,
          evidence_id: row.evidence_id,
          reason: `Firma de bloque adulterada: Datos internos modificados sin autorización pericial`
        };
        break;
      }

      expectedPrevHash = row.block_hash || recalculatedHash;
    }

    if (corruptedBlock) {
      callback(null, {
        isChainValid: false,
        totalBlocks: rows.length,
        status: 'TAMPER_DETECTED',
        corruptedBlock,
        verifiedAt: new Date().toISOString()
      });
    } else {
      callback(null, {
        isChainValid: true,
        totalBlocks: rows.length,
        status: 'CHAIN_INTEGRITY_VERIFIED',
        latestBlockHash: expectedPrevHash,
        verifiedAt: new Date().toISOString()
      });
    }
  });
}

/**
 * Plan de Recuperación ante Desastres (DRP): Generación de Snapshots Criptográficos
 */
function createDatabaseBackup(callback) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `securitrace_backup_${timestamp}.db`;
  const backupFilePath = path.join(backupDir, backupFilename);

  fs.copyFile(dbPath, backupFilePath, (err) => {
    if (err) return callback(err, null);

    // Calcular el SHA-256 del respaldo
    const fileBuffer = fs.readFileSync(backupFilePath);
    const backupSha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    callback(null, {
      filename: backupFilename,
      path: backupFilePath,
      sizeBytes: fileBuffer.length,
      sha256: backupSha256,
      createdAt: new Date().toISOString()
    });
  });
}

function listBackups(callback) {
  fs.readdir(backupDir, (err, files) => {
    if (err) return callback(err, []);
    const backups = files.filter(f => f.endsWith('.db')).map(f => {
      const fullPath = path.join(backupDir, f);
      const stats = fs.statSync(fullPath);
      return {
        filename: f,
        sizeBytes: stats.size,
        createdAt: stats.birthtime.toISOString()
      };
    });
    callback(null, backups);
  });
}

function getAllAuditLogs(callback) {
  const query = `SELECT * FROM audit_logs ORDER BY created_at DESC`;
  db.all(query, [], (err, rows) => {
    if (err) {
      callback(err, null);
    } else {
      const parsed = rows.map(r => ({
        ...r,
        anomalies_detected: safeJsonParse(r.anomalies_detected, []),
        metadata_summary: safeJsonParse(r.metadata_summary, {})
      }));
      callback(null, parsed);
    }
  });
}

function getAuditLogById(id, callback) {
  const query = `SELECT * FROM audit_logs WHERE id = ? OR evidence_id = ?`;
  db.get(query, [id, id], (err, row) => {
    if (err) {
      callback(err, null);
    } else if (!row) {
      callback(null, null);
    } else {
      callback(null, {
        ...row,
        anomalies_detected: safeJsonParse(row.anomalies_detected, []),
        metadata_summary: safeJsonParse(row.metadata_summary, {})
      });
    }
  });
}

function clearAuditLogs(callback) {
  db.run(`DELETE FROM audit_logs`, [], function (err) {
    callback(err, { changes: this.changes });
  });
}

function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

module.exports = {
  db,
  insertAuditLog,
  verifyLedgerIntegrity,
  createDatabaseBackup,
  listBackups,
  getAllAuditLogs,
  getAuditLogById,
  clearAuditLogs
};
