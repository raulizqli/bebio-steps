# Bebio Steps - Documentación de API

Base URL: `https://api.bebiosteps.com/api` (producción)
Base URL: `http://localhost:3000/api` (desarrollo)

## Autenticación

Todas las rutas protegidas requieren un token JWT en el header:

```
Authorization: Bearer <token>
```

## Endpoints

### Autenticación

#### POST /auth/register
Registra un nuevo usuario.

**Body:**
```json
{
  "email": "padre@example.com",
  "password": "password123",
  "firstName": "Juan",
  "lastName": "Pérez",
  "role": "parent",
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "email": "padre@example.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "role": "parent"
  }
}
```

#### POST /auth/login
Inicia sesión.

**Body:**
```json
{
  "email": "padre@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "email": "padre@example.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "role": "parent"
  }
}
```

#### GET /auth/profile
Obtiene el perfil del usuario autenticado.

**Headers:** Authorization required

**Response:**
```json
{
  "user": {
    "id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "email": "padre@example.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "role": "parent"
  }
}
```

### Bebés

#### POST /babies
Crea un nuevo perfil de bebé.

**Headers:** Authorization required

**Body:**
```json
{
  "name": "Sofía",
  "dateOfBirth": "2024-01-15",
  "gender": "female",
  "weight": 3.5,
  "height": 50,
  "bloodType": "O+",
  "allergies": ["lactosa"]
}
```

**Response:**
```json
{
  "message": "Baby profile created successfully",
  "baby": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
    "name": "Sofía",
    "dateOfBirth": "2024-01-15T00:00:00.000Z",
    "gender": "female",
    "parents": ["60f7b3b3b3b3b3b3b3b3b3b3"],
    "weight": 3.5,
    "height": 50,
    "bloodType": "O+",
    "allergies": ["lactosa"]
  }
}
```

#### GET /babies
Obtiene todos los bebés del usuario autenticado.

**Headers:** Authorization required

**Response:**
```json
{
  "babies": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
      "name": "Sofía",
      "dateOfBirth": "2024-01-15T00:00:00.000Z",
      "gender": "female",
      "parents": [...]
    }
  ]
}
```

### Alimentación

#### POST /feedings
Registra una nueva toma.

**Headers:** Authorization required

**Body:**
```json
{
  "baby": "60f7b3b3b3b3b3b3b3b3b3b4",
  "type": "bottle",
  "amount": 4,
  "unit": "oz",
  "startTime": "2024-02-08T10:30:00.000Z",
  "notes": "Bebió todo"
}
```

**Response:**
```json
{
  "message": "Feeding recorded successfully",
  "feeding": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
    "baby": "60f7b3b3b3b3b3b3b3b3b3b4",
    "type": "bottle",
    "amount": 4,
    "unit": "oz",
    "startTime": "2024-02-08T10:30:00.000Z",
    "recordedBy": "60f7b3b3b3b3b3b3b3b3b3b3"
  }
}
```

#### GET /feedings/:babyId
Obtiene las tomas de un bebé.

**Headers:** Authorization required

**Query Params:**
- `startDate` (optional): Fecha inicio (ISO 8601)
- `endDate` (optional): Fecha fin (ISO 8601)
- `limit` (optional): Número de resultados (default: 50)
- `offset` (optional): Offset para paginación (default: 0)

**Response:**
```json
{
  "feedings": [...],
  "total": 150
}
```

#### GET /feedings/:babyId/stats/daily
Obtiene estadísticas diarias de alimentación.

**Headers:** Authorization required

**Query Params:**
- `date` (optional): Fecha específica (ISO 8601, default: hoy)

**Response:**
```json
{
  "date": "2024-02-08T00:00:00.000Z",
  "totalAmount": 24,
  "feedingCount": 6,
  "feedings": [...]
}
```

### Sueño

#### POST /sleep
Registra una sesión de sueño.

**Headers:** Authorization required

**Body:**
```json
{
  "baby": "60f7b3b3b3b3b3b3b3b3b3b4",
  "startTime": "2024-02-08T14:00:00.000Z",
  "endTime": "2024-02-08T16:30:00.000Z",
  "quality": "good",
  "location": "cuna",
  "notes": "Durmió tranquilo"
}
```

**Response:**
```json
{
  "message": "Sleep recorded successfully",
  "sleep": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b6",
    "baby": "60f7b3b3b3b3b3b3b3b3b3b4",
    "startTime": "2024-02-08T14:00:00.000Z",
    "endTime": "2024-02-08T16:30:00.000Z",
    "duration": 150,
    "quality": "good"
  }
}
```

### Compartir Acceso

#### POST /sharing/create
Crea un código de compartición.

**Headers:** Authorization required

**Body:**
```json
{
  "babyId": "60f7b3b3b3b3b3b3b3b3b3b4",
  "permissions": {
    "canViewFeeding": true,
    "canEditFeeding": true,
    "canViewSleep": true,
    "canEditSleep": false
  },
  "expiresInDays": 7
}
```

**Response:**
```json
{
  "message": "Share code created successfully",
  "shareCode": "ABC123XYZ9",
  "expiresAt": "2024-02-15T00:00:00.000Z",
  "sharedAccess": {...}
}
```

#### POST /sharing/accept
Acepta un código de compartición.

**Headers:** Authorization required

**Body:**
```json
{
  "shareCode": "ABC123XYZ9"
}
```

**Response:**
```json
{
  "message": "Access granted successfully",
  "baby": {...},
  "permissions": {...}
}
```

#### DELETE /sharing/:accessId
Revoca un acceso compartido.

**Headers:** Authorization required

**Response:**
```json
{
  "message": "Access revoked successfully"
}
```

### Estado de Ánimo

#### POST /mood
Registra el estado de ánimo del bebé.

**Headers:** Authorization required

**Body:**
```json
{
  "baby": "60f7b3b3b3b3b3b3b3b3b3b4",
  "mood": "happy",
  "intensity": 8,
  "timestamp": "2024-02-08T12:00:00.000Z",
  "triggers": ["jugando"],
  "notes": "Muy sonriente"
}
```

### Salud

#### POST /health/symptoms
Registra un síntoma.

**Body:**
```json
{
  "baby": "60f7b3b3b3b3b3b3b3b3b3b4",
  "name": "fiebre",
  "severity": "moderate",
  "description": "38.5°C",
  "startTime": "2024-02-08T08:00:00.000Z"
}
```

#### POST /health/medications
Registra un medicamento.

**Body:**
```json
{
  "baby": "60f7b3b3b3b3b3b3b3b3b3b4",
  "name": "Paracetamol",
  "dosage": "2.5ml",
  "frequency": "cada 6 horas",
  "startDate": "2024-02-08",
  "prescribedBy": "Dr. García",
  "purpose": "Reducir fiebre"
}
```

## Códigos de Estado

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

En producción, se aplicará rate limiting:
- 100 requests por minuto por IP
- 1000 requests por hora por usuario autenticado

## Paginación

Los endpoints que retornan listas soportan paginación:
- `limit`: Número de items por página
- `offset`: Número de items a saltar

## Filtros de Fecha

Formato ISO 8601:
- `2024-02-08T00:00:00.000Z`
- `2024-02-08`

## Errores

Formato de error estándar:
```json
{
  "error": "Mensaje de error descriptivo"
}
```
