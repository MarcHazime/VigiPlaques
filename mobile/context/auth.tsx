import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';

type User = {
    id: string;
    plate: string;
    email?: string;
};

type AuthContextType = {
    user: User | null;
    signIn: (user: User) => void;
    signOut: () => void;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    signIn: () => { },
    signOut: () => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const segments = useSegments();
    const navigationState = useRootNavigationState();

    useEffect(() => {
        const loadSession = async () => {
            if (Platform.OS === 'web') {
                setIsLoading(false);
                return;
            }
            try {
                const storedUser = await SecureStore.getItemAsync('user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.error('Failed to load session:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadSession();
    }, []);

    const signIn = (userData: User) => {
        setUser(userData);
        if (Platform.OS !== 'web') {
            SecureStore.setItemAsync('user', JSON.stringify(userData)).catch(console.error);
        }
        router.replace('/(tabs)/search');
    };

    const signOut = () => {
        setUser(null);
        if (Platform.OS !== 'web') {
            SecureStore.deleteItemAsync('user').catch(console.error);
        }
        router.replace('/(auth)/login');
    };

    useEffect(() => {
        if (isLoading) return;
        if (!navigationState?.key) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!user && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
            router.replace('/(tabs)/search');
        }
    }, [user, segments, navigationState?.key, isLoading]);

    return (
        <AuthContext.Provider value={{ user, signIn, signOut }}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
}
