import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { socket } from '../../services/socket';
import { api } from '../../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/auth';
import * as ImagePicker from 'expo-image-picker';

export default function Chat() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [partnerPlate, setPartnerPlate] = useState('');
    const [uploading, setUploading] = useState(false);
    const [isBlockedByMe, setIsBlockedByMe] = useState(false);
    const [isBlockedByPartner, setIsBlockedByPartner] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const router = useRouter();

    useEffect(() => {
        if (!id || !user) return;

        // Fetch partner details
        const fetchPartner = async () => {
            try {
                const partner = await api.getUserById(id);
                setPartnerPlate(partner.plate);
            } catch (error) {
                console.error('Error fetching partner:', error);
                setPartnerPlate('Unknown User');
            }
        };

        // Check block status
        const checkBlock = async () => {
            try {
                const status = await api.getBlockStatus(user.id, id);
                setIsBlockedByMe(status.blockedByMe);
                setIsBlockedByPartner(status.blockedByOther);
            } catch (error) {
                console.error('Error checking block status:', error);
            }
        };

        fetchPartner();
        checkBlock();

        // Connect socket
        socket.connect();
        const room = [user.id, id].sort().join('_');
        socket.emit('join_chat', room);

        // Load history
        loadHistory();

        // Listen for messages
        socket.on('receive_message', (message) => {
            setMessages((prev) => {
                const exists = prev.some(m => m.id === message.id || (m.tempId && m.tempId === message.tempId));
                if (exists) return prev;
                return [...prev, message];
            });
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        });

        socket.on('message_error', (data) => {
            // alert(data.error); // Removed alert as requested
            console.log("Message error: ", data.error);
        });

        return () => {
            socket.off('receive_message');
            socket.off('message_error');
            socket.disconnect();
        };
    }, [id, user]);

    const loadHistory = async () => {
        if (!user || !id) return;
        try {
            const history = await api.getChatHistory(user.id, id);
            setMessages(history);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
        } catch (error) {
            console.error(error);
        }
    };

    const handleOptions = () => {
        Alert.alert(
            "Options",
            `Action pour ${partnerPlate}`,
            [
                {
                    text: isBlockedByMe ? "Débloquer" : "Bloquer",
                    onPress: isBlockedByMe ? handleUnblock : handleBlock,
                    style: isBlockedByMe ? 'default' : 'destructive'
                },
                {
                    text: "Supprimer la conversation",
                    onPress: handleDeleteConversation,
                    style: 'destructive'
                },
                { text: "Annuler", style: "cancel" }
            ]
        );
    };

    const handleBlock = async () => {
        if (!user || !id) return;
        try {
            await api.blockUser(user.id, id);
            setIsBlockedByMe(true);
            Alert.alert("Succès", `${partnerPlate} a été bloqué.`);
        } catch (error) {
            Alert.alert("Erreur", "Impossible de bloquer l'utilisateur.");
        }
    };

    const handleUnblock = async () => {
        if (!user || !id) return;
        try {
            await api.unblockUser(user.id, id);
            setIsBlockedByMe(false);
            Alert.alert("Succès", `${partnerPlate} a été débloqué.`);
        } catch (error) {
            Alert.alert("Erreur", "Impossible de débloquer l'utilisateur.");
        }
    };

    const handleDeleteConversation = async () => {
        if (!user || !id) return;
        Alert.alert(
            "Confirmation",
            "Voulez-vous vraiment supprimer cette conversation pour vous ? L'autre utilisateur conservera son historique.",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.deleteConversation(user.id, id);
                            router.back();
                        } catch (error) {
                            Alert.alert("Erreur", "Impossible de supprimer la conversation.");
                        }
                    }
                }
            ]
        );
    };

    const sendMessage = (content: string, imageUrl?: string) => {
        if ((!content.trim() && !imageUrl) || !user || !id) return;
        if (isBlockedByMe) {
            Alert.alert("Action impossible", "Vous avez bloqué cet utilisateur. Débloquez-le pour répondre.");
            return;
        }

        const tempId = Date.now().toString();
        const message = {
            senderId: user.id,
            receiverId: id,
            content: content,
            imageUrl: imageUrl,
            tempId,
            createdAt: new Date().toISOString()
        };

        setMessages((prev) => [...prev, message]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        socket.emit('send_message', message);
        setInput('');
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            uploadImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri: string) => {
        if (!user || !id) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', {
                uri,
                name: 'photo.jpg',
                type: 'image/jpeg',
            } as any);

            const response = await api.uploadImage(formData);
            sendMessage('', response.imageUrl);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Échec de l\'envoi de l\'image');
        } finally {
            setUploading(false);
        }
    };

    const isBlocked = isBlockedByMe || isBlockedByPartner;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Discussion avec</Text>
                    <Text style={styles.headerSubtitle}>{partnerPlate || 'Chargement...'}</Text>
                </View>
                <TouchableOpacity onPress={handleOptions} style={{ padding: 8 }}>
                    <Ionicons name="ellipsis-vertical" size={24} color={COLORS.text} />
                </TouchableOpacity>
            </View>

            {isBlockedByMe && (
                <View style={{ backgroundColor: '#FEF2F2', padding: 8, alignItems: 'center' }}>
                    <Text style={{ color: COLORS.error, fontSize: 12 }}>Vous avez bloqué cet utilisateur</Text>
                </View>
            )}

            {isBlockedByPartner && (
                <View style={{ backgroundColor: '#FEF2F2', padding: 8, alignItems: 'center' }}>
                    <Text style={{ color: COLORS.error, fontSize: 12 }}>Cet utilisateur vous a bloqué</Text>
                </View>
            )}

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item, index) => item.id || index.toString()}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                    const isMe = item.senderId === user?.id;
                    const imageUrl = item.imageUrl ? api.getUploadUrl(item.imageUrl) : null;

                    return (
                        <View style={[
                            styles.messageWrapper,
                            isMe ? styles.sentWrapper : styles.receivedWrapper
                        ]}>
                            <View style={[
                                styles.message,
                                isMe ? styles.sent : styles.received
                            ]}>
                                {imageUrl && (
                                    <Image
                                        source={{ uri: imageUrl }}
                                        style={styles.messageImage}
                                        resizeMode="cover"
                                    />
                                )}
                                {item.content ? (
                                    <Text style={[
                                        styles.messageText,
                                        isMe ? styles.sentText : styles.receivedText
                                    ]}>{item.content}</Text>
                                ) : null}
                            </View>
                        </View>
                    );
                }}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={[styles.inputContainer, isBlocked && { opacity: 0.5 }]}>
                    <TouchableOpacity
                        style={styles.attachButton}
                        onPress={pickImage}
                        disabled={uploading || isBlocked}
                    >
                        {uploading ? (
                            <ActivityIndicator size="small" color={COLORS.textSecondary} />
                        ) : (
                            <Ionicons name="image" size={24} color={COLORS.primary} />
                        )}
                    </TouchableOpacity>

                    <TextInput
                        style={styles.input}
                        value={input}
                        onChangeText={setInput}
                        placeholder={isBlockedByMe ? "Vous avez bloqué cet utilisateur" : isBlockedByPartner ? "Cet utilisateur vous a bloqué" : "Écrire un message..."}
                        placeholderTextColor={COLORS.textSecondary}
                        multiline
                        editable={!isBlocked}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, (!input.trim() || isBlocked) && styles.sendButtonDisabled]}
                        onPress={() => sendMessage(input)}
                        disabled={!input.trim() || isBlocked}
                    >
                        <Ionicons name="send" size={20} color={COLORS.surface} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        marginRight: SPACING.m,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    headerSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    listContent: {
        padding: SPACING.m,
    },
    messageWrapper: {
        marginBottom: SPACING.s,
        flexDirection: 'row',
    },
    sentWrapper: {
        justifyContent: 'flex-end',
    },
    receivedWrapper: {
        justifyContent: 'flex-start',
    },
    message: {
        padding: SPACING.m,
        borderRadius: RADIUS.l,
        maxWidth: '80%',
        ...SHADOWS.small,
    },
    sent: {
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 2,
    },
    received: {
        backgroundColor: COLORS.surface,
        borderBottomLeftRadius: 2,
    },
    messageText: {
        fontSize: 16,
    },
    sentText: {
        color: COLORS.surface,
    },
    receivedText: {
        color: COLORS.text,
    },
    messageImage: {
        width: 200,
        height: 150,
        borderRadius: RADIUS.m,
        marginBottom: SPACING.s,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    attachButton: {
        marginRight: SPACING.m,
        padding: SPACING.s,
    },
    input: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.l,
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        fontSize: 16,
        color: COLORS.text,
        maxHeight: 100,
        marginRight: SPACING.m,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: COLORS.textSecondary,
        opacity: 0.5,
    },
});
