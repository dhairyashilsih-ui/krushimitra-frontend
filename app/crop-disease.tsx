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
  StatusBar,
  Vibration
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
  Search,
  BrainCircuit,
  Microscope,
  Check,
  Activity
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
  error?: string;
  crop?: string;
}

const ANALYSIS_STEPS = [
  { id: 1, label: 'Identifying Crop (PlantNet)', icon: Leaf },
  { id: 2, label: 'Scanning Leaves (YOLOvm)', icon: Scan },
  { id: 3, label: 'Analyzing Disease (MobileNet)', icon: Microscope },
  { id: 4, label: 'Consulting AI Expert (LLM)', icon: BrainCircuit },
];

export default function CropDiseaseDetectionScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  // State
  const [isScanning, setIsScanning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0 = idle, 1..4 = steps, 5 = done
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Animation refs
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.95)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  // New: Holographic Scanner
  const scannerAnimation = useRef(new Animated.Value(0)).current;

  // Results Animations (Sequential Reveal)
  const resultHeaderAnim = useRef(new Animated.Value(0)).current;
  const resultDetailsAnim = useRef(new Animated.Value(0)).current;
  const resultActionAnim = useRef(new Animated.Value(0)).current;

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

  // Holographic Scanner Loop
  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scannerAnimation, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true
          }),
          Animated.timing(scannerAnimation, {
            toValue: 0,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      scannerAnimation.setValue(0);
    }
  }, [isScanning]);


  // Simulate Steps Progression & Reveal Results
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
      // Reset or Finish
      if (analysisResult) {
        setCurrentStep(5); // Done

        // Sequential Reveal
        Animated.stagger(200, [
          Animated.timing(resultHeaderAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic)
          }),
          Animated.timing(resultDetailsAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic)
          }),
          Animated.timing(resultActionAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic)
          })
        ]).start();

      } else {
        setCurrentStep(0);
        resultHeaderAnim.setValue(0);
        resultDetailsAnim.setValue(0);
        resultActionAnim.setValue(0);
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
      resultHeaderAnim.setValue(0);
      resultDetailsAnim.setValue(0);
      resultActionAnim.setValue(0);

      const apiUrl =
        process.env.EXPO_PUBLIC_BACKEND_URL ||
        'https://krushimitra2-0-backend.onrender.com';

      const formData = new FormData();

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('file', blob, 'photo.jpg');
      } else {
        formData.append('file', {
          uri: uri,
          name: 'photo.jpg',
          type: 'image/jpeg',
        } as any);
      }

      formData.append('organ', 'leaf');

      const res = await fetch(`${apiUrl}/predict`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      console.log('Analysis Result:', data);

      // Ensure animation has reached at least step 4 before showing result
      setTimeout(() => {
        setAnalysisResult(data);
        if (data.success) {
          Vibration.vibrate(100); // Haptic feedback on success
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
          aspect: [1, 1], // Square aspect for better model input
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
          aspect: [1, 1],
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

  const hasDisease = analysisResult?.disease_detection?.disease !== 'Healthy';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#FFFFFF', '#F1F8E9', '#E0F2F1']}
        locations={[0, 0.5, 1]}
        style={styles.backgroundGradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <BlurView intensity={20} tint="light" style={styles.backIconCircle}>
              <ArrowLeft size={22} color="#1B5E20" />
            </BlurView>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Crop Doctor AI</Text>
            <Text style={styles.headerSubtitle}>Pro Diagnosis System</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Main Image Card with Holographic Scanner */}
          <Animated.View style={[styles.mainCard, { opacity: fadeAnimation, transform: [{ scale: scaleAnimation }] }]}>
            <View style={styles.imageContainer}>
              {selectedImage ? (
                <>
                  <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="cover" />

                  {/* Holographic Scanner Overlay */}
                  {isScanning && (
                    <Animated.View
                      style={[
                        styles.scannerLine,
                        {
                          transform: [{
                            translateY: scannerAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 320] // Height of image container
                            })
                          }]
                        }
                      ]}
                    >
                      <LinearGradient
                        colors={['rgba(76, 175, 80, 0)', 'rgba(76, 175, 80, 0.8)', 'rgba(76, 175, 80, 0)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ flex: 1 }}
                      />
                    </Animated.View>
                  )}

                  {/* Analysis Steps Overlay (Glassmorphism) */}
                  {isScanning && (
                    <View style={styles.overlayContainer}>
                      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
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
                                  <Check size={14} color="#FFF" />
                                ) : (
                                  <step.icon size={14} color={isActive ? "#FFF" : "#CCC"} />
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
                  )}
                </>
              ) : (
                <Animated.View style={[styles.placeholderContent, { transform: [{ scale: pulseAnimation }] }]}>
                  <View style={styles.scanIconCircle}>
                    <Scan size={44} color="#2E7D32" />
                  </View>
                  <Text style={styles.placeholderTitle}>Start Diagnosis</Text>
                  <Text style={styles.placeholderSubtitle}>Upload a clear leaf photo</Text>
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
                <LinearGradient
                  colors={['#43A047', '#2E7D32']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Camera size={20} color="#FFF" />
                <Text style={styles.cameraBtnText}>Take Photo</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Results Section (Sequential Reveal) */}
          {analysisResult && (
            <View style={styles.resultsSection}>
              {!analysisResult.success ? (
                /* ERROR CARD */
                <Animated.View style={{ opacity: resultHeaderAnim, transform: [{ translateY: resultHeaderAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
                  <LinearGradient
                    colors={['#FEF2F2', '#FEE2E2']}
                    style={[styles.statusCard, styles.statusDanger]}
                  >
                    <View style={styles.statusIconContainer}>
                      <Bug size={32} color="#EF4444" />
                    </View>
                    <View style={styles.statusTextContainer}>
                      <Text style={styles.statusTitle}>Analysis Failed</Text>
                      <Text style={[styles.statusSubtitle, { color: '#B91C1C', marginTop: 4, textTransform: 'none', fontSize: 14 }]}>
                        {analysisResult.message || 'We could not detect a valid crop leaf in this image. Please try another photo.'}
                      </Text>
                    </View>
                  </LinearGradient>
                </Animated.View>
              ) : (
                /* SUCCESS BLOCKS */
                <>
                  {/* 1. STATUS HEADER */}
                  <Animated.View style={{ opacity: resultHeaderAnim, transform: [{ translateY: resultHeaderAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
                    <LinearGradient
                      colors={hasDisease ? ['#FEF2F2', '#FEE2E2'] : ['#F1F8E9', '#DCFCE7']}
                      style={[styles.statusCard, hasDisease ? styles.statusDanger : styles.statusSuccess]}
                    >
                      <View style={styles.statusIconContainer}>
                        {hasDisease ? <Bug size={24} color="#EF4444" /> : <Sparkles size={24} color="#4CAF50" />}
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

                  {/* 2. DETAILS & AI SOLUTION */}
                  <Animated.View style={{ opacity: resultDetailsAnim, transform: [{ translateY: resultDetailsAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
                    <View style={styles.detailsCard}>
                      <View style={[styles.detailRow, { borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 12 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Activity size={18} color="#3B82F6" />
                          <Text style={styles.sectionHeader}>Diagnosis Report</Text>
                        </View>
                        <View style={styles.aiTag}>
                          <BrainCircuit size={12} color="#D97706" />
                          <Text style={styles.aiTagText}>AI Analysis</Text>
                        </View>
                      </View>

                      {/* Treatment / Advice */}
                      <View style={styles.adviceSection}>
                        {analysisResult.ai_solution ? (
                          <>
                            <View style={styles.adviceBlock}>
                              <Text style={styles.adviceLabel}>🔬 Treatment</Text>
                              <Text style={styles.adviceText}>{analysisResult.ai_solution.treatment}</Text>
                            </View>

                            {analysisResult.ai_solution.prevention.length > 0 && (
                              <View style={styles.adviceBlock}>
                                <Text style={styles.adviceLabel}>🛡️ Prevention</Text>
                                {analysisResult.ai_solution.prevention.map((tip, idx) => (
                                  <View key={idx} style={styles.checkListItem}>
                                    <CheckCircle size={14} color="#4CAF50" style={{ marginTop: 2 }} />
                                    <Text style={styles.listText}>{tip}</Text>
                                  </View>
                                ))}
                              </View>
                            )}

                            <View style={styles.tipsBox}>
                              <View style={styles.tipHeader}>
                                <Zap size={14} color="#F59E0B" />
                                <Text style={styles.tipsBoxTitle}>Pro Tip</Text>
                              </View>
                              <Text style={styles.tipsBoxText}>
                                {analysisResult.ai_solution.tips[0] || "Regular monitoring is key to healthy crops."}
                              </Text>
                            </View>
                          </>
                        ) : (
                          <Text style={styles.adviceText}>{analysisResult.disease_detection.details || "No specific advice available."}</Text>
                        )}
                      </View>
                    </View>
                  </Animated.View>
                </>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1B5E20',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#43A047',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.8
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
    elevation: 10,
    overflow: 'hidden',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  imageContainer: {
    height: 320,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  scannerLine: {
    position: 'absolute',
    top: -2,
    left: 0,
    right: 0,
    height: 4,
    zIndex: 20,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    backgroundColor: '#4CAF50'
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  stepsContainer: {
    width: '85%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  stepIconActive: {
    backgroundColor: '#4CAF50',
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    borderColor: '#81C784'
  },
  stepIconCompleted: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50'
  },
  stepText: {
    color: '#E0E0E0',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.3
  },
  stepTextActive: {
    color: '#FFF',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  placeholderContent: {
    alignItems: 'center',
  },
  scanIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F8E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B5E20',
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 14,
    color: '#66BB6A',
    fontWeight: '500'
  },
  actionsBar: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFF',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    overflow: 'hidden',
    position: 'relative'
  },
  galleryBtn: {
    backgroundColor: '#F1F8E9',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  galleryBtnText: {
    color: '#388E3C',
    fontWeight: '700',
    fontSize: 15,
  },
  cameraBtn: {
    backgroundColor: '#2E7D32', // Fallback
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  cameraBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
    zIndex: 1
  },
  disabledBtn: {
    opacity: 0.6,
  },
  resultsSection: {
    gap: 20,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statusSuccess: {
    borderColor: '#DCFCE7',
  },
  statusDanger: {
    borderColor: '#FECACA',
  },
  statusIconContainer: {
    marginRight: 15,
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 16,
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
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  detailsCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 15,
    elevation: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    gap: 6,
  },
  aiTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5
  },
  adviceSection: {
    gap: 16,
  },
  adviceBlock: {
    gap: 6
  },
  adviceLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  adviceText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    fontWeight: '400'
  },
  checkListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    fontWeight: '500'
  },
  tipsBox: {
    marginTop: 10,
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE'
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6
  },
  tipsBoxTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
    textTransform: 'uppercase'
  },
  tipsBoxText: {
    fontSize: 14,
    color: '#1E40AF',
    fontStyle: 'italic',
    lineHeight: 20
  },
});