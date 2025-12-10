import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ScrollView, FlatList } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/auth';
import { api } from '../../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

import { formatPlate } from '../../utils/formatting';

export default function Profile() {
    const { user, signIn, signOut } = useAuth();
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Vehicle State
    const [vehicles, setVehicles] = useState<{ id: string, plate: string, isPrimary: boolean }[]>([]);
    const [newPlate, setNewPlate] = useState('');
    const [addingVehicle, setAddingVehicle] = useState(false);

    useEffect(() => {
        if (user) {
            loadVehicles();
        }
    }, [user]);

    const loadVehicles = async () => {
        if (!user) return;
        try {
            const v = await api.getVehicles(user.id);
            setVehicles(v);
        } catch (error) {
            console.error('Failed to load vehicles:', error);
        }
    };

    const handleAddVehicle = async () => {
        if (!user || !newPlate) return;
        const PLATE_REGEX = /^[A-Z]{2}-\d{3}-[A-Z]{2}$/;
        if (!PLATE_REGEX.test(newPlate)) {
            Alert.alert('Erreur', 'Format de plaque invalide (ex: AA-123-BB)');
            return;
        }

        setAddingVehicle(true);
        try {
            await api.addVehicle(user.id, newPlate);
            setNewPlate('');
            await loadVehicles();
            Alert.alert('Succès', 'Véhicule ajouté');
        } catch (error: any) {
            Alert.alert('Erreur', error.message);
        } finally {
            setAddingVehicle(false);
        }
    };

    const handleDeleteVehicle = async (vehicleId: string, isPrimary: boolean) => {
        if (!user) return;
        if (isPrimary) {
            Alert.alert('Impossible', 'Vous ne pouvez pas supprimer votre véhicule principal.');
            return;
        }

        Alert.alert(
            'Supprimer véhicule',
            'Êtes-vous sûr ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.deleteVehicle(user.id, vehicleId);
                            loadVehicles();
                        } catch (error: any) {
                            Alert.alert('Erreur', error.message);
                        }
                    }
                }
            ]
        );
    };

    const handleUpdate = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const updates: any = {};
            if (email !== user.email) updates.email = email;
            if (password) updates.password = password;

            if (Object.keys(updates).length === 0) {
                Alert.alert('Aucun changement', 'Vous n\'avez fait aucun changement.');
                setLoading(false);
                return;
            }

            const response = await api.updateUser(user.id, updates);
            signIn({ ...user, ...response.user }); // Update local context
            Alert.alert('Succès', 'Profil mis à jour avec succès');
            setPassword(''); // Clear password field
        } catch (error: any) {
            Alert.alert('Erreur', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Supprimer mon compte',
            'Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible.',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        if (!user) return;
                        try {
                            setLoading(true);
                            await api.deleteUser(user.id);
                            signOut();
                        } catch (error: any) {
                            Alert.alert('Erreur', error.message);
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>


                {/* Section Véhicules */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mes Véhicules</Text>

                    {vehicles.map((v) => (
                        <View key={v.id} style={styles.vehicleItem}>
                            <View style={styles.vehicleInfo}>
                                <Ionicons name="car-sport" size={24} color={COLORS.primary} />
                                <Text style={styles.vehiclePlate}>{v.plate}</Text>
                                {v.isPrimary && <View style={styles.badge}><Text style={styles.badgeText}>Principal</Text></View>}
                            </View>
                            {!v.isPrimary && (
                                <TouchableOpacity onPress={() => handleDeleteVehicle(v.id, v.isPrimary)}>
                                    <Ionicons name="trash-outline" size={24} color={COLORS.error} />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}

                    <View style={styles.addVehicleContainer}>
                        <TextInput
                            style={styles.addInput}
                            value={newPlate}
                            onChangeText={(text) => setNewPlate(formatPlate(text))}
                            placeholder="AA-123-BB"
                            placeholderTextColor={COLORS.textSecondary}
                            autoCapitalize="characters"
                        />
                        <TouchableOpacity
                            style={[styles.addButton, (!newPlate || addingVehicle) && styles.buttonDisabled]}
                            onPress={handleAddVehicle}
                            disabled={!newPlate || addingVehicle}
                        >
                            <Ionicons name="add" size={24} color={COLORS.surface} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.form}>
                    <Text style={styles.sectionTitle}>Mes Infos</Text>

                    <Text style={styles.label}>Email</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            placeholder="email@exemple.com"
                            placeholderTextColor={COLORS.textSecondary}
                        />
                    </View>

                    <Text style={styles.label}>Nouveau mot de passe</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            placeholder="Nouveau mot de passe"
                            placeholderTextColor={COLORS.textSecondary}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleUpdate}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>{loading ? 'Mise à jour...' : 'Enregistrer les modifications'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={handleDeleteAccount}
                        disabled={loading}
                    >
                        <Text style={styles.deleteButtonText}>Supprimer mon compte</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: SPACING.l,
    },
    header: {
        marginBottom: SPACING.xl,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.m,
    },
    vehicleItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: RADIUS.m,
        marginBottom: SPACING.s,
        ...SHADOWS.small,
    },
    vehicleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
    },
    vehiclePlate: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    badge: {
        backgroundColor: COLORS.primary + '20',
        paddingHorizontal: SPACING.s,
        paddingVertical: 2,
        borderRadius: RADIUS.s,
    },
    badgeText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: 'bold',
    },
    addVehicleContainer: {
        flexDirection: 'row',
        gap: SPACING.s,
        marginTop: SPACING.s,
    },
    addInput: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.m,
        paddingHorizontal: SPACING.m,
        height: 50,
        fontSize: 16,
        color: COLORS.text,
        ...SHADOWS.small,
    },
    addButton: {
        width: 50,
        height: 50,
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.m,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    form: {
        gap: SPACING.m,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SPACING.xs,
        marginLeft: SPACING.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.m,
        paddingHorizontal: SPACING.m,
        height: 56,
        marginBottom: SPACING.m,
        ...SHADOWS.small,
    },
    inputIcon: {
        marginRight: SPACING.m,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
        height: '100%',
    },
    button: {
        backgroundColor: COLORS.primary,
        height: 56,
        borderRadius: RADIUS.m,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.m,
        ...SHADOWS.medium,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: COLORS.surface,
        fontSize: 18,
        fontWeight: 'bold',
    },
    deleteButton: {
        marginTop: SPACING.l,
        padding: SPACING.m,
        alignItems: 'center',
    },
    deleteButtonText: {
        color: COLORS.error,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
