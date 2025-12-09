import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, RefreshControl, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/auth';

export default function Chats() {
    const { user } = useAuth();
    const [chats, setChats] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (user) {
            loadChats();
        }
    }, [user]);

    const loadChats = async () => {
        if (!user) return;
        try {
            const data = await api.getUserChats(user.id);
            setChats(data);
        } catch (error) {
            console.error(error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadChats();
        setRefreshing(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Discussions</Text>
            </View>
            <FlatList
                data={chats}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubbles-outline" size={64} color={COLORS.textSecondary} />
                        <Text style={styles.emptyText}>Aucune discussion pour le moment</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.item}
                        onPress={() => router.push(`/chat/${item.id}`)}
                        onLongPress={() => {
                            Alert.alert(
                                "Supprimer la conversation",
                                `Voulez-vous supprimer les messages avec ${item.plate} ?`,
                                [
                                    { text: "Annuler", style: "cancel" },
                                    {
                                        text: "Supprimer",
                                        style: "destructive",
                                        onPress: async () => {
                                            try {
                                                await api.deleteConversation(user?.id!, item.id);
                                                loadChats();
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
                            <Text style={styles.avatarText}>{item.plate.substring(0, 2)}</Text>
                        </View>
                        <View style={styles.itemContent}>
                            <Text style={styles.plate}>{item.plate}</Text>
                            <Text style={styles.subtitle}>Appuyez pour voir la conversation</Text>
                        </View>
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
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
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
        marginBottom: 4,
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
        marginTop: SPACING.m,
        fontSize: 16,
        color: COLORS.textSecondary,
    },
});
