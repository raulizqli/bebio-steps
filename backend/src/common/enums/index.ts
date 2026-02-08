export enum UserRole {
  PARENT = 'parent',
  NANNY = 'nanny',
  FAMILY = 'family',
}

export enum Permission {
  VIEW_FEEDINGS = 'view_feedings',
  LOG_FEEDINGS = 'log_feedings',
  VIEW_SLEEP = 'view_sleep',
  LOG_SLEEP = 'log_sleep',
  VIEW_MEALS = 'view_meals',
  LOG_MEALS = 'log_meals',
  VIEW_SYMPTOMS = 'view_symptoms',
  LOG_SYMPTOMS = 'log_symptoms',
  VIEW_MEDICINES = 'view_medicines',
  LOG_MEDICINES = 'log_medicines',
  VIEW_MOOD = 'view_mood',
  LOG_MOOD = 'log_mood',
  MANAGE_BABY = 'manage_baby',
  MANAGE_USERS = 'manage_users',
  VIEW_ALL = 'view_all',
  LOG_ALL = 'log_all',
}

export enum FeedingType {
  BREAST = 'breast',
  BOTTLE = 'bottle',
  FORMULA = 'formula',
  MIXED = 'mixed',
}

export enum BreastSide {
  LEFT = 'left',
  RIGHT = 'right',
  BOTH = 'both',
}

export enum SleepType {
  NAP = 'nap',
  NIGHT = 'night',
}

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
}

export enum SymptomSeverity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
}

export enum MoodType {
  HAPPY = 'happy',
  CALM = 'calm',
  FUSSY = 'fussy',
  CRYING = 'crying',
  SLEEPY = 'sleepy',
  PLAYFUL = 'playful',
  IRRITABLE = 'irritable',
  SICK = 'sick',
}

export enum InviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

export enum NotificationType {
  SLEEP_GOAL = 'sleep_goal',
  FEEDING_GOAL = 'feeding_goal',
  MEDICINE_REMINDER = 'medicine_reminder',
  GENERAL = 'general',
}
