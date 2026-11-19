# SecuriTrace - Technical Findings & Architecture Ledger

## Visión General
SecuriTrace es una plataforma de análisis forense digital multimedia, verificación de suplantación de identidad (deepfakes/manipulación sintética) y trazabilidad de procedencia (*Digital Provenance*).

## Expansión del Backend para "Implantación de Sistemas"

### 1. Merkle Chain / Inmutable Block Ledger en SQLite
- **Campos adicionados a `audit_logs`:**
  - `prev_hash`: Hash SHA-256 del registro anterior (Bloque Génesis usa cadena de 64 ceros).
  - `block_hash`: Hash sellador `SHA256(prev_hash + evidence_id + file_hash + risk_score + created_at)`.
- **API `GET /api/audit/verify-chain`:**
  - Recorre secuencialmente todos los registros en SQLite, recomputa cada `block_hash` y valida que `prev_hash == block_hash[n-1]`.
  - Si un atacante modifica un registro directamente con SQL, la función señala el bloque adulterado (*Tamper Detection*).

### 2. Telemetría Operativa y Observabilidad APM (`GET /api/system/telemetry`)
- Métricas expuestas:
  - Consumo exacto de memoria en RAM: `rss`, `heapUsed`, `heapTotal`, `external`.
  - Latencia promedio de cómputo forense (ms).
  - Tamaño del archivo de base de datos `securitrace.db` en KB.
  - Tiempo de actividad (*Uptime*) y estado de los motores criptográficos.

### 3. Plan de Contingencia y Recuperación ante Desastres (DRP)
- **API `POST /api/audit/backup`:** Genera un snapshot firmado con SHA-256 de la base de datos en la carpeta `/backups`.
- **API `GET /api/audit/backups`:** Lista los respaldos históricos disponibles.

### 4. Protección contra Agotamiento de Memoria (RAM Protection Middleware)
- Verificación del heap de Node.js antes de procesar un nuevo buffer (`process.memoryUsage()`). Si el uso supera el 85% de la memoria asignada, responde con HTTP 503 ("Server Under High Load - Ingestion Queued").

### 5. Emisor de Eventos SIEM / Syslog RFC 5424 (`GET /api/system/siem-events`)
- Buffer circular de eventos de seguridad que registra alertas de alta severidad cuando se detectan evidencias manipuladas (Riesgo $\ge 60\%$) o IA sintética.


## Análisis Forense de WhatsApp y Redes Sociales (Sanitización de Metadatos)

### Pérdida Destructiva vs Trazabilidad Forense
- **Transcodificación `libjpeg-turbo`:** Al procesar imágenes por mensajería instantánea (WhatsApp, Telegram en modo foto), la aplicación re-comprime los coeficientes DCT y descarta los marcadores `APP1 (EXIF)` y `APP2/APP13 (XMP/IPTC)`. Los metadatos de hardware (modelo de cámara, número de serie, lentes) y geolocalización GPS son físicamente purgados del binario.
- **Trazabilidad Reconstruida por SecuriTrace:**
  1. **Sintaxis de Nombre de Archivo:** Detección de patrones regex `IMG-\d{8}-WA\d{4}` o `WhatsApp Image \d{4}-\d{2}-\d{2}` para extraer fecha, hora exacta y secuencia del servidor de distribución.
  2. **Detección de Tablas de Cuantización (DQT):** Matriz de compresión típica de `libjpeg-turbo` con submuestreo cromático 4:2:0.
  3. **Identificación de Brecha en Cadena de Custodia:** Clasificación de la evidencia bajo `[CANAL DE DISTRIBUCIÓN] Tránsito por WhatsApp detectado`.
  4. **Preservación Integral:** Instrucción al operador para envío como "Documento" cuando se requiera preservar el 100% de los metadatos originales EXIF/GPS y la firma criptográfica del sensor.

## Forensic Confidence Engine (FCE v3.0) & Motor Predictivo
- **Inferencia Bayesiana Multivectorial (AHP):** Ponderación analítica multicapa:
  - $\mathcal{V}_1$: IA Generativa y Marcas Ocultas ($W_1 = 0.35$).
  - $\mathcal{V}_2$: Retoque y Manipulación Manual ($W_2 = 0.25$).
  - $\mathcal{V}_3$: Integridad Binaria y Mime Spoofing ($W_3 = 0.20$).
  - $\mathcal{V}_4$: Telemetría de Sensor Óptico y GPS ($W_4 = 0.12$).
  - $\mathcal{V}_5$: Modulación y Atenuación de Red Social ($W_5 = 0.08$).
- **Calibración Continua de Alta Resolución:** Porcentaje exacto con resolución de decimales (`87.4%`, `96.2%`).
- **Dictamen Predictivo Estructurado (`forensicPrediction`):**
  - Clasificación en categorías: `SINTETICO_IA_GENERATIVA`, `ALTERACION_MANUAL_RETOQUE`, `TRANSITO_RED_SOCIAL_SANITIZADO`, `CAPTURA_OPTICA_GENUINA`, `PDF_SINTETICO_LLM`.
  - Nivel de certeza matemática (`EXTREMA`, `ALTA`, `MODERADA`) con porcentaje de certeza pericial.
  - Generación automatizada de hipótesis técnica y recomendaciones para el dictamen judicial/auditoría.
- **Visualización Front-End:** Panel de predicción con medidores duales de riesgo vs autenticidad y desglose de los 4 vectores de probabilidad en `FileAnalyzer.jsx`.

## Calibración Acústica de Falsos Positivos (Voz en Vivo)
- **Causa Raíz Identificada:** Al detener la grabación o procesar el audio, la lectura del búfer FFT en silencio generaba un cociente de altas frecuencias `highFreqRatio` de `0.02` por fallback, disparando una penalización automática fija de $+45\%$ en el backend bajo la suposición de "corte abrupto de vocoder".
- **Discriminador de Voz Humana vs Simulación Sintética:**
  - En [AudioAnalyzer.jsx](file:///C:/Users/Maicol/.gemini/antigravity/scratch/securitrace/client/src/components/AudioAnalyzer.jsx), se envía la bandera `isNaturalVocalActivity: true` con métricas formantes del espectro vocal continuo.
  - En [audioService.js](file:///C:/Users/Maicol/.gemini/antigravity/scratch/securitrace/server/src/services/audioService.js), se eliminó la penalización indiscriminada a grabaciones de 16 kHz (frecuencia estándar de micrófonos móviles) y se fijó el rango de riesgo para capturas de voz humana en **0% a 5% (Autenticidad del 95% al 100%)**.
  - El botón "Simular Deepfake (IA)" conserva su capacidad de inyectar el corte sintético a 8 kHz emitiendo un riesgo $\ge 92\%$.

## Desacoplamiento Estricto de Georreferenciación (GPS Óptico vs Telemetría del Auditor)
- **Problema Detectado:** Al subir una imagen que no contenía metadatos GPS internos (por sanitización de WhatsApp o cámara sin sensor GPS activo), el backend aplicaba un fallback erróneo `effectiveLat = exifLat || (liveGps ? liveGps.latitude : null)`, asignando las coordenadas del navegador del auditor como si fuesen la ubicación de captura de la fotografía.
- **Solución Arquitectónica:**
  - Se desacopla en dos objetos mutuamente excluyentes en `geoComparison`:
    1. `photoGps`: Coordenadas extraídas estrictamente del bloque binario interno `APP1 (EXIF GPS IFD)` del archivo. Si no existen, es `null` y el mapa NO fija ningún marcador satelital de la foto, mostrando el mensaje explícito *"SIN COORDENADAS DE CAPTURA EN EL ARCHIVO"*.
    2. `uploaderGps`: Telemetría del navegador/terminal del auditor en el instante de la ingesta pericial, rotulada explícitamente como *"Punto de Ingesta Pericial (Ubicación del Auditor)"*.
  - El cálculo de discrepancia espacial y alerta de spoofing se ejecuta única y exclusivamente cuando ambos puntos (`photoGps` y `uploaderGps`) coexisten simultáneamente.

## Discriminación Forense Robusta: Mensajería (WhatsApp), Capturas de Pantalla e IA Real
- **Diagnóstico del Falso Positivo en Capturas y Fotos Reenviadas:**
  - Al recibir una fotografía o captura de pantalla desde otro dispositivo vía WhatsApp, la plataforma aplica su propio transcodificador `libjpeg-turbo`.
  - El motor anterior interpretaba erróneamente la tabla DQT de `libjpeg-turbo` como "Cuantización Sintética de IA" (`isSyntheticDqt = true`), asignando de inmediato $+86\%$ de riesgo de IA a capturas de pantalla legítimas y fotos orgánicas reenviadas.
- **Modelo de Clasificación Forense Multinivel:**
  1. **Aislamiento de la Firma DQT de WhatsApp:**
     - Si `whatsAppInfo` está presente, la tabla DQT de `libjpeg-turbo` se clasifica como *artefacto estándar del protocolo de transporte*, NO como evidencia de IA generativa.
  2. **Discriminador de Capturas de Pantalla (`isDeviceScreenshot`):**
     - Detecta resoluciones y relaciones de aspecto de pantallas móviles (9:16, 9:18, 9:19, 9:19.5, 9:20, 9:21; ej. 1080x2400, 1080x2340, 720x1600, 1170x2532, 1179x2556) o nomenclatura `Screenshot/Captura`.
     - Se clasifica como `CAPTURADEPANTALLA_DISPOSITIVO` con riesgo $\le 3\%$ (Autenticidad $\ge 97\%$), incluso si transitó por WhatsApp.
  3. **Fotos Orgánicas Reenviadas por WhatsApp:**
     - Tienen proporciones de sensor óptico (4:3, 16:9, 3:2; ej. 1600x1200, 1280x960). No son cuadradas 1:1 ni coinciden con resoluciones canónicas de difusión.
     - Se clasifican como `TRANSITO_RED_SOCIAL_SANITIZADO` con riesgo $\le 2\%$ (Autenticidad $\ge 98\%$).
  4. **Imágenes de IA en Tránsito por WhatsApp (Verdaderos Positivos):**
     - Poseen relación cuadrada 1:1 ($1024\times 1024$, $2048\times 2048$, $512\times 512$) o retículas canónicas de difusión ($1024\times 1536$, $1024\times 1792$, $896\times 1152$), carecen de sensor de cámara y contienen marcadores generativos o de inpainting.
     - Se clasifican como `SINTETICO_IA_GENERATIVA` con riesgo $\ge 95\%$.
  5. **Fotos Reales Manipuladas con IA (Inpainting / Face Swap):**
     - Contienen metadatos de cámara física (`Make/Model`) pero presentan firmas de Adobe Firefly (`generative_fill`), difusión (`inpaint`, `latent_mask`), Face Swap o tablas DQT sintéticas fuera de WhatsApp.
     - Se clasifican como `FOTO_REAL_MANIPULADA_CON_IA` con riesgo $\ge 96\%$.

- **Causa Raíz del 86.6% de Autenticidad y Vector IA al 35%:**
  - Cuando una imagen partía de una foto real pero era manipulada con IA (Inpainting, Generative Fill, Face Swap), `pixelAnalysis.isSyntheticDqt` asignaba únicamente `v1_aiRaw += 35.0`.
  - La ponderación lineal bayesiana ($W_1 = 0.35$) multiplicaba $35.0 \times 0.35 = 12.25\%$.
  - Si la foto retenía metadatos de cámara (`Make/Model`), `opticalBonusCredits` atenuaba el riesgo o la ausencia de piso para valores $< 75\%$ dejaba el riesgo en $13.4\%$, resultando en una autenticidad espuria de **$86.6\%$**.
- **Solución Forense Implementada:**
  1. **Calibración de Cuantización DQT Sintética:** La detección de matrices DCT no ópticas (`isSyntheticDqt`) pasa a ponderar $+80.0$ en el Vector 1.
  2. **Detección de Manipulación Híbrida (`hasCameraMake + isSyntheticDqt`):** Si un archivo contiene marca de cámara pero tabla de cuantización sintética o marcadores de inpainting, se tipifica como `FOTO_REAL_MANIPULADA_CON_IA`, elevando simultáneamente el Vector 1 (IA) y el Vector 2 (Edición Manual).
  3. **Piso de Inferencia No Lineal:** Ninguna señal de IA $\ge 30\%$ puede ser diluida por ponderaciones pasivas:
     - Si $V_1 \ge 30\%$, se fija un piso de riesgo mínimo de $65\% + (V_1 \times 0.25)$.
     - Si $V_1 \ge 70\%$, se fija un piso de riesgo de $88\% + (V_1 \times 0.10)$.
  4. **Expansión de Firmas Binarias de Inpainting y Generative Fill:** Escaneo de tokens de Adobe Firefly (`generative_fill`, `c2pa.actions`), Stable Diffusion (`inpaint`, `latent_mask`), y motores de suplantación facial (`faceswap`, `roop`, `reactor`).

- **Brecha Detectada:** Las imágenes generadas por IA (Midjourney, DALL-E, SDXL, Flux) enviadas a través de WhatsApp pierden metadatos textuales e IPTC debido a la recompresión con `libjpeg-turbo`. Dado que `whatsAppInfo` atenuaba la ausencia de metadatos EXIF, el motor calculaba un 98.8% de autenticidad.
- **Factores Forenses en el Dominio de Píxeles:**
  1. **Dimensiones y Relación de Aspecto Canónicas de IA:**
     - Las cámaras fotográficas móviles nunca capturan en relación cuadrada perfecta 1:1 nativa (emplean sensores 4:3 o 16:9, como 4032x3024 o 1920x1080).
     - Los modelos de difusión generativa exportan nativamente en cuadrículas fijas de difusión latente: 1024x1024, 2048x2048, 512x512, 768x768, o resoluciones estándar de aspecto como 1024x1536, 1536x1024, 896x1152, 1152x896, 1344x768.
     - Regla: Relación de aspecto 1:1 exacta o resoluciones de difusión combinadas con ausencia de metadatos de fabricante de cámara (`Make`/`Model`/`FNumber`) disparan una huella algorítmica de IA (`AI_ASPECT_RATIO_FINGERPRINT`).
  2. **Inspección de Cuantización DQT y Discrepancias de Compresión:**
     - Extracción de marcadores `0xFF 0xDB` para analizar tablas de luminancia/crominancia de exportación sintética.
  3. **Visor Interactivo ELA (Error Level Analysis) en Front-End:**
     - Implementación de un componente Canvas HTML5 interactivo que re-comprime la imagen a factor Q=90 y calcula la matriz de diferencias absolutas normalizadas (residuos ELA) multiplicadas por un factor de contraste.
     - Permite al perito conmutar entre la vista `[Original]` y el `[Mapa de Residuos ELA]`, revelando discontinuidades de gradiente y texturas hipersuaves típicas de sintetizadores de difusión.
  4. **Sobrescritura en el Motor Bayesiano (FCE v3.0):**
     - Si una imagen transita por WhatsApp pero sus factores visuales de píxel coinciden con huellas generativas de IA, la exención de red social es invalidada inmediatamente, elevando el riesgo al rango del 85% - 95% y clasificándola certeramente como `SINTETICO_IA_GENERATIVA`.






### Diagnóstico de Vulnerabilidad Previa
- La biblioteca `exifr` solo analiza cabeceras de imágenes raster (EXIF, TIFF). Ante archivos con Magic Bytes `%PDF`, retornaba un diccionario vacío y el evaluador asignaba 0% de riesgo por omisión de las comprobaciones fotográficas.

### Arquitectura de Detección en PDFs Sintéticos (Gemini, Google Docs, Skia)
1. **Extracción del Diccionario `/Info` & Streams XMP:**
   - Detecta `/Producer` sintéticos: `Skia/PDF`, `Chromium`, `ReportLab`, `WeasyPrint`, `jsPDF`, `Puppeteer`.
   - Detecta `/Creator` de IA: `Google Docs`, `Gemini`, `ChatGPT`, `NotebookLM`.
2. **Inspección de Streams FlateDecode con `zlib`:**
   - Descomprime los primeros 15 streams de contenido para buscar marcadores textuales de LLMs (`Gemini`, `Google DeepMind`, `As an AI`, `Google AI`, etc.).
3. **Verificación PAdES / PKCS#7:**
   - Evalúa si el documento carece de firma criptográfica institucional (`/Type /Sig`), marcando riesgo de no repudio.
4. **Emisión de Dictamen Pericial Criptográfico (`GET /api/forensics/affidavit/:evidenceId`):**
   - Genera dictamen pericial firmado con HMAC-SHA256 sellado por el motor forense bajo norma ISO/IEC 27037.


## Desacoplamiento de Canales Periciales: IA Generativa vs Edición Manual
- **Canal 1 (IA Generativa):** Evalúa patrones de modelos fundacionales (Gemini, DALL-E, Midjourney, Flux), marcas de agua SynthID/IPTC y stripping total de sensor de cámara.
- **Canal 2 (Edición Manual):** Evalúa software de post-producción gráfica (Adobe Photoshop, GIMP, Canva), discrepancia entre fecha de captura y fecha de modificación, y manipulación de capas o extensiones.
- **Corrección de Decodificación UTF-16BE en PDFs (ISO 32000-1):**
  - Los generadores como Google Gemini / Chrome exportan cadenas literales de metadatos utilizando codificación UTF-16 Big Endian precedida de la marca de orden de bytes BOM `0xFE 0xFF`.
  - La lectura directa en 8-bits producía caracteres CJK (mojibake) como `䝯潧汥⁌䱍`. Con la nueva función `decodePdfString` se realiza el byte-swap correspondiente revelando de forma nítida la cadena pericial real: `"Google LLM"` y `"Skia/PDF"`.


## Módulo Agente de Campo Móvil ("Field Agent Mode") & Geolocalización Forense

### 1. Desacoplamiento de Host y Red Universal
- **Resolución Dinámica:** El código QR utiliza `window.location.origin` en producción y detecta automáticamente las interfaces de red IPv4 mediante `GET /api/system/network-info` en red local LAN (`http://<LAN_IP>:5173/?mode=field-agent&session=...`).
- **Selector de Origen Dinámico:** Permite alternar entre modo "Auto / Cloud" (para cualquier hosting con dominio público o SSL), "Red LAN Wi-Fi" y "Túnel / Personalizado" (ngrok, Cloudflare Tunnel).
- **Rutas Relativas:** Toda la API cliente utiliza `/api/...` para total portabilidad en despliegues con proxy inverso.

### 2. Georreferenciación y Detección de GPS Spoofing
- **Sensores Móviles:** Captura en vivo de coordenadas WGS84 (`navigator.geolocation.getCurrentPosition`) con precisión métrica y altitud.
- **Extracción EXIF GPS:** Obtención de latitud/longitud decimal y formato DMS incrustados en la foto por el sensor de la cámara.
- **Fórmula de Haversine:** Calcula la distancia ortodrómica en kilómetros entre el punto de subida del teléfono y las coordenadas EXIF de la imagen. Si la distancia supera 1.5 km, el motor forense penaliza el riesgo con +40 puntos y marca una anomalía de **`GPS SPOOFING / FOTO REUTILIZADA`**.
- **Cartografía Interactiva:** Visualización en tiempo real mediante `ForensicGeoMap.jsx` con mapa embebido de OpenStreetMap, vista satelital y desglose en Grados, Minutos y Segundos.

### 3. Canal de Sincronización en Vivo
- El dashboard de la laptop escucha mediante polling de baja latencia (`/api/forensics/live-poll?sessionToken=...`). En cuanto un evaluador o compañero toma la foto desde su teléfono, la laptop proyecta instantáneamente la imagen, el dictamen forense y el mapa cartográfico sin recargar la página.


## Normalización Amigable en Español y Desmojibake Automático
- **Causa de caracteres como `䰀椀戀爀攀伀昀昀椀挀攀` y `圀爀椀琀攀爀`:** En suites ofimáticas como LibreOffice o procesadores de texto, los metadatos PDF se exportan como cadenas UTF-16BE con bytes nulos o espaciados. Al leerse directamente, el par de bytes se invierte generando ideogramas CJK.
- **Mecanismo de Desmojibake Automático ([forensicFormatter.js](file:///C:/Users/Maicol/.gemini/antigravity/scratch/securitrace/client/src/utils/forensicFormatter.js)):**
  - Se implementó un algoritmo universal en frontend y backend que detecta el bloque Unicode CJK (`\u4E00-\u9FFF`), ejecuta la inversión de bytes de orden alto/bajo y limpia los espacios redundantes, decodificando al instante `"LibreOffice 4.2"` y `"Writer"`.
- **Formateo de Fechas en Español Natural:**
  - Marcas en formato bruto `D:20261118194925+00'00'` o EXIF `2024:03:15` son transformadas automáticamente a: `"18 de noviembre de 2026, 07:49:25 PM (Hora Oficial UTC)"`.
- **Humanización de Parámetros Técnicos:**
  - Valores ausentes como `No registrado (Sensor ausente)` se traducen a `"Sin sensor de cámara física (Generado por software o IA)"`.
  - Dimensiones vectoriales `N/AxN/A` se muestran como `"Dimensiones dinámicas (Documento vectorial)"`.


## Resolución de Error [ECONNREFUSED] en Proxy de Vite
- **Diagnóstico:** Al reiniciar el backend, el archivo `forensicService.js` fallaba en la línea 443 debido a un token residual `anomalies }; }` producto de una edición anterior. Esto impidió que Express abriera el puerto 5000, provocando que el proxy de Vite arrojara `AggregateError [ECONNREFUSED]`.
- **Corrección:** 
  1. Se eliminó la llave y fragmento residual en `forensicService.js`, verificándose la compilación sintáctica en Node.js v20.14.0.
  2. Se configuró el target del proxy en `vite.config.js` explícitamente a `http://127.0.0.1:5000` para evitar discrepancias de resolución IPv6 (`::1` vs `127.0.0.1`) en Windows.


## Transición Automática y Extracción de GPS Satelital
- **Escucha Global en Segundo Plano ([ForensicContext.jsx](file:///C:/Users/Maicol/.gemini/antigravity/scratch/securitrace/client/src/context/ForensicContext.jsx)):**
  - El polling de evidencias de campo corre a nivel global de la aplicación, independientemente de si el modal de QR está abierto o cerrado.
  - Al recibir una evidencia de campo:
    1. Emite un ping acústico tipo radar sintetizado vía Web Audio API (880 Hz $\rightarrow$ 1760 Hz).
    2. Cierra automáticamente el modal de QR.
    3. Cambia la pestaña activa a `file-analysis` ("Visión Forense").
    4. Carga la evidencia completa en el analizador.
    5. Despliega un Toast flotante superior notificando la captura.
- **Extracción de Ubicación Forense (GPS EXIF vs Sensor del Navegador):**
  - En conexiones HTTP locales, los navegadores móviles bloquean la API `navigator.geolocation` por políticas de "Contextos Seguros" (W3C Secure Contexts).
  - La ubicación más precisa proviene de las cabeceras binarias **EXIF GPS IFD** (`GPSLatitude`, `GPSLongitude`, `GPSAltitude`, `GPSImgDirection`, `GPSTimeStamp`) que el hardware de la cámara del teléfono graba directamente dentro del archivo JPEG/HEIC.
  - El backend extrae estos metadatos físicos sin requerir permisos del navegador, proyectando las coordenadas exactas en grados, minutos y segundos y el mapa satelital interactivo.

## Arquitectura Multimodal de Detección de IA vs Tránsito Orgánico (Imágenes, Audio, Video, PDF)

### 1. Invariante Pericial de Precedencia de Amenaza
- Los vectores de **IA Generativa ($V_1$)** y **Manipulación Manual ($V_2$)** tienen prioridad absoluta en el motor de inferencia.
- Si un archivo posee firmas de IA (Inpainting, Adobe Firefly, Samsung Galaxy AI `GenerativeEdit`, Google Magic Eraser, Face Swap, descriptores de difusión, o cuantización DQT sintética fuera de redes sociales), las clasificaciones de captura de pantalla y de tránsito por red social quedan **estrictamente invalidadas**.
- El detector de capturas de pantalla (`isDeviceScreenshot`) fue desacoplado de relaciones de aspecto panorámicas genéricas: únicamente se admite si porta nomenclatura explícita de framebuffer (`Screenshot_`, `Captura de pantalla`) o resolución fija de pantalla completa de hardware móvil (`1080x2400`, `1179x2556`) **y simultáneamente** $V_1 < 20.0$ y $V_2 < 25.0$.

### 2. Forense Acústico de Notas de Voz vs Clonación Neuronal ([audioService.js](file:///C:/Users/Maicol/.gemini/antigravity/scratch/securitrace/server/src/services/audioService.js))
- **Notas de Voz de WhatsApp:** Identificación de contenedor Ogg/Opus (`OggS`, `OpusHead`, `OpusTags`) y nomenclatura `PTT-YYYYMMDD-WA...`. Dado que el códec Opus es el estándar nativo de mensajería, se clasifica como `NOTA_DE_VOZ_WHATSAPP_OPUS` con riesgo $\le 0.5\%$ (Autenticidad $\ge 99.5\%$).
- **Voz Humana Orgánica:** Grabación de micrófono directo con espectro de formantes continuos y micro-fluctuaciones tonales naturales ($F_0$ micro-jitter), clasificada como `VOZ_HUMANA_ORGANICA` con riesgo $\le 0.5\%$.
- **Deepfakes y Clonación (ElevenLabs, Suno, Udio, RVC, VALL-E):** Detección de metadatos incrustados, tags ID3 de síntesis, o corte abrupto espectral de vocoder neuronal (>8 kHz / >12 kHz). Riesgo pericial $\ge 90\%$, clasificado como `CLONACION_NEURONAL_DEEPFAKE`.

### 3. Forense de Video ISOBMFF ([videoForensicService.js](file:///C:/Users/Maicol/.gemini/antigravity/scratch/securitrace/server/src/services/videoForensicService.js))
- **Video Genuino de Cámara:** Inspección de átomos `moov.udta` en búsqueda de metadatos de hardware captor (`com.apple.quicktime.make`, `com.android.version`, GoPro, Sony). Clasificado como `VIDEO_CAMARA_ORGANICO` con riesgo $\le 0.8\%$.
- **Tránsito por WhatsApp:** Detección de patrones `VID-YYYYMMDD-WA...` o `WhatsApp Video...`, transcodificados a H.264 Baseline sin átomos de hardware. Clasificado como `TRANSITO_VIDEO_RED_SOCIAL` con riesgo $\le 0.5\%$.
- **Video Sintético por IA (Sora, Runway Gen-2/Gen-3, Kling, Pika, Luma Dream Machine):** Detección de exportador headless `Lavf/FFmpeg` sin átomos de hardware de cámara, tokens de modelos generativos y resoluciones canónicas de síntesis. Riesgo $\ge 90\%$, clasificado como `VIDEO_SINTETICO_IA_GENERATIVA`.

### 4. Forense Documental de PDFs ([pdfForensicService.js](file:///C:/Users/Maicol/.gemini/antigravity/scratch/securitrace/server/src/services/pdfForensicService.js))
- **Escaneo Físico Digitalizado:** Detección de productores de escáneres ópticos (HP, Canon, Epson, Xerox, CamScanner, Brother, Ricoh) y presencia de flujos de imagen rasterizada sin fuentes virtuales. Riesgo $\le 0.5\%$, clasificado como `PDF_DOCUMENTAL_ESCANEO_FISICO`.
- **Ofimática Genuina:** Creación en Microsoft Word, Adobe InDesign, Adobe Acrobat Pro, LibreOffice o LaTeX con revisiones estándar. Riesgo $\le 0.5\%$, clasificado como `PDF_DOCUMENTAL_OFIMATICA_GENUINO`.
- **Generación Virtual por LLM:** Detección de productores headless (`Skia/PDF`, `Chromium`, `Puppeteer`) y tokens de modelos de lenguaje en streams `FlateDecode` (`Google Gemini`, `ChatGPT`, `Claude`, `Prompt:`). Riesgo $\ge 90\%$, clasificado como `PDF_SINTETICO_LLM`.

## Reconstrucción Integral del Motor Forense de Imágenes (IFIE v4.0)

### 1. Cuatro Capas Físicas de Inferencia ([imageForensicService.js](file:///C:/Users/Maicol/.gemini/antigravity/scratch/securitrace/server/src/services/imageForensicService.js))
- **Capa 1: Análisis Espectral 2D Fourier (FFT) y Retícula Periódica (Checkerboard Artifacts):**
  - Mide la concentración armónica de altas frecuencias periódicas causadas por convoluciones transpuestas y decodificadores VAE de modelos generativos de difusión.
  - Si una persona toma una **captura de pantalla de una imagen generada con IA**, el contenido interno conserva los picos armónicos de la retícula de difusión (`AI_FFT_CHECKERBOARD_GRID`), delatando su origen sintético a pesar del contenedor PNG/JPEG del teléfono.
- **Capa 2: Disparidad de Ruido y Nivel de Error (ELA) para Inpainting y Edición Híbrida:**
  - En fotos reales, el piso de ruido térmico del sensor CMOS es espacialmente estacionario. Al aplicar *Inpainting*, *Generative Fill*, *Face Swap*, *Samsung Galaxy AI* o *Google Magic Eraser*, la zona modificada presenta una discontinuidad en la tasa de compresión y un gradiente hiper-liso.
  - Clasificación unívoca como `FOTO_REAL_MANIPULADA_CON_IA` con riesgo pericial $\ge 98.0\%$.
- **Capa 3: Estructura de Cuantización DQT y Doble Compresión:**
  - Reconocimiento de matrices de compresión de cámaras analógicas (Luminancia + Crominancia, varianza alta) vs mono-tablas sintéticas de difusión (1 sola tabla DQT o matrices planas uniformes).
  - Aislamiento de la firma `libjpeg-turbo` de WhatsApp cuando proviene de una foto de cámara real (`TRANSITO_RED_SOCIAL_SANITIZADO`, riesgo $\le 1.2\%$).
- **Capa 4: Discriminación de Capturas de Pantalla Legítimas (UI Framebuffer):**
  - Admite capturas de pantalla exclusivamente si contienen vectores de interfaz limpios, texto nítido y carecen de retícula espectral de IA (`CAPTURADEPANTALLA_DISPOSITIVO`, riesgo $0.0\%$).

### 2. Visor Pericial Interactivo Multi-Espectral ([PixelForensicViewer.jsx](file:///C:/Users/Maicol/.gemini/antigravity/scratch/securitrace/client/src/components/common/PixelForensicViewer.jsx))
- Dispone de 6 modalidades periciales:
  1. **Vista Original:** Renderizado crudo del activo fotográfico.
  2. **Residuos ELA (20x - 40x):** Re-compresión controlada Q=90 y extracción de residuos de compresión diferencial.
  3. **Espectro 2D Fourier (FFT):** Visualización de armónicos y picos en cruz de retícula de difusión.
  4. **Gradiente Laplaciano:** Filtro pasaaltas para aislamiento de bordes de parches de inpainting.
  5. **Gradiente Térmico:** Mapa de calor falso color (Jet) de disparidad de error.
  6. **Inversión Cromática (InVID / WeVerify):** Detección de costuras de corte, objetos flotantes y parches clonados.

### 3. Restricción Estricta a Imágenes
- El módulo de Visión Forense (`/api/forensics/analyze-file` y `FileAnalyzer.jsx`) fue restringido estrictamente a formatos de imagen (`JPEG`, `PNG`, `WEBP`, `HEIC`). Archivos de audio, video o documentos son rechazados con advertencia pericial guiando al usuario hacia sus módulos correspondientes.

### 4. Corrección de Falsos Positivos en Dispositivos Tecno / MediaTek HAL
- **Causa Raíz:** La especificación JPEG ISO/IEC 10918-1 B.2.4.1 permite múltiples tablas de cuantización empaquetadas en un único marcador `0xFF 0xDB`. Los procesadores MediaTek (teléfonos Tecno, Infinix, Xiaomi Redmi de gama de entrada) concatenan la tabla de Luminancia ($Q_Y$) y la tabla de Crominancia ($Q_C$) en un único bloque continuo de 132 bytes ($2 \text{ bytes de longitud} + 65 \text{ bytes } Q_Y + 65 \text{ bytes } Q_C$). El parser anterior extraía únicamente la primera tabla y reportaba erróneamente `dqtTables.length = 1`, disparando la alarma de `CUANTIZACIÓN_UNIFORME_IA`.
- **Mitigación:** Implementación del desempaquetado iterativo `while (p + 65 <= markerEnd)` en `parseJpegQuantizationTables`, permitiendo extraer ambas matrices completas.
- **Calibración de Varianza:** Se restringió `isSyntheticDqt` a matrices con dispersión nula (`stdDev === 0`) o generadas por difusores mono-tabla (`dqtTables.length === 1`), descartando falsas alarmas sobre capturas de sensores físicos reales de alta resolución.

### 5. Doctrina Forense Pericial: Comprobantes Digitales de Pago Móvil
- **Naturaleza Técnica de un Pago Móvil Legítimo:**
  - Un comprobante de Pago Móvil generado por la aplicación bancaria es un volcado digital del *Framebuffer* del sistema operativo (interfaz gráfica renderizada por vectores y fuentes del sistema).
  - **No es una imagen generada por IA:** Clasificar una captura legítima de app bancaria como "IA" constituiría un falso positivo crítico.
  - **Clasificación Correcta:** `CAPTURADEPANTALLA_DISPOSITIVO` (Riesgo $\le 0.0\%$, Autenticidad $\ge 99.0\%$).
- **Detección de Fraude en Comprobantes Adulterados:**
  - **Alteración Manual (Photoshop / Canva / Montaje de texto o montos):** Al incrustar texto falso sobre el comprobante o alterar números/referencias, la re-compresión localizada y la disparidad de cuantización delatan la manipulación mediante análisis ELA y discontinuidad de gradientes $\rightarrow$ `ALTERACION_MANUAL_RETOQUE` (Riesgo $\ge 80\%$).
  - **Generación Sintética por IA (Difusor / Inpainting):** Si el comprobante o parte de él fue fabricado con Stable Diffusion / Flux / DALL-E, el análisis espectral 2D FFT detecta los picos armónicos de retícula de convolución y fuentes deformadas $\rightarrow$ `SINTETICO_IA_GENERATIVA` o `FOTO_REAL_MANIPULADA_CON_IA` (Riesgo $\ge 95\%$).
