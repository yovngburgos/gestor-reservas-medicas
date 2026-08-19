const express = require('express');
const cors = require('cors');
const pool = require('./db/db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Obtener todas las especialidades
app.get('/api/especialidades', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM especialidades ORDER BY nombre ASC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener especialidades' });
  }
});

// 2. Obtener médicos por especialidad (o todos si no especifica)
app.get('/api/medicos', async (req, res) => {
  const { especialidad_id } = req.query;
  try {
    let query = `
      SELECT m.id, m.nombre, m.rut_dni, m.email, m.telefono, e.nombre AS especialidad 
      FROM medicos m 
      LEFT JOIN especialidades e ON m.especialidad_id = e.id
    `;
    let params = [];
    if (especialidad_id) {
      query += ' WHERE m.especialidad_id = $1';
      params.push(especialidad_id);
    }
    query += ' ORDER BY m.nombre ASC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener médicos' });
  }
});

// 3. Obtener horas disponibles por médico y fecha
app.get('/api/horas-disponibles', async (req, res) => {
  const { fecha, medico_id } = req.query;
  if (!fecha) {
    return res.status(400).json({ error: 'Debes proporcionar una fecha' });
  }

  const todasLasHoras = [
    '09:00:00', '10:00:00', '11:00:00', '12:00:00',
    '13:00:00', '14:00:00', '15:00:00', '16:00:00', '17:00:00'
  ];

  try {
    let query = 'SELECT hora FROM citas WHERE fecha = $1';
    let params = [fecha];

    if (medico_id) {
      query += ' AND medico_id = $2';
      params.push(medico_id);
    }

    const result = await pool.query(query, params);
    const horasOcupadas = result.rows.map(row => row.hora);
    const horasDisponibles = todasLasHoras.filter(hora => !horasOcupadas.includes(hora));

    res.json({ fecha, medico_id, horas_disponibles: horasDisponibles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar disponibilidad' });
  }
});

// 4. Reservar una cita
app.post('/api/reservar', async (req, res) => {
  const { nombre, rut_dni, email, telefono, fecha, hora, motivo, medico_id } = req.body;

  if (!nombre || !rut_dni || !email || !fecha || !hora || !medico_id) {
    return res.status(400).json({ error: 'Todos los campos obligatorios deben ser completados' });
  }

  try {
    // Verificar si ya existe paciente
    let pacienteRes = await pool.query('SELECT id FROM pacientes WHERE rut_dni = $1', [rut_dni]);
    let pacienteId;

    if (pacienteRes.rows.length === 0) {
      const nuevoPaciente = await pool.query(
        'INSERT INTO pacientes (nombre, rut_dni, email, telefono) VALUES ($1, $2, $3, $4) RETURNING id',
        [nombre, rut_dni, email, telefono]
      );
      pacienteId = nuevoPaciente.rows[0].id;
    } else {
      pacienteId = pacienteRes.rows[0].id;
    }

    // Verificar si la hora está libre para ESE médico
    const citaExistente = await pool.query(
      'SELECT id FROM citas WHERE fecha = $1 AND hora = $2 AND medico_id = $3',
      [fecha, hora, medico_id]
    );

    if (citaExistente.rows.length > 0) {
      return res.status(400).json({ error: 'La hora seleccionada ya no está disponible para este médico.' });
    }

    // Crear cita
    const nuevaCita = await pool.query(
      'INSERT INTO citas (paciente_id, medico_id, fecha, hora, motivo) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [pacienteId, medico_id, fecha, hora, motivo]
    );

    res.status(201).json({ mensaje: '¡Reserva confirmada con éxito! 🎉', cita: nuevaCita.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor al procesar la reserva' });
  }
});

// 5. Panel de Administración: Obtener todas las citas agendadas con detalles
app.get('/api/admin/citas', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.id, 
        c.fecha, 
        c.hora, 
        c.motivo,
        p.nombre AS paciente_nombre, 
        p.rut_dni AS paciente_rut, 
        p.email AS paciente_email, 
        p.telefono AS paciente_telefono,
        m.nombre AS medico_nombre,
        e.nombre AS especialidad
      FROM citas c
      JOIN pacientes p ON c.paciente_id = p.id
      JOIN medicos m ON c.medico_id = m.id
      LEFT JOIN especialidades e ON m.especialidad_id = e.id
      ORDER BY c.fecha DESC, c.hora ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la lista de citas' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});