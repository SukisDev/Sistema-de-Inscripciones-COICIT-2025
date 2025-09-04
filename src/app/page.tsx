'use client';

import { useState, useEffect } from 'react';
import InscripcionModal from '@/components/InscripcionModal';

interface Actividad {
  id_actividad: number;
  codigo_matricula: string;
  descripcion_actividad: string;
  tipo_actividad: string;
  unidad: string;
  espacio: {
    nombre: string;
    capacidad_maxima: number;
    ubicacion: string;
  };
  expositor: {
    nombre: string;
    especialidad: string;
    procedencia: string;
  } | null;
  fecha_inicio: string;
  fecha_final: string;
  hora_inicio: string;
  hora_final: string;
  capacidad_personas: number;
  inscritos: number;
  cupos_disponibles: number;
  precio_individual: number;
  estado: string;
}

interface Paquete {
  id_paquete: number;
  nombre: string;
  observacion: string;
  tipos_actividad_incluidos: Array<{
    id: number;
    nombre: string;
  }>;
  tarifas: Record<string, number>;
  costo_base: number;
}

export default function Home() {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroUnidad, setFiltroUnidad] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [actividadSeleccionada, setActividadSeleccionada] = useState<Actividad | null>(null);

  useEffect(() => {
    cargarActividades();
    cargarPaquetes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroTipo, filtroUnidad]);

  const cargarActividades = async () => {
    try {
      const params = new URLSearchParams();
      if (filtroTipo) params.append('tipo', filtroTipo);
      if (filtroUnidad) params.append('unidad', filtroUnidad);
      
      const response = await fetch(`/api/actividades?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setActividades(result.data);
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
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (actividad: Actividad) => {
    setActividadSeleccionada(actividad);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setActividadSeleccionada(null);
    // Recargar actividades para actualizar cupos
    cargarActividades();
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatearHora = (hora: string) => {
    return new Date(`2000-01-01T${hora}`).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const obtenerColorTipo = (tipo: string) => {
    const colores = {
      'ponencia': 'bg-blue-100 text-blue-800',
      'sesion_interactiva': 'bg-green-100 text-green-800',
      'sesion_experto': 'bg-purple-100 text-purple-800',
      'tour': 'bg-orange-100 text-orange-800'
    };
    return colores[tipo as keyof typeof colores] || 'bg-gray-100 text-gray-800';
  };

  const tiposActividad = [...new Set(actividades.map((a: Actividad) => a.tipo_actividad))];
  const unidades = [...new Set(actividades.map((a: Actividad) => a.unidad))];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando actividades del COICIT...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Sección de Paquetes */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📦 Paquetes Disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {paquetes.map((paquete: Paquete) => (
              <div key={paquete.id_paquete} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{paquete.nombre}</h3>
                <p className="text-gray-600 mb-4">{paquete.observacion}</p>
                
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Incluye:</h4>
                  <div className="flex flex-wrap gap-2">
                    {paquete.tipos_actividad_incluidos.map((tipo: { id: number; nombre: string }) => (
                      <span
                        key={tipo.id}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${obtenerColorTipo(tipo.nombre)}`}
                      >
                        {tipo.nombre.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {Object.keys(paquete.tarifas).length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Precios:</h4>
                    {Object.entries(paquete.tarifas).map(([segmento, precio]) => (
                      <div key={segmento} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {segmento.replace('_', ' ').toUpperCase()}:
                        </span>
                        <span className="font-semibold text-green-600">${precio as number}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 Actividades Programadas</h2>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Actividad
                </label>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los tipos</option>
                  {tiposActividad.map((tipo: string) => (
                    <option key={tipo} value={tipo}>
                      {tipo.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facultad
                </label>
                <select
                  value={filtroUnidad}
                  onChange={(e) => setFiltroUnidad(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas las facultades</option>
                  {unidades.map((unidad: string) => (
                    <option key={unidad} value={unidad}>
                      {unidad.replace('Facultad de ', '')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFiltroTipo('');
                    setFiltroUnidad('');
                  }}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Actividades */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {actividades.map((actividad: Actividad) => (
            <div
              key={actividad.id_actividad}
              className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-mono text-gray-500">
                        {actividad.codigo_matricula}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${obtenerColorTipo(actividad.tipo_actividad)}`}
                      >
                        {actividad.tipo_actividad.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {actividad.descripcion_actividad}
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      actividad.cupos_disponibles > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {actividad.cupos_disponibles > 0 
                        ? `${actividad.cupos_disponibles} cupos` 
                        : 'Sin cupos'
                      }
                    </div>
                  </div>
                </div>

                {actividad.expositor && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">{actividad.expositor.nombre}</p>
                    <p className="text-sm text-gray-600">{actividad.expositor.especialidad}</p>
                    <p className="text-sm text-gray-600">{actividad.expositor.procedencia}</p>
                  </div>
                )}

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">📅 Fecha:</span>
                    <span>{formatearFecha(actividad.fecha_inicio)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">⏰ Hora:</span>
                    <span>
                      {formatearHora(actividad.hora_inicio)} - {formatearHora(actividad.hora_final)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">📍 Lugar:</span>
                    <span>{actividad.espacio.nombre} ({actividad.espacio.ubicacion})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">🏫 Facultad:</span>
                    <span>{actividad.unidad.replace('Facultad de ', '')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">👥 Capacidad:</span>
                    <span>{actividad.inscritos}/{actividad.capacidad_personas} personas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">💰 Precio individual:</span>
                    <span className="font-semibold text-green-600">${actividad.precio_individual}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => abrirModal(actividad)}
                    className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
                      actividad.cupos_disponibles > 0
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={actividad.cupos_disponibles === 0}
                  >
                    {actividad.cupos_disponibles > 0 ? 'Inscribirse' : 'Sin cupos disponibles'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {actividades.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No se encontraron actividades con los filtros seleccionados.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Inscripción */}
      {actividadSeleccionada && (
        <InscripcionModal
          isOpen={modalOpen}
          onClose={cerrarModal}
          actividad={{
            id_actividad: actividadSeleccionada.id_actividad,
            codigo_matricula: actividadSeleccionada.codigo_matricula,
            descripcion_actividad: actividadSeleccionada.descripcion_actividad,
            precio_individual: actividadSeleccionada.precio_individual,
            cupos_disponibles: actividadSeleccionada.cupos_disponibles
          }}
        />
      )}
    </div>
  );
}
