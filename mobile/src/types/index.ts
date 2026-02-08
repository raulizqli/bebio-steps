export interface User {
  id: string;
  email: string;
  name: string;
  role: 'parent' | 'nanny' | 'family';
  avatar_url?: string;
}

export interface Family {
  id: string;
  name: string;
  created_by: string;
  member_role?: string;
  permissions?: string;
}

export interface Baby {
  id: string;
  family_id: string;
  name: string;
  birth_date: string;
  gender?: 'male' | 'female' | 'other';
  weight_at_birth?: number;
  height_at_birth?: number;
  photo_url?: string;
  feedings_today?: number;
  oz_today?: number;
  sleep_hours_today?: number;
}

export interface Feeding {
  id: string;
  baby_id: string;
  recorded_by: string;
  recorded_by_name?: string;
  type: 'breast' | 'bottle' | 'formula' | 'mixed';
  amount_oz?: number;
  duration_minutes?: number;
  side?: 'left' | 'right' | 'both';
  notes?: string;
  started_at: string;
  ended_at?: string;
}

export interface SleepRecord {
  id: string;
  baby_id: string;
  recorded_by: string;
  recorded_by_name?: string;
  started_at: string;
  ended_at?: string;
  quality?: 'good' | 'fair' | 'poor' | 'restless';
  location?: 'crib' | 'bed' | 'stroller' | 'car_seat' | 'arms' | 'other';
  notes?: string;
}

export interface Meal {
  id: string;
  baby_id: string;
  recorded_by: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: string;
  amount?: 'none' | 'little' | 'half' | 'most' | 'all';
  reaction?: 'loved' | 'liked' | 'neutral' | 'disliked' | 'refused';
  allergen_alert?: boolean;
  notes?: string;
  recorded_at: string;
}

export interface Symptom {
  id: string;
  baby_id: string;
  symptom_type: string;
  severity?: 'mild' | 'moderate' | 'severe';
  temperature?: number;
  description?: string;
  recorded_at: string;
  resolved_at?: string;
}

export interface Illness {
  id: string;
  baby_id: string;
  name: string;
  diagnosis?: string;
  doctor_name?: string;
  started_at: string;
  resolved_at?: string;
  notes?: string;
}

export interface Medicine {
  id: string;
  baby_id: string;
  illness_id?: string;
  name: string;
  dosage: string;
  dosage_unit: string;
  frequency?: string;
  administered_at: string;
  next_dose_at?: string;
  notes?: string;
}

export interface MoodRecord {
  id: string;
  baby_id: string;
  mood: 'happy' | 'calm' | 'fussy' | 'crying' | 'sleepy' | 'playful' | 'irritable' | 'sick';
  intensity?: number;
  context?: string;
  notes?: string;
  recorded_at: string;
}

export interface DailyGoal {
  id: string;
  baby_id: string;
  goal_type: 'sleep_hours' | 'feeding_oz' | 'meals_count';
  target_value: number;
  current_value?: number;
  percentage?: number;
  met?: boolean;
}

export interface DailySummary {
  date: string;
  baby: { id: string; name: string };
  feedings: { count: number; total_oz: number; total_minutes: number };
  sleep: { count: number; total_hours: number };
  meals: { count: number };
  symptoms: { count: number };
  medicines: { count: number };
  moods: MoodRecord | null;
  goals: DailyGoal[];
  goal_progress: DailyGoal[];
}

export interface TimelineEvent {
  event_type: 'feeding' | 'sleep' | 'meal' | 'symptom' | 'medicine' | 'mood';
  id: string;
  event_time: string;
  [key: string]: any;
}

export interface Notification {
  id: string;
  user_id: string;
  baby_id?: string;
  baby_name?: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  data?: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  role: 'parent' | 'nanny' | 'family';
  permissions: string;
  expires_at?: string;
  is_active: boolean;
  name: string;
  email: string;
}

export interface SharingCode {
  id: string;
  code: string;
  role: string;
  permissions: string;
  expires_at: string;
  access_duration_hours?: number;
  created_by_name: string;
}
