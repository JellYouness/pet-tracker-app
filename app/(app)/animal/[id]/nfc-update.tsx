import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack } from "tamagui";
import { theme } from "../../../../constants/theme";
import { useAuth } from "../../../../contexts/AuthContext";
import { useNfcScanner } from "../../../../hooks/useNfcScanner";
import { supabase } from "../../../../lib/supabase";

export default function NfcUpdateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const {
    isSupported,
    isEnabled,
    error: nfcError,
    startScanning,
    extractTextFromTag,
  } = useNfcScanner();

  const [animalName, setAnimalName] = useState("");
  const [currentNfcId, setCurrentNfcId] = useState("");
  const [newNfcId, setNewNfcId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchAnimalData();
    }
  }, [id]);

  const fetchAnimalData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("animals")
        .select("name, nfc_id, owner_id")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (!data) {
        setError("Animal non trouvé");
        return;
      }

      // Check if user owns this animal
      if (data.owner_id !== user?.id) {
        setError("Vous n'êtes pas autorisé à modifier cet animal");
        return;
      }

      setAnimalName(data.name || "");
      setCurrentNfcId(data.nfc_id || "");
      setNewNfcId(data.nfc_id || "");
    } catch (err) {
      console.error("Error fetching animal data:", err);
      setError(
        err instanceof Error ? err.message : "Une erreur inconnue est survenue"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleScanNfc = async () => {
    if (!isSupported) {
      Alert.alert(
        "NFC non supporté",
        "Votre appareil ne supporte pas le NFC ou l'application n'a pas les permissions nécessaires."
      );
      return;
    }

    if (!isEnabled) {
      Alert.alert(
        "NFC désactivé",
        "Veuillez activer le NFC dans les paramètres de votre appareil."
      );
      return;
    }

    try {
      setScanning(true);
      setError(null);

      const tag = await startScanning();

      if (!tag) {
        setError("Aucun tag NFC détecté. Veuillez réessayer.");
        return;
      }

      const nfcText = extractTextFromTag(tag);

      if (!nfcText) {
        setError(
          "Impossible de lire le contenu du tag NFC. Veuillez réessayer."
        );
        return;
      }

      setNewNfcId(nfcText);
    } catch (err) {
      console.error("NFC scanning error:", err);
      setError(err instanceof Error ? err.message : "Erreur lors du scan NFC");
    } finally {
      setScanning(false);
    }
  };

  const handleSave = async () => {
    if (!newNfcId.trim()) {
      setError("Veuillez entrer un ID NFC valide");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Check if the NFC ID is already used by another animal
      const { data: existingAnimal, error: checkError } = await supabase
        .from("animals")
        .select("id, name")
        .eq("nfc_id", newNfcId.trim())
        .neq("id", id)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingAnimal) {
        setError(
          `Cet ID NFC est déjà utilisé par l'animal: ${existingAnimal.name}`
        );
        return;
      }

      // Update the animal's NFC ID
      const { error: updateError } = await supabase
        .from("animals")
        .update({ nfc_id: newNfcId.trim() })
        .eq("id", id);

      if (updateError) throw updateError;

      Alert.alert("Succès", "L'ID NFC a été mis à jour avec succès", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (err) {
      console.error("Error updating NFC ID:", err);
      setError(
        err instanceof Error ? err.message : "Erreur lors de la mise à jour"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  if (error && !loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text style={{ color: "red", textAlign: "center", marginBottom: 20 }}>
          {error}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.primary.DEFAULT,
            padding: 12,
            borderRadius: 8,
          }}
          onPress={() => router.back()}
        >
          <Text style={{ color: "white" }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f8f9fa", padding: 16 }}
      automaticallyAdjustKeyboardInsets
    >
      <Stack space="$4">
        {/* Header */}
        <View>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              marginBottom: 8,
              color: "#333",
            }}
          >
            Mettre à jour l'ID NFC
          </Text>
          <Text style={{ color: "#666", fontSize: 16 }}>
            Animal: {animalName}
          </Text>
        </View>

        {/* NFC Status Display */}
        {nfcError && (
          <View
            style={{
              backgroundColor: "#fff3cd",
              borderColor: "#ffeaa7",
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
            }}
          >
            <Text style={{ color: "#856404", fontSize: 14 }}>
              ⚠️ {nfcError}
            </Text>
          </View>
        )}

        {/* Current NFC ID */}
        <View
          style={{
            backgroundColor: "white",
            padding: 16,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#ddd",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8 }}>
            ID NFC actuel:
          </Text>
          <Text
            style={{ fontSize: 14, color: "#666", fontFamily: "monospace" }}
          >
            {currentNfcId || "Aucun ID NFC défini"}
          </Text>
        </View>

        {/* New NFC ID Input */}
        <View
          style={{
            backgroundColor: "white",
            padding: 16,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#ddd",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
            Nouvel ID NFC:
          </Text>

          <TextInput
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              fontFamily: "monospace",
              marginBottom: 12,
            }}
            placeholder="Entrez le nouvel ID NFC"
            value={newNfcId}
            onChangeText={setNewNfcId}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Scan NFC Button */}
          <TouchableOpacity
            style={{
              backgroundColor: scanning
                ? "#ff6b35"
                : theme.colors.primary.DEFAULT,
              padding: 16,
              borderRadius: 8,
              alignItems: "center",
              opacity: !isSupported || !isEnabled ? 0.6 : 1,
            }}
            onPress={handleScanNfc}
            disabled={scanning || !isSupported || !isEnabled}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons
                name={scanning ? "close-circle" : "cellphone-nfc"}
                size={20}
                color="white"
              />
              <Text style={{ color: "white", fontSize: 16, marginLeft: 8 }}>
                {scanning
                  ? "Scan en cours..."
                  : !isSupported
                    ? "NFC non supporté"
                    : !isEnabled
                      ? "NFC désactivé"
                      : "Scanner un tag NFC"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View
          style={{
            backgroundColor: "#e3f2fd",
            borderColor: "#2196f3",
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
          }}
        >
          <Text style={{ color: "#1565c0", fontSize: 14, lineHeight: 20 }}>
            📱 <Text style={{ fontWeight: "600" }}>Instructions:</Text>
            {"\n"}• Entrez manuellement l&apos;ID NFC ou{"\n"}• Scannez un tag
            NFC pour l&apos;extraire automatiquement{"\n"}• L&apos;ID NFC doit
            être unique pour chaque animal
          </Text>
        </View>

        {/* Error Display */}
        {error && (
          <View
            style={{
              backgroundColor: "#f8d7da",
              borderColor: "#f5c6cb",
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
            }}
          >
            <Text style={{ color: "#721c24", textAlign: "center" }}>
              {error}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "#6c757d",
              padding: 16,
              borderRadius: 8,
              alignItems: "center",
              opacity: saving ? 0.6 : 1,
            }}
            onPress={() => router.back()}
            disabled={saving}
          >
            <Text style={{ color: "white", fontSize: 16 }}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: theme.colors.primary.DEFAULT,
              padding: 16,
              borderRadius: 8,
              alignItems: "center",
              opacity: saving || !newNfcId.trim() ? 0.6 : 1,
            }}
            onPress={handleSave}
            disabled={saving || !newNfcId.trim()}
          >
            <Text style={{ color: "white", fontSize: 16 }}>
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </Text>
          </TouchableOpacity>
        </View>
      </Stack>
    </ScrollView>
  );
}
