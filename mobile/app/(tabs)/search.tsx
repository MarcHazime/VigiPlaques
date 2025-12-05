import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView, Image } from 'react-native';
import { useState } from 'react';
import { api } from '../../services/api';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function Search() {
    // Search screen component
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSearch = async () => {
        if (!query) return;
        setLoading(true);
        setError('');
        setResult(null);
        try {
            // Use getVehicleInfo instead of searchUser
            const data = await api.getVehicleInfo(query);
            if (data) {
                setResult(data);
            } else {
                setError('Véhicule non trouvé');
            }
        } catch (err: any) {
            setError(err.message || 'Échec de la récupération des infos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={COLORS.primaryGradient}
                style={styles.headerBackground}
            />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Image
                            source={require('../../assets/images/logo.png')}
                            style={styles.headerLogo}
                            resizeMode="contain"
                        />
                        <Text style={styles.title}>VigiPlaque</Text>
                    </View>

                    <View style={styles.searchContainer}>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Plaque (ex: AA-123-BB)"
                                placeholderTextColor={COLORS.textSecondary}
                                value={query}
                                onChangeText={setQuery}
                                autoCapitalize="characters"
                                onSubmitEditing={handleSearch}
                            />
                        </View>

                        <TouchableOpacity onPress={handleSearch}>
                            <LinearGradient
                                colors={COLORS.primaryGradient}
                                style={styles.searchButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Ionicons name="arrow-forward" size={24} color={COLORS.surface} />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {loading && <ActivityIndicator size="large" color={COLORS.surface} style={styles.loader} />}

                    {error ? (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={24} color={COLORS.error} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {result && (
                        <View style={styles.resultCard}>
                            <View style={styles.plateContainer}>
                                <View style={styles.plateIcon}>
                                    <Ionicons name="car-sport" size={24} color={COLORS.primary} />
                                </View>
                                <View>
                                    <Text style={styles.plateLabel}>Immatriculation</Text>
                                    <Text style={styles.plateText}>{result.data?.immatriculation || query}</Text>
                                </View>
                            </View>

                            <View style={styles.detailsContainer}>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Marque</Text>
                                    <Text style={styles.detailText}>{result.data?.marque || 'N/A'}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Modèle</Text>
                                    <Text style={styles.detailText}>{result.data?.modele || 'N/A'}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Carburant</Text>
                                    <Text style={styles.detailText}>{result.data?.energie || 'N/A'}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Année</Text>
                                    <Text style={styles.detailText}>{result.data?.date_1er_cir ? result.data.date_1er_cir.split('-')[0] : 'N/A'}</Text>
                                </View>
                            </View>

                            {result.registeredUser ? (
                                <TouchableOpacity onPress={() => router.push(`/chat/${result.registeredUser.id}`)}>
                                    <LinearGradient
                                        colors={COLORS.primaryGradient}
                                        style={styles.messageButton}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.surface} style={styles.buttonIcon} />
                                        <Text style={styles.buttonText}>Envoyer un message</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.notRegisteredContainer}>
                                    <Ionicons name="information-circle-outline" size={20} color={COLORS.textSecondary} style={styles.infoIcon} />
                                    <Text style={styles.notRegisteredText}>Ce véhicule n'est pas inscrit sur VigiPlaque.</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    headerBackground: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: 200,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        padding: SPACING.l,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    headerLogo: {
        width: 40,
        height: 40,
        marginRight: SPACING.s,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.surface,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.m,
        paddingHorizontal: SPACING.m,
        marginRight: SPACING.s,
        height: 56,
        ...SHADOWS.medium,
    },
    searchIcon: {
        marginRight: SPACING.s,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
        height: '100%',
    },
    searchButton: {
        width: 56,
        height: 56,
        borderRadius: RADIUS.m,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    loader: {
        marginTop: SPACING.xl,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: RADIUS.m,
        marginTop: SPACING.m,
        ...SHADOWS.small,
    },
    errorText: {
        color: COLORS.error,
        marginLeft: SPACING.s,
        fontSize: 16,
    },
    resultCard: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.l,
        padding: SPACING.l,
        marginTop: SPACING.m,
        ...SHADOWS.medium,
    },
    plateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    plateIcon: {
        width: 48,
        height: 48,
        borderRadius: RADIUS.full,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.m,
    },
    plateLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    plateText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    detailsContainer: {
        marginBottom: SPACING.l,
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.m,
        padding: SPACING.m,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.s,
    },
    detailLabel: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    detailText: {
        color: COLORS.text,
        fontWeight: '600',
        fontSize: 14,
    },
    messageButton: {
        flexDirection: 'row',
        height: 50,
        borderRadius: RADIUS.m,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonIcon: {
        marginRight: SPACING.s,
    },
    buttonText: {
        color: COLORS.surface,
        fontSize: 16,
        fontWeight: 'bold',
    },
    notRegisteredContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        backgroundColor: '#F1F5F9',
        borderRadius: RADIUS.m,
    },
    infoIcon: {
        marginRight: SPACING.s,
    },
    notRegisteredText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        flex: 1,
    },
});
