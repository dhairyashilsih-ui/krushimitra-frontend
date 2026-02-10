import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { CameraView, useCameraPermissions, CameraType, FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera as CameraIcon, Image as ImageIcon, RotateCcw, Zap, ScanLine, Leaf, Info, ShieldCheck, Sprout } from 'lucide-react-native';
import { getServerConfig } from '@/src/services/serverManager';

interface DiseaseResult {
    plant_identification: {
        plant_common: string;
        plant_scientific: string;
        probability: number;
        description: string;
    };
    disease_detection: {
        disease: string;
        confidence: number;
        details: string;
        advice: string;
    };
    ai_solution?: {
        treatment: string;
        prevention: string[];
        tips: string[];
    };
    crop: string;
}

export default function CropDiseaseScreen() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState<CameraType>('back');
    const [flash, setFlash] = useState<FlashMode>('off');
    const [image, setImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<DiseaseResult | null>(null);
    const cameraRef = useRef<CameraView>(null);

    useEffect(() => {
        (async () => {
            // Request permissions on mount if not granted
            if (permission && !permission.granted && permission.canAskAgain) {
                // Auto-request or let user click button
            }
        })();
    }, [permission]);

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    skipProcessing: true,
                });
                if (photo) {
                    setImage(photo.uri);
                }
            } catch (error) {
                Alert.alert('Error', 'Failed to take photo');
                console.error(error);
            }
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const retake = () => {
        setImage(null);
        setResult(null);
    };

    const analyzeImage = async () => {
        if (!image) return;

        setUploading(true);
        try {
            const { backendUrl } = getServerConfig();
            const formData = new FormData();

            // @ts-ignore - React Native FormData expects uri, name, type
            formData.append('file', {
                uri: image,
                name: 'crop_image.jpg',
                type: 'image/jpeg',
            });

            console.log('🌱 Uploading image to:', `${backendUrl}/predict`);

            const response = await fetch(`${backendUrl}/predict`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const data = await response.json();
            console.log('🔬 Analysis result:', data);

            if (data.success) {
                setResult(data);
            } else {
                Alert.alert('Analysis Failed', data.message || 'Could not analyze crop.');
            }
        } catch (error) {
            console.error('Error analyzing crop:', error);
            Alert.alert('Error', 'Failed to connect to analysis server.');
        } finally {
            setUploading(false);
        }
    };

    if (!permission) {
        // Camera permissions are still loading.
        return <View style={styles.container}><ActivityIndicator size="large" color="#4CAF50" /></View>;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <View style={styles.container}>
                <Text style={styles.text}>We need your permission to show the camera</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.button}>
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.back()} style={[styles.button, { marginTop: 10, backgroundColor: '#666' }]}>
                    <Text style={styles.buttonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color="#1F2937" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Crop Doctor</Text>
                <View style={{ width: 24 }} />
            </View>

            {!image ? (
                <View style={styles.cameraContainer}>
                    <CameraView style={styles.camera} facing={facing} flash={flash} ref={cameraRef}>
                        <View style={styles.cameraControls}>
                            <View style={styles.topControls}>
                                <TouchableOpacity
                                    style={styles.controlButton}
                                    onPress={() => setFlash(flash === 'off' ? 'on' : 'off')}
                                >
                                    <Zap color={flash === 'on' ? "#FFD700" : "#FFF"} size={24} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.controlButton}
                                    onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
                                >
                                    <RotateCcw color="#FFF" size={24} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.bottomControls}>
                                <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
                                    <ImageIcon color="#FFF" size={24} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                                    <View style={styles.captureInner} />
                                </TouchableOpacity>
                                <View style={{ width: 44 }} />
                            </View>
                        </View>
                    </CameraView>
                    <View style={styles.instructionContainer}>
                        <ScanLine color="#4CAF50" size={20} />
                        <Text style={styles.instructionText}>Point camera at the affected crop leaf</Text>
                    </View>
                </View>
            ) : (
                <ScrollView style={styles.resultContainer}>
                    <View style={styles.imagePreviewContainer}>
                        <Image source={{ uri: image }} style={styles.imagePreview} />
                        {!result && (
                            <TouchableOpacity style={styles.retakeButton} onPress={retake}>
                                <RotateCcw color="#FFF" size={16} />
                                <Text style={styles.retakeText}>Retake</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {!result ? (
                        <View style={styles.actionContainer}>
                            <Text style={styles.analyzePrompt}>Ready to analyze this crop?</Text>
                            <TouchableOpacity
                                style={[styles.analyzeButton, uploading && styles.disabledButton]}
                                onPress={analyzeImage}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <>
                                        <ScanLine color="#FFF" size={20} />
                                        <Text style={styles.analyzeButtonText}>Diagnose Disease</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.diagnosisContainer}>
                            {/* Plant ID Card */}
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <Leaf color="#4CAF50" size={20} />
                                    <Text style={styles.cardTitle}>Plant Identification</Text>
                                </View>
                                <Text style={styles.plantName}>{result.plant_identification?.plant_common || 'Unknown Plant'}</Text>
                                <Text style={styles.scientificName}>{result.plant_identification?.plant_scientific}</Text>
                                <View style={styles.confidenceBadge}>
                                    <Text style={styles.confidenceText}>
                                        {Math.round((result.plant_identification?.probability || 0) * 100)}% Confidence
                                    </Text>
                                </View>
                            </View>

                            {/* Disease Detection Card */}
                            <LinearGradient
                                colors={result.disease_detection.disease === 'Healthy' ? ['#E8F5E9', '#C8E6C9'] : ['#FFEBEE', '#FFCDD2']}
                                style={styles.card}
                            >
                                <View style={styles.cardHeader}>
                                    <ShieldCheck color={result.disease_detection.disease === 'Healthy' ? "#2E7D32" : "#C62828"} size={20} />
                                    <Text style={[styles.cardTitle, { color: result.disease_detection.disease === 'Healthy' ? "#2E7D32" : "#C62828" }]}>
                                        Diagnosis: {result.disease_detection.disease}
                                    </Text>
                                </View>
                                <Text style={styles.diseaseDetails}>
                                    Confidence: {Math.round(result.disease_detection.confidence * 100)}%
                                </Text>
                                {result.ai_solution?.treatment && (
                                    <View style={styles.solutionSection}>
                                        <Text style={styles.sectionHeader}>Treatment</Text>
                                        <Text style={styles.solutionText}>{result.ai_solution.treatment}</Text>
                                    </View>
                                )}
                                {result.ai_solution?.prevention && result.ai_solution.prevention.length > 0 && (
                                    <View style={styles.solutionSection}>
                                        <Text style={styles.sectionHeader}>Prevention</Text>
                                        {result.ai_solution.prevention.map((tip, idx) => (
                                            <View key={idx} style={styles.bulletPoint}>
                                                <View style={styles.bullet} />
                                                <Text style={styles.bulletText}>{tip}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </LinearGradient>

                            <TouchableOpacity style={styles.newScanButton} onPress={retake}>
                                <CameraIcon color="#FFF" size={20} />
                                <Text style={styles.newScanText}>Scan Another Crop</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    text: {
        fontSize: 18,
        color: '#374151',
        marginBottom: 20,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    button: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        alignSelf: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    cameraContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
    },
    cameraControls: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'space-between',
        padding: 20,
    },
    topControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    bottomControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    controlButton: {
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFF',
        borderWidth: 2,
        borderColor: '#000',
    },
    galleryButton: {
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 24,
    },
    instructionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#FFF',
    },
    instructionText: {
        marginLeft: 8,
        color: '#374151',
        fontWeight: '500',
    },
    resultContainer: {
        flex: 1,
    },
    imagePreviewContainer: {
        position: 'relative',
        height: 300,
        backgroundColor: '#000',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    retakeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    retakeText: {
        color: '#FFF',
        marginLeft: 4,
        fontWeight: '600',
        fontSize: 14,
    },
    actionContainer: {
        padding: 20,
        alignItems: 'center',
    },
    analyzePrompt: {
        fontSize: 18,
        color: '#374151',
        marginBottom: 16,
        fontWeight: '500',
    },
    analyzeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 30,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },

    disabledButton: {
        backgroundColor: '#9CA3AF',
        shadowOpacity: 0,
    },
    analyzeButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    diagnosisContainer: {
        padding: 16,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
        color: '#1F2937',
    },
    plantName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    scientificName: {
        fontSize: 14,
        color: '#6B7280',
        fontStyle: 'italic',
        marginBottom: 8,
    },
    confidenceBadge: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    confidenceText: {
        color: '#059669',
        fontSize: 12,
        fontWeight: '600',
    },
    diseaseDetails: {
        fontSize: 16,
        color: '#374151',
        marginBottom: 12,
    },
    solutionSection: {
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        paddingTop: 8,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginTop: 8,
        marginBottom: 4,
    },
    solutionText: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 22,
    },
    bulletPoint: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 4,
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4CAF50',
        marginTop: 8,
        marginRight: 8,
    },
    bulletText: {
        flex: 1,
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 22,
    },
    newScanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 8,
        marginBottom: 20,
    },
    newScanText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});
