import { Stack } from "expo-router";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { TamaguiProvider } from "tamagui";
import { AuthProvider } from "../contexts/AuthContext";
import { TransferNotificationsProvider } from "../contexts/TransferNotificationsContext";
import tamaguiConfig from "../tamagui.config";

// Import CSS after other imports
// import "../global.css";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Force a re-render when color scheme changes
  }, [colorScheme]);

  return (
    <TamaguiProvider config={tamaguiConfig}>
      <AuthProvider>
        <TransferNotificationsProvider>
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(app)" options={{ headerShown: false }} />
          </Stack>
        </TransferNotificationsProvider>
      </AuthProvider>
    </TamaguiProvider>
  );
}
