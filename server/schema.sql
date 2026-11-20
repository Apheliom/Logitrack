-- ==============================================================================
-- LOGITRACK - SCHEMA COMPLETO DE BASE DE DATOS (POSTGRESQL 15+ / SUPABASE)
-- Compatible con Supabase SQL Editor y PostgreSQL estándar
-- ==============================================================================

-- 1. Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabla de Usuarios (RBAC)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'CLIENT' CHECK (role IN ('ADMIN', 'DRIVER', 'CLIENT')),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Repartidores / Vehículos
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    vehicle_type VARCHAR(50) NOT NULL DEFAULT 'MOTORCYCLE' CHECK (vehicle_type IN ('MOTORCYCLE', 'VAN', 'BICYCLE', 'CAR')),
    license_plate VARCHAR(30),
    current_lat NUMERIC(10, 7),
    current_lng NUMERIC(10, 7),
    is_available BOOLEAN DEFAULT true,
    status VARCHAR(30) DEFAULT 'IDLE' CHECK (status IN ('IDLE', 'ON_DELIVERY', 'OFFLINE')),
    last_ping TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Órdenes de Entrega
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_number VARCHAR(50) UNIQUE NOT NULL,
    client_name VARCHAR(150) NOT NULL,
    client_phone VARCHAR(50),
    delivery_address TEXT NOT NULL,
    dest_lat NUMERIC(10, 7) NOT NULL,
    dest_lng NUMERIC(10, 7) NOT NULL,
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'URGENT')),
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'FAILED')),
    assigned_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    signature_data TEXT, -- Base64 de la firma capturada
    delivery_notes TEXT,
    client_confirmed_received BOOLEAN DEFAULT NULL, -- Confirmación de si el cliente firmó
    client_recipient_relationship VARCHAR(50) DEFAULT 'SELF', -- 'SELF' (él mismo) o 'THIRD_PARTY' (tercero)
    client_rating INT DEFAULT NULL, -- Puntuación del cliente (1 a 5)
    client_feedback TEXT DEFAULT NULL, -- Comentario u observación opcional del cliente
    client_feedback_at TIMESTAMPTZ DEFAULT NULL,
    total_amount NUMERIC(10, 2) DEFAULT 0.00,
    order_items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla de Rutas Optimizadas
CREATE TABLE IF NOT EXISTS delivery_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    route_name VARCHAR(100) NOT NULL,
    ordered_order_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    route_geojson JSONB,
    total_distance_km NUMERIC(8, 2) DEFAULT 0.0,
    estimated_duration_min NUMERIC(8, 2) DEFAULT 0.0,
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 6. Tabla de Auditoría / Historial de Estados (Trazabilidad para Implantación)
CREATE TABLE IF NOT EXISTS order_status_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Índices de Búsqueda Rápida
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_driver ON orders(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status, is_available);
CREATE INDEX IF NOT EXISTS idx_order_logs_order ON order_status_logs(order_id);

-- 8. Cuentas de Acceso al Sistema (Credenciales de Entrada)
-- Contraseña para todas las cuentas iniciales: Password123!
INSERT INTO users (id, email, password_hash, full_name, role, phone)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'admin@logitrack.com', '$2a$10$UUWM1YtjlFrdaGtbWLEH6.Unls3TePupkui3PX4KGLmgIRWTnSvci', 'Administrador General', 'ADMIN', '+58 412 1111111'),
    ('22222222-2222-2222-2222-222222222222', 'driver1@logitrack.com', '$2a$10$UUWM1YtjlFrdaGtbWLEH6.Unls3TePupkui3PX4KGLmgIRWTnSvci', 'Carlos Mendoza (Moto 01)', 'DRIVER', '+58 414 2222222'),
    ('44444444-4444-4444-4444-444444444444', 'cliente@logitrack.com', '$2a$10$UUWM1YtjlFrdaGtbWLEH6.Unls3TePupkui3PX4KGLmgIRWTnSvci', 'Cliente Demostración', 'CLIENT', '+58 416 3333333')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Repartidor Inicial (Almacén Central: Cabudare Centro, Estado Lara: 10.0305, -69.2635)
INSERT INTO drivers (id, user_id, vehicle_type, license_plate, current_lat, current_lng, is_available, status)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'MOTORCYCLE', 'ABC-123', 10.0305, -69.2635, true, 'IDLE')
ON CONFLICT (user_id) DO UPDATE SET current_lat = EXCLUDED.current_lat, current_lng = EXCLUDED.current_lng;

-- 9. Limpieza de Tablas de Negocio (0 Órdenes, 0 Rutas, 0 Bitácoras)
TRUNCATE TABLE order_status_logs, delivery_routes, orders CASCADE;
