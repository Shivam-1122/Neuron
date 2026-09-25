import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../theme/colors';
import { Camera, Image as ImageIcon, X, RefreshCw, Crosshair, Package } from 'lucide-react-native';

export default function CameraScanner({ mode = 'person', onCapture, onClose }) {
  const [facing, setFacing] = useState('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef(null);

  // Take photo from live camera with automatic native camera fallback
  const handleSnap = async () => {
    if (isCapturing) return;
    setIsCapturing(true);

    try {
      if (cameraRef.current && isCameraReady) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.6,
          base64: true,
          shutterSound: false,
          skipProcessing: true,
        });
        if (photo && (photo.uri || photo.base64)) {
          onCapture(photo.uri, photo.base64);
          setIsCapturing(false);
          return;
        }
      }
      // If live camera is not ready or returned empty, launch native camera
      await handleLaunchNativeCamera();
    } catch (err) {
      console.warn('Live camera snap error, falling back to native camera:', err);
      try {
        await handleLaunchNativeCamera();
      } catch (fallbackErr) {
        console.warn('Fallback camera error:', fallbackErr);
        Alert.alert(
          'Camera Notice',
          'Could not acquire live frame. You can choose a photo from your gallery.',
          [
            { text: 'Open Gallery', onPress: handlePickImage },
            { text: 'OK', style: 'cancel' },
          ]
        );
      }
    } finally {
      setIsCapturing(false);
    }
  };

  // Launch device native hardware camera app (works on 100% of Android devices)
  const handleLaunchNativeCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];
      onCapture(asset.uri, asset.base64);
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
    setIsCameraReady(false);
    setFacing((prev) => (prev === 'front' ? 'back' : 'front'));
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={Colors.cyan} size="small" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Crosshair color={Colors.cyan} size={28} style={{ marginBottom: 8 }} />
        <Text style={styles.permissionTitle}>OPTICAL ACCESS REQUIRED</Text>
        <Text style={styles.permissionDesc}>
          Neuron needs camera permission to scan faces and track objects in real time.
        </Text>
        <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
          <Text style={styles.grantBtnText}>AUTHORIZE SENSORS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.galleryBtn} onPress={handlePickImage}>
          <ImageIcon color={Colors.cyan} size={13} />
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
          {isPerson ? <Crosshair color={Colors.cyan} size={12} /> : <Package color={Colors.amber} size={12} />}
          <Text style={[styles.modeText, { color: isPerson ? Colors.cyan : Colors.amber }]}>
            {isPerson ? 'AI OPTICAL SCAN' : 'OBJECT TELEMETRY SCAN'}
          </Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <X color="#fff" size={15} />
        </TouchableOpacity>
      </View>

      {/* Live Camera Viewport */}
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={cameraRef}
        mode="picture"
        animateShutter={false}
        onCameraReady={() => setIsCameraReady(true)}
      >
        {/* Square Target Crosshair Overlay (Identical to Web App CameraView) */}
        <View style={styles.reticleContainer}>
          <View style={[styles.squareCrosshair, isPerson ? styles.personCrosshair : styles.objectCrosshair]}>
            <Crosshair size={26} color={isPerson ? 'rgba(6, 182, 212, 0.6)' : 'rgba(245, 158, 11, 0.6)'} />
            <View style={styles.crosshairPill}>
              <Text style={styles.crosshairPillText}>
                {isCameraReady ? (isPerson ? 'AI OPTICAL SCAN' : 'OBJECT FOCUS') : 'CALIBRATING SENSORS...'}
              </Text>
            </View>
          </View>
        </View>
      </CameraView>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handlePickImage} activeOpacity={0.7}>
          <ImageIcon color="#fff" size={15} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={handleLaunchNativeCamera} activeOpacity={0.7}>
          <Camera color={Colors.cyan} size={15} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.captureBtn, isCapturing && styles.capturingBtn]}
          onPress={handleSnap}
          disabled={isCapturing}
          activeOpacity={0.8}
        >
          {isCapturing ? (
            <ActivityIndicator color="#060a12" size="small" />
          ) : (
            <View style={styles.innerCaptureDot} />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={toggleFacing} activeOpacity={0.7}>
          <RefreshCw color="#fff" size={15} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 320,
    backgroundColor: '#000',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
    marginHorizontal: 12,
    marginVertical: 10,
  },
  centerContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  permissionContainer: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    margin: 14,
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
  },
  permissionTitle: {
    color: Colors.cyan,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  permissionDesc: {
    color: Colors.textSecondary,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 15,
    marginBottom: 16,
  },
  grantBtn: {
    backgroundColor: Colors.cyan,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  grantBtnText: {
    color: '#060a12',
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '100%',
    marginBottom: 8,
  },
  galleryBtnText: {
    color: Colors.cyan,
    fontWeight: '700',
    fontSize: 10,
  },
  cancelBtn: {
    paddingVertical: 6,
  },
  cancelBtnText: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  topBar: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(6, 10, 18, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
  },
  modeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'rgba(6, 10, 18, 0.85)',
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
  squareCrosshair: {
    width: 140,
    height: 140,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  personCrosshair: {
    borderColor: 'rgba(6, 182, 212, 0.5)',
    backgroundColor: 'rgba(6, 182, 212, 0.04)',
  },
  objectCrosshair: {
    borderColor: 'rgba(245, 158, 11, 0.5)',
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
  },
  crosshairPill: {
    position: 'absolute',
    top: -10,
    backgroundColor: 'rgba(6, 18, 30, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
  },
  crosshairPillText: {
    color: Colors.cyan,
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 20,
  },
  captureBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  capturingBtn: {
    opacity: 0.6,
  },
  innerCaptureDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
  },
  secondaryBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(6, 10, 18, 0.8)',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
