import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { Colors } from '../theme/colors';
import {
  Brain,
  Gamepad2,
  Sparkles,
  Shield,
  User,
  Zap,
  Volume2,
  VolumeX,
  UserPlus,
  PackagePlus,
  Bell,
  Settings,
  LogOut,
  X,
  Activity,
  CheckCircle2,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 340);

export default function NavigationDrawer({
  visible,
  onClose,
  currentScreen,
  onNavigate,
  currentUser,
  onLogout,
  llmProvider,
  onToggleLLM,
  speechEnabled,
  onToggleSpeech,
  onQuickEnrollPerson,
  onQuickEnrollObject,
  onTriggerAlert,
  onOpenSettings,
}) {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const role = currentUser?.role || 'patient';
  const displayName = currentUser?.displayName || currentUser?.name || (role === 'caregiver' ? 'Caregiver Architect' : 'Patient');
  const userPhoto = currentUser?.photoURL || currentUser?.image_base64;

  const handleNav = (screen) => {
    onClose();
    setTimeout(() => {
      onNavigate(screen);
    }, 150);
  };

  const handleEmergencyAlert = () => {
    Alert.alert(
      '🚨 EMERGENCY CAREGIVER ALERT',
      'Do you wish to dispatch an immediate distress signal to all enrolled caregivers?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'DISPATCH ALERT',
          style: 'destructive',
          onPress: () => {
            if (onTriggerAlert) onTriggerAlert();
            Alert.alert('Alert Sent', 'Distress telemetry dispatched to caregivers.');
          },
        },
      ]
    );
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* Slide-out Drawer Container */}
        <Animated.View
          style={[
            styles.drawerContent,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          {/* Header Profile HUD */}
          <View style={styles.profileHeader}>
            <View style={styles.profileTopRow}>
              <View style={styles.avatarBorder}>
                {userPhoto ? (
                  <Image
                    source={{
                      uri: userPhoto.startsWith('data:')
                        ? userPhoto
                        : `data:image/jpeg;base64,${userPhoto}`,
                    }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <User color={role === 'caregiver' ? Colors.purple : Colors.cyan} size={22} />
                  </View>
                )}
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: role === 'caregiver' ? Colors.purple : Colors.emerald },
                  ]}
                />
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <X color={Colors.textMuted} size={18} />
              </TouchableOpacity>
            </View>

            <Text style={styles.profileName} numberOfLines={1}>
              {displayName}
            </Text>

            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.roleBadge,
                  role === 'caregiver' ? styles.roleBadgeCaregiver : styles.roleBadgePatient,
                ]}
              >
                <Text
                  style={[
                    styles.roleBadgeText,
                    { color: role === 'caregiver' ? Colors.purple : Colors.cyan },
                  ]}
                >
                  {role === 'caregiver' ? 'CAREGIVER ARCHITECT' : 'PATIENT CORE'}
                </Text>
              </View>
              <View style={styles.linkStatusPill}>
                <Activity color={Colors.emerald} size={10} />
                <Text style={styles.linkStatusText}>ONLINE</Text>
              </View>
            </View>
          </View>

          {/* Drawer Body Scroll */}
          <ScrollView
            style={styles.drawerBody}
            contentContainerStyle={styles.drawerBodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Primary Navigation Section */}
            <Text style={styles.sectionHeader}>PRIMARY PROTOCOLS</Text>

            <TouchableOpacity
              style={[
                styles.navItem,
                currentScreen === 'patient' && styles.navItemActive,
              ]}
              onPress={() => handleNav('patient')}
            >
              <View style={[styles.navIconBox, { borderColor: Colors.cyanBorder }]}>
                <Brain color={Colors.cyan} size={18} />
              </View>
              <View style={styles.navTextCol}>
                <Text style={styles.navTitle}>Cortex Assistant</Text>
                <Text style={styles.navDesc}>Conversational & Optical Memory</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navItem,
                currentScreen === 'game' && styles.navItemActive,
              ]}
              onPress={() => handleNav('game')}
            >
              <View style={[styles.navIconBox, { borderColor: Colors.amberBorder }]}>
                <Gamepad2 color={Colors.amber} size={18} />
              </View>
              <View style={styles.navTextCol}>
                <Text style={styles.navTitle}>Memory Gym</Text>
                <Text style={styles.navDesc}>Cortex Match, Sequences & Puzzles</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navItem,
                currentScreen === 'task_guide' && styles.navItemActive,
              ]}
              onPress={() => handleNav('task_guide')}
            >
              <View style={[styles.navIconBox, { borderColor: Colors.cyanBorder }]}>
                <Sparkles color={Colors.cyan} size={18} />
              </View>
              <View style={styles.navTextCol}>
                <Text style={styles.navTitle}>Task Guide</Text>
                <Text style={styles.navDesc}>Autonomous Multimodal Vision</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navItem,
                currentScreen === 'caregiver' && styles.navItemActive,
              ]}
              onPress={() => handleNav('caregiver')}
            >
              <View style={[styles.navIconBox, { borderColor: Colors.purpleBorder }]}>
                <Shield color={Colors.purple} size={18} />
              </View>
              <View style={styles.navTextCol}>
                <Text style={styles.navTitle}>Caregiver Sanctuary</Text>
                <Text style={styles.navDesc}>Team & Identity Anchors</Text>
              </View>
            </TouchableOpacity>

            {/* De-congested Toolset Section */}
            <Text style={[styles.sectionHeader, { marginTop: 18 }]}>
              DE-CONGESTED TOOLSET & TELEMETRY
            </Text>

            {/* LLM Engine Switcher */}
            <View style={styles.toolCard}>
              <View style={styles.toolHeaderRow}>
                <View style={styles.toolLabelRow}>
                  <Zap color={Colors.cyan} size={14} />
                  <Text style={styles.toolTitle}>LLM Engine Core</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.llmSwitchBtn,
                    llmProvider === 'gemini' && styles.llmSwitchBtnGemini,
                  ]}
                  onPress={onToggleLLM}
                >
                  <Text style={styles.llmSwitchText}>
                    {llmProvider === 'gemini' ? 'GEMINI 2.0' : 'GROQ LLAMA 3'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.toolSub}>
                {llmProvider === 'gemini'
                  ? 'High reasoning & multimodal contextual synthesis'
                  : 'Ultra-low latency 70B neural inference'}
              </Text>
            </View>

            {/* Voice Guidance Toggle */}
            <TouchableOpacity
              style={styles.toolToggleRow}
              onPress={onToggleSpeech}
              activeOpacity={0.7}
            >
              <View style={styles.toolLabelRow}>
                {speechEnabled ? (
                  <Volume2 color={Colors.emerald} size={16} />
                ) : (
                  <VolumeX color={Colors.textMuted} size={16} />
                )}
                <View>
                  <Text style={styles.toolTitle}>Voice Guidance (TTS)</Text>
                  <Text style={styles.toolSub}>
                    {speechEnabled ? 'Vocal synthesis enabled' : 'Muted audio speech'}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.toggleBadge,
                  speechEnabled ? styles.toggleBadgeActive : styles.toggleBadgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.toggleBadgeText,
                    { color: speechEnabled ? Colors.emerald : Colors.textMuted },
                  ]}
                >
                  {speechEnabled ? 'ACTIVE' : 'OFF'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Quick Memory Enrollment Hub */}
            <View style={styles.enrollGrid}>
              <TouchableOpacity
                style={styles.enrollBtn}
                onPress={() => {
                  onClose();
                  if (onQuickEnrollPerson) onQuickEnrollPerson();
                }}
              >
                <UserPlus color={Colors.emerald} size={16} />
                <Text style={[styles.enrollBtnText, { color: Colors.emerald }]}>
                  ENROLL PERSON
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.enrollBtn}
                onPress={() => {
                  onClose();
                  if (onQuickEnrollObject) onQuickEnrollObject();
                }}
              >
                <PackagePlus color={Colors.amber} size={16} />
                <Text style={[styles.enrollBtnText, { color: Colors.amber }]}>
                  ENROLL OBJECT
                </Text>
              </TouchableOpacity>
            </View>

            {/* Distress Alert Dispatch */}
            <TouchableOpacity
              style={styles.alertDispatchBtn}
              onPress={handleEmergencyAlert}
              activeOpacity={0.8}
            >
              <Bell color="#fff" size={16} />
              <Text style={styles.alertDispatchText}>EMERGENCY CAREGIVER ALERT</Text>
            </TouchableOpacity>

            {/* Network / Settings shortcut */}
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => {
                onClose();
                if (onOpenSettings) onOpenSettings();
              }}
            >
              <Settings color={Colors.cyan} size={16} />
              <Text style={styles.secondaryActionText}>Neural Core & Settings</Text>
            </TouchableOpacity>

            {/* Logout / Switch Role */}
            <TouchableOpacity
              style={[styles.secondaryAction, { marginTop: 4, borderColor: Colors.redBorder }]}
              onPress={() => {
                onClose();
                if (onLogout) onLogout();
                else onNavigate('login');
              }}
            >
              <LogOut color={Colors.red} size={16} />
              <Text style={[styles.secondaryActionText, { color: Colors.red }]}>
                Sign Out / Switch Mode
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Footer Telemetry */}
          <View style={styles.drawerFooter}>
            <Text style={styles.footerVersion}>NEURON MOBILE // v2.6.4 PROTOCOL</Text>
            <Text style={styles.footerSub}>COGNITIVE SANCTUARY ACTIVE</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 12, 0.75)',
  },
  drawerContent: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#070b14',
    borderRightWidth: 1,
    borderRightColor: Colors.cyanBorder,
    shadowColor: Colors.cyan,
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 20,
    display: 'flex',
    flexDirection: 'column',
  },
  profileHeader: {
    paddingTop: 45,
    paddingHorizontal: 18,
    paddingBottom: 16,
    backgroundColor: '#0c1322',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  avatarBorder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.cyan,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#070b14',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleBadgePatient: {
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderColor: Colors.cyanBorder,
  },
  roleBadgeCaregiver: {
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    borderColor: Colors.purpleBorder,
  },
  roleBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  linkStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
  },
  linkStatusText: {
    color: Colors.emerald,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  drawerBody: {
    flex: 1,
  },
  drawerBodyContent: {
    padding: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: 8,
  },
  navItemActive: {
    borderColor: Colors.cyan,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  navIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTextCol: {
    flex: 1,
  },
  navTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  navDesc: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  toolCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 12,
    marginBottom: 10,
  },
  toolHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  toolLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolTitle: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  toolSub: {
    color: Colors.textMuted,
    fontSize: 9.5,
    marginTop: 2,
    lineHeight: 14,
  },
  llmSwitchBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
  },
  llmSwitchBtnGemini: {
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderColor: Colors.purpleBorder,
  },
  llmSwitchText: {
    color: Colors.cyan,
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  toolToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 12,
    marginBottom: 10,
  },
  toggleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  toggleBadgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: Colors.emeraldBorder,
  },
  toggleBadgeInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: Colors.borderSubtle,
  },
  toggleBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  enrollGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  enrollBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 10,
    paddingVertical: 10,
  },
  enrollBtnText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  alertDispatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  alertDispatchText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  secondaryActionText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  drawerFooter: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    backgroundColor: '#060a12',
    alignItems: 'center',
  },
  footerVersion: {
    color: Colors.textMuted,
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 1,
  },
  footerSub: {
    color: Colors.cyan,
    fontSize: 7.5,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.6,
  },
});
