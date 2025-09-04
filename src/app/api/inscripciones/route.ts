import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validación para inscripciones
const inscripcionSchema = z.object({
  id_paquete: z.number().int().positive(),
  id_actividad: z.number().int().positive(),
  id_persona: z.number().int().positive(),
  id_usuario: z.number().int().positive(),
  observacion: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos de entrada
    const validatedData = inscripcionSchema.parse(body);

    // Verificar que la persona, actividad, paquete y usuario existen
    const [persona, actividad, paquete, usuario] = await Promise.all([
      prisma.persona.findUnique({ where: { id_persona: validatedData.id_persona } }),
      prisma.actividad.findUnique({ 
        where: { id_actividad: validatedData.id_actividad },
        include: { tipo_actividad: true }
      }),
      prisma.paquetes.findUnique({ where: { id_paquete: validatedData.id_paquete } }),
      prisma.usuarios.findUnique({ where: { id_usuario: validatedData.id_usuario } })
    ]);

    if (!persona) {
      return NextResponse.json({
        success: false,
        error: 'Persona no encontrada'
      }, { status: 404 });
    }

    if (!actividad) {
      return NextResponse.json({
        success: false,
        error: 'Actividad no encontrada'
      }, { status: 404 });
    }

    if (!paquete) {
      return NextResponse.json({
        success: false,
        error: 'Paquete no encontrado'
      }, { status: 404 });
    }

    if (!usuario) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no encontrado'
      }, { status: 404 });
    }

    // Verificar estado de la actividad
    if (actividad.estado !== 'disponible') {
      return NextResponse.json({
        success: false,
        error: `La actividad está ${actividad.estado}`
      }, { status: 400 });
    }

    try {
      // Crear la inscripción (los triggers de la BD validarán automáticamente)
      const nuevaInscripcion = await prisma.inscripciones.create({
        data: {
          id_paquete: validatedData.id_paquete,
          id_actividad: validatedData.id_actividad,
          id_persona: validatedData.id_persona,
          id_usuario: validatedData.id_usuario,
          observacion: validatedData.observacion || null
        },
        include: {
          actividad: {
            include: {
              tipo_actividad: true,
              espacio: true,
              unidad: true
            }
          },
          paquetes: true,
          persona: true,
          usuarios: {
            include: {
              persona: true
            }
          }
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          id_inscripcion: nuevaInscripcion.id_inscripcion,
          actividad: {
            codigo: nuevaInscripcion.actividad.codigo_matricula,
            descripcion: nuevaInscripcion.actividad.descripcion_actividad,
            tipo: nuevaInscripcion.actividad.tipo_actividad.descripcion_tipo_actividad,
            espacio: nuevaInscripcion.actividad.espacio.descripcion_espacio,
            unidad: nuevaInscripcion.actividad.unidad.descripcion_unidad,
            fecha_inicio: nuevaInscripcion.actividad.fecha_inicio,
            hora_inicio: nuevaInscripcion.actividad.hora_inicio,
            hora_final: nuevaInscripcion.actividad.hora_final
          },
          paquete: {
            nombre: nuevaInscripcion.paquetes.descripcion_paquete
          },
          persona: {
            nombre: `${nuevaInscripcion.persona.primer_nombre} ${nuevaInscripcion.persona.primer_apellido}`,
            cedula: nuevaInscripcion.persona.cedula
          },
          usuario_registro: {
            apodo: nuevaInscripcion.usuarios.apodo_usuario,
            nombre: `${nuevaInscripcion.usuarios.persona.primer_nombre} ${nuevaInscripcion.usuarios.persona.primer_apellido}`
          },
          fecha_inscripcion: nuevaInscripcion.fecha_inscripcion,
          hora_inscripcion: nuevaInscripcion.hora_inscripcion,
          observacion: nuevaInscripcion.observacion
        },
        message: 'Inscripción realizada exitosamente'
      });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (dbError: any) {
      // Traducir errores de triggers a mensajes amigables
      const errorMessage = dbError.message || '';
      
      if (errorMessage.includes('sin cupos disponibles')) {
        return NextResponse.json({
          success: false,
          error: 'No hay cupos disponibles para esta actividad'
        }, { status: 400 });
      }
      
      if (errorMessage.includes('no incluye el tipo de esta actividad')) {
        return NextResponse.json({
          success: false,
          error: 'El paquete seleccionado no incluye este tipo de actividad'
        }, { status: 400 });
      }
      
      if (errorMessage.includes('Límite alcanzado')) {
        return NextResponse.json({
          success: false,
          error: 'Ya alcanzaste el límite de inscripciones para este tipo de actividad en el paquete'
        }, { status: 400 });
      }
      
      if (errorMessage.includes('duplicate key value violates unique constraint')) {
        return NextResponse.json({
          success: false,
          error: 'Ya estás inscrito en esta actividad'
        }, { status: 400 });
      }

      // Error genérico de base de datos
      console.error('Error de base de datos:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Error al procesar la inscripción'
      }, { status: 500 });
    }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Datos de entrada inválidos',
        details: error.issues
      }, { status: 400 });
    }

    console.error('Error al crear inscripción:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
