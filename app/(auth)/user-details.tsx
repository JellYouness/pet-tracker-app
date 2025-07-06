import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Text } from "react-native";
import { Stack } from "tamagui";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { theme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

export default function UserDetailsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    full_name: "",
    cin: "",
    address: "",
    mobile: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setError(null);
      setLoading(true);
      if (
        !formData.full_name ||
        !formData.cin ||
        !formData.address ||
        !formData.mobile
      ) {
        setError("Veuillez remplir tous les champs");
        return;
      }
      console.log("user", user);
      console.log("formData", formData);
      const { error } = await supabase
        .from("users")
        .update({
          name: formData.full_name,
          cin: formData.cin,
          address: formData.address,
          mobile: formData.mobile,
        })
        .eq("id", user?.id);
      if (error) {
        console.error("Supabase error:", error);
        setError(error.message || JSON.stringify(error));
        return;
      }
      router.replace("/(app)");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack
      flex={1}
      backgroundColor="$background"
      padding="$4"
      justifyContent="center"
      alignItems="center"
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          marginBottom: 24,
          color: theme.colors.text.DEFAULT,
        }}
      >
        Complétez votre profil
      </Text>
      <Stack width="100%" space="$4">
        <Input
          label="Nom complet"
          value={formData.full_name}
          onChangeText={(text) => setFormData({ ...formData, full_name: text })}
        />
        <Input
          label="CIN"
          value={formData.cin}
          onChangeText={(text) => setFormData({ ...formData, cin: text })}
        />
        <Input
          label="Adresse"
          value={formData.address}
          onChangeText={(text) => setFormData({ ...formData, address: text })}
        />
        <Input
          label="Téléphone"
          value={formData.mobile}
          onChangeText={(text) => setFormData({ ...formData, mobile: text })}
          keyboardType="phone-pad"
        />
        {error && <Text style={{ color: theme.colors.error }}>{error}</Text>}
        <Button
          onPress={handleSubmit}
          loading={loading}
          style={{ marginTop: 16 }}
        >
          Enregistrer
        </Button>
      </Stack>
    </Stack>
  );
}
