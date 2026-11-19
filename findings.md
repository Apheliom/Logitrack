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


---

## 5. Diagnóstico de Telemetría GPS y Tracking de Cliente en Tiempo Real
* **Hallazgo 1 (Filtro SQL en `getOrderByTracking`):** En `server/src/controllers/orderController.js`, la consulta SQL omitía `d.id AS driver_id` y `o.assigned_driver_id`. Esto provocaba que en el cliente (`PublicTrackingPage.jsx`) `order.driver_id` fuera `undefined`, imposibilitando mapear la posición recibida por Socket.io (`driverLocations[order.driver_id]`).
* **Hallazgo 2 (Condición de renderizado de coordenadas):** En `PublicTrackingPage.jsx`, la variable `currentDriverCoords` exigía estrictamente `order.driver_lat && order.driver_lng`. Si la base de datos tenía valores nulos iniciales, la posición del socket era descartada.
* **Hallazgo 3 (Visualización de trayectoria):** En el mapa del cliente solo existían marcadores aislados de destino y conductor, sin una polilínea continua de aproximación ni ajuste de encuadre automático (`fitBounds`).
* **Hallazgo 4 (Activación manual de GPS en Driver):** En `DriverView.jsx`, la transmisión GPS iniciaba inactiva (`gpsActive = false`), dependiendo de una pulsación manual del usuario. Requiere auto-arranque en el montaje (`useEffect`) con fallback de posición garantizada.


## 6. Implementación de Validación de Entrega (POD Cliente) y Telemetría Permanente
* **Endpoint de Retroalimentación:** Incorporado `POST /api/orders/track/:trackingNumber/feedback` en `orderRoutes.js` y `orderController.js`, permitiendo al receptor validar si él personalmente firmó o si fue un tercero (`client_confirmed_received`, `client_recipient_relationship`), además de registrar una calificación (`client_rating`, 1-5 estrellas) y observación (`client_feedback`).
* **Telemetría Conductor Continua:** Modificado `DriverView.jsx` para arrancar automáticamente la geolocalización al montar la vista (`watchPosition`), con temporizador de respaldo continuo (pulso cada 4 segundos) hacia el backend y canal WebSocket (`telemetry:driver_location`).
* **Visualización de Trayectoria Dinámica:** Actualizado `PublicTrackingPage.jsx` con `<Polyline />` de alto contraste en tiempo real y componente `<MapBoundsUpdater />` para auto-encuadrar al conductor y al destino de manera continua sin recargas de página.
