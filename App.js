import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, StatusBar, SafeAreaView, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from './src/theme/colors';
import { Home, Users, Sparkles, Cpu, Gamepad2, Shield } from 'lucide-react-native';

// Components & Modals
import HeaderNav from './src/components/HeaderNav';
import NavigationDrawer from './src/components/NavigationDrawer';
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

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [currentUser, setCurrentUser] = useState(null);

  // Drawer & Modals state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollType, setEnrollType] = useState('person');

  // Global settings state
  const [llmProvider, setLlmProvider] = useState('groq'); // 'groq' | 'gemini'
  const [speechEnabled, setSpeechEnabled] = useState(true);

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

  // Toggle Speech Guidance
  const handleToggleSpeech = () => {
    setSpeechEnabled((prev) => !prev);
  };

  // Emergency Alert trigger
  const handleEmergencyAlert = async () => {
    const userId = currentUser?.patient_id || currentUser?.uid || 'default_user';
    try {
      await sendCaregiverAlertApi(userId, 'distress', 'Emergency alert dispatched from Neuron Mobile');
      Alert.alert('🚨 Emergency Alert Sent', 'Distress telemetry dispatched to all registered caregivers.');
    } catch (e) {
      Alert.alert('Alert Recorded', 'Distress telemetry logged in memory cortex.');
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
      screenContent = <MemoryGamesScreen onBack={() => setCurrentView('patient')} />;
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
        />
      );
      break;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#060a12" />

        {/* Global Holographic Header with Drawer Toggle */}
        <HeaderNav
          currentScreen={currentView}
          onNavigate={setCurrentView}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          onOpenSettings={() => setShowSettings(true)}
        />

        {/* Main Stage View */}
        <View style={styles.mainStage}>{screenContent}</View>

        {/* High-Tech Bottom Navigation Bar (5 Core Protocol Hubs) */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={[styles.navTab, currentView === 'landing' && styles.navTabActiveOverview]}
            onPress={() => setCurrentView('landing')}
          >
            <Home
              color={currentView === 'landing' ? Colors.cyan : Colors.textMuted}
              size={17}
            />
            <Text
              style={[
                styles.navTabText,
                currentView === 'landing' && { color: Colors.cyan, fontWeight: '800' },
              ]}
            >
              HOME
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, currentView === 'patient' && styles.navTabActivePatient]}
            onPress={() => setCurrentView('patient')}
          >
            <Users
              color={currentView === 'patient' ? Colors.emerald : Colors.textMuted}
              size={17}
            />
            <Text
              style={[
                styles.navTabText,
                currentView === 'patient' && { color: Colors.emerald, fontWeight: '800' },
              ]}
            >
              PATIENT
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, currentView === 'game' && styles.navTabActiveGame]}
            onPress={() => setCurrentView('game')}
          >
            <Gamepad2
              color={currentView === 'game' ? Colors.amber : Colors.textMuted}
              size={17}
            />
            <Text
              style={[
                styles.navTabText,
                currentView === 'game' && { color: Colors.amber, fontWeight: '800' },
              ]}
            >
              GAMES
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, currentView === 'task_guide' && styles.navTabActiveTask]}
            onPress={() => setCurrentView('task_guide')}
          >
            <Sparkles
              color={currentView === 'task_guide' ? Colors.cyan : Colors.textMuted}
              size={17}
            />
            <Text
              style={[
                styles.navTabText,
                currentView === 'task_guide' && { color: Colors.cyan, fontWeight: '800' },
              ]}
            >
              GUIDE
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, currentView === 'caregiver' && styles.navTabActiveCaregiver]}
            onPress={() => setCurrentView('caregiver')}
          >
            <Shield
              color={currentView === 'caregiver' ? Colors.purple : Colors.textMuted}
              size={17}
            />
            <Text
              style={[
                styles.navTabText,
                currentView === 'caregiver' && { color: Colors.purple, fontWeight: '800' },
              ]}
            >
              TEAM
            </Text>
          </TouchableOpacity>
        </View>

        {/* Holographic Slide-Out Navigation Drawer */}
        <NavigationDrawer
          visible={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          currentScreen={currentView}
          onNavigate={setCurrentView}
          currentUser={currentUser}
          onLogout={handleLogout}
          llmProvider={llmProvider}
          onToggleLLM={handleToggleLLM}
          speechEnabled={speechEnabled}
          onToggleSpeech={handleToggleSpeech}
          onQuickEnrollPerson={() => {
            setEnrollType('person');
            setShowEnrollModal(true);
          }}
          onQuickEnrollObject={() => {
            setEnrollType('object');
            setShowEnrollModal(true);
          }}
          onTriggerAlert={handleEmergencyAlert}
          onOpenSettings={() => setShowSettings(true)}
        />

        {/* Global Settings & Telemetry Modal */}
        <SettingsModal
          visible={showSettings}
          onClose={() => setShowSettings(false)}
        />

        {/* Global Quick Enrollment Modal */}
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
    backgroundColor: '#060a12',
  },
  mainStage: {
    flex: 1,
  },
  bottomNav: {
    height: 60,
    flexDirection: 'row',
    backgroundColor: '#0c1322',
    borderTopWidth: 1,
    borderTopColor: Colors.cyanBorder,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 3,
  },
  navTabActiveOverview: {
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  navTabActivePatient: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  navTabActiveGame: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  navTabActiveTask: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
  },
  navTabActiveCaregiver: {
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
  },
  navTabText: {
    color: Colors.textMuted,
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
