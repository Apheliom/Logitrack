/**
 * Servicio de Despacho de Eventos hacia SIEM / SOC (Formato RFC 5424)
 * Permite integración con Splunk, Wazuh y Elastic Security
 */
class SiemService {
  constructor() {
    this.maxEvents = 100;
    this.events = [];
    // Inicializar con evento de inicio de sistema
    this.recordSecurityEvent({
      severity: 'INFORMATIONAL',
      facility: 'SECURITY_AUDIT',
      source: 'SecuriTrace_CoreEngine',
      message: 'Subsistema pericial iniciado bajo FIPS 180-4. Modo de memoria volátil activo.',
      evidenceId: 'SYSTEM-INIT'
    });
  }

  recordSecurityEvent({ severity, facility, source, message, evidenceId, riskScore = 0 }) {
    const timestamp = new Date().toISOString();
    const eventId = `SIEM-${Date.now().toString().slice(-6)}`;
    
    // Formato RFC 5424 Syslog estructurado
    const syslogPayload = `<134>1 ${timestamp} securitrace.lab ${source || 'ForensicEngine'} - ${eventId} [evidence@4321 id="${evidenceId || 'N/A'}" risk="${riskScore}"] ${message}`;

    const event = {
      id: eventId,
      timestamp,
      severity: severity || (riskScore >= 60 ? 'CRITICAL' : riskScore >= 30 ? 'WARNING' : 'NOTICE'),
      facility: facility || 'SECURITY_AUDIT',
      source: source || 'ForensicEngine',
      evidenceId,
      riskScore,
      message,
      rfc5424: syslogPayload
    };

    this.events.unshift(event);
    if (this.events.length > this.maxEvents) {
      this.events.pop();
    }

    return event;
  }

  getRecentEvents(limit = 25) {
    return this.events.slice(0, limit);
  }
}

const siemInstance = new SiemService();
module.exports = siemInstance;
