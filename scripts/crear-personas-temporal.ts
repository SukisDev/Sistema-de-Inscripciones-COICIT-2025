/**
 * Script temporal para crear personas de prueba con los tipos actuales en la BD
 * Hasta que podamos aplicar las migraciones completas
 */

import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function crearPersonasTemporales() {
  console.log('🚀 Creando personas de prueba temporales...');

  try {
    // 1. Estudiantes (usando 'estudiante' genérico por ahora)
    const estudiantes = [
      {
        cedula: '8-1001-1001',
        primer_nombre: 'María',
        primer_apellido: 'González',
        telefono: '6234-5678',
        correo: 'maria.gonzalez@estudiante.utp.ac.pa',
        tipo_persona: 'estudiante' as const
      },
      {
        cedula: '8-1002-1002',
        primer_nombre: 'Carlos',
        primer_apellido: 'Rodríguez',
        telefono: '6345-6789',
        correo: 'carlos.rodriguez@estudiante.utp.ac.pa',
        tipo_persona: 'estudiante' as const
      },
      {
        cedula: '8-1003-1003',
        primer_nombre: 'Ana',
        primer_apellido: 'Martínez',
        telefono: '6456-7890',
        correo: 'ana.martinez@estudiante.utp.ac.pa',
        tipo_persona: 'estudiante' as const
      }
    ];

    // 2. Docente
    const docente = {
      cedula: '8-1004-1004',
      primer_nombre: 'Roberto',
      primer_apellido: 'Fernández',
      telefono: '6567-8901',
      correo: 'roberto.fernandez@utp.ac.pa',
      tipo_persona: 'docente' as const
    };

    // 3. Administrativo
    const administrativo = {
      cedula: '8-1005-1005',
      primer_nombre: 'Patricia',
      primer_apellido: 'Morales',
      telefono: '6578-9012',
      correo: 'patricia.morales@utp.ac.pa',
      tipo_persona: 'administrativo' as const
    };

    // 4. Participante externo
    const externo = {
      cedula: '8-1006-1006',
      primer_nombre: 'Miguel',
      primer_apellido: 'Torres',
      telefono: '6789-0123',
      correo: 'miguel.torres@empresa.com',
      tipo_persona: 'externo' as const
    };

    // Crear todas las personas
    const todasLasPersonas = [...estudiantes, docente, administrativo, externo];
    
    let creadas = 0;
    let actualizadas = 0;

    for (const persona of todasLasPersonas) {
      const personaExistente = await prisma.persona.findUnique({
        where: { cedula: persona.cedula }
      });

      if (personaExistente) {
        await prisma.persona.update({
          where: { cedula: persona.cedula },
          data: persona
        });
        actualizadas++;
        console.log(`🔄 Actualizada: ${persona.primer_nombre} ${persona.primer_apellido} (${persona.tipo_persona})`);
      } else {
        await prisma.persona.create({
          data: persona
        });
        creadas++;
        console.log(`✅ Creada: ${persona.primer_nombre} ${persona.primer_apellido} (${persona.tipo_persona})`);
      }
    }

    // 5. Crear usuarios del sistema
    const hashPassword = await bcrypt.hash('coicit2025', 10);

    // Admin
    const adminPersona = await prisma.persona.upsert({
      where: { cedula: '0-000-0001' },
      update: {},
      create: {
        cedula: '0-000-0001',
        primer_nombre: 'Administrador',
        primer_apellido: 'Sistema',
        correo: 'admin@coicit.utp.ac.pa',
        tipo_persona: 'administrativo'
      }
    });

    await prisma.usuarios.upsert({
      where: { apodo_usuario: 'admin' },
      update: {
        password: hashPassword
      },
      create: {
        apodo_usuario: 'admin',
        password: hashPassword,
        rol_usuario: 'admin',
        id_persona: adminPersona.id_persona
      }
    });

    // Captador
    const captadorPersona = await prisma.persona.upsert({
      where: { cedula: '0-000-0002' },
      update: {},
      create: {
        cedula: '0-000-0002',
        primer_nombre: 'María Elena',
        primer_apellido: 'Captador',
        correo: 'captador@coicit.utp.ac.pa',
        tipo_persona: 'administrativo'
      }
    });

    await prisma.usuarios.upsert({
      where: { apodo_usuario: 'captador' },
      update: {
        password: hashPassword
      },
      create: {
        apodo_usuario: 'captador',
        password: hashPassword,
        rol_usuario: 'captador',
        id_persona: captadorPersona.id_persona
      }
    });

    console.log(`\n✅ Proceso completado:`);
    console.log(`   - Personas creadas: ${creadas}`);
    console.log(`   - Personas actualizadas: ${actualizadas}`);
    console.log(`   - Usuarios del sistema: 2 (admin, captador)`);
    console.log(`\n🔑 Credenciales:`);
    console.log(`   - Usuario: admin / Contraseña: coicit2025`);
    console.log(`   - Usuario: captador / Contraseña: coicit2025`);

  } catch (error) {
    console.error('❌ Error al crear personas de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  crearPersonasTemporales();
}

export default crearPersonasTemporales;
