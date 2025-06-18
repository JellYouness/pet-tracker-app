import { MaterialCommunityIcons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
} from "react-native";
import { Stack, XStack } from "tamagui";
import { Button } from "../../../components/Button";
import { Input } from "../../../components/Input";
import { theme } from "../../../constants/theme";
import { useAuth } from "../../../contexts/AuthContext";
import { supabase } from "../../../lib/supabase";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
   const [showDatePicker, setShowDatePicker] = useState(false);

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
          owner_id: process.env.EXPO_PUBLIC_DISABLE_AUTH
            ? "722fa0c8-7f1f-44a1-8fa4-f3e48c5500f0"
            : user?.id,
          image:
            formData.image ||
            "https://api.dicebear.com/7.x/shapes/svg?seed=" + formData.name,
          nfc_id: formData.nfc,
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

  const handleNfcScan = () => {
    // const tag = await startScanning();
    const tag = { id: "1234567890" };
    if (tag) {
      setFormData({ ...formData, nfc: tag.id });
    }
  };

    const handleDateChange = (event: any, selectedDate?: Date) => {
      setShowDatePicker(false);
      if (selectedDate) {
        setFormData({ ...formData, birthdate: selectedDate.toISOString() });
      }
    };

  return (
    <ScrollView>
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

          {/* add NFC scan button */}
          <Button onPress={handleNfcScan} variant="outline">
            <Stack
              flexDirection="row"
              alignItems="center"
              justifyContent="center"
              space="$2"
            >
              <MaterialCommunityIcons
                name="cellphone-nfc"
                size={18}
                color={theme.colors.primary.DEFAULT}
              />
              <Text
                style={{
                  color: theme.colors.primary.DEFAULT,
                  fontSize: 16,
                }}
              >
                Scanner NFC
              </Text>
            </Stack>
          </Button>

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
    </ScrollView>
  );
}
