import { prisma } from '../src/lib/prisma';
import fs from 'fs';
import path from 'path';

// Tipos para el JSON de eventos
interface EventData {
  code: string;           // codigo_matricula
  title: string;          // descripcion_actividad
  speaker: string;        // nombre expositor (ignorar afiliación)
  date: string;           // día/mes
  time: string;           // rango de horas
  location: string;       // salón
  faculty: string;        // unidad
  type: string;           // tipo de actividad
  status: string;         // estado
}

// Mapeo de tipos de actividad
const TIPO_MAPPING: Record<string, string> = {
  'ponencia': 'ponencia',
  'sesion_interactiva': 'sesion_interactiva',
  'sesion_experto': 'sesion_experto',
  'tour': 'tour',
  'sesión interactiva': 'sesion_interactiva',
  'sesión experto': 'sesion_experto',
  'sesión de experto': 'sesion_experto',
  'interactive session': 'sesion_interactiva',
  'expert session': 'sesion_experto'
};

// Mapeo de estados
const ESTADO_MAPPING: Record<string, string> = {
  'disponible': 'disponible',
  'available': 'disponible',
  'cerrada': 'cerrada',
  'closed': 'cerrada',
  'cancelada': 'cancelada',
  'cancelled': 'cancelada',
  'canceled': 'cancelada'
};

// Función para parsear fecha (ejemplo: "15/10" -> "2025-10-15")
function parseDate(dateStr: string): Date {
  const [day, month] = dateStr.split('/');
  const year = 2025; // Año del COICIT
  return new Date(year, parseInt(month) - 1, parseInt(day));
}

// Función para parsear hora (ejemplo: "8:00 - 9:30" -> {inicio: Date, fin: Date})
function parseTime(timeStr: string, baseDate: Date): { inicio: Date; fin: Date } {
  const [inicio, fin] = timeStr.split(' - ');
  
  // Normalizar formato de hora (agregar :00 si solo tiene hora)
  const normalizeTime = (time: string): string => {
    const trimmed = time.trim();
    if (trimmed.includes(':')) {
      return trimmed.padStart(5, '0'); // "8:30" -> "08:30"
    } else {
      return `${trimmed.padStart(2, '0')}:00`; // "8" -> "08:00"
    }
  };

  const inicioNorm = normalizeTime(inicio);
  const finNorm = normalizeTime(fin);

  // Crear objetos Date con la fecha base y la hora
  const fechaInicio = new Date(baseDate);
  const [horaIni, minIni] = inicioNorm.split(':');
  fechaInicio.setHours(parseInt(horaIni), parseInt(minIni), 0, 0);

  const fechaFin = new Date(baseDate);
  const [horaFin, minFin] = finNorm.split(':');
  fechaFin.setHours(parseInt(horaFin), parseInt(minFin), 0, 0);

  return {
    inicio: fechaInicio,
    fin: fechaFin
  };
}

// Función para limpiar y normalizar nombres (utilidad futura)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function normalizeName(name: string): string {
  return name.trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\-\.]/g, ''); // Remover caracteres especiales excepto guiones y puntos
}

async function importEvents() {
  try {
    console.log('🚀 Iniciando importación de eventos...');

    // Leer archivo JSON
    const dataPath = path.join(__dirname, '../data/events.json');
    
    if (!fs.existsSync(dataPath)) {
      throw new Error(`❌ Archivo no encontrado: ${dataPath}\n\nPor favor, coloca tu archivo events.json en: c:\\dev\\coicit-web\\data\\events.json`);
    }

    const jsonData = fs.readFileSync(dataPath, 'utf-8');
    const events: EventData[] = JSON.parse(jsonData);

    console.log(`📊 Procesando ${events.length} eventos...`);

    // Obtener datos de referencia existentes
    const [unidades, espacios, tiposActividad] = await Promise.all([
      prisma.unidad.findMany(),
      prisma.espacio.findMany(),
      prisma.tipo_actividad.findMany()
    ]);

    console.log('\n📋 Datos de referencia:');
    console.log(`- Unidades: ${unidades.length}`);
    console.log(`- Espacios: ${espacios.length}`);
    console.log(`- Tipos de actividad: ${tiposActividad.length}`);

    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const event of events) {
      try {
        // Buscar unidad
        const unidad = unidades.find(u => 
          u.descripcion_unidad.toLowerCase().includes(event.faculty.toLowerCase()) ||
          event.faculty.toLowerCase().includes(u.descripcion_unidad.toLowerCase())
        );

        if (!unidad) {
          throw new Error(`Unidad no encontrada para: ${event.faculty}`);
        }

        // Buscar espacio
        let espacio = espacios.find(e => 
          e.descripcion_espacio.toLowerCase() === event.location.toLowerCase()
        );

        // Si no existe el espacio, crearlo con capacidad por defecto
        if (!espacio) {
          console.log(`⚠️  Creando nuevo espacio: ${event.location}`);
          espacio = await prisma.espacio.create({
            data: {
              descripcion_espacio: event.location,
              capacidad_espacio: 30, // Capacidad por defecto
              ubicacion: 'Por definir'
            }
          });
          espacios.push(espacio); // Agregarlo a la lista para futuras referencias
        }

        // Buscar tipo de actividad
        const tipoKey = event.type.toLowerCase();
        const tipoMapeado = TIPO_MAPPING[tipoKey] || tipoKey;
        const tipoActividad = tiposActividad.find(t => 
          t.descripcion_tipo_actividad === tipoMapeado
        );

        if (!tipoActividad) {
          throw new Error(`Tipo de actividad no encontrado: ${event.type} (mapeado a: ${tipoMapeado})`);
        }

        // Parsear fecha y hora
        const fecha = parseDate(event.date);
        const tiempo = parseTime(event.time, fecha);
        const estado = ESTADO_MAPPING[event.status.toLowerCase()] || 'disponible';

        // Buscar si ya existe una actividad con el mismo código
        const actividadExistente = await prisma.actividad.findUnique({
          where: { codigo_matricula: event.code }
        });

        let expositor = null;
        if (event.speaker && event.speaker.trim() !== '') {
          // Procesar nombre del expositor (ignorar afiliación entre paréntesis)
          const nombreLimpio = event.speaker.replace(/\([^)]*\)/g, '').trim();
          const [primerNombre, ...resto] = nombreLimpio.split(' ');
          const apellido = resto.join(' ') || 'Sin especificar';

          // Buscar si ya existe una persona con este nombre
          let persona = await prisma.persona.findFirst({
            where: {
              primer_nombre: primerNombre,
              primer_apellido: apellido
            }
          });

          // Si no existe, crear la persona
          if (!persona) {
            persona = await prisma.persona.create({
              data: {
                cedula: `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Cédula temporal
                primer_nombre: primerNombre,
                primer_apellido: apellido,
                tipo_persona: 'externo'
              }
            });
          }

          // Buscar o crear expositor
          expositor = await prisma.expositor.findUnique({
            where: { id_persona: persona.id_persona }
          });

          if (!expositor) {
            expositor = await prisma.expositor.create({
              data: {
                id_persona: persona.id_persona,
                especialidad: 'Por definir',
                procedencia: 'Por definir'
              }
            });
          }
        }

        const actividadData = {
          id_tipo_actividad: tipoActividad.id_tipo_actividad,
          id_espacio: espacio.id_espacio,
          id_expositor: expositor?.id_expositor || null,
          id_unidad: unidad.id_unidad,
          codigo_matricula: event.code,
          descripcion_actividad: event.title,
          fecha_inicio: fecha,
          fecha_final: fecha, // Asumimos que es el mismo día
          hora_inicio: tiempo.inicio,
          hora_final: tiempo.fin,
          capacidad_personas: Math.min(espacio.capacidad_espacio, 50), // Limitar a capacidad del espacio
          precio_actividad_individual: 10.00, // Precio por defecto
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          estado: estado as any
        };

        if (actividadExistente) {
          // Actualizar actividad existente
          await prisma.actividad.update({
            where: { id_actividad: actividadExistente.id_actividad },
            data: actividadData
          });
          updatedCount++;
          console.log(`✅ Actualizado: ${event.code} - ${event.title}`);
        } else {
          // Crear nueva actividad
          await prisma.actividad.create({
            data: actividadData
          });
          createdCount++;
          console.log(`🆕 Creado: ${event.code} - ${event.title}`);
        }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        errorCount++;
        const errorMsg = `❌ Error en evento ${event.code}: ${error.message}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    console.log('\n🎯 Resumen de importación:');
    console.log(`✅ Creados: ${createdCount}`);
    console.log(`🔄 Actualizados: ${updatedCount}`);
    console.log(`❌ Errores: ${errorCount}`);

    if (errors.length > 0) {
      console.log('\n🚨 Errores encontrados:');
      errors.forEach(error => console.log(error));
    }

    // Mostrar estadísticas finales
    const totalActividades = await prisma.actividad.count();
    console.log(`\n📊 Total de actividades en BD: ${totalActividades}`);

    console.log('\n🎉 ¡Importación completada!');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('💥 Error durante la importación:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  importEvents();
}

export { importEvents };
