import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, XStack } from "tamagui";
import PhotoUploadModal from "../../../../components/PhotoUploadModal";
import PhotoViewer from "../../../../components/PhotoViewer";
import { theme } from "../../../../constants/theme";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  deleteAnimalPhoto,
  fetchAnimalPhotos,
  setPrimaryPhoto,
  supabase,
  uploadAnimalPhoto,
} from "../../../../lib/supabase";

type AnimalPhoto = {
  id: string;
  animal_id: string;
  photo_url: string;
  photo_name?: string;
  description?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export default function AnimalGalleryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [photos, setPhotos] = useState<AnimalPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [animalName, setAnimalName] = useState("");
  const [animalOwnerId, setAnimalOwnerId] = useState<string>("");
  const [selectedPhoto, setSelectedPhoto] = useState<AnimalPhoto | null>(null);
  const [photoViewerVisible, setPhotoViewerVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAnimalName();
    }
  }, [id]);

  useEffect(() => {
    if (id && animalOwnerId) {
      fetchPhotos();
    }
  }, [id, animalOwnerId, user?.id]);

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

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const data = await fetchAnimalPhotos(id as string);
      setPhotos(data);
    } catch (error) {
      console.error("Error fetching photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPhotos();
    setRefreshing(false);
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri, "", "");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Erreur", "Impossible de sélectionner l'image");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission refusée",
          "Nous avons besoin de la permission de la caméra pour prendre une photo"
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri, "", "");
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Erreur", "Impossible de prendre la photo");
    }
  };

  const uploadPhoto = async (
    photoUri: string,
    photoName: string,
    description: string,
    base64?: string
  ) => {
    try {
      setUploading(true);
      await uploadAnimalPhoto(
        id as string,
        photoUri,
        photoName,
        description,
        false,
        base64
      );
      await fetchPhotos();
      Alert.alert("Succès", "Photo ajoutée avec succès");
      setUploadModalVisible(false);
    } catch (error) {
      console.error("Error uploading photo:", error);
      Alert.alert("Erreur", "Impossible d'ajouter la photo");
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert(
      "Confirmer la suppression",
      "Êtes-vous sûr de vouloir supprimer cette photo ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAnimalPhoto(photoId);
              await fetchPhotos();
              Alert.alert("Succès", "Photo supprimée avec succès");
            } catch (error) {
              console.error("Error deleting photo:", error);
              Alert.alert("Erreur", "Impossible de supprimer la photo");
            }
          },
        },
      ]
    );
  };

  const handleSetPrimary = async (photoId: string) => {
    try {
      await setPrimaryPhoto(photoId, id as string);
      await fetchPhotos();
      Alert.alert("Succès", "Photo principale mise à jour");
    } catch (error) {
      console.error("Error setting primary photo:", error);
      Alert.alert("Erreur", "Impossible de définir la photo principale");
    }
  };

  const renderPhoto = ({ item }: { item: AnimalPhoto }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedPhoto(item);
        setPhotoViewerVisible(true);
      }}
      style={{
        flex: 1,
        margin: 4,
        borderRadius: 12,
        backgroundColor: "white",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        position: "relative",
      }}
    >
      <Image
        source={{ uri: item.photo_url }}
        style={{
          width: "100%",
          height: 150,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        }}
        resizeMode="cover"
      />

      {/* Primary photo indicator */}
      {item.is_primary && (
        <View
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            backgroundColor: "#ffd700",
            borderRadius: 12,
            padding: 4,
          }}
        >
          <MaterialCommunityIcons name="star" size={16} color="white" />
        </View>
      )}

      {/* Edit mode overlay */}
      {isEditing && user?.id === animalOwnerId && (
        <View
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            borderRadius: 12,
            padding: 4,
          }}
        >
          <MaterialCommunityIcons name="pencil" size={16} color="white" />
        </View>
      )}

      <Stack padding="$2" space="$1">
        {item.photo_name && (
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: theme.colors.text.DEFAULT,
            }}
            numberOfLines={1}
          >
            {item.photo_name}
          </Text>
        )}

        <Text
          style={{
            fontSize: 10,
            color: theme.colors.text.light,
          }}
        >
          {new Date(item.created_at).toLocaleDateString("fr-FR")}
        </Text>

        {/* Edit mode actions */}
        {isEditing && user?.id === animalOwnerId && (
          <XStack space="$1" marginTop="$1">
            {/* {!item.is_primary && (
              <TouchableOpacity
                onPress={() => handleSetPrimary(item.id)}
                style={{
                  flex: 1,
                  backgroundColor: "#007bff",
                  padding: 4,
                  borderRadius: 4,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "white", fontSize: 10, fontWeight: "600" }}
                >
                  Principale
                </Text>
              </TouchableOpacity>
            )} */}

            <TouchableOpacity
              onPress={() => handleDeletePhoto(item.id)}
              style={{
                flex: 1,
                backgroundColor: "#dc3545",
                padding: 4,
                borderRadius: 4,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontSize: 10, fontWeight: "600" }}>
                Supprimer
              </Text>
            </TouchableOpacity>
          </XStack>
        )}
      </Stack>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <Stack flex={1} justifyContent="center" alignItems="center">
        <Text style={{ color: theme.colors.text.light }}>Chargement...</Text>
      </Stack>
    );
  }

  return (
    <Stack flex={1} backgroundColor={theme.colors.background.DEFAULT}>
      {/* Header */}
      <Stack
        padding="$4"
        backgroundColor="white"
        borderBottomWidth={1}
        borderBottomColor="#e9ecef"
      >
        <XStack alignItems="center" justifyContent="space-between">
          <Stack flex={1}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: theme.colors.text.DEFAULT,
              }}
            >
              Galerie de {animalName}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: theme.colors.text.light,
                marginTop: 4,
              }}
            >
              {photos.length} photo{photos.length !== 1 ? "s" : ""}
            </Text>
          </Stack>

          <XStack space="$2">
            {/* Edit button - only visible to owner */}
            {user?.id === animalOwnerId && (
              <TouchableOpacity
                onPress={() => setIsEditing(!isEditing)}
                style={{
                  padding: 8,
                  borderRadius: 20,
                  backgroundColor: isEditing ? "#007bff" : "#f8f9fa",
                }}
              >
                <MaterialCommunityIcons
                  name={isEditing ? "check" : "pencil"}
                  size={24}
                  color={isEditing ? "white" : theme.colors.text.DEFAULT}
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                padding: 8,
                borderRadius: 20,
                backgroundColor: "#f8f9fa",
              }}
            >
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={theme.colors.text.DEFAULT}
              />
            </TouchableOpacity>
          </XStack>
        </XStack>
      </Stack>

      {/* Add Photo Button - only visible to owner */}
      {user?.id === animalOwnerId && (
        <Stack padding="$4" backgroundColor="white">
          <TouchableOpacity
            onPress={() => setUploadModalVisible(true)}
            disabled={uploading}
            style={{
              backgroundColor: "#007bff",
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
              opacity: uploading ? 0.6 : 1,
            }}
          >
            <MaterialCommunityIcons name="image-plus" size={24} color="white" />
            <Text
              style={{
                color: "white",
                fontWeight: "600",
                marginTop: 8,
              }}
            >
              Ajouter une photo
            </Text>
          </TouchableOpacity>
        </Stack>
      )}

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <Stack
          flex={1}
          justifyContent="center"
          alignItems="center"
          padding="$4"
        >
          <MaterialCommunityIcons
            name="image-outline"
            size={64}
            color={theme.colors.text.light}
          />
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: theme.colors.text.DEFAULT,
              marginTop: 16,
              textAlign: "center",
            }}
          >
            Aucune photo
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.text.light,
              marginTop: 8,
              textAlign: "center",
            }}
          >
            {user?.id === animalOwnerId
              ? `Ajoutez la première photo de ${animalName} en utilisant le bouton ci-dessus`
              : `Aucune photo disponible pour ${animalName}`}
          </Text>
        </Stack>
      ) : (
        <FlatList
          data={photos}
          renderItem={renderPhoto}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 4 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{ justifyContent: "space-between" }}
        />
      )}

      {/* Photo Viewer Modal */}
      <PhotoViewer
        visible={photoViewerVisible}
        photoUrl={selectedPhoto?.photo_url || ""}
        photoName={selectedPhoto?.photo_name}
        description={selectedPhoto?.description}
        onClose={() => {
          setPhotoViewerVisible(false);
          setSelectedPhoto(null);
        }}
      />

      {/* Photo Upload Modal */}
      <PhotoUploadModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onPhotoSelected={uploadPhoto}
        loading={uploading}
      />
    </Stack>
  );
}
