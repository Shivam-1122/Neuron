import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, StatusBar, SafeAreaView, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from './src/theme/colors';
import { Users, Sparkles, Cpu, Gamepad2 } from 'lucide-react-native';

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

import { setLLMProviderApi, sendCaregiverAlertApi } from './src/api/client';
import sound from './src/utils/soundEngine';

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [currentUser, setCurrentUser] = useState(null);

  // Sound Mute State
  const [isMuted, setIsMuted] = useState(false);

  // Modals state
  const [showSettings, setShowSettings] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollType, setEnrollType] = useState('person');

  // Global settings state
  const [llmProvider, setLlmProvider] = useState('groq'); // 'groq' | 'gemini'
  const [speechEnabled, setSpeechEnabled] = useState(true);

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

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
  };

  // Screen routing
  let screenContent;
  switch (currentView) {
    case 'landing':
      screenContent = (
        <LandingScreen
          onGetStarted={() => setCurrentView(currentUser ? 'patient' : 'login')}
          onPlayGame={() => setCurrentView('game')}
        />
      );
      break;
    case 'login':
      screenContent = (
        <LoginScreen
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            if (user?.role === 'caregiver') {
              setCurrentView('caregiver');
            } else {
              setCurrentView('patient');
            }
          }}
          onSelectRole={(role) => {
            if (role === 'caregiver') setCurrentView('caregiver');
            else setCurrentView('patient');
          }}
        />
      );
      break;
    case 'game':
      screenContent = <MemoryGamesScreen onBack={() => setCurrentView(currentUser ? 'patient' : 'landing')} />;
      break;
    case 'task_guide':
      screenContent = <TaskGuideScreen onBack={() => setCurrentView('patient')} />;
      break;
    case 'caregiver':
      screenContent = (
        <CaregiverScreen
          onBack={() => setCurrentView('patient')}
          currentUser={currentUser}
        />
      );
      break;
    case 'patient':
    default:
      screenContent = (
        <PatientCortexScreen
          onNavigate={setCurrentView}
          currentUser={currentUser}
          llmProvider={llmProvider}
          onToggleLLM={handleToggleLLM}
          onPlayGame={() => setCurrentView('game')}
          onOpenEnrollment={(type) => {
            setEnrollType(type || 'person');
            setShowEnrollModal(true);
          }}
        />
      );
      break;
  }

  // Primary 4 tabs matching Web Application SideNav.jsx
  const navTabs = [
    { id: 'patient', label: 'Assistant', icon: Users },
    { id: 'game', label: 'Memory Gym', icon: Gamepad2 },
    { id: 'task_guide', label: 'Task Coach', icon: Sparkles },
    { id: 'caregiver', label: 'Caregiver', icon: Cpu },
  ];

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#111318" />

        {/* Global Warm Amber Header matching Web SideNav */}
        <HeaderNav
          currentScreen={currentView}
          onNavigate={setCurrentView}
          currentUser={currentUser}
          onOpenSettings={() => setShowSettings(true)}
          isMuted={isMuted}
          onToggleSound={handleToggleSound}
        />

        {/* Main Content Area */}
        <View style={styles.mainStage}>{screenContent}</View>

        {/* 4 Core Navigation Tabs matching Web App */}
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
                  if (tab.id === 'patient' && !currentUser && currentView !== 'patient') {
                    // Let user visit assistant or login
                    setCurrentView('patient');
                  } else {
                    setCurrentView(tab.id);
                  }
                }}
              >
                <View style={[styles.tabIconWrap, isActive && styles.tabIconWrapActive]}>
                  <IconComp
                    color={isActive ? Colors.amber : Colors.textMuted}
                    size={17}
                  />
                </View>
                <Text style={[styles.navTabText, isActive && styles.navTabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Settings Modal */}
        <SettingsModal
          visible={showSettings}
          onClose={() => setShowSettings(false)}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* Quick Enrollment Modal */}
        <EnrollmentModal
          visible={showEnrollModal}
          initialType={enrollType}
          onClose={() => setShowEnrollModal(false)}
          onEnrollSuccess={(res) => {
            Alert.alert('Memory Indexed', `Successfully enrolled ${res.name} into memory core.`);
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
    height: 62,
    flexDirection: 'row',
    backgroundColor: '#16181f',
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    borderRadius: 10,
  },
  navTabActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  tabIconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },
  tabIconWrapActive: {
    backgroundColor: Colors.amberMuted,
  },
  navTabText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  navTabTextActive: {
    color: Colors.amber,
    fontWeight: '700',
  },
});
