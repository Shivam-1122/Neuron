import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../theme/colors';
import { Camera, Image as ImageIcon, X, RefreshCw, Eye, Package } from 'lucide-react-native';

export default function CameraScanner({ mode = 'person', onCapture, onClose }) {
  const [facing, setFacing] = useState('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef(null);

  // Take photo from camera
  const handleSnap = async () => {
    if (!cameraRef.current || isCapturing) return;
    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });
      if (photo && photo.uri) {
        onCapture(photo.uri, photo.base64);
      }
    } catch (err) {
      console.warn('Camera snap error:', err);
      Alert.alert('Capture Failed', 'Could not acquire optical frame.');
    } finally {
      setIsCapturing(false);
    }
  };

  // Pick photo from gallery fallback
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        onCapture(asset.uri, asset.base64);
      }
    } catch (err) {
      console.warn('Pick image error:', err);
    }
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === 'front' ? 'back' : 'front'));
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={Colors.cyan} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Eye color={Colors.cyan} size={36} style={{ marginBottom: 12 }} />
        <Text style={styles.permissionTitle}>OPTICAL ACCESS REQUIRED</Text>
        <Text style={styles.permissionDesc}>
          Neuron needs camera permission to scan faces and track objects in real time.
        </Text>
        <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
          <Text style={styles.grantBtnText}>AUTHORIZE SENSORS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.galleryBtn} onPress={handlePickImage}>
          <ImageIcon color={Colors.cyan} size={16} />
          <Text style={styles.galleryBtnText}>CHOOSE FROM GALLERY</Text>
        </TouchableOpacity>
        {onClose && (
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>CANCEL</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const isPerson = mode === 'person';

  return (
    <View style={styles.container}>
      {/* Header HUD overlay */}
      <View style={styles.topBar}>
        <View style={styles.modeBadge}>
          {isPerson ? <Eye color={Colors.cyan} size={14} /> : <Package color={Colors.amber} size={14} />}
          <Text style={[styles.modeText, { color: isPerson ? Colors.cyan : Colors.amber }]}>
            {isPerson ? 'OPTICAL FACE SCANNER' : 'OBJECT TELEMETRY SCAN'}
          </Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <X color="#fff" size={18} />
        </TouchableOpacity>
      </View>

      {/* Live Camera Viewport */}
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        {/* Reticle HUD overlays */}
        <View style={styles.reticleContainer}>
          <View style={[styles.reticleBorder, isPerson ? styles.personReticle : styles.objectReticle]} />
          <Text style={styles.reticleLabel}>
            {isPerson ? 'ALIGN FACE IN FRAME' : 'CENTER OBJECT'}
          </Text>
        </View>
      </CameraView>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handlePickImage}>
          <ImageIcon color="#fff" size={20} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.captureBtn, isCapturing && styles.capturingBtn]}
          onPress={handleSnap}
          disabled={isCapturing}
        >
          {isCapturing ? (
            <ActivityIndicator color="#060a12" size="small" />
          ) : (
            <View style={styles.innerCaptureDot} />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={toggleFacing}>
          <RefreshCw color="#fff" size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 380,
    backgroundColor: '#000',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  centerContainer: {
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  permissionContainer: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    margin: 16,
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
  },
  permissionTitle: {
    color: Colors.cyan,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  permissionDesc: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  grantBtn: {
    backgroundColor: Colors.cyan,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  grantBtnText: {
    color: '#060a12',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    marginBottom: 10,
  },
  galleryBtnText: {
    color: Colors.cyan,
    fontWeight: '700',
    fontSize: 12,
  },
  cancelBtn: {
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  topBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(6, 10, 18, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
  },
  modeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(6, 10, 18, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  camera: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleBorder: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginBottom: 10,
  },
  personReticle: {
    borderColor: Colors.cyan,
  },
  objectReticle: {
    borderColor: Colors.amber,
  },
  reticleLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 30,
    zIndex: 20,
  },
  captureBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#ffffff55',
  },
  capturingBtn: {
    opacity: 0.6,
  },
  innerCaptureDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
  },
  secondaryBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(6, 10, 18, 0.75)',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
