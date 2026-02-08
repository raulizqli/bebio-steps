// =================== User & Auth ===================
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  fcmToken?: string;
  alexaUserId?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  caregiverProfiles?: BabyCaregiver[];
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  tokenType: string;
}

// =================== Baby ===================
export interface Baby {
  id: string;
  firstName: string;
  lastName?: string;
  dateOfBirth: string;
  gender?: string;
  birthWeightKg?: number;
  birthHeightCm?: number;
  avatarUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  caregivers?: BabyCaregiver[];
  goals?: BabyGoal[];
}

export interface BabyCaregiver {
  id: string;
  userId: string;
  babyId: string;
  role: 'parent' | 'nanny' | 'family';
  permissions: string[];
  isActive: boolean;
  expiresAt?: string;
  invitedBy?: string;
  user?: User;
  baby?: Baby;
}

export interface BabyGoal {
  id: string;
  babyId: string;
  dailySleepHoursGoal?: number;
  dailyFeedingOzGoal?: number;
  dailyMealsGoal?: number;
  minNapsPerDay?: number;
  notifySleepGoal: boolean;
  notifyFeedingGoal: boolean;
  notifyMealGoal: boolean;
  goalCheckTime?: string;
}

// =================== Feeding ===================
export type FeedingType = 'breast' | 'bottle' | 'formula' | 'mixed';
export type BreastSide = 'left' | 'right' | 'both';

export interface Feeding {
  id: string;
  babyId: string;
  loggedByUserId: string;
  type: FeedingType;
  startTime: string;
  endTime?: string;
  amountOz?: number;
  amountMl?: number;
  breastSide?: BreastSide;
  durationMinutes?: number;
  formulaBrand?: string;
  notes?: string;
  createdAt: string;
  loggedBy?: User;
}

export interface FeedingSummary {
  date: string;
  totalFeedings: number;
  totalOz: number;
  totalMl: number;
  totalDurationMinutes: number;
  feedings: Feeding[];
}

// =================== Sleep ===================
export type SleepType = 'nap' | 'night';

export interface SleepLog {
  id: string;
  babyId: string;
  loggedByUserId: string;
  type: SleepType;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  qualityRating?: number;
  notes?: string;
  createdAt: string;
  loggedBy?: User;
}

export interface SleepSummary {
  date: string;
  totalSleepMinutes: number;
  totalSleepHours: number;
  napCount: number;
  nightSleepCount: number;
  totalEntries: number;
  sleepLogs: SleepLog[];
}

// =================== Meals ===================
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: string;
  babyId: string;
  loggedByUserId: string;
  type: MealType;
  time: string;
  foods?: string[];
  amountOz?: number;
  texture?: string;
  isAllergenTest: boolean;
  allergenTested?: string;
  reaction?: string;
  rating?: number;
  notes?: string;
  createdAt: string;
  loggedBy?: User;
}

// =================== Symptoms ===================
export type SymptomSeverity = 'mild' | 'moderate' | 'severe';

export interface Symptom {
  id: string;
  babyId: string;
  loggedByUserId: string;
  name: string;
  description?: string;
  severity: SymptomSeverity;
  observedAt: string;
  resolvedAt?: string;
  temperatureCelsius?: number;
  relatedIllness?: string;
  notes?: string;
  createdAt: string;
  loggedBy?: User;
}

// =================== Medicines ===================
export interface Medicine {
  id: string;
  babyId: string;
  loggedByUserId: string;
  name: string;
  dosage?: string;
  unit?: string;
  frequency?: string;
  administeredAt: string;
  prescribedDate?: string;
  endDate?: string;
  prescribedBy?: string;
  reason?: string;
  isRecurring: boolean;
  recurringSchedule?: string;
  sideEffects?: string;
  notes?: string;
  createdAt: string;
  loggedBy?: User;
}

// =================== Mood ===================
export type MoodType =
  | 'happy'
  | 'calm'
  | 'fussy'
  | 'crying'
  | 'sleepy'
  | 'playful'
  | 'irritable'
  | 'sick';

export interface MoodLog {
  id: string;
  babyId: string;
  loggedByUserId: string;
  mood: MoodType;
  intensityLevel?: number;
  observedAt: string;
  durationMinutes?: number;
  trigger?: string;
  notes?: string;
  createdAt: string;
  loggedBy?: User;
}

// =================== Notifications ===================
export type NotificationType =
  | 'sleep_goal'
  | 'feeding_goal'
  | 'medicine_reminder'
  | 'general';

export interface AppNotification {
  id: string;
  userId: string;
  babyId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  isPushSent: boolean;
  createdAt: string;
  baby?: Baby;
}

// =================== Sharing ===================
export interface Invite {
  code: string;
  role: string;
  permissions: string[];
  codeExpiresAt: string;
  accessExpiresAt?: string;
}

// =================== Navigation ===================
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  BabyDetail: { babyId: string };
  AddBaby: undefined;
  LogFeeding: { babyId: string };
  LogSleep: { babyId: string };
  LogMeal: { babyId: string };
  LogSymptom: { babyId: string };
  LogMedicine: { babyId: string };
  LogMood: { babyId: string };
  Sharing: { babyId: string };
  Goals: { babyId: string };
  Notifications: undefined;
  Settings: undefined;
};
