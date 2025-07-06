import { useEffect, useState } from "react";
import NfcManager, { NfcTech } from "react-native-nfc-manager";

// Mock NFC tag data for development
const MOCK_NFC_TAG = {
  id: "mock-nfc-id-123",
  type: "mock-type",
  techList: ["mock-tech"],
};

export function useNfcScanner() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDev] = useState(() => __DEV__);

  useEffect(() => {
    const initNfc = async () => {
      try {
        if (isDev) {
          console.log("Running in development environment, using mock NFC");
          setIsSupported(true);
          setIsEnabled(true);
          return;
        }

        // Initialize NFC Manager
        if (NfcManager && typeof NfcManager.start === "function") {
          await NfcManager.start();
          await checkNfcSupport();
        } else {
          console.log("NFC Manager not available");
          setIsSupported(false);
          setIsEnabled(false);
        }
      } catch (err) {
        console.error("Error initializing NFC:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Une erreur inconnue est survenue"
        );
        setIsSupported(false);
        setIsEnabled(false);
      }
    };

    initNfc();

    return () => {
      // Cleanup NFC when component unmounts
      if (NfcManager) {
        NfcManager.cancelTechnologyRequest().catch(() => {});
        NfcManager.unregisterTagEvent().catch(() => {});
      }
    };
  }, [isDev]);

  const checkNfcSupport = async () => {
    try {
      if (isDev) {
        setIsSupported(true);
        setIsEnabled(true);
        return;
      }

      if (!NfcManager) {
        setIsSupported(false);
        setIsEnabled(false);
        return;
      }

      const isSupported = await NfcManager.isSupported();
      setIsSupported(isSupported);

      if (isSupported) {
        const isEnabled = await NfcManager.isEnabled();
        setIsEnabled(isEnabled);
      }
    } catch (err) {
      console.error("Error checking NFC support:", err);
      setError(
        err instanceof Error ? err.message : "Une erreur inconnue est survenue"
      );
      setIsSupported(false);
      setIsEnabled(false);
    }
  };

  const startScanning = async () => {
    try {
      if (isDev) {
        console.log("Using mock NFC data in development");
        return MOCK_NFC_TAG;
      }

      if (!isSupported || !isEnabled) {
        throw new Error("NFC n'est pas supporté ou n'est pas activé");
      }

      if (!NfcManager) {
        throw new Error("NFC Manager n'est pas disponible");
      }

      // Request NFC technology
      await NfcManager.requestTechnology(NfcTech.Ndef);

      // Get the tag
      const tag = await NfcManager.getTag();

      // Clean up
      await NfcManager.cancelTechnologyRequest();

      return tag;
    } catch (err) {
      console.error("Error scanning NFC:", err);
      setError(
        err instanceof Error ? err.message : "Une erreur inconnue est survenue"
      );
      return null;
    }
  };

  return {
    isSupported,
    isEnabled,
    error,
    startScanning,
  };
}
