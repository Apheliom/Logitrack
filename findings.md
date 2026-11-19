# Findings & Arquitectura Técnica - LogiTrack

## 1. Descubrimientos de Patrones (.agent-skills)
Del análisis de la suite de habilidades en `.agent-skills`, se extraen los siguientes lineamientos mandatorios para el diseño e implementación del sistema:

* **React Best Practices (`react-best-practices`):**
  * **Eliminación de cascadas (Waterfalls):** Uso de `Promise.all` para lecturas independientes concurrentes (`async-parallel`). Inicio temprano de promesas y resolución tardía (`async-api-routes`).
  * **Optimización de Bundles:** Prohibido el uso de barrel files masivos (`bundle-barrel-imports`). Importaciones directas de componentes e íconos (ej. `lucide-react/dist/esm/icons/...` o direct imports).
  * **Optimización de Re-renders:** Aislamiento de estados de telemetría GPS en subcomponentes dedicados (el movimiento frecuente de marcadores no debe re-renderizar todo el árbol del dashboard ni la barra de navegación).
* **Composition Patterns (`composition-patterns`):**
  * Reemplazo de proliferación de props booleanas por componentes compuestos (`Compound Components`) para modales, paneles de control y tarjetas de órdenes.
  * Inversión de control y paso de contexto compartido (`DeliveryOrderContext`, `AuthContext`).
* **Web Interface Guidelines (`web-design-guidelines`):**
  * Estados de carga inmediatos (skeletons y micro-spinners con `aria-busy`).
  * Retroalimentación visual accesible para estados de órdenes (`PENDIENTE`, `EN_CAMINO`, `ENTREGADO`).
  * Formularios con validación en tiempo real y soporte accesible de teclado.

---

## 2. Compatibilidad con Supabase (PostgreSQL)
* Esquema SQL 100% estándar y compatible con Supabase (Postgres 15+).
* Tablas con tipos de datos nativos: `UUID`, `TIMESTAMPTZ`, `VARCHAR`, `NUMERIC` (para coordenadas `latitude` y `longitude`), `JSONB` (para paradas y metadatos de rutas).
* El sistema puede conectarse directamente mediante cadena de conexión PostgreSQL (`DATABASE_URL = postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`) o ejecutarse localmente con Docker Postgres.

---

## 3. Especificación de Autenticación y Autorización
* **Algoritmo:** JWT (JSON Web Tokens) firmado con `HS256` y expiración configurable (e.g. 24h).
* **Hash de contraseñas:** `bcryptjs` con salt rounds = 10.
* **Roles del Sistema (RBAC):**
  * `ADMIN`: Gestión de despachos, carga de órdenes, optimización de rutas, monitoreo global.
  * `DRIVER`: Visualización de pedidos asignados, confirmación de entregas con firma digital, transmisión de GPS.
  * `CLIENT`: Consulta de tracking mediante token o cuenta de cliente.
* **Endpoints de Auth:**
  * `POST /api/auth/register` (Registro de usuario con rol y validación de campos obligatorios).
  * `POST /api/auth/login` (Autenticación, verificación de hash y emisión de JWT).
  * `GET /api/auth/me` (Validación de sesión y obtención de datos del usuario autenticado).

---

## 4. Estructura de Directorios del Proyecto
```
logitrack/
├── findings.md                # Bitácora técnica y registro de descubrimientos
├── docker-compose.yml         # Orquestación de contenedores para implantación
├── server/                    # Backend Node.js + Express + Socket.io
│   ├── .env.example
│   ├── src/
│   │   ├── config/            # DB (Supabase/Postgres pool) y variables
│   │   ├── controllers/       # Controladores Auth, Orders, Routes, Tracking
│   │   ├── middleware/        # Auth JWT y validadores de rol
│   │   ├── routes/            # Definición de rutas REST
│   │   ├── services/          # Algoritmo de optimización 2-opt y simulación GPS
│   │   ├── sockets/           # Handler de Socket.io para telemetría en vivo
│   │   └── server.js          # Punto de entrada HTTP y WS
│   └── package.json
└── client/                    # Frontend React Vite + Tailwind CSS + Leaflet
    ├── .env.example
    ├── src/
    │   ├── api/               # Clientes Axios / Fetch centralizados
    │   ├── components/        # Componentes UI (Map, Modals, Forms, Metrics)
    │   ├── context/           # AuthContext y SocketContext
    │   ├── pages/             # Login, Register, AdminDashboard, DriverApp, PublicTracking
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```
