import { theme } from "@/constants/theme";
import { Stack } from "expo-router";
import { TamaguiProvider } from "tamagui";
import { AuthProvider } from "../../contexts/AuthContext";
import tamaguiConfig from "../../tamagui.config";

export default function AppLayout() {
  return (
    <TamaguiProvider config={tamaguiConfig}>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.primary.DEFAULT,
            },
            headerTintColor: theme.colors.text.dark,
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false, title: "Retour" }}
          />
          <Stack.Screen
            name="animal/[id]"
            options={{ title: "Infomartion d'animal" }}
          />
          <Stack.Screen
            name="animal/[id]/vaccinations"
            options={{ title: "Vaccinations" }}
          />
          <Stack.Screen
            name="animal/[id]/vaccinations/edit"
            options={{ title: "Modifier les vaccinations" }}
          />
          <Stack.Screen
            name="animal/[id]/medical-info"
            options={{ title: "Informations médicales" }}
          />
          <Stack.Screen
            name="animal/[id]/medical-info/edit"
            options={{ title: "Modifier les informations médicales" }}
          />
          <Stack.Screen
            name="animal/[id]/gallery"
            options={{ title: "Galerie photos" }}
          />
          <Stack.Screen
            name="animal/[id]/nfc-update"
            options={{ title: "Mettre à jour NFC" }}
          />
          <Stack.Screen
            name="animal/edit/[id]"
            options={{ title: "Modifier un animal" }}
          />
          <Stack.Screen
            name="animal/register"
            options={{ title: "Enregistrer un animal" }}
          />
          <Stack.Screen
            name="animal/change-owner/[id]"
            options={{ title: "Changer de propriétaire" }}
          />
          <Stack.Screen name="map" options={{ title: "Carte des animaux" }} />
          <Stack.Screen
            name="ownership-transfers"
            options={{ title: "Transferts de propriété" }}
          />
          <Stack.Screen
            name="gps-devices"
            options={{ title: "Appareils GPS" }}
          />
          <Stack.Screen
            name="gps-device/[id]"
            options={{ title: "Détails GPS" }}
          />
          <Stack.Screen
            name="profile/edit"
            options={{ title: "Modifier le profil" }}
          />
        </Stack>
      </AuthProvider>
    </TamaguiProvider>
  );
}
