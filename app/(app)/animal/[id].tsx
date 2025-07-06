import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import { ScrollView, Stack, XStack } from "tamagui";
import { Button } from "../../../components/Button";
import LocationDisplay from "../../../components/LocationDisplay";
import LostAnimalBanner from "../../../components/LostAnimalBanner";
import MarkAsLostModal from "../../../components/MarkAsLostModal";
import { theme } from "../../../constants/theme";
import { useAuth } from "../../../contexts/AuthContext";
import {
  ownershipTransferUtils,
  type OwnershipTransferWithDetails,
} from "../../../lib/ownershipTransfer";
import type { Database } from "../../../lib/supabase";
import { supabase } from "../../../lib/supabase";

type Animal = Database["public"]["Tables"]["animals"]["Row"];
type User = Database["public"]["Tables"]["users"]["Row"];

export default function AnimalDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [owner, setOwner] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMarkAsLostModal, setShowMarkAsLostModal] = useState(false);
  const [pendingTransfer, setPendingTransfer] =
    useState<OwnershipTransferWithDetails | null>(null);

  useEffect(() => {
    fetchAnimal();
    fetchPendingTransfer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchAnimal = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("animals")
        .select(
          `
          *,
          locations (
            id,
            latitude,
            longitude,
            address,
            created_at,
            updated_at
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      setAnimal(data);

      // Fetch owner information
      if (data.owner_id) {
        const { data: ownerData, error: ownerError } = await supabase
          .from("users")
          .select("*")
          .eq("id", data.owner_id)
          .single();

        if (!ownerError && ownerData) {
          setOwner(ownerData);
        }
      }

    } catch (err) {
      console.error("Error fetching animal:", err);
      setError(
        err instanceof Error ? err.message : "Une erreur inconnue est survenue"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingTransfer = async () => {
    try {
      const transfer = await ownershipTransferUtils.getPendingTransferForAnimal(
        id as string
      );
      setPendingTransfer(transfer);
    } catch (err) {
      console.error("Error fetching pending transfer:", err);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Confirmer la suppression",
      "Êtes-vous sûr de vouloir supprimer cet animal ? Cette action est irréversible.",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              setError(null);
              const { error } = await supabase
                .from("animals")
                .delete()
                .eq("id", id);

              if (error) throw error;
              router.replace("/(app)");
            } catch (err) {
              console.error("Error deleting animal:", err);
              setError(
                err instanceof Error
                  ? err.message
                  : "Une erreur inconnue est survenue"
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <Stack flex={1} justifyContent="center" alignItems="center">
        <Text style={{ color: theme.colors.text.light }}>Chargement...</Text>
      </Stack>
    );
  }

  if (!animal) {
    return (
      <Stack flex={1} justifyContent="center" alignItems="center">
        <Text style={{ color: theme.colors.text.light }}>
          Animal non trouvé
        </Text>
      </Stack>
    );
  }

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: theme.colors.background.DEFAULT,
      }}
    >
      <Stack padding="$4" space="$4">
        <Stack space="$4">
          <Image
            source={{
              uri:
                animal.image ||
                "https://api.dicebear.com/7.x/shapes/svg?seed=" + animal.name,
            }}
            style={{
              width: "70%",
              height: 250,
              borderRadius: 125,
              backgroundColor: theme.colors.background.dark,
              marginHorizontal: "auto",
            }}
          />

          {/* Lost Animal Banner */}
          {animal.is_lost && animal.lost_since && (
            <LostAnimalBanner
              animalId={animal.id}
              lostSince={animal.lost_since}
              lostNotes={animal.lost_notes}
              isOwner={user?.id === animal.owner_id}
              onStatusChange={fetchAnimal}
            />
          )}

          <Stack space="$4" padding="$2">
            <Stack space="$2">
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "bold",
                  color: theme.colors.text.DEFAULT,
                }}
              >
                {animal.name}
              </Text>

              <XStack space="$4" alignItems="center">
                <Stack
                  backgroundColor={
                    animal.gender === "male" ? "#0011ff" : "#f28cd9"
                  }
                  paddingHorizontal="$3"
                  paddingVertical="$1"
                  borderRadius="$4"
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 14,
                      fontWeight: "500",
                    }}
                  >
                    {animal.gender === "male" ? "Mâle" : "Femelle"}
                  </Text>
                </Stack>
              </XStack>

              <Stack marginTop="$4">
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: theme.colors.text.DEFAULT,
                    marginBottom: 16,
                  }}
                >
                  🐾 Informations personnelles
                </Text>

                <Stack
                  style={{
                    borderRadius: 16,
                    // padding: 20,
                  }}
                >
                  <XStack space="$4" flexDirection="column">
                    {/* Race */}
                    <Stack
                      style={{
                        flex: 1,
                        backgroundColor: "white",
                        padding: 16,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: "#dee2e6",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                        elevation: 1,
                      }}
                    >
                      <XStack alignItems="center" space="$2">
                        <View
                          style={{
                            backgroundColor: "#007bff",
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text style={{ fontSize: 20 }}>🐕</Text>
                        </View>
                        <Stack flex={1} gap="$1">
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "600",
                              color: "#6c757d",
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            Race
                          </Text>
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "bold",
                              color: theme.colors.text.DEFAULT,
                            }}
                          >
                            {animal.race}
                          </Text>
                        </Stack>
                      </XStack>
                    </Stack>

                    {/* Birth Date */}
                    <Stack
                      style={{
                        flex: 1,
                        minWidth: 150,
                        backgroundColor: "white",
                        padding: 16,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: "#dee2e6",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                        elevation: 1,
                      }}
                    >
                      <XStack alignItems="center" space="$2">
                        <View
                          style={{
                            backgroundColor: "#28a745",
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text style={{ fontSize: 20 }}>🎂</Text>
                        </View>
                        <Stack flex={1}>
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "600",
                              color: "#6c757d",
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            Date de naissance
                          </Text>
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "bold",
                              color: theme.colors.text.DEFAULT,
                            }}
                          >
                            {animal?.birthdate
                              ? format(
                                  new Date(animal.birthdate),
                                  "dd/MM/yyyy",
                                  {
                                    locale: fr,
                                  }
                                )
                              : "Non spécifiée"}
                          </Text>
                        </Stack>
                      </XStack>
                    </Stack>

                    {/* Birth Place */}
                    {animal?.birthplace && (
                      <Stack
                        style={{
                          flex: 1,
                          minWidth: 150,
                          backgroundColor: "white",
                          padding: 16,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: "#dee2e6",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.05,
                          shadowRadius: 4,
                          elevation: 1,
                        }}
                      >
                        <XStack alignItems="center" space="$2">
                          <View
                            style={{
                              backgroundColor: "#ffc107",
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text style={{ fontSize: 20 }}>📍</Text>
                          </View>
                          <Stack flex={1}>
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: "600",
                                color: "#6c757d",
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                              }}
                            >
                              Lieu de naissance
                            </Text>
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: "bold",
                                color: theme.colors.text.DEFAULT,
                              }}
                            >
                              {animal.birthplace}
                            </Text>
                          </Stack>
                        </XStack>
                      </Stack>
                    )}
                  </XStack>
                </Stack>
              </Stack>

              {/* Owner Information */}
              {owner && (
                <Stack marginTop="$4">
                  <XStack alignItems="center" space="$2" marginBottom="$2">
                    <MaterialCommunityIcons
                      name="account"
                      size={20}
                      color={theme.colors.primary.DEFAULT}
                    />
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "bold",
                        color: theme.colors.text.DEFAULT,
                      }}
                    >
                      Propriétaire
                    </Text>
                  </XStack>
                  <Stack
                    padding="$3"
                    borderRadius="$3"
                    style={{
                      backgroundColor: "#f8f9fa",
                      borderWidth: 1,
                      borderColor: "#e9ecef",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: theme.colors.text.DEFAULT,
                        marginBottom: 4,
                      }}
                    >
                      {owner.name || "Nom non spécifié"}
                    </Text>
                    <Text
                      style={{
                        color: theme.colors.text.light,
                        fontSize: 14,
                        marginBottom: 2,
                      }}
                    >
                      📧 {owner.email || "Non spécifié"}
                    </Text>
                    <Text
                      style={{
                        color: theme.colors.text.light,
                        fontSize: 14,
                        marginBottom: 2,
                      }}
                    >
                      📱 {owner.mobile || "Non spécifié"}
                    </Text>
                    <Text
                      style={{
                        color: theme.colors.text.light,
                        fontSize: 14,
                        marginBottom: 2,
                      }}
                    >
                      📍 {owner.address || "Non spécifié"}
                    </Text>

                    <Text
                      style={{ color: theme.colors.text.light, fontSize: 14 }}
                    >
                      🆔 CIN: {owner.cin || "Non spécifié"}
                    </Text>
                  </Stack>
                </Stack>
              )}

              {/* Pending Transfer Information */}
              {pendingTransfer && (
                <Stack
                  marginTop="$4"
                  padding="$4"
                  borderRadius="$4"
                  style={{
                    borderWidth: 1,
                    borderColor: "#f39c12",
                    backgroundColor: "#fff3cd",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color: "#856404",
                      marginBottom: 8,
                    }}
                  >
                    ⚠️ Transfert de propriété en attente
                  </Text>
                  <Text
                    style={{ color: "#856404", fontSize: 14, marginBottom: 4 }}
                  >
                    Demande envoyée à:{" "}
                    {pendingTransfer.new_owner.name ||
                      pendingTransfer.new_owner.email}
                  </Text>
                  <Text
                    style={{ color: "#856404", fontSize: 14, marginBottom: 8 }}
                  >
                    Date:{" "}
                    {new Date(pendingTransfer.requested_at).toLocaleDateString(
                      "fr-FR"
                    )}
                  </Text>
                  {(user?.id === pendingTransfer.current_owner_id ||
                    user?.id === pendingTransfer.new_owner_id) && (
                    <Button
                      variant="outline"
                      onPress={() => router.push("/ownership-transfers")}
                      style={{ alignSelf: "flex-start" }}
                    >
                      <Text>Voir les détails</Text>
                    </Button>
                  )}
                </Stack>
              )}

              {/* Location Display */}
              <Stack marginTop="$4">
                <XStack alignItems="center" space="$2" marginBottom="$2">
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={20}
                    color={theme.colors.primary.DEFAULT}
                  />
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      color: theme.colors.text.DEFAULT,
                    }}
                  >
                    Localisation
                  </Text>
                </XStack>
                <LocationDisplay
                  location={animal.locations}
                  onLocationRemoved={() => {
                    // Refresh the animal data when location is removed
                    fetchAnimal();
                  }}
                />
              </Stack>

              {/* <Stack marginTop="$4">
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: theme.colors.text.DEFAULT,
                    marginBottom: 16,
                  }}
                >
                  💉 Vaccinations
                </Text> */}

              <TouchableOpacity
                style={{
                  backgroundColor: "white",
                  padding: 20,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#e9ecef",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
                onPress={() => router.push(`/animal/${id}/vaccinations`)}
              >
                <XStack alignItems="center" justifyContent="space-between">
                  <XStack alignItems="center" space="$3" flex={1}>
                    <View
                      style={{
                        backgroundColor: "#d4edda",
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ fontSize: 24 }}>💉</Text>
                    </View>
                    <Stack flex={1}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "bold",
                          color: theme.colors.text.DEFAULT,
                          marginBottom: 4,
                        }}
                      >
                        Gérer Les Vaccinations
                      </Text>
                      <Text
                        style={{
                          color: theme.colors.text.light,
                          fontSize: 14,
                        }}
                      >
                        Voir et ajouter les vaccinations de {animal.name}
                      </Text>
                    </Stack>
                  </XStack>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color="#ccc"
                  />
                </XStack>
              </TouchableOpacity>
              {/* </Stack> */}

              {/* <Stack marginTop="$4">
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: theme.colors.text.DEFAULT,
                    marginBottom: 16,
                  }}
                >
                  🏥 Informations médicales
                </Text> */}

              <TouchableOpacity
                style={{
                  backgroundColor: "white",
                  padding: 20,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#e9ecef",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
                onPress={() => router.push(`/animal/${id}/medical-info`)}
              >
                <XStack alignItems="center" justifyContent="space-between">
                  <XStack alignItems="center" space="$3" flex={1}>
                    <View
                      style={{
                        backgroundColor: "#e3f2fd",
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ fontSize: 24 }}>🏥</Text>
                    </View>
                    <Stack flex={1}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "bold",
                          color: theme.colors.text.DEFAULT,
                          marginBottom: 4,
                        }}
                      >
                        Informations Médicales Complètes
                      </Text>
                      <Text
                        style={{
                          color: theme.colors.text.light,
                          fontSize: 14,
                        }}
                      >
                        Allergies, médicaments, conditions chroniques et plus
                      </Text>
                    </Stack>
                  </XStack>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color="#ccc"
                  />
                </XStack>
              </TouchableOpacity>
              {/* </Stack> */}
            </Stack>

            {error && (
              <Stack
                backgroundColor={theme.colors.error}
                padding="$3"
                borderRadius="$4"
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: 14,
                  }}
                >
                  {error}
                </Text>
              </Stack>
            )}

            <XStack space="$4" marginTop="$4" flexDirection="column">
              {user?.id === animal.owner_id && (
                <>
                  <Stack flex={1}>
                    <Button
                      variant="primary"
                      onPress={() => router.push(`/animal/edit/${id}`)}
                    >
                      Modifier
                    </Button>
                  </Stack>

                  {!animal.is_lost && (
                    <Stack flex={1} marginTop="$4">
                      <Button
                        variant="outline"
                        onPress={() => setShowMarkAsLostModal(true)}
                        style={{
                          backgroundColor: "#ff6b6b",
                          borderColor: "#ff6b6b",
                        }}
                      >
                        <Text style={{ color: "white", fontWeight: "bold" }}>
                          Marquer comme perdu
                        </Text>
                      </Button>
                    </Stack>
                  )}

                  <Stack flex={1} marginTop="$4">
                    <Button
                      variant="outline"
                      onPress={() => router.push(`/animal/change-owner/${id}`)}
                    >
                      Changer de propriétaire
                    </Button>
                  </Stack>

                  <Stack flex={1} marginTop="$4">
                    <Button variant="outline" onPress={handleDelete}>
                      Supprimer
                    </Button>
                  </Stack>
                </>
              )}

              <Stack flex={1}>
                <Button variant="outline" onPress={() => router.back()}>
                  Retour
                </Button>
              </Stack>
            </XStack>
          </Stack>
        </Stack>
      </Stack>

      {/* Mark as Lost Modal */}
      <MarkAsLostModal
        visible={showMarkAsLostModal}
        onClose={() => setShowMarkAsLostModal(false)}
        animalId={animal.id}
        animalName={animal.name}
        onStatusChange={fetchAnimal}
      />
    </ScrollView>
  );
}
