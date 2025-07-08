import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { decode } from "base64-arraybuffer";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, XStack } from "tamagui";
import { Button } from "../../../components/Button";
import { Input } from "../../../components/Input";
import NfcTagGenerator from "../../../components/NfcTagGenerator";
import { theme } from "../../../constants/theme";
import { useAuth } from "../../../contexts/AuthContext";
import { supabase } from "../../../lib/supabase";

export default function RegisterAnimalScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    race: "",
    gender: "male",
    birthdate: "",
    image: "",
    nfc: "",
  });
  const [vaccinations, setVaccinations] = useState([
    { name: "", date: "", notes: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [nfcGeneratorVisible, setNfcGeneratorVisible] = useState(false);

  const handleImageUpload = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Permission d'accès à la galerie refusée");
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled) {
        return;
      }

      setUploading(true);
      const image = result.assets[0];
      console.log("Image selected:", { uri: image.uri, size: image.fileSize });

      if (!image.base64) {
        throw new Error("Aucune donnée base64 disponible pour l'image");
      }

      const filePath = `${Date.now()}.jpg`;
      console.log("Uploading to path:", filePath);

      const { error: uploadError, data } = await supabase.storage
        .from("animal-images")
        .upload(filePath, decode(image.base64), {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      console.log("Upload successful:", data);

      const {
        data: { publicUrl },
      } = supabase.storage.from("animal-images").getPublicUrl(filePath);

      console.log("Public URL:", publicUrl);
      setFormData({ ...formData, image: publicUrl });
    } catch (err) {
      console.error("Image upload error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du téléchargement de l'image"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setError(null);
      setLoading(true);

      console.log("Registering animal with data:", {
        ...formData,
        owner_id: process.env.EXPO_PUBLIC_DISABLE_AUTH
          ? "722fa0c8-7f1f-44a1-8fa4-f3e48c5500f0"
          : user?.id,
      });

      const { error, data } = await supabase
        .from("animals")
        .insert({
          name: formData.name,
          race: formData.race,
          gender: formData.gender,
          birthdate: formData.birthdate,
          owner_id: !process.env.EXPO_PUBLIC_DISABLE_AUTH
            ? "722fa0c8-7f1f-44a1-8fa4-f3e48c5500f0"
            : user?.id,
          image:
            formData.image ||
            "https://api.dicebear.com/7.x/shapes/svg?seed=" + formData.name,
          nfc_id: formData.nfc,
          vaccinations: vaccinations.filter((v) => v.name && v.date),
        })
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Animal registered successfully:", data);
      router.replace("/(app)");
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err instanceof Error ? err.message : "Une erreur inconnue est survenue"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNfcGenerated = (nfcId: string) => {
    setFormData({ ...formData, nfc: nfcId });
  };

  const handleNfcScan = () => {
    if (!formData.name.trim()) {
      Alert.alert(
        "Nom requis",
        "Veuillez d'abord entrer le nom de l'animal avant de générer le tag NFC."
      );
      return;
    }
    setNfcGeneratorVisible(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, birthdate: selectedDate.toISOString() });
    }
  };

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
          Enregistrer un animal
        </Text>

        <Stack space="$4">
          <Stack alignItems="center" marginBottom="$4">
            <Image
              source={{
                uri:
                  formData.image ||
                  "https://api.dicebear.com/7.x/shapes/svg?seed=" +
                    formData.name,
              }}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: theme.colors.background.dark,
                marginBottom: 16,
              }}
            />
            <Button
              variant="outline"
              onPress={handleImageUpload}
              loading={uploading}
            >
              <XStack space="$2" alignItems="center">
                <MaterialCommunityIcons
                  name="camera-plus"
                  size={20}
                  color={theme.colors.primary.DEFAULT}
                />
                <Text style={{ color: theme.colors.primary.DEFAULT }}>
                  {uploading ? "Téléchargement..." : "Ajouter une photo"}
                </Text>
              </XStack>
            </Button>
          </Stack>

          <Input
            label="Nom"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />

          <Stack>
            <Text
              style={{
                marginBottom: 4,
                color: theme.colors.text.DEFAULT,
              }}
            >
              Genre
            </Text>
            <XStack space="$2">
              <Stack flex={1}>
                <Button
                  variant={formData.gender === "male" ? "primary" : "outline"}
                  onPress={() => setFormData({ ...formData, gender: "male" })}
                >
                  Mâle
                </Button>
              </Stack>
              <Stack flex={1}>
                <Button
                  variant={formData.gender === "female" ? "primary" : "outline"}
                  onPress={() => setFormData({ ...formData, gender: "female" })}
                >
                  Femelle
                </Button>
              </Stack>
            </XStack>
          </Stack>

          <Input
            label="Race"
            value={formData.race}
            onChangeText={(text) => setFormData({ ...formData, race: text })}
          />

          <Stack>
            <Text
              style={{
                marginBottom: 4,
                color: theme.colors.text.DEFAULT,
              }}
            >
              Date de naissance
            </Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={{
                backgroundColor: "white",
                borderRadius: 10,
                padding: 15,
                borderWidth: 1,
                borderColor: theme.colors.text.light,
              }}
            >
              <Text style={{ color: theme.colors.text.DEFAULT }}>
                {formData.birthdate
                  ? format(new Date(formData.birthdate), "dd/MM/yyyy", {
                      locale: fr,
                    })
                  : "JJ/MM/AAAA"}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={
                  formData.birthdate ? new Date(formData.birthdate) : new Date()
                }
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </Stack>

          {/* NFC Section */}
          <Stack>
            <Text
              style={{
                marginBottom: 4,
                color: theme.colors.text.DEFAULT,
                fontWeight: "600",
              }}
            >
              Tag NFC
            </Text>

            {formData.nfc ? (
              <View
                style={{
                  backgroundColor: "#e8f5e8",
                  borderRadius: 10,
                  padding: 15,
                  borderWidth: 1,
                  borderColor: "#28a745",
                  marginBottom: 12,
                }}
              >
                <XStack alignItems="center" space="$2">
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color="#28a745"
                  />
                  <Text
                    style={{
                      color: "#28a745",
                      fontWeight: "600",
                      flex: 1,
                    }}
                  >
                    Tag NFC configuré: {formData.nfc}
                  </Text>
                </XStack>
              </View>
            ) : (
              <Text
                style={{
                  fontSize: 14,
                  color: theme.colors.text.light,
                  marginBottom: 12,
                  lineHeight: 20,
                }}
              >
                Générez un tag NFC unique pour votre animal. Vous pourrez
                l&apos;écrire sur une puce NFC physique avec une app externe.
              </Text>
            )}

            <Button onPress={handleNfcScan} variant="outline">
              <Stack
                flexDirection="row"
                alignItems="center"
                justifyContent="center"
                space="$2"
              >
                <MaterialCommunityIcons
                  name={formData.nfc ? "tag-text" : "tag-plus"}
                  size={18}
                  color={theme.colors.primary.DEFAULT}
                />
                <Text
                  style={{
                    color: theme.colors.primary.DEFAULT,
                    fontSize: 16,
                  }}
                >
                  {formData.nfc ? "Modifier le tag NFC" : "Générer tag NFC"}
                </Text>
              </Stack>
            </Button>
          </Stack>

          {/* Vaccinations Section */}
          {/* <Stack>
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 16,
                marginBottom: 8,
                color: theme.colors.text.DEFAULT,
              }}
            >
              Vaccinations
            </Text>
            {vaccinations.map((v, idx) => (
              <XStack key={idx} space="$2" alignItems="center" marginBottom={8}>
                <Input
                  label="Nom"
                  value={v.name}
                  placeholder="Nom du vaccin"
                  onChangeText={(text) => {
                    const updated = [...vaccinations];
                    updated[idx].name = text;
                    setVaccinations(updated);
                  }}
                  style={{ flex: 1 }}
                />
                <TouchableOpacity
                  onPress={() => {
                    setVaccinations((vaccinations) =>
                      vaccinations.filter((_, i) => i !== idx)
                    );
                  }}
                  style={{ marginLeft: 4 }}
                  disabled={vaccinations.length === 1}
                >
                  <MaterialCommunityIcons
                    name="delete"
                    size={24}
                    color={theme.colors.error}
                  />
                </TouchableOpacity>
              </XStack>
            ))}
            {vaccinations.map((v, idx) => (
              <XStack
                key={"date-" + idx}
                space="$2"
                alignItems="center"
                marginBottom={8}
              >
                <Input
                  label="Date"
                  value={v.date}
                  placeholder="YYYY-MM-DD"
                  onChangeText={(text) => {
                    const updated = [...vaccinations];
                    updated[idx].date = text;
                    setVaccinations(updated);
                  }}
                  style={{ flex: 1 }}
                />
                <Input
                  label="Notes"
                  value={v.notes}
                  placeholder="Notes (optionnel)"
                  onChangeText={(text) => {
                    const updated = [...vaccinations];
                    updated[idx].notes = text;
                    setVaccinations(updated);
                  }}
                  style={{ flex: 1 }}
                />
              </XStack>
            ))}
            <Button
              variant="outline"
              onPress={() =>
                setVaccinations([
                  ...vaccinations,
                  { name: "", date: "", notes: "" },
                ])
              }
              style={{ marginTop: 8 }}
            >
              <XStack alignItems="center" space="$2">
                <MaterialCommunityIcons
                  name="plus"
                  size={18}
                  color={theme.colors.primary.DEFAULT}
                />
                <Text style={{ color: theme.colors.primary.DEFAULT }}>
                  Ajouter un vaccin
                </Text>
              </XStack>
            </Button>
          </Stack> */}

          {error && (
            <Text
              style={{
                color: theme.colors.error,
              }}
            >
              {error}
            </Text>
          )}

          <Button
            onPress={handleRegister}
            loading={loading}
            fullWidth
            style={{
              marginTop: 16,
            }}
          >
            Enregistrer
          </Button>
        </Stack>
      </Stack>

      {/* NFC Tag Generator Modal */}
      <NfcTagGenerator
        visible={nfcGeneratorVisible}
        onClose={() => setNfcGeneratorVisible(false)}
        onTagGenerated={handleNfcGenerated}
        animalName={formData.name || "votre animal"}
      />
    </ScrollView>
  );
}
