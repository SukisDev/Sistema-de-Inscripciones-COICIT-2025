'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Persona {
  id: number;
  cedula: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  correo?: string;
  telefono?: string;
  tipo_persona: string;
  nombre_completo: string;
}

interface Actividad {
  id: string;
  codigo_matricula: string;
  descripcion_actividad: string;
  expositor: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  ubicacion: string;
  facultad: string;
  tipo: string;
  estado: string;
  cupos_disponibles: number;
  cupos_totales: number;
}

interface Paquete {
  id_paquete: number;
  nombre: string;
  observacion: string;
  tarifas: Record<string, number>;
  tipos_actividad_incluidos: Array<{
    id: number;
    nombre: string;
  }>;
}

interface Session {
  id: number;
  usuario: string;
  rol: string;
  persona: {
    id: number;
    nombre: string;
    apellido: string;
    email?: string;
  };
}

export default function InscripcionesPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [cedulaBusqueda, setCedulaBusqueda] = useState('');
  const [personaEncontrada, setPersonaEncontrada] = useState<Persona | null>(null);
  const [mostrarFormularioRegistro, setMostrarFormularioRegistro] = useState(false);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Formulario de registro de nueva persona
  const [nuevoRegistro, setNuevoRegistro] = useState({
    cedula: '',
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    correo: '',
    telefono: '',
    tipo_persona: 'estudiante_activo'
  });

  useEffect(() => {
    // Verificar sesión
    const sessionData = localStorage.getItem('coicit_session');
    if (!sessionData) {
      router.push('/login');
      return;
    }

    const parsedSession = JSON.parse(sessionData);
    setSession(parsedSession);

    // Solo captadores y admins pueden acceder
    if (!['captador', 'admin'].includes(parsedSession.rol)) {
      router.push('/login');
      return;
    }

    cargarActividades();
    cargarPaquetes();
  }, [router]);

  const cargarActividades = async () => {
    try {
      const response = await fetch('/api/actividades-json');
      const result = await response.json();
      if (result.success) {
        setActividades(result.data);
        console.log('Actividades cargadas desde JSON:', result.data.length);
      }
    } catch (error) {
      console.error('Error al cargar actividades:', error);
    }
  };

  const cargarPaquetes = async () => {
    try {
      const response = await fetch('/api/paquetes');
      const result = await response.json();
      if (result.success) {
        setPaquetes(result.data);
      }
    } catch (error) {
      console.error('Error al cargar paquetes:', error);
    }
  };

  const buscarPersona = async () => {
    if (!cedulaBusqueda.trim()) return;
    
    setLoading(true);
    setError(null);
    setPersonaEncontrada(null);
    setMostrarFormularioRegistro(false);

    try {
      const response = await fetch(`/api/personas/buscar?cedula=${encodeURIComponent(cedulaBusqueda)}`);
      const result = await response.json();

      if (result.success && result.found) {
        setPersonaEncontrada(result.data);
      } else {
        // Persona no encontrada, mostrar formulario de registro
        setMostrarFormularioRegistro(true);
        setNuevoRegistro(prev => ({ ...prev, cedula: cedulaBusqueda }));
      }
    } catch (error) {
      setError('Error al buscar persona. Por favor intenta de nuevo.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const registrarNuevaPersona = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/personas/registrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nuevoRegistro),
      });

      const result = await response.json();

      if (result.success) {
        setPersonaEncontrada(result.data);
        setMostrarFormularioRegistro(false);
        setError(null);
      } else {
        setError(result.error || 'Error al registrar persona');
      }
    } catch (error) {
      setError('Error de conexión. Por favor intenta de nuevo.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const obtenerPaqueteCompleto = () => {
    if (!personaEncontrada) return null;
    
    // Buscar el paquete "Completo" que tiene todas las actividades
    const paqueteCompleto = paquetes.find(p => 
      p.nombre.toLowerCase().includes('completo') || 
      p.tipos_actividad_incluidos.length === 4 // Todos los tipos
    );
    
    return paqueteCompleto;
  };

  const obtenerPrecioPaquete = (paquete: Paquete) => {
    if (!personaEncontrada) return 0;
    
    // Mapear tipo de persona a segmento de precio
    const segmentoMap: Record<string, string> = {
      'estudiante_activo': 'estudiante_activo',
      'estudiante_egresado': 'estudiante_egresado',
      'docente_tc': 'docente_tc',
      'docente_tp': 'docente_tp',
      'administrativo': 'administrativo',
      'externo': 'externo'
    };
    
    const segmento = segmentoMap[personaEncontrada.tipo_persona];
    return paquete.tarifas[segmento] || paquete.tarifas['externo'] || 0;
  };

  const obtenerTipoPersonaLegible = (tipo: string) => {
    const tiposMap: Record<string, string> = {
      'estudiante_activo': 'Estudiante Activo',
      'estudiante_egresado': 'Estudiante Egresado',
      'docente_tc': 'Docente Tiempo Completo',
      'docente_tp': 'Docente Tiempo Parcial',
      'administrativo': 'Administrativo',
      'externo': 'Participante Externo'
    };
    return tiposMap[tipo] || tipo.toUpperCase();
  };

  const cerrarSesion = () => {
    localStorage.removeItem('coicit_session');
    router.push('/login');
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                📝 Sistema de Inscripciones COICIT
              </h1>
              <p className="text-gray-600">
                Bienvenido/a, {session.persona?.nombre} ({session.rol})
              </p>
            </div>
            <button
              onClick={cerrarSesion}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Paso 1: Buscar/Registrar Participante */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🔍 Paso 1: Buscar Participante
          </h2>
          
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={cedulaBusqueda}
              onChange={(e) => setCedulaBusqueda(e.target.value)}
              placeholder="Ingresa la cédula del participante"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={buscarPersona}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Persona encontrada */}
          {personaEncontrada && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="font-semibold text-green-800 mb-2">✅ Participante encontrado</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Nombre:</strong> {personaEncontrada.nombre_completo}</div>
                <div><strong>Cédula:</strong> {personaEncontrada.cedula}</div>
                <div><strong>Email:</strong> {personaEncontrada.correo || 'No registrado'}</div>
                <div><strong>Teléfono:</strong> {personaEncontrada.telefono || 'No registrado'}</div>
                <div><strong>Categoría:</strong> {obtenerTipoPersonaLegible(personaEncontrada.tipo_persona)}</div>
              </div>
            </div>
          )}

          {/* Formulario de registro */}
          {mostrarFormularioRegistro && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h3 className="font-semibold text-yellow-800 mb-4">
                ⚠️ Participante no encontrado - Registrar nuevo
              </h3>
              <form onSubmit={registrarNuevaPersona} className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={nuevoRegistro.primer_nombre}
                  onChange={(e) => setNuevoRegistro(prev => ({ ...prev, primer_nombre: e.target.value }))}
                  placeholder="Primer nombre *"
                  required
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={nuevoRegistro.segundo_nombre}
                  onChange={(e) => setNuevoRegistro(prev => ({ ...prev, segundo_nombre: e.target.value }))}
                  placeholder="Segundo nombre"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={nuevoRegistro.primer_apellido}
                  onChange={(e) => setNuevoRegistro(prev => ({ ...prev, primer_apellido: e.target.value }))}
                  placeholder="Primer apellido *"
                  required
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={nuevoRegistro.segundo_apellido}
                  onChange={(e) => setNuevoRegistro(prev => ({ ...prev, segundo_apellido: e.target.value }))}
                  placeholder="Segundo apellido"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="email"
                  value={nuevoRegistro.correo}
                  onChange={(e) => setNuevoRegistro(prev => ({ ...prev, correo: e.target.value }))}
                  placeholder="Email"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  value={nuevoRegistro.telefono}
                  onChange={(e) => setNuevoRegistro(prev => ({ ...prev, telefono: e.target.value }))}
                  placeholder="Teléfono"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={nuevoRegistro.tipo_persona}
                  onChange={(e) => setNuevoRegistro(prev => ({ ...prev, tipo_persona: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <optgroup label="Estudiantes">
                    <option value="estudiante_activo">Estudiante Activo</option>
                    <option value="estudiante_egresado">Estudiante Egresado</option>
                  </optgroup>
                  <optgroup label="Docentes">
                    <option value="docente_tc">Docente Tiempo Completo</option>
                    <option value="docente_tp">Docente Tiempo Parcial</option>
                  </optgroup>
                  <optgroup label="Otros">
                    <option value="administrativo">Administrativo</option>
                    <option value="externo">Participante Externo</option>
                  </optgroup>
                </select>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? 'Registrando...' : 'Registrar Participante'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Paso 2: Seleccionar Paquete (solo si hay persona) */}
        {personaEncontrada && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📦 Paso 2: Seleccionar Inscripción
            </h2>
            
            {/* Paquete Completo */}
            {obtenerPaqueteCompleto() && (
              <div className="border-2 border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-blue-800">
                    🎯 Paquete Completo Recomendado
                  </h3>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      ${obtenerPrecioPaquete(obtenerPaqueteCompleto()!)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Para {obtenerTipoPersonaLegible(personaEncontrada.tipo_persona)}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 mb-3">
                  {obtenerPaqueteCompleto()!.observacion}
                </p>
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Incluye todas las actividades:</h4>
                  <div className="flex flex-wrap gap-2">
                    {obtenerPaqueteCompleto()!.tipos_actividad_incluidos.map((tipo) => (
                      <span
                        key={tipo.id}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {tipo.nombre.replace('_', ' ').toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
                <button className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors">
                  Inscribir en Paquete Completo
                </button>
              </div>
            )}

            {/* Nota sobre actividades individuales */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-gray-600 text-sm">
                💡 <strong>Nota:</strong> Las actividades individuales estarán disponibles después de completar la inscripción al paquete completo.
              </p>
            </div>
          </div>
        )}

        {/* Sección de Actividades Disponibles */}
        {actividades.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">📅 Actividades Disponibles</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {actividades.map((actividad) => (
                <div key={actividad.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="mb-2">
                    <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                      {actividad.codigo_matricula}
                    </span>
                    <span className="ml-2 inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      {actividad.tipo}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                    {actividad.descripcion_actividad}
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Expositor:</strong> {actividad.expositor}</p>
                    <p><strong>Ubicación:</strong> {actividad.ubicacion}</p>
                    <p><strong>Horario:</strong> {new Date(actividad.fecha_hora_inicio).toLocaleString('es-PA', {
                      weekday: 'short',
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })} - {new Date(actividad.fecha_hora_fin).toLocaleTimeString('es-PA', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                    <p><strong>Cupos:</strong> {actividad.cupos_disponibles}/{actividad.cupos_totales}</p>
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    {actividad.facultad}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
