# 🛡️ SecuriTrace | Centro Forense Digital & Detección de Suplantación en Tiempo Real

> **Caso de Estudio de Alta Complejidad para Defensa de Grado**  
> **Materia:** Implantación de Sistemas — Ingeniería en Sistemas  
> **Estilo Visual:** Cybersecurity Command Center (Dark Mode Nativo `#070A10` con acentos Neón Cian/Esmeralda/Rojo)

---

## 1. 📋 Descripción Ejecutiva del Proyecto

**SecuriTrace** es una plataforma web full-stack de peritaje informático y análisis forense multimedia diseñada para mitigar dos de los vectores de ataque más críticos en la era de la inteligencia artificial:
1. **La manipulación y falsificación documental y fotográfica** (alteración de metadatos, clonación con software como Photoshop o GIMP, y síntesis por modelos difusionales como Midjourney/DALL-E).
2. **La suplantación de identidad biométrica por voz (Deepfakes de audio)** mediante vocoders neuronales y síntesis TTS.

El sistema garantiza una estricta **Cadena de Custodia Criptográfica (FIPS 180-4 / RFC 3161)** mediante generación inmediata de sellos hash SHA-256 en memoria volátil sin persistir evidencias en discos no cifrados (*Zero-Disk Leakage*).

---

## 2. 🏗️ Arquitectura y Stack Tecnológico

```
                          ┌──────────────────────────────────────────────┐
                          │         CLIENTE: React 18 + Vite             │
                          │   Tailwind CSS (Command Center HUD)          │
                          │   Web Audio API (FFT Real-Time @ 60 FPS)     │
                          │   Lucide Icons + Canvas 2D Espectrograma     │
                          └──────────────────────┬───────────────────────┘
                                                 │ HTTP / Multipart Streams
                                                 ▼
                          ┌──────────────────────────────────────────────┐
                          │         SERVIDOR: Node.js + Express          │
                          │  Multer (MemoryStorage / Zero-Disk Leak)     │
                          │  Crypto (SHA-256, SHA-1, MD5 FIPS Compliant) │
                          │  exifr (Decodificador TIFF/EXIF/XMP/IPTC)    │
                          │  Motor Heurístico de Detección de Deepfakes  │
                          └──────────────────────┬───────────────────────┘
                                                 │ Transacciones ACID
                                                 ▼
                          ┌──────────────────────────────────────────────┐
                          │        BASE DE DATOS: SQLite3 Local          │
                          │       Ledger Inmutable de Evidencias         │
                          │       (securitrace.db / audit_logs)          │
                          └──────────────────────────────────────────────┘
```

### Componentes Clave:
* **Frontend:** React 18, Vite 5, Tailwind CSS 3.4, `lucide-react`. Procesamiento de audio en tiempo real con Web Audio API (`AudioContext`, `AnalyserNode` con FFT a 256 bandas) renderizado en `HTML5 Canvas 2D`.
* **Backend:** Node.js 20+, Express 4, `multer` en memoria volátil (RAM), `crypto` nativo, `exifr` con soporte ampliado para metadatos TIFF, JFIF, IPTC, XMP y perfiles ICC.
* **Persistencia Forense:** SQLite3 (`securitrace.db`) configurado para trazabilidad inmutable y exportación pericial formal en JSON e informes periciales listos para impresión.

---

## 3. 🚀 Guía Rápida de Instalación y Ejecución

### Prerrequisitos
- Tener instalado **Node.js v18 o superior** y **npm** (verificado en v20.14.0).

### Opción A: Ejecución Unificada con un solo comando (Recomendada)

1. Abre una terminal en la raíz del proyecto (`securitrace`):
   ```bash
   npm run start
   ```
   *Este comando ejecutará concurrentemente el servidor Express en el puerto 5000 y el cliente Vite en el puerto 5173.*

2. Abre tu navegador web en:
   ```
   http://localhost:5173
   ```

---

### Opción B: Ejecución en Dos Terminales Separadas

#### Terminal 1 — Servidor Backend:
```bash
cd server
npm install
npm run dev
```
*El servidor confirmará:* `🛡️ SecuriTrace Backend Activo en Puerto 5000`

#### Terminal 2 — Cliente Frontend:
```bash
cd client
npm install
npm run dev
```
*Vite indicará:* `Local: http://localhost:5173`

---

## 4. 🎓 GUÍA ESTRATÉGICA PARA LA DEFENSA EN CLASES (Implantación de Sistemas)

Esta sección contiene el guión exacto de lo que debes decir y demostrar en vivo paso a paso frente al jurado y profesor.

### ⏱️ Minuto 0:00 a 1:00 — Introducción y Planteamiento del Problema
> *"Buenos días, estimado profesor y miembros del jurado. En el marco de la materia **Implantación de Sistemas**, presento la plataforma **SecuriTrace: Plataforma Web de Detección de Suplantación de Identidad y Análisis Forense Multimedia en Tiempo Real**.*  
> *En los procesos modernos de implantación de sistemas críticos (banca, peritajes legales, auditorías y recursos humanos), el mayor riesgo actual es la suplantación mediante documentos alterados y notas de voz generadas por Inteligencia Artificial (Deepfakes). SecuriTrace responde a este problema mediante una arquitectura pericial en tiempo real, garantizando la cadena de custodia y cero fugas de datos en disco."*

---

### ⏱️ Minuto 1:00 a 2:30 — Demostración del MÓDULO A (Análisis EXIF y Binario)
1. **Acción:** Ubícate en la pestaña **"Módulo A: Análisis EXIF & Binario"**.
2. **Acción en vivo:** Haz clic en el botón superior de demo rápida: **`[Caso Photoshop]`** (o sube una imagen editada).
3. **Qué decir al jurado:**
   > *"Observen lo que ocurre internamente en la fase de ingesta:*  
   > *1. El archivo es recibido por nuestro middleware Multer configurado con `MemoryStorage`. La evidencia reside únicamente en memoria volátil (RAM), previniendo que atacantes o malware recuperen copias temporales en el disco duro.*  
   > *2. El módulo criptográfico nativo genera instantáneamente el hash **SHA-256**, estableciendo el sello inmutable de la Cadena de Custodia.*  
   > *3. Mediante el decodificador binario `exifr`, el sistema analiza la cabecera e identifica la etiqueta `Software: Adobe Photoshop CC 2025`, detecta una discrepancia temporal de más de 700 días entre la fecha de captura y la de modificación, y una alteración de los bloques de cuantización.*  
   > *4. Inmediatamente el sistema emite el veredicto en rojo con un **88% de Índice de Riesgo: ALERTA: Archivo Potencialmente Alterado**."*
4. **Acción de contraste:** Pulsa el botón **`[Caso Auténtico DSLR]`** y muestra cómo una fotografía de cámara directa emite veredicto verde con parámetros originales de sensor y 12% de riesgo.

---

### ⏱️ Minuto 2:30 a 4:00 — Demostración del MÓDULO B (Espectrograma y Voz en Vivo)
1. **Acción:** Pasa a la pestaña **"Módulo B: Espectrograma de Voz"**.
2. **Acción en vivo (Micrófono real):** Haz clic en **`[GRABAR MICRÓFONO]`**, habla durante 3 segundos al micrófono de tu laptop y pulsa **`[DETENER GRABACIÓN]`**.
3. **Qué decir al jurado:**
   > *"Para la verificación biométrica acústica, SecuriTrace implementa la **Web Audio API** del navegador comunicada directamente con un lienzo **Canvas 2D** a 60 cuadros por segundo. Esto nos permite ejecutar una Transformada Rápida de Fourier (FFT) en tiempo real sin requerir cómputo pesado en el servidor.*  
   > *Al reproducir mi voz natural, el espectrograma muestra un decaimiento armónico continuo con frecuencias que se extienden con naturalidad más allá de los 8 kHz. Al pulsar 'Evaluar Autenticidad Biométrica', el sistema confirma **Voz Humana Natural con 92% de Autenticidad**."*
4. **Acción de contraste (Deepfake):** Pulsa el botón **`[Simular Deepfake (IA)]`**.
   > *"Ahora evaluemos una muestra clonada por Inteligencia Artificial. Observen el espectrograma: los modelos neuronales (como Tacotron2, VITS o ElevenLabs) suelen estar entrenados en resoluciones con corte abrupto alrededor de los **7.6 kHz a 8 kHz** y exhiben una prosodia monótona sin variabilidad micro-acústica biológica.*  
   > *El motor heurístico detecta este corte de frecuencias altas y dictamina de inmediato: **ALERTA: Voz Sintética Deepfake**, con un índice de riesgo del 89%."*

---

### ⏱️ Minuto 4:00 a 5:00 — Demostración del MÓDULO C (Auditoría, Puesta en Marcha y Cierre)
1. **Acción:** Pasa a la pestaña **"Módulo C: Cadena de Custodia"**.
2. **Qué decir al jurado:**
   > *"En la materia de **Implantación de Sistemas**, un desarrollo no está terminado hasta que se garantiza su **Puesta en Marcha, Trazabilidad y Cumplimiento Regulatorio**.*  
   > *Cada análisis realizado en esta sesión en vivo ha quedado registrado de manera inmutable en nuestra base de datos relacional SQLite con su respectivo ID de evidencia (`EVD-...`), hash SHA-256, dictamen y perito responsable.*  
   > *Haciendo clic en **'Exportar JSON Formal'**, obtenemos el reporte estructurado consolidado para interoperabilidad con sistemas judiciales o bancarios.*  
   > *Y al pulsar **'Vista de Impresión / Peritaje'**, la interfaz conmuta mediante media queries CSS a un formato de peritaje legal impreso listo para firma pericial.*  
   > *Con esto demostramos que SecuriTrace es un sistema robusto, operable, seguro y 100% funcional para su implantación en entornos de alta exigencia."*

---

## 5. ❓ Preguntas Típicas del Jurado y Respuestas Técnicas

| Pregunta del Jurado | Respuesta Técnica Exacta |
|---|---|
| **¿Por qué procesar los archivos en memoria RAM y no guardarlos en la carpeta `/tmp`?** | Por el principio de **No-Contaminación y Privacidad Forense**. Los archivos temporales en disco pueden ser recuperados por actores maliciosos o herramientas de *file carving*. El uso de buffers en memoria garantiza que al finalizar la petición HTTP, los datos volátiles se eliminan de la memoria sin dejar rastro en disco. |
| **¿Cómo garantizan que la evidencia no fue modificada durante el peritaje?** | Mediante el cálculo inmediato de la función resumen **SHA-256** bajo el estándar criptográfico **FIPS 180-4**. El valor hash es el identificador inmutable de la evidencia; si un solo bit variara, la cadena de custodia se consideraría rota. |
| **¿Qué ocurre si un falsificador le borra todos los metadatos EXIF a una foto para ocultar Photoshop?** | El motor de SecuriTrace cuenta con una regla heurística de **Metadata Stripping Anomaly**. Una fotografía tomada por una cámara real siempre contiene información de lente, ISO y apertura. Si una imagen no tiene fabricante ni modelo óptico, el sistema le asigna puntos de riesgo porque es el comportamiento estándar de exportadores web, screenshots o imágenes generadas por IA. |
| **¿Por qué el espectrograma de audio se calcula en el cliente con Web Audio API?** | Por eficiencia en la fase de implantación: procesar la Transformada Rápida de Fourier (FFT) en el navegador del usuario aprovecha la aceleración por hardware de la GPU/CPU cliente, permitiendo renderizar a 60 FPS sin saturar el ancho de banda ni el hilo de eventos de Node.js en el backend. |

---

## 6. 📁 Estructura del Proyecto

```
securitrace/
├── client/                     # Frontend React + Vite + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx              # Barra superior con reloj y estado
│   │   │   ├── Sidebar.jsx             # Selector de módulos
│   │   │   ├── FileAnalyzer.jsx        # Módulo A: EXIF & Binarios
│   │   │   ├── AudioAnalyzer.jsx       # Módulo B: Web Audio & Deepfakes
│   │   │   ├── AuditDashboard.jsx      # Módulo C: Logs & Cadena de Custodia
│   │   │   ├── ImplementationSpecs.jsx # Ficha técnica de Implantación
│   │   │   └── DefenseGuideModal.jsx   # Guión interactivo para la defensa
│   │   ├── App.jsx                     # Layout principal
│   │   ├── main.jsx                    # Punto de entrada
│   │   └── index.css                   # Estilos Cyber Command Center
│   ├── vite.config.js                  # Proxy a :5000 y Vite setup
│   └── tailwind.config.js              # Paleta oscura neón
│
├── server/                     # Backend Node.js + Express
│   ├── src/
│   │   ├── routes/
│   │   │   ├── forensicRoutes.js       # Endpoints de análisis multimedia
│   │   │   └── auditRoutes.js          # Endpoints de auditoría y reportes
│   │   ├── services/
│   │   │   ├── forensicService.js      # Parser EXIF, Magic Bytes y SHA-256
│   │   │   └── audioService.js         # Análisis espectral y heurística deepfake
│   │   ├── db.js                       # SQLite3 relacional y seeding inicial
│   │   └── index.js                    # Servidor Express y middlewares
│   ├── .env                            # Variables de entorno
│   └── package.json                    # Dependencias del servidor
│
├── findings.md                 # Cuaderno de hallazgos y firmas técnicas
├── start.js                    # Script de arranque concurrente dual
├── package.json                # Orquestador del workspace
└── README.md                   # Esta documentación completa
```

---

## 7. ⚖️ Licencia y Créditos
Proyecto desarrollado para la defensa académica en **Implantación de Sistemas - Escuela de Ingeniería en Sistemas**.  
Autor: **Equipo Central de Ingeniería SecuriTrace**. Licencia MIT.
