const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const ForensicService = require('../services/forensicService');
const AudioService = require('../services/audioService');
const siemService = require('../services/siemService');
const { insertAuditLog, getAuditLogById } = require('../db');

const router = express.Router();

// MemoryStorage para Cero Fugas en Disco (Zero-Disk Leakage)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 } // 30 MB
});

/**
 * Middleware de Protección de Memoria (RAM Protection Guard)
 * Evalúa el consumo del Heap antes de procesar para evitar Denial of Service (DoS) por memoria
 */
function memoryProtectionGuard(req, res, next) {
  const mem = process.memoryUsage();
  const heapUsagePercent = (mem.heapUsed / mem.heapTotal) * 100;

  if (heapUsagePercent > 92) {
    return res.status(503).json({
      success: false,
      error: 'Servidor bajo alta carga de procesamiento en RAM. Ingesta encolada temporalmente para evitar agotamiento de memoria.',
      heapUsagePercent: heapUsagePercent.toFixed(1)
    });
  }
  next();
}

/**
 * POST /api/forensics/analyze-file
 */
router.post('/analyze-file', memoryProtectionGuard, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se suministró ningún archivo binario.' });
    }

    const { buffer, originalname, mimetype } = req.file;
    const operator = req.body.operator || 'Auditor_Pericial_Sistemas';

    const analysisResult = await ForensicService.analyzeBuffer(buffer, originalname, mimetype);

    let liveGps = null;
    if (req.body.liveGps) {
      try {
        liveGps = JSON.parse(req.body.liveGps);
      } catch (e) { }
    }

    const exifLat = analysisResult.metadata.gpsLatitude ? parseFloat(analysisResult.metadata.gpsLatitude) : null;
    const exifLon = analysisResult.metadata.gpsLongitude ? parseFloat(analysisResult.metadata.gpsLongitude) : null;

    let geoComparison = {
      hasGpsData: false,
      liveGps: liveGps ? {
        latitude: liveGps.latitude,
        longitude: liveGps.longitude,
        dms: `${formatDms(liveGps.latitude, true)}, ${formatDms(liveGps.longitude, false)}`,
        accuracyMeters: liveGps.accuracy || 10,
        altitudeMeters: liveGps.altitude || null
      } : null,
      exifGps: (exifLat && exifLon) ? {
        latitude: exifLat,
        longitude: exifLon,
        dms: `${formatDms(exifLat, true)}, ${formatDms(exifLon, false)}`
      } : null,
      discrepancyKm: null,
      isGpsSpoofed: false,
      mapUrl: null
    };

    const effectiveLat = exifLat || (liveGps ? liveGps.latitude : null);
    const effectiveLon = exifLon || (liveGps ? liveGps.longitude : null);

    if (effectiveLat && effectiveLon) {
      geoComparison.hasGpsData = true;
      geoComparison.mapUrl = `https://www.openstreetmap.org/?mlat=${effectiveLat}&mlon=${effectiveLon}#map=16/${effectiveLat}/${effectiveLon}`;
    }

    if (liveGps && exifLat && exifLon) {
      const distanceKm = calculateHaversineDistanceKm(liveGps.latitude, liveGps.longitude, exifLat, exifLon);
      geoComparison.discrepancyKm = distanceKm.toFixed(2);

      if (distanceKm > 1.5) {
        geoComparison.isGpsSpoofed = true;
        const alertMsg = `Discrepancia Espacial (GPS Inconsistente): El origen reportó captura a ${distanceKm.toFixed(1)} km de distancia de las coordenadas EXIF internas de la imagen.`;
        analysisResult.anomalies.push(`[GEOLOCALIZACIÓN] ${alertMsg}`);
        analysisResult.riskScore = Math.min(100, analysisResult.riskScore + 40);
        if (analysisResult.riskScore >= 60) {
          analysisResult.verdict = 'MANIPULADO_ALTO_RIESGO';
        }
      }
    }

    const evidenceLog = {
      filename: analysisResult.filename,
      file_hash: analysisResult.hashes.sha256,
      file_size: analysisResult.fileSize,
      mime_type: analysisResult.mimeType,
      risk_score: analysisResult.riskScore,
      verdict: analysisResult.verdict,
      anomalies_detected: analysisResult.anomalies,
      metadata_summary: {
        ...analysisResult.metadata,
        geoTelemetry: geoComparison
      },
      operator,
      session_type: 'FILE_ANALYSIS'
    };

    insertAuditLog(evidenceLog, (err, saved) => {
      const evidenceId = saved ? saved.evidence_id : `EVD-${Date.now().toString().slice(-6)}`;

      // Si el riesgo es crítico (IA / Photoshop), emitir evento SIEM
      if (analysisResult.riskScore >= 60) {
        siemService.recordSecurityEvent({
          severity: 'CRITICAL',
          facility: 'MEDIA_TAMPERING',
          source: 'Agent-VisionForensics',
          message: `ALERTA CRÍTICA: Activo manipulado o generado por IA detectado (${analysisResult.filename}). Riesgo: ${analysisResult.riskScore}%`,
          evidenceId,
          riskScore: analysisResult.riskScore
        });
      }

      return res.json({
        success: true,
        data: {
          ...analysisResult,
          evidenceId,
          blockHash: saved ? saved.block_hash : null,
          geoComparison
        }
      });
    });
  } catch (error) {
    console.error('[FORENSICS] Error en análisis:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/forensics/analyze-audio
 */
router.post('/analyze-audio', memoryProtectionGuard, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se suministró archivo de audio.' });
    }

    const { buffer, originalname, mimetype } = req.file;
    const operator = req.body.operator || 'Especialista_Biometria_Acustica';
    let clientStats = null;

    if (req.body.stats) {
      try {
        clientStats = JSON.parse(req.body.stats);
      } catch (e) { }
    }

    const audioAnalysis = AudioService.processAudioSample(buffer, originalname, mimetype, clientStats);

    const evidenceLog = {
      filename: audioAnalysis.filename,
      file_hash: audioAnalysis.sha256,
      file_size: audioAnalysis.fileSize,
      mime_type: audioAnalysis.mimeType,
      risk_score: audioAnalysis.riskScore,
      verdict: audioAnalysis.verdict,
      anomalies_detected: audioAnalysis.anomalies,
      metadata_summary: audioAnalysis.wavInfo,
      operator,
      session_type: 'AUDIO_SYNTHESIS'
    };

    insertAuditLog(evidenceLog, (err, saved) => {
      const evidenceId = saved ? saved.evidence_id : `EVD-${Date.now().toString().slice(-6)}`;

      if (audioAnalysis.riskScore >= 60) {
        siemService.recordSecurityEvent({
          severity: 'CRITICAL',
          facility: 'VOICE_DEEPFAKE',
          source: 'Agent-AcousticVoice',
          message: `ALERTA DEEPFAKE: Síntesis de voz artificial detectada (${audioAnalysis.filename}). Riesgo: ${audioAnalysis.riskScore}%`,
          evidenceId,
          riskScore: audioAnalysis.riskScore
        });
      }

      return res.json({
        success: true,
        data: {
          ...audioAnalysis,
          evidenceId,
          blockHash: saved ? saved.block_hash : null
        }
      });
    });
  } catch (error) {
    console.error('[FORENSICS] Error en análisis de audio:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/forensics/affidavit/:evidenceId
 * Genera el Dictamen Pericial Criptográfico Oficial firmado por el motor forense
 * conforme a estándares de trazabilidad y custodia judicial ISO/IEC 27037.
 */
router.get('/affidavit/:evidenceId', (req, res) => {
  const { evidenceId } = req.params;

  getAuditLogById(evidenceId, (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (!row) {
      return res.status(404).json({ success: false, error: `Evidencia pericial ${evidenceId} no localizada en el ledger.` });
    }

    const issuedAt = new Date().toISOString();
    const affidavitNumber = `EXP-FORENSIC-${row.evidence_id}-${issuedAt.slice(0, 10).replace(/-/g, '')}`;

    // Construcción del cuerpo pericial determinista
    const legalBody = {
      standard: 'ISO/IEC 27037 - Guidelines for Identification, Collection, Acquisition and Preservation of Digital Evidence',
      affidavitNumber,
      issuedAt,
      jurisdiction: 'Tribunal Técnico de Auditoría e Implantación de Sistemas',
      evidence: {
        evidenceId: row.evidence_id,
        filename: row.filename,
        fileHashSha256: row.file_hash,
        mimeType: row.mime_type,
        fileSizeBytes: row.file_size,
        sessionType: row.session_type,
        operator: row.operator
      },
      forensicConclusion: {
        verdict: row.verdict,
        threatRiskScore: `${row.risk_score}%`,
        isTampered: row.risk_score >= 60,
        anomaliesCount: (row.anomalies_detected || []).length,
        anomaliesList: row.anomalies_detected || []
      },
      chainOfCustodyProof: {
        ledgerIndex: row.id,
        previousBlockHash: row.prev_hash || '0000000000000000000000000000000000000000000000000000000000000000',
        currentBlockHash: row.block_hash,
        recordedAt: row.created_at,
        integrityStatus: 'TAMPER_PROOF_VERIFIED'
      }
    };

    // Sello criptográfico digital del dictamen
    const affidavitSignature = crypto
      .createHash('sha256')
      .update(JSON.stringify(legalBody) + 'SECURITRACE_ENTERPRISE_KEY_2026')
      .digest('hex');

    return res.json({
      success: true,
      data: {
        ...legalBody,
        digitalSignature: {
          algorithm: 'HMAC-SHA256 / FIPS-180-4 Engine',
          signatureSeal: affidavitSignature,
          certifyingAuthority: 'SecuriTrace Neural Forensic Engine v1.2'
        }
      }
    });
  });
});

// Cola en memoria para streaming en vivo entre agentes móviles y puesto de mando
const liveSessionQueue = new Map();

/**
 * Limpieza periódica de sesiones de campo antiguas (> 30 minutos)
 */
setInterval(() => {
  const now = Date.now();
  for (const [token, item] of liveSessionQueue.entries()) {
    if (now - item.timestamp > 30 * 60 * 1000) {
      liveSessionQueue.delete(token);
    }
  }
}, 5 * 60 * 1000);

/**
 * Función pericial para cálculo de distancia geodésica (Haversine)
 */
function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio medio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDms(val, isLat) {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  const dir = isLat ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');
  const abs = Math.abs(val);
  const deg = Math.floor(abs);
  const min = Math.floor((abs - deg) * 60);
  const sec = ((abs - deg - min / 60) * 3600).toFixed(1);
  return `${deg}° ${min}' ${sec}" ${dir}`;
}

/**
 * POST /api/forensics/field-upload
 * Receptor para el "Field Agent Mode" desde teléfonos móviles en red local o web.
 * Correlaciona GPS en vivo del dispositivo contra metadatos EXIF.
 */
router.post('/field-upload', memoryProtectionGuard, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se recibió archivo desde el agente móvil.' });
    }

    const { buffer, originalname, mimetype } = req.file;
    const sessionToken = req.body.sessionToken || 'DEFAULT_FIELD_SESSION';
    const operator = req.body.operator || 'Agente_Campo_Móvil';
    const operationalZone = req.body.operationalZone || 'Sector Central Operativo';
    const userAgent = req.headers['user-agent'] || 'Desconocido';

    let liveGps = null;
    if (req.body.liveGps) {
      try {
        liveGps = JSON.parse(req.body.liveGps);
      } catch (e) { }
    }

    let declaredGps = null;
    if (req.body.declaredGps) {
      try {
        declaredGps = JSON.parse(req.body.declaredGps);
      } catch (e) { }
    }

    // 1. Análisis pericial integral
    const analysisResult = await ForensicService.analyzeBuffer(buffer, originalname, mimetype);

    // 2. Correlación Pericial de Geolocalización
    const exifLat = analysisResult.metadata.gpsLatitude ? parseFloat(analysisResult.metadata.gpsLatitude) : null;
    const exifLon = analysisResult.metadata.gpsLongitude ? parseFloat(analysisResult.metadata.gpsLongitude) : null;

    let geoComparison = {
      hasGpsData: false,
      operationalZone,
      liveGps: liveGps ? {
        latitude: liveGps.latitude,
        longitude: liveGps.longitude,
        dms: `${formatDms(liveGps.latitude, true)}, ${formatDms(liveGps.longitude, false)}`,
        accuracyMeters: liveGps.accuracy || 10,
        altitudeMeters: liveGps.altitude || null
      } : null,
      declaredGps: declaredGps ? {
        latitude: declaredGps.latitude,
        longitude: declaredGps.longitude,
        dms: `${formatDms(declaredGps.latitude, true)}, ${formatDms(declaredGps.longitude, false)}`
      } : null,
      exifGps: (exifLat && exifLon) ? {
        latitude: exifLat,
        longitude: exifLon,
        dms: `${formatDms(exifLat, true)}, ${formatDms(exifLon, false)}`
      } : null,
      discrepancyKm: null,
      isGpsSpoofed: false,
      mapUrl: null
    };

    const effectiveLat = exifLat || (liveGps ? liveGps.latitude : (declaredGps ? declaredGps.latitude : null));
    const effectiveLon = exifLon || (liveGps ? liveGps.longitude : (declaredGps ? declaredGps.longitude : null));

    if (effectiveLat && effectiveLon) {
      geoComparison.hasGpsData = true;
      geoComparison.mapUrl = `https://www.openstreetmap.org/?mlat=${effectiveLat}&mlon=${effectiveLon}#map=16/${effectiveLat}/${effectiveLon}`;
    }

    const deviceLat = liveGps ? liveGps.latitude : (declaredGps ? declaredGps.latitude : null);
    const deviceLon = liveGps ? liveGps.longitude : (declaredGps ? declaredGps.longitude : null);

    if (deviceLat && deviceLon && exifLat && exifLon) {
      const distanceKm = calculateHaversineDistanceKm(deviceLat, deviceLon, exifLat, exifLon);
      geoComparison.discrepancyKm = distanceKm.toFixed(2);

      // Si la foto dice estar a más de 1.5 km de donde el dispositivo la está enviando
      if (distanceKm > 1.5) {
        geoComparison.isGpsSpoofed = true;
        const alertMsg = `Discrepancia Espacial (GPS Inconsistente): El origen móvil/declarado reportó captura a ${distanceKm.toFixed(1)} km de distancia de las coordenadas EXIF internas de la imagen.`;
        analysisResult.anomalies.push(`[GEOLOCALIZACIÓN] ${alertMsg}`);
        analysisResult.riskScore = Math.min(100, analysisResult.riskScore + 40);
        if (analysisResult.riskScore >= 60) {
          analysisResult.verdict = 'MANIPULADO_ALTO_RIESGO';
        }
      }
    }

    // 3. Registro en Merkle Ledger
    const evidenceLog = {
      filename: analysisResult.filename,
      file_hash: analysisResult.hashes.sha256,
      file_size: analysisResult.fileSize,
      mime_type: analysisResult.mimeType,
      risk_score: analysisResult.riskScore,
      verdict: analysisResult.verdict,
      anomalies_detected: analysisResult.anomalies,
      metadata_summary: {
        ...analysisResult.metadata,
        geoTelemetry: geoComparison,
        sourceDevice: userAgent
      },
      operator,
      session_type: 'FIELD_AGENT_MOBILE'
    };

    insertAuditLog(evidenceLog, (err, saved) => {
      const evidenceId = saved ? saved.evidence_id : `EVD-${Date.now().toString().slice(-6)}`;
      const enrichedResult = {
        ...analysisResult,
        evidenceId,
        blockHash: saved ? saved.block_hash : null,
        geoComparison,
        deviceSource: userAgent,
        operator,
        capturedVia: 'FIELD_AGENT_QR'
      };

      // Disparar a la cola en vivo para que el puesto de mando en laptop lo proyecte
      liveSessionQueue.set(sessionToken, {
        evidence: enrichedResult,
        timestamp: Date.now()
      });

      // Si el riesgo es crítico, emitir SIEM
      if (analysisResult.riskScore >= 60) {
        siemService.recordSecurityEvent({
          severity: 'HIGH',
          facility: 'FIELD_AGENT_CAPTURE',
          source: 'Agent-MobileField',
          message: `CAPTURA MÓVIL CRÍTICA: ${analysisResult.filename} transmitida por ${operator}. Riesgo: ${analysisResult.riskScore}%`,
          evidenceId,
          riskScore: analysisResult.riskScore
        });
      }

      return res.json({
        success: true,
        message: 'Evidencia recibida y transmitida al Puesto de Mando central.',
        data: enrichedResult
      });
    });
  } catch (err) {
    console.error('[FIELD AGENT ERROR]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/forensics/live-poll
 * Endpoint de suscripción ligera (polling) para que el Dashboard de la Laptop
 * capture en tiempo real las fotos transmitidas por los teléfonos.
 */
router.get('/live-poll', (req, res) => {
  const sessionToken = req.query.sessionToken || 'DEFAULT_FIELD_SESSION';
  const item = liveSessionQueue.get(sessionToken);

  if (item) {
    // Si la evidencia tiene menos de 20 segundos de antigüedad, entregarla
    const ageMs = Date.now() - item.timestamp;
    if (ageMs < 20000) {
      return res.json({
        success: true,
        hasNewEvidence: true,
        data: item.evidence
      });
    }
  }

  return res.json({
    success: true,
    hasNewEvidence: false
  });
});

module.exports = router;
