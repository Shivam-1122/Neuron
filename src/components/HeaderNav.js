import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Colors } from '../theme/colors';
import { Brain, Settings, Activity, Cpu, Menu } from 'lucide-react-native';

export default function HeaderNav({ onOpenSettings, onOpenDrawer, currentScreen, onNavigate }) {
  return (
    <View style={styles.headerContainer}>
      {/* Left Drawer Menu Toggle & Brand */}
      <View style={styles.leftCluster}>
        <TouchableOpacity
          style={styles.drawerMenuBtn}
          activeOpacity={0.7}
          onPress={onOpenDrawer}
        >
          <Menu color={Colors.cyan} size={20} />
        </TouchableOpacity>

        {/* Brand Identity */}
        <TouchableOpacity
          style={styles.logoRow}
          activeOpacity={0.7}
          onPress={() => onNavigate('landing')}
        >
          <View style={styles.logoIconBox}>
            <Brain color={Colors.cyan} size={18} />
            <View style={styles.liveIndicator} />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.logoText}>NEURON</Text>
              <View style={styles.versionBadge}>
                <Text style={styles.versionBadgeText}>v2.6</Text>
              </View>
            </View>
            <Text style={styles.subtitleText}>NEURAL PROTOCOL</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Telemetry & Settings Button */}
      <View style={styles.rightCluster}>
        <View style={styles.telemetryPill}>
          <Activity color={Colors.emerald} size={11} />
          <Text style={styles.telemetryText}>ONLINE</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          activeOpacity={0.7}
          onPress={onOpenSettings}
        >
          <Settings color={Colors.cyan} size={17} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: 64,
    backgroundColor: '#060a12ee',
    borderBottomWidth: 1,
    borderBottomColor: Colors.cyanBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 50,
  },
  leftCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  drawerMenuBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  liveIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.cyan,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoText: {
    color: Colors.textPrimary,
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1.5,
  },
  versionBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
  },
  versionBadgeText: {
    color: Colors.cyan,
    fontSize: 9,
    fontWeight: '700',
  },
  subtitleText: {
    color: Colors.textMuted,
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 1,
  },
  rightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  telemetryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
    borderRadius: 12,
  },
  telemetryText: {
    color: Colors.emerald,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  settingsButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
