import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

interface Field {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'datetime';
  options?: { label: string; value: string }[];
  required?: boolean;
  placeholder?: string;
}

interface FormModalProps {
  visible: boolean;
  title: string;
  fields: Field[];
  onSubmit: (data: Record<string, any>) => Promise<void>;
  onClose: () => void;
  submitLabel?: string;
  color?: string;
}

export function FormModal({
  visible, title, fields, onSubmit, onClose,
  submitLabel = 'Guardar', color = Colors.primary
}: FormModalProps) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const setValue = (key: string, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    const missing = fields.filter((f) => f.required && !values[f.key]);
    if (missing.length > 0) {
      Alert.alert('Campos requeridos', `Completa: ${missing.map((f) => f.label).join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      await onSubmit(values);
      setValues({});
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color }]}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {fields.map((field) => (
            <View key={field.key} style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                {field.label} {field.required && <Text style={{ color: Colors.error }}>*</Text>}
              </Text>

              {field.type === 'select' ? (
                <View style={styles.selectContainer}>
                  {field.options?.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.selectOption,
                        values[field.key] === opt.value && {
                          backgroundColor: color + '20',
                          borderColor: color,
                        },
                      ]}
                      onPress={() => setValue(field.key, opt.value)}
                    >
                      <Text
                        style={[
                          styles.selectText,
                          values[field.key] === opt.value && { color, fontWeight: '600' },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <TextInput
                  style={styles.input}
                  value={values[field.key]?.toString() || ''}
                  onChangeText={(text) =>
                    setValue(field.key, field.type === 'number' ? parseFloat(text) || '' : text)
                  }
                  placeholder={field.placeholder || field.label}
                  placeholderTextColor={Colors.textLight}
                  keyboardType={field.type === 'number' ? 'decimal-pad' : 'default'}
                />
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: color, opacity: loading ? 0.6 : 1 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitText}>{loading ? 'Guardando...' : submitLabel}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: Spacing.md,
  },
  fieldContainer: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  selectOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  selectText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  footer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submitBtn: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  submitText: {
    color: Colors.textOnPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
