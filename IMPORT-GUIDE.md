# 📋 Script de Importación de Eventos COICIT

Este script permite importar eventos desde un archivo JSON a la base de datos de Supabase.

## 📁 **Ubicación del archivo JSON**
Coloca tu archivo `events.json` en:
```
c:\dev\coicit-web\data\events.json
```

## 📄 **Formato del JSON**
El archivo debe contener un array de objetos con el siguiente formato:

```json
[
  {
    "code": "COI-001",
    "title": "Título de la actividad",
    "speaker": "Nombre del expositor (afiliación opcional)",
    "date": "15/10",
    "time": "8:00 - 9:30",
    "location": "Sala Conferencias",
    "faculty": "Facultad de Ingeniería de Sistemas Computacionales",
    "type": "ponencia",
    "status": "disponible"
  }
]
```

### 🔍 **Campos explicados:**
- **`code`**: Código único de la actividad (se usa como `codigo_matricula`)
- **`title`**: Descripción de la actividad
- **`speaker`**: Nombre del expositor (puede estar vacío para tours)
- **`date`**: Fecha en formato DD/MM (asume año 2025)
- **`time`**: Rango de horas en formato "HH:MM - HH:MM"
- **`location`**: Nombre del salón/espacio
- **`faculty`**: Nombre de la facultad (debe coincidir con las registradas)
- **`type`**: Tipo de actividad (`ponencia`, `sesion_interactiva`, `sesion_experto`, `tour`)
- **`status`**: Estado (`disponible`, `cerrada`, `cancelada`)

## 🏫 **Facultades disponibles:**
- Facultad de Ingeniería de Sistemas Computacionales
- Facultad de Ingeniería Industrial
- Facultad de Ingeniería Civil
- Facultad de Ingeniería Mecánica
- Facultad de Ingeniería Eléctrica
- Facultad de Ciencias y Tecnología

## 🏢 **Espacios preconfigurados:**
- Sala Conferencias (100 personas)
- Salón Galo Chang (70 personas)
- C1, C3, A-14, A-6, A-3
- PROINTEC 1, PROINTEC 2
- Lab TED, Lab FIM 4.0, Lab A-9, Lab A-12, Lab FISC, LAI

> **Nota:** Si un espacio no existe, se creará automáticamente con capacidad de 30 personas.

## 🚀 **Cómo ejecutar:**

### 1. **Colocar el archivo JSON:**
```bash
# Copia tu archivo events.json a:
c:\dev\coicit-web\data\events.json
```

### 2. **Ejecutar el script:**
```bash
# Opción 1: Usar npm script
npm run import:events

# Opción 2: Ejecutar directamente
npx tsx scripts/import-events.ts
```

## 🔧 **Funcionalidades del script:**

### ✅ **Validaciones automáticas:**
- Verifica que existan las facultades
- Crea espacios faltantes automáticamente
- Valida tipos de actividad
- Normaliza estados y formatos

### 👥 **Gestión de expositores:**
- Crea automáticamente personas para expositores nuevos
- Ignora texto entre paréntesis (afiliaciones)
- Asigna cédulas temporales a expositores

### 🔄 **Actualización inteligente:**
- Si existe una actividad con el mismo `code`, la actualiza
- Si no existe, la crea nueva
- Mantiene log detallado del proceso

### 📊 **Reporte de resultados:**
```
🎯 Resumen de importación:
✅ Creados: 15
🔄 Actualizados: 3
❌ Errores: 0

📊 Total de actividades en BD: 18
```

## 🛠️ **Solución de problemas:**

### ❌ **Error: Archivo no encontrado**
```
❌ Archivo no encontrado: c:\dev\coicit-web\data\events.json
```
**Solución:** Verifica que el archivo esté en la ruta correcta.

### ❌ **Error: Unidad no encontrada**
```
❌ Error en evento COI-001: Unidad no encontrada para: Facultad XYZ
```
**Solución:** Revisa que el nombre de la facultad coincida con las disponibles.

### ❌ **Error: Tipo de actividad no válido**
```
❌ Error en evento COI-002: Tipo de actividad no encontrado: workshop
```
**Solución:** Usa solo los tipos válidos: `ponencia`, `sesion_interactiva`, `sesion_experto`, `tour`.

## 📝 **Ejemplo completo:**

Puedes usar el archivo de ejemplo incluido:
```bash
# Copiar el ejemplo
cp data/events-example.json data/events.json

# Ejecutar importación
npm run import:events
```

## 🔍 **Verificar resultados:**
```bash
# Probar conexión y ver estadísticas
npm run test:connection

# O iniciar el servidor y usar las APIs
npm run dev
# Luego visitar: http://localhost:3000/api/actividades
```
