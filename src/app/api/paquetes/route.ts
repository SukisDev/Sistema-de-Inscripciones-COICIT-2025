import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const segmento = searchParams.get('segmento');
    const fecha = searchParams.get('fecha') || new Date().toISOString().split('T')[0];

    // Obtener paquetes con sus tarifas vigentes
    const paquetes = await prisma.paquetes.findMany({
      include: {
        detalle_estructura_paquete: {
          include: {
            tipo_actividad: true
          }
        },
        paquete_tarifa: {
          where: {
            vigencia_desde: {
              lte: new Date(fecha)
            }
          },
          orderBy: {
            vigencia_desde: 'desc'
          }
        }
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paquetesConTarifas = paquetes.map((paquete: any) => {
      // Obtener la tarifa más reciente para cada segmento
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tarifasPorSegmento = paquete.paquete_tarifa.reduce((acc: Record<string, number>, tarifa: any) => {
        if (!acc[tarifa.segmento] || tarifa.vigencia_desde > acc[tarifa.segmento + '_fecha']) {
          acc[tarifa.segmento] = Number(tarifa.costo);
          acc[tarifa.segmento + '_fecha'] = tarifa.vigencia_desde;
        }
        return acc;
      }, {});

      // Limpiar fechas temporales
      Object.keys(tarifasPorSegmento).forEach(key => {
        if (key.endsWith('_fecha')) {
          delete tarifasPorSegmento[key];
        }
      });

      // Si se especifica un segmento, filtrar solo esa tarifa
      let tarifas = tarifasPorSegmento;
      if (segmento) {
        tarifas = tarifasPorSegmento[segmento] ? { [segmento]: tarifasPorSegmento[segmento] } : {};
      }

      return {
        id_paquete: paquete.id_paquete,
        nombre: paquete.descripcion_paquete,
        observacion: paquete.observacion,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tipos_actividad_incluidos: paquete.detalle_estructura_paquete.map((detalle: any) => ({
          id: detalle.tipo_actividad.id_tipo_actividad,
          nombre: detalle.tipo_actividad.descripcion_tipo_actividad
        })),
        tarifas: tarifas,
        costo_base: Number(paquete.costo_paquete)
      };
    });

    // Si se especifica un segmento, agregar información adicional
    let segmentoInfo = null;
    if (segmento) {
      const tiposPersona = {
        'docente_tc': 'Docente Tiempo Completo',
        'docente_tp': 'Docente Tiempo Parcial', 
        'estudiante_activo': 'Estudiante Activo',
        'estudiante_egresado': 'Estudiante Egresado',
        'administrativo': 'Personal Administrativo',
        'externo': 'Participante Externo'
      };
      segmentoInfo = {
        segmento,
        descripcion: tiposPersona[segmento as keyof typeof tiposPersona] || segmento,
        fecha_vigencia: fecha
      };
    }

    return NextResponse.json({
      success: true,
      data: paquetesConTarifas,
      segmento_info: segmentoInfo,
      fecha_consulta: fecha
    });

  } catch (error) {
    console.error('Error al obtener paquetes:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
