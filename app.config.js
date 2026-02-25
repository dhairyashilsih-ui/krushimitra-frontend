import 'dotenv/config';

export default {
    expo: {
        name: "KrushiMitra",
        slug: "krushimitra",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        scheme: "myapp",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,
        ios: {
            supportsTablet: true
        },
        web: {
            bundler: "metro",
            output: "single",
            favicon: "./assets/images/favicon.png"
        },
        plugins: [
            "expo-router",
            "expo-font",
            "expo-web-browser",
            "expo-speech-recognition"
        ],
        experiments: {
            typedRoutes: true
        },
        extra: {
            router: {},
            eas: {
                projectId: "5462b79c-15e1-46cc-a028-ac26630f44dc"
            },
            // Explicitly pass env vars to extra to ensure they are available
            expoPublicBackendUrl: process.env.EXPO_PUBLIC_BACKEND_URL || "https://krushimitra2-0-backend.onrender.com",
            expoPublicApiUrl: process.env.EXPO_PUBLIC_API_URL || "https://krushimitra2-0-backend.onrender.com"
        },
        android: {
            package: "com.dhairyashilshinde1.boltexponativewind",
            permissions: [
                "READ_PHONE_STATE",
                "READ_SMS",
                "RECEIVE_SMS"
            ]
        }
    }
};
