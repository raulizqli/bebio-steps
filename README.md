# BebIO Steps

**Plataforma integral de seguimiento de bebés** para registrar, almacenar y analizar las rutinas de tu bebé. Incluye aplicación móvil (iOS/Android), API backend y skill de Alexa.

---

## Funcionalidades

### Seguimiento
- **Tomas/Alimentación** - Pecho, biberón, fórmula, mixto. Registro de onzas, duración, lado.
- **Horas de sueño** - Siestas y sueño nocturno con duración y calidad.
- **Comidas** - Desayuno, comida, cena, snacks. Alimentos, textura, pruebas de alérgenos.
- **Síntomas de enfermedad** - Fiebre, tos, vómito. Severidad, temperatura, enfermedad relacionada.
- **Medicinas** - Nombre, dosis, frecuencia, médico que la recetó, efectos secundarios.
- **Estado de ánimo** - Feliz, tranquilo, inquieto, llorando, soñoliento, juguetón, irritable, enfermo.

### Usuarios y Permisos
- **Registro de padres** (uno o ambos) como administradores
- **Código de invitación** para compartir acceso con niñeras o familiares
- **Permisos granulares** - Ver/registrar por cada tipo de actividad
- **Acceso temporal** para niñeras (configurar duración en días)
- **Revocar permisos** en cualquier momento

### Notificaciones
- **Meta de sueño** - Alerta cuando no se alcanzan las horas de sueño diarias
- **Meta de alimentación** - Alerta cuando no se alcanzan las onzas diarias
- **Meta de comidas** - Alerta cuando no se alcanzan las comidas diarias
- Hora configurable para verificación de metas

### Plataformas
- **iOS** - App nativa vía React Native/Expo
- **Android** - App nativa vía React Native/Expo
- **Alexa** - Skill en español (México) para registrar y consultar por voz

---

## Arquitectura

```
bebio-steps/
├── backend/          # NestJS API (TypeScript + PostgreSQL)
├── mobile/           # React Native App (Expo - iOS + Android)
├── alexa-skill/      # Alexa Skill (Interaction Model + Lambda)
└── docker-compose.yml
```

### Backend (NestJS)
- **Framework:** NestJS 10 con TypeScript
- **Base de datos:** PostgreSQL con TypeORM
- **Autenticación:** JWT con Passport
- **Documentación API:** Swagger en `/api/docs`
- **Notificaciones:** Cron jobs + Firebase Cloud Messaging
- **Alexa:** Webhook endpoint para skill

### Mobile (React Native)
- **Framework:** React Native con Expo SDK 52
- **Navegación:** React Navigation (Stack + Bottom Tabs)
- **Estado:** Redux Toolkit
- **HTTP:** Axios con interceptores JWT
- **Almacenamiento:** Expo SecureStore para tokens

### Alexa Skill
- **Idioma:** Español (México)
- **Intents:** Resumen de tomas, resumen de sueño, registrar toma, registrar siesta, estado del bebé
- **Despliegue:** Webhook directo al backend o Lambda proxy

---

## Inicio Rápido

### Requisitos
- Node.js 20+
- PostgreSQL 15+ (o Docker)
- Expo CLI (para desarrollo móvil)

### 1. Backend

```bash
# Con Docker (recomendado)
docker-compose up -d

# O manualmente
cd backend
cp .env.example .env
# Editar .env con datos de tu base de datos
npm install
npm run start:dev
```

La API estará en `http://localhost:3000`
Documentación Swagger en `http://localhost:3000/api/docs`

### 2. Mobile

```bash
cd mobile
npm install
npx expo start
```

Escanea el código QR con Expo Go (iOS/Android) o ejecuta en simulador.

### 3. Alexa Skill

1. Crea un nuevo skill en la [Consola de Alexa](https://developer.amazon.com/alexa/console/ask)
2. Importa el modelo de interacción desde `alexa-skill/skill-package/interactionModels/custom/es-MX.json`
3. Configura el endpoint al webhook de tu backend: `https://tu-dominio.com/api/v1/alexa/webhook`
4. En la app móvil, vincula tu cuenta de Alexa desde Ajustes

---

## API Endpoints

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Registrar padre/madre |
| POST | `/api/v1/auth/login` | Iniciar sesión |
| GET | `/api/v1/auth/profile` | Obtener perfil |
| PUT | `/api/v1/auth/profile` | Actualizar perfil |
| POST | `/api/v1/auth/link-alexa` | Vincular cuenta Alexa |

### Bebés
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/babies` | Registrar bebé |
| GET | `/api/v1/babies` | Listar bebés del usuario |
| GET | `/api/v1/babies/:id` | Detalle de bebé |
| PUT | `/api/v1/babies/:id` | Actualizar bebé |
| POST | `/api/v1/babies/:id/goals` | Configurar metas |
| GET | `/api/v1/babies/:id/goals` | Obtener metas |
| GET | `/api/v1/babies/:id/caregivers` | Listar cuidadores |

### Compartir
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/sharing/invite` | Crear código de invitación |
| POST | `/api/v1/sharing/accept` | Aceptar invitación |
| POST | `/api/v1/sharing/revoke/:id` | Revocar invitación |
| GET | `/api/v1/sharing/invites/:babyId` | Listar invitaciones |
| PUT | `/api/v1/sharing/:babyId/permissions/:userId` | Actualizar permisos |

### Tomas
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/feedings` | Registrar toma |
| GET | `/api/v1/feedings/baby/:id` | Listar tomas |
| GET | `/api/v1/feedings/baby/:id/summary` | Resumen diario |

### Sueño
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/sleep` | Registrar sueño |
| GET | `/api/v1/sleep/baby/:id` | Listar registros |
| GET | `/api/v1/sleep/baby/:id/summary` | Resumen diario |

### Comidas, Síntomas, Medicinas, Estado de Ánimo
Misma estructura CRUD con rutas `/api/v1/meals`, `/api/v1/symptoms`, `/api/v1/medicines`, `/api/v1/mood`

### Notificaciones
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/notifications` | Listar notificaciones |
| GET | `/api/v1/notifications/unread-count` | Contar no leídas |
| POST | `/api/v1/notifications/:id/read` | Marcar como leída |
| POST | `/api/v1/notifications/read-all` | Marcar todas como leídas |

---

## Modelo de Permisos

### Roles
- **parent** - Acceso total, puede gestionar usuarios y configuración
- **nanny** - Acceso limitado por permisos, con expiración temporal
- **family** - Acceso limitado por permisos

### Permisos disponibles
```
view_feedings, log_feedings, view_sleep, log_sleep,
view_meals, log_meals, view_symptoms, log_symptoms,
view_medicines, log_medicines, view_mood, log_mood,
manage_baby, manage_users, view_all, log_all
```

### Flujo de invitación
1. El padre genera un código de invitación con rol y permisos específicos
2. La niñera/familiar ingresa el código en la app
3. Se crea la relación con los permisos asignados
4. El padre puede revocar el acceso en cualquier momento
5. Para niñeras: el acceso expira automáticamente en la fecha configurada

---

## Comandos de Alexa

| Comando | Acción |
|---------|--------|
| "Alexa, abre bebio steps" | Inicia la skill |
| "¿Cuánto ha comido mi bebé hoy?" | Resumen de tomas |
| "¿Cuánto ha dormido hoy?" | Resumen de sueño |
| "Registra una toma de 4 onzas" | Registra toma |
| "Registra una siesta de 30 minutos" | Registra siesta |
| "¿Cómo está mi bebé?" | Resumen completo |

---

## Variables de Entorno

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=bebio_steps

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=7d

# App
APP_PORT=3000
APP_ENV=development

# Firebase (Push Notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Mobile
EXPO_PUBLIC_API_URL=http://localhost:3000
```

---

## Tecnologías

| Componente | Tecnología |
|------------|------------|
| Backend | NestJS, TypeScript, TypeORM, PostgreSQL |
| Mobile | React Native, Expo, Redux Toolkit, TypeScript |
| Alexa | ASK SDK, Custom Interaction Model (es-MX) |
| Auth | JWT, bcrypt, Passport |
| Notificaciones | Firebase Cloud Messaging, @nestjs/schedule |
| API Docs | Swagger/OpenAPI |
| Contenedores | Docker, Docker Compose |
