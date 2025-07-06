import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { theme } from "../../../constants/theme";
import { useAuth } from "../../../contexts/AuthContext";
import { useTransferNotifications } from "../../../contexts/TransferNotificationsContext";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { hasPendingTransfers, pendingCount } = useTransferNotifications();

  const handleSignOut = () => {
    Alert.alert(
      "Confirmer la déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Déconnecter",
          style: "destructive",
          onPress: signOut,
        },
      ]
    );
  };

  const ProfileCard = ({
    title,
    value,
    icon,
  }: {
    title: string;
    value: string;
    icon: string;
  }) => (
    <View style={styles.profileCard}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons
          name={icon as any}
          size={20}
          color={theme.colors.primary.DEFAULT}
        />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <MaterialCommunityIcons
            name="account-circle"
            size={80}
            color={theme.colors.primary.DEFAULT}
          />
        </View>
        <Text style={styles.userName}>{user?.name || "Utilisateur"}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      {/* Profile Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>

        <ProfileCard
          title="Nom complet"
          value={user?.name || "Non spécifié"}
          icon="account"
        />

        <ProfileCard
          title="Email"
          value={user?.email || "Non spécifié"}
          icon="email"
        />

        <ProfileCard
          title="CIN"
          value={user?.cin || "Non spécifié"}
          icon="card-account-details"
        />

        <ProfileCard
          title="Adresse"
          value={user?.address || "Non spécifiée"}
          icon="map-marker"
        />

        <ProfileCard
          title="Téléphone mobile"
          value={user?.mobile || "Non spécifié"}
          icon="phone"
        />
      </View>

      {/* Actions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/profile/edit")}
        >
          <View style={styles.actionContent}>
            <MaterialCommunityIcons
              name="account-edit"
              size={24}
              color={theme.colors.primary.DEFAULT}
            />
            <Text style={styles.actionText}>Modifier le profil</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/ownership-transfers")}
        >
          <View style={styles.actionContent}>
            <MaterialCommunityIcons
              name="account-switch"
              size={24}
              color={theme.colors.primary.DEFAULT}
            />
            <Text style={styles.actionText}>Transferts de propriété</Text>
            {hasPendingTransfers && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>
                  {pendingCount > 9 ? "9+" : pendingCount.toString()}
                </Text>
              </View>
            )}
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleSignOut}
        >
          <View style={styles.actionContent}>
            <MaterialCommunityIcons name="logout" size={24} color="#e74c3c" />
            <Text style={[styles.actionText, styles.dangerText]}>
              Se déconnecter
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* App Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>À propos de l&apos;application</Text>

        <View style={styles.infoCard}>
          <MaterialCommunityIcons
            name="paw"
            size={24}
            color={theme.colors.primary.DEFAULT}
          />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Pet Tracker</Text>
            <Text style={styles.infoSubtitle}>Version 1.0.0</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "white",
    padding: 24,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: theme.colors.primary.DEFAULT,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  profileCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    color: "#333",
    fontWeight: "500",
  },
  actionButton: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  actionText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    marginLeft: 12,
  },
  dangerButton: {
    borderColor: "#ffebee",
  },
  dangerText: {
    color: "#e74c3c",
  },
  notificationBadge: {
    backgroundColor: "#e74c3c",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  infoCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  infoContent: {
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  infoSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
});
