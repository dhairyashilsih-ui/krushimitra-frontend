import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, TrendingUp, Calendar, MapPin, Share2, Download } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function MandiReportScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { mandiName, distance } = params;

    const [date] = useState(new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }));

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
                            <Text style={styles.badgeText}>{date}</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.summaryCard}>
                    <Text style={styles.sectionTitle}>Daily Summary</Text>
                    <View style={styles.summaryStats}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Total Arrivals</Text>
                            <Text style={styles.statValue}>1,240 Qtl</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Varieties</Text>
                            <Text style={styles.statValue}>24</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Trend</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TrendingUp size={16} color="#4CAF50" />
                                <Text style={[styles.statValue, { color: '#4CAF50', marginLeft: 4 }]}>+2.4%</Text>
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

                    {MOCK_REPORT_DATA.map((item, index) => (
                        <View key={index} style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
                            <View style={{ flex: 2 }}>
                                <Text style={styles.commodityName}>{item.commodity}</Text>
                                <Text style={styles.commodityVariety}>{item.variety}</Text>
                            </View>
                            <Text style={styles.priceCell}>₹{item.min}</Text>
                            <Text style={styles.priceCell}>₹{item.max}</Text>
                            <Text style={[styles.priceCell, styles.modalPrice]}>₹{item.modal}</Text>
                        </View>
                    ))}
                </View>

                <TouchableOpacity style={styles.downloadButton}>
                    <Download size={20} color="#FFFFFF" />
                    <Text style={styles.downloadText}>Download Report (PDF)</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const MOCK_REPORT_DATA = [
    { commodity: 'Tomato', variety: 'Hybrid-654', min: 2100, max: 2500, modal: 2400 },
    { commodity: 'Onion', variety: 'Nasik Red', min: 1600, max: 2100, modal: 1850 },
    { commodity: 'Potato', variety: 'Indore-3797', min: 1400, max: 1700, modal: 1600 },
    { commodity: 'Wheat', variety: 'Lokwan', min: 2800, max: 3200, modal: 3100 },
    { commodity: 'Soybean', variety: 'Yellow-9560', min: 4200, max: 4800, modal: 4600 },
    { commodity: 'Bajra', variety: 'Hybrid', min: 1900, max: 2200, modal: 2100 },
    { commodity: 'Coriander', variety: 'Local', min: 600, max: 1000, modal: 800 },
    { commodity: 'Garlic', variety: 'Desi', min: 8000, max: 11000, modal: 9500 },
    { commodity: 'Green Chilli', variety: 'Pusa Jwala', min: 3500, max: 4500, modal: 4000 },
    { commodity: 'Brinjal', variety: 'Purple Long', min: 1500, max: 2000, modal: 1800 },
];

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
