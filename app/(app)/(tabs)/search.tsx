import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { theme } from "../../../constants/theme";
import type { Database } from "../../../lib/supabase";
import { supabase } from "../../../lib/supabase";

type Animal = Database["public"]["Tables"]["animals"]["Row"];

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
    // Mock NFC scanning for now
    const tag = { id: "nfc-2345678901" };
    if (tag) {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("animals")
          .select("*")
          .eq("nfc_id", tag.id)
          .single();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        if (data) {
          router.push({
            pathname: "/animal/[id]",
            params: { id: data.id },
          });
        } else {
          setError("Aucun animal trouvé avec ce tag NFC");
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Une erreur inconnue est survenue"
        );
      } finally {
        setLoading(false);
      }
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

      {/* NFC Scan Button */}
      <TouchableOpacity
        style={{
          backgroundColor: theme.colors.primary.DEFAULT,
          padding: 16,
          borderRadius: 8,
          alignItems: "center",
          marginBottom: 16,
          opacity: loading ? 0.6 : 1,
        }}
        onPress={handleScanNfc}
        disabled={loading}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <MaterialCommunityIcons
            name="cellphone-nfc"
            size={20}
            color="white"
          />
          <Text style={{ color: "white", fontSize: 16, marginLeft: 8 }}>
            Scanner NFC
          </Text>
        </View>
      </TouchableOpacity>

      {/* Error Display */}
      {error && (
        <Text style={{ color: "red", textAlign: "center", marginBottom: 16 }}>
          {error}
        </Text>
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
