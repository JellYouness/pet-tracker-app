import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, Text } from "tamagui";
import { theme } from "../../../constants/theme";
import { useAuth } from "../../../contexts/AuthContext";
import type { Database } from "../../../lib/supabase";
import { fetchAnimalsWithLocation, supabase } from "../../../lib/supabase";

type Animal = Database["public"]["Tables"]["animals"]["Row"];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [autoTrackingActive, setAutoTrackingActive] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get the current session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/login");
          return;
        }

        // If we have a session but no user in context, wait a bit
        if (!user) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        setIsCheckingAuth(false);
        if (user) {
          await loadData();
        }
      } catch (err) {
        console.error("Error checking auth:", err);
        Alert.alert("Error", "Erreur de vérification d'authentification");
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [animalsData] = await Promise.all([
        fetchAnimalsWithLocation(user!.id),
      ]);
      setAnimals(animalsData);
    } catch (error) {
      console.error("Error loadingdede data:", error);
      console.log("user", user);
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (isCheckingAuth) {
    return (
      <Stack flex={1} justifyContent="center" alignItems="center">
        <Text style={{ color: theme.colors.text.light }}>Vérification...</Text>
      </Stack>
    );
  }

  if (loading) {
    return (
      <Stack flex={1} justifyContent="center" alignItems="center">
        <Text style={{ color: theme.colors.text.light }}>Chargement...</Text>
      </Stack>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background.DEFAULT }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Stack flex={1} backgroundColor="$background" padding="$4">
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions Rapides</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/animal/register")}
            >
              <MaterialCommunityIcons name="plus" size={24} color="#3498db" />
              <Text style={styles.actionText}>Ajouter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/my-animals")}
            >
              <MaterialCommunityIcons name="paw" size={24} color="#f39c12" />
              <Text style={styles.actionText}>Mes Animaux</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/map")}
            >
              <MaterialCommunityIcons name="map" size={24} color="#10b981" />
              <Text style={styles.actionText}>Carte</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/search")}
            >
              <MaterialCommunityIcons
                name="magnify"
                size={24}
                color="#9b59b6"
              />
              <Text style={styles.actionText}>Rechercher</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Auto Location Tracker */}
        {/* <AutoLocationTracker onStatusChange={handleAutoTrackingChange} /> */}

        {/* Animals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="paw" size={24} color="#e74c3c" />
            <Text style={styles.sectionTitle}>Mes Animaux</Text>
            <TouchableOpacity
              style={styles.manageButton}
              onPress={() => router.push("/my-animals")}
            >
              <Text style={styles.manageButtonText}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {animals.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="paw-off" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Aucun animal trouvé</Text>
              <Text style={styles.emptySubtext}>
                Ajoutez votre premier animal pour commencer
              </Text>
              <TouchableOpacity
                style={styles.addPetButton}
                onPress={() => router.push("/animal/register")}
              >
                <Text style={styles.addPetButtonText}>Ajouter un animal</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.animalsGrid}>
              {animals.slice(0, 6).map((animal) => (
                <TouchableOpacity
                  key={animal.id}
                  style={styles.animalCard}
                  onPress={() => router.push(`/animal/${animal.id}`)}
                >
                  <View style={styles.animalImageContainer}>
                    {animal.image ? (
                      <Image
                        source={{ uri: animal.image }}
                        style={{ width: 60, height: 60, borderRadius: 30 }}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name={
                          animal.gender === "male"
                            ? "gender-male"
                            : "gender-female"
                        }
                        size={32}
                        color="#666"
                      />
                    )}
                  </View>
                  <Text style={styles.animalName}>{animal.name}</Text>
                  {/* <Text style={styles.animalBreed}>{animal.race}</Text> */}
                  {animal.locations && (
                    <View style={styles.locationIndicator}>
                      <MaterialCommunityIcons
                        name="map-marker"
                        size={12}
                        color="#27ae60"
                      />
                      <Text style={styles.locationIndicatorText}>
                        Location saved
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </Stack>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  addButton: {
    backgroundColor: "#3498db",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginVertical: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
    flex: 1,
  },
  manageButton: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  manageButtonText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  devicesScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  deviceCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    marginRight: 12,
    minWidth: 200,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  deviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  deviceStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    color: "#666",
  },
  animalName: {
    fontSize: 13,
    // color: "#666",
    marginBottom: 8,
    fontWeight: "bold",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  locationText: {
    fontSize: 11,
    color: "#666",
    marginLeft: 4,
    fontFamily: "monospace",
  },
  noLocationText: {
    fontSize: 11,
    color: "#999",
    fontStyle: "italic",
    marginBottom: 4,
  },
  lastSeenText: {
    fontSize: 10,
    color: "#999",
    marginBottom: 4,
  },
  batteryInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  batteryText: {
    fontSize: 10,
    color: "#666",
    marginLeft: 2,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: "white",
    margin: 16,
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
    marginBottom: 16,
  },
  addPetButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addPetButtonText: {
    color: "white",
    fontWeight: "600",
  },
  animalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  animalCard: {
    backgroundColor: "white",
    width: "48%",
    marginBottom: 12,
    marginHorizontal: "1%",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  animalImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  animalImage: {
    fontSize: 32,
  },
  animalBreed: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  locationIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  locationIndicatorText: {
    fontSize: 10,
    color: "#27ae60",
    marginLeft: 2,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
  },
  actionButton: {
    alignItems: "center",
    padding: 12,
  },
  actionText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  loadingText: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
  },
});
