import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { api } from '../../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPassword() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email) return Alert.alert('Erreur', 'Veuillez entrer votre email');

        setLoading(true);
        try {
            await api.forgotPassword(email);
            // We pass the email to the next screen to pre-fill it
            router.push({ pathname: '/(auth)/reset-password', params: { email } });
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
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Réinitialisation</Text>
                    <Text style={styles.subtitle}>Entrez votre email pour recevoir un code.</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Votre email"
                            placeholderTextColor={COLORS.textSecondary}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>
                        <Text style={styles.buttonText}>{loading ? 'Envoi...' : 'Envoyer le code'}</Text>
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
    backButton: { marginBottom: SPACING.m },
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
