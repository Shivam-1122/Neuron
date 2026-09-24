import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Colors, Shadows } from '../theme/colors';
import {
  ArrowRight,
  Eye,
  Database,
  Cpu,
  Brain,
  Sparkles,
  Gamepad2,
  Users,
  ShieldCheck,
  HeartHandshake,
} from 'lucide-react-native';

export default function LandingScreen({ onGetStarted, onPlayGame }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero Badge */}
      <View style={styles.heroBadge}>
        <View style={styles.pingDot} />
        <Text style={styles.heroBadgeText}>AI MEMORY COMPANION & COGNITIVE SANCTUARY</Text>
      </View>

      {/* Hero Title */}
      <Text style={styles.heroTitle}>
        Your Caring{'\n'}
        <Text style={styles.heroTitleGradient}>Memory Companion</Text>
      </Text>

      {/* Hero Description */}
      <Text style={styles.heroDesc}>
        Neuron helps Alzheimer's and Dementia patients recognize loved ones, locate everyday items, and exercise cognitive health in a calm, stress-free environment.
      </Text>

      {/* Primary CTAs */}
      <View style={styles.ctaRow}>
        <TouchableOpacity
          style={styles.ctaPrimary}
          activeOpacity={0.8}
          onPress={onGetStarted}
        >
          <Text style={styles.ctaPrimaryText}>LAUNCH ASSISTANT</Text>
          <ArrowRight color="#111318" size={16} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ctaSecondary}
          activeOpacity={0.8}
          onPress={onPlayGame}
        >
          <Gamepad2 color={Colors.amber} size={16} />
          <Text style={styles.ctaSecondaryText}>MEMORY GYM</Text>
        </TouchableOpacity>
      </View>

      {/* Operational Status Pill */}
      <View style={styles.statusPill}>
        <View style={[styles.pingDot, { backgroundColor: Colors.emerald }]} />
        <Text style={styles.statusPillText}>STATUS: READY & SERENE</Text>
      </View>

      {/* Companion Simulation Card */}
      <View style={styles.simulationCard}>
        <View style={styles.simHeader}>
          <View style={styles.simDots}>
            <View style={[styles.simDot, { backgroundColor: Colors.amber }]} />
            <Text style={styles.simTitle}>Neuron Companion</Text>
          </View>
          <Text style={styles.simStatus}>CALM PRESENCE</Text>
        </View>

        {/* Live Assistant Visual */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarIconBox}>
            <Brain size={20} color={Colors.amber} />
          </View>
          <View>
            <Text style={styles.avatarTitle}>Caring Memory Companion</Text>
            <View style={styles.avatarStatusRow}>
              <View style={[styles.pingDot, { backgroundColor: Colors.amber }]} />
              <Text style={styles.avatarStatusText}>Gentle Voice & Vision Ready</Text>
            </View>
          </View>
        </View>

        {/* Dialogue Bubbles */}
        <View style={styles.dialogueList}>
          <View style={styles.dialogueBot}>
            <Text style={styles.dialogueTag}>[NEURON]</Text>
            <Text style={styles.dialogueText}>
              "Good day! Here is your gentle reminder for today's routine and peaceful moments."
            </Text>
          </View>
          <View style={styles.dialogueUser}>
            <Text style={[styles.dialogueTag, { color: Colors.amber }]}>[YOU]</Text>
            <Text style={styles.dialogueText}>
              "Where did I leave my reading glasses?"
            </Text>
          </View>
          <View style={styles.dialogueBot}>
            <Text style={styles.dialogueTag}>[NEURON]</Text>
            <Text style={styles.dialogueText}>
              "Your glasses are safely resting on the bedside table next to your favorite book."
            </Text>
          </View>
        </View>
      </View>

      {/* Specs Metrics */}
      <View style={styles.specsGrid}>
        <View style={styles.specBox}>
          <Text style={[styles.specNumber, { color: Colors.amber }]}>512-D</Text>
          <Text style={styles.specLabel}>Facial Vectors</Text>
        </View>
        <View style={styles.specBox}>
          <Text style={[styles.specNumber, { color: Colors.emerald }]}>4 Games</Text>
          <Text style={styles.specLabel}>Memory Gym</Text>
        </View>
        <View style={styles.specBox}>
          <Text style={[styles.specNumber, { color: Colors.amber }]}>&lt; 50ms</Text>
          <Text style={styles.specLabel}>Vector Recall</Text>
        </View>
        <View style={styles.specBox}>
          <Text style={[styles.specNumber, { color: Colors.emerald }]}>100%</Text>
          <Text style={styles.specLabel}>Private Vault</Text>
        </View>
      </View>

      {/* 4 Core Pillars */}
      <View style={styles.featuresContainer}>
        <Text style={styles.featuresHeading}>Designed for Calming Cognitive Support</Text>

        <View style={styles.featureCard}>
          <View style={styles.featureIcon}>
            <Eye size={20} color={Colors.amber} />
          </View>
          <View style={styles.featureBody}>
            <Text style={styles.featureTitle}>Biometric Face Recognition</Text>
            <Text style={styles.featureDesc}>
              Identifies familiar family members and caregivers instantly from camera scans without passwords.
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.featureIcon}>
            <Gamepad2 size={20} color={Colors.emerald} />
          </View>
          <View style={styles.featureBody}>
            <Text style={styles.featureTitle}>Cognitive Memory Gym</Text>
            <Text style={styles.featureDesc}>
              4 therapeutic games with soothing audio chimes: Cortex Match, Sequence Chimes, Daily Routine, and Number Sort.
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.featureIcon}>
            <Brain size={20} color={Colors.amber} />
          </View>
          <View style={styles.featureBody}>
            <Text style={styles.featureTitle}>Context-Aware Voice Recall</Text>
            <Text style={styles.featureDesc}>
              Hold-to-talk speech with OpenAI Whisper and dual-engine intelligence answering daily queries gently.
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.featureIcon}>
            <ShieldCheck size={20} color={Colors.emerald} />
          </View>
          <View style={styles.featureBody}>
            <Text style={styles.featureTitle}>Caregiver Sanctuary Portal</Text>
            <Text style={styles.featureDesc}>
              Real-time distress notifications, memory protocol enrollment, and multi-caregiver coordination.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.amberMuted,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  pingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.amber,
  },
  heroBadgeText: {
    color: Colors.amber,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: Colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 12,
  },
  heroTitleGradient: {
    color: Colors.amber,
  },
  heroDesc: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 320,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.amber,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    ...Shadows.amberGlow,
  },
  ctaPrimaryText: {
    color: '#111318',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  ctaSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  ctaSecondaryText: {
    color: Colors.amber,
    fontWeight: '700',
    fontSize: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 16,
    marginBottom: 24,
  },
  statusPillText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  simulationCard: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderAmber,
    padding: 16,
    marginBottom: 24,
    ...Shadows.cardShadow,
  },
  simHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    paddingBottom: 10,
    marginBottom: 12,
  },
  simDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  simDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  simTitle: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  simStatus: {
    color: Colors.amber,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  avatarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: 14,
  },
  avatarIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.amberMuted,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTitle: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  avatarStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  avatarStatusText: {
    color: Colors.amber,
    fontSize: 10,
    fontWeight: '500',
  },
  dialogueList: {
    gap: 10,
  },
  dialogueBot: {
    backgroundColor: Colors.surfaceElevated,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  dialogueUser: {
    backgroundColor: Colors.amberMuted,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  dialogueTag: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 4,
  },
  dialogueText: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: '100%',
    marginBottom: 24,
  },
  specBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
  },
  specNumber: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 2,
  },
  specLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  featuresContainer: {
    width: '100%',
    gap: 12,
  },
  featuresHeading: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBody: {
    flex: 1,
  },
  featureTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  featureDesc: {
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
});
