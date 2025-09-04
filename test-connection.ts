import { prisma } from './src/lib/prisma';

async function testConnection() {
  try {
    console.log('🔍 Probando conexión a Supabase...');
    
    // Test 1: Verificar que podemos conectar
    await prisma.$connect();
    console.log('✅ Conexión exitosa a Supabase');

    // Test 2: Contar tablas principales
    const [
      totalPersonas,
      totalUnidades,
      totalEspacios,
      totalTiposActividad,
      totalPaquetes,
      totalActividades
    ] = await Promise.all([
      prisma.persona.count(),
      prisma.unidad.count(),
      prisma.espacio.count(),
      prisma.tipo_actividad.count(),
      prisma.paquetes.count(),
      prisma.actividad.count()
    ]);

    console.log('\n📊 Estado de las tablas:');
    console.log(`- Personas: ${totalPersonas}`);
    console.log(`- Unidades: ${totalUnidades}`);
    console.log(`- Espacios: ${totalEspacios}`);
    console.log(`- Tipos de actividad: ${totalTiposActividad}`);
    console.log(`- Paquetes: ${totalPaquetes}`);
    console.log(`- Actividades: ${totalActividades}`);

    // Test 3: Verificar datos semilla
    const unidades = await prisma.unidad.findMany({
      select: { descripcion_unidad: true }
    });
    
    console.log('\n🏫 Facultades registradas:');
    unidades.forEach((u: any) => console.log(`- ${u.descripcion_unidad}`));

    const paquetes = await prisma.paquetes.findMany({
      select: { 
        descripcion_paquete: true,
        costo_paquete: true
      }
    });
    
    console.log('\n📦 Paquetes disponibles:');
    paquetes.forEach((p: any) => console.log(`- ${p.descripcion_paquete}: $${p.costo_paquete}`));

    const espacios = await prisma.espacio.findMany({
      select: { 
        descripcion_espacio: true,
        capacidad_espacio: true,
        ubicacion: true
      },
      orderBy: { capacidad_espacio: 'desc' },
      take: 5
    });
    
    console.log('\n🏢 Espacios con mayor capacidad:');
    espacios.forEach((e: any) => console.log(`- ${e.descripcion_espacio}: ${e.capacidad_espacio} personas (${e.ubicacion})`));

    console.log('\n🎯 ¡Base de datos lista para el COICIT!');

  } catch (error) {
    console.error('❌ Error de conexión:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
