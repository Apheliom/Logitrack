const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL;

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

pool.on('error', (err) => {
  console.error('[DB Error] Error inesperado en el cliente inactivo de la base de datos:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
