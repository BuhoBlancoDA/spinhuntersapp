# Registro de Cambios (CHANGELOG)

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2023-05-01 (Actualización: 001)

### Añadido
- Implementación inicial del proyecto con Next.js 15 y Tailwind CSS
- Sistema de autenticación con email y contraseña usando Supabase
- Verificación de email mediante Supabase + Brevo
- Dashboard protegido para usuarios autenticados
- Página de perfil de usuario editable
- Seguridad con Row Level Security (RLS) en la base de datos
- Estructura de base de datos con tablas para perfiles, membresías, anuncios y recursos
- Documentación completa del proyecto

### Configuración Técnica
- Configuración de Next.js App Router
- Integración con Supabase para autenticación, base de datos y almacenamiento
- Middleware para gestión de sesiones
- API routes para operaciones de autenticación y perfil
- Esquema de base de datos con políticas RLS