import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { TamaguiProvider } from "tamagui";
import TabIconWithBadge from "../../../components/TabIconWithBadge";
import { theme } from "../../../constants/theme";
import tamaguiConfig from "../../../tamagui.config";

export default function AppLayout() {
  return (
    <TamaguiProvider config={tamaguiConfig}>
      <Tabs
        screenOptions={{
          // headerShown: false,
          headerStyle: {
            backgroundColor: theme.colors.primary.DEFAULT,
            // height: 80,
          },
          headerTintColor: theme.colors.text.dark,
          tabBarActiveTintColor: theme.colors.primary.DEFAULT,
          tabBarInactiveTintColor: theme.colors.text.light,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Accueil",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="my-animals"
          options={{
            title: "Mes Animaux",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="paw" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Rechercher",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="search" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="lost-animals"
          options={{
            title: "Perdus",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="warning" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profil",
            tabBarIcon: ({ color, size }) => (
              <TabIconWithBadge
                name="person"
                size={size}
                color={color}
                showBadge={true}
              />
            ),
          }}
        />
      </Tabs>
    </TamaguiProvider>
  );
}
