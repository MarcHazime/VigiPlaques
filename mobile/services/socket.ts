import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';

import Constants from 'expo-constants';

const getBaseUrl = () => {
    if (__DEV__) {
        if (Platform.OS === 'web') return 'http://localhost:3000';

        const debuggerHost = Constants.expoConfig?.hostUri;
        const localhost = debuggerHost?.split(':')[0];

        if (!localhost) {
            return 'http://localhost:3000';
        }

        return `http://${localhost}:3000`;
    }

    return 'https://vigiplaques-production.up.railway.app';
};

export const socket: Socket = io(getBaseUrl(), {
    autoConnect: false,
});
