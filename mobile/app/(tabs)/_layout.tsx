import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Alert, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../context/auth';
import { socket } from '../../services/socket';

export default function TabLayout() {
    const router = useRouter();
    const { signOut, user } = useAuth();
    const [totalUnread, setTotalUnread] = useState(0);

    // Poll for unread messages count every 5 seconds or when focused
    useEffect(() => {
        if (!user) return;

        const checkUnread = async () => {
            try {
                const chats = await api.getUserChats(user.id);
                // Calculate total unread
                // chats is an array of objects with unreadCount
                // But getUserChats returns "any". Let's assume it has unreadCount.
                const count = chats.reduce((acc: number, chat: any) => acc + (chat.unreadCount || 0), 0);
                setTotalUnread(count);
            } catch (error) {
                // ignore
            }
        };

        checkUnread();
        const interval = setInterval(checkUnread, 5000);
        return () => clearInterval(interval);
    }, [user]);

    const handleLogout = () => {
        if (Platform.OS === 'web') {
            if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
                socket.disconnect();
                signOut();
            }
        } else {
            Alert.alert(
                "Déconnexion",
                "Êtes-vous sûr de vouloir vous déconnecter ?",
                [
                    { text: "Annuler", style: "cancel" },
                    {
                        text: "Se déconnecter",
                        style: "destructive",
                        onPress: () => {
                            socket.disconnect();
                            signOut();
                        }
                    }
                ]
            );
        }
    };

    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: COLORS.primary,
            tabBarStyle: { borderTopColor: COLORS.border },
            headerShown: true,
            headerRight: () => (
                <TouchableOpacity onPress={handleLogout} style={{ marginRight: 16 }}>
                    <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
                </TouchableOpacity>
            ),
        }}>
            <Tabs.Screen
                name="search"
                options={{
                    title: 'Recherche',
                    tabBarIcon: ({ color }) => <Ionicons name="search" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="chats"
                options={{
                    title: 'Discussions',
                    tabBarIcon: ({ color }) => <Ionicons name="chatbubbles" size={24} color={color} />,
                    // We need a way to pass badge count here. 
                    // Since _layout is parent, we might need a Context or just a simple interval fetch for now.
                    // For simplicity in this iteration, let's use a context approach or just remove badge from tab 
                    // and rely on the list view badge, OR implement a simple poller here.
                    // Let's implement a simple poller for the global badge.
                    tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profil',
                    tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
