import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, ScrollView, Text } from "react-native";
import { Stack, XStack } from "tamagui";
import { Button } from "../../../../components/Button";
import { Input } from "../../../../components/Input";
import { theme } from "../../../../constants/theme";
import { useNfcScanner } from "../../../../hooks/useNfcScanner";
import type { Database } from "../../../../lib/supabase";
import { supabase } from "../../../../lib/supabase";

type Animal = Database["public"]["Tables"]["animals"]["Row"];

export default function SearchScreen() {
  const router = useRouter();
  const { startScanning, error: scanError } = useNfcScanner();
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
    // const tag = await startScanning();
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
    <Stack flex={1} backgroundColor="$background" padding="$4">
      <Stack space="$4">
        <Button onPress={handleScanNfc} variant="primary" disabled={loading}>
          <Stack
            flexDirection="row"
            alignItems="center"
            justifyContent="center"
            space="$2"
          >
            <MaterialCommunityIcons
              name="cellphone-nfc"
              size={20}
              color="white"
            />
            <Text
              style={{
                color: "white",
                fontSize: 16,
              }}
            >
              Scanner NFC
            </Text>
          </Stack>
        </Button>

        {(error || scanError) && (
          <Text style={{ color: "red", textAlign: "center" }}>
            {error || scanError}
          </Text>
        )}

        <Stack
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
          space="$2"
          marginVertical="$4"
        >
          <Stack
            flex={1}
            height={1}
            backgroundColor={theme.colors.text.light}
          />
          <Text style={{ color: theme.colors.text.light }}>ou</Text>
          <Stack
            flex={1}
            height={1}
            backgroundColor={theme.colors.text.light}
          />
        </Stack>

        <Input
          label="Rechercher un animal"
          placeholder="Nom ou race de l'animal"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          withBorder={false}
          style={{
            backgroundColor: "white",
            borderRadius: 10,
            padding: 15,
            borderWidth: 1,
            borderColor: theme.colors.text.light,
          }}
        />

        <Button
          onPress={handleSearch}
          variant="primary"
          disabled={loading || !searchQuery.trim()}
        >
          <Stack
            flexDirection="row"
            alignItems="center"
            justifyContent="center"
            space="$2"
          >
            <MaterialCommunityIcons name="magnify" size={24} color="white" />
            <Text style={{ color: "white", fontSize: 16 }}>Rechercher</Text>
          </Stack>
        </Button>

        {loading ? (
          <Text
            style={{
              textAlign: "center",
              color: theme.colors.text.light,
            }}
          >
            Chargement...
          </Text>
        ) : animals.length > 0 ? (
          <Stack>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                marginBottom: 16,
                color: theme.colors.text.DEFAULT,
              }}
            >
              Résultats ({animals.length})
            </Text>
            <ScrollView>
              {animals.map((animal) => (
                <Stack
                  key={animal.id}
                  backgroundColor="$background"
                  padding="$4"
                  borderRadius="$4"
                  marginBottom="$4"
                  shadowColor="$shadow"
                  shadowOffset={{ width: 0, height: 1 }}
                  shadowOpacity={0.1}
                  shadowRadius={2}
                >
                  <Button
                    onPress={() =>
                      router.push({
                        pathname: "/animal/[id]",
                        params: { id: animal.id },
                      })
                    }
                    variant="ghost"
                  >
                    <XStack space="$4" alignItems="center">
                      <Image
                        source={{ uri: animal.image }}
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 30,
                          backgroundColor: theme.colors.background.dark,
                        }}
                      />
                      <Stack flex={1}>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "bold",
                            color: theme.colors.text.DEFAULT,
                          }}
                        >
                          {animal.name}
                        </Text>
                        <Text style={{ color: theme.colors.text.light }}>
                          {animal.race} •{" "}
                          {animal.gender === "male" ? "Mâle" : "Femelle"}
                        </Text>
                      </Stack>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={24}
                        color={theme.colors.text.light}
                      />
                    </XStack>
                  </Button>
                </Stack>
              ))}
            </ScrollView>
          </Stack>
        ) : null}
      </Stack>
    </Stack>
  );
}
