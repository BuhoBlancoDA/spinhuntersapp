# Guía de Despliegue - SpinHunters App

**Versión: 1.0.0 (Actualización: 001)**

Esta guía proporciona instrucciones detalladas para desplegar la aplicación SpinHunters en un entorno de producción.

## Índice
1. [Requisitos Previos](#requisitos-previos)
2. [Configuración de Supabase](#configuración-de-supabase)
3. [Configuración de Brevo (SMTP)](#configuración-de-brevo-smtp)
4. [Configuración Local](#configuración-local)
5. [Despliegue en Vercel](#despliegue-en-vercel)
6. [Verificación Post-Despliegue](#verificación-post-despliegue)
7. [Solución de Problemas](#solución-de-problemas)

## Requisitos Previos

Antes de comenzar, asegúrate de tener:

- Cuenta en [Supabase](https://supabase.com) (Plan gratuito es suficiente para desarrollo)
- Cuenta en [Vercel](https://vercel.com) (Plan Hobby es suficiente para el MVP)
- Cuenta en [Brevo](https://brevo.com) (Para envío de emails)
- Node.js 18+ instalado localmente
- Git instalado localmente
- Repositorio Git para el proyecto

## Configuración de Supabase

### 1. Crear un Nuevo Proyecto

1. Inicia sesión en [Supabase](https://app.supabase.com)
2. Haz clic en "New Project"
3. Completa la información del proyecto:
   - **Name**: `spinhunters-dev` (o el nombre que prefieras)
   - **Database Password**: Genera una contraseña segura
   - **Region**: Selecciona la región más cercana a tus usuarios
4. Haz clic en "Create new project"

### 2. Obtener Credenciales

Una vez creado el proyecto:

1. Ve a Settings > API
2. Copia los siguientes valores:
   - **URL**: `https://[ID].supabase.co`
   - **anon/public key**: La clave pública para clientes anónimos

Estos valores se usarán en las variables de entorno.

### 3. Ejecutar Migración de Base de Datos

1. En el panel de Supabase, ve a SQL Editor
2. Crea un nuevo query
3. Copia y pega el contenido del archivo `db/migrations/001_init.sql`
4. Haz clic en "Run" para ejecutar el script

### 4. Configurar Autenticación

1. Ve a Authentication > Settings
2. En "Site URL", ingresa la URL de tu aplicación (por ejemplo, `https://app.spinhunters.es`)
3. En "Redirect URLs", añade:
   - `https://app.spinhunters.es/auth/callback`
   - `http://localhost:3000/auth/callback` (para desarrollo)
4. Habilita "Email" como proveedor de autenticación

## Configuración de Brevo (SMTP)

### 1. Configurar Cuenta en Brevo

1. Regístrate en [Brevo](https://www.brevo.com)
2. Verifica tu dominio (si planeas usar un email personalizado)
3. Obtén las credenciales SMTP:
   - Servidor SMTP
   - Puerto
   - Usuario
   - Contraseña

### 2. Integrar Brevo con Supabase

1. En Supabase, ve a Authentication > Email Templates
2. Configura las plantillas para:
   - Confirmación de email
   - Recuperación de contraseña
3. Ve a Authentication > Settings > Email
4. Selecciona "Custom SMTP" y completa con los datos de Brevo:
   - **SMTP Host**: `smtp-relay.brevo.com`
   - **SMTP Port**: `587`
   - **SMTP User**: Tu usuario de Brevo
   - **SMTP Password**: Tu contraseña de Brevo
   - **Sender Email**: El email que usarás para enviar (ej. `no-reply@spinhunters.es`)
5. Guarda la configuración

## Configuración Local

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd spinhunters-app
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```
NEXT_PUBLIC_SUPABASE_URL=<URL de Supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Clave anónima de Supabase>
```

### 4. Ejecutar en Modo Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Despliegue en Vercel

### 1. Preparar el Repositorio

Asegúrate de que tu código esté actualizado en el repositorio Git:

```bash
git add .
git commit -m "Preparado para despliegue"
git push
```

### 2. Configurar Proyecto en Vercel

1. Inicia sesión en [Vercel](https://vercel.com)
2. Haz clic en "Add New" > "Project"
3. Importa tu repositorio Git
4. Configura el proyecto:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (o la ruta a tu proyecto si está en un subdirectorio)
   - **Build Command**: `npm run build` (predeterminado)
   - **Output Directory**: `.next` (predeterminado)

### 3. Configurar Variables de Entorno

En la sección "Environment Variables", añade:

- `NEXT_PUBLIC_SUPABASE_URL`: La URL de tu proyecto en Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: La clave anónima de tu proyecto en Supabase

### 4. Desplegar

1. Haz clic en "Deploy"
2. Espera a que se complete el despliegue
3. Una vez completado, Vercel te proporcionará una URL para tu aplicación

### 5. Configurar Dominio Personalizado (Opcional)

1. En el dashboard de Vercel, ve a tu proyecto
2. Ve a "Settings" > "Domains"
3. Añade tu dominio personalizado (ej. `app.spinhunters.es`)
4. Sigue las instrucciones para configurar los registros DNS

## Verificación Post-Despliegue

Después de desplegar, verifica que todo funcione correctamente:

1. **Registro de Usuario**: Intenta registrar un nuevo usuario
2. **Verificación de Email**: Confirma que se envía el email de verificación
3. **Inicio de Sesión**: Verifica que puedas iniciar sesión después de confirmar el email
4. **Dashboard**: Comprueba que el dashboard se muestre correctamente
5. **Perfil**: Verifica que puedas editar y guardar tu perfil

## Solución de Problemas

### Problemas con Supabase

- **Error de conexión**: Verifica que las variables de entorno sean correctas
- **Error en la migración**: Revisa los logs en Supabase > Database > Logs

### Problemas con Vercel

- **Error de compilación**: Revisa los logs de despliegue en Vercel
- **Error 404**: Asegúrate de que las rutas estén correctamente configuradas

### Problemas con Emails

- **No se reciben emails**: Verifica la configuración SMTP en Supabase
- **Emails en spam**: Configura correctamente los registros SPF y DKIM en tu dominio

---

Si encuentras problemas que no están cubiertos aquí, consulta la [documentación oficial de Supabase](https://supabase.com/docs) o [Vercel](https://vercel.com/docs), o contacta al equipo de soporte de SpinHunters.