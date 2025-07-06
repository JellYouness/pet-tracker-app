import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, XStack } from "tamagui";
import { Button } from "../../../../components/Button";
import OcrComponent from "../../../../components/OcrComponent";
import { theme } from "../../../../constants/theme";
import { useAuth } from "../../../../contexts/AuthContext";
import { ownershipTransferUtils } from "../../../../lib/ownershipTransfer";
import type { Database } from "../../../../lib/supabase";
import { supabase } from "../../../../lib/supabase";

type Animal = Database["public"]["Tables"]["animals"]["Row"];
type User = Database["public"]["Tables"]["users"]["Row"];

export default function ChangeOwnerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newOwnerCin, setNewOwnerCin] = useState("");
  const [newOwner, setNewOwner] = useState<User | null>(null);
  const [showOcr, setShowOcr] = useState(false);
  const [ocrData, setOcrData] = useState<{
    lastname: string;
    firstname: string;
    cin: string;
  } | null>(null);

  useEffect(() => {
    fetchAnimal();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchAnimal = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("animals")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data.owner_id !== user?.id) {
        throw new Error("Vous n'êtes pas autorisé à modifier cet animal");
      }

      setAnimal(data);
    } catch (err) {
      console.error("Error fetching animal:", err);
      setError(
        err instanceof Error ? err.message : "Une erreur inconnue est survenue"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOcrSuccess = (data: {
    lastname: string;
    firstname: string;
    cin: string;
  }) => {
    setOcrData(data);
    setNewOwnerCin(data.cin);
    setShowOcr(false);
    // Automatically search for the user after OCR
    searchNewOwnerByCin(data.cin);
  };

  const searchNewOwnerByCin = async (cin?: string) => {
    try {
      setError(null);
      const searchCin = cin || newOwnerCin;

      if (!searchCin) {
        setError("Veuillez entrer un numéro CIN");
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("cin", searchCin)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          setError("Aucun utilisateur trouvé avec ce numéro CIN");
        } else {
          throw error;
        }
        return;
      }

      setNewOwner(data);
    } catch (err) {
      console.error("Error searching user:", err);
      setError(
        err instanceof Error ? err.message : "Une erreur inconnue est survenue"
      );
    }
  };

  const handleChangeOwner = async () => {
    if (!newOwner) {
      setError("Veuillez d'abord rechercher un utilisateur");
      return;
    }

    Alert.alert(
      "Demander le transfert de propriété",
      `Êtes-vous sûr de vouloir demander le transfert de ${animal?.name} à ${
        newOwner.name || newOwner.email
      } ?\n\nL'utilisateur devra confirmer l'acceptation de l'animal.`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Demander le transfert",
          style: "default",
          onPress: async () => {
            try {
              setSaving(true);
              setError(null);

              await ownershipTransferUtils.createTransferRequest(
                id as string,
                user!.id,
                newOwner.id,
                `Transfert demandé par ${user?.email}`
              );

              Alert.alert(
                "Demande envoyée",
                `La demande de transfert a été envoyée à ${
                  newOwner.name || newOwner.email
                }. L'animal restera en votre possession jusqu'à confirmation.`,
                [
                  {
                    text: "OK",
                    onPress: () => router.replace(`/animal/${id}`),
                  },
                ]
              );
            } catch (err) {
              console.error("Error creating transfer request:", err);
              setError(
                err instanceof Error
                  ? err.message
                  : "Une erreur inconnue est survenue"
              );
            } finally {
              setSaving(false);
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

  if (showOcr) {
    return <OcrComponent onSuccess={handleOcrSuccess} />;
  }

  return (
    <ScrollView automaticallyAdjustKeyboardInsets>
      <Stack padding="$4" backgroundColor="$background">
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 24,
            color: theme.colors.text.DEFAULT,
          }}
        >
          Changer le propriétaire
        </Text>

        <Stack space="$4">
          <Stack>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: theme.colors.text.DEFAULT,
                marginBottom: 8,
              }}
            >
              Rechercher un utilisateur par CIN
            </Text>

            {/* OCR Button */}
            <TouchableOpacity
              style={styles.ocrButton}
              onPress={() => setShowOcr(true)}
            >
              <View style={styles.ocrButtonContent}>
                <MaterialCommunityIcons
                  name="camera"
                  size={24}
                  color={theme.colors.primary.DEFAULT}
                />
                <Text style={styles.ocrButtonText}>
                  Scanner le CIN avec la caméra
                </Text>
              </View>
            </TouchableOpacity>

            {/* Divider */}
            {/* <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View> */}

            {/* Manual CIN Input */}
            {/* <XStack space="$2">
              <Stack flex={1}>
                <Input
                  placeholder="Numéro CIN de l'utilisateur"
                  value={newOwnerCin}
                  onChangeText={setNewOwnerCin}
                  keyboardType="numeric"
                  autoCapitalize="none"
                />
              </Stack>
              <Button onPress={searchNewOwner}>Rechercher</Button>
            </XStack> */}
          </Stack>

          {/* OCR Data Display */}
          {ocrData && (
            <Stack
              padding="$4"
              borderRadius="$4"
              space="$2"
              style={{
                borderWidth: 1,
                borderColor: theme.colors.primary.DEFAULT,
                backgroundColor: "#e8f4fd",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "bold",
                  color: theme.colors.primary.DEFAULT,
                  marginBottom: 4,
                }}
              >
                Données scannées:
              </Text>
              <Text style={{ color: theme.colors.text.DEFAULT }}>
                {ocrData.firstname} {ocrData.lastname}
              </Text>
              <Text style={{ color: theme.colors.text.DEFAULT }}>
                CIN: {ocrData.cin}
              </Text>
              <Text style={{ color: theme.colors.text.DEFAULT }}>
                Email: {newOwner?.email}
              </Text>
            </Stack>
          )}

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

          <XStack space="$4" flexDirection="column" marginTop="$4">
            {newOwner && (
              <Button onPress={handleChangeOwner} loading={saving}>
                <XStack space="$2" alignItems="center">
                  <MaterialCommunityIcons
                    name="account-switch"
                    size={20}
                    color="white"
                  />
                  <Text style={{ color: "white" }}>
                    Demander le transfert à {newOwner.name || newOwner.email}
                  </Text>
                </XStack>
              </Button>
            )}

            <Button variant="outline" onPress={() => router.back()}>
              Annuler
            </Button>
          </XStack>
        </Stack>
      </Stack>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ocrButton: {
    backgroundColor: "#eaf6fb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary.DEFAULT,
    shadowColor: "#3498db",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ocrButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  ocrButtonText: {
    fontSize: 16,
    color: theme.colors.primary.DEFAULT,
    fontWeight: "600",
    marginLeft: 12,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#666",
    fontSize: 14,
  },
});
