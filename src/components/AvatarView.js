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
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(12, 19, 34, 0.7)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
  },
  hudLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.cyan,
  },
  hudTitle: {
    color: Colors.cyan,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  hudSpecs: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  chamber: {
    width: 200,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  reticleRing: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderStyle: 'dashed',
  },
  reticleRingOuter: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  cornerBracket: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderColor: Colors.amber,
  },
  topLeft: {
    top: 4,
    left: 4,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  topRight: {
    top: 4,
    right: 4,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  bottomLeft: {
    bottom: 4,
    left: 4,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  bottomRight: {
    bottom: 4,
    right: 4,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  avatarImage: {
    width: 125,
    height: 125,
  },
  equalizerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 3,
    height: 24,
    marginTop: 6,
  },
  equalizerBar: {
    width: 3,
    borderRadius: 2,
  },
  statusArea: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
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
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  subtitleBox: {
    width: '100%',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    borderRadius: 10,
    padding: 10,
  },
  subtitleText: {
    color: Colors.textPrimary,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});
