import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '../../context/auth';
import { api } from '../../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function VerifyEmail() {
    const router = useRouter();
    const params = useLocalSearchParams<{ userId: string; email: string }>();
    const { signIn } = useAuth();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleVerify = async () => {
        if (code.length < 6) {
            setError('Code incomplet');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await api.verifyEmail(params.userId, code);
            // Sign in with the user data returned
            // Note: Verify endpoint returns { userId, plate, email }
            // Auth context expects { id, plate, email } or similar depending on implementation
            // Let's assume signIn takes { id, plate, email }
            signIn({
                id: response.userId,
                plate: response.plate,
                email: response.email
            });
            // Router replace happens in signIn usually? Or we might need to manual redirect if signIn doesn't auto-redirect
            // Usually auth state change triggers navigation.
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={COLORS.primaryGradient}
                style={styles.background}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.card}>
                    <View style={styles.header}>
                        <Ionicons name="mail-open-outline" size={64} color={COLORS.primary} style={{ marginBottom: SPACING.m }} />
                        <Text style={styles.title}>Vérification</Text>
                        <Text style={styles.subtitle}>Un code a été envoyé à {params.email}</Text>
                    </View>

                    <View style={styles.form}>
                        {error ? <View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View> : null}

                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="000000"
                                placeholderTextColor={COLORS.textSecondary}
                                value={code}
                                onChangeText={setCode}
                                keyboardType="number-pad"
                                maxLength={6}
                                textAlign="center"
                            />
                        </View>

                        <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
                            <LinearGradient
                                colors={COLORS.primaryGradient}
                                style={styles.buttonGradient}
                            >
                                <Text style={styles.buttonText}>{loading ? 'Vérification...' : 'Valider'}</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.resendButton} onPress={() => {/* Implement Resend */ }}>
                            <Text style={styles.resendText}>Renvoyer le code</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: '40%',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: SPACING.l,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.l,
        padding: SPACING.xl,
        ...SHADOWS.medium,
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.m,
        marginBottom: SPACING.l,
        borderWidth: 1,
        borderColor: COLORS.primary,
        height: 64,
        justifyContent: 'center',
    },
    input: {
        fontSize: 32,
        color: COLORS.text,
        fontWeight: 'bold',
        letterSpacing: 8,
        textAlign: 'center',
        width: '100%',
    },
    button: {
        height: 56,
        borderRadius: RADIUS.m,
        marginBottom: SPACING.m,
        overflow: 'hidden',
        ...SHADOWS.small,
    },
    buttonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: COLORS.surface,
        fontSize: 18,
        fontWeight: 'bold',
    },
    errorContainer: {
        backgroundColor: '#FEF2F2',
        padding: SPACING.s,
        borderRadius: RADIUS.s,
        marginBottom: SPACING.m,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    errorText: {
        color: COLORS.error,
        textAlign: 'center',
    },
    resendButton: {
        alignItems: 'center',
        padding: SPACING.s,
    },
    resendText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    }
});
