import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Pet Tracker",
  slug: "pet-tracker-app",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.yourcompany.pettracker",
    infoPlist: {
      NFCReaderUsageDescription:
        "Cette application utilise le NFC pour scanner les puces d'identification des animaux.",
      NSCameraUsageDescription:
        "Cette application utilise la caméra pour scanner les cartes d'identité.",
      NSPhotoLibraryUsageDescription:
        "Cette application utilise la galerie pour accéder aux photos des animaux.",
      NSLocationWhenInUseUsageDescription:
        "This app needs location access to track your pets' locations.",
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "This app needs background location access to automatically track your pets' locations even when the app is not active.",
      NSLocationAlwaysUsageDescription:
        "This app needs background location access to automatically track your pets' locations.",
      UIBackgroundModes: ["location", "background-processing"],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: "com.yourcompany.pettracker",
    permissions: [
      "NFC",
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE",
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "ACCESS_BACKGROUND_LOCATION",
      "FOREGROUND_SERVICE",
      "WAKE_LOCK",
    ],
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "react-native-nfc-manager",
    [
      "expo-build-properties",
      {
        ios: {
          deploymentTarget: "15.1",
        },
      },
    ],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "Allow Pet Tracker to use your location to track your pets.",
        locationAlwaysPermission:
          "Allow Pet Tracker to use your location in the background to automatically track your pets.",
        locationWhenInUsePermission:
          "Allow Pet Tracker to use your location to track your pets.",
        isIosBackgroundLocationEnabled: true,
        isAndroidBackgroundLocationEnabled: true,
      },
    ],
  ],
  scheme: "pettracker",
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    disableAuth: process.env.EXPO_PUBLIC_DISABLE_AUTH === "true",
    ocrUrl: process.env.EXPO_PUBLIC_OCR_URL,
    eas: {
      projectId: "34e98b78-4e6e-4c29-84de-813197523f2f",
    },
  },
  owner: "jellyouness",
});
