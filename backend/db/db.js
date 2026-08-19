const { Pool } = require('pg');
require('dotenv').config();

// Usamos la URL de la base de datos si existe (en Render), si no, usamos las variables locales
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Configuramos SSL requerido por servicios en la nube como Render
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

module.exports = pool;