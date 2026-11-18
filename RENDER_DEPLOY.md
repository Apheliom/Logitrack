# Guía de Despliegue en Render (SecuriTrace Web Service)

SecuriTrace está configurado como un servicio web full-stack unificado en Node.js + Express + React Vite.

## Paso a Paso para Despliegue Gratuito en Render:

1. **Subir el código a GitHub:**
   * Crea un nuevo repositorio en tu cuenta de GitHub (ejemplo: `securitrace`).
   * Descomprime el archivo `.zip` y sube los archivos al repositorio:
     ```bash
     git init
     git add .
     git commit -m "feat: SecuriTrace Enterprise Forensic Core"
     git branch -M main
     git remote add origin https://github.com/TU_USUARIO/securitrace.git
     git push -u origin main
     ```

2. **Crear el Web Service en Render:**
   * Inicia sesión en [Render.com](https://render.com) (puedes conectar con GitHub).
   * Haz clic en **New +** y selecciona **Web Service**.
   * Selecciona tu repositorio de `securitrace`.

3. **Configuración del Servicio:**
   * **Name:** `securitrace`
   * **Runtime:** `Node`
   * **Build Command:**
     ```bash
     npm run build
     ```
   * **Start Command:**
     ```bash
     npm start
     ```
   * **Instance Type:** `Free`

4. **Variables de Entorno (Opcional):**
   * `NODE_ENV`: `production`
   * `PORT`: `10000` (Render asigna automáticamente el puerto).

5. **¡Listo!**
   * Render construirá el frontend con Vite y levantará el servidor Express con el motor forense.
   * La URL pública generada (ejemplo: `https://securitrace.onrender.com`) tendrá **HTTPS nativo**, permitiendo geolocalización satelital precisa desde cualquier teléfono móvil.
