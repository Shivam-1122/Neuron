import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import { ArrowRight, Eye, Database, Cpu, Brain, Activity, ShieldCheck } from 'lucide-react-native';

export default function LandingScreen({ onGetStarted }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero Badge */}
      <View style={styles.heroBadge}>
        <View style={styles.pingDot} />
        <Text style={styles.heroBadgeText}>NEXT-GEN AI MEMORY AUGMENTATION</Text>
      </View>

      {/* Hero Title */}
      <Text style={styles.heroTitle}>
        Your External{'\n'}
        <Text style={styles.heroTitleGradient}>Neural Cortex</Text>
      </Text>

      {/* Hero Description */}
      <Text style={styles.heroDesc}>
        Neuron acts as an intelligent sensory extension for Alzheimer's & Dementia patients — identifying faces, tracking misplaced objects, and conversing with context-aware memory recall.
      </Text>

      {/* CTA Button */}
      <TouchableOpacity
        style={styles.ctaButton}
        activeOpacity={0.8}
        onPress={onGetStarted}
      >
        <Text style={styles.ctaButtonText}>INITIALIZE CORTEX</Text>
        <ArrowRight color="#060a12" size={18} />
      </TouchableOpacity>

      {/* Operational Status Pill */}
      <View style={styles.statusPill}>
        <View style={[styles.pingDot, { backgroundColor: Colors.emerald }]} />
        <Text style={styles.statusPillText}>STATUS: LIVE & OPERATIONAL</Text>
      </View>

      {/* Terminal Simulation Card */}
      <View style={styles.terminalCard}>
        <View style={styles.terminalHeader}>
          <View style={styles.terminalDots}>
            <View style={[styles.terminalDot, { backgroundColor: '#ef4444' }]} />
            <View style={[styles.terminalDot, { backgroundColor: '#f59e0b' }]} />
            <View style={[styles.terminalDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.terminalTitle}>NEURON_KERNEL // v2.6</Text>
          </View>
          <Text style={styles.terminalStatus}>QDRANT_ONLINE</Text>
        </View>

        <View style={styles.dialogueList}>
          <View style={styles.dialogueBot}>
            <Text style={styles.dialogueTag}>[NEURAL RECALL]</Text>
            <Text style={styles.dialogueText}>
              "I identified Dr. Miller entering the room. He is your neurologist scheduled for 3:00 PM."
            </Text>
          </View>
          <View style={styles.dialogueUser}>
            <Text style={[styles.dialogueTag, { color: Colors.purple }]}>[USER QUERY]</Text>
            <Text style={styles.dialogueText}>
              "Where did I put my prescription glasses?"
            </Text>
          </View>
          <View style={styles.dialogueBot}>
            <Text style={styles.dialogueTag}>[SPATIAL MEMORY]</Text>
            <Text style={styles.dialogueText}>
              "Your glasses were detected on the nightstand beside your book 45 minutes ago."
            </Text>
          </View>
        </View>
      </View>

      {/* Architecture Specs Metrics */}
      <View style={styles.specsGrid}>
        <View style={styles.specBox}>
          <Text style={[styles.specNumber, { color: Colors.cyan }]}>512-D</Text>
          <Text style={styles.specLabel}>Facial Vectors</Text>
        </View>
        <View style={styles.specBox}>
          <Text style={[styles.specNumber, { color: Colors.emerald }]}>384-D</Text>
          <Text style={styles.specLabel}>Semantic Embedding</Text>
        </View>
        <View style={styles.specBox}>
          <Text style={[styles.specNumber, { color: Colors.purple }]}>&lt; 50ms</Text>
          <Text style={styles.specLabel}>Vector Latency</Text>
        </View>
        <View style={styles.specBox}>
          <Text style={[styles.specNumber, { color: Colors.blue }]}>100%</Text>
          <Text style={styles.specLabel}>Private Bank</Text>
        </View>
      </View>

      {/* Feature Cards */}
      <View style={styles.featuresContainer}>
        <Text style={styles.featuresHeading}>Engineered for High-Reliability Memory</Text>

        <View style={styles.featureCard}>
          <View style={styles.featureCardHeader}>
            <View style={styles.featureIconBox}>
              <Eye color={Colors.cyan} size={20} />
            </View>
            <Text style={styles.featureTag}>VISION CORE</Text>
          </View>
          <Text style={styles.featureTitle}>Optical Biometrics</Text>
          <Text style={styles.featureDesc}>
            Instant facial recognition and object localization using deep metric vector embeddings.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.featureCardHeader}>
            <View style={styles.featureIconBox}>
              <Database color={Colors.emerald} size={20} />
            </View>
            <Text style={styles.featureTag}>QDRANT ENGINE</Text>
          </View>
          <Text style={styles.featureTitle}>Vector Memory DB</Text>
          <Text style={styles.featureDesc}>
            Sub-millisecond semantic search and recall across recognized faces, contacts, and personal items.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.featureCardHeader}>
            <View style={styles.featureIconBox}>
              <Cpu color={Colors.purple} size={20} />
            </View>
            <Text style={styles.featureTag}>REMOTE LINK</Text>
          </View>
          <Text style={styles.featureTitle}>Caregiver Sync</Text>
          <Text style={styles.featureDesc}>
            Caregivers can remotely enroll family identities, link voice signatures, and manage health context.
          </Text>
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.footerText}>
        © 2026 NEURON PROJECT // MULTIMODAL NEURAL ASSISTANT
      </Text>
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
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
    marginBottom: 16,
  },
  pingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.cyan,
  },
  heroBadgeText: {
    color: Colors.cyan,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.textPrimary,
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  heroTitleGradient: {
    color: Colors.cyan,
  },
  heroDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.cyan,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  ctaButtonText: {
    color: '#060a12',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  statusPillText: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  terminalCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
    padding: 16,
    marginBottom: 24,
  },
  terminalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 240, 255, 0.15)',
    marginBottom: 12,
  },
  terminalDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  terminalDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  terminalTitle: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 6,
  },
  terminalStatus: {
    color: Colors.cyan,
    fontSize: 9,
    fontWeight: '800',
  },
  dialogueList: {
    gap: 10,
  },
  dialogueBot: {
    backgroundColor: 'rgba(0, 240, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    borderRadius: 10,
    padding: 10,
  },
  dialogueUser: {
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
    borderRadius: 10,
    padding: 10,
    alignSelf: 'flex-end',
    maxWidth: '90%',
  },
  dialogueTag: {
    color: Colors.cyan,
    fontSize: 8,
    fontWeight: '900',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  dialogueText: {
    color: Colors.textPrimary,
    fontSize: 11,
    lineHeight: 16,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
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
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  specLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 24,
  },
  featuresHeading: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  featureCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  featureCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTag: {
    color: Colors.textMuted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  featureTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  featureDesc: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  footerText: {
    color: Colors.textDark,
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
