import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HealthScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Health Monitoring Screen</Text>
      <Text style={styles.subtext}>
        Track symptoms, diseases, and medications
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  subtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
});
