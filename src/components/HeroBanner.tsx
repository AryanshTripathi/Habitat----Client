import React from 'react';
import { ImageBackground, StyleSheet, View, ViewStyle } from 'react-native';
import { bannerIndexFor } from '../utils/habits';

const BANNERS = {
  sunrise: require('../../assets/images/sunrise.jpg'),
  bookshelf: require('../../assets/images/bookshelf.jpg'),
  night: require('../../assets/images/night.jpg'),
  misty: require('../../assets/images/misty.jpg'),
};
type BannerName = keyof typeof BANNERS;
const BANNER_ORDER: BannerName[] = ['sunrise', 'bookshelf', 'night', 'misty'];

interface Props {
  /** A fixed banner (e.g. 'misty' for Today). */
  variant?: BannerName;
  /** Or a habit id: each habit gets a stable banner out of the four. */
  habitId?: number;
  height?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
}

/** Scenic header image with a dark scrim so overlaid text stays readable. */
export const HeroBanner: React.FC<Props> = ({ variant, habitId, height = 140, style, children }) => {
  const name = variant ?? BANNER_ORDER[bannerIndexFor(habitId ?? 0)];
  return (
    <ImageBackground source={BANNERS[name]} style={[{ height }, style]} resizeMode="cover">
      <View style={styles.scrim} />
      <View style={styles.content}>{children}</View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13,17,23,0.55)' },
  content: { flex: 1 },
});
