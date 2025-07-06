import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, XStack } from "tamagui";
import { Button } from "../../../../../components/Button";
import { Input } from "../../../../../components/Input";
import { theme } from "../../../../../constants/theme";
import { supabase } from "../../../../../lib/supabase";

interface MedicalInfo {
  id?: string;
  blood_type?: string;
  allergies?: string;
  chronic_conditions?: string;
  medications?: string;
  special_diet?: string;
  behavioral_notes?: string;
  emergency_contact?: string;
  insurance_info?: string;
  microchip_number?: string;
  last_checkup_date?: string;
  next_checkup_date?: string;
  veterinarian_name?: string;
  veterinarian_phone?: string;
}

export default function EditMedicalInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [medicalInfo, setMedicalInfo] = useState<MedicalInfo>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [animalName, setAnimalName] = useState("");
  const [showDatePicker, setShowDatePicker] = useState<
    "last_checkup" | "next_checkup" | null
  >(null);

  useEffect(() => {
    if (id) {
      fetchMedicalInfo();
      fetchAnimalName();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchAnimalName = async () => {
    try {
      const { data, error } = await supabase
        .from("animals")
        .select("name")
        .eq("id", id)
        .single();

      if (error) throw error;
      setAnimalName(data?.name || "");
    } catch (error) {
      console.error("Error fetching animal name:", error);
    }
  };

  const fetchMedicalInfo = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("medical_info")
        .select("*")
        .eq("animal_id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No medical info found, start with empty object
          setMedicalInfo({});
        } else {
          throw error;
        }
      } else {
        setMedicalInfo(data);
      }
    } catch (error) {
      console.error("Error fetching medical info:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = useCallback((field: keyof MedicalInfo, value: string) => {
    setMedicalInfo((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleDatePickerPress = useCallback(
    (field: "last_checkup" | "next_checkup") => {
      setShowDatePicker(field);
    },
    []
  );

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(null);
    if (selectedDate && showDatePicker) {
      const dateString = selectedDate.toISOString().split("T")[0];
      updateField(
        showDatePicker === "last_checkup"
          ? "last_checkup_date"
          : "next_checkup_date",
        dateString
      );
    }
  };

  const saveMedicalInfo = async () => {
    try {
      setSaving(true);

      const medicalData = {
        animal_id: id,
        blood_type: medicalInfo.blood_type || null,
        allergies: medicalInfo.allergies || null,
        chronic_conditions: medicalInfo.chronic_conditions || null,
        medications: medicalInfo.medications || null,
        special_diet: medicalInfo.special_diet || null,
        behavioral_notes: medicalInfo.behavioral_notes || null,
        emergency_contact: medicalInfo.emergency_contact || null,
        insurance_info: medicalInfo.insurance_info || null,
        microchip_number: medicalInfo.microchip_number || null,
        last_checkup_date: medicalInfo.last_checkup_date || null,
        next_checkup_date: medicalInfo.next_checkup_date || null,
        veterinarian_name: medicalInfo.veterinarian_name || null,
        veterinarian_phone: medicalInfo.veterinarian_phone || null,
      };

      if (medicalInfo.id) {
        // Update existing record
        const { error } = await supabase
          .from("medical_info")
          .update(medicalData)
          .eq("id", medicalInfo.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from("medical_info")
          .insert(medicalData);

        if (error) throw error;
      }

      Alert.alert(
        "Succès",
        "Les informations médicales ont été mises à jour avec succès.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error("Error saving medical info:", error);
      Alert.alert(
        "Erreur",
        "Impossible de sauvegarder les informations médicales. Veuillez réessayer."
      );
    } finally {
      setSaving(false);
    }
  };

  const InfoSection = React.memo(
    ({ title, children }: { title: string; children: React.ReactNode }) => (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionContent}>{children}</View>
      </View>
    )
  );
  InfoSection.displayName = "InfoSection";

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>
          Chargement des informations médicales...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="arrow-left"
          size={24}
          color={theme.colors.text.DEFAULT}
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>
          Modifier les informations médicales
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <Text style={styles.animalName}>{animalName}</Text>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <Stack space="$4" padding="$4">
          <InfoSection title="Informations d'urgence">
            <Input
              label="Contact d'urgence"
              value={medicalInfo.emergency_contact || ""}
              onChangeText={(text) => updateField("emergency_contact", text)}
              placeholder="Numéro de téléphone d'urgence"
            />
            <Input
              label="Vétérinaire"
              value={medicalInfo.veterinarian_name || ""}
              onChangeText={(text) => updateField("veterinarian_name", text)}
              placeholder="Nom du vétérinaire"
            />
            <Input
              label="Téléphone vétérinaire"
              value={medicalInfo.veterinarian_phone || ""}
              onChangeText={(text) => updateField("veterinarian_phone", text)}
              placeholder="Numéro de téléphone du vétérinaire"
              keyboardType="phone-pad"
            />
          </InfoSection>

          <InfoSection title="État de santé">
            <Input
              label="Groupe sanguin"
              value={medicalInfo.blood_type || ""}
              onChangeText={(text) => updateField("blood_type", text)}
              placeholder="Ex: A+, B-, etc."
            />
            <Input
              label="Allergies"
              value={medicalInfo.allergies || ""}
              onChangeText={(text) => updateField("allergies", text)}
              placeholder="Allergies connues"
              multiline
              numberOfLines={2}
            />
            <Input
              label="Conditions chroniques"
              value={medicalInfo.chronic_conditions || ""}
              onChangeText={(text) => updateField("chronic_conditions", text)}
              placeholder="Conditions médicales chroniques"
              multiline
              numberOfLines={2}
            />
            <Input
              label="Médicaments"
              value={medicalInfo.medications || ""}
              onChangeText={(text) => updateField("medications", text)}
              placeholder="Médicaments en cours"
              multiline
              numberOfLines={2}
            />
          </InfoSection>

          <InfoSection title="Soins et suivi">
            <Input
              label="Régime spécial"
              value={medicalInfo.special_diet || ""}
              onChangeText={(text) => updateField("special_diet", text)}
              placeholder="Régime alimentaire spécial"
              multiline
              numberOfLines={2}
            />
            <Input
              label="Notes comportementales"
              value={medicalInfo.behavioral_notes || ""}
              onChangeText={(text) => updateField("behavioral_notes", text)}
              placeholder="Notes sur le comportement"
              multiline
              numberOfLines={3}
            />
            <Stack>
              <Text style={styles.label}>Dernier contrôle</Text>
              <TouchableOpacity
                onPress={() => handleDatePickerPress("last_checkup")}
                style={styles.dateButton}
              >
                <Text style={styles.dateButtonText}>
                  {medicalInfo.last_checkup_date
                    ? format(
                        new Date(medicalInfo.last_checkup_date),
                        "dd/MM/yyyy",
                        { locale: fr }
                      )
                    : "Sélectionner une date"}
                </Text>
                <MaterialCommunityIcons
                  name="calendar"
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </Stack>
            <Stack>
              <Text style={styles.label}>Prochain contrôle</Text>
              <TouchableOpacity
                onPress={() => handleDatePickerPress("next_checkup")}
                style={styles.dateButton}
              >
                <Text style={styles.dateButtonText}>
                  {medicalInfo.next_checkup_date
                    ? format(
                        new Date(medicalInfo.next_checkup_date),
                        "dd/MM/yyyy",
                        { locale: fr }
                      )
                    : "Sélectionner une date"}
                </Text>
                <MaterialCommunityIcons
                  name="calendar"
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </Stack>
          </InfoSection>

          <InfoSection title="Identification">
            <Input
              label="Numéro de puce"
              value={medicalInfo.microchip_number || ""}
              onChangeText={(text) => updateField("microchip_number", text)}
              placeholder="Numéro de puce électronique"
            />
            <Input
              label="Assurance"
              value={medicalInfo.insurance_info || ""}
              onChangeText={(text) => updateField("insurance_info", text)}
              placeholder="Informations d'assurance"
              multiline
              numberOfLines={2}
            />
          </InfoSection>

          <XStack space="$4" marginTop="$4">
            <Button
              variant="outline"
              onPress={() => router.back()}
              style={{ flex: 1 }}
            >
              Annuler
            </Button>
            <Button
              onPress={saveMedicalInfo}
              loading={saving}
              style={{ flex: 1 }}
            >
              Enregistrer
            </Button>
          </XStack>
        </Stack>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={
            (
              showDatePicker === "last_checkup"
                ? medicalInfo.last_checkup_date
                : medicalInfo.next_checkup_date
            )
              ? new Date(
                  showDatePicker === "last_checkup"
                    ? medicalInfo.last_checkup_date!
                    : medicalInfo.next_checkup_date!
                )
              : new Date()
          }
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
          maximumDate={
            showDatePicker === "next_checkup" ? undefined : new Date()
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text.DEFAULT,
  },
  headerSpacer: {
    width: 40,
  },
  animalName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text.DEFAULT,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    marginTop: 20,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text.DEFAULT,
    marginBottom: 16,
  },
  sectionContent: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text.DEFAULT,
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  dateButtonText: {
    fontSize: 16,
    color: theme.colors.text.DEFAULT,
  },
});
