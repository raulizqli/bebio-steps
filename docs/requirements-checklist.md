# Requirements Checklist

Status legend:
- Not started
- In progress
- Done

## Project setup
| Item | Status | Notes |
| --- | --- | --- |
| Repository structure (apps/services/docs) | Done | Initial skeleton created. |
| Mobile app initialized | Not started | Decide RN CLI vs Expo. |
| Firebase project created | Not started | Set up Firebase console. |
| Alexa skill created | Not started | Set up in Alexa Dev Console. |

## Platforms and integrations
| Requirement | Status | Notes |
| --- | --- | --- |
| iOS app | Not started | React Native target. |
| Android app | Not started | React Native target. |
| Backend API + database | Not started | Firebase-first approach. |
| Alexa integration with account linking | Not started | AWS Lambda + OAuth. |
| Push notifications (FCM/APNs) | Not started | For goal alerts. |

## Users, roles, and permissions
| Requirement | Status | Notes |
| --- | --- | --- |
| Register one or both parents | Not started | Admin parent required. |
| Support multiple babies per family | Not started | Per-baby permissions. |
| Invite caregiver by code | Not started | Nanny or family. |
| Expirable invite codes | Not started | Time-boxed access. |
| Revocable permissions | Not started | Immediate revoke. |
| Permission change history | Not started | Audit trail. |

## Event tracking (common fields)
| Requirement | Status | Notes |
| --- | --- | --- |
| Timestamp and timezone | Not started | Store in every event. |
| Created by user | Not started | For audit trail. |
| Optional notes | Not started | Free-text. |
| Origin (iOS/Android/Alexa) | Not started | For diagnostics. |

## Feeding (tomas)
| Requirement | Status | Notes |
| --- | --- | --- |
| Bottle or breastfeeding type | Not started | Required field. |
| Amount (oz/ml) | Not started | Required unit. |
| Side (if breastfeeding) | Not started | Optional. |

## Sleep
| Requirement | Status | Notes |
| --- | --- | --- |
| Start and end time (or duration) | Not started | Required. |
| Type (nap/night) | Not started | Required. |

## Meals (when applicable)
| Requirement | Status | Notes |
| --- | --- | --- |
| Food type/menu | Not started | Required. |
| Amount and unit | Not started | Required. |
| Allergens or restrictions | Not started | Optional. |

## Symptoms and diseases
| Requirement | Status | Notes |
| --- | --- | --- |
| Symptom type and severity | Not started | Required. |
| Symptom start/end | Not started | Optional end. |
| Disease diagnosis and date | Not started | Required. |
| Disease notes | Not started | Optional. |

## Medicines
| Requirement | Status | Notes |
| --- | --- | --- |
| Medicine name | Not started | Required. |
| Dose and unit | Not started | Required. |
| Frequency and schedule | Not started | Required. |
| Start and end date | Not started | Optional end. |

## Mood
| Requirement | Status | Notes |
| --- | --- | --- |
| Mood scale (1-5) | Not started | Required. |
| Mood tags | Not started | Optional. |

## Goals and notifications
| Requirement | Status | Notes |
| --- | --- | --- |
| Daily sleep goal (hours/day) | Not started | Per baby. |
| Daily feeding goal (oz/day) | Not started | Per baby. |
| Checkpoints for evaluation | Not started | Example: 12:00/18:00/21:00. |
| Notification cooldown | Not started | Prevent spam. |
| Quiet hours | Not started | Respect silence window. |

## Alexa intents (MVP minimum)
| Requirement | Status | Notes |
| --- | --- | --- |
| Log feeding (amount in oz/ml) | Not started | Voice capture. |
| Start/stop sleep | Not started | Voice capture. |
| Log medicine | Not started | Voice capture. |
| Query last feeding or daily summary | Not started | Read-only. |

## Security and privacy
| Requirement | Status | Notes |
| --- | --- | --- |
| TLS in transit | Not started | Required. |
| Encryption at rest | Not started | Required. |
| Role-based access control | Not started | Per baby. |
| Audit log for permission changes | Not started | Required. |

## Data and synchronization
| Requirement | Status | Notes |
| --- | --- | --- |
| Offline queue | Not started | Mobile-first. |
| Conflict resolution | Not started | Server priority. |
| Unit normalization (oz/ml) | Not started | Consistent data. |
| Timezone handling | Not started | Store TZ + UTC. |
