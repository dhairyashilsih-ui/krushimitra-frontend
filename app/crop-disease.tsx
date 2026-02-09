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
  Search,
  BrainCircuit,
  Microscope,
  Check
} from 'lucide-react-native';
import { BlurView } from 'expo-blur'; // Ensure you have this or use a fallback view

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
  const resultFadeAnim = useRef(new Animated.Value(0)).current;

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

  // Simulate Steps Progression
  useEffect(() => {
    if (isScanning) {
      setCurrentStep(1);
      // We will manually advance steps roughly every 1-1.5 seconds 
      // to simulate the pipeline visually while the backend works.
      // The backend usually takes 4-6 seconds, so this fits well.

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
        Animated.timing(resultFadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      } else {
        setCurrentStep(0);
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
      resultFadeAnim.setValue(0);

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
      // This prevents "instant" glitch if server is too fast (cached)
      setTimeout(() => {
        if (data.success) {
          setAnalysisResult(data);
        } else {
          Alert.alert('Analysis Failed', data.message || 'Could not analyze image.');
        }
        setIsScanning(false);
      }, 500); // minimal delay to let step 4 show briefly

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

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return '#4CAF50'; // High - Green
    if (score >= 0.5) return '#F59E0B'; // Medium - Orange
    return '#EF4444'; // Low - Red
  };

  const hasDisease = analysisResult?.disease_detection.disease !== 'Healthy';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#FFFFFF', '#F0F7F0', '#E0F2F1']}
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

                  {/* Analysis Overlay */}
                  {isScanning && (
                    <View style={styles.overlayContainer}>
                      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                      <View style={styles.stepsContainer}>
                        {ANALYSIS_STEPS.map((step) => {
                          const isActive = currentStep === step.id;
                          const isCompleted = currentStep > step.id;
                          const isPending = currentStep < step.id;

                          return (
                            <View key={step.id} style={[styles.stepRow, { opacity: isPending ? 0.5 : 1 }]}>
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

          {/* Results Section */}
          {analysisResult && (
            <Animated.View style={[styles.resultsSection, { opacity: resultFadeAnim, transform: [{ translateY: resultFadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>

              {/* STATUS HEADER - Simplified & Clean */}
              <View style={[styles.statusCard, hasDisease ? styles.statusDanger : styles.statusSuccess]}>
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
              </View>

              {/* DETAILS & AI SOLUTION */}
              <View style={styles.detailsCard}>
                <View style={[styles.detailRow, { borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 12 }]}>
                  <Text style={styles.sectionHeader}>Diagnosis Report</Text>
                  <View style={styles.aiTag}>
                    <Sparkles size={12} color="#F59E0B" />
                    <Text style={styles.aiTagText}>AI Generated</Text>
                  </View>
                </View>

                {/* Treatment / Advice */}
                <View style={styles.adviceSection}>
                  {analysisResult.ai_solution ? (
                    <>
                      <Text style={styles.adviceLabel}>🔬 Treatment Plan:</Text>
                      <Text style={styles.adviceText}>{analysisResult.ai_solution.treatment}</Text>

                      {analysisResult.ai_solution.prevention.length > 0 && (
                        <View style={{ marginTop: 12 }}>
                          <Text style={styles.adviceLabel}>🛡️ Prevention:</Text>
                          {analysisResult.ai_solution.prevention.map((tip, idx) => (
                            <View key={idx} style={styles.checkListItem}>
                              <CheckCircle size={14} color="#4CAF50" style={{ marginTop: 2 }} />
                              <Text style={styles.listText}>{tip}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      <View style={styles.tipsBox}>
                        <Text style={styles.tipsBoxTitle}>💡 Quick Tip</Text>
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B5E20',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#43A047',
    fontWeight: '500',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  mainCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  imageContainer: {
    height: 320,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  stepsContainer: {
    width: '80%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    padding: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepIconActive: {
    backgroundColor: '#4CAF50',
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  stepIconCompleted: {
    backgroundColor: '#4CAF50',
  },
  stepText: {
    color: '#EEE',
    fontSize: 14,
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 5,
  },
  placeholderSubtitle: {
    fontSize: 14,
    color: '#81C784',
  },
  actionsBar: {
    flexDirection: 'row',
    padding: 15,
    gap: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFF',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  galleryBtn: {
    backgroundColor: '#F1F8E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  galleryBtnText: {
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 14,
  },
  cameraBtn: {
    backgroundColor: '#2E7D32',
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cameraBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  resultsSection: {
    gap: 15,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    backgroundColor: '#FFF',
  },
  statusSuccess: {
    borderColor: '#C8E6C9',
    backgroundColor: '#F1F8E9',
  },
  statusDanger: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  statusIconContainer: {
    marginRight: 15,
    padding: 10,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 4,
  },
  aiTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  adviceSection: {
    gap: 10,
  },
  adviceLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 4,
  },
  adviceText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  checkListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  tipsBox: {
    marginTop: 15,
    backgroundColor: '#EFF6FF',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  tipsBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
    marginBottom: 4,
  },
  tipsBoxText: {
    fontSize: 13,
    color: '#1E3A8A',
    fontStyle: 'italic',
  },
});