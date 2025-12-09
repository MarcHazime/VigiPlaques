import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { api } from '../../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ResetPassword() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [email, setEmail] = useState((params.email as string) || '');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (!email || !code || !newPassword) return Alert.alert('Erreur', 'Tout les champs sont requis');

        setLoading(true);
        try {
            await api.resetPassword(email, code, newPassword);
            Alert.alert('Succès', 'Mot de passe modifié !', [
                { text: 'Se connecter', onPress: () => router.push('/(auth)/login') }
            ]);
        } catch (error: any) {
            Alert.alert('Erreur', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Nouveau mot de passe</Text>
                    <Text style={styles.subtitle}>Entrez le code reçu par email à {email}</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Ionicons name="key-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Code (6 chiffres)"
                            placeholderTextColor={COLORS.textSecondary}
                            value={code}
                            onChangeText={setCode}
                            keyboardType="number-pad"
                            maxLength={6}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Nouveau mot de passe"
                            placeholderTextColor={COLORS.textSecondary}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleReset} disabled={loading}>
                        <Text style={styles.buttonText}>{loading ? 'Modification...' : 'Changer le mot de passe'}</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { flex: 1, padding: SPACING.l, justifyContent: 'center' },
    header: { marginBottom: SPACING.xl },
    title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.s },
    subtitle: { fontSize: 16, color: COLORS.textSecondary },
    form: { gap: SPACING.m },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.m,
        paddingHorizontal: SPACING.m,
        height: 56,
        ...SHADOWS.small,
    },
    inputIcon: { marginRight: SPACING.m },
    input: { flex: 1, fontSize: 16, color: COLORS.text, height: '100%' },
    button: {
        backgroundColor: COLORS.primary,
        height: 56,
        borderRadius: RADIUS.m,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.m,
        ...SHADOWS.medium,
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: COLORS.surface, fontSize: 18, fontWeight: 'bold' },
});
