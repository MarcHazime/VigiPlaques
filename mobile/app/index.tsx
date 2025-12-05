import { Redirect } from 'expo-router';

export default function Index() {
    // TODO: Check auth state
    return <Redirect href="/(auth)/login" />;
}
