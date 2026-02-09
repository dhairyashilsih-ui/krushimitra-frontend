import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
  Platform,
  Alert,
  Image,
  Dimensions,
  Easing,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Upload,
  Camera,
  Leaf,
  CheckCircle,
  Zap,
  Shield,
  Sparkles,
  Scan,
  Bug,
  Check
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

// --- Types ---
interface PlantIdentification {
  success: boolean;
  plant_scientific: string;
  plant_common: string;
  confidence: number;
  source: string;
}

interface DiseaseDetection {
  success: boolean;
  disease: string;
  confidence: number;
  details: string;
  severity?: string;
  advice?: string;
}

interface AISolution {
  treatment: string;
  prevention: string[];
  tips: string[];
}

interface AnalysisResult {
  success: boolean;
  plant_identification: PlantIdentification;
  disease_detection: DiseaseDetection;
  ai_solution?: AISolution;
  message?: string;
  crop?: string;
}

const ANALYSIS_STEPS = [
  { id: 1, label: 'Identifying Crop (PlantNet)', icon: Leaf },
  { id: 2, label: 'Scanning Leaves (YOLOvm)', icon: Scan },
  { id: 3, label: 'Analyzing Disease (MobileNet)', icon: Bug },
  { id: 4, label: 'Consulting AI Expert (LLM)', icon: Sparkles },
];

export default function CropDiseaseDetectionScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  // State
  const [isScanning, setIsScanning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Animation refs
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.95)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  // New: Scanner Animation (0 -> 1 loop)
  const scannerAnim = useRef(new Animated.Value(0)).current;

  // New: Result Stagger Animation
  const resultCardAnim = useRef(new Animated.Value(0)).current;
  const analysisDetailsAnim = useRef(new Animated.Value(0)).current;
  const treatmentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Intro Animation
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse effect for placeholder
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Scanner Loop
  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scannerAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(scannerAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      scannerAnim.setValue(0);
    }
  }, [isScanning]);

  // Simulate Steps Progression
  useEffect(() => {
    if (isScanning) {
      setCurrentStep(1);
      const step1 = setTimeout(() => setCurrentStep(2), 1500);
      const step2 = setTimeout(() => setCurrentStep(3), 3000);
      const step3 = setTimeout(() => setCurrentStep(4), 4500);

      return () => {
        clearTimeout(step1);
        clearTimeout(step2);
        clearTimeout(step3);
      };
    } else {
      // Results Reveal Sequence
      if (analysisResult) {
        setCurrentStep(5); // Done

        // Staggered Entrance
        Animated.stagger(200, [
          Animated.spring(resultCardAnim, { toValue: 1, useNativeDriver: true, friction: 8 }),
          Animated.spring(analysisDetailsAnim, { toValue: 1, useNativeDriver: true, friction: 8 }),
          Animated.spring(treatmentAnim, { toValue: 1, useNativeDriver: true, friction: 8 }),
        ]).start();

      } else {
        setCurrentStep(0);
        resultCardAnim.setValue(0);
        analysisDetailsAnim.setValue(0);
        treatmentAnim.setValue(0);
      }
    }
  }, [isScanning, analysisResult]);

  const handleBack = () => {
    router.back();
  };

  const uploadImageToBackend = async (uri: string) => {
    try {
      setIsScanning(true);
      setAnalysisResult(null);
      // Reset animations
      resultCardAnim.setValue(0);
      analysisDetailsAnim.setValue(0);
      treatmentAnim.setValue(0);

      const apiUrl =
        process.env.EXPO_PUBLIC_BACKEND_URL ||
        'https://krushimitra2-0-backend.onrender.com';

      const formData = new FormData();
      // @ts-ignore
      formData.append('file', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        name: 'photo.jpg',
        type: 'image/jpeg',
      });
      formData.append('organ', 'leaf');

      const res = await fetch(`${apiUrl}/predict`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      console.log('Analysis Result:', data);

      setTimeout(() => {
        if (data.success) {
          setAnalysisResult(data);
        } else {
          Alert.alert('Analysis Failed', data.message || 'Could not analyze image.');
        }
        setIsScanning(false);
      }, 500);

    } catch (err) {
      console.error('Upload Error:', err);
      Alert.alert('Error', 'Failed to connect to the server.');
      setIsScanning(false);
    }
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      let result;
      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Camera access is needed.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3], // User requested 4:3
          quality: 0.8,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Gallery access is needed.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3], // User requested 4:3
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setSelectedImage(uri);
        uploadImageToBackend(uri);
      }
    } catch (error) {
      console.error("Image Picker Error:", error);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const hasDisease = analysisResult?.disease_detection.disease !== 'Healthy';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#FFFFFF', '#F0F7F7', '#E0F2F1']}
        style={styles.backgroundGradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <View style={styles.backIconCircle}>
              <ArrowLeft size={20} color="#1B5E20" />
            </View>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Crop Doctor</Text>
            <Text style={styles.headerSubtitle}>AI-Powered Diagnostic</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Main Image Card */}
          <Animated.View style={[styles.mainCard, { opacity: fadeAnimation, transform: [{ scale: scaleAnimation }] }]}>
            <View style={styles.imageContainer}>
              {selectedImage ? (
                <>
                  <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="cover" />

                  {/* SCANNER OVERLAY */}
                  {isScanning && (
                    <View style={styles.overlayContainer}>
                      {/* Grid Background */}
                      <View style={styles.gridOverlay} />

                      {/* Moving Laser */}
                      <Animated.View style={[
                        styles.laserLine,
                        {
                          transform: [{
                            translateY: scannerAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 320] // Height of image container
                            })
                          }]
                        }
                      ]} />

                      {/* Steps */}
                      <View style={styles.stepsWrapper}>
                        <BlurView intensity={40} tint="dark" style={styles.stepsBlur} />
                        <View style={styles.stepsContainer}>
                          {ANALYSIS_STEPS.map((step) => {
                            const isActive = currentStep === step.id;
                            const isCompleted = currentStep > step.id;
                            const isPending = currentStep < step.id;

                            return (
                              <View key={step.id} style={[styles.stepRow, { opacity: isPending ? 0.4 : 1 }]}>
                                <View style={[styles.stepIcon,
                                isActive && styles.stepIconActive,
                                isCompleted && styles.stepIconCompleted
                                ]}>
                                  {isCompleted ? (
                                    <Check size={12} color="#FFF" />
                                  ) : (
                                    <step.icon size={12} color={isActive ? "#FFF" : "#CCC"} />
                                  )}
                                </View>
                                <Text style={[styles.stepText, isActive && styles.stepTextActive]}>
                                  {step.label}
                                </Text>
                                {isActive && <ActivityIndicator size="small" color="#4CAF50" style={{ marginLeft: 'auto' }} />}
                              </View>
                            )
                          })}
                        </View>
                      </View>
                    </View>
                  )}
                </>
              ) : (
                <Animated.View style={[styles.placeholderContent, { transform: [{ scale: pulseAnimation }] }]}>
                  <View style={styles.scanIconCircle}>
                    <Scan size={40} color="#4CAF50" />
                  </View>
                  <Text style={styles.placeholderTitle}>Start Diagnosis</Text>
                  <Text style={styles.placeholderSubtitle}>Upload a clear photo of the leaf</Text>
                </Animated.View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsBar}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.galleryBtn, isScanning && styles.disabledBtn]}
                onPress={() => pickImage(false)}
                disabled={isScanning}
              >
                <Upload size={20} color="#1B5E20" />
                <Text style={styles.galleryBtnText}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.cameraBtn, isScanning && styles.disabledBtn]}
                onPress={() => pickImage(true)}
                disabled={isScanning}
              >
                <Camera size={20} color="#FFF" />
                <Text style={styles.cameraBtnText}>Take Photo</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Results Section - SEQUENTIAL REVEAL */}
          {analysisResult && (
            <View style={styles.resultsSection}>

              {/* 1. STATUS HEADER */}
              <Animated.View style={{ opacity: resultCardAnim, transform: [{ translateY: resultCardAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
                <LinearGradient
                  colors={hasDisease ? ['#FEF2F2', '#FFF5F5'] : ['#F1F8E9', '#F0FDF4']}
                  style={[styles.statusCard, hasDisease ? styles.statusDanger : styles.statusSuccess]}
                >
                  <View style={styles.statusIconContainer}>
                    {hasDisease ? <Bug size={24} color="#EF4444" /> : <Shield size={24} color="#4CAF50" />}
                  </View>
                  <View style={styles.statusTextContainer}>
                    <Text style={styles.statusTitle}>
                      {analysisResult.disease_detection.disease}
                    </Text>
                    <Text style={styles.statusSubtitle}>
                      {analysisResult.plant_identification.plant_common} • {(analysisResult.disease_detection.confidence * 100).toFixed(0)}% Confidence
                    </Text>
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* 2. DIAGNOSIS DETAILS */}
              <Animated.View style={{ opacity: analysisDetailsAnim, transform: [{ translateY: analysisDetailsAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
                <View style={[styles.detailsCard, { borderLeftColor: hasDisease ? '#EF4444' : '#4CAF50', borderLeftWidth: 4 }]}>
                  <View style={styles.detailRow}>
                    <Text style={styles.sectionHeader}>Diagnosis Report</Text>
                    <View style={styles.aiTag}>
                      <Sparkles size={12} color="#F59E0B" />
                      <Text style={styles.aiTagText}>AI Analysis</Text>
                    </View>
                  </View>
                  <Text style={styles.adviceText}>{analysisResult.ai_solution?.treatment || analysisResult.disease_detection.details}</Text>
                </View>
              </Animated.View>

              {/* 3. TREATMENT & PREVENTION */}
              {analysisResult.ai_solution && (
                <Animated.View style={{ opacity: treatmentAnim, transform: [{ translateY: treatmentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
                  <View style={styles.detailsCard}>
                    <Text style={[styles.sectionHeader, { marginBottom: 15 }]}>Recommended Action</Text>

                    {analysisResult.ai_solution.prevention.map((tip, idx) => (
                      <View key={idx} style={styles.checkListItem}>
                        <CheckCircle size={16} color="#4CAF50" style={{ marginTop: 2 }} />
                        <Text style={styles.listText}>{tip}</Text>
                      </View>
                    ))}

                    <View style={styles.tipsBox}>
                      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
                        <Zap size={14} color="#1D4ED8" />
                        <Text style={styles.tipsBoxTitle}>Pro Tip</Text>
                      </View>
                      <Text style={styles.tipsBoxText}>
                        {analysisResult.ai_solution.tips[0] || "Regular monitoring is key to healthy crops."}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              )}

            </View>
          )}

        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  backgroundGradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: Platform.OS === 'android' ? 45 : 15,
  },
  backButton: {
    marginRight: 15,
  },
  backIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1B5E20',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
    opacity: 0.8,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  mainCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  imageContainer: {
    height: 340,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  laserLine: {
    width: '100%',
    height: 3,
    backgroundColor: '#4CAF50',
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 20,
  },
  stepsWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  stepsBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  stepsContainer: {
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepIconActive: {
    backgroundColor: '#4CAF50',
    shadowColor: "#4CAF50",
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  stepIconCompleted: {
    backgroundColor: '#4CAF50',
  },
  stepText: {
    color: '#EEE',
    fontSize: 13,
    fontWeight: '500',
  },
  stepTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  placeholderContent: {
    alignItems: 'center',
  },
  scanIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F1F8E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B5E20',
    marginBottom: 6,
  },
  placeholderSubtitle: {
    fontSize: 14,
    color: '#66BB6A',
    fontWeight: '500',
  },
  actionsBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    backgroundColor: '#FFF',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  galleryBtn: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  galleryBtnText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 15,
  },
  cameraBtn: {
    backgroundColor: '#1B5E20',
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cameraBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  resultsSection: {
    gap: 16,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusSuccess: {
    borderColor: '#C8E6C9',
  },
  statusDanger: {
    borderColor: '#FECACA',
  },
  statusIconContainer: {
    marginRight: 16,
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  detailsCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFEB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 5,
  },
  aiTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  adviceText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
  },
  checkListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    fontWeight: '500',
  },
  tipsBox: {
    marginTop: 8,
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tipsBoxTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E40AF',
  },
  tipsBoxText: {
    fontSize: 13,
    color: '#1E3A8A',
    lineHeight: 18,
  },
});