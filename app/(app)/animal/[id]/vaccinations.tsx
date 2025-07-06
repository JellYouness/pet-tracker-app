import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack } from "tamagui";
import { theme } from "../../../../constants/theme";
import { useAuth } from "../../../../contexts/AuthContext";
import { supabase } from "../../../../lib/supabase";

interface Vaccination {
  id: string;
  name: string;
  date: string;
  next_due_date: string;
  veterinarian: string;
  notes?: string;
}

export default function VaccinationsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);
  const [animalName, setAnimalName] = useState("");

  useEffect(() => {
    if (id) {
      fetchVaccinations();
      fetchAnimalName();
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const isUpcoming = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    return due > now && due <= thirtyDaysFromNow;
  };

  const VaccinationCard = ({ vaccination }: { vaccination: Vaccination }) => {
    const overdue = isOverdue(vaccination.next_due_date);
    const upcoming = isUpcoming(vaccination.next_due_date);

    return (
      <View style={styles.vaccinationCard}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons
            name="needle"
            size={24}
            color={theme.colors.primary.DEFAULT}
          />
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>{vaccination.name}</Text>
            {overdue && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>En retard</Text>
              </View>
            )}
            {upcoming && !overdue && (
              <View style={[styles.statusBadge, styles.upcomingBadge]}>
                <Text style={styles.statusText}>Prochainement</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="calendar" size={16} color="#666" />
            <Text style={styles.infoLabel}>Date de vaccination:</Text>
            <Text style={styles.infoValue}>{formatDate(vaccination.date)}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="calendar-clock"
              size={16}
              color="#666"
            />
            <Text style={styles.infoLabel}>Prochaine échéance:</Text>
            <Text style={[styles.infoValue, overdue && styles.overdueText]}>
              {formatDate(vaccination.next_due_date)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account-tie" size={16} color="#666" />
            <Text style={styles.infoLabel}>Vétérinaire:</Text>
            <Text style={styles.infoValue}>{vaccination.veterinarian}</Text>
          </View>

          {vaccination.notes && (
            <View style={styles.notesContainer}>
              <MaterialCommunityIcons name="note-text" size={16} color="#666" />
              <Text style={styles.notesText}>{vaccination.notes}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>Vaccinations</Text>
        <TouchableOpacity
          onPress={() => router.push(`/animal/${id}/vaccinations/edit`)}
          style={styles.editButton}
        >
          <MaterialCommunityIcons
            name="pencil"
            size={20}
            color={theme.colors.primary.DEFAULT}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.animalName}>{animalName}</Text>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              Chargement des vaccinations...
            </Text>
          </View>
        ) : vaccinations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="needle-off" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Aucune vaccination enregistrée</Text>
            <Text style={styles.emptySubtext}>
              Les vaccinations de cet animal apparaîtront ici
            </Text>
          </View>
        ) : (
          <Stack space="$4" padding="$4">
            {vaccinations.map((vaccination) => (
              <VaccinationCard key={vaccination.id} vaccination={vaccination} />
            ))}
          </Stack>
        )}
      </ScrollView>
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
  editButton: {
    padding: 8,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
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
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitleContainer: {
    flex: 1,
    marginLeft: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text.DEFAULT,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: "#e74c3c",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  upcomingBadge: {
    backgroundColor: "#f39c12",
  },
  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  cardContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    minWidth: 120,
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.text.DEFAULT,
    fontWeight: "500",
    flex: 1,
  },
  overdueText: {
    color: "#e74c3c",
    fontWeight: "bold",
  },
  notesContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  notesText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    fontStyle: "italic",
  },
});
