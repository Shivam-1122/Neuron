import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, StatusBar, SafeAreaView, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { Colors } from './src/theme/colors';
import { Users, Sparkles, Cpu, Gamepad2, Settings } from 'lucide-react-native';

// Components & Modals
import HeaderNav from './src/components/HeaderNav';
import SettingsModal from './src/components/SettingsModal';
import EnrollmentModal from './src/components/EnrollmentModal';

// Screens
import LandingScreen from './src/screens/LandingScreen';
import LoginScreen from './src/screens/LoginScreen';
import PatientCortexScreen from './src/screens/PatientCortexScreen';
import MemoryGamesScreen from './src/screens/MemoryGamesScreen';
import TaskGuideScreen from './src/screens/TaskGuideScreen';
import CaregiverScreen from './src/screens/CaregiverScreen';

import { setLLMProviderApi } from './src/api/client';
import sound from './src/utils/soundEngine';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('login'); // Require auth by default

  // Sound Mute State
  const [isMuted, setIsMuted] = useState(false);

  // Modals state
  const [showSettings, setShowSettings] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollType, setEnrollType] = useState('person');

  // Global settings state
  const [llmProvider, setLlmProvider] = useState('groq');

  // Load saved session on boot
  useEffect(() => {
    AsyncStorage.getItem('neuron_session_user')
      .then((saved) => {
        if (saved) {
          const user = JSON.parse(saved);
          setCurrentUser(user);
          setCurrentView(user.role === 'caregiver' ? 'caregiver' : 'patient');
        } else {
          setCurrentView('login');
        }
      })
      .catch(() => {
        setCurrentView('login');
      });
  }, []);

  // Safe navigation helper that stops speech on screen switch
  const navigateTo = (viewName) => {
    Speech.stop();

    // Strict Gatekeeping: Unauthenticated users are sent to login
    if (!currentUser && viewName !== 'login' && viewName !== 'landing') {
      setCurrentView('login');
      return;
    }

    if (viewName === 'game') {
      sound.startBackgroundMusic();
    } else {
      sound.stopBackgroundMusic();
    }

    setCurrentView(viewName);
  };

  // Toggle Sound
  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Toggle LLM Provider
  const handleToggleLLM = async () => {
    const next = llmProvider === 'groq' ? 'gemini' : 'groq';
    setLlmProvider(next);
    try {
      await setLLMProviderApi(next);
    } catch (e) {
      console.warn('Backend LLM toggle note:', e);
    }
  };

  // Login handler
  const handleLoginSuccess = async (user) => {
    Speech.stop();
    setCurrentUser(user);
    try {
      await AsyncStorage.setItem('neuron_session_user', JSON.stringify(user));
    } catch (e) {
      console.warn('Could not save session to storage:', e);
    }
    if (user?.role === 'caregiver') {
      setCurrentView('caregiver');
    } else {
      setCurrentView('patient');
    }
  };

  // Logout handler
  const handleLogout = async () => {
    Speech.stop();
    sound.stopBackgroundMusic();
    setCurrentUser(null);
    try {
      await AsyncStorage.removeItem('neuron_session_user');
    } catch (e) {}
    setCurrentView('login');
  };

  // Screen routing
  let screenContent;
  switch (currentView) {
    case 'landing':
      screenContent = (
        <LandingScreen
          onGetStarted={() => navigateTo(currentUser ? 'patient' : 'login')}
          onPlayGame={() => navigateTo('game')}
        />
      );
      break;
    case 'login':
      screenContent = (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onSelectRole={(role) => {
            if (role === 'caregiver') navigateTo('caregiver');
            else navigateTo('patient');
          }}
        />
      );
      break;
    case 'game':
      screenContent = <MemoryGamesScreen onBack={() => navigateTo(currentUser ? 'patient' : 'login')} />;
      break;
    case 'task_guide':
      screenContent = <TaskGuideScreen onBack={() => navigateTo('patient')} />;
      break;
    case 'caregiver':
      screenContent = (
        <CaregiverScreen
          onBack={() => navigateTo('patient')}
          currentUser={currentUser}
        />
      );
      break;
    case 'patient':
    default:
      screenContent = (
        <PatientCortexScreen
          onNavigate={navigateTo}
          currentUser={currentUser}
          llmProvider={llmProvider}
          onToggleLLM={handleToggleLLM}
          onPlayGame={() => navigateTo('game')}
          onOpenEnrollment={(type) => {
            setEnrollType(type || 'person');
            setShowEnrollModal(true);
          }}
        />
      );
      break;
  }

  // 5 bottom tabs
  const navTabs = [
    { id: 'patient', label: 'Assistant', icon: Users },
    { id: 'game', label: 'Gym', icon: Gamepad2 },
    { id: 'task_guide', label: 'Guide', icon: Sparkles },
    { id: 'caregiver', label: 'Caregiver', icon: Cpu },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Only show bottom navigation when user is authenticated
  const isAuthView = currentView === 'login' || currentView === 'landing';

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#111318" />

        {/* Global Compact Header with Brand Logo */}
        <HeaderNav
          currentScreen={currentView}
          onNavigate={navigateTo}
          currentUser={currentUser}
          onOpenSettings={() => setShowSettings(true)}
          isMuted={isMuted}
          onToggleSound={handleToggleSound}
        />

        {/* Main Content Area */}
        <View style={styles.mainStage}>{screenContent}</View>

        {/* Core Bottom Navigation Tabs (Shown when logged in) */}
        {!isAuthView && currentUser ? (
          <View style={styles.bottomNav}>
            {navTabs.map((tab) => {
              const IconComp = tab.icon;
              const isActive = currentView === tab.id;

              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.navTab, isActive && styles.navTabActive]}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (tab.id === 'settings') {
                      setShowSettings(true);
                      return;
                    }
                    navigateTo(tab.id);
                  }}
                >
                  <View style={[styles.tabIconWrap, isActive && styles.tabIconWrapActive]}>
                    <IconComp
                      color={isActive ? Colors.amber : Colors.textMuted}
                      size={15}
                    />
                  </View>
                  <Text style={[styles.navTabText, isActive && styles.navTabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        {/* Settings Modal */}
        <SettingsModal
          visible={showSettings}
          onClose={() => setShowSettings(false)}
          currentUser={currentUser}
          onLogout={handleLogout}
          llmProvider={llmProvider}
          onToggleLLM={handleToggleLLM}
          isMuted={isMuted}
          onToggleSound={handleToggleSound}
        />

        {/* Quick Enrollment Modal */}
        <EnrollmentModal
          visible={showEnrollModal}
          initialType={enrollType}
          onClose={() => setShowEnrollModal(false)}
          onEnrollSuccess={(res) => {
            Alert.alert('Memory Indexed', `Successfully enrolled ${res?.name || 'entry'} into memory core.`);
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111318',
  },
  mainStage: {
    flex: 1,
    backgroundColor: '#111318',
  },
  bottomNav: {
    height: 48,
    flexDirection: 'row',
    backgroundColor: '#16181f',
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    borderRadius: 6,
  },
  navTabActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  tabIconWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  tabIconWrapActive: {
    backgroundColor: Colors.amberMuted,
  },
  navTabText: {
    color: Colors.textMuted,
    fontSize: 8,
    fontWeight: '700',
    marginTop: 1,
  },
  navTabTextActive: {
    color: Colors.amber,
    fontWeight: '800',
  },
});
