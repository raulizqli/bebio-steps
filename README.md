# bebio-steps (Bebio)
Aplicación para registrar **tomas**, **sueño**, **comidas**, **síntomas**, **enfermedades**, **medicinas** y **estado de ánimo**, con:

- App móvil **iOS/Android** (Expo/React Native) en `apps/mobile`
- Backend/API (Fastify + Prisma) en `apps/api`
- Endpoint de integración **Alexa** (base) en `POST /alexa`
- **Padres** (1 o 2) y **códigos para compartir** acceso con nanny/familia con **permisos**, **revocación** y **expiración**
- Notificaciones por **metas diarias** (sueño y onzas) con tokens Expo (MVP)

## Estructura
- `apps/api`: API + DB (SQLite para desarrollo)
- `apps/mobile`: App Expo (iOS/Android)

## Requisitos
- Node.js 20+ (en este repo se probó con Node 22)
- npm

## Correr la API
1) Configura variables de entorno:

```bash
cd apps/api
cp .env.example .env
# Edita JWT_SECRET (mínimo 16 chars)
```

2) Migrar DB y levantar servidor:

```bash
cd /workspace
npm install
cd apps/api
npm run prisma:migrate
npm run dev
```

- API: `http://localhost:3001`
- Docs Swagger: `http://localhost:3001/docs`

## Correr la app iOS/Android (Expo)
Configura la URL del API:

```bash
export EXPO_PUBLIC_API_BASE_URL="http://localhost:3001"
```

Luego:

```bash
cd /workspace
npm install
npm run dev:mobile
```

En la app (MVP) puedes:
- Crear cuenta / iniciar sesión
- Crear familia y bebé
- Crear **código** para nanny/familiar (con expiración opcional en ISO)
- Canjear código
- Registrar una toma/sueño (botones rápidos)
- Correr verificación de metas (endpoint de notificaciones)

## Alexa (base)
Endpoint:
- `POST /alexa`

Notas:
- Está implementado como **stub** con `ask-sdk`. Para producción se requiere configurar **Account Linking OAuth2** en la consola de Alexa; en este MVP se asume que `accessToken` será un JWT válido del API.

## Notificaciones (MVP)
- Registrar token Expo: `POST /me/push-tokens`
- Ejecutar chequeo: `POST /notifications/run` (requiere padre/padre admin)

Para producción, normalmente esto se ejecuta con un scheduler (cron/worker) y con manejo de zona horaria por bebé.
