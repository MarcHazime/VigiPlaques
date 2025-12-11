import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, RefreshControl, Alert, ScrollView } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useFocusEffect, useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/auth';

export default function Chats() {
    const { user } = useAuth();
    const [chats, setChats] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [selectedPlate, setSelectedPlate] = useState<string>('');
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            if (user) {
                loadData();
            }
        }, [user])
    );

    const loadData = async () => {
        if (!user) return;
        try {
            // Load vehicles and chats in parallel
            const [vData, cData] = await Promise.all([
                api.getVehicles(user.id),
                api.getUserChats(user.id)
            ]);

            setVehicles(vData);
            setChats(cData);

            // Set initial selected plate if not set
            if (!selectedPlate && vData.length > 0) {
                const primary = vData.find((v: any) => v.isPrimary);
                setSelectedPlate(primary ? primary.plate : vData[0].plate);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const filteredChats = chats.filter(c => c.myScope === selectedPlate);

    return (
        <SafeAreaView style={styles.container}>


            {/* Vehicle Tabs */}
            {vehicles.length > 0 && (
                <View style={styles.tabsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
                        {vehicles.map((v) => (
                            <TouchableOpacity
                                key={v.id}
                                style={[styles.tab, selectedPlate === v.plate && styles.tabActive]}
                                onPress={() => setSelectedPlate(v.plate)}
                            >
                                <Text style={[styles.tabText, selectedPlate === v.plate && styles.tabTextActive]}>
                                    {v.plate} {v.isPrimary && '★'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            <FlatList
                data={filteredChats}
                keyExtractor={(item) => `${item.id}_${item.relatedPlate}`}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubbles-outline" size={64} color={COLORS.textSecondary} />
                        <Text style={styles.emptyText}>Aucune discussion pour ce véhicule</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.item}
                        onPress={() => router.push(`/chat/${item.partnerId}?relatedPlate=${item.relatedPlate}`)}
                        onLongPress={() => {
                            Alert.alert(
                                "Supprimer la conversation",
                                `Voulez-vous supprimer cette conversation ?`,
                                [
                                    { text: "Annuler", style: "cancel" },
                                    {
                                        text: "Supprimer",
                                        style: "destructive",
                                        onPress: async () => {
                                            try {
                                                await api.deleteConversation(user?.id!, item.partnerId);
                                                loadData();
                                            } catch (error) {
                                                console.error(error);
                                            }
                                        }
                                    }
                                ]
                            );
                        }}
                    >
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{item.otherDisplay.substring(0, 2)}</Text>
                        </View>
                        <View style={styles.itemContent}>
                            <Text style={styles.plate}>{item.otherDisplay}</Text>
                            <Text style={[
                                styles.subtitle,
                                item.unreadCount > 0 && { fontWeight: 'bold', color: COLORS.text }
                            ]} numberOfLines={1}>{item.lastMessage || 'Appuyez pour voir'}</Text>
                        </View>
                        {item.unreadCount > 0 && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadText}>{item.unreadCount}</Text>
                            </View>
                        )}
                        <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        padding: SPACING.l,
        backgroundColor: COLORS.surface,
        ...SHADOWS.small,
        zIndex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    tabsContainer: {
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    tabsContent: {
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        gap: SPACING.s,
    },
    tab: {
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    tabActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    tabTextActive: {
        color: COLORS.surface,
    },
    listContent: {
        padding: SPACING.m,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: RADIUS.m,
        marginBottom: SPACING.m,
        ...SHADOWS.small,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: RADIUS.full,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.m,
    },
    avatarText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 18,
    },
    itemContent: {
        flex: 1,
    },
    plate: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 2,
    },
    contextLabel: {
        fontSize: 12,
        color: COLORS.primary,
        marginBottom: 2,
        fontWeight: '500',
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: SPACING.xl * 2,
    },
    emptyText: {
        color: COLORS.textSecondary,
    },
    unreadBadge: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.full,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.s,
    },
    unreadText: {
        color: COLORS.surface,
        fontSize: 12,
        fontWeight: 'bold',
    },
});
