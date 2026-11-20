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


## 7. Reubicación Operativa a Cabudare Centro y Simulación de Recorrido en Driver
* **Hallazgo 1 (Origen Operativo / Depósito):** El sistema utilizaba coordenadas por defecto de Bogotá (4.6534, -74.0836) en `schema.sql`, `routeController.js`, `gpsSimulator.js` y `CustomerStorePage.jsx`. Se unifica la ubicación del Almacén Central en **Cabudare Centro (Lara, Venezuela)** en lat: `10.0305`, lng: `-69.2635`.
* **Hallazgo 2 (Visualización de Ruta en Driver):** `DriverView.jsx` carecía de visualización cartográfica directa para el conductor. Se planifica integrar un mapa interactivo que muestre el almacén central de origen en Cabudare Centro, la posición del repartidor, las paradas asignadas y la polilínea del trayecto.
* **Hallazgo 3 (Simulador Interactivo de Recorrido para Defensa):** Se incorporará un control de "Simulación de Recorrido" directamente en el terminal del repartidor (`DriverView.jsx`) que interpole progresivamente pasos hacia los destinos asignados y emita los eventos GPS por WebSocket, permitiendo verificar el movimiento sincronizado en tiempo real en la vista de Repartidor, Cliente y Administrador.


## 8. Arquitectura y Colorimetría del Frontend (Basado en .agent-skills)
* **Colorimetría Logística Profesional (Design Tokens):**
  * Fondo y Canvas: `slate-100/80` (`#f1f5f9`), tarjetas en `bg-white` con bordes nítidos `border-slate-200/80` y sombras rasantes `shadow-xs` para evitar monotonía blanca y definir separaciones claras.
  * Primario y Enfoque: Azul Logístico Profundo / Tech Indigo (`#1d4ed8` - `#2563eb`).
  * Telemetría y Estados Semánticos: Esmeralda (`#059669`) para entregas y GPS vivo, Azul Cobalto (`#0284c7`) para tránsito, Ámbar (`#d97706`) para pedidos pendientes, y Carmesí (`#dc2626`) para prioridad urgente. Cero emojis; iconos vectoriales Lucide y SVGs geométricos exclusivamente.
* **Patrones de Composición (`composition-patterns`):**
  * Componentes compuestos para órdenes y tarjetas operativas (`Card`, `Card.Header`, `Card.Content`, `Card.Footer`).
  * Variantes explícitas tipadas (`StatusBadge variant="IN_TRANSIT"`) eliminando props booleanas redundantes.
  * Aislamiento del estado de telemetría en sub-árboles de mapa para evitar re-renderizados innecesarios del dashboard y de la barra de navegación.
* **Optimización de Rendimiento (`react-best-practices`):**
  * Lecturas concurrentes con `Promise.all` para eliminar cascadas (waterfalls).
  * Renderizado condicional mediante ternarios estrictos (`condition ? <A /> : null`).
  * Micro-skeletons con `aria-busy` durante estados de carga para eliminar saltos de maquetación (CLS).


## 9. Depuración de Base de Datos (Limpieza de Órdenes y Preservación de Cuentas de Acceso)
* **Estructura DDL Completa:** Conservación íntegra de las tablas `users`, `drivers`, `orders`, `delivery_routes` y `order_status_logs`.
* **Cuentas de Entrada (Credenciales Base):** Se mantienen exclusivamente los 3 usuarios esenciales de entrada para autenticación JWT (`admin@logitrack.com`, `driver1@logitrack.com` y `cliente@logitrack.com`) junto con el registro operativo de `drivers` en Cabudare Centro (`10.0305, -69.2635`).
* **Depuración de Datos Ficticios:** Eliminación total de inserciones de prueba en la tabla `orders`, garantizando que la base de datos inicie con 0 pedidos, 0 rutas archivadas y 0 bitácoras simuladas.


## 10. Metadatos Open Graph, Favicon y Previsualización Social (WhatsApp/Browser)
* **Diagnóstico de Previsualización:** En `client/index.html` no existía etiqueta `<link rel="icon">` (mostrando el icono genérico de globo terráqueo en la pestaña del navegador) ni etiquetas meta Open Graph (`og:title`, `og:description`, `og:image`), provocando que al compartir la URL `https://securitrace-op7o.onrender.com/` en WhatsApp o mensajería no se mostrara miniatura, logo ni descripción.
* **Solución de Identidad de Marca:**
  * Creación de `client/public/favicon.svg` y `favicon.png` utilizando el isotipo oficial del pin vectorial de LogiTrack.
  * Generación de `client/public/og-image.png` (1200x630 px) con Pillow, integrando el logotipo, gradiente tecnológico y tipografía de identidad.
  * Configuración completa de metaetiquetas en `client/index.html` (`description`, `og:title`, `og:description`, `og:image`, `twitter:card`).

---

## 9. Actualización Técnica de Seguridad y Auditoría Forense (Sesión Actual)
* **Corrección de Polilíneas Fantasma en LiveFleetMap:** Se vinculó el renderizado de la ruta a la existencia de órdenes en estado `IN_TRANSIT` o `ASSIGNED`. En `AdminDashboard.jsx`, cuando el filtro activo es `PENDING` o `DELIVERED`, se pasa `activeRoute = null` explícitamente, garantizando que el mapa no trace conexiones erróneas al depósito central.
* **Control de Turno para Conductor:** Se implementó en `DriverView.jsx` el conmutador de estado operativo (`ON_DELIVERY`, `IDLE`, `OFFLINE`) conectado a `PATCH /api/drivers/:id/status`, permitiendo a los choferes indicar si están en ruta, disponibles o fuera de servicio.
* **Validación de Entrega y Alerta Pericial por Firma Desconocida:**
  * En `PublicTrackingPage.jsx`, la entrega completada se destaca con un banner superior en verde esmeralda.
  * Formulario de validación de 3 opciones: `SELF` ("Fui yo personalmente"), `THIRD_PARTY` ("Tercero autorizado") y `NOT_RECEIVED` ("¡ALERTA! Yo NO lo recibí / Firma desconocida").
  * Si se selecciona `NOT_RECEIVED`, el backend (`orderController.js`) actualiza `is_disputed = true`, congela la telemetría actual del repartidor (`dispute_lat`, `dispute_lng`), inserta una entrada de auditoría forense en `order_status_logs` y emite el evento socket `alert:delivery_dispute` en tiempo real a administradores y al terminal del conductor.
* **Superposición de Modales (Portal React):** El modal de edición de datos de conductores en `AdminDriversPage.jsx` fue reestructurado utilizando `createPortal(..., document.body)` con índice `z-[9999]`, eliminando el problema de corte visual y garantizando que el fondo oscuro cubra completamente la barra de navegación superior.
