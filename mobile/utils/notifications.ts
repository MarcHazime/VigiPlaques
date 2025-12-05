import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Safely setup handler, might fail in Expo Go
try {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true
        }),
    });
} catch (error) {
    console.warn('Failed to set notification handler (likely Expo Go limitation):', error);
}

export async function registerForPushNotificationsAsync() {
    // Check if running in Expo Go
    if (Constants.appOwnership === 'expo') {
        console.log('Skipping Push Notification registration (not supported in Expo Go)');
        return null;
    }

    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            alert('Failed to get push token for push notification!');
            return;
        }

        try {
            const projectId =
                Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
            if (!projectId) {
                // throw new Error('Project ID not found');
            }

            token = (await Notifications.getExpoPushTokenAsync({
                projectId,
            })).data;
        } catch (e) {
            token = `${e}`;
            console.error('Error getting push token:', e);
        }
    } else {
        alert('Must use physical device for Push Notifications');
    }

    return token;
}
