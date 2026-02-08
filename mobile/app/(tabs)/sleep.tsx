import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SleepScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Sleep Tracking Screen</Text>
      <Text style={styles.subtext}>Track and monitor baby's sleep patterns</Text>
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
  },
});
