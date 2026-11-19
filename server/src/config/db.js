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

// Auto-migración defensiva e idempotente de columnas de feedback y roles
const ensureColumns = async () => {
  try {
    await pool.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_confirmed_received BOOLEAN;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_recipient_relationship VARCHAR(50);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_rating INT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_feedback TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_feedback_at TIMESTAMPTZ;
    `);
    console.log('[DB] Esquema verificado: columnas de retroalimentación de entrega activas.');
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
