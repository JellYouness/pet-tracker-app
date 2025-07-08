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

interface MedicalInfo {
  id: string;
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

export default function MedicalInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [medicalInfo, setMedicalInfo] = useState<MedicalInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [animalName, setAnimalName] = useState("");
  const [animalOwnerId, setAnimalOwnerId] = useState<string>("");

  useEffect(() => {
    if (id) {
      fetchAnimalName();
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchMedicalInfo();
    }
  }, [id]);

  const fetchAnimalName = async () => {
    try {
      const { data, error } = await supabase
        .from("animals")
        .select("name, owner_id")
        .eq("id", id)
        .single();

      if (error) throw error;
      setAnimalName(data?.name || "");
      setAnimalOwnerId(data?.owner_id || "");
    } catch (error) {
      console.error("Error fetching animal name:", error);
    }
  };

  const fetchMedicalInfo = async () => {
    try {
      setLoading(true);
      // Fetch medical info for all users (view-only for non-owners)
      const { data, error } = await supabase
        .from("medical_info")
        .select("*")
        .eq("animal_id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No medical info found, create empty object
          setMedicalInfo({
            id: "",
            blood_type: "",
            allergies: "",
            chronic_conditions: "",
            medications: "",
            special_diet: "",
            behavioral_notes: "",
            emergency_contact: "",
            insurance_info: "",
            microchip_number: "",
            last_checkup_date: "",
            next_checkup_date: "",
            veterinarian_name: "",
            veterinarian_phone: "",
          });
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Non spécifiée";
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const InfoCard = ({
    title,
    value,
    icon,
    color = theme.colors.primary.DEFAULT,
    isImportant = false,
  }: {
    title: string;
    value: string;
    icon: string;
    color?: string;
    isImportant?: boolean;
  }) => (
    <View style={[styles.infoCard, isImportant && styles.importantCard]}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name={icon as any} size={24} color={color} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={[styles.cardValue, isImportant && styles.importantText]}>
        {value || "Non spécifié"}
      </Text>
    </View>
  );

  const EmergencySection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Informations d'urgence</Text>
      <Stack space="$3">
        <InfoCard
          title="Contact d'urgence"
          value={medicalInfo?.emergency_contact || ""}
          icon="phone-alert"
          color="#e74c3c"
          isImportant={true}
        />
        <InfoCard
          title="Vétérinaire"
          value={medicalInfo?.veterinarian_name || ""}
          icon="account-tie"
          color="#3498db"
        />
        <InfoCard
          title="Téléphone vétérinaire"
          value={medicalInfo?.veterinarian_phone || ""}
          icon="phone"
          color="#3498db"
        />
      </Stack>
    </View>
  );

  const HealthSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>État de santé</Text>
      <Stack space="$3">
        <InfoCard
          title="Groupe sanguin"
          value={medicalInfo?.blood_type || ""}
          icon="blood-bag"
          color="#e74c3c"
        />
        <InfoCard
          title="Allergies"
          value={medicalInfo?.allergies || ""}
          icon="alert-circle"
          color="#f39c12"
        />
        <InfoCard
          title="Conditions chroniques"
          value={medicalInfo?.chronic_conditions || ""}
          icon="medical-bag"
          color="#9b59b6"
        />
        <InfoCard
          title="Médicaments"
          value={medicalInfo?.medications || ""}
          icon="pill"
          color="#e67e22"
        />
      </Stack>
    </View>
  );

  const CareSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Soins et suivi</Text>
      <Stack space="$3">
        <InfoCard
          title="Régime spécial"
          value={medicalInfo?.special_diet || ""}
          icon="food-apple"
          color="#27ae60"
        />
        <InfoCard
          title="Notes comportementales"
          value={medicalInfo?.behavioral_notes || ""}
          icon="brain"
          color="#8e44ad"
        />
        <InfoCard
          title="Dernier contrôle"
          value={formatDate(medicalInfo?.last_checkup_date)}
          icon="calendar-check"
          color="#16a085"
        />
        <InfoCard
          title="Prochain contrôle"
          value={formatDate(medicalInfo?.next_checkup_date)}
          icon="calendar-clock"
          color="#2980b9"
        />
      </Stack>
    </View>
  );

  const IdentificationSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Identification</Text>
      <Stack space="$3">
        <InfoCard
          title="Numéro de puce"
          value={medicalInfo?.microchip_number || ""}
          icon="chip"
          color="#34495e"
        />
        <InfoCard
          title="Assurance"
          value={medicalInfo?.insurance_info || ""}
          icon="shield-check"
          color="#2ecc71"
        />
      </Stack>
    </View>
  );

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
        <Text style={styles.headerTitle}>Informations médicales</Text>
        {user?.id === animalOwnerId && (
          <TouchableOpacity
            onPress={() => router.push(`/animal/${id}/medical-info/edit`)}
            style={styles.editButton}
          >
            <MaterialCommunityIcons
              name="pencil"
              size={20}
              color={theme.colors.primary.DEFAULT}
            />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.animalName}>{animalName}</Text>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              Chargement des informations médicales...
            </Text>
          </View>
        ) : (
          <Stack space="$6" padding="$4">
            <EmergencySection />
            <HealthSection />
            <CareSection />
            <IdentificationSection />
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
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text.DEFAULT,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  infoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  importantCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#e74c3c",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginLeft: 8,
  },
  cardValue: {
    fontSize: 16,
    color: theme.colors.text.DEFAULT,
    fontWeight: "500",
    paddingLeft: 32,
  },
  importantText: {
    color: "#e74c3c",
    fontWeight: "bold",
  },
});
