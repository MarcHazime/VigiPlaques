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

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();
    const segments = useSegments();
    const navigationState = useRootNavigationState();

    const signIn = (userData: User) => {
        setUser(userData);
        router.replace('/(tabs)/search');
    };

    const signOut = () => {
        setUser(null);
        router.replace('/(auth)/login');
    };

    useEffect(() => {
        if (!navigationState?.key) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!user && !inAuthGroup) {
            // Redirect to login if not authenticated
            // Use setTimeout to ensure navigation is ready
            setTimeout(() => {
                router.replace('/(auth)/login');
            }, 0);
        } else if (user && inAuthGroup) {
            // Redirect to tabs if already authenticated
            setTimeout(() => {
                router.replace('/(tabs)/search');
            }, 0);
        }
    }, [user, segments, navigationState?.key]);

    return (
        <AuthContext.Provider value={{ user, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}
