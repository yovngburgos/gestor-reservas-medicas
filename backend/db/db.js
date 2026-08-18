const { Pool } = require('pg');
require('dotenv').config(); // Esto carga los datos del archivo .env

// Creamos la conexión (Pool) usando los datos de tu .env
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

// Exportamos esta conexión para poder usarla en otros archivos
module.exports = pool;