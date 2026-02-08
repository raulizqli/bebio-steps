# Baby Tracker API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "PARENT" // Optional: PARENT, NANNY, FAMILY
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "PARENT"
  }
}
```

#### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "PARENT"
  }
}
```

#### Get Current User
```http
GET /auth/me
```

**Headers:** Requires authentication

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "PARENT"
}
```

### Babies

#### Create Baby
```http
POST /babies
```

**Headers:** Requires authentication

**Request Body:**
```json
{
  "firstName": "Sofia",
  "lastName": "Doe",
  "dateOfBirth": "2024-01-15",
  "gender": "Female",
  "dailyFeedingGoalOz": 24,
  "dailySleepGoalHours": 14
}
```

**Response:**
```json
{
  "id": "uuid",
  "firstName": "Sofia",
  "lastName": "Doe",
  "dateOfBirth": "2024-01-15T00:00:00.000Z",
  "gender": "Female",
  "dailyFeedingGoalOz": 24,
  "dailySleepGoalHours": 14,
  "parentId": "parent_uuid",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

#### List Babies
```http
GET /babies
```

**Headers:** Requires authentication

**Response:**
```json
{
  "owned": [
    {
      "id": "uuid",
      "firstName": "Sofia",
      "lastName": "Doe",
      "dateOfBirth": "2024-01-15T00:00:00.000Z",
      "gender": "Female"
    }
  ],
  "shared": [
    {
      "id": "uuid",
      "firstName": "Lucas",
      "lastName": "Smith",
      "isShared": true,
      "permissions": ["VIEW_FEEDING", "ADD_FEEDING"],
      "expiresAt": "2024-12-31T23:59:59.000Z"
    }
  ]
}
```

### Feeding Logs

#### Create Feeding Log
```http
POST /feeding
```

**Headers:** Requires authentication

**Request Body:**
```json
{
  "babyId": "baby_uuid",
  "type": "BOTTLE", // BOTTLE, BREAST_LEFT, BREAST_RIGHT, BREAST_BOTH, SOLID
  "amountOz": 4.5,
  "startTime": "2024-02-08T14:30:00.000Z",
  "endTime": "2024-02-08T14:45:00.000Z", // Optional
  "notes": "Took full bottle" // Optional
}
```

**Response:**
```json
{
  "id": "uuid",
  "babyId": "baby_uuid",
  "userId": "user_uuid",
  "type": "BOTTLE",
  "amountOz": 4.5,
  "startTime": "2024-02-08T14:30:00.000Z",
  "endTime": "2024-02-08T14:45:00.000Z",
  "notes": "Took full bottle",
  "createdAt": "2024-02-08T14:45:00.000Z"
}
```

#### Get Feeding Logs
```http
GET /feeding/:babyId?startDate=2024-02-08&endDate=2024-02-09&limit=50&offset=0
```

**Headers:** Requires authentication

**Response:**
```json
[
  {
    "id": "uuid",
    "type": "BOTTLE",
    "amountOz": 4.5,
    "startTime": "2024-02-08T14:30:00.000Z",
    "notes": "Took full bottle",
    "user": {
      "firstName": "John",
      "lastName": "Doe"
    }
  }
]
```

#### Get Feeding Summary (Today)
```http
GET /feeding/:babyId/summary/today
```

**Headers:** Requires authentication

**Response:**
```json
{
  "totalOz": 18.5,
  "goalOz": 24,
  "percentOfGoal": 77.08,
  "feedingCount": 5,
  "logs": [...]
}
```

### Sleep Logs

#### Create Sleep Log
```http
POST /sleep
```

**Headers:** Requires authentication

**Request Body:**
```json
{
  "babyId": "baby_uuid",
  "startTime": "2024-02-08T20:00:00.000Z",
  "endTime": "2024-02-08T23:00:00.000Z", // Optional
  "quality": "GOOD", // POOR, FAIR, GOOD, EXCELLENT
  "location": "Crib", // Optional
  "notes": "Slept well" // Optional
}
```

#### Get Sleep Summary (Today)
```http
GET /sleep/:babyId/summary/today
```

**Response:**
```json
{
  "totalHours": 12.5,
  "goalHours": 14,
  "percentOfGoal": 89.29,
  "sleepCount": 4,
  "logs": [...]
}
```

### Meal Logs

#### Create Meal Log
```http
POST /meals
```

**Request Body:**
```json
{
  "babyId": "baby_uuid",
  "mealType": "BREAKFAST", // BREAKFAST, LUNCH, DINNER, SNACK
  "foodItems": ["Banana", "Apple", "Cereal"],
  "amountEaten": "Full portion",
  "timestamp": "2024-02-08T08:00:00.000Z",
  "notes": "Ate everything"
}
```

### Illness Logs

#### Create Illness Log
```http
POST /illness
```

**Request Body:**
```json
{
  "babyId": "baby_uuid",
  "illnessName": "Cold",
  "symptoms": ["Cough", "Runny nose", "Fever"],
  "severity": "MILD", // MILD, MODERATE, SEVERE
  "startDate": "2024-02-08T00:00:00.000Z",
  "endDate": "2024-02-10T00:00:00.000Z", // Optional
  "notes": "Slight fever"
}
```

### Medication Logs

#### Create Medication Log
```http
POST /medication
```

**Request Body:**
```json
{
  "babyId": "baby_uuid",
  "medicationName": "Paracetamol",
  "dosage": "5ml",
  "frequency": "Every 8 hours",
  "startDate": "2024-02-08T00:00:00.000Z",
  "endDate": "2024-02-11T00:00:00.000Z", // Optional
  "prescribedBy": "Dr. Smith",
  "notes": "For fever"
}
```

#### Get Active Medications
```http
GET /medication/:babyId?active=true
```

### Mood Logs

#### Create Mood Log
```http
POST /mood
```

**Request Body:**
```json
{
  "babyId": "baby_uuid",
  "mood": "HAPPY", // HAPPY, CALM, FUSSY, CRYING, IRRITABLE, PLAYFUL, SLEEPY
  "intensity": 8, // 1-10
  "triggers": ["Play time", "Fed"],
  "timestamp": "2024-02-08T15:00:00.000Z",
  "notes": "Very playful"
}
```

### Sharing

#### Create Share Code
```http
POST /share/create
```

**Request Body:**
```json
{
  "babyId": "baby_uuid",
  "permissions": [
    "VIEW_FEEDING",
    "ADD_FEEDING",
    "VIEW_SLEEP"
  ],
  "expiresAt": "2024-12-31T23:59:59.000Z" // Optional
}
```

**Response:**
```json
{
  "id": "uuid",
  "shareCode": "ABC123XYZ",
  "babyId": "baby_uuid",
  "permissions": ["VIEW_FEEDING", "ADD_FEEDING"],
  "isActive": true,
  "expiresAt": "2024-12-31T23:59:59.000Z"
}
```

#### Redeem Share Code
```http
POST /share/redeem
```

**Request Body:**
```json
{
  "shareCode": "ABC123XYZ"
}
```

#### Get Baby Shares
```http
GET /share/baby/:babyId
```

**Response:**
```json
[
  {
    "id": "uuid",
    "shareCode": "ABC123XYZ",
    "isActive": true,
    "expiresAt": "2024-12-31T23:59:59.000Z",
    "user": {
      "id": "uuid",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com",
      "role": "NANNY"
    },
    "permissions": ["VIEW_FEEDING", "ADD_FEEDING"]
  }
]
```

#### Revoke Share
```http
DELETE /share/:shareId
```

### Notifications

#### Get Notifications
```http
GET /notifications?unreadOnly=true&limit=50&offset=0
```

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "FEEDING_GOAL_NOT_MET",
      "title": "Feeding Goal Not Met",
      "message": "Sofia has consumed 18.5oz of 24oz. 5.5oz remaining.",
      "isRead": false,
      "createdAt": "2024-02-08T18:00:00.000Z",
      "baby": {
        "firstName": "Sofia",
        "lastName": "Doe"
      }
    }
  ],
  "unreadCount": 3
}
```

#### Mark as Read
```http
PUT /notifications/:notificationId/read
```

#### Mark All as Read
```http
PUT /notifications/mark-all-read
```

### Alexa Integration

#### Get Alexa Auth Token
```http
POST /alexa/auth/link
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "alexaToken": "long_lived_jwt_token"
}
```

#### Alexa Intent Handler
```http
POST /alexa/intent
```

**Headers:**
```
x-alexa-token: long_lived_jwt_token
```

**Request Body:**
```json
{
  "intent": "LogFeedingIntent",
  "slots": {
    "babyName": "Sofia",
    "amount": "4",
    "type": "BOTTLE"
  }
}
```

**Response:**
```json
{
  "speech": "He registrado 4 onzas de alimentación para Sofia.",
  "shouldEndSession": true
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation Error",
  "details": [...]
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

API requests are rate-limited to prevent abuse. Current limits:
- 100 requests per minute per IP
- 1000 requests per hour per user

## Webhooks (Future)

Webhooks will be available for:
- New feeding logs
- Sleep goal alerts
- Medication reminders
- Share access changes
