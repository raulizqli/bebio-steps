# BebIO Steps

Plataforma completa de seguimiento de bebés para registrar, almacenar y analizar las rutinas infantiles. Captura alimentación, sueño, comidas, síntomas, enfermedades, medicinas y estado de ánimo, proporcionando datos estructurados, vistas históricas y análisis de metas a través de una arquitectura segura y extensible.

## Plataformas

| Plataforma | Tecnología | Estado |
|------------|-----------|--------|
| iOS | React Native (Expo) | Listo |
| Android | React Native (Expo) | Listo |
| Alexa | Alexa Skills Kit + Lambda | Listo |
| Backend API | Node.js + Express + SQLite | Listo |

## Arquitectura

```
bebio-steps/
├── backend/          # API REST (Node.js/Express/SQLite)
├── mobile/           # App móvil iOS/Android (React Native/Expo)
├── alexa-skill/      # Skill de Alexa (ASK SDK/Lambda)
└── README.md
```

## Funcionalidades

### Registro y Seguimiento
- **Tomas/Biberón**: Tipo (pecho, biberón, fórmula, mixto), cantidad en onzas, duración, lado
- **Sueño**: Hora inicio/fin, calidad, ubicación, duración calculada
- **Comidas sólidas**: Tipo de comida, alimentos, cantidad consumida, reacciones, alertas de alérgenos
- **Síntomas**: Tipo de síntoma, severidad, temperatura, descripción
- **Enfermedades**: Diagnóstico, doctor, fechas, resolución
- **Medicinas**: Nombre, dosis, unidad, frecuencia, hora de administración
- **Estado de ánimo**: 8 tipos de ánimo con intensidad y contexto

### Sistema de Usuarios y Permisos
- **Registro de padres**: Uno o ambos padres con permisos completos (lectura, escritura, admin)
- **Códigos de invitación**: Generación de códigos alfanuméricos de 8 caracteres para compartir
- **Roles diferenciados**:
  - `parent` - Acceso total (lectura, escritura, administración)
  - `nanny` - Acceso temporal con permisos de lectura y escritura
  - `family` - Acceso de solo lectura
- **Acceso temporal para niñeras**: Configuración de tiempo límite de acceso (ej: 8 horas)
- **Revocación de permisos**: Los padres pueden revocar acceso en cualquier momento
- **Actualización de permisos**: Modificar permisos y fechas de expiración

### Metas y Notificaciones
- **Metas diarias configurables**:
  - Horas de sueño por día (default: 14 hrs)
  - Onzas de alimentación por día (default: 24 oz)
  - Número de comidas sólidas
- **Notificaciones automáticas**: Alertas cuando el progreso está significativamente por debajo de lo esperado
- **Verificación programada**: Revisión cada 4 horas del cumplimiento de metas
- **Control anti-spam**: Máximo una notificación por tipo cada 4 horas

### Integración con Alexa
Comandos de voz disponibles:
- "Alexa, abre BebIO Steps" - Inicio y resumen
- "Registra una toma de 4 onzas" - Registrar alimentación
- "El bebé durmió 2 horas" - Registrar sueño
- "El bebé está feliz" - Registrar estado de ánimo
- "El bebé tiene fiebre de 38 grados" - Registrar síntomas
- "Le di paracetamol" - Registrar medicina
- "Cómo va el día" - Resumen completo
- "Cuántas onzas ha tomado" - Total de alimentación
- "Cuánto ha dormido" - Total de sueño
- "Cómo van las metas" - Progreso de metas

## Comenzar

### Backend

```bash
cd backend
npm install

# Copiar configuración
cp .env.example .env

# Iniciar servidor (desarrollo)
npm run dev

# Correr tests
npm test
```

El servidor se inicia en `http://localhost:3000`.

#### Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/login` | Inicio de sesión |
| GET | `/api/auth/me` | Perfil del usuario |
| POST | `/api/babies` | Crear bebé |
| GET | `/api/babies/family/:familyId` | Listar bebés |
| GET | `/api/babies/:babyId` | Detalle de bebé |
| POST | `/api/babies/:babyId/goals` | Configurar metas |
| POST | `/api/tracking/feedings` | Registrar toma |
| POST | `/api/tracking/sleep` | Registrar sueño |
| POST | `/api/tracking/meals` | Registrar comida |
| POST | `/api/tracking/symptoms` | Registrar síntoma |
| POST | `/api/tracking/illnesses` | Registrar enfermedad |
| POST | `/api/tracking/medicines` | Registrar medicina |
| POST | `/api/tracking/moods` | Registrar estado de ánimo |
| GET | `/api/tracking/summary/:babyId` | Resumen diario |
| GET | `/api/tracking/timeline/:babyId` | Línea de tiempo |
| POST | `/api/sharing/code` | Crear código de invitación |
| POST | `/api/sharing/redeem` | Canjear código |
| GET | `/api/sharing/family/:familyId/members` | Listar miembros |
| DELETE | `/api/sharing/family/:familyId/members/:memberId` | Revocar acceso |
| GET | `/api/notifications` | Obtener notificaciones |

### Aplicación Móvil (iOS/Android)

```bash
cd mobile
npm install

# Iniciar con Expo
npx expo start

# iOS
npx expo start --ios

# Android
npx expo start --android
```

#### Pantallas

1. **Login/Registro** - Autenticación con email y contraseña
2. **Inicio** - Dashboard con resumen del día, metas, y salud
3. **Registro** - 7 categorías de seguimiento con formularios intuitivos
4. **Historial** - Línea de tiempo navegable por día
5. **Familia** - Gestión de miembros, códigos de invitación, permisos
6. **Ajustes** - Perfil, agregar bebé, metas, notificaciones

### Alexa Skill

```bash
cd alexa-skill/lambda
npm install
```

Para desplegar el skill:
1. Crear un skill en la [Consola de Alexa Developer](https://developer.amazon.com/alexa/console/ask)
2. Subir el modelo de interacción desde `skill-package/interactionModels/custom/es-MX.json`
3. Desplegar la función Lambda con el código de `lambda/`
4. Configurar Account Linking con la API de BebIO Steps
5. Establecer la variable de entorno `BEBIO_API_URL`

## Flujo de Compartir Acceso

```
Padre/Madre                    Niñera/Familiar
     |                              |
     |-- Genera código -------->    |
     |   (rol: nanny,              |
     |    permisos: [read,write],  |
     |    duración: 8 horas)       |
     |                              |
     |                   Ingresa código
     |                              |
     |                   Se une a familia
     |                   con acceso temporal
     |                              |
     |-- Puede revocar acceso -->   |
     |   en cualquier momento       |
     |                              |
     |              Acceso expira automáticamente
     |              después de 8 horas
```

## Stack Tecnológico

- **Backend**: Node.js, Express.js, SQLite (better-sqlite3), JWT, bcrypt
- **Mobile**: React Native, Expo SDK 52, Expo Router, Zustand, TypeScript
- **Alexa**: ASK SDK v2, AWS Lambda, Node.js
- **Autenticación**: JWT con tokens seguros (SecureStore en mobile)
- **Base de datos**: SQLite con WAL mode y foreign keys
- **Tests**: Jest + Supertest (29 tests)

## Variables de Entorno

### Backend (.env)
```
PORT=3000
JWT_SECRET=tu-clave-secreta-super-segura
JWT_EXPIRY=7d
DATABASE_PATH=./data/bebio.db
NODE_ENV=development
```

### Alexa Lambda
```
BEBIO_API_URL=https://tu-api.com/api
```

## Licencia

Proyecto privado - Todos los derechos reservados.
