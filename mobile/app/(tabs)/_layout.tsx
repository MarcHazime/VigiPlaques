import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Alert, Platform } from 'react-native';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../context/auth';
import { socket } from '../../services/socket';

export default function TabLayout() {
    const router = useRouter();
    const { signOut } = useAuth();

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
