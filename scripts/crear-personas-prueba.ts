import { PrismaClient } from '@/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function crearPersonasDePrueba() {
  console.log('🚀 Creando personas de prueba para COICIT...');

  try {
    // 1. Estudiantes (3)
    const estudiantes = [
      {
        cedula: '8-1001-1001',
        primer_nombre: 'María',
        primer_apellido: 'González',
        telefono: '6234-5678',
        correo: 'maria.gonzalez@estudiante.utp.ac.pa',
        tipo_persona: 'estudiante_activo' as const
      },
      {
        cedula: '8-1002-1002',
        primer_nombre: 'Carlos',
        primer_apellido: 'Rodríguez',
        telefono: '6345-6789',
        correo: 'carlos.rodriguez@estudiante.utp.ac.pa',
        tipo_persona: 'estudiante_activo' as const
      },
      {
        cedula: '8-1003-1003',
        primer_nombre: 'Ana',
        primer_apellido: 'Martínez',
        telefono: '6456-7890',
        correo: 'ana.martinez@estudiante.utp.ac.pa',
        tipo_persona: 'estudiante_egresado' as const
      }
    ];

    // 2. Docentes (2)
    const docente_tc = {
      cedula: '8-1004-1004',
      primer_nombre: 'Roberto',
      primer_apellido: 'Fernández',
      telefono: '6567-8901',
      correo: 'roberto.fernandez@utp.ac.pa',
      tipo_persona: 'docente_tc' as const
    };

    const docente_tp = {
      cedula: '8-1005-1005',
      primer_nombre: 'Patricia',
      primer_apellido: 'Morales',
      telefono: '6578-9012',
      correo: 'patricia.morales@utp.ac.pa',
      tipo_persona: 'docente_tp' as const
    };

    // 3. Administrativo
    const administrativo = {
      cedula: '8-1006-1006',
      primer_nombre: 'Lucía',
      primer_apellido: 'Herrera',
      telefono: '6678-9012',
      correo: 'lucia.herrera@utp.ac.pa',
      tipo_persona: 'administrativo' as const
    };

    // 4. Participante externo
    const externo = {
      cedula: '8-1007-1007',
      primer_nombre: 'Miguel',
      primer_apellido: 'Torres',
      telefono: '6789-0123',
      correo: 'miguel.torres@empresa.com',
      tipo_persona: 'externo' as const
    };

    // Crear todas las personas
    const todasLasPersonas = [...estudiantes, docente_tc, docente_tp, administrativo, externo];
    
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

    // 5. Crear usuarios del sistema (admin y captador)
    const passwordHash = await bcrypt.hash('coicit2025', 10);

    const usuarios = [
      {
        persona: {
          cedula: '8-0001-0001',
          primer_nombre: 'Administrador',
          primer_apellido: 'Sistema',
          telefono: '6000-0001',
          correo: 'admin@coicit.utp.ac.pa',
          tipo_persona: 'administrativo' as const
        },
        usuario: {
          apodo_usuario: 'admin',
          contrasena_usuario: passwordHash,
          rol: 'admin' as const
        }
      },
      {
        persona: {
          cedula: '8-0002-0002',
          primer_nombre: 'María Elena',
          primer_apellido: 'Captador',
          telefono: '6000-0002',
          correo: 'captador@coicit.utp.ac.pa',
          tipo_persona: 'administrativo' as const
        },
        usuario: {
          apodo_usuario: 'captador',
          contrasena_usuario: passwordHash,
          rol: 'captador' as const
        }
      }
    ];

    for (const userData of usuarios) {
      // Crear/actualizar la persona primero
      const personaExistente = await prisma.persona.findUnique({
        where: { cedula: userData.persona.cedula }
      });

      let personaId: bigint;

      if (personaExistente) {
        const personaActualizada = await prisma.persona.update({
          where: { cedula: userData.persona.cedula },
          data: userData.persona
        });
        personaId = personaActualizada.id_persona;
        console.log(`🔄 Persona actualizada: ${userData.persona.primer_nombre} ${userData.persona.primer_apellido}`);
      } else {
        const personaNueva = await prisma.persona.create({
          data: userData.persona
        });
        personaId = personaNueva.id_persona;
        console.log(`✅ Persona creada: ${userData.persona.primer_nombre} ${userData.persona.primer_apellido}`);
      }

      // Crear/actualizar el usuario
      const usuarioExistente = await prisma.usuarios.findUnique({
        where: { apodo_usuario: userData.usuario.apodo_usuario }
      });

      if (usuarioExistente) {
        await prisma.usuarios.update({
          where: { apodo_usuario: userData.usuario.apodo_usuario },
          data: {
            ...userData.usuario,
            id_persona: personaId
          }
        });
        console.log(`🔄 Usuario actualizado: ${userData.usuario.apodo_usuario}`);
      } else {
        await prisma.usuarios.create({
          data: {
            ...userData.usuario,
            id_persona: personaId
          }
        });
        console.log(`✅ Usuario creado: ${userData.usuario.apodo_usuario} (${userData.usuario.rol})`);
      }
    }

    console.log('\n🎯 Resumen de personas de prueba:');
    console.log(`✅ Personas creadas: ${creadas}`);
    console.log(`🔄 Personas actualizadas: ${actualizadas}`);
    console.log(`👥 Total de personas: ${todasLasPersonas.length}`);
    console.log(`🔐 Usuarios del sistema: 2 (admin/captador)`);
    console.log(`🔑 Password para ambos usuarios: coicit2025`);

    console.log('\n📊 Categorías creadas:');
    console.log('• 3 Estudiantes UTP');
    console.log('• 1 Docente UTP');
    console.log('• 1 Administrativo UTP');
    console.log('• 1 Participante Externo');
    console.log('• 2 Usuarios del Sistema');

    return { creadas, actualizadas, totalPersonas: todasLasPersonas.length };

  } catch (error) {
    console.error('❌ Error al crear personas de prueba:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  crearPersonasDePrueba()
    .then(() => {
      console.log('\n🎉 ¡Personas de prueba creadas exitosamente!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

export default crearPersonasDePrueba;
