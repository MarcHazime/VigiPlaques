import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseUrl = () => {
    if (__DEV__) {
        if (Platform.OS === 'web') return 'http://localhost:3000/api';

        const debuggerHost = Constants.expoConfig?.hostUri;
        const localhost = debuggerHost?.split(':')[0];

        if (!localhost) {
            return 'http://localhost:3000/api';
        }

        return `http://${localhost}:3000/api`;
    }

    return 'https://vigiplaques-production.up.railway.app/api';
};

const BASE_URL = getBaseUrl();

export const api = {
    async register(plate: string, password: string, email: string) {
        const response = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plate, password, email }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Registration failed');
        }
        return response.json();
    },

    async login(plate: string, password: string) {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plate, password }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }
        return response.json();
    },

    async searchUser(plate: string) {
        const response = await fetch(`${BASE_URL}/users/search?plate=${plate}`);
        if (!response.ok) {
            if (response.status === 404) return null;
            const error = await response.json();
            throw new Error(error.error || 'Search failed');
        }
        return response.json();
    },

    async getChatHistory(userId1: string, userId2: string) {
        const response = await fetch(`${BASE_URL}/chats/history/${userId1}/${userId2}`);
        if (!response.ok) throw new Error('Failed to fetch history');
        return response.json();
    },

    async getUserChats(userId: string) {
        const response = await fetch(`${BASE_URL}/chats/list/${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch user chats');
        }
        return response.json();
    },

    async getUserById(userId: string) {
        const response = await fetch(`${BASE_URL}/users/${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch user');
        }
        return response.json();
    },

    async updateUser(userId: string, data: { plate?: string; email?: string; password?: string }) {
        const response = await fetch(`${BASE_URL}/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Update failed');
        }
        return response.json();
    },

    async deleteUser(userId: string) {
        const response = await fetch(`${BASE_URL}/users/${userId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Delete failed');
        }
        return response.json();
    },

    async updatePushToken(userId: string, pushToken: string) {
        const response = await fetch(`${BASE_URL}/users/${userId}/push-token`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pushToken }),
        });
        if (!response.ok) {
            // fail silently or log
            console.error('Failed to update push token');
        }
        return response.json();
    },

    async getVehicleInfo(plate: string) {
        const response = await fetch(`${BASE_URL}/siv/${plate}`);
        if (!response.ok) {
            throw new Error('Failed to fetch vehicle info');
        }
        return response.json();
    },

    async scanPlate(formData: FormData) {
        console.log('Scanning plate at:', `${BASE_URL}/siv/scan`);
        const response = await fetch(`${BASE_URL}/siv/scan`, {
            method: 'POST',
            body: formData,
            // Do NOT set Content-Type header for FormData, let fetch handle it with boundary
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Scan failed');
        }
        return response.json();
    },

    async uploadImage(formData: FormData) {
        const response = await fetch(`${BASE_URL}/chats/upload`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }
        return response.json();
    },

    getUploadUrl(path: string) {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        // BASE_URL is http://host:3000/api, we need http://host:3000
        const rootUrl = BASE_URL.replace('/api', '');
        return `${rootUrl}${path}`;
    }
};
