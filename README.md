# LogiTrack - Plataforma de Optimización de Rutas y Monitoreo en Tiempo Real
**Materia:** Implantación de Sistemas (7mo Semestre - Ingeniería en Sistemas)

---

## 1. Descripción del Proyecto
LogiTrack es un sistema web integral de gestión logística de última milla. Integra optimización algorítmica de rutas (resolución de TSP con heurística 2-opt), telemetría geoespacial en vivo mediante WebSockets (Socket.io), control de acceso basado en roles (RBAC) y confirmación digital de entrega con captura de firma (POD).

---

## 2. Arquitectura del Sistema y Patrones (.agent-skills)

* **Eliminación de Waterfalls (`react-best-practices`):** Consultas de datos iniciales concurrentes (`Promise.all`), reduciendo los tiempos de carga en el panel de despacho.
* **Componentes Compuestos (`composition-patterns`):** Estructura modular para modales de despacho y paneles de control.
* **Aislamiento de Telemetría:** La capa de WebSockets actualiza las coordenadas de los vehículos en subcomponentes dedicados, evitando el re-renderizado innecesario del layout general.
* **Resiliencia y Monitoreo:** Endpoint de salud `/healthz` compatible con sistemas de monitoreo de producción (Uptime Kuma, Prometheus, Docker healthchecks).

---

## 3. Configuración de Base de Datos en Supabase

1. Crea un proyecto en [Supabase](https://supabase.com/).
2. Dirígete a la pestaña **SQL Editor** en tu panel de Supabase.
3. Abre el archivo [`server/schema.sql`](file:///C:/Users/Maicol/.gemini/antigravity/scratch/logitrack/server/schema.sql), copia todo su contenido y ejecútalo (**Run**).
   * Creará las tablas: `users`, `drivers`, `orders`, `delivery_routes`, `order_status_logs`.
   * Insertará los datos semilla iniciales y los repartidores de prueba.
4. En Supabase, ve a **Project Settings -> Database -> Connection String (URI)** y copia la URL en modo *Session* o *Transaction*.
5. Pega esa cadena en [`server/.env`](file:///C:/Users/Maicol/.gemini/antigravity/scratch/logitrack/server/.env):
   ```env
   DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```

---

## 4. Ejecución en Entorno Local (Desarrollo)

### A. Backend (Node.js API + WebSockets)
```bash
cd server
npm install
npm run dev
```
* Servidor escuchando en: `http://localhost:4000`
* Healthcheck: `http://localhost:4000/healthz`

### B. Frontend (React Vite + Tailwind + Leaflet)
```bash
cd client
npm install
npm run dev
```
* Aplicación disponible en: `http://localhost:5173`

---

## 5. Despliegue con Docker Compose (Implantación Productiva)

Para evaluar la fase de implantación con contenedores orquestados y proxy inverso Nginx:

```bash
docker compose up --build -d
```
* **Frontend y Proxy Nginx:** `http://localhost` (Puerto 80)
* **Backend API:** `http://localhost:4000`
* **Base de datos Postgres contenerizada:** `localhost:5432`

---

## 6. Cuentas de Demostración para la Defensa

| Rol | Correo Electrónico | Contraseña | Permisos |
| :--- | :--- | :--- | :--- |
| **Administrador / Despachador** | `admin@logitrack.com` | `Password123!` | Creación de pedidos, optimización 2-opt, mapa de flota y simulador GPS |
| **Repartidor 01 (Moto)** | `driver1@logitrack.com` | `Password123!` | Vista móvil de entregas, navegación y firma digital de recibido |
| **Repartidor 02 (Van)** | `driver2@logitrack.com` | `Password123!` | Vista móvil de entregas |
| **Cliente / Rastreo Público** | *Sin login requerido* | *N/A* | URL: `http://localhost:5173/track/TRK-2026-001` |
