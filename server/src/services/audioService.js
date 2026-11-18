const crypto = require('crypto');

/**
 * Servicio Forense de Verificación Acústica, Video y Detección de Deepfakes Multimodales
 */
class AudioService {
  /**
   * Analiza la estructura binaria de un archivo WAV/RIFF
   */
  static parseWavHeader(buffer) {
    if (buffer.length < 44) return null;

    const riff = buffer.toString('ascii', 0, 4);
    const wave = buffer.toString('ascii', 8, 12);

    if (riff !== 'RIFF' || wave !== 'WAVE') return null;

    const audioFormat = buffer.readUInt16LE(20);
    const numChannels = buffer.readUInt16LE(22);
    const sampleRate = buffer.readUInt32LE(24);
    const byteRate = buffer.readUInt32LE(28);
    const blockAlign = buffer.readUInt16LE(32);
    const bitsPerSample = buffer.readUInt16LE(34);

    return {
      audioFormat: audioFormat === 1 ? 'PCM (Sin comprimir)' : `Compresión Tipo ${audioFormat}`,
      numChannels: numChannels === 1 ? 'Mono (Típico de entrenamiento IA)' : 'Estéreo',
      sampleRate: `${sampleRate} Hz`,
      sampleRateRaw: sampleRate,
      bitsPerSample: `${bitsPerSample} bits`,
      durationSeconds: ((buffer.length - 44) / byteRate).toFixed(2)
    };
  }

  /**
   * Escanea firmas binarias de síntesis de voz y video en contenedores multimedia
   */
  static scanBinaryForAudioAIFingerprints(buffer, filename) {
    const findings = [];
    const lowerName = filename.toLowerCase();
    const str = buffer.subarray(0, Math.min(buffer.length, 65536)).toString('binary').toLowerCase();

    // 1. Detección en nombre de archivo
    if (lowerName.includes('elevenlabs') || lowerName.includes('eleven_labs')) {
      findings.push('Nomenclatura identificada: Síntesis de voz por ElevenLabs');
    }
    if (lowerName.includes('suno') || lowerName.includes('udio')) {
      findings.push('Nomenclatura identificada: Generación musical por IA (Suno / Udio)');
    }
    if (lowerName.includes('rvc') || lowerName.includes('voice_clone')) {
      findings.push('Nomenclatura identificada: Clonación de voz Retrieval-based Voice Conversion (RVC)');
    }
    if (lowerName.includes('sora') || lowerName.includes('runway') || lowerName.includes('kling') || lowerName.includes('pika')) {
      findings.push('Nomenclatura identificada: Video sintético generado por IA (Sora/Runway/Kling)');
    }

    // 2. Firmas binarias en tags ID3 / Chunks RIFF / Atoms MP4
    if (str.includes('elevenlabs') || str.includes('eleven_labs')) {
      findings.push('Firma incrustada en metadatos de audio: ElevenLabs AI Voice Engine');
    }
    if (str.includes('tortoise') || str.includes('tacotron') || str.includes('vits')) {
      findings.push('Firma de modelo acústico neuronal detectada en cabecera binaria');
    }
    if (str.includes('suno') || str.includes('chirp-v3')) {
      findings.push('Metadatos de generación musical por IA Suno Chirp');
    }

    return findings;
  }

  /**
   * Evalúa métricas de síntesis por voz artificial (Deepfake / TTS)
   */
  static evaluateAudioIntegrity(buffer, filename, frequencyStats = null) {
    const anomalies = [];
    let riskScore = 0;
    const wavInfo = this.parseWavHeader(buffer);
    const binaryFindings = this.scanBinaryForAudioAIFingerprints(buffer, filename);

    // 1. Integrar hallazgos binarios de IA
    if (binaryFindings.length > 0) {
      riskScore += 85;
      binaryFindings.forEach(f => anomalies.push(f));
    }

    // 2. Análisis de tasa de muestreo típica de vocoders neuronales
    if (wavInfo && (wavInfo.sampleRateRaw === 16000 || wavInfo.sampleRateRaw === 22050 || wavInfo.sampleRateRaw === 24000)) {
      riskScore += 30;
      anomalies.push(`Frecuencia de muestreo nativa (${wavInfo.sampleRateRaw} Hz) coincidente con estándares de inferencia de modelos neuronales (FastSpeech/VITS/Tacotron)`);
    }

    // 3. Si se transmitieron estadísticas de análisis espectral del cliente (Web Audio FFT)
    if (frequencyStats) {
      const { highFreqRatio, dynamicRange, spectralEntropy, flatness } = frequencyStats;

      if (highFreqRatio !== undefined && highFreqRatio < 0.04) {
        riskScore += 45;
        anomalies.push('Corte abrupto en el espectro de altas frecuencias (>8 kHz) indicativo de ancho de banda restringido por vocoder neuronal');
      }

      if (spectralEntropy !== undefined && (spectralEntropy < 0.25 || spectralEntropy > 0.95)) {
        riskScore += 30;
        anomalies.push('Entropía espectral fuera de la curva fonética humana (varianza armónica artificial o hiper-regularizada)');
      }

      if (flatness !== undefined && flatness > 0.45) {
        riskScore += 20;
        anomalies.push('Planitud espectral anómala (ruido estocástico plano en lugar de formantes resonantes de tracto vocal)');
      }
    } else {
      // Cálculo de entropía binaria del buffer
      let entropy = 0;
      const sampleSize = Math.min(buffer.length, 65536);
      const byteCounts = new Uint32Array(256);
      for (let i = 0; i < sampleSize; i++) {
        byteCounts[buffer[i]]++;
      }
      for (let i = 0; i < 256; i++) {
        if (byteCounts[i] > 0) {
          const p = byteCounts[i] / sampleSize;
          entropy -= p * Math.log2(p);
        }
      }

      if (entropy > 7.7) {
        riskScore += 25;
        anomalies.push('Entropía binaria elevada sin degradación analógica (característica de síntesis por convolución digital)');
      }
    }

    riskScore = Math.min(100, Math.max(0, riskScore));

    let verdict = 'VOZ_HUMANA_NATURAL';
    if (riskScore >= 60) {
      verdict = 'VOZ_SINTETICA_DEEPFAKE';
    } else if (riskScore >= 30) {
      verdict = 'VOZ_CON_ANOMALIAS_ESPECTRALES';
    }

    const authenticityScore = Math.max(0, 100 - riskScore);

    return {
      riskScore,
      authenticityScore,
      verdict,
      anomalies,
      wavInfo: wavInfo || { format: 'Audio Comprimido / Stream WebAudio / Video Track' }
    };
  }

  /**
   * Procesa la muestra de audio/video y genera dictamen pericial
   */
  static processAudioSample(buffer, originalname, mimetype, clientStats = null) {
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const evaluation = this.evaluateAudioIntegrity(buffer, originalname, clientStats);

    return {
      filename: originalname,
      fileSize: buffer.length,
      mimeType: mimetype,
      sha256,
      wavInfo: evaluation.wavInfo,
      riskScore: evaluation.riskScore,
      authenticityScore: evaluation.authenticityScore,
      verdict: evaluation.verdict,
      anomalies: evaluation.anomalies,
      analyzedAt: new Date().toISOString()
    };
  }
}

module.exports = AudioService;
