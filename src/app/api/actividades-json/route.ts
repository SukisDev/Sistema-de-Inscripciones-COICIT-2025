import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

interface EventoJSON {
  code: string;
  title: string;
  speaker: string;
  date: string;
  time: string;
  location: string;
  faculty: string;
  type: string;
  status: string;
  capacity?: number;
}

interface ActividadResponse {
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipoActividad = searchParams.get('tipo');
    const unidad = searchParams.get('unidad');
    const estado = searchParams.get('estado') || 'disponible';

    // Leer el archivo events.json
    const eventsPath = join(process.cwd(), 'data', 'events.json');
    let eventos: EventoJSON[] = [];
    
    try {
      const eventsData = readFileSync(eventsPath, 'utf8');
      eventos = JSON.parse(eventsData);
    } catch (fileError) {
      console.error('Error al leer events.json:', fileError);
      // Si no se puede leer el archivo, devolver array vacío
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        message: 'No se pudieron cargar actividades desde el archivo'
      });
    }

    // Aplicar filtros
    let eventosFiltrados = eventos.filter(evento => evento.status === estado);
    
    if (tipoActividad) {
      eventosFiltrados = eventosFiltrados.filter(evento => evento.type === tipoActividad);
    }
    
    if (unidad) {
      eventosFiltrados = eventosFiltrados.filter(evento => 
        evento.faculty.toLowerCase().includes(unidad.toLowerCase())
      );
    }

    // Convertir eventos del JSON a formato de respuesta
    const actividades: ActividadResponse[] = eventosFiltrados.map((evento, index) => ({
      id: (index + 1).toString(),
      codigo_matricula: evento.code,
      descripcion_actividad: evento.title,
      expositor: evento.speaker || 'No especificado',
      fecha_hora_inicio: `2025-${evento.date.replace('/', '-')} ${evento.time.split(' - ')[0]}:00`,
      fecha_hora_fin: `2025-${evento.date.replace('/', '-')} ${evento.time.split(' - ')[1]}:00`,
      ubicacion: evento.location,
      facultad: evento.faculty,
      tipo: evento.type,
      estado: evento.status,
      cupos_disponibles: evento.capacity || 30,
      cupos_totales: evento.capacity || 30
    }));

    return NextResponse.json({
      success: true,
      data: actividades,
      total: actividades.length
    });

  } catch (error) {
    console.error('Error al procesar actividades:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
