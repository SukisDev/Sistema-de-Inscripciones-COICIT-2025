import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();

const buscarPersonaSchema = z.object({
  cedula: z.string().min(1, 'Cédula requerida')
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cedula = searchParams.get('cedula');
    
    if (!cedula) {
      return NextResponse.json(
        { success: false, error: 'Cédula requerida' },
        { status: 400 }
      );
    }

    // Validar entrada
    buscarPersonaSchema.parse({ cedula });

    // Buscar persona
    const persona = await prisma.persona.findUnique({
      where: { cedula },
      select: {
        id_persona: true,
        cedula: true,
        primer_nombre: true,
        segundo_nombre: true,
        primer_apellido: true,
        segundo_apellido: true,
        correo: true,
        telefono: true,
        tipo_persona: true
      }
    });

    if (!persona) {
      return NextResponse.json({
        success: false,
        found: false,
        message: 'Persona no encontrada'
      });
    }

    // Persona encontrada
    return NextResponse.json({
      success: true,
      found: true,
      data: {
        id: persona.id_persona.toString(),
        cedula: persona.cedula,
        primer_nombre: persona.primer_nombre,
        segundo_nombre: persona.segundo_nombre,
        primer_apellido: persona.primer_apellido,
        segundo_apellido: persona.segundo_apellido,
        correo: persona.correo,
        telefono: persona.telefono,
        tipo_persona: persona.tipo_persona,
        // Nombre completo para mostrar
        nombre_completo: `${persona.primer_nombre} ${persona.segundo_nombre || ''} ${persona.primer_apellido} ${persona.segundo_apellido || ''}`.trim()
      }
    });

  } catch (error) {
    console.error('Error al buscar persona:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
