import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { decode } from "base64-arraybuffer";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
} from "react-native";
import { Stack, XStack } from "tamagui";
import { Button } from "../../../../components/Button";
import { Input } from "../../../../components/Input";
import LocationTracker from "../../../../components/LocationTracker";
import { theme } from "../../../../constants/theme";
import { useAuth } from "../../../../contexts/AuthContext";
import { supabase } from "../../../../lib/supabase";

export default function EditAnimalScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    race: "",
    gender: "male",
    birthdate: "",
    image: "",
  });
  const [vaccinations, setVaccinations] = useState([
    { name: "", date: "", notes: "" },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

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

      if (data.owner_id !== user?.id) {
        throw new Error("Vous n'êtes pas autorisé à modifier cet animal");
      }

      setFormData({
        name: data.name,
        race: data.race,
        gender: data.gender,
        birthdate: data.birthdate,
        image: data.image,
      });
      setVaccinations(
        Array.isArray(data.vaccinations) && data.vaccinations.length > 0
          ? data.vaccinations
          : [{ name: "", date: "", notes: "" }]
      );
    } catch (err) {
      console.error("Error fetching animal:", err);
      setError(
        err instanceof Error ? err.message : "Une erreur inconnue est survenue"
      );
    } finally {
      setLoading(false);
    }
  };

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

  const handleSave = async () => {
    try {
      setError(null);
      setSaving(true);

      const { error } = await supabase
        .from("animals")
        .update({
          name: formData.name,
          race: formData.race,
          gender: formData.gender,
          birthdate: formData.birthdate,
          image: formData.image,
          vaccinations: vaccinations.filter((v) => v.name && v.date),
        })
        .eq("id", id);

      if (error) throw error;

      router.replace(`/animal/${id}`);
    } catch (err) {
      console.error("Error updating animal:", err);
      setError(
        err instanceof Error ? err.message : "Une erreur inconnue est survenue"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, birthdate: selectedDate.toISOString() });
    }
  };

  if (loading) {
    return (
      <Stack flex={1} justifyContent="center" alignItems="center">
        <Text style={{ color: theme.colors.text.light }}>Chargement...</Text>
      </Stack>
    );
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
          Modifier l&apos;animal
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
                  {uploading ? "Téléchargement..." : "Modifier la photo"}
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

          {/* Location Tracker */}
          <LocationTracker
            animalId={id as string}
            onLocationSaved={(location) => {
              console.log("Location saved:", location);
            }}
            onError={(error) => {
              setError(error);
            }}
          />

          {/* Vaccinations Section */}
          <Stack>
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
          </Stack>

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
            <Button variant="outline" onPress={() => router.back()}>
              Annuler
            </Button>

            <Button onPress={handleSave} loading={saving}>
              Enregistrer
            </Button>
          </XStack>
        </Stack>
      </Stack>
    </ScrollView>
  );
}
