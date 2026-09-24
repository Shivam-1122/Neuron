import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from '../theme/colors';
import { ArrowLeft, RotateCcw, Volume2, Sparkles } from 'lucide-react-native';

const GAME_SUITE_URL = 'https://neuron-a940a.web.app/game/index.html?embedded=true';

export default function MemoryGamesScreen({ onBack }) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const webViewRef = useRef(null);

  const handleReload = () => {
    setLoadError(false);
    setIsLoading(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Sanctuary Control Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={18} color={Colors.amber} />
          <Text style={styles.backButtonText}>Assistant</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>MEMORY GYM</Text>
          <Text style={styles.headerSubtitle}>Cognitive Sanctuary Suite</Text>
        </View>

        <TouchableOpacity style={styles.reloadButton} onPress={handleReload} activeOpacity={0.7}>
          <RotateCcw size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Embedded Web Game Suite with 100% Identical Visuals and Sound */}
      <View style={styles.webContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: GAME_SUITE_URL }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          originWhitelist={['*']}
          mixedContentMode="always"
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setLoadError(true);
          }}
        />

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.amber} />
            <Text style={styles.loadingText}>Initializing Memory Gym & Audio Chimes...</Text>
          </View>
        )}

        {loadError && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorTitle}>Sanctuary Connection Note</Text>
            <Text style={styles.errorDesc}>
              Connecting to live game matrix at neuron-a940a.web.app
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleReload}>
              <Text style={styles.retryButtonText}>RECONNECT</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111318',
  },
  header: {
    height: 52,
    backgroundColor: '#16181f',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    zIndex: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: Colors.amberMuted,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
  },
  backButtonText: {
    color: Colors.amber,
    fontSize: 12,
    fontWeight: '700',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: Colors.amber,
    fontSize: 9,
    fontWeight: '600',
  },
  reloadButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  webContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#111318',
  },
  webView: {
    flex: 1,
    backgroundColor: '#111318',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111318',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.amber,
    fontSize: 12,
    fontWeight: '600',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111318',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  errorDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.amber,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#111318',
    fontWeight: '800',
    fontSize: 12,
  },
});
