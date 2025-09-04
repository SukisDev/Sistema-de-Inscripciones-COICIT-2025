# Sistema de Inscripciones COICIT 2025

Sistema completo de inscripciones para el Congreso Internacional de Ciencia, Investigación, Innovación, Ciencia y Tecnología (COICIT) 2025 de la Universidad Tecnológica de Panamá.

## 🚀 Características Principales

- **Sistema de Autenticación**: Login para administradores y captadores
- **Gestión de Participantes**: Búsqueda y registro automático de nuevos participantes
- **Inscripciones Dinámicas**: Sistema de inscripción con validación de tipos de usuario
- **Precios Diferenciados**: Precios específicos por tipo de participante (estudiante, docente, administrativo, externo)
- **Interfaz Moderna**: Construido con Next.js y Tailwind CSS

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: bcryptjs para hash de contraseñas
- **Validación**: Zod para validación de datos

## 📋 Prerequisitos

- Node.js 18+ 
- PostgreSQL
- npm o yarn

## 🔧 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repo>
   cd coicit-web
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con tu configuración de base de datos
   ```

4. **Generar cliente de Prisma**
   ```bash
   npx prisma generate
   ```

5. **Aplicar migraciones**
   ```bash
   npx prisma migrate dev
   ```

6. **Crear datos de prueba**
   ```bash
   npm run crear:personas
   ```

## 🎯 Uso del Sistema

### 1. Iniciar el Servidor
```bash
npm run dev
```
El sistema estará disponible en: http://localhost:3000

### 2. Acceso al Sistema

#### 👤 **Credenciales de Administrador**
- **Usuario**: `admin`
- **Contraseña**: `coicit2025`
- **Acceso**: Administración completa del sistema

#### 🎯 **Credenciales de Captador**
- **Usuario**: `captador`
- **Contraseña**: `coicit2025`
- **Acceso**: Módulo de inscripciones

### 3. Flujo de Inscripciones

1. **Login**: Ir a `/login` e ingresar con credenciales de captador
2. **Búsqueda**: En `/inscripciones`, buscar participante por cédula
3. **Registro**: Si no existe, llenar formulario automático de registro
4. **Selección**: Elegir paquete (solo paquete completo visible inicialmente)
5. **Confirmación**: Confirmar inscripción con precios diferenciados

## 👥 Datos de Prueba

### Participantes de Prueba
- **8-1001-1001** - Ana García Rodríguez (Estudiante)
- **8-1002-1002** - Carlos Mendoza López (Estudiante)  
- **8-1003-1003** - María Elena Santos (Estudiante)
- **8-1004-1004** - José Luis Pérez (Docente)
- **8-1005-1005** - Laura Patricia Morales (Administrativo)
- **8-1006-1006** - Roberto Alejandro Díaz (Externo)

### Tipos de Usuario y Precios
- **Estudiante**: Precios reducidos
- **Docente UTP**: Precios preferenciales  
- **Administrativo**: Precios institucionales
- **Externo**: Precios regulares

## 🏗️ Estructura del Proyecto

```
coicit-web/
├── src/
│   ├── app/
│   │   ├── api/              # API Routes
│   │   │   ├── auth/         # Autenticación
│   │   │   └── personas/     # Gestión de participantes
│   │   ├── login/            # Página de login
│   │   ├── inscripciones/    # Módulo de inscripciones
│   │   └── globals.css       # Estilos globales
│   ├── components/           # Componentes reutilizables
│   ├── lib/                  # Utilidades y configuración
│   └── generated/prisma/     # Cliente de Prisma generado
├── prisma/
│   └── schema.prisma         # Esquema de base de datos
└── scripts/
    ├── crear-personas-prueba.ts  # Script de datos de prueba
    └── probar-sistema.ts         # Script de verificación
```

## 🗄️ Base de Datos

### Tablas Principales
- **persona**: Información de participantes
- **usuarios**: Usuarios del sistema (admin, captadores)
- **actividad**: Actividades del congreso
- **paquetes**: Paquetes de actividades
- **inscripciones**: Registro de inscripciones

### Enums
- **tipo_persona_enum**: `estudiante`, `docente`, `administrativo`, `externo`
- **rol_usuario_enum**: `admin`, `captador`, `super_admin`

## 🔒 Seguridad

- Contraseñas hasheadas con bcryptjs
- Validación de entrada con Zod
- Sesiones almacenadas en localStorage (desarrollo)
- Roles y permisos diferenciados

## 🧪 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run build           # Build de producción
npm run start           # Servidor de producción

# Base de datos
npx prisma studio       # Interfaz visual de BD
npx prisma migrate dev  # Aplicar migraciones

# Datos de prueba
npm run crear:personas  # Crear usuarios y participantes de prueba
npm run probar:sistema  # Verificar configuración del sistema
```

## 🌐 URLs Importantes

- **Página Principal**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Inscripciones**: http://localhost:3000/inscripciones
- **Prisma Studio**: http://localhost:5555

## 📝 Características del Negocio

### Reglas de Inscripción
1. **Visibilidad de Paquetes**: Solo el paquete completo es visible inicialmente
2. **Registro Automático**: Los nuevos participantes se registran automáticamente
3. **Precios Dinámicos**: Precios calculados según tipo de participante
4. **Validación de Cédula**: Formato panameño validado

### Flujo de Captadores
1. Buscar participante por cédula
2. Si no existe, registrar nueva persona
3. Seleccionar paquete disponible
4. Confirmar inscripción con precio calculado

## 🤝 Contribución

1. Fork del proyecto
2. Crear branch de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para detalles.

## 📞 Soporte

Para soporte técnico o consultas sobre el sistema:
- **Universidad Tecnológica de Panamá**
- **COICIT 2025**

---

**Desarrollado para la Universidad Tecnológica de Panamá - COICIT 2025** 🇵🇦
