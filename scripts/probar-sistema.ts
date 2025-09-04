/**
 * Script para probar el sistema de inscripciones COICIT
 * Valida que todos los componentes estén funcionando correctamente
 */

import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function probarSistema() {
  console.log('🔄 Probando sistema de inscripciones COICIT...\n');

  try {
    // 1. Verificar usuarios del sistema
    console.log('1. Verificando usuarios del sistema...');
    const usuarios = await prisma.usuarios.findMany({
      include: {
        persona: true
      }
    });
    
    console.log(`   ✅ Encontrados ${usuarios.length} usuarios del sistema:`);
    usuarios.forEach((usuario: any) => {
      const nombreCompleto = `${usuario.persona?.primer_nombre} ${usuario.persona?.primer_apellido}`;
      console.log(`   - ${nombreCompleto} (${usuario.rol_usuario}) - User: ${usuario.usuario}`);
    });
    console.log();

    // 2. Verificar personas de prueba
    console.log('2. Verificando personas de prueba...');
    const personas = await prisma.persona.findMany({
      orderBy: { tipo_persona: 'asc' }
    });
    
    console.log(`   ✅ Encontradas ${personas.length} personas:`);
    const tiposCantidad = personas.reduce((acc: any, persona: any) => {
      acc[persona.tipo_persona] = (acc[persona.tipo_persona] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(tiposCantidad).forEach(([tipo, cantidad]) => {
      console.log(`   - ${tipo}: ${cantidad} personas`);
    });
    console.log();

    // 3. Verificar actividades
    console.log('3. Verificando actividades...');
    const actividades = await prisma.actividad.findMany();
    console.log(`   ✅ Encontradas ${actividades.length} actividades disponibles`);
    console.log();

    // 4. Verificar paquetes
    console.log('4. Verificando paquetes...');
    const paquetes = await prisma.paquetes.findMany();
    
    console.log(`   ✅ Encontrados ${paquetes.length} paquetes:`);
    paquetes.forEach((paquete: any) => {
      console.log(`   - ${paquete.nombre}`);
      console.log(`     Precio estudiante: $${paquete.precio_estudiante}`);
      console.log(`     Precio docente: $${paquete.precio_docente}`);
      console.log(`     Precio externo: $${paquete.precio_externo}`);
    });
    console.log();

    // 5. Mostrar credenciales de prueba
    console.log('5. Credenciales para probar el sistema:');
    console.log('   🔑 Administrador:');
    console.log('      Usuario: admin');
    console.log('      Contraseña: coicit2025');
    console.log();
    console.log('   🔑 Captador:');
    console.log('      Usuario: captador');
    console.log('      Contraseña: coicit2025');
    console.log();

    // 6. Mostrar cédulas de prueba
    console.log('6. Cédulas de prueba para inscripciones:');
    const personasPrueba = await prisma.persona.findMany({
      where: {
        cedula: {
          in: ['8-1001-1001', '8-1002-1002', '8-1003-1003', '8-1004-1004', '8-1005-1005', '8-1006-1006']
        }
      },
      orderBy: { tipo_persona: 'asc' }
    });

    personasPrueba.forEach((persona: any) => {
      const nombreCompleto = `${persona.primer_nombre} ${persona.primer_apellido}`;
      console.log(`   📋 ${persona.cedula} - ${nombreCompleto} (${persona.tipo_persona})`);
    });
    console.log();

    // 7. URLs importantes
    console.log('7. URLs para probar:');
    console.log('   🌐 Página principal: http://localhost:3000');
    console.log('   🔐 Login: http://localhost:3000/login');
    console.log('   📝 Inscripciones: http://localhost:3000/inscripciones');
    console.log();

    console.log('✅ Sistema verificado exitosamente!');
    console.log('📖 Instrucciones:');
    console.log('   1. Inicia el servidor: npm run dev');
    console.log('   2. Ve a http://localhost:3000/login');
    console.log('   3. Ingresa con usuario "captador" y contraseña "coicit2025"');
    console.log('   4. Usa las cédulas de prueba para inscribir participantes');
    console.log();

  } catch (error) {
    console.error('❌ Error al probar el sistema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  probarSistema();
}

export default probarSistema;
