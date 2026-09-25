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
        onPress={() => onNavigate(currentUser ? 'patient' : 'login')}
      >
        <View style={styles.logoIconBox}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.logoText}>NEURON</Text>
            <View style={styles.sanctuaryBadge}>
              <Text style={styles.sanctuaryBadgeText}>SANCTUARY</Text>
            </View>
          </View>
          <Text style={styles.subtitleText}>External Neural Cortex</Text>
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
        ) : (
          <TouchableOpacity
            style={styles.signInButton}
            activeOpacity={0.8}
            onPress={() => onNavigate('login')}
          >
            <Text style={styles.signInText}>SIGN IN</Text>
          </TouchableOpacity>
        )}

        {/* Settings Gear - ALWAYS VISIBLE TO CONFIGURE BACKEND URL */}
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.7}
          onPress={() => onOpenSettings('settings')}
          accessibilityLabel="Configure Backend URL"
        >
          <Settings color={Colors.amber} size={16} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: 48,
    backgroundColor: '#111318f2',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    zIndex: 50,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 24,
    height: 24,
    borderRadius: 5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  logoText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.8,
  },
  sanctuaryBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
  },
  sanctuaryBadgeText: {
    color: Colors.amber,
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  subtitleText: {
    color: Colors.textMuted,
    fontSize: 7.5,
    fontWeight: '500',
    marginTop: 0.5,
  },
  rightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButton: {
    backgroundColor: Colors.amber,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
  },
  signInText: {
    color: '#111318',
    fontWeight: '800',
    fontSize: 9.5,
    letterSpacing: 0.6,
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: Colors.card,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  profileAvatar: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: Colors.amberMuted,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    color: Colors.amber,
    fontWeight: '700',
    fontSize: 9.5,
  },
  profileMeta: {
    maxWidth: 60,
  },
  profileName: {
    color: Colors.textPrimary,
    fontSize: 9.5,
    fontWeight: '600',
  },
  profileRole: {
    color: Colors.emerald,
    fontSize: 7,
    fontWeight: '700',
  },
});
