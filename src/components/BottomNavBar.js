import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Shadows } from '../theme/colors';
import { Users, Gamepad2, Sparkles, Cpu } from 'lucide-react-native';

export default function BottomNavBar({ currentView, onViewChange, currentUser }) {
  const tabs = [
    { id: 'patient', label: 'Assistant', icon: Users },
    { id: 'game', label: 'Memory Gym', icon: Gamepad2 },
    { id: 'task_guide', label: 'Task Coach', icon: Sparkles },
    { id: 'caregiver', label: 'Caregiver', icon: Cpu },
  ];

  return (
    <View style={styles.navContainer}>
      {tabs.map((tab) => {
        const IconComp = tab.icon;
        const isActive = currentView === tab.id;

        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabButton, isActive && styles.tabButtonActive]}
            activeOpacity={0.7}
            onPress={() => onViewChange(tab.id)}
          >
            <View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
              <IconComp
                size={18}
                color={isActive ? Colors.amber : Colors.textMuted}
              />
            </View>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    height: 64,
    backgroundColor: '#16181ff5',
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconWrapperActive: {
    backgroundColor: Colors.amberMuted,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 2,
  },
  tabLabelActive: {
    color: Colors.amber,
    fontWeight: '700',
  },
});
