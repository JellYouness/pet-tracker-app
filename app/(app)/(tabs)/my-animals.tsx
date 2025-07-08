import { Button } from "@/components/Button";
import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, XStack } from "tamagui";

type Animal = Database["public"]["Tables"]["animals"]["Row"];

export default function MyAnimalsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnimals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchAnimals = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        return;
      }

      const { data, error } = await supabase
        .from("animals")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAnimals(data || []);
    } catch (err) {
      console.error("Error fetching animals:", err);
      setError(
        err instanceof Error ? err.message : "Une erreur inconnue est survenue"
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnimals();
    setRefreshing(false);
  };

  const formatLostSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 24) {
      return `${diffInHours} heure${diffInHours > 1 ? "s" : ""}`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} jour${diffInDays > 1 ? "s" : ""}`;
    }
  };

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
        <XStack
          justifyContent="space-between"
          alignItems="center"
          marginBottom="$4"
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: theme.colors.text.DEFAULT,
            }}
          >
            Mes Animaux
          </Text>
          <XStack space="$2">
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => router.push("/map")}
            >
              <MaterialCommunityIcons name="map" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push("/animal/register")}
            >
              <MaterialCommunityIcons name="plus" size={24} color="white" />
            </TouchableOpacity>
          </XStack>
        </XStack>

        {error && (
          <Stack marginBottom="$4">
            <Text style={{ color: "red" }}>{error}</Text>
          </Stack>
        )}

        {animals.length === 0 ? (
          <Stack
            flex={1}
            justifyContent="center"
            alignItems="center"
            space="$4"
          >
            <MaterialCommunityIcons
              name="paw-off"
              size={64}
              color={theme.colors.text.light}
            />
            <Text
              style={{
                textAlign: "center",
                color: theme.colors.text.light,
                fontSize: 18,
                fontWeight: "bold",
              }}
            >
              Aucun animal enregistré
            </Text>
            <Text
              style={{
                textAlign: "center",
                color: theme.colors.text.light,
                fontSize: 14,
              }}
            >
              Ajoutez votre premier animal pour commencer
            </Text>
            <Button
              onPress={() => router.push("/animal/register")}
              variant="primary"
            >
              <XStack alignItems="center" space="$2">
                <MaterialCommunityIcons name="plus" size={18} color="white" />
                <Text style={{ color: "white" }}>Ajouter un animal</Text>
              </XStack>
            </Button>
          </Stack>
        ) : (
          <Stack space="$4">
            {animals.map((animal) => (
              <TouchableOpacity
                key={animal.id}
                style={styles.animalCard}
                onPress={() => router.push(`/animal/${animal.id}`)}
              >
                <XStack space="$4" alignItems="center">
                  <View style={styles.animalImageContainer}>
                    {animal.image ? (
                      <Image
                        source={{ uri: animal.image }}
                        style={styles.animalImage}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name={
                          animal.gender === "male"
                            ? "gender-male"
                            : "gender-female"
                        }
                        size={32}
                        color={theme.colors.text.light}
                      />
                    )}
                  </View>
                  <Stack flex={1}>
                    <XStack alignItems="center" space="$2">
                      <Text style={styles.animalName}>{animal.name}</Text>
                      {animal.is_lost && (
                        <View style={styles.lostBadge}>
                          <Text style={styles.lostBadgeText}>PERDU</Text>
                        </View>
                      )}
                    </XStack>
                    <Text style={styles.animalBreed}>{animal.race}</Text>
                    <Text style={styles.animalGender}>
                      {animal.gender === "male" ? "Mâle" : "Femelle"}
                    </Text>
                    {animal.is_lost && animal.lost_since && (
                      <Text style={styles.lostSince}>
                        Perdu depuis {formatLostSince(animal.lost_since)}
                      </Text>
                    )}
                  </Stack>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color={theme.colors.text.light}
                  />
                </XStack>
              </TouchableOpacity>
            ))}
          </Stack>
        )}

        <Button
          onPress={fetchAnimals}
          variant="outline"
          style={{ marginTop: 16 }}
        >
          <XStack alignItems="center" space="$2">
            <MaterialCommunityIcons
              name="refresh"
              size={18}
              color={theme.colors.primary.DEFAULT}
            />
            <Text style={{ color: theme.colors.primary.DEFAULT }}>
              Actualiser
            </Text>
          </XStack>
        </Button>
      </Stack>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: theme.colors.primary.DEFAULT,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  mapButton: {
    backgroundColor: "#10b981",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  animalCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  animalImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
  },
  animalImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  animalName: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text.DEFAULT,
    marginBottom: 4,
  },
  animalBreed: {
    fontSize: 14,
    color: theme.colors.text.light,
    marginBottom: 2,
  },
  animalGender: {
    fontSize: 12,
    color: theme.colors.text.light,
  },
  lostBadge: {
    backgroundColor: "#ff6b6b",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lostBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  lostSince: {
    fontSize: 11,
    color: "#ff6b6b",
    fontWeight: "bold",
    marginTop: 2,
  },
});
