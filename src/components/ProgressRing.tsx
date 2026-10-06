import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface Props {
  /** 0-100 */
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

/** A circular progress ring: a grey track with a colored arc covering `percent` of it, filling clockwise from the top. */
export const ProgressRing: React.FC<Props> = ({ percent, size = 104, strokeWidth = 10, color = '#10B981', label }) => {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={radius} stroke="#232D3B" strokeWidth={strokeWidth} fill="none" />
        {clamped > 0 && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - clamped / 100)}
            transform={`rotate(-90 ${center} ${center})`}
          />
        )}
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.pct}>{Math.round(clamped)}%</Text>
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  pct: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  label: { fontSize: 9, color: '#94A3B8' },
});
