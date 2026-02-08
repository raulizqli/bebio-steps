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

## Development platforms (primary: Firebase-first)

### Primary recommendation: Firebase-first stack
- Mobile: React Native + TypeScript (single codebase for iOS/Android).
- Backend: Firebase Auth, Firestore (DB), Cloud Functions (API), Storage.
- Push notifications: Firebase Cloud Messaging + APNs.
- Analytics/Crash: Firebase Analytics + Crashlytics.
- Alexa: ASK SDK + AWS Lambda + account linking (OAuth).
  - Recommendation: Alexa calls Firebase Functions/Firestore via HTTPS.
- CI/CD: GitHub Actions.

**Benefits:** very fast MVP delivery; built-in offline + realtime sync; minimal ops.
**Disadvantages:** vendor lock-in; pricing can grow with scale.

Still required outside Firebase:
- Mobile releases: App Store / Google Play builds, signing, and publishing.
- Alexa hosting: skills are hosted on AWS (Lambda or Alexa-hosted).

### Alternative stack (if you avoid Firebase)
- Mobile: React Native + TypeScript (single codebase for iOS/Android).
  - Benefits: faster delivery with shared code; large ecosystem.
  - Disadvantages: native module work for edge cases; perf tuning for heavy UI.
- Backend API: Node.js (Express or NestJS) + PostgreSQL.
  - Benefits: rapid iteration; strong community; good JSON support.
  - Disadvantages: single-threaded runtime; needs care for CPU-heavy tasks.
- Auth: Auth0.
  - Benefits: quick setup; secure flows; social logins if needed.
  - Disadvantages: vendor lock-in; pricing can grow with scale.
- Push notifications: Firebase Cloud Messaging + APNs.
  - Benefits: industry standard; reliable delivery.
  - Disadvantages: platform setup complexity; token management.
- Alexa: ASK SDK + AWS Lambda + account linking (OAuth).
  - Benefits: fast skill development; scalable by default.
  - Disadvantages: extra certification steps; voice UX limits.
- CI/CD: GitHub Actions.
  - Benefits: native to repo; flexible workflows.
  - Disadvantages: parallel builds can increase cost; mobile signing setup.

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
