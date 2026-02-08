export const colors = {
  primary: '#6C63FF',
  primaryLight: '#8B83FF',
  primaryDark: '#4A42E0',
  secondary: '#FF6B9D',
  secondaryLight: '#FF8FB5',
  accent: '#00D4AA',
  accentLight: '#33DDB8',

  background: '#F8F9FF',
  surface: '#FFFFFF',
  card: '#FFFFFF',

  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  textInverse: '#FFFFFF',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  border: '#E5E7EB',
  divider: '#F3F4F6',

  feeding: '#FF6B9D',
  sleep: '#6C63FF',
  meal: '#F59E0B',
  symptom: '#EF4444',
  medicine: '#10B981',
  mood: '#8B5CF6',

  shadow: 'rgba(0, 0, 0, 0.08)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  title: 28,
  hero: 34,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const moodEmoji: Record<string, string> = {
  happy: '😊',
  calm: '😌',
  fussy: '😤',
  crying: '😢',
  sleepy: '😴',
  playful: '🤗',
  irritable: '😣',
  sick: '🤒',
};

export const moodLabels: Record<string, string> = {
  happy: 'Feliz',
  calm: 'Tranquilo',
  fussy: 'Inquieto',
  crying: 'Llorando',
  sleepy: 'Soñoliento',
  playful: 'Juguetón',
  irritable: 'Irritable',
  sick: 'Enfermo',
};
