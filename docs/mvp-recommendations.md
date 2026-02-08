# MVP Recommendations

This document captures a lean MVP scope for the baby tracking app while
meeting the core requirements (iOS/Android and Alexa integration).

## 1) MVP Scope (tight)

### Core data capture
- Feedings (oz/ml), sleep (start/end), meds (name/dose), mood (1-5),
  symptoms (simple tags).
- Defer: full diseases catalog, detailed meals, growth charts, advanced
  analytics.

### Caregiver access
- Support 1 admin parent + invite 1 caregiver (nanny/family).
- Permissions: view + add logs; no edit/delete, no settings access.
- Time-boxed access: invite code with expiration date.

### Notifications (simple)
- Daily sleep target and daily feeding target (oz/day).
- 2 checkpoints/day (e.g., 18:00 and 21:00) with cooldown to avoid spam.
- Only admins receive alerts in MVP.

### Mobile-first delivery
- Ship one cross-platform app (React Native or Flutter).
- Defer web admin or desktop dashboards.

### Alexa integration (lite)
- Only 2 intents in MVP:
  - Log feeding (amount in oz/ml).
  - Start/stop sleep.
- Defer read-only queries and advanced voice flows.

### Offline tolerance
- Simple local queue + sync when online.

## Development platforms (suggested)
- Mobile: React Native + TypeScript (single codebase for iOS/Android).
- Backend API: Node.js (Express or NestJS) + PostgreSQL.
- Auth: Firebase Auth or Auth0.
- Push notifications: Firebase Cloud Messaging + APNs.
- Alexa: ASK SDK + AWS Lambda + account linking (OAuth).
- CI/CD: GitHub Actions.

## 2) MVP User Stories (minimum)
1. As a parent, I can log a feeding with amount and time.
2. As a parent, I can log sleep start/end.
3. As a parent, I can set daily sleep and feeding goals.
4. As a parent, I get notified when goals are not met by a checkpoint.
5. As a parent, I can invite a caregiver with expiring access.
6. As a caregiver, I can add logs during my access window.

## 3) Defer to V2
- Multiple babies per account
- Full symptom/disease taxonomy
- Complex permissions matrix
- Analytics/trends dashboards
- Multi-language Alexa responses
- Detailed meals/solid foods
