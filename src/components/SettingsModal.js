import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../theme/colors';
import { X, Check, RefreshCw, Server, Wifi } from 'lucide-react-native';
import { getApiBase, setApiBase, testApiConnection } from '../api/client';

export default function SettingsModal({ visible, onClose }) {
  const [url, setUrl] = useState(getApiBase());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleSave = () => {
    setApiBase(url);
    onClose();
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    setApiBase(url);
    const result = await testApiConnection();
    setTestResult(result);
    setIsTesting(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Server color={Colors.cyan} size={18} />
              <Text style={styles.title}>CORTEX TELEMETRY SETTINGS</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={Colors.textMuted} size={18} />
            </TouchableOpacity>
          </View>

          <Text style={styles.desc}>
            Configure backend FastAPI address. Physical devices should use your computer's Wi-Fi IP (e.g. http://192.168.1.10:8000/api/v1).
          </Text>

          {/* Input field */}
          <View style={styles.inputBox}>
            <Text style={styles.inputLabel}>API BASE URL</Text>
            <TextInput
              style={styles.input}
              value={url}
              onChangeText={setUrl}
              placeholder="http://192.168.x.x:8000/api/v1"
              placeholderTextColor={Colors.textDark}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Quick presets */}
          <View style={styles.presetsRow}>
            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => setUrl('http://10.0.2.2:8000/api/v1')}
            >
              <Text style={styles.presetText}>Android (10.0.2.2)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => setUrl('http://localhost:8000/api/v1')}
            >
              <Text style={styles.presetText}>Localhost (8000)</Text>
            </TouchableOpacity>
          </View>

          {/* Test Status Banner */}
          {testResult && (
            <View style={[styles.resultBanner, testResult.success ? styles.bannerSuccess : styles.bannerError]}>
              <Wifi color={testResult.success ? Colors.emerald : Colors.red} size={14} />
              <Text style={[styles.resultText, testResult.success ? styles.textSuccess : styles.textError]}>
                {testResult.message}
              </Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleTest}
              disabled={isTesting}
            >
              {isTesting ? (
                <ActivityIndicator color={Colors.cyan} size="small" />
              ) : (
                <>
                  <RefreshCw color={Colors.cyan} size={15} />
                  <Text style={styles.testBtnText}>TEST PING</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Check color="#fff" size={16} />
              <Text style={styles.saveBtnText}>SAVE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: Colors.cyan,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 4,
  },
  desc: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  inputBox: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: 12,
  },
  inputLabel: {
    color: Colors.cyan,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  input: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    padding: 0,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
  },
  presetText: {
    color: Colors.cyan,
    fontSize: 10,
    fontWeight: '700',
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  bannerSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: Colors.emeraldBorder,
  },
  bannerError: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: Colors.red,
  },
  resultText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textSuccess: {
    color: Colors.emerald,
  },
  textError: {
    color: Colors.red,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  testBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
    borderRadius: 12,
    paddingVertical: 12,
  },
  testBtnText: {
    color: Colors.cyan,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.cyan,
    borderRadius: 12,
    paddingVertical: 12,
  },
  saveBtnText: {
    color: '#060a12',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
