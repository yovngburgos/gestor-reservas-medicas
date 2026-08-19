import { useState, useEffect } from 'react';

function App() {
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

  const buscarHoras = async (fechaSeleccionada) => {
    if (!fechaSeleccionada) return;
    try {
      const respuesta = await fetch(`http://localhost:3000/api/horas-disponibles?fecha=${fechaSeleccionada}`);
      const data = await respuesta.json();
      setHoras(data.horas_disponibles || []);
    } catch (error) {
      console.error("Error al buscar horas:", error);
    }
  };

  useEffect(() => {
    setHoraSeleccionada(null);
    setMensaje(null);
    buscarHoras(fecha);
  }, [fecha]);

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
          hora: horaSeleccionada
        })
      });

      const data = await respuesta.json();

      if (respuesta.ok) {
        setMensaje({ tipo: 'exito', texto: data.mensaje });
        setHoraSeleccionada(null);
        setFormData({ nombre: '', rut_dni: '', email: '', telefono: '', motivo: '' });
        buscarHoras(fecha); 
      } else {
        setMensaje({ tipo: 'error', texto: data.error });
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error de conexión con el servidor.' });
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 p-6 font-sans">
      <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-lg border border-blue-100">
        <h1 className="text-3xl font-bold text-blue-600 mb-6 text-center">
          Agendar Cita Médica 🏥
        </h1>

        {mensaje && (
          <div className={`p-4 mb-6 rounded-lg font-medium text-center ${
            mensaje.tipo === 'exito' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {mensaje.texto}
          </div>
        )}
        
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">1. Selecciona una fecha:</label>
          <input 
            type="date" 
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>

        {fecha && (
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">2. Selecciona una hora:</label>
            {horas.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {horas.map((hora) => (
                  <button 
                    key={hora}
                    type="button"
                    onClick={() => setHoraSeleccionada(hora)}
                    className={`py-2 rounded-lg font-medium transition-colors duration-200 ${
                      horaSeleccionada === hora 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {hora.slice(0, 5)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-red-500 font-medium bg-red-50 p-4 rounded-lg text-center">
                No hay horas disponibles para este día.
              </p>
            )}
          </div>
        )}

        {horaSeleccionada && (
          <form onSubmit={handleSubmit} className="border-t border-gray-200 pt-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800">3. Datos del Paciente ({horaSeleccionada.slice(0, 5)} hrs)</h3>
            
            <div>
              <input 
                type="text" name="nombre" placeholder="Nombre completo" required
                value={formData.nombre} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="text" name="rut_dni" placeholder="RUT / DNI" required
                value={formData.rut_dni} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input 
                type="tel" name="telefono" placeholder="Teléfono"
                value={formData.telefono} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <input 
                type="email" name="email" placeholder="Correo electrónico" required
                value={formData.email} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <textarea 
                name="motivo" placeholder="Motivo de la consulta (opcional)" rows="2"
                value={formData.motivo} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-md transition-colors"
            >
              Confirmar Reserva
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default App;