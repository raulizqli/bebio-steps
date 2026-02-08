# bebio-steps
Aplicación para registrar rutinas del bebé: **tomas**, **sueño**, **comidas**, **síntomas**, **enfermedades**, **medicinas** y **estado de ánimo**.

Incluye:
- **iOS/Android** (Expo / React Native)
- **Backend API** (Fastify + Prisma + Postgres)
- **Integración Alexa** (Skill para AWS Lambda)
- **Padres / nanny / familiares** con permisos, expiración de acceso y revocación
- **Notificaciones** si no se cumplen metas de sueño y de onzas/día (Expo push)

## Estructura del repo
- `apps/api`: API + Prisma
- `apps/mobile`: app móvil (Expo)
- `apps/alexa-skill`: skill Alexa (handler + modelo de interacción)
- `infra`: infra local (docker-compose opcional; en este entorno se usó Postgres local)

## Backend (API)
### Requisitos
- Node.js \(>= 20\)
- Postgres \(>= 16\)

### Variables de entorno
Copiar `apps/api/.env.example` a `apps/api/.env` y ajustar:
- **`DATABASE_URL`**
- **`JWT_SECRET`** (mínimo 16 caracteres)

### Base de datos (ejemplo local)
Crear usuario/db (ejemplo):

```bash
sudo -u postgres psql -c "CREATE USER bebio WITH PASSWORD 'bebio' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE bebio OWNER bebio;"
```

Migraciones:

```bash
cd apps/api
DATABASE_URL="postgresql://bebio:bebio@localhost:5432/bebio?schema=public" npx prisma migrate dev
```

Levantar API:

```bash
npm install
npm run dev:api
```

Docs OpenAPI (Swagger UI): `http://localhost:3001/docs`

## App móvil (iOS/Android)
### Requisitos
- Expo CLI (vía `npx expo ...`)

### Config
Definir `EXPO_PUBLIC_API_URL` apuntando al backend, por ejemplo:
- `http://localhost:3001` (si corres en simulador y el API está local)
- o la IP de tu máquina si pruebas en dispositivo físico

Ejecutar:

```bash
npm run dev:mobile
```

La app registra eventos (toma/sueño/ánimo y eventos genéricos para comidas/síntomas/enfermedades/medicinas), permite crear bebé y **compartir con código**.

## Alexa
En `apps/alexa-skill` está el handler para Lambda y el modelo de interacción en `apps/alexa-skill/models/es-MX.json`.

Variables:
- `API_URL`: URL pública del backend.

Flujo (MVP):
- En la app móvil, generar un **código** para el bebé.
- En Alexa: “**vincular con código {code}**”.
- Luego: “**agrega una toma de {ounces} onzas**” o “**resumen de hoy**”.

## Permisos, roles y expiración
- **PARENT**: todos los permisos.
- **FAMILY**: leer/escribir eventos, leer metas, ver miembros.
- **NANNY**: leer/escribir eventos. Se recomienda crear invite con `expiresInHours`.

Los accesos se pueden **revocar** desde el API (revocando la membresía) y el acceso de nanny puede **expirar** (por `expiresAt`).

## Notificaciones por metas
Las metas se configuran por bebé (onzas/día y horas de sueño/día). El backend ejecuta un job periódico y, **después de las 20:00** en el huso horario del bebé, envía notificación si no se cumplieron.

La app móvil registra el token de Expo Push en `/me/push-tokens` al iniciar sesión (best-effort).
