import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();

const registrarPersonaSchema = z.object({
  cedula: z.string().min(1, 'Cédula requerida'),
  primer_nombre: z.string().min(1, 'Primer nombre requerido'),
  segundo_nombre: z.string().optional(),
  primer_apellido: z.string().min(1, 'Primer apellido requerido'),
  segundo_apellido: z.string().optional(),
  correo: z.string().email('Email inválido').optional(),
  telefono: z.string().optional(),
  tipo_persona: z.enum(['estudiante', 'docente', 'administrativo', 'externo'])
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar entrada
    const validatedData = registrarPersonaSchema.parse(body);

    // Verificar si ya existe
    const personaExistente = await prisma.persona.findUnique({
      where: { cedula: validatedData.cedula }
    });

    if (personaExistente) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una persona con esta cédula' },
        { status: 409 }
      );
    }

    // Crear nueva persona
    const nuevaPersona = await prisma.persona.create({
      data: validatedData,
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

    return NextResponse.json({
      success: true,
      data: {
        id: nuevaPersona.id_persona.toString(),
        cedula: nuevaPersona.cedula,
        primer_nombre: nuevaPersona.primer_nombre,
        segundo_nombre: nuevaPersona.segundo_nombre,
        primer_apellido: nuevaPersona.primer_apellido,
        segundo_apellido: nuevaPersona.segundo_apellido,
        correo: nuevaPersona.correo,
        telefono: nuevaPersona.telefono,
        tipo_persona: nuevaPersona.tipo_persona,
        nombre_completo: `${nuevaPersona.primer_nombre} ${nuevaPersona.segundo_nombre || ''} ${nuevaPersona.primer_apellido} ${nuevaPersona.segundo_apellido || ''}`.trim()
      },
      message: 'Persona registrada exitosamente'
    });

  } catch (error) {
    console.error('Error al registrar persona:', error);
    
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
