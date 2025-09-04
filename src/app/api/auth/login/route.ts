import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Schema de validación para login
const loginSchema = z.object({
  apodo_usuario: z.string().min(1, 'El usuario es requerido'),
  contrasena: z.string().min(1, 'La contraseña es requerida')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos de entrada
    const validatedData = loginSchema.parse(body);

    // Buscar usuario
    const usuario = await prisma.usuarios.findUnique({
      where: {
        apodo_usuario: validatedData.apodo_usuario
      },
      include: {
        persona: true
      }
    });

    if (!usuario) {
      return NextResponse.json({
        success: false,
        error: 'Usuario o contraseña incorrectos'
      }, { status: 401 });
    }

    // Verificar contraseña
    const passwordValid = await bcrypt.compare(
      validatedData.contrasena, 
      usuario.contrasena_usuario
    );

    if (!passwordValid) {
      return NextResponse.json({
        success: false,
        error: 'Usuario o contraseña incorrectos'
      }, { status: 401 });
    }

    // Login exitoso - devolver información del usuario (sin contraseña)
    return NextResponse.json({
      success: true,
      data: {
        id_usuario: usuario.id_usuario,
        apodo_usuario: usuario.apodo_usuario,
        rol: usuario.rol,
        persona: {
          id_persona: usuario.persona.id_persona,
          nombre_completo: `${usuario.persona.primer_nombre} ${usuario.persona.primer_apellido}`,
          primer_nombre: usuario.persona.primer_nombre,
          segundo_nombre: usuario.persona.segundo_nombre,
          primer_apellido: usuario.persona.primer_apellido,
          segundo_apellido: usuario.persona.segundo_apellido,
          cedula: usuario.persona.cedula,
          correo: usuario.persona.correo,
          telefono: usuario.persona.telefono,
          tipo_persona: usuario.persona.tipo_persona
        },
        created_at: usuario.created_at,
        updated_at: usuario.updated_at
      },
      message: 'Login exitoso'
    });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Datos de entrada inválidos',
        details: error.issues
      }, { status: 400 });
    }

    console.error('Error en login:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
