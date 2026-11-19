/**
 * Servicio Pericial de Análisis Multimodal Forense impulsado por IA
 * Inspecciona anomalías semánticas, artefactos de difusión, coherencia física
 * y valida autenticidad de capturas de pantalla de interfaces vs creaciones/ediciones sintéticas.
 */

const FALLBACK_MODELS = [
  'gemini-3-flash-preview',
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash'
];

class AiForensicReportService {
  /**
   * Obtiene la API Key activa del entorno o del usuario
   */
  static getApiKey(customApiKey) {
    const key = customApiKey || process.env.GEMINI_API_KEY;
    if (!key || key.trim() === '') {
      return null;
    }
    return key.trim();
  }

  /**
   * Ejecuta la pericia multimodal completa sobre la imagen
   * @param {Buffer} buffer - Buffer binario de la imagen
   * @param {string} mimetype - Tipo MIME (e.g. image/jpeg, image/png)
   * @param {string} originalname - Nombre del archivo
   * @param {string} customApiKey - API Key provista por el usuario (opcional)
   * @param {object} metadata - Metadatos forenses previos (hash, dimensiones)
   */
  static async analyzeWithMultimodalAI(buffer, mimetype, originalname, customApiKey = null, metadata = {}) {
    const apiKey = this.getApiKey(customApiKey);

    if (!apiKey) {
      return {
        ai_enabled: false,
        status: 'REQUIRES_API_KEY',
        message: 'Para activar la inspección semántica por IA y el informe pericial judicial, configure una clave de Google Gemini.'
      };
    }

    const promptPericial = `
Eres un Perito Forense Digital Judicial Colegiado y Especialista en Detección de Falsificaciones Multimedia y Deepfakes.
Tu tarea es realizar una auditoría visual forense exhaustiva a la imagen adjunta para determinar con certeza científica su origen y autenticidad.

DATOS DEL ARCHIVO OBJETO DE PERICIA:
- Nombre: "${originalname}"
- Formato MIME declarado: "${mimetype}"
- Hash SHA-256: "${metadata.sha256 || 'Calculado en backend'}"

CATEGORÍAS DE DICTAMEN POSIBLES (Debes asignar exactamente UNA en el campo "veredicto"):
1. "CAPTURA_INTERFAZ_LEGITIMA": Es una captura de pantalla de un teléfono o computador mostrando una interfaz gráfica real de una aplicación (por ejemplo: comprobante de Pago Móvil de una app bancaria legítima, chat de mensajería, aplicación de notas, sistema operativo). La tipografía es nativa del sistema, los números y alineaciones son exactos de la interfaz y NO contiene una imagen generada por IA en su contenido. Riesgo: 0% a 5%.
2. "COMPROBANTE_BANCARIO_ADULTERADO": Es una captura de pantalla de un comprobante de pago o transferencia donde se alteraron manualmente los textos, montos, fechas o referencias usando edición gráfica (parches, fuentes desalineadas, resolución desigual, artefactos de borrado o reemplazo). Riesgo: 85% a 99%.
3. "FOTO_REAL_GENUINA": Es una fotografía analógica/óptica tomada por un sensor de cámara física real (incluyendo fotos tomadas por teléfonos como Tecno, Samsung, Xiaomi o iPhone con su procesamiento HDR/colorimetría normal de fábrica, o fotos transitadas por WhatsApp). Riesgo: 0% a 5%.
4. "FOTO_REAL_MANIPULADA_IA": Es una fotografía real que fue editada o alterada parcialmente mediante Inteligencia Artificial (Inpainting, Generative Fill, Face Swap, Magic Eraser, reemplazo de objetos o personas mediante difusión). Riesgo: 90% a 99%.
5. "SINTETICO_TOTAL_IA": Es una imagen generada desde cero por un modelo de Inteligencia Artificial (Midjourney, Stable Diffusion, DALL-E, Flux, etc.), INCLUYENDO si el usuario tomó una captura de pantalla a una imagen de IA, o si la imagen de IA fue enviada por WhatsApp o redes sociales. (Fijarse en: coherencia anatómica en manos/dientes/orejas, texturas de piel sintéticas, texto alienígena/ininteligible de difusores, reflejos ópticos imposibles en los ojos, iluminación inconsistente). Riesgo: 95% a 100%.

INSTRUCCIONES DE ANÁLISIS PERICIAL OBLIGATORIAS:
- Si la imagen es un COMPROBANTE DE PAGO MÓVIL o transferencia bancaria: verifica exhaustivamente si la tipografía del monto y de la referencia coincide exactamente en tamaño, espaciado kerning, pixelado y anti-aliasing con el resto de la interfaz del banco, o si fue montado un texto falso. Si es original de la app, clasifícalo como CAPTURA_INTERFAZ_LEGITIMA.
- Si la imagen es una FOTO TOMADA POR UN TELÉFONO (como un Tecno Mobile): el posprocesamiento de software de la cámara NO es manipulación con IA; debes dictaminarlo como FOTO_REAL_GENUINA a menos que contenga un objeto/rostro físicamente imposible o alterado con difusión.
- Si la imagen es una CAPTURA DE PANTALLA DE UNA IMAGEN DE IA: el marco del teléfono es secundario; lo que importa es el contenido visual. Si el contenido es una ilustración/foto creada por Midjourney o Flux, debe dictaminarse como SINTETICO_TOTAL_IA.

RESPONDE EXCLUSIVAMENTE CON UN OBJETO JSON CON LA SIGUIENTE ESTRUCTURA EXACTA:
{
  "veredicto": "CAPTURA_INTERFAZ_LEGITIMA | COMPROBANTE_BANCARIO_ADULTERADO | FOTO_REAL_GENUINA | FOTO_REAL_MANIPULADA_IA | SINTETICO_TOTAL_IA",
  "riesgo_porcentaje": 0.0,
  "indice_autenticidad": 100.0,
  "confianza_pericial": 98.5,
  "es_captura_pantalla": true,
  "es_comprobante_bancario": false,
  "anomalias_detectadas": [
    "Descripción detallada del hallazgo 1",
    "Descripción detallada del hallazgo 2"
  ],
  "elementos_analizados": {
    "coherencia_optica_iluminacion": "Explicación de fuentes de luz, sombras y reflejos en córnea/superficies",
    "coherencia_anatomica_estructural": "Explicación de anatomía (dedos, orejas, simetría facial) o geometría de interfaz",
    "tipografia_y_textos": "Explicación de nitidez, coherencia lingüística y alineación de fuentes tipográficas",
    "artefactos_de_difusion_o_edicion": "Presencia o ausencia de patrones repetitivos, ruido sintético o parches de inpainting"
  },
  "dictamen_ejecutivo": "Dictamen forense concluyente en 2 a 3 líneas explicando el origen exacto.",
  "informe_pericial_markdown": "Texto completo y formal del Dictamen Pericial Judicial en formato Markdown estructurado con secciones: ## I. IDENTIFICACIÓN DE LA EVIDENCIA, ## II. METODOLOGÍA FORENSE PERICIAL, ## III. ANÁLISIS DE ANOMALÍAS Y MICRO-PATRONES, ## IV. CONCLUSIÓN Y VALORACIÓN PROBATORIA, firmado por el 'Gabinete Pericial Informático SecuriTrace'."
}
`;

    const base64Data = buffer.toString('base64');
    const imagePart = {
      inline_data: {
        mime_type: mimetype || 'image/jpeg',
        data: base64Data
      }
    };

    let lastError = null;

    for (const modelName of FALLBACK_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: promptPericial },
                imagePart
              ]
            }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1
            }
          })
        });

        const data = await response.json();

        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          const rawText = data.candidates[0].content.parts[0].text;
          let parsedJson;
          try {
            parsedJson = JSON.parse(rawText);
          } catch (jsonErr) {
            const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            parsedJson = JSON.parse(cleanJson);
          }

          return {
            ai_enabled: true,
            status: 'SUCCESS',
            model_used: modelName,
            data: parsedJson
          };
        } else {
          lastError = data.error?.message || `Error HTTP ${response.status}`;
          console.warn(`[AiForensicReportService] Falló modelo ${modelName} (${response.status}): ${lastError}. Probando siguiente modelo...`);
        }
      } catch (networkErr) {
        lastError = networkErr.message;
        console.warn(`[AiForensicReportService] Excepción de red con ${modelName}: ${lastError}. Probando siguiente modelo...`);
      }
    }

    return {
      ai_enabled: true,
      status: 'ERROR',
      error: lastError,
      message: 'No fue posible completar la inferencia multimodal de IA con los modelos disponibles.'
    };
  }
}

module.exports = AiForensicReportService;
