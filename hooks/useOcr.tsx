import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert } from "react-native";

const BACKEND_URL = Constants.expoConfig?.extra?.ocrUrl + "/mrz-scan";

interface OcrData {
  lastname: string;
  firstname: string;
  cin: string;
}

interface UseOcrReturn {
  loading: boolean;
  error: string | null;
  imageUri: string | null;
  ocrResult: any;
  pickImage: () => Promise<void>;
  clearError: () => void;
  clearResult: () => void;
  pickImageAndSendToBackend: () => Promise<any>;
}

export const useOcr = (onSuccess?: (data: OcrData) => void): UseOcrReturn => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);
  const clearResult = () => setOcrResult(null);

  const pickImage = async () => {
    setError(null);
    setOcrResult(null);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library to upload a photo."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      await sendToBackend(result.assets[0].uri);
    }
  };

  const sendToBackend = async (uri: string) => {
    try {
      setLoading(true);
      setError(null);
      setOcrResult(null);

      console.log("Sending image to backend:", { uri, BACKEND_URL });
      const formData = new FormData();
      // @ts-ignore
      formData.append("image", {
        uri,
        name: "photo.jpg",
        type: "image/jpeg",
      });

      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Erreur lors de l'analyse OCR");
      } else {
        setOcrResult(data);
        if (data.lastname && data.firstname && data.cin) {
          const ocrData: OcrData = {
            lastname: data.lastname,
            firstname: data.firstname,
            cin: data.cin,
          };
          onSuccess?.(ocrData);
        }
      }
    } catch (e: any) {
      console.log("Error sending to backend:", e);
      setError(e.message || "Erreur lors de l'envoi de l'image");
    } finally {
      setLoading(false);
    }
  };

  const pickImageAndSendToBackend = async () => {
    setError(null);
    setOcrResult(null);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library to upload a photo."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const image = result.assets[0].uri;
      const data = await sendToBackend(image);
      return data;
    }
    return null;
  };

  return {
    loading,
    error,
    imageUri,
    ocrResult,
    pickImage,
    clearError,
    clearResult,
    pickImageAndSendToBackend,
  };
};

// Keep the default export for backward compatibility
export default useOcr;
