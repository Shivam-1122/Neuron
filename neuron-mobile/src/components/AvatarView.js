import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { Colors } from '../theme/colors';
import { Volume2, Cpu, Radio } from 'lucide-react-native';

export default function AvatarView({ isSpeaking, isProcessing, message, processingStatus }) {
  // Pulse animation for visualizer bars
  const animValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isSpeaking || isProcessing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0.3,
            duration: 350,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      animValue.setValue(0.2);
    }
  }, [isSpeaking, isProcessing]);

  // Use local assets
  const avatarSource = isSpeaking
    ? require('../../assets/speaking.gif')
    : require('../../assets/idle.gif');

  const barHeights = [40, 75, 30, 95, 55, 85, 45, 70, 35, 90, 60, 80, 45];

  return (
    <View style={styles.container}>
      {/* Top HUD Telemetry Bar */}
      <View style={styles.hudBar}>
        <View style={styles.hudLeft}>
          <View style={styles.pingDot} />
          <Text style={styles.hudTitle}>HOLO-PROJECTION CORTEX</Text>
        </View>
        <Text style={styles.hudSpecs}>512-D // 60 FPS</Text>
      </View>

      {/* Main Holographic Chamber */}
      <View style={styles.chamber}>
        {/* Reticle Ring */}
        <View style={styles.reticleRing} />
        <View style={styles.reticleRingOuter} />

        {/* Corner Brackets */}
        <View style={[styles.cornerBracket, styles.topLeft]} />
        <View style={[styles.cornerBracket, styles.topRight]} />
        <View style={[styles.cornerBracket, styles.bottomLeft]} />
        <View style={[styles.cornerBracket, styles.bottomRight]} />

        {/* Avatar Image */}
        <Image
          source={avatarSource}
          style={styles.avatarImage}
          resizeMode="contain"
        />

        {/* Frequency Equalizer Visualizer */}
        <View style={styles.equalizerRow}>
          {barHeights.map((h, i) => {
            const barScale = isSpeaking ? (h / 100) : isProcessing ? (h / 200) : 0.15;
            return (
              <Animated.View
                key={i}
                style={[
                  styles.equalizerBar,
                  {
                    height: 24,
                    transform: [{ scaleY: animValue }],
                    backgroundColor: isSpeaking
                      ? Colors.emerald
                      : isProcessing
                      ? Colors.purple
                      : 'rgba(0, 240, 255, 0.3)',
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* Status Badges */}
      <View style={styles.statusArea}>
        {isSpeaking ? (
          <View style={[styles.statusBadge, styles.badgeSpeaking]}>
            <View style={[styles.statusDot, { backgroundColor: Colors.emerald }]} />
            <Volume2 color={Colors.emerald} size={12} />
            <Text style={[styles.statusText, { color: Colors.emerald }]}>VOCAL SYNTHESIS ACTIVE</Text>
          </View>
        ) : isProcessing ? (
          <View style={[styles.statusBadge, styles.badgeProcessing]}>
            <Cpu color={Colors.cyan} size={12} />
            <Text style={[styles.statusText, { color: Colors.cyan }]}>
              {processingStatus || 'CORTEX COMPUTING'}
            </Text>
          </View>
        ) : (
          <View style={[styles.statusBadge, styles.badgeIdle]}>
            <Radio color={Colors.cyan} size={12} />
            <Text style={[styles.statusText, { color: Colors.textSecondary }]}>NEURAL SENSORS READY</Text>
          </View>
        )}

        {/* Subtitle speech message */}
        {message ? (
          <View style={styles.subtitleBox}>
            <Text style={styles.subtitleText}>
              <Text style={{ color: Colors.cyan, fontWeight: '800' }}>&gt; </Text>
              {message}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#080d18',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  hudBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(12, 19, 34, 0.7)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
  },
  hudLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.cyan,
  },
  hudTitle: {
    color: Colors.cyan,
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  hudSpecs: {
    color: Colors.textMuted,
    fontSize: 7.5,
    fontWeight: '700',
  },
  chamber: {
    width: 130,
    height: 105,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  reticleRing: {
    position: 'absolute',
    width: 95,
    height: 95,
    borderRadius: 47.5,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderStyle: 'dashed',
  },
  reticleRingOuter: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  cornerBracket: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderColor: Colors.amber,
  },
  topLeft: {
    top: 2,
    left: 2,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  topRight: {
    top: 2,
    right: 2,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
  },
  bottomLeft: {
    bottom: 2,
    left: 2,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  bottomRight: {
    bottom: 2,
    right: 2,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
  },
  avatarImage: {
    width: 70,
    height: 70,
  },
  equalizerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
    height: 16,
    marginTop: 3,
  },
  equalizerBar: {
    width: 3,
    borderRadius: 2,
  },
  statusArea: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeSpeaking: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
  },
  badgeProcessing: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: Colors.amberBorder,
  },
  badgeIdle: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  subtitleBox: {
    width: '100%',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    borderRadius: 8,
    padding: 6,
    marginVertical: 2,
  },
  subtitleText: {
    color: Colors.textPrimary,
    fontSize: 9.5,
    lineHeight: 13,
    textAlign: 'center',
  },
});
