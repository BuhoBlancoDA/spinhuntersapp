# SpinHunters App - Documentación

**Versión: 1.0.0** (Actualización: 001)

## Descripción General

SpinHunters App es una aplicación web desarrollada con Next.js 15 (App Router) y Tailwind CSS, que utiliza Supabase para autenticación, base de datos y almacenamiento. La aplicación permite a los usuarios registrarse, iniciar sesión, verificar su correo electrónico y gestionar su perfil.

## Tecnologías Utilizadas

- **Frontend**: Next.js 15 (App Router), Tailwind CSS, TypeScript
- **Backend**: Supabase (Auth, Database, Storage)
- **Email**: Brevo (configurado en Supabase)
- **Hosting**: Vercel (Plan Hobby)

## Estructura del Proyecto

```
spinhunters-app/
├── db/
│   └── migrations/
│       └── 001_init.sql      # Script de inicialización de la BD
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # Endpoints de autenticación
│   │   │   └── profile/      # Endpoints de perfil
│   │   ├── auth/             # Páginas de autenticación
│   │   ├── dashboard/        # Dashboard protegido
│   │   ├── profile/          # Página de perfil
│   │   └── page.tsx          # Página principal
│   ├── lib/
│   │   └── supabase.ts       # Cliente de Supabase
│   └── middleware.txt         # Middleware para sesiones
├── .env.example              # Variables de entorno de ejemplo
├── package.json              # Dependencias y scripts
└── README.md                 # Esta documentación
```

## Guía de Despliegue

### Requisitos Previos

1. Cuenta en [Supabase](https://supabase.com)
2. Cuenta en [Vercel](https://vercel.com)
3. Cuenta en [Brevo](https://brevo.com) (para envío de emails)
4. Node.js 18+ instalado localmente

### Paso 1: Configuración de Supabase

1. Crear un nuevo proyecto en Supabase
2. Configurar el proveedor de email (Brevo) en Supabase:
   - En Supabase Dashboard, ir a Authentication > Email Templates
   - Configurar las plantillas de email para confirmación y recuperación
   - En Authentication > Providers, configurar SMTP con los datos de Brevo

3. Ejecutar el script de migración:
   - Ir a SQL Editor en Supabase
   - Copiar y pegar el contenido de `db/migrations/001_init.sql`
   - Ejecutar el script

### Paso 2: Configuración Local

1. Clonar el repositorio:
   ```bash
   git clone <url-del-repositorio>
   cd spinhunters-app
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Crear archivo `.env.local` con las variables de Supabase:
   ```
   NEXT_PUBLIC_SUPABASE_URL=<URL de tu proyecto en Supabase>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<Clave anónima de tu proyecto en Supabase>
   ```

4. Ejecutar en modo desarrollo:
   ```bash
   npm run dev
   ```

### Paso 3: Despliegue en Vercel

1. Conectar el repositorio a Vercel
2. Configurar las variables de entorno en Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Desplegar la aplicación

## Funcionalidades Implementadas

- **Registro de usuarios**: Los usuarios pueden registrarse con email y contraseña
- **Verificación por email**: Se envía un correo de verificación al registrarse
- **Inicio de sesión**: Autenticación con email y contraseña
- **Dashboard protegido**: Solo accesible para usuarios autenticados
- **Perfil de usuario**: Los usuarios pueden editar su información personal
- **Seguridad con RLS**: Row Level Security implementado en la base de datos

## Mantenimiento y Actualizaciones

Para futuras actualizaciones, se seguirá un sistema de versionado semántico (X.Y.Z) junto con un número de actualización secuencial (NNN):
- X.Y.Z: Versión semántica
  - X: Cambios mayores (incompatibles con versiones anteriores)
  - Y: Nuevas funcionalidades (compatibles con versiones anteriores)
  - Z: Correcciones de errores y mejoras menores
- NNN: Número de actualización secuencial para identificar cambios específicos

### Historial de Versiones

- **1.0.0 (001)** - 2023-05-01: Versión inicial con registro, login, verificación por email, dashboard protegido y perfil editable.

## Próximos Pasos

- Implementar inicio de sesión con Google
- Añadir sistema de membresías
- Implementar panel de administración
- Mejorar la interfaz de usuario

## Solución de Problemas Comunes

### Problemas de Autenticación
- **Correo de verificación no recibido**: Verificar la configuración SMTP en Supabase y comprobar la carpeta de spam.
- **Error al iniciar sesión**: Asegurarse de que el usuario ha verificado su correo electrónico.

### Problemas de Despliegue
- **Error en Vercel**: Verificar que las variables de entorno estén correctamente configuradas.
- **Problemas con la base de datos**: Comprobar que el script SQL se ha ejecutado correctamente en Supabase.

## Contacto y Soporte

Para soporte técnico o consultas sobre el proyecto, contactar a:
- Email: soporte@spinhunters.es
- Discord: [Canal de soporte de SpinHunters](https://discord.gg/spinhunters)