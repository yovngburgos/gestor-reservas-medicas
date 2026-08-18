const express = require('express');
const cors = require('cors');
const pool = require('./db/db'); // Importamos nuestra conexión a la base de datos
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Nueva ruta para probar la conexión a PostgreSQL
app.get('/test-db', async (req, res) => {
    try {
        // Hacemos una consulta muy simple a la base de datos
        const result = await pool.query('SELECT NOW()');
        res.json({ 
            mensaje: '¡Conexión exitosa a la base de datos PostgreSQL! 🎉', 
            hora_servidor_bd: result.rows[0].now 
        });
    } catch (error) {
        console.error('Error conectando a la base de datos:', error);
        res.status(500).json({ error: 'Hubo un problema al conectar con la base de datos' });
    }
});

// Tu ruta original
app.get('/', (req, res) => {
    res.send('¡Hola! El servidor del centro médico está funcionando 🏥');
});

// Ruta para obtener las horas disponibles de un día específico
app.get('/api/horas-disponibles', async (req, res) => {
    try {
        const { fecha } = req.query; 
        
        if (!fecha) {
            return res.status(400).json({ error: 'Debes enviar una fecha en el formato YYYY-MM-DD' });
        }

        const horarioAtencion = [
            '09:00:00', '10:00:00', '11:00:00', '12:00:00', 
            '13:00:00', '14:00:00', '15:00:00', '16:00:00', '17:00:00'
        ];

        const result = await pool.query(
            "SELECT hora FROM citas WHERE fecha = $1 AND estado = 'reservada'", 
            [fecha]
        );
        
        const horasOcupadas = result.rows.map(cita => cita.hora);
        const horasDisponibles = horarioAtencion.filter(hora => !horasOcupadas.includes(hora));

        res.json({
            fecha_consultada: fecha,
            horas_disponibles: horasDisponibles
        });

    } catch (error) {
        console.error('Error al obtener horas:', error);
        res.status(500).json({ error: 'Hubo un problema en el servidor' });
    }
});

// Ruta para crear una nueva reserva (POST)
app.post('/api/reservar', async (req, res) => {
    // 1. Recibimos los datos que envía el usuario desde el frontend
    const { nombre, rut_dni, email, telefono, fecha, hora, motivo } = req.body;

    // 2. Validamos que no falten datos importantes
    if (!nombre || !rut_dni || !email || !fecha || !hora) {
        return res.status(400).json({ error: 'Faltan datos obligatorios para la reserva.' });
    }

    try {
        // 3. Guardamos o actualizamos al paciente
        // El "ON CONFLICT" es una magia de PostgreSQL para que, si el RUT ya existe, 
        // simplemente actualice los datos en lugar de arrojar un error.
        const pacienteResult = await pool.query(
            `INSERT INTO pacientes (nombre, rut_dni, email, telefono) 
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (rut_dni) 
             DO UPDATE SET nombre = EXCLUDED.nombre, email = EXCLUDED.email, telefono = EXCLUDED.telefono
             RETURNING id`,
            [nombre, rut_dni, email, telefono]
        );
        
        const pacienteId = pacienteResult.rows[0].id;

        // 4. Guardamos la reserva médica
        const citaResult = await pool.query(
            `INSERT INTO citas (fecha, hora, paciente_id, estado, motivo)
             VALUES ($1, $2, $3, 'reservada', $4)
             RETURNING *`,
            [fecha, hora, pacienteId, motivo]
        );

        // 5. Respondemos con éxito
        res.status(201).json({
            mensaje: '¡Reserva confirmada con éxito! 🎉',
            cita: citaResult.rows[0]
        });

    } catch (error) {
        console.error('Error al crear la reserva:', error);
        
        // 23505 es el código de error de PostgreSQL para "Violación de restricción única"
        // Esto salta gracias al UNIQUE (fecha, hora) que pusimos al crear la tabla
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Lo sentimos, esa hora acaba de ser reservada por alguien más.' });
        }
        
        res.status(500).json({ error: 'Hubo un problema interno en el servidor.' });
    }
});

// Usamos el puerto del .env o el 3000 por defecto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});