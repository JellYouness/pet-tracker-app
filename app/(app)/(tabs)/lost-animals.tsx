import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ScrollView, Stack, XStack } from "tamagui";
import { theme } from "@/constants/theme";
import { fetchLostAnimals } from "@/lib/supabase";

type LostAnimal = {
  animal_id: string;
  animal_name: string;
  animal_race: string;
  animal_gender: string;
  animal_image: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  lost_since: string;
  lost_notes: string;
};

export default function LostAnimalsScreen() {
  const router = useRouter();
  const [lostAnimals, setLostAnimals] = useState<LostAnimal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLostAnimalsData();
  }, []);

  const fetchLostAnimalsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchLostAnimals();
      setLostAnimals(data);
    } catch (err) {
      console.error("Error fetching lost animals:", err);
      setError("Impossible de charger les animaux perdus");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLostAnimalsData();
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

  const handleContactOwner = (animal: LostAnimal) => {
    Alert.alert(
      "Contacter le propriétaire",
      `Voulez-vous contacter ${animal.owner_name} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Appeler",
          onPress: () => {
            // Here you could implement phone call functionality
            Alert.alert("Appel", `Appel vers ${animal.owner_phone}`);
          },
        },
        {
          text: "Email",
          onPress: () => {
            // Here you could implement email functionality
            Alert.alert("Email", `Email vers ${animal.owner_email}`);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: theme.colors.text.light }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background.DEFAULT }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Stack padding="$4" space="$4">
        {/* Header */}
        <Stack space="$2">
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: theme.colors.text.DEFAULT,
              textAlign: "center",
            }}
          >
            🐾 Animaux Perdus
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: theme.colors.text.light,
              textAlign: "center",
            }}
          >
            Aidez à retrouver ces animaux perdus
          </Text>
        </Stack>

        {error && (
          <Stack
            backgroundColor={theme.colors.error}
            padding="$3"
            borderRadius="$4"
          >
            <Text style={{ color: "white", fontSize: 14 }}>{error}</Text>
          </Stack>
        )}

        {lostAnimals.length === 0 ? (
          <Stack
            style={{
              alignItems: "center",
              padding: 40,
            }}
          >
            <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: theme.colors.text.DEFAULT,
                marginTop: 16,
                textAlign: "center",
              }}
            >
              Aucun animal perdu
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: theme.colors.text.light,
                marginTop: 8,
                textAlign: "center",
              }}
            >
              Tous les animaux sont sains et saufs ! 🎉
            </Text>
          </Stack>
        ) : (
          <Stack space="$4" style={{ marginTop: 30 }}>
            {lostAnimals.map((animal) => (
              <TouchableOpacity
                key={animal.animal_id}
                onPress={() => router.push(`/animal/${animal.animal_id}`)}
                style={{
                  backgroundColor: "white",
                  borderRadius: 12,
                  padding: 16,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                  borderLeftWidth: 4,
                  borderLeftColor: "#ff6b6b",
                }}
              >
                <XStack space="$3" alignItems="center">
                  <Image
                    source={{
                      uri:
                        animal.animal_image ||
                        `https://api.dicebear.com/7.x/shapes/svg?seed=${animal.animal_name}`,
                    }}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: theme.colors.background.dark,
                    }}
                  />
                  <Stack flex={1} space="$1">
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "bold",
                        color: theme.colors.text.DEFAULT,
                      }}
                    >
                      {animal.animal_name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: theme.colors.text.light,
                      }}
                    >
                      {animal.animal_race} •{" "}
                      {animal.animal_gender === "male" ? "Mâle" : "Femelle"}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#ff6b6b",
                        fontWeight: "bold",
                      }}
                    >
                      Perdu depuis {formatLostSince(animal.lost_since)}
                    </Text>
                    {animal.lost_notes && (
                      <Text
                        style={{
                          fontSize: 12,
                          color: theme.colors.text.light,
                          fontStyle: "italic",
                        }}
                        numberOfLines={2}
                      >
                        {animal.lost_notes}
                      </Text>
                    )}
                  </Stack>
                </XStack>

                <Stack
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: "#f0f0f0",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme.colors.text.light,
                      marginBottom: 4,
                    }}
                  >
                    Propriétaire: {animal.owner_name}
                  </Text>
                  <XStack space="$2">
                    <TouchableOpacity
                      onPress={() => handleContactOwner(animal)}
                      style={{
                        backgroundColor: "#ff6b6b",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 6,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons name="call" size={14} color="white" />
                      <Text
                        style={{
                          color: "white",
                          fontSize: 12,
                          fontWeight: "bold",
                          marginLeft: 4,
                        }}
                      >
                        Contacter
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => router.push(`/animal/${animal.animal_id}`)}
                      style={{
                        backgroundColor: theme.colors.primary.DEFAULT,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 6,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name="information-circle"
                        size={14}
                        color={theme.colors.background.DEFAULT}
                      />
                      <Text
                        style={{
                          color: theme.colors.background.DEFAULT,
                          fontSize: 12,
                          fontWeight: "bold",
                          marginLeft: 4,
                        }}
                      >
                        Détails
                      </Text>
                    </TouchableOpacity>
                  </XStack>
                </Stack>
              </TouchableOpacity>
            ))}
          </Stack>
        )}
      </Stack>
    </ScrollView>
  );
}
