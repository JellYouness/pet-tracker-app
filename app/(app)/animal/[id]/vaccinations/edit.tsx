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

interface Vaccination {
  id?: string;
  name: string;
  date: string;
  next_due_date: string;
  veterinarian: string;
  notes?: string;
}

export default function EditVaccinationsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [animalName, setAnimalName] = useState("");
  const [showDatePicker, setShowDatePicker] = useState<{
    index: number;
    field: "date" | "next_due_date";
  } | null>(null);

  useEffect(() => {
    if (id) {
      fetchVaccinations();
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

  const fetchVaccinations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("vaccinations")
        .select("*")
        .eq("animal_id", id)
        .order("date", { ascending: false });

      if (error) throw error;
      setVaccinations(data || []);
    } catch (error) {
      console.error("Error fetching vaccinations:", error);
    } finally {
      setLoading(false);
    }
  };

  const addVaccination = () => {
    setVaccinations([
      ...vaccinations,
      {
        name: "",
        date: "",
        next_due_date: "",
        veterinarian: "",
        notes: "",
      },
    ]);
  };

  const updateVaccination = useCallback(
    (index: number, field: keyof Vaccination, value: string) => {
      setVaccinations((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    },
    []
  );

  const removeVaccination = useCallback((index: number) => {
    Alert.alert(
      "Supprimer la vaccination",
      "Êtes-vous sûr de vouloir supprimer cette vaccination ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            setVaccinations((prev) => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
  }, []);

  const handleDatePickerPress = useCallback(
    (index: number, field: "date" | "next_due_date") => {
      setShowDatePicker({ index, field });
    },
    []
  );

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(null);
    if (selectedDate && showDatePicker) {
      const dateString = selectedDate.toISOString().split("T")[0];
      updateVaccination(showDatePicker.index, showDatePicker.field, dateString);
    }
  };

  const saveVaccinations = async () => {
    try {
      setSaving(true);

      // Validate required fields
      const invalidVaccinations = vaccinations.filter(
        (v) => !v.name || !v.date || !v.next_due_date || !v.veterinarian
      );

      if (invalidVaccinations.length > 0) {
        Alert.alert(
          "Champs manquants",
          "Veuillez remplir tous les champs obligatoires (nom, date, prochaine échéance, vétérinaire) pour chaque vaccination."
        );
        return;
      }

      // Get existing vaccination IDs to delete
      const existingIds = vaccinations.filter((v) => v.id).map((v) => v.id!);

      // Delete existing vaccinations
      if (existingIds.length > 0) {
        const { error: deleteError } = await supabase
          .from("vaccinations")
          .delete()
          .in("id", existingIds);

        if (deleteError) throw deleteError;
      }

      // Insert new vaccinations
      if (vaccinations.length > 0) {
        const vaccinationsToInsert = vaccinations.map((v) => ({
          animal_id: id,
          name: v.name,
          date: v.date,
          next_due_date: v.next_due_date,
          veterinarian: v.veterinarian,
          notes: v.notes || null,
        }));

        const { error: insertError } = await supabase
          .from("vaccinations")
          .insert(vaccinationsToInsert);

        if (insertError) throw insertError;
      }

      Alert.alert(
        "Succès",
        "Les vaccinations ont été mises à jour avec succès.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error("Error saving vaccinations:", error);
      Alert.alert(
        "Erreur",
        "Impossible de sauvegarder les vaccinations. Veuillez réessayer."
      );
    } finally {
      setSaving(false);
    }
  };

  const VaccinationForm = React.memo(
    ({ vaccination, index }: { vaccination: Vaccination; index: number }) => (
      <View style={[styles.vaccinationCard, { marginBottom: 16 }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Vaccination {index + 1}</Text>
          <TouchableOpacity
            onPress={() => removeVaccination(index)}
            style={styles.deleteButton}
          >
            <MaterialCommunityIcons name="delete" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>

        <Stack space="$3">
          <Input
            label="Nom du vaccin *"
            value={vaccination.name}
            onChangeText={(text) => updateVaccination(index, "name", text)}
            placeholder="Ex: Vaccin contre la rage"
          />

          <Stack>
            <Text style={styles.label}>Date de vaccination *</Text>
            <TouchableOpacity
              onPress={() => handleDatePickerPress(index, "date")}
              style={styles.dateButton}
            >
              <Text style={styles.dateButtonText}>
                {vaccination.date
                  ? format(new Date(vaccination.date), "dd/MM/yyyy", {
                      locale: fr,
                    })
                  : "Sélectionner une date"}
              </Text>
              <MaterialCommunityIcons name="calendar" size={20} color="#666" />
            </TouchableOpacity>
          </Stack>

          <Stack>
            <Text style={styles.label}>Prochaine échéance *</Text>
            <TouchableOpacity
              onPress={() => handleDatePickerPress(index, "next_due_date")}
              style={styles.dateButton}
            >
              <Text style={styles.dateButtonText}>
                {vaccination.next_due_date
                  ? format(new Date(vaccination.next_due_date), "dd/MM/yyyy", {
                      locale: fr,
                    })
                  : "Sélectionner une date"}
              </Text>
              <MaterialCommunityIcons name="calendar" size={20} color="#666" />
            </TouchableOpacity>
          </Stack>

          <Input
            label="Vétérinaire *"
            value={vaccination.veterinarian}
            onChangeText={(text) =>
              updateVaccination(index, "veterinarian", text)
            }
            placeholder="Nom du vétérinaire"
          />

          <Input
            label="Notes (optionnel)"
            value={vaccination.notes || ""}
            onChangeText={(text) => updateVaccination(index, "notes", text)}
            placeholder="Notes supplémentaires"
            multiline
            numberOfLines={3}
          />
        </Stack>
      </View>
    )
  );
  VaccinationForm.displayName = "VaccinationForm";

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement des vaccinations...</Text>
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
        <Text style={styles.headerTitle}>Modifier les vaccinations</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Text style={styles.animalName}>{animalName}</Text>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <Stack space="$4" padding="$4">
          {vaccinations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="needle" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                Aucune vaccination enregistrée
              </Text>
              <Text style={styles.emptySubtext}>
                Ajoutez la première vaccination pour cet animal
              </Text>
            </View>
          ) : (
            vaccinations.map((vaccination, index) => (
              <VaccinationForm
                key={index}
                vaccination={vaccination}
                index={index}
              />
            ))
          )}

          <Button
            variant="outline"
            onPress={addVaccination}
            style={styles.addButton}
          >
            <XStack alignItems="center" space="$2">
              <MaterialCommunityIcons
                name="plus"
                size={20}
                color={theme.colors.primary.DEFAULT}
              />
              <Text style={{ color: theme.colors.primary.DEFAULT }}>
                Ajouter une vaccination
              </Text>
            </XStack>
          </Button>

          <XStack space="$4" marginTop="$4">
            <Button
              variant="outline"
              onPress={() => router.back()}
              style={{ flex: 1 }}
            >
              Annuler
            </Button>
            <Button
              onPress={saveVaccinations}
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
            vaccinations[showDatePicker.index][showDatePicker.field]
              ? new Date(
                  vaccinations[showDatePicker.index][showDatePicker.field]
                )
              : new Date()
          }
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
          maximumDate={
            showDatePicker.field === "next_due_date" ? undefined : new Date()
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
  emptyContainer: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
  vaccinationCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text.DEFAULT,
  },
  deleteButton: {
    padding: 4,
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
  addButton: {
    marginTop: 16,
  },
});
