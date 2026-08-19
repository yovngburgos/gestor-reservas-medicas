import { useState, useEffect } from 'react';

function App() {
  // Pestaña activa ('paciente' o 'admin')
  const [tab, setTab] = useState('paciente');

  // Estados para el flujo de reserva
  const [especialidades, setEspecialidades] = useState([]);
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState('');
  const [medicos, setMedicos] = useState([]);
  const [medicoSeleccionado, setMedicoSeleccionado] = useState('');
  const [fecha, setFecha] = useState('');
  const [horas, setHoras] = useState([]);
  const [horaSeleccionada, setHoraSeleccionada] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    rut_dni: '',
    email: '',
    telefono: '',
    motivo: ''
  });

  // Estados para el Panel Administrativo
  const [citasAdmin, setCitasAdmin] = useState([]);

  // 1. Cargar especialidades al montar el componente
  useEffect(() => {
    fetch('http://localhost:3000/api/especialidades')
      .then(res => res.json())
      .then(data => setEspecialidades(data))
      .catch(err => console.error("Error al cargar especialidades:", err));
  }, []);

  // 2. Cargar médicos cuando cambia la especialidad
  useEffect(() => {
    if (!especialidadSeleccionada) {
      setMedicos([]);
      setMedicoSeleccionado('');
      return;
    }
    fetch(`http://localhost:3000/api/medicos?especialidad_id=${especialidadSeleccionada}`)
      .then(res => res.json())
      .then(data => setMedicos(data))
      .catch(err => console.error("Error al cargar médicos:", err));
  }, [especialidadSeleccionada]);

  // 3. Cargar horas disponibles cuando cambian médico o fecha
  useEffect(() => {
    setHoraSeleccionada(null);
    if (!fecha || !medicoSeleccionado) {
      setHoras([]);
      return;
    }
    fetch(`http://localhost:3000/api/horas-disponibles?fecha=${fecha}&medico_id=${medicoSeleccionado}`)
      .then(res => res.json())
      .then(data => setHoras(data.horas_disponibles || []))
      .catch(err => console.error("Error al cargar horas:", err));
  }, [fecha, medicoSeleccionado]);

  // 4. Cargar la lista de citas cuando se abre la pestaña de Admin
  const cargarCitasAdmin = () => {
    fetch('http://localhost:3000/api/admin/citas')
      .then(res => res.json())
      .then(data => setCitasAdmin(data))
      .catch(err => console.error("Error al cargar citas de admin:", err));
  };

  // 5. Cancelar una cita desde el panel administrativo
  const cancelarCita = async (id) => {
    const confirmar = window.confirm('¿Estás seguro de que deseas cancelar esta cita médica?');
    if (!confirmar) return;

    try {
      const respuesta = await fetch(`http://localhost:3000/api/admin/citas/${id}`, {
        method: 'DELETE'
      });

      const data = await respuesta.json();

      if (respuesta.ok) {
        alert(data.mensaje);
        cargarCitasAdmin(); // Recargar la tabla automáticamente
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error al cancelar la cita:", error);
      alert("Error de conexión al intentar cancelar.");
    }
  };

  useEffect(() => {
    if (tab === 'admin') {
      cargarCitasAdmin();
    }
  }, [tab]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje(null);

    try {
      const respuesta = await fetch('http://localhost:3000/api/reservar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fecha,
          hora: horaSeleccionada,
          medico_id: medicoSeleccionado
        })
      });

      const data = await respuesta.json();

      if (respuesta.ok) {
        setMensaje({ tipo: 'exito', texto: data.mensaje });
        setHoraSeleccionada(null);
        setFormData({ nombre: '', rut_dni: '', email: '', telefono: '', motivo: '' });
        // Recargar horas disponibles
        fetch(`http://localhost:3000/api/horas-disponibles?fecha=${fecha}&medico_id=${medicoSeleccionado}`)
          .then(res => res.json())
          .then(d => setHoras(d.horas_disponibles || []));
      } else {
        setMensaje({ tipo: 'error', texto: data.error });
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error de conexión con el servidor.' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <header className="max-w-4xl mx-auto mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-blue-800 tracking-tight mb-2">
          Centro Médico San Gabriel 🏥
        </h1>
        <p className="text-slate-600">Plataforma de Reserva de Horas Médicas</p>

        {/* Selector de Pestañas */}
        <div className="flex justify-center mt-6 gap-2">
          <button 
            onClick={() => setTab('paciente')}
            className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
              tab === 'paciente' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            Reservar Cita (Paciente)
          </button>
          <button 
            onClick={() => setTab('admin')}
            className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
              tab === 'admin' 
                ? 'bg-slate-800 text-white shadow-md' 
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            Panel de Administración ⚙️
          </button>
        </div>
      </header>

      {/* VISTA 1: FORMULARIO PACIENTE */}
      {tab === 'paciente' && (
        <main className="max-w-xl mx-auto bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-slate-200">
          {mensaje && (
            <div className={`p-4 mb-6 rounded-xl font-medium text-center ${
              mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {mensaje.texto}
            </div>
          )}

          <div className="space-y-5">
            {/* 1. Especialidad */}
            <div>
              <label className="block text-slate-700 font-semibold mb-2">1. Selecciona Especialidad:</label>
              <select 
                className="w-full border border-slate-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={especialidadSeleccionada}
                onChange={(e) => setEspecialidadSeleccionada(e.target.value)}
              >
                <option value="">-- Elige una especialidad --</option>
                {especialidades.map(e => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>

            {/* 2. Médico */}
            {especialidadSeleccionada && (
              <div>
                <label className="block text-slate-700 font-semibold mb-2">2. Selecciona Médico:</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={medicoSeleccionado}
                  onChange={(e) => setMedicoSeleccionado(e.target.value)}
                >
                  <option value="">-- Elige un profesional --</option>
                  {medicos.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 3. Fecha */}
            {medicoSeleccionado && (
              <div>
                <label className="block text-slate-700 font-semibold mb-2">3. Selecciona Fecha:</label>
                <input 
                  type="date" 
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
            )}

            {/* 4. Horas Disponibles */}
            {fecha && medicoSeleccionado && (
              <div>
                <label className="block text-slate-700 font-semibold mb-2">4. Horas Disponibles:</label>
                {horas.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {horas.map((h) => (
                      <button 
                        key={h}
                        type="button"
                        onClick={() => setHoraSeleccionada(h)}
                        className={`py-2 rounded-lg font-medium transition-all ${
                          horaSeleccionada === h 
                            ? 'bg-blue-600 text-white shadow-md scale-105' 
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        {h.slice(0, 5)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-rose-600 font-medium bg-rose-50 p-4 rounded-xl text-center">
                    No hay horas disponibles para este día y profesional.
                  </p>
                )}
              </div>
            )}

            {/* 5. Datos Paciente */}
            {horaSeleccionada && (
              <form onSubmit={handleSubmit} className="border-t border-slate-200 pt-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-800">5. Completa tus Datos</h3>
                
                <input 
                  type="text" name="nombre" placeholder="Nombre completo" required
                  value={formData.nombre} onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="text" name="rut_dni" placeholder="RUT / DNI" required
                    value={formData.rut_dni} onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input 
                    type="tel" name="telefono" placeholder="Teléfono"
                    value={formData.telefono} onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <input 
                  type="email" name="email" placeholder="Correo electrónico" required
                  value={formData.email} onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />

                <textarea 
                  name="motivo" placeholder="Motivo de la consulta (opcional)" rows="2"
                  value={formData.motivo} onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />

                <button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all text-lg"
                >
                  Confirmar Reserva Médica
                </button>
              </form>
            )}
          </div>
        </main>
      )}

      {/* VISTA 2: PANEL DE ADMINISTRACIÓN */}
      {tab === 'admin' && (
        <main className="max-w-5xl mx-auto bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Agenda Médica Registrada</h2>
            <button 
              onClick={cargarCitasAdmin}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg text-sm transition-all"
            >
              🔄 Actualizar Citas
            </button>
          </div>

          {citasAdmin.length === 0 ? (
            <p className="text-center py-12 text-slate-500 italic bg-slate-50 rounded-xl">
              No hay citas agendadas registradas aún.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-sm">
                    <th className="p-3">Fecha y Hora</th>
                    <th className="p-3">Paciente</th>
                    <th className="p-3">RUT / DNI</th>
                    <th className="p-3">Médico</th>
                    <th className="p-3">Especialidad</th>
                    <th className="p-3">Contacto</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {citasAdmin.map((cita) => (
                    <tr key={cita.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-semibold text-blue-700">
                        {cita.fecha?.slice(0, 10)} <br />
                        <span className="text-slate-500 font-normal">{cita.hora?.slice(0, 5)} hrs</span>
                      </td>
                      <td className="p-3 font-medium text-slate-900">{cita.paciente_nombre}</td>
                      <td className="p-3">{cita.paciente_rut}</td>
                      <td className="p-3 font-medium">{cita.medico_nombre}</td>
                      <td className="p-3">
                        <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-xs font-semibold">
                          {cita.especialidad}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-slate-500">
                        {cita.paciente_email} <br />
                        {cita.paciente_telefono}
                      </td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => cancelarCita(cita.id)}
                          className="bg-rose-100 hover:bg-rose-200 text-rose-700 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-sm"
                        >
                          Cancelar ❌
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      )}
    </div>
  );
}

export default App;