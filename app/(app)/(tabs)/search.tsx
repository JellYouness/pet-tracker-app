import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { theme } from "../../../constants/theme";
import { useNfcScanner } from "../../../hooks/useNfcScanner";
import type { Database } from "../../../lib/supabase";
import { supabase } from "../../../lib/supabase";

type Animal = Database["public"]["Tables"]["animals"]["Row"];

export default function SearchScreen() {
  const router = useRouter();
  const {
    isSupported,
    isEnabled,
    error: nfcError,
    startScanning,
  } = useNfcScanner();
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [animals, setAnimals] = useState<Animal[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("animals")
        .select("*")
        .or(`name.ilike.%${searchQuery}%,race.ilike.%${searchQuery}%`)
        .order("name");

      if (error) throw error;

      setAnimals(data || []);
      if (data && data.length === 0) {
        setError("Aucun animal trouvé avec ces critères");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Une erreur inconnue est survenue"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleScanNfc = async () => {
    // Check NFC support and permissions
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
      setLoading(true);

      // Start NFC scanning
      const tag = await startScanning();

      if (!tag) {
        setError("Aucun tag NFC détecté. Veuillez réessayer.");
        return;
      }

      console.log("NFC Tag scanned:", tag);

      // Extract NFC ID from the tag
      let nfcId = "";

      if (tag.id) {
        // Use the tag ID directly
        nfcId = tag.id;
      }

      if (!nfcId) {
        setError("Impossible de lire l'ID NFC du tag. Veuillez réessayer.");
        return;
      }

      console.log("Searching for animal with NFC ID:", nfcId);

      // Search for animal with this NFC ID
      const { data, error } = await supabase
        .from("animals")
        .select("*")
        .eq("nfc_id", nfcId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        // Animal found, navigate to animal details
        router.push({
          pathname: "/animal/[id]",
          params: { id: data.id },
        });
      } else {
        setError(`Aucun animal trouvé avec le tag NFC: ${nfcId}`);
      }
    } catch (err) {
      console.error("NFC scanning error:", err);
      setError(err instanceof Error ? err.message : "Erreur lors du scan NFC");
    } finally {
      setScanning(false);
      setLoading(false);
    }
  };

  return (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      style={{ flex: 1, backgroundColor: "#f8f9fa", padding: 16 }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          marginBottom: 16,
          color: "#333",
        }}
      >
        Rechercher un animal
      </Text>

      {/* NFC Status Display */}
      {nfcError && (
        <View
          style={{
            backgroundColor: "#fff3cd",
            borderColor: "#ffeaa7",
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: "#856404", fontSize: 14 }}>⚠️ {nfcError}</Text>
        </View>
      )}

      {/* NFC Scan Button */}
      <TouchableOpacity
        style={{
          backgroundColor: scanning ? "#ff6b35" : theme.colors.primary.DEFAULT,
          padding: 16,
          borderRadius: 8,
          alignItems: "center",
          marginBottom: 16,
          opacity: loading ? 0.6 : 1,
        }}
        onPress={handleScanNfc}
        disabled={loading || !isSupported || !isEnabled}
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
                  : "Scanner NFC"}
          </Text>
        </View>
      </TouchableOpacity>

      {/* NFC Instructions */}
      {isSupported && isEnabled && (
        <View
          style={{
            backgroundColor: "#e3f2fd",
            borderColor: "#2196f3",
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: "#1565c0", fontSize: 14, lineHeight: 20 }}>
            📱 <Text style={{ fontWeight: "600" }}>Instructions NFC:</Text>
            {"\n"}• Approchez votre téléphone du tag NFC de l&apos;animal{"\n"}•
            Le scan se fait automatiquement{"\n"}• Vous serez redirigé vers les
            détails de l&apos;animal
          </Text>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View
          style={{
            backgroundColor: "#f8d7da",
            borderColor: "#f5c6cb",
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: "#721c24", textAlign: "center" }}>{error}</Text>
        </View>
      )}

      {/* Divider */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginVertical: 16,
        }}
      >
        <View style={{ flex: 1, height: 1, backgroundColor: "#ccc" }} />
        <Text style={{ color: "#666", marginHorizontal: 16 }}>ou</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: "#ccc" }} />
      </View>

      {/* Search Input */}
      <TextInput
        style={{
          backgroundColor: "white",
          borderRadius: 8,
          padding: 15,
          borderWidth: 1,
          borderColor: "#ddd",
          marginBottom: 16,
          fontSize: 16,
        }}
        placeholder="Nom ou race de l'animal"
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={handleSearch}
        returnKeyType="search"
      />

      {/* Search Button */}
      <TouchableOpacity
        style={{
          backgroundColor: theme.colors.primary.DEFAULT,
          padding: 16,
          borderRadius: 8,
          alignItems: "center",
          marginBottom: 16,
          opacity: loading || !searchQuery.trim() ? 0.6 : 1,
        }}
        onPress={handleSearch}
        disabled={loading || !searchQuery.trim()}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <MaterialCommunityIcons name="magnify" size={24} color="white" />
          <Text style={{ color: "white", fontSize: 16, marginLeft: 8 }}>
            Rechercher
          </Text>
        </View>
      </TouchableOpacity>

      {/* Loading State */}
      {loading && (
        <Text style={{ textAlign: "center", color: "#666", marginBottom: 16 }}>
          Chargement...
        </Text>
      )}

      {/* Search Results */}
      {animals.length > 0 && (
        <View>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
              marginBottom: 16,
              color: "#333",
            }}
          >
            Résultats ({animals.length})
          </Text>
          <ScrollView
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
          >
            {animals.map((animal) => (
              <TouchableOpacity
                key={animal.id}
                style={{
                  backgroundColor: "white",
                  padding: 16,
                  borderRadius: 8,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "#eee",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
                onPress={() =>
                  router.push({
                    pathname: "/animal/[id]",
                    params: { id: animal.id },
                  })
                }
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: "#f0f0f0",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 16,
                    }}
                  >
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
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: "#333",
                        marginBottom: 4,
                      }}
                    >
                      {animal.name}
                    </Text>
                    <Text style={{ color: "#666", fontSize: 14 }}>
                      {animal.race} •{" "}
                      {animal.gender === "male" ? "Mâle" : "Femelle"}
                    </Text>
                    {animal.nfc_id && (
                      <Text
                        style={{ color: "#999", fontSize: 12, marginTop: 2 }}
                      >
                        NFC: {animal.nfc_id}
                      </Text>
                    )}
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color="#ccc"
                  />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}
