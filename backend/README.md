# Bebio Steps Backend API

Backend API for the baby tracking platform.

## Features

- User authentication and authorization
- Baby profile management
- Feeding tracking (breast, bottle, solid foods)
- Sleep tracking
- Health monitoring (symptoms, diseases, medications)
- Mood tracking
- Goal setting and monitoring
- Sharing with time-limited access codes
- Role-based permissions (parent, nanny, family)
- Push notifications for goal tracking

## Tech Stack

- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- JWT authentication
- Firebase Cloud Messaging for notifications
- bcryptjs for password hashing

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

## Running

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Babies
- `POST /api/babies` - Create baby profile
- `GET /api/babies` - Get all babies for user
- `GET /api/babies/:babyId` - Get baby details
- `PUT /api/babies/:babyId` - Update baby
- `DELETE /api/babies/:babyId` - Delete baby

### Sharing
- `POST /api/sharing/create` - Create share code
- `POST /api/sharing/accept` - Accept share code
- `GET /api/sharing/baby/:babyId` - Get shared access for baby
- `DELETE /api/sharing/:accessId` - Revoke access
- `PUT /api/sharing/:accessId/permissions` - Update permissions

### Feedings
- `POST /api/feedings` - Record feeding
- `GET /api/feedings/:babyId` - Get feedings
- `GET /api/feedings/:babyId/stats/daily` - Get daily stats
- `PUT /api/feedings/:feedingId` - Update feeding
- `DELETE /api/feedings/:feedingId` - Delete feeding

### Sleep
- `POST /api/sleep` - Record sleep
- `GET /api/sleep/:babyId` - Get sleep records
- `GET /api/sleep/:babyId/stats/daily` - Get daily stats
- `PUT /api/sleep/:sleepId` - Update sleep
- `DELETE /api/sleep/:sleepId` - Delete sleep

### Health
- `POST /api/health/symptoms` - Record symptom
- `GET /api/health/symptoms/:babyId` - Get symptoms
- `POST /api/health/diseases` - Record disease
- `GET /api/health/diseases/:babyId` - Get diseases
- `POST /api/health/medications` - Record medication
- `GET /api/health/medications/:babyId` - Get medications
- `POST /api/health/medications/:medicationId/administration` - Record medication administration

### Mood
- `POST /api/mood` - Record mood
- `GET /api/mood/:babyId` - Get mood records
- `PUT /api/mood/:moodId` - Update mood
- `DELETE /api/mood/:moodId` - Delete mood

### Goals
- `POST /api/goals` - Create goal
- `GET /api/goals/:babyId` - Get goals
- `PUT /api/goals/:goalId` - Update goal
- `DELETE /api/goals/:goalId` - Delete goal
