import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, XStack } from "tamagui";
import { Button } from "../../components/Button";
import { theme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { useTransferNotifications } from "../../contexts/TransferNotificationsContext";
import {
  ownershipTransferUtils,
  type OwnershipTransferWithDetails,
} from "../../lib/ownershipTransfer";

export default function OwnershipTransfersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { refreshNotifications } = useTransferNotifications();
  const [pendingTransfers, setPendingTransfers] = useState<
    OwnershipTransferWithDetails[]
  >([]);
  const [myTransferRequests, setMyTransferRequests] = useState<
    OwnershipTransferWithDetails[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      setError(null);

      const [pending, myRequests] = await Promise.all([
        ownershipTransferUtils.getPendingTransfersForUser(user!.id),
        ownershipTransferUtils.getTransferRequestsByUser(user!.id),
      ]);

      setPendingTransfers(pending);
      setMyTransferRequests(myRequests);
    } catch (err) {
      console.error("Error fetching transfers:", err);
      setError(
        err instanceof Error ? err.message : "Une erreur inconnue est survenue"
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransfers();
    await refreshNotifications();
    setRefreshing(false);
  };

  const handleAcceptTransfer = async (
    transfer: OwnershipTransferWithDetails
  ) => {
    Alert.alert(
      "Accepter l'animal",
      `Êtes-vous sûr de vouloir accepter ${transfer.animal.name} de ${
        transfer.current_owner.name || transfer.current_owner.email
      } ?`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Accepter",
          style: "default",
          onPress: async () => {
            try {
              const success = await ownershipTransferUtils.acceptTransfer(
                transfer.id
              );
              if (success) {
                Alert.alert(
                  "Transfert accepté",
                  `${transfer.animal.name} est maintenant votre animal.`,
                  [
                    {
                      text: "OK",
                      onPress: async () => {
                        await fetchTransfers();
                        await refreshNotifications();
                        router.push(`/animal/${transfer.animal.id}`);
                      },
                    },
                  ]
                );
              }
            } catch (err) {
              console.error("Error accepting transfer:", err);
              Alert.alert(
                "Erreur",
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

  const handleRejectTransfer = async (
    transfer: OwnershipTransferWithDetails
  ) => {
    Alert.alert(
      "Rejeter l'animal",
      `Êtes-vous sûr de vouloir rejeter ${transfer.animal.name} ?`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Rejeter",
          style: "destructive",
          onPress: async () => {
            try {
              const success = await ownershipTransferUtils.rejectTransfer(
                transfer.id
              );
              if (success) {
                Alert.alert("Transfert rejeté", "Le transfert a été rejeté.", [
                  {
                    text: "OK",
                    onPress: async () => {
                      await fetchTransfers();
                      await refreshNotifications();
                    },
                  },
                ]);
              }
            } catch (err) {
              console.error("Error rejecting transfer:", err);
              Alert.alert(
                "Erreur",
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

  const handleCancelTransfer = async (
    transfer: OwnershipTransferWithDetails
  ) => {
    Alert.alert(
      "Annuler la demande",
      `Êtes-vous sûr de vouloir annuler la demande de transfert pour ${transfer.animal.name} ?`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Confirmer",
          style: "destructive",
          onPress: async () => {
            try {
              const success = await ownershipTransferUtils.cancelTransfer(
                transfer.id,
                user!.id
              );
              if (success) {
                Alert.alert(
                  "Demande annulée",
                  "La demande de transfert a été annulée.",
                  [
                    {
                      text: "OK",
                      onPress: async () => {
                        await fetchTransfers();
                        await refreshNotifications();
                      },
                    },
                  ]
                );
              }
            } catch (err) {
              console.error("Error cancelling transfer:", err);
              Alert.alert(
                "Erreur",
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

  return (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Stack padding="$4" backgroundColor="$background">
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 24,
            color: theme.colors.text.DEFAULT,
          }}
        >
          Transferts de propriété
          {pendingTransfers.length > 0 && (
            <Text style={{ color: "#e74c3c" }}>
              {" "}
              ({pendingTransfers.length})
            </Text>
          )}
        </Text>

        {error && (
          <Text
            style={{
              marginBottom: 16,
              color: theme.colors.error,
            }}
          >
            {error}
          </Text>
        )}

        {/* Pending Transfers (as new owner) */}
        {pendingTransfers.length > 0 && (
          <Stack space="$4" marginBottom="$6">
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: theme.colors.text.DEFAULT,
                marginBottom: 8,
              }}
            >
              Demandes en attente de votre réponse
            </Text>
            {pendingTransfers.map((transfer) => (
              <View key={transfer.id} style={styles.transferCard}>
                <TouchableOpacity
                  onPress={() => router.push(`/animal/${transfer.animal.id}`)}
                  style={styles.animalInfoContainer}
                >
                  <XStack space="$3" alignItems="center" marginBottom="$3">
                    <View style={styles.animalImageContainer}>
                      {transfer.animal.image ? (
                        <Image
                          source={{ uri: transfer.animal.image }}
                          style={styles.animalImage}
                        />
                      ) : (
                        <MaterialCommunityIcons
                          name={
                            transfer.animal.gender === "male"
                              ? "gender-male"
                              : "gender-female"
                          }
                          size={32}
                          color="#666"
                        />
                      )}
                    </View>
                    <Stack flex={1}>
                      <Text style={styles.animalName}>
                        {transfer.animal.name}
                      </Text>
                      <Text style={styles.animalBreed}>
                        {transfer.animal.race}
                      </Text>
                      <Text style={styles.ownerInfo}>
                        De:{" "}
                        {transfer.current_owner.name ||
                          transfer.current_owner.email}
                      </Text>
                      <Text style={styles.transferDate}>
                        Demandé le:{" "}
                        {new Date(transfer.requested_at).toLocaleDateString(
                          "fr-FR"
                        )}
                      </Text>
                    </Stack>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={20}
                      color="#ccc"
                    />
                  </XStack>
                </TouchableOpacity>
                <XStack space="$2">
                  <Button
                    onPress={() => handleAcceptTransfer(transfer)}
                    style={{ flex: 1 }}
                  >
                    <Text style={{ color: "white" }}>Accepter</Text>
                  </Button>
                  <Button
                    variant="outline"
                    onPress={() => handleRejectTransfer(transfer)}
                    style={{ flex: 1 }}
                  >
                    <Text>Rejeter</Text>
                  </Button>
                </XStack>
              </View>
            ))}
          </Stack>
        )}

        {/* My Transfer Requests (as current owner) */}
        {myTransferRequests.length > 0 && (
          <Stack space="$4">
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: theme.colors.text.DEFAULT,
                marginBottom: 8,
              }}
            >
              Mes demandes de transfert
            </Text>
            {myTransferRequests.map((transfer) => (
              <View key={transfer.id} style={styles.transferCard}>
                <TouchableOpacity
                  onPress={() => router.push(`/animal/${transfer.animal.id}`)}
                  style={styles.animalInfoContainer}
                >
                  <XStack space="$3" alignItems="center" marginBottom="$3">
                    <View style={styles.animalImageContainer}>
                      {transfer.animal.image ? (
                        <Image
                          source={{ uri: transfer.animal.image }}
                          style={styles.animalImage}
                        />
                      ) : (
                        <MaterialCommunityIcons
                          name={
                            transfer.animal.gender === "male"
                              ? "gender-male"
                              : "gender-female"
                          }
                          size={32}
                          color="#666"
                        />
                      )}
                    </View>
                    <Stack flex={1}>
                      <Text style={styles.animalName}>
                        {transfer.animal.name}
                      </Text>
                      <Text style={styles.animalBreed}>
                        {transfer.animal.race}
                      </Text>
                      <Text style={styles.ownerInfo}>
                        À: {transfer.new_owner.name || transfer.new_owner.email}
                      </Text>
                      <Text style={styles.transferDate}>
                        Demandé le:{" "}
                        {new Date(transfer.requested_at).toLocaleDateString(
                          "fr-FR"
                        )}
                      </Text>
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              transfer.status === "pending"
                                ? "#f39c12"
                                : transfer.status === "accepted"
                                ? "#27ae60"
                                : transfer.status === "rejected"
                                ? "#e74c3c"
                                : "#95a5a6",
                          },
                        ]}
                      >
                        Statut:{" "}
                        {transfer.status === "pending"
                          ? "En attente"
                          : transfer.status === "accepted"
                          ? "Accepté"
                          : transfer.status === "rejected"
                          ? "Rejeté"
                          : "Annulé"}
                      </Text>
                    </Stack>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={20}
                      color="#ccc"
                    />
                  </XStack>
                </TouchableOpacity>
                {transfer.status === "pending" && (
                  <Button
                    variant="outline"
                    onPress={() => handleCancelTransfer(transfer)}
                  >
                    <Text>Annuler la demande</Text>
                  </Button>
                )}
              </View>
            ))}
          </Stack>
        )}

        {pendingTransfers.length === 0 && myTransferRequests.length === 0 && (
          <Stack alignItems="center" padding="$8">
            <MaterialCommunityIcons
              name="account-switch"
              size={64}
              color={theme.colors.text.light}
            />
            <Text
              style={{
                fontSize: 16,
                color: theme.colors.text.light,
                textAlign: "center",
                marginTop: 16,
              }}
            >
              Aucun transfert de propriété en cours
            </Text>
          </Stack>
        )}
      </Stack>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  transferCard: {
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
  animalInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    borderRadius: 8,
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
  ownerInfo: {
    fontSize: 14,
    color: theme.colors.text.DEFAULT,
    marginBottom: 2,
  },
  transferDate: {
    fontSize: 12,
    color: theme.colors.text.light,
    marginBottom: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
