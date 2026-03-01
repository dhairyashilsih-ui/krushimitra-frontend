import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  FlatList,
  Modal,
  Animated,
  Platform,
  Alert,
  Dimensions,
  Easing,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { offlineStorage } from '../src/utils/offlineStorage';
import { realtimeUpdates } from '../src/utils/realtimeUpdates';
import { networkManager } from '../src/utils/networkManager';
import { pinnedItemsManager } from '../src/utils/pinnedItems';
import { alertSystem } from '../src/utils/alertSystem';
import OfflineIndicator from '../src/components/OfflineIndicator';
import AnimatedOrb from '../components/AnimatedOrb';
import {
  Search,
  Filter,
  X,
  IndianRupee,
  MapPin,
  Calendar,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Star,
  Clock,
  Bell,
  BarChart3,
  GitCompare,
  Pin,
  PinOff,
  Heart,
  Zap,
  Leaf,
  Sparkles,
  Compass,
  Activity,
} from 'lucide-react-native';

import * as Location from 'expo-location';
import { serverManager } from '../src/services/serverManager';
import { queryLLMStream } from '../src/services/llm'; // AI Service
import { Bot, MessageCircle, Send, User } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';


interface MandiPrice {
  _id: string;
  crop: string;
  location: string;
  price: number;
  date: string;
  category?: string;
  unit?: string;
  change?: number;
  changePercent?: number;
  quality?: string;
}

interface NearestMandi {
  name: string;
  distanceKm: number;
  lat: number;
  lon: number;
}

interface FilterState {
  category: string;
  priceRange: { min: number; max: number };
  location: string;
}

const CATEGORIES = [
  'All',
  'Vegetables',
  'Fruits',
  'Cereals',
  'Pulses',
  'Nuts & Seeds',
  'Spices & Herbs'
];

const CATEGORY_DATA = {
  'Vegetables': {
    icon: '🥬',
    color: '#22C55E',
    subcategories: ['Leafy Greens', 'Root Vegetables', 'Nightshades', 'Cruciferous', 'Alliums', 'Cucurbits']
  },
  'Fruits': {
    icon: '🍎',
    color: '#F59E0B',
    subcategories: ['Citrus', 'Berries', 'Tropical', 'Stone Fruits', 'Melons', 'Pome Fruits']
  },
  'Cereals': {
    icon: '🌾',
    color: '#8B5CF6',
    subcategories: ['Wheat', 'Rice', 'Corn', 'Barley', 'Oats', 'Millets']
  },
  'Pulses': {
    icon: '🫘',
    color: '#EF4444',
    subcategories: ['Lentils', 'Chickpeas', 'Beans', 'Peas', 'Soybeans', 'Black Gram']
  },
  'Nuts & Seeds': {
    icon: '🥜',
    color: '#F97316',
    subcategories: ['Groundnuts', 'Almonds', 'Cashews', 'Walnuts', 'Sunflower Seeds', 'Sesame Seeds']
  },
  'Spices & Herbs': {
    icon: '🌶️',
    color: '#DC2626',
    subcategories: ['Turmeric', 'Chili', 'Cumin', 'Coriander', 'Ginger', 'Garlic']
  }
};

const LOCATIONS = [
  'All',
  'Gultekdi',
  'Moshi',
  'Manchar',
  'Khed',
  'Junnar',
  'Shirur',
  'Baramati',
  'Indapur',
  'Daund',
  'Bhor',
  'Saswad',
  'Velhe',
  'Mulshi',
  'Maval'
];

const PRICE_RANGES = [
  { label: 'All', min: 0, max: Infinity },
  { label: 'Under ₹1000', min: 0, max: 1000 },
  { label: '₹1000 - ₹3000', min: 1000, max: 3000 },
  { label: '₹3000 - ₹5000', min: 3000, max: 5000 },
  { label: '₹5000 - ₹10000', min: 5000, max: 10000 },
  { label: 'Above ₹10000', min: 10000, max: Infinity }
];

const MandiCard = ({ mandi }: { mandi: NearestMandi }) => {
  const router = useRouter();

  return (
    <View
      style={{
        backgroundColor: '#fff',
        marginBottom: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)'
      }}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push({
          pathname: '/mandi-report',
          params: { mandiName: mandi.name, distance: mandi.distanceKm }
        })}
        style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}
      >
        <View style={{
          width: 50, height: 50, borderRadius: 25,
          backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center',
          marginRight: 16
        }}>
          <Text style={{ fontSize: 24 }}>�</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 }}>
            {mandi.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Compass size={14} color="#4CAF50" style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 14, color: '#4CAF50', fontWeight: '600' }}>
              {mandi.distanceKm} km away
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

// Mock data for demonstration
const MOCK_MANDI_PRICES: MandiPrice[] = [
  { _id: '1', crop: 'Tomato (Hybrid)', location: 'Gultekdi Market Yard', price: 2400, date: '2024-03-20', category: 'Vegetables', unit: 'per Quintal', change: 200, changePercent: 5.2, quality: 'Grade A' },
  { _id: '2', crop: 'Onion (Red)', location: 'Lasalgaon Mandi', price: 1800, date: '2024-03-20', category: 'Vegetables', unit: 'per Quintal', change: -150, changePercent: -4.1, quality: 'Click to see details' },
  { _id: '3', crop: 'Wheat (Lokwan)', location: 'MPMC Vashi', price: 3200, date: '2024-03-19', category: 'Cereals', unit: 'per Quintal', change: 0, changePercent: 0, quality: 'Premium' },
  { _id: '4', crop: 'Soybean', location: 'Latur APMC', price: 4600, date: '2024-03-19', category: 'Pulses', unit: 'per Quintal', change: 100, changePercent: 2.1, quality: 'FAQ' },
  { _id: '5', crop: 'Cotton', location: 'Akola Market', price: 6800, date: '2024-03-18', category: 'Cash Crops', unit: 'per Quintal', change: -50, changePercent: -0.8, quality: 'Long Staple' },
  { _id: '6', crop: 'Potato', location: 'Pune', price: 1500, date: '2024-03-20', category: 'Vegetables', unit: 'per Quintal', change: 50, changePercent: 3.4 },
  {
    _id: '7',
    crop: 'Orange',
    location: 'Junnar',
    price: 60,
    date: '2024-01-15T10:30:00Z',
    category: 'Fruits',
    unit: 'per kg',
    change: 5,
    changePercent: 9.1
  },
  {
    _id: '8',
    crop: 'Banana',
    location: 'Indapur',
    price: 40,
    date: '2024-01-15T10:30:00Z',
    category: 'Fruits',
    unit: 'per kg',
    change: 2,
    changePercent: 5.3
  },
  {
    _id: '9',
    crop: 'Apple',
    location: 'Gultekdi',
    price: 120,
    date: '2024-01-15T10:30:00Z',
    category: 'Fruits',
    unit: 'per kg',
    change: -5,
    changePercent: -4.0
  },
  {
    _id: '10',
    crop: 'Grapes',
    location: 'Nasik',
    price: 90,
    date: '2024-01-15T10:30:00Z',
    category: 'Fruits',
    unit: 'per kg',
    change: 8,
    changePercent: 9.8
  },
  // Cereals
  {
    _id: '11',
    crop: 'Wheat',
    location: 'Shirur',
    price: 2400,
    date: '2024-01-15T10:30:00Z',
    category: 'Cereals',
    unit: 'per quintal',
    change: 50,
    changePercent: 2.1
  },
  {
    _id: '12',
    crop: 'Rice',
    location: 'Maval',
    price: 2800,
    date: '2024-01-15T10:30:00Z',
    category: 'Cereals',
    unit: 'per quintal',
    change: 25,
    changePercent: 0.9
  },
  {
    _id: '13',
    crop: 'Corn',
    location: 'Khed',
    price: 1800,
    date: '2024-01-15T10:30:00Z',
    category: 'Cereals',
    unit: 'per quintal',
    change: 30,
    changePercent: 1.7
  },
  {
    _id: '14',
    crop: 'Bajra',
    location: 'Baramati',
    price: 2200,
    date: '2024-01-15T10:30:00Z',
    category: 'Cereals',
    unit: 'per quintal',
    change: -20,
    changePercent: -0.9
  },
  // Pulses
  {
    _id: '15',
    crop: 'Soybean',
    location: 'Pune',
    price: 5200,
    date: '2024-01-15T10:30:00Z',
    category: 'Pulses',
    unit: 'per quintal',
    change: -100,
    changePercent: -1.9
  },
  {
    _id: '16',
    crop: 'Chickpea',
    location: 'Nagpur',
    price: 4800,
    date: '2024-01-15T10:30:00Z',
    category: 'Pulses',
    unit: 'per quintal',
    change: 80,
    changePercent: 1.7
  },
  {
    _id: '17',
    crop: 'Lentil',
    location: 'Mumbai',
    price: 4200,
    date: '2024-01-15T10:30:00Z',
    category: 'Pulses',
    unit: 'per quintal',
    change: 60,
    changePercent: 1.4
  },
  {
    _id: '18',
    crop: 'Black Gram',
    location: 'Kolhapur',
    price: 5600,
    date: '2024-01-15T10:30:00Z',
    category: 'Pulses',
    unit: 'per quintal',
    change: -40,
    changePercent: -0.7
  },
  // Nuts & Seeds
  {
    _id: '19',
    crop: 'Groundnut',
    location: 'Kolhapur',
    price: 6800,
    date: '2024-01-15T10:30:00Z',
    category: 'Nuts & Seeds',
    unit: 'per quintal',
    change: 200,
    changePercent: 3.0
  },
  {
    _id: '20',
    crop: 'Almond',
    location: 'Nashik',
    price: 450,
    date: '2024-01-15T10:30:00Z',
    category: 'Nuts & Seeds',
    unit: 'per kg',
    change: 15,
    changePercent: 3.4
  },
  {
    _id: '21',
    crop: 'Cashew',
    location: 'Mumbai',
    price: 380,
    date: '2024-01-15T10:30:00Z',
    category: 'Nuts & Seeds',
    unit: 'per kg',
    change: -10,
    changePercent: -2.6
  },
  {
    _id: '22',
    crop: 'Sunflower Seeds',
    location: 'Pune',
    price: 3200,
    date: '2024-01-15T10:30:00Z',
    category: 'Nuts & Seeds',
    unit: 'per quintal',
    change: 50,
    changePercent: 1.6
  },
  // Spices & Herbs
  {
    _id: '23',
    crop: 'Turmeric',
    location: 'Sangli',
    price: 12000,
    date: '2024-01-15T10:30:00Z',
    category: 'Spices & Herbs',
    unit: 'per quintal',
    change: -500,
    changePercent: -4.0
  },
  {
    _id: '24',
    crop: 'Chili',
    location: 'Kolhapur',
    price: 18000,
    date: '2024-01-15T10:30:00Z',
    category: 'Spices & Herbs',
    unit: 'per quintal',
    change: 800,
    changePercent: 4.6
  },
  {
    _id: '25',
    crop: 'Cumin',
    location: 'Pune',
    price: 15000,
    date: '2024-01-15T10:30:00Z',
    category: 'Spices & Herbs',
    unit: 'per quintal',
    change: 300,
    changePercent: 2.0
  },
  {
    _id: '26',
    crop: 'Coriander',
    location: 'Mumbai',
    price: 8500,
    date: '2024-01-15T10:30:00Z',
    category: 'Spices & Herbs',
    unit: 'per quintal',
    change: -200,
    changePercent: -2.3
  }
];

export default function MandiPricesScreen() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [prices, setPrices] = useState<MandiPrice[]>([]);
  const [filteredPrices, setFilteredPrices] = useState<MandiPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [pinnedItems, setPinnedItems] = useState<Set<string>>(new Set());
  const [showPinModal, setShowPinModal] = useState<MandiPrice | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    category: 'All',
    priceRange: { min: 0, max: Infinity },
    location: 'All'
  });
  const [sortBy, setSortBy] = useState<'price' | 'name' | 'date' | 'popularity'>('price');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [showSubcategories, setShowSubcategories] = useState<string>('');

  // Nearest Mandi State
  const [nearestMandis, setNearestMandis] = useState<NearestMandi[]>([]);
  const [loadingNearest, setLoadingNearest] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const router = useRouter();
  const searchInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // AI Assistant State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [conversation, setConversation] = useState<any[]>([]);
  const [longTermMemory, setLongTermMemory] = useState<string>('');
  const [userData, setUserData] = useState<any>(null); // For context
  const [aiHasGreeted, setAiHasGreeted] = useState(false);

  // Load User Data & Memory for AI Context
  useEffect(() => {
    const loadAiContext = async () => {
      try {
        const json = await AsyncStorage.getItem('userData');
        if (json) setUserData(JSON.parse(json));
        const memory = await AsyncStorage.getItem('ai_longTermMemory');
        if (memory) setLongTermMemory(memory);
      } catch (e) { console.log('Error loading user data for AI', e); }
    };
    loadAiContext();
  }, []);

  // AI Logic
  const generateMandiAdvice = async (userQuery: string = "", isGreeting = false) => {
    setIsAiThinking(true);
    setAiResponse('');

    try {
      // 1. Build Context
      const userContext = userData ? `
        Farmer Name: ${userData.name || 'Farmer'}
        Location: ${userData.address || 'Pune'}
        Registered Crops: ${userData.crops?.join(', ') || 'Various'}
      ` : "User: General Farmer (Profile not fully set)";

      const mandiContext = nearestMandis.slice(0, 3).map(m =>
        `${m.name} (${m.distanceKm}km)`
      ).join(', ');

      const priceContext = prices.slice(0, 5).map(p => `${p.crop}: ₹${p.price} (${p.location})`).join('\n');

      const chatHistoryContext = conversation.map(c => `${c.role.toUpperCase()}: ${c.text}`).join('\n');

      const systemPrompt = `
        You are KrushiAI, an expert agricultural market advisor.
        
        USER PROFILE:
        ${userContext}
        
        LONG-TERM MEMORY ABOUT THIS USER:
        "${longTermMemory || '(No memory yet)'}"
        
        RECENT CHAT HISTORY:
        ${chatHistoryContext || '(No recent chat)'}
        
        NEARBY MANDIS: ${mandiContext}
        
        CURRENT MARKET DATA SAMPLE:
        ${priceContext}
        
        TASK:
        ${isGreeting
          ? "The user just opened the app. Greet them proactively base on their memory profile or an urgent drop/rise in nearby market prices. Keep it strictly under 3 sentences. DO NOT say 'How can I help you?'. BE SPECIFIC to the data and their memory."
          : `Answer this specific question: "${userQuery}"`}
        
        GUIDELINES:
        - Be specific and actionable based on the data provided.
        - NEVER repeat the phrase "LONG-TERM MEMORY ABOUT THIS USER". Just use the facts inside it smoothly.
        - Keep it very concise (3-4 sentences maximum).
        - Use Hindi or English (Default: English).
      `;

      // 2. Call LLM
      let fullResponse = "";
      for await (const chunk of queryLLMStream(systemPrompt)) {
        fullResponse += chunk;
        setAiResponse(prev => prev + chunk);
      }

      // 3. Save to live sliding window
      let newConv = [...conversation];
      if (!isGreeting) {
        newConv.push({ role: 'user', text: userQuery });
      }
      newConv.push({ role: 'ai', text: fullResponse });

      // SLIDING WINDOW LOGIC (Max 10 messages)
      if (newConv.length >= 10) {
        // Clear the active window but keep the last 2 context rows so user's train of thought doesn't abruptly break
        newConv = newConv.slice(newConv.length - 2);
      }
      setConversation(newConv);

    } catch (error) {
      console.error("AI Error:", error);
      setAiResponse("Sorry, I'm having trouble analyzing the market right now. Please try again.");
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleSendAiMessage = () => {
    if (!aiMessage.trim()) return;
    const msg = aiMessage;
    setAiMessage('');
    // User message is added during `generateMandiAdvice` so AI can read it as `userQuery` without state delays
    generateMandiAdvice(msg, false);
  };

  // Animation refs for futuristic effects
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const floatAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const headerScaleAnimation = useRef(new Animated.Value(0.9)).current;
  const particlePositions = useRef([
    new Animated.ValueXY({ x: -20, y: -20 }),
    new Animated.ValueXY({ x: 100, y: 50 }),
    new Animated.ValueXY({ x: 300, y: -20 }),
    new Animated.ValueXY({ x: -20, y: 200 }),
    new Animated.ValueXY({ x: 350, y: 300 }),
  ]).current;

  // Initialize with mock data
  useEffect(() => {
    initializeApp();
    setupAnimations();
    fetchNearestMandis();
  }, []);

  const fetchNearestMandis = async () => {
    setLoadingNearest(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Enable location to see nearest mandis');
        setLoadingNearest(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      const { latitude, longitude } = location.coords;

      const backendUrl = serverManager.getBackendEndpoint() || 'http://localhost:3001';
      // Use configured backend URL or fallback to localhost for dev
      // Note: In production/device, localhost won't work, so serverManager should be configured.

      const response = await fetch(`${backendUrl}/mandis/nearest?lat=${latitude}&lon=${longitude}`);

      if (!response.ok) throw new Error('Failed to fetch mandis');

      const result = await response.json();
      if (result.status === 'success') {
        setNearestMandis(result.data);
      }
    } catch (error) {
      console.error('Error fetching nearest mandis:', error);
      setLocationError('Could not find nearest mandis');
    } finally {
      setLoadingNearest(false);
    }
  };

  const setupAnimations = () => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(headerScaleAnimation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
    ]).start();

    // Gentle pulse effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating animation for particles
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnimation, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnimation, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Particle animations
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(particlePositions[0], {
            toValue: { x: 50, y: 30 },
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(particlePositions[0], {
            toValue: { x: -20, y: -20 },
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(particlePositions[1], {
            toValue: { x: 150, y: 100 },
            duration: 5000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(particlePositions[1], {
            toValue: { x: 100, y: 50 },
            duration: 5000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(particlePositions[2], {
            toValue: { x: 350, y: 30 },
            duration: 4500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(particlePositions[2], {
            toValue: { x: 300, y: -20 },
            duration: 4500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(particlePositions[3], {
            toValue: { x: 30, y: 250 },
            duration: 5500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(particlePositions[3], {
            toValue: { x: -20, y: 200 },
            duration: 5500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(particlePositions[4], {
            toValue: { x: 400, y: 350 },
            duration: 6000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(particlePositions[4], {
            toValue: { x: 350, y: 300 },
            duration: 6000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  };

  // Initialize app with offline support and real-time updates
  const initializeApp = async () => {
    try {
      setLoading(true);
      await refreshPrices();

      // Initialize network status
      const networkStatus = networkManager.getNetworkStatus();
      setIsOnline(networkStatus.isConnected);
      setLastSync(networkStatus.lastConnected ? new Date(networkStatus.lastConnected) : null);

      // Add network status callback
      const networkCallback = {
        onConnect: () => {
          setIsOnline(true);
          setLastSync(new Date());
          // Sync data when coming back online
          refreshPrices();
        },
        onDisconnect: () => {
          setIsOnline(false);
        },
        onReconnect: () => {
          setIsOnline(true);
          setLastSync(new Date());
          refreshPrices();
        }
      };

      networkManager.addCallback(networkCallback);

      // Initialize real-time updates
      initializeRealTimeUpdates();

      // Initialize pinned items
      initializePinnedItems();

      // Initialize alert system
      initializeAlertSystem();

      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error initializing app:', error);
      // Fallback to mock data
      setPrices(MOCK_MANDI_PRICES);
      setFilteredPrices(MOCK_MANDI_PRICES);
    }
  };

  // Initialize real-time updates
  const initializeRealTimeUpdates = () => {
    try {
      // Subscribe to price updates
      const subscriptionId = realtimeUpdates.subscribe(
        'price_update',
        { commodity: searchQuery || undefined },
        (update) => {
          console.log('Received real-time price update:', update);
          handleRealTimeUpdate(update);
        }
      );

      // Subscribe to market alerts
      const alertSubscriptionId = realtimeUpdates.subscribe(
        'market_alert',
        {},
        (alert) => {
          console.log('Received market alert:', alert);
          showMarketAlert(alert);
        }
      );

      return () => {
        realtimeUpdates.unsubscribe(subscriptionId);
        realtimeUpdates.unsubscribe(alertSubscriptionId);
      };
    } catch (error) {
      console.error('Error initializing real-time updates:', error);
    }
  };

  // Handle real-time price updates
  const handleRealTimeUpdate = (update: any) => {
    setPrices(prevPrices => {
      const updatedPrices = prevPrices.map(price =>
        price._id === update.id ? {
          ...price,
          price: update.price,
          change: update.change,
          changePercent: update.changePercent,
          date: new Date(update.timestamp).toISOString()
        } : price
      );
      return updatedPrices;
    });
  };

  // Show market alert
  const showMarketAlert = (alert: any) => {
    Alert.alert(
      'Market Alert',
      alert.data.message,
      [
        { text: 'OK', style: 'default' }
      ]
    );
  };

  // Initialize pinned items
  const initializePinnedItems = async () => {
    try {
      const pinned = pinnedItemsManager.getPinnedItems();
      const pinnedSet = new Set(pinned.map(item => `${item.commodity}-${item.location}`));
      setPinnedItems(pinnedSet);
    } catch (error) {
      console.error('Error initializing pinned items:', error);
    }
  };

  // Pin/unpin item
  const togglePinItem = async (item: MandiPrice) => {
    try {
      const itemKey = `${item.crop}-${item.location}`;
      const isPinned = pinnedItems.has(itemKey);

      if (isPinned) {
        // Unpin item
        const pinnedItem = pinnedItemsManager.getPinnedItems().find(
          p => p.commodity === item.crop && p.location === item.location
        );
        if (pinnedItem) {
          await pinnedItemsManager.unpinItem(pinnedItem.id);
          setPinnedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(itemKey);
            return newSet;
          });
        }
      } else {
        // Show pin modal for category selection
        setShowPinModal(item);
      }
    } catch (error) {
      console.error('Error toggling pin item:', error);
      Alert.alert('Error', 'Failed to update pinned items. Please try again.');
    }
  };

  // Pin item with category
  const pinItemWithCategory = async (item: MandiPrice, category: string, customNotes?: string) => {
    try {
      const pinnedItem = await pinnedItemsManager.pinItem(
        item.crop,
        item.location,
        item.price,
        item.change || 0,
        item.changePercent || 0,
        item.quality || 'Good',
        category,
        item.category,
        customNotes
      );

      const itemKey = `${item.crop}-${item.location}`;
      setPinnedItems(prev => new Set([...prev, itemKey]));
      setShowPinModal(null);

      // Create automatic price alert for pinned item
      await createAutomaticPriceAlert(item, pinnedItem);

      Alert.alert('Success', 'Item pinned successfully!');
    } catch (error) {
      console.error('Error pinning item:', error);
      Alert.alert('Error', 'Failed to pin item. Please try again.');
    }
  };

  // Initialize alert system
  const initializeAlertSystem = async () => {
    try {
      // Subscribe to notification updates
      const unsubscribe = alertSystem.addListener((notifications) => {
        const unreadCount = notifications.filter(n => !n.isRead).length;
        setUnreadNotifications(unreadCount);
      });

      // Get initial notification count
      const notifications = alertSystem.getNotifications();
      const unreadCount = notifications.filter(n => !n.isRead).length;
      setUnreadNotifications(unreadCount);

      return unsubscribe;
    } catch (error) {
      console.error('Error initializing alert system:', error);
    }
  };

  // Create automatic price alert for pinned item
  const createAutomaticPriceAlert = async (item: MandiPrice, pinnedItemId: string) => {
    try {
      // Create best price alert when price goes above current price + 10%
      const targetPrice = item.price * 1.1;

      await alertSystem.createPriceAlert(
        item.crop,
        item.location,
        item.price,
        targetPrice,
        'above',
        undefined,
        'medium',
        'best_price',
        pinnedItemId
      );

      // Create price drop alert when price goes below current price - 10%
      const dropTargetPrice = item.price * 0.9;

      await alertSystem.createPriceAlert(
        item.crop,
        item.location,
        item.price,
        dropTargetPrice,
        'below',
        undefined,
        'medium',
        'price_drop',
        pinnedItemId
      );
    } catch (error) {
      console.error('Error creating automatic price alert:', error);
    }
  };

  // Generate search suggestions
  useEffect(() => {
    if (searchQuery.length > 0) {
      const cropNames = [...new Set(prices.map(p => p.crop))];
      const filteredSuggestions = cropNames
        .filter(crop =>
          crop.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5);
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, prices]);

  // Filter and sort prices
  useEffect(() => {
    let filtered = [...prices];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(price =>
        price.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
        price.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (filters.category !== 'All') {
      filtered = filtered.filter(price => price.category === filters.category);
    }

    // Location filter
    if (filters.location !== 'All') {
      filtered = filtered.filter(price => price.location === filters.location);
    }

    // Price range filter
    filtered = filtered.filter(price =>
      price.price >= filters.priceRange.min && price.price <= filters.priceRange.max
    );

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'name':
          comparison = a.crop.localeCompare(b.crop);
          break;
        case 'popularity':
          // Mock popularity based on price change percentage (higher change = more popular)
          const aPopularity = Math.abs(a.changePercent || 0);
          const bPopularity = Math.abs(b.changePercent || 0);
          comparison = aPopularity - bPopularity;
          break;
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredPrices(filtered);
  }, [prices, searchQuery, filters, sortBy, sortOrder]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSuggestionPress = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    searchInputRef.current?.blur();
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleCategoryPress = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory('');
    setShowSubcategories('');
    setFilters(prev => ({ ...prev, category }));

    // Clear search when selecting a category
    if (category !== 'All') {
      setSearchQuery('');
    }
  };

  const handleSubcategoryPress = (subcategory: string) => {
    setSelectedSubcategory(subcategory);
    setShowSubcategories('');
    // For now, we'll filter by crop name containing the subcategory
    // In a real app, you'd have subcategory mapping in your data
    setSearchQuery(subcategory);
  };

  const toggleSubcategories = (category: string) => {
    if (showSubcategories === category) {
      setShowSubcategories('');
    } else {
      setShowSubcategories(category);
    }
  };

  const clearFilters = () => {
    setFilters({
      category: 'All',
      priceRange: { min: 0, max: Infinity },
      location: 'All'
    });
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedSubcategory('');
    setShowSubcategories('');
  };

  const refreshPrices = async () => {
    setRefreshing(true);
    try {
      if (isOnline) {
        const backendUrl = serverManager.getBackendEndpoint() || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/mandis`);

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const result = await response.json();

        let newPrices = [];
        if (result.status === 'success' && result.data && result.data.length > 0) {
          // We have real data from MongoDB
          // Add unique _ids if they don't have them
          newPrices = result.data.map((item: any) => ({
            _id: item._id || Math.random().toString(36).substr(2, 9),
            crop: item.crop,
            location: item.mandi || item.location,
            price: item.modalPrice || item.price || 0,
            minPrice: item.minPrice,
            maxPrice: item.maxPrice,
            date: item.date || new Date().toISOString(),
            category: item.category || 'Vegetables',
            unit: item.unit || 'Quintal',
            change: item.change || 0,
            changePercent: item.changePercent || 0
          }));
        } else {
          newPrices = MOCK_MANDI_PRICES;
        }

        setPrices(newPrices);
        setFilteredPrices(newPrices);

        // Cache the new data
        await offlineStorage.cacheMandiPrices(newPrices);
        setLastSync(new Date());
      } else {
        // Load from cache when offline
        const cachedPrices = await offlineStorage.getCachedMandiPrices();
        if (cachedPrices && cachedPrices.length > 0) {
          setPrices(cachedPrices);
          setFilteredPrices(cachedPrices);
        }
      }
    } catch (error) {
      console.error('Error refreshing prices:', error);
      // Fallback to cached data
      const cachedPrices = await offlineStorage.getCachedMandiPrices();
      if (cachedPrices && cachedPrices.length > 0) {
        setPrices(cachedPrices);
        setFilteredPrices(cachedPrices);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return '#22C55E';
    if (change < 0) return '#EF4444';
    return '#6B7280';
  };

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp size={16} color="#22C55E" />;
    if (change < 0) return <TrendingDown size={16} color="#EF4444" />;
    return null;
  };

  const renderPriceCard = ({ item }: { item: MandiPrice }) => {
    const isPinned = pinnedItems.has(`${item.crop}-${item.location}`);

    return (
      <TouchableOpacity
        style={styles.priceCard}
        onPress={() => router.push(`/commodity-details?commodity=${encodeURIComponent(item.crop)}`)}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F0FDF4']}
          style={styles.priceCardGradient}
        >
          <View style={styles.priceCardHeader}>
            <View style={styles.cropInfo}>
              <Text style={styles.cropName}>{item.crop}</Text>
              <View style={styles.locationRow}>
                <MapPin size={16} color="#4CAF50" />
                <Text style={styles.locationText}>{item.location}</Text>
              </View>
            </View>
            <View style={styles.priceCardActions}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
              <TouchableOpacity
                style={styles.pinButton}
                onPress={(e) => {
                  e.stopPropagation();
                  togglePinItem(item);
                }}
              >
                {isPinned ? (
                  <Pin size={18} color="#4CAF50" />
                ) : (
                  <PinOff size={18} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.priceInfo}>
            <View style={styles.priceSection}>
              <Text style={styles.priceValue}>{formatPrice(item.price)}</Text>
              <Text style={styles.priceUnit}>{item.unit}</Text>
            </View>

            {item.change !== undefined && (
              <View style={styles.changeSection}>
                <View style={styles.changeRow}>
                  {getPriceChangeIcon(item.change)}
                  <Text style={[
                    styles.changeText,
                    { color: getPriceChangeColor(item.change) }
                  ]}>
                    {item.change > 0 ? '+' : ''}{formatPrice(Math.abs(item.change))}
                  </Text>
                </View>
                <Text style={[
                  styles.changePercent,
                  { color: getPriceChangeColor(item.change) }
                ]}>
                  {item.change > 0 ? '+' : ''}{item.changePercent?.toFixed(1)}%
                </Text>
              </View>
            )}
          </View>

          <View style={styles.priceCardFooter}>
            <View style={styles.dateRow}>
              <Clock size={14} color="#4CAF50" />
              <Text style={styles.dateText}>{formatDate(item.date)}</Text>
            </View>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.filterModal}>
          <LinearGradient
            colors={['#FFFFFF', '#F0FDF4']}
            style={styles.filterModal}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <X size={24} color="#4CAF50" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterContent}>
              {/* Category Filter */}
              <View style={styles.filterSection}>
                <View style={styles.sectionHeader}>
                  <Leaf size={20} color="#4CAF50" />
                  <Text style={styles.filterLabel}>Category</Text>
                </View>
                <View style={styles.filterOptions}>
                  {CATEGORIES.map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.filterOption,
                        filters.category === category && styles.filterOptionActive
                      ]}
                      onPress={() => handleFilterChange('category', category)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filters.category === category && styles.filterOptionTextActive
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Price Range Filter */}
              <View style={styles.filterSection}>
                <View style={styles.sectionHeader}>
                  <IndianRupee size={20} color="#4CAF50" />
                  <Text style={styles.filterLabel}>Price Range</Text>
                </View>
                <View style={styles.filterOptions}>
                  {PRICE_RANGES.map((range, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.filterOption,
                        filters.priceRange.min === range.min && filters.priceRange.max === range.max && styles.filterOptionActive
                      ]}
                      onPress={() => handleFilterChange('priceRange', { min: range.min, max: range.max })}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filters.priceRange.min === range.min && filters.priceRange.max === range.max && styles.filterOptionTextActive
                      ]}>
                        {range.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Location Filter */}
              <View style={styles.filterSection}>
                <View style={styles.sectionHeader}>
                  <MapPin size={20} color="#4CAF50" />
                  <Text style={styles.filterLabel}>Market Location</Text>
                </View>
                <View style={styles.filterOptions}>
                  {LOCATIONS.map(location => (
                    <TouchableOpacity
                      key={location}
                      style={[
                        styles.filterOption,
                        filters.location === location && styles.filterOptionActive
                      ]}
                      onPress={() => handleFilterChange('location', location)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filters.location === location && styles.filterOptionTextActive
                      ]}>
                        {location}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );

  const renderPinModal = () => {
    if (!showPinModal) return null;

    const categories = pinnedItemsManager.getCategories();

    return (
      <Modal
        visible={!!showPinModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPinModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pinModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pin Item</Text>
              <TouchableOpacity onPress={() => setShowPinModal(null)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.pinModalContent}>
              <View style={styles.pinItemInfo}>
                <Text style={styles.pinItemName}>{showPinModal.crop}</Text>
                <View style={styles.pinItemLocation}>
                  <MapPin size={14} color="#6B7280" />
                  <Text style={styles.pinItemLocationText}>{showPinModal.location}</Text>
                </View>
                <Text style={styles.pinItemPrice}>{formatPrice(showPinModal.price)}</Text>
              </View>

              <View style={styles.categorySelection}>
                <Text style={styles.categorySelectionTitle}>Choose Category</Text>
                <View style={styles.categoryGrid}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryOption,
                        { borderColor: category.color }
                      ]}
                      onPress={() => pinItemWithCategory(showPinModal, category.id)}
                    >
                      <Text style={styles.categoryOptionIcon}>{category.icon}</Text>
                      <Text style={styles.categoryOptionName}>{category.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPinModal(null)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Background Particles */}
      {particlePositions.map((position, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              transform: position.getTranslateTransform(),
              opacity: fadeAnim,
              backgroundColor: index % 2 === 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(46, 125, 50, 0.15)',
              width: 12 + index * 2,
              height: 12 + index * 2,
              borderRadius: 6 + index,
            }
          ]}
        />
      ))}

      <OfflineIndicator
        onSyncPress={refreshPrices}
        showDetails={true}
      />
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header with enhanced animation */}
        <Animated.View style={[
          styles.header,
          {
            transform: [{ scale: headerScaleAnimation }],
          }
        ]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <X size={24} color="#4CAF50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mandi Prices</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => router.push('/price-alerts')}
            >
              <Bell size={24} color="#4CAF50" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.analyticsButton}
              onPress={() => router.push('/market-analytics')}
            >
              <BarChart3 size={24} color="#4CAF50" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.comparisonButton}
              onPress={() => router.push('/price-comparison')}
            >
              <GitCompare size={24} color="#4CAF50" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pinnedButton}
              onPress={() => router.push('/pinned-items')}
            >
              <Pin size={24} color="#4CAF50" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.alertsButton}
              onPress={() => router.push('/alerts-notifications')}
            >
              <Bell size={24} color="#4CAF50" />
              {unreadNotifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={refreshPrices}
            >
              <RefreshCw size={24} color="#4CAF50" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Main Content - Mandi Cards */}
        <View style={{ flex: 1, padding: 16 }}>
          {loadingNearest ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={{ marginTop: 16, color: '#666' }}>Finding nearest mandis...</Text>
            </View>
          ) : locationError ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#EF4444', textAlign: 'center', marginBottom: 16 }}>{locationError}</Text>
              <TouchableOpacity
                style={{ backgroundColor: '#4CAF50', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
                onPress={fetchNearestMandis}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {nearestMandis.map((mandi, index) => (
                <MandiCard key={index} mandi={mandi} />
              ))}
            </ScrollView>
          )}
        </View>
      </Animated.View>
      {renderFilterModal()}
      {renderPinModal()}

      {/* Floating AI Button (Living Orb) */}
      <TouchableOpacity
        style={[styles.floatingAIButton, { backgroundColor: 'transparent', elevation: 0, shadowColor: 'transparent', padding: 0 }]}
        onPress={() => {
          setShowAIModal(true);
          if (conversation.length === 0 && !aiHasGreeted) {
            setAiHasGreeted(true);
            generateMandiAdvice("", true); // Auto-start with proactive greeting
          }
        }}
        activeOpacity={0.8}
      >
        <AnimatedOrb isListening={false} isSpeaking={isAiThinking} size={50} />
      </TouchableOpacity>

      {/* AI Assistant Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAIModal}
        onRequestClose={() => setShowAIModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.aiModalContent}>
            <View style={styles.aiModalHeader}>
              <View style={styles.aiTitleContainer}>
                <Bot size={24} color="#4CAF50" />
                <Text style={styles.aiModalTitle}>Krushi Market AI</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAIModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.chatScroll} contentContainerStyle={{ paddingBottom: 20 }}>

              {/* Conversation History */}
              {conversation.map((msg, idx) => (
                <View key={idx} style={[
                  styles.messageBubble,
                  msg.role === 'user' ? styles.userBubble : styles.aiBubble
                ]}>
                  <Text style={[
                    styles.messageText,
                    msg.role === 'user' ? styles.userMessageText : styles.aiMessageText
                  ]}>{msg.text}</Text>
                </View>
              ))}

              {/* Real-time Streaming Response */}
              {isAiThinking && (
                <View style={[styles.messageBubble, styles.aiBubble]}>
                  {aiResponse ? (
                    <Text style={styles.aiMessageText}>{aiResponse}</Text>
                  ) : (
                    <Text style={styles.thinkingText}>Thinking...</Text>
                  )}
                </View>
              )}
            </ScrollView>

            <View style={styles.inputArea}>
              <TextInput
                style={styles.aiInput}
                placeholder="Ask about prices, trends, or advice..."
                value={aiMessage}
                onChangeText={setAiMessage}
                onSubmitEditing={handleSendAiMessage}
              />
              <TouchableOpacity style={styles.sendButton} onPress={handleSendAiMessage}>
                <Send size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  particle: {
    position: 'absolute',
    zIndex: 0,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  alertButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  analyticsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  comparisonButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  pinnedButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  alertsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  magicIcon: {
    marginLeft: 12,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 65,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  categoryContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  categoryScroll: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    marginRight: 16,
    position: 'relative',
  },
  categoryCard: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryCardActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  categoryNameActive: {
    color: '#FFFFFF',
  },
  subcategoryToggle: {
    padding: 4,
  },
  subcategoryContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
    paddingVertical: 8,
  },
  subcategoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  subcategoryItemActive: {
    backgroundColor: '#F0F9FF',
  },
  subcategoryText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  subcategoryTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F8E9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F8E9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginRight: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  sortOrderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  resultsText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  activeFilterText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
    marginRight: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  priceList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  priceCard: {
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  priceCardGradient: {
    padding: 24,
    borderRadius: 20,
  },
  priceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  priceCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pinButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cropInfo: {
    flex: 1,
  },
  cropName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  categoryBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  categoryText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  priceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  priceSection: {
    flex: 1,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  priceUnit: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  changeSection: {
    alignItems: 'flex-end',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  changeText: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  changePercent: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  priceCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterOption: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterOptionActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  // Pin Modal Styles
  pinModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  pinModalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  pinItemInfo: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pinItemName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  pinItemLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pinItemLocationText: {
    marginLeft: 6,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  pinItemPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  categorySelection: {
    marginBottom: 16,
  },
  categorySelectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryOptionIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  categoryOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  // AI Assistant Styles
  floatingAIButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 100,
  },
  floatingAIButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiModalContent: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  aiModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
  },
  aiTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  chatScroll: {
    flex: 1,
    marginBottom: 12,
  },
  aiWelcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  aiWelcomeText: {
    fontSize: 13,
    color: '#B45309',
    flex: 1,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#4CAF50',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: '#1F2937',
  },
  thinkingText: {
    color: '#6B7280',
    fontStyle: 'italic',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  aiInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#1F2937',
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
