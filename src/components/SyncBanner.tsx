import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useHabits } from '../context/HabitContext';

/** A small pill at the top of the screen telling the user what the server is doing. Hidden once everything is synced. */
export const SyncBanner = () => {
  const { sync, reload } = useHabits();

  // Don't flash the banner for fast loads: only show "connecting" if it takes more than a moment.
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (sync !== 'syncing') {
      setSlow(false);
      return;
    }
    const t = setTimeout(() => setSlow(true), 1500);
    return () => clearTimeout(t);
  }, [sync]);

  if (sync === 'synced' || (sync === 'syncing' && !slow)) return null;

  return (
    <SafeAreaView style={styles.wrap} pointerEvents="box-none">
      {sync === 'syncing' ? (
        <View style={styles.pill}>
          <ActivityIndicator size="small" color="#34D399" />
          <Text style={styles.text}>Connecting to the server… this can take up to a minute</Text>
        </View>
      ) : (
        <TouchableOpacity style={[styles.pill, styles.offline]} onPress={reload}>
          <Text style={styles.text}>Can&apos;t reach the server — showing saved data. Tap to retry</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', zIndex: 50 },
  pill: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(22,29,38,0.95)',
    borderWidth: 1,
    borderColor: '#2A3544',
    maxWidth: '92%',
  },
  offline: { borderColor: '#B45309' },
  text: { color: '#E2E8F0', fontSize: 12, flexShrink: 1 },
});
