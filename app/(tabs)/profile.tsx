import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert, TextInput, Modal, Platform, ImageBackground, Image, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  Phone,
  MapPin,
  Globe,
  Bell,
  LogOut,
  ChevronRight,
  Award,
  BarChart3,
  Settings,
  Shield,
  HelpCircle,
  Edit3,
  Smartphone,
  Mountain,
  Layers,
  Wheat,
  Sparkles,
  Sprout,
  Tractor,
  CloudSun
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { t } = useTranslation();
  const [userData, setUserData] = useState({
    name: '',
    phone: '',
    email: '',
    landSize: '',
    soilType: '',
    location: ''
  });
  const [rawUserRecord, setRawUserRecord] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('Hindi');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const router = useRouter();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const entries = await AsyncStorage.multiGet(['userData', 'selectedLanguage', 'userAddress']);
      const storedUser = entries.find(([key]) => key === 'userData')?.[1];
      const storedLanguage = entries.find(([key]) => key === 'selectedLanguage')?.[1];
      const storedAddress = entries.find(([key]) => key === 'userAddress')?.[1];

      let parsedUser: any = null;
      if (storedUser) {
        parsedUser = JSON.parse(storedUser);
        setRawUserRecord(parsedUser);
        const derivedProfile = {
          name: parsedUser?.profile?.name || parsedUser?.name || '',
          phone: parsedUser?.profile?.phone || parsedUser?.phone || '',
          email: parsedUser?.email || '',
          landSize: parsedUser?.profile?.landSize || '',
          soilType: parsedUser?.profile?.soilType || '',
          location: parsedUser?.profile?.location || parsedUser?.profile?.address || ''
        };
        setUserData(prev => ({
          ...prev,
          ...derivedProfile
        }));
      }

      if (storedAddress) {
        setUserData(prev => ({ ...prev, location: storedAddress }));
      }

      const languageNames: Record<string, string> = {
        'hi': 'Hindi',
        'en': 'English',
        'bn': 'Bengali',
        'ta': 'Tamil',
        'te': 'Telugu',
        'ml': 'Malayalam',
        'kn': 'Kannada',
        'gu': 'Gujarati',
        'mr': 'Marathi',
        'pa': 'Punjabi',
      };
      const langCode = storedLanguage || parsedUser?.preferredLanguage || parsedUser?.profile?.language;
      if (langCode) {
        setSelectedLanguage(languageNames[langCode] || 'Hindi');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const performLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['authToken', 'userData', 'userAddress']);
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleLogout = () => {
    const confirmationMessage = 'Are you sure you want to logout?';

    if (Platform.OS === 'web') {
      const shouldLogout = typeof window !== 'undefined' && window.confirm(confirmationMessage);
      if (shouldLogout) {
        void performLogout();
      }
      return;
    }

    Alert.alert(
      t('profile.logout'),
      confirmationMessage,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: () => {
            void performLogout();
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    setEditData({
      name: userData.name,
      phone: userData.phone,
      landSize: userData.landSize,
      soilType: userData.soilType,
      location: userData.location
    });
    setShowEditModal(true);
  };

  const saveProfile = async () => {
    try {
      const updatedData = {
        name: editData.name?.trim() || '',
        phone: editData.phone?.trim() || '',
        landSize: editData.landSize?.trim() || '',
        soilType: editData.soilType?.trim() || '',
        location: editData.location?.trim() || ''
      };
      setUserData(updatedData);

      const nextRawRecord = {
        ...(rawUserRecord || {}),
        name: updatedData.name || rawUserRecord?.name || '',
        phone: updatedData.phone || rawUserRecord?.phone || '',
        profile: {
          ...(rawUserRecord?.profile || {}),
          name: updatedData.name,
          phone: updatedData.phone,
          landSize: updatedData.landSize,
          soilType: updatedData.soilType,
          location: updatedData.location
        }
      };
      setRawUserRecord(nextRawRecord);

      await AsyncStorage.setItem('userData', JSON.stringify(nextRawRecord));
      if (updatedData.location) {
        await AsyncStorage.setItem('userAddress', updatedData.location);
      }
      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const menuItems = [
    {
      id: 'language',
      title: t('profile.language'),
      subtitle: selectedLanguage,
      icon: Globe,
      color: '#4CAF50',
      bgColor: '#E8F5E8',
      onPress: () => router.push('/language'),
    },
    {
      id: 'notifications',
      title: t('profile.notifications'),
      subtitle: 'Manage alerts and reminders',
      icon: Bell,
      color: '#FF9800',
      bgColor: '#FFF3E0',
      onPress: () => { },
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      subtitle: 'Data protection settings',
      icon: Shield,
      color: '#3B82F6',
      bgColor: '#E3F2FD',
      onPress: () => { },
    },
    {
      id: 'general',
      title: t('profile.settings'),
      subtitle: 'App preferences',
      icon: Settings,
      color: '#607D8B',
      bgColor: '#ECEFF1',
      onPress: () => { },
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Modern Header Design */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#166534', '#15803D', '#16A34A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            {/* Pattern Overlay opacity */}
            <View style={styles.patternOverlay}>
              <Wheat size={120} color="rgba(255,255,255,0.05)" style={{ position: 'absolute', right: -20, top: -20, transform: [{ rotate: '15deg' }] }} />
              <Sprout size={80} color="rgba(255,255,255,0.05)" style={{ position: 'absolute', left: -20, bottom: -10, transform: [{ rotate: '-15deg' }] }} />
            </View>

            <View style={styles.headerContent}>
              <View style={styles.topBar}>
                <View style={styles.branding}>
                  <Text style={styles.appName}>KrushiMitra</Text>
                  <View style={styles.proBadge}>
                    <Text style={styles.proText}>PRO</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.iconBtn} onPress={handleEditProfile}>
                  <Edit3 size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.profileMain}>
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={['#FFFFFF', '#F0FDF4']}
                    style={styles.avatarGradient}
                  >
                    <User size={40} color="#166534" />
                  </LinearGradient>
                  <View style={styles.verifiedBadge}>
                    <Award size={12} color="#FFFFFF" />
                  </View>
                </View>
                <View style={styles.profileTexts}>
                  <Text style={styles.userName}>{userData?.name || 'Farmer'}</Text>
                  <Text style={styles.userLocation}>
                    <MapPin size={12} color="rgba(255,255,255,0.8)" /> {userData?.location || 'India'}
                  </Text>
                </View>
              </View>

              {/* Glassmorphic Stats Bar */}
              <View style={styles.statsBar}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userData?.landSize ? userData.landSize.replace(/[^0-9.]/g, '') : '0'}</Text>
                  <Text style={styles.statLabel}>Acres</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>4.8</Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>12+</Text>
                  <Text style={styles.statLabel}>Crops</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Floating Farm Card */}
        <View style={styles.farmCardContainer}>
          <View style={styles.farmCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Farm Details</Text>
              <TouchableOpacity onPress={handleEditProfile}>
                <Text style={styles.cardAction}>Update</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.farmDetailsGrid}>
              <View style={styles.farmDetailItem}>
                <View style={[styles.farmIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <Smartphone size={18} color="#059669" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Mobile</Text>
                  <Text style={styles.detailValue}>+91 {userData?.phone || '--'}</Text>
                </View>
              </View>

              <View style={styles.farmDetailItem}>
                <View style={[styles.farmIconBox, { backgroundColor: '#FFFBEB' }]}>
                  <Layers size={18} color="#D97706" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Soil Type</Text>
                  <Text style={styles.detailValue}>{userData?.soilType || '--'}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Dashboard Actions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Dashboard</Text>
          <View style={styles.dashboardGrid}>
            <TouchableOpacity style={styles.dashCard}>
              <LinearGradient colors={['#F0F9FF', '#E0F2FE']} style={styles.dashGradient}>
                <CloudSun size={32} color="#0284C7" />
                <Text style={styles.dashValue}>28°C</Text>
                <Text style={styles.dashLabel}>Weather</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dashCard}>
              <LinearGradient colors={['#F0FDF4', '#DCFCE7']} style={styles.dashGradient}>
                <Sprout size={32} color="#16A34A" />
                <Text style={styles.dashValue}>Healthy</Text>
                <Text style={styles.dashLabel}>Crop Status</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dashCard}>
              <LinearGradient colors={['#FFF7ED', '#FFEDD5']} style={styles.dashGradient}>
                <Tractor size={32} color="#EA580C" />
                <Text style={styles.dashValue}>Active</Text>
                <Text style={styles.dashLabel}>Machinery</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Menu */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.onPress}>
                  <View style={[styles.menuIconBox, { backgroundColor: item.bgColor }]}>
                    <IconComponent size={20} color={item.color} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  </View>
                  <ChevronRight size={18} color="#94A3B8" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.menuIconBox, { backgroundColor: '#FEE2E2' }]}>
                <Phone size={20} color="#EF4444" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Kisan Helpline</Text>
                <Text style={styles.menuSubtitle}>1800-180-1551</Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutWrapper}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutTxt}>Log Out</Text>
          </TouchableOpacity>
          <Text style={styles.versionTxt}>v1.0.0 • KrushiMitra</Text>
        </View>

      </ScrollView>

      {/* Edit Profile Modal (Kept functional logic, updated styles) */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.closeModalText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.inputField}
                  value={editData.name}
                  onChangeText={(text) => setEditData({ ...editData, name: text })}
                  placeholder="Enter name"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.inputField}
                  value={editData.phone}
                  onChangeText={(text) => setEditData({ ...editData, phone: text })}
                  placeholder="Enter phone"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Land Size (Acres)</Text>
                <TextInput
                  style={styles.inputField}
                  value={editData.landSize}
                  onChangeText={(text) => setEditData({ ...editData, landSize: text })}
                  placeholder="e.g. 5.5"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Soil Type</Text>
                <TextInput
                  style={styles.inputField}
                  value={editData.soilType}
                  onChangeText={(text) => setEditData({ ...editData, soilType: text })}
                  placeholder="e.g. Black Soil"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                  style={styles.inputField}
                  value={editData.location}
                  onChangeText={(text) => setEditData({ ...editData, location: text })}
                  placeholder="City, State"
                />
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    height: 280,
    backgroundColor: '#166534',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  headerGradient: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
    paddingHorizontal: 20,
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  proBadge: {
    backgroundColor: '#FCD34D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#78350F',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  profileMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3B82F6',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileTexts: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    backdropFilter: 'blur(10px)', // Works on web, ignored on native
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  farmCardContainer: {
    paddingHorizontal: 20,
    marginTop: -30,
    zIndex: 10,
  },
  farmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  cardAction: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '600',
  },
  farmDetailsGrid: {
    gap: 16,
  },
  farmDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  farmIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 16,
  },
  dashboardGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  dashCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dashGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 110,
  },
  dashValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  dashLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 16,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  logoutWrapper: {
    padding: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FEF2F2',
    borderRadius: 24,
  },
  logoutTxt: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 16,
  },
  versionTxt: {
    marginTop: 16,
    color: '#94A3B8',
    fontSize: 12,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  closeModalText: {
    color: '#64748B',
    fontSize: 16,
  },
  modalBody: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  inputField: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  saveBtn: {
    backgroundColor: '#166534',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});