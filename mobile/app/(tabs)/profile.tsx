import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ScrollView } from 'react-native';
import { useState } from 'react';
import { useAuth } from '../../context/auth';
import { api } from '../../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function Profile() {
    const { user, signIn, signOut } = useAuth();
    const [plate, setPlate] = useState(user?.plate || '');
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const updates: any = {};
            if (plate !== user.plate) updates.plate = plate;
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
                <View style={styles.header}>
                    <Text style={styles.title}>Mon Profil</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Immatriculation</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="car-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            value={plate}
                            onChangeText={setPlate}
                            autoCapitalize="characters"
                            placeholder="XX-123-XX"
                        />
                    </View>

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
                        />
                    </View>

                    <Text style={styles.label}>Nouveau mot de passe (laisser vide pour garder l'actuel)</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            placeholder="Nouveau mot de passe"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleUpdate}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>{loading ? 'Mise à jour...' : 'Enregistrer'}</Text>
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
