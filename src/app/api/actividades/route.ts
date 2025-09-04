import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipoActividad = searchParams.get('tipo');
    const unidad = searchParams.get('unidad');
    const estado = searchParams.get('estado') || 'disponible';

    // Construir filtros dinámicos
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      estado: estado,
    };

    if (tipoActividad) {
      where.tipo_actividad = {
        descripcion_tipo_actividad: tipoActividad
      };
    }

    if (unidad) {
      where.unidad = {
        descripcion_unidad: {
          contains: unidad,
          mode: 'insensitive'
        }
      };
    }

    const actividades = await prisma.actividad.findMany({
      where,
      include: {
        tipo_actividad: true,
        espacio: true,
        unidad: true,
        expositor: {
          include: {
            persona: true
          }
        },
        inscripciones: {
          select: {
            id_inscripcion: true
          }
        }
      },
      orderBy: [
        { fecha_inicio: 'asc' },
        { hora_inicio: 'asc' }
      ]
    });

    // Calcular cupos disponibles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actividadesConCupos = actividades.map((actividad: any) => {
      const inscritos = actividad.inscripciones.length;
      const cuposDisponibles = actividad.capacidad_personas - inscritos;

      return {
        id_actividad: actividad.id_actividad,
        codigo_matricula: actividad.codigo_matricula,
        descripcion_actividad: actividad.descripcion_actividad,
        tipo_actividad: actividad.tipo_actividad.descripcion_tipo_actividad,
        unidad: actividad.unidad.descripcion_unidad,
        espacio: {
          nombre: actividad.espacio.descripcion_espacio,
          capacidad_maxima: actividad.espacio.capacidad_espacio,
          ubicacion: actividad.espacio.ubicacion
        },
        expositor: actividad.expositor ? {
          nombre: `${actividad.expositor.persona.primer_nombre} ${actividad.expositor.persona.primer_apellido}`,
          especialidad: actividad.expositor.especialidad,
          procedencia: actividad.expositor.procedencia
        } : null,
        fecha_inicio: actividad.fecha_inicio,
        fecha_final: actividad.fecha_final,
        hora_inicio: actividad.hora_inicio,
        hora_final: actividad.hora_final,
        capacidad_personas: actividad.capacidad_personas,
        inscritos,
        cupos_disponibles: cuposDisponibles,
        precio_individual: actividad.precio_actividad_individual,
        estado: actividad.estado
      };
    });

    return NextResponse.json({
      success: true,
      data: actividadesConCupos,
      total: actividadesConCupos.length
    });

  } catch (error) {
    console.error('Error al obtener actividades:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
