import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Colors, Shadows } from '../theme/colors';
import { Brain, Settings, Volume2, VolumeX, Sparkles, User } from 'lucide-react-native';
import sound from '../utils/soundEngine';

export default function HeaderNav({
  currentUser,
  onOpenSettings,
  currentScreen,
  onNavigate,
  isMuted,
  onToggleSound,
}) {
  return (
    <View style={styles.headerContainer}>
      {/* Brand Identity matching web SideNav */}
      <TouchableOpacity
        style={styles.logoRow}
        activeOpacity={0.8}
        onPress={() => onNavigate(currentUser ? 'patient' : 'landing')}
      >
        <View style={styles.logoIconBox}>
          <Brain color={Colors.amber} size={18} />
          <View style={styles.liveBeacon}>
            <View style={styles.beaconPing} />
            <View style={styles.beaconCore} />
          </View>
        </View>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.logoText}>NEURON</Text>
            <View style={styles.sanctuaryBadge}>
              <Text style={styles.sanctuaryBadgeText}>SANCTUARY</Text>
            </View>
          </View>
          <Text style={styles.subtitleText}>Caring Memory Companion</Text>
        </View>
      </TouchableOpacity>

      {/* Right Controls: Sign In or Profile + Sound + Settings */}
      <View style={styles.rightCluster}>
        {/* Audio Mute/Unmute */}
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.7}
          onPress={onToggleSound}
          accessibilityLabel="Toggle Sound"
        >
          {isMuted ? (
            <VolumeX color={Colors.textMuted} size={16} />
          ) : (
            <Volume2 color={Colors.amber} size={16} />
          )}
        </TouchableOpacity>

        {currentUser ? (
          <>
            {/* User Profile Pill */}
            <TouchableOpacity
              style={styles.profilePill}
              activeOpacity={0.7}
              onPress={() => onOpenSettings('profile')}
            >
              <View style={styles.profileAvatar}>
                <Text style={styles.profileInitial}>
                  {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileMeta}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {(currentUser.displayName || 'Member').split(' ')[0]}
                </Text>
                <Text style={styles.profileRole}>
                  {currentUser.role === 'caregiver' ? 'CAREGIVER' : 'SECURE'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Settings Gear */}
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              onPress={() => onOpenSettings('settings')}
            >
              <Settings color={Colors.textMuted} size={16} />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.signInButton}
            activeOpacity={0.8}
            onPress={() => onNavigate('login')}
          >
            <Text style={styles.signInText}>SIGN IN</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: 64,
    backgroundColor: '#111318f2',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 50,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.amberMuted,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Shadows.amberGlow,
  },
  liveBeacon: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beaconPing: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.amber,
    opacity: 0.6,
  },
  beaconCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.amber,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 1,
  },
  sanctuaryBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
  },
  sanctuaryBadgeText: {
    color: Colors.amber,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  subtitleText: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '500',
    marginTop: 1,
  },
  rightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButton: {
    backgroundColor: Colors.amber,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    ...Shadows.amberGlow,
  },
  signInText: {
    color: '#111318',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  profileAvatar: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: Colors.amberMuted,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    color: Colors.amber,
    fontWeight: '700',
    fontSize: 11,
  },
  profileMeta: {
    maxWidth: 70,
  },
  profileName: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  profileRole: {
    color: Colors.emerald,
    fontSize: 8,
    fontWeight: '700',
  },
});
