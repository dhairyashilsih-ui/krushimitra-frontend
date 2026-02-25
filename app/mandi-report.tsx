import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, TrendingUp, Calendar, MapPin, Share2, Download, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { serverManager } from '../src/services/serverManager';

interface MandiPriceRecord {
    _id: string;
    mandi: string;
    crop: string;
    minPrice: number;
    maxPrice: number;
    modalPrice: number;
    unit: string;
    date: string;
    variety?: string;
    changePercent?: number;
}

export default function MandiReportScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { mandiName, distance } = params as { mandiName: string, distance: string };

    const [prices, setPrices] = useState<MandiPriceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentDate, setCurrentDate] = useState(
        new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    );

    useEffect(() => {
        if (!mandiName) return;

        const fetchPrices = async () => {
            setLoading(true);
            setError(null);
            try {
                const backendUrl = serverManager.getBackendEndpoint() || 'http://localhost:3001';
                // We use location as query param based on our server.js match logic.
                const response = await fetch(`${backendUrl}/mandiprices?location=${encodeURIComponent(mandiName)}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }

                const result = await response.json();
                if (result.status === 'success') {
                    setPrices(result.data);
                    if (result.data.length > 0 && result.data[0].date) {
                        const maxDate = new Date(Math.max(...result.data.map((p: any) => new Date(p.date).getTime())));
                        if (!isNaN(maxDate.getTime())) {
                            setCurrentDate(maxDate.toLocaleDateString('en-IN', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            }));
                        }
                    }
                } else {
                    throw new Error(result.error?.message || 'Unknown error');
                }
            } catch (err: any) {
                console.error("Error fetching mandi details:", err);
                setError("Could not load market data right now. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchPrices();
    }, [mandiName]);

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#2E7D32', '#4CAF50']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <X size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.actionButton}>
                            <Share2 size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.titleContainer}>
                    <Text style={styles.mandiName}>{mandiName}</Text>
                    <View style={styles.badgeRow}>
                        <View style={styles.badge}>
                            <MapPin size={12} color="#E8F5E9" />
                            <Text style={styles.badgeText}>{distance} km away</Text>
                        </View>
                        <View style={styles.badge}>
                            <Calendar size={12} color="#E8F5E9" />
                            <Text style={styles.badgeText}>{currentDate}</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#4CAF50" />
                        <Text style={styles.loadingText}>Fetching live market prices...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.centerContainer}>
                        <AlertCircle size={48} color="#EF4444" style={{ marginBottom: 16 }} />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => router.replace({ pathname: '/mandi-prices' })}
                        >
                            <Text style={styles.retryButtonText}>Go Back</Text>
                        </TouchableOpacity>
                    </View>
                ) : prices.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <AlertCircle size={48} color="#9CA3AF" style={{ marginBottom: 16 }} />
                        <Text style={styles.errorText}>No recent price data available for {mandiName}.</Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.summaryCard}>
                            <Text style={styles.sectionTitle}>Daily Summary</Text>
                            <View style={styles.summaryStats}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>Commodities</Text>
                                    <Text style={styles.statValue}>{prices.length}</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>Status</Text>
                                    <Text style={[styles.statValue, { color: '#4CAF50' }]}>Active Today</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>Trend</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <TrendingUp size={16} color="#4CAF50" />
                                        <Text style={[styles.statValue, { color: '#4CAF50', marginLeft: 4 }]}>Stable</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={styles.tableContainer}>
                            <Text style={styles.sectionTitle}>Detailed Price Report</Text>

                            <View style={styles.tableHeader}>
                                <Text style={[styles.columnHeader, { flex: 2 }]}>Commodity</Text>
                                <Text style={[styles.columnHeader, { flex: 1, textAlign: 'right' }]}>Min</Text>
                                <Text style={[styles.columnHeader, { flex: 1, textAlign: 'right' }]}>Max</Text>
                                <Text style={[styles.columnHeader, { flex: 1, textAlign: 'right' }]}>Modal</Text>
                            </View>

                            {prices.map((item, index) => (
                                <View key={index} style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
                                    <View style={{ flex: 2 }}>
                                        <Text style={styles.commodityName}>{item.crop}</Text>
                                        <Text style={styles.commodityVariety}>
                                            {item.variety || 'Standard'} • /{item.unit || 'Quintal'}
                                        </Text>
                                    </View>
                                    <Text style={styles.priceCell}>₹{item.minPrice || '--'}</Text>
                                    <Text style={styles.priceCell}>₹{item.maxPrice || '--'}</Text>
                                    <Text style={[styles.priceCell, styles.modalPrice]}>₹{item.modalPrice || '--'}</Text>
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity style={styles.downloadButton}>
                            <Download size={20} color="#FFFFFF" />
                            <Text style={styles.downloadText}>Download Report (PDF)</Text>
                        </TouchableOpacity>
                    </>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        paddingTop: Platform.OS === 'android' ? 40 : 20,
        paddingHorizontal: 20,
        paddingBottom: 30,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContainer: {
        paddingHorizontal: 4,
    },
    mandiName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 12,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    badgeText: {
        color: '#E8F5E9',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    centerContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        marginTop: 20
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500'
    },
    errorText: {
        fontSize: 16,
        color: '#4B5563',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 20
    },
    retryButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#1F2937',
        fontWeight: '600',
        fontSize: 14
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 16,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    summaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    summaryStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: '#E5E7EB',
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    tableContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    tableHeader: {
        flexDirection: 'row',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        marginBottom: 8,
    },
    columnHeader: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    tableRowAlt: {
        backgroundColor: '#F9FAFB',
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    commodityName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 2,
    },
    commodityVariety: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    priceCell: {
        flex: 1,
        fontSize: 15,
        color: '#4B5563',
        textAlign: 'right',
        fontWeight: '500',
    },
    modalPrice: {
        color: '#1F2937',
        fontWeight: '700',
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1F2937',
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    downloadText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});
