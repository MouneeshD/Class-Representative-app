import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

export default function AppLogo({ size = 120, showTagline = false, theme = 'purple' }) {
  const isOrange = theme === 'orange';
  const primary = isOrange ? '#FF6F00' : '#6A1B9A';
  const secondary = isOrange ? '#FF8F00' : '#9C27B0';

  const outerSize = size;
  const innerSize = Math.round(size * 0.78);
  const badgeSize = Math.round(size * 0.32);
  const voteIconSize = Math.round(size * 0.32);
  const crFontSize = Math.max(14, Math.round(size * 0.18));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[primary, secondary]}
        style={[
          styles.outerCircle,
          { width: outerSize, height: outerSize, borderRadius: outerSize / 2 },
        ]}
      >
        <View
          style={[
            styles.innerCircle,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
            },
          ]}
        >
          <Icon name="vote" size={voteIconSize} color={primary} />
          <View
            style={[
              styles.badge,
              {
                width: badgeSize,
                height: badgeSize,
                borderRadius: badgeSize / 2,
                backgroundColor: primary,
              },
            ]}
          >
            <Text style={[styles.badgeText, { fontSize: crFontSize }]}>CR</Text>
          </View>
        </View>
      </LinearGradient>
      {showTagline && <Text style={[styles.tagline, { color: primary }]}>Class Representative Voting</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  innerCircle: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 0.4,
  },
  tagline: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
