const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
let connectionString = process.env.DATABASE_URL || process.env.database || process.env.DATABASE;

// Limpieza automática por si se colocaron corchetes [password] por error
if (connectionString && connectionString.includes(':[')) {
  connectionString = connectionString.replace(/:\[([^\]]+)\]@/, ':$1@');
}

// Supabase requiere SSL: rejectUnauthorized false cuando se conecta desde clientes externos
const isSupabase = connectionString && (
  connectionString.includes('supabase.co') || 
  connectionString.includes('pooler.supabase.com')
);

const poolConfig = {
  connectionString: connectionString || 'postgresql://postgres:postgres@localhost:5432/logitrack',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

if (isSupabase || isProduction) {
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
}

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  console.log('[DB] Conectado exitosamente al pool de PostgreSQL / Supabase.');
});

// Auto-migración defensiva e idempotente de columnas de feedback, índices y roles
const ensureColumns = async () => {
  try {
    await pool.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_confirmed_received BOOLEAN;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_recipient_relationship VARCHAR(50);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_rating INT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_feedback TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_feedback_at TIMESTAMPTZ;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2) DEFAULT 0.00;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_items JSONB DEFAULT '[]'::jsonb;

      -- Normalización de constraints de vehículos y estados en drivers
      DO $$
      BEGIN
        ALTER TABLE drivers DROP CONSTRAINT IF EXISTS drivers_vehicle_type_check;
        ALTER TABLE drivers ADD CONSTRAINT drivers_vehicle_type_check 
          CHECK (vehicle_type IN ('MOTORCYCLE', 'VAN', 'TRUCK', 'BICYCLE', 'MOTO', 'CAR', 'BIKE'));
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;

      DO $$
      BEGIN
        ALTER TABLE drivers DROP CONSTRAINT IF EXISTS drivers_status_check;
        ALTER TABLE drivers ADD CONSTRAINT drivers_status_check 
          CHECK (status IN ('IDLE', 'ON_DELIVERY', 'OFFLINE', 'AVAILABLE', 'OFF_DUTY'));
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;

      -- Índices de optimización de alto rendimiento
      CREATE INDEX IF NOT EXISTS idx_orders_items_gin ON orders USING GIN (order_items);
      CREATE INDEX IF NOT EXISTS idx_orders_driver_perf ON orders(assigned_driver_id, status);
      CREATE INDEX IF NOT EXISTS idx_orders_rating_perf ON orders(client_rating) WHERE client_rating IS NOT NULL;
    `);
    console.log('[DB] Esquema verificado: columnas, restricciones normalizadas e índices GIN activos.');
  } catch (e) {
    console.warn('[DB Notice] Verificación de columnas de feedback diferida:', e.message);
  }
};
ensureColumns();

pool.on('error', (err) => {
  console.error('[DB Error] Error inesperado en el cliente inactivo de la base de datos:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
