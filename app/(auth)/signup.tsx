import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Text } from "react-native";
import { Stack, XStack } from "tamagui";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import OcrComponent from "../../components/OcrComponent";
import { theme } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [ocrData, setOcrData] = useState<{
    lastname: string;
    firstname: string;
    cin: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    address: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    try {
      setError(null);
      if (formData.password !== formData.confirmPassword) {
        setError("Les mots de passe ne correspondent pas");
        return;
      }
      setLoading(true);
      await signUp(formData.email, formData.password, {
        name: ocrData ? `${ocrData.firstname} ${ocrData.lastname}` : undefined,
        cin: ocrData?.cin,
        address: formData.address,
        mobile: formData.mobile,
      });
      router.replace("/(app)");
    } catch (err) {
      console.error("Sign up error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de l'inscription"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView automaticallyAdjustKeyboardInsets style={{ height: "100%" }}>
      <Stack flex={1} backgroundColor="$background" padding="$4" height="100%">
        <Stack
          flex={1}
          justifyContent="center"
          alignItems="center"
          space="$4"
          height="100%"
        >
          {!ocrData ? (
            <OcrComponent onSuccess={setOcrData} />
          ) : (
            <Stack width="100%" space="$4">
              <Input label="Nom" value={ocrData.lastname} editable={false} />
              <Input
                label="Prénom"
                value={ocrData.firstname}
                editable={false}
              />
              <Input label="CIN" value={ocrData.cin} editable={false} />
              <Input
                label="Email"
                value={formData.email}
                onChangeText={(text) =>
                  setFormData({ ...formData, email: text })
                }
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Input
                label="Adresse"
                value={formData.address}
                onChangeText={(text) =>
                  setFormData({ ...formData, address: text })
                }
              />
              <Input
                label="Mobile"
                value={formData.mobile}
                onChangeText={(text) =>
                  setFormData({ ...formData, mobile: text })
                }
                keyboardType="phone-pad"
              />
              <Input
                label="Mot de passe"
                value={formData.password}
                onChangeText={(text) =>
                  setFormData({ ...formData, password: text })
                }
                secureTextEntry
              />
              <Input
                label="Confirmer le mot de passe"
                value={formData.confirmPassword}
                onChangeText={(text) =>
                  setFormData({ ...formData, confirmPassword: text })
                }
                secureTextEntry
              />
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
                onPress={handleSignUp}
                loading={loading}
                style={{
                  marginTop: 16,
                }}
              >
                S&apos;inscrire
              </Button>
              <XStack justifyContent="center" alignItems="center" space="$2">
                <Text style={{ color: theme.colors.text.DEFAULT }}>
                  Déjà un compte ?
                </Text>
                <Button variant="ghost" onPress={() => router.push("/login")}>
                  Se connecter
                </Button>
              </XStack>
            </Stack>
          )}
        </Stack>
      </Stack>
    </ScrollView>
  );
}
