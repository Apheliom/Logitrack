/**
 * SecuriTrace - Forensic Friendly Spanish Formatter & Mojibake Decoder
 * Transforma códigos técnicos, marcas temporales binarias de PDF y caracteres
 * UTF-16BE (mojibake) en español natural, profesional y riguroso para dictámenes periciales.
 */

const SPANISH_MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

/**
 * Decodifica caracteres chinos / CJK producidos por inversión de bytes UTF-16BE en PDFs
 * Ejemplo: "䰀椀戀爀攀伀昀昀椀挀攀" -> "LibreOffice", "圀爀椀琀攀爀" -> "Writer", "䝯潧汥⁌䱍" -> "Google LLM"
 */
export function humanizeForensicText(text) {
  if (!text || typeof text !== 'string') return text;

  // Si contiene caracteres en el rango CJK unificado
  if (/[\u4E00-\u9FFF\u3000-\u303F]/.test(text)) {
    try {
      let decoded = '';
      for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        const lowByte = code & 0xFF;
        const highByte = (code >> 8) & 0xFF;

        // Inversión de bytes para caracteres ASCII legibles
        if (lowByte >= 32 && lowByte <= 126) decoded += String.fromCharCode(lowByte);
        if (highByte >= 32 && highByte <= 126) decoded += String.fromCharCode(highByte);
      }
      const cleaned = decoded.replace(/\s+/g, ' ').trim();
      if (cleaned.length > 1) {
        return cleaned;
      }
    } catch (e) {
      // Retorna original si falla
    }
  }

  // Traducción amigable de términos técnicos comunes
  const lower = text.toLowerCase().trim();
  if (lower === 'no registrado (sensor ausente)' || lower === 'no registrado') {
    return 'Sin sensor de cámara física (Generado por software o IA)';
  }
  if (lower === 'sin software registrado' || lower === 'no especificado') {
    return 'No declarado en cabeceras de archivo';
  }
  if (lower === 'no disponible (stripped)' || lower === 'no disponible' || lower === 'no declarada') {
    return 'No registrada en el archivo (Metadato ausente o suprimido)';
  }

  return text;
}

/**
 * Convierte cualquier fecha forense (PDF D:20261118194925+00'00', EXIF 2024:03:15, o ISO)
 * a formato extendido en español: "18 de noviembre de 2026, 07:49:25 PM"
 */
export function humanizeForensicDate(rawDate) {
  if (!rawDate) return 'No registrada en el archivo';

  const str = String(rawDate).trim();
  const lower = str.toLowerCase();

  if (
    lower.includes('no disponible') ||
    lower.includes('no declarada') ||
    lower.includes('stripped') ||
    lower === 'n/a'
  ) {
    return 'No registrada en el archivo (Metadato ausente o suprimido)';
  }

  // 1. Formato nativo PDF: D:20261118194925+00'00' o D:20150210015815Z
  const pdfMatch = str.match(/(?:D:)?(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (pdfMatch) {
    const [, year, month, day, hour, min, sec] = pdfMatch;
    const mIdx = parseInt(month, 10) - 1;
    const monthName = SPANISH_MONTHS[mIdx] || month;
    const hNum = parseInt(hour, 10);
    const ampm = hNum >= 12 ? 'PM' : 'AM';
    const h12 = hNum % 12 || 12;
    const hStr = h12 < 10 ? `0${h12}` : `${h12}`;

    let tzText = 'Hora Oficial UTC';
    if (str.includes('+') || str.includes('-')) {
      const tzMatch = str.match(/([+-]\d{2}'?\d{2}'?)/);
      if (tzMatch) tzText = `Zona Horaria ${tzMatch[1].replace(/'/g, '')}`;
    }

    return `${parseInt(day, 10)} de ${monthName} de ${year}, ${hStr}:${min}:${sec} ${ampm} (${tzText})`;
  }

  // 2. Formato EXIF estándar: 2024:03:15 14:30:00
  const exifMatch = str.match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (exifMatch) {
    const [, year, month, day, hour, min, sec] = exifMatch;
    const mIdx = parseInt(month, 10) - 1;
    const monthName = SPANISH_MONTHS[mIdx] || month;
    const hNum = parseInt(hour, 10);
    const ampm = hNum >= 12 ? 'PM' : 'AM';
    const h12 = hNum % 12 || 12;
    const hStr = h12 < 10 ? `0${h12}` : `${h12}`;
    return `${parseInt(day, 10)} de ${monthName} de ${year}, ${hStr}:${min}:${sec} ${ampm}`;
  }

  // 3. Formato ISO estándar: 2026-11-18T19:49:25.000Z
  const parsedDate = new Date(str);
  if (!isNaN(parsedDate.getTime())) {
    const day = parsedDate.getDate();
    const monthName = SPANISH_MONTHS[parsedDate.getMonth()];
    const year = parsedDate.getFullYear();
    const hNum = parsedDate.getHours();
    const ampm = hNum >= 12 ? 'PM' : 'AM';
    const h12 = hNum % 12 || 12;
    const hStr = h12 < 10 ? `0${h12}` : `${h12}`;
    const min = parsedDate.getMinutes() < 10 ? `0${parsedDate.getMinutes()}` : parsedDate.getMinutes();
    const sec = parsedDate.getSeconds() < 10 ? `0${parsedDate.getSeconds()}` : parsedDate.getSeconds();
    return `${day} de ${monthName} de ${year}, ${hStr}:${min}:${sec} ${ampm}`;
  }

  return humanizeForensicText(str);
}

/**
 * Traduce campos técnicos adicionales (Espacio de color, ISO, Dimensiones)
 */
export function humanizeTechnicalParam(key, value) {
  if (!value || value === 'N/A' || value === 'ISO N/A | N/A' || value === 'N/AxN/A') {
    if (key === 'iso') return 'No aplica (Sin sensor óptico analógico)';
    if (key === 'dimensions') return 'Dimensiones dinámicas (Documento vectorial)';
    if (key === 'colorSpace') return 'sRGB Estándar (Color Digital Web)';
    return 'No aplica';
  }

  const str = String(value);

  if (key === 'colorSpace') {
    if (str.includes('sRGB')) return 'sRGB Estándar (Gama de Color Digital Web)';
    if (str.includes('Uncalibrated')) return 'Gama Personalizada / Sin Calibrar';
  }

  return humanizeForensicText(str);
}

/**
 * Traduce las categorías predictivas estructuradas del motor FCE v3.0 a rótulos periciales de alta claridad
 */
export function humanizePredictiveCategory(category) {
  if (!category) return 'NO CLASIFICADO';
  switch (category) {
    case 'FOTO_REAL_MANIPULADA_CON_IA':
      return 'FOTOGRAFÍA REAL MANIPULADA CON IA (INPAINTING / GENERATIVE FILL)';
    case 'SINTETICO_IA_GENERATIVA':
      return 'SINTÉTICO POR IA GENERATIVA (MODELO DE DIFUSIÓN / NEURONAL)';
    case 'ALTERACION_MANUAL_RETOQUE':
      return 'ALTERACIÓN MANUAL / FOTOMONTAJE GRÁFICO';
    case 'TRANSITO_RED_SOCIAL_SANITIZADO':
      return 'TRÁNSITO POR RED SOCIAL (METADATOS PURGADOS POR PLATAFORMA)';
    case 'CAPTURA_OPTICA_GENUINA':
      return 'CAPTURA ÓPTICA GENUINA (INTEGRIDAD SENSOR CONFIRMADA)';
    case 'PDF_SINTETICO_LLM':
      return 'DOCUMENTO SINTÉTICO (GENERADO POR LLM / MOTOR VIRTUAL)';
    default:
      return category;
  }
}
