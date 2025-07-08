import { useEffect, useState } from "react";
import NfcManager, { NfcTech } from "react-native-nfc-manager";

// Mock NFC tag data for development
const MOCK_NFC_TAG = {
  id: "PET-1751935548641-A9JE88",
  type: "mock-type",
  techList: ["mock-tech"],
  ndefMessage: [
    {
      id: [0x00],
      type: [0x54], // 'T' for text record
      payload: [
        0x02, 0x65, 0x6e, 0x50, 0x45, 0x54, 0x2d, 0x31, 0x37, 0x35, 0x31, 0x39,
        0x33, 0x35, 0x35, 0x34, 0x38, 0x36, 0x34, 0x31, 0x2d, 0x41, 0x39, 0x4a,
        0x45, 0x38, 0x38,
      ], // "enPET-1751935548641-A9JE88"
    },
  ],
};

// Set this to true to force real NFC testing even in development
const FORCE_REAL_NFC = true;

// Helper function to decode NDEF text payload and remove language prefix
const decodeNdefTextPayload = (payload: number[]): string => {
  if (!payload || payload.length === 0) return "";

  // Remove the status byte (first byte) and decode the rest as UTF-8
  const textBytes = payload.slice(1);
  const fullText = new TextDecoder("utf-8").decode(new Uint8Array(textBytes));

  // Remove language prefix if present (e.g., "en", "fr", "es")
  // Language codes are typically 2 characters at the beginning
  const languagePrefixMatch = fullText.match(/^[a-z]{2}(.+)$/);
  if (languagePrefixMatch) {
    return languagePrefixMatch[1]; // Return the text without language prefix
  }

  return fullText;
};

// Helper function to extract text from NDEF message
const extractTextFromNdefMessage = (ndefMessage: any[]): string => {
  if (!ndefMessage || ndefMessage.length === 0) return "";

  for (const record of ndefMessage) {
    if (record.type && record.payload) {
      // Check if it's a text record (type 'T')
      const typeString = new TextDecoder("utf-8").decode(
        new Uint8Array(record.type)
      );
      if (typeString === "T") {
        return decodeNdefTextPayload(record.payload);
      }
    }
  }

  return "";
};

export function useNfcScanner() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDev] = useState(() => __DEV__);

  useEffect(() => {
    const initNfc = async () => {
      try {
        if (isDev && !FORCE_REAL_NFC) {
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
      if (isDev && !FORCE_REAL_NFC) {
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
      if (isDev && !FORCE_REAL_NFC) {
        console.log("Using mock NFC data in development");
        return MOCK_NFC_TAG;
      }

      if (!isSupported || !isEnabled) {
        throw new Error("NFC n'est pas supporté ou n'est pas activé");
      }

      if (!NfcManager) {
        throw new Error("NFC Manager n'est pas disponible");
      }

      console.log("Starting real NFC scan...");

      // Request NFC technology
      await NfcManager.requestTechnology(NfcTech.Ndef);

      // Get the tag
      const tag = await NfcManager.getTag();

      console.log("Real NFC tag scanned:", tag);

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

  // New function to extract text content from NFC tag
  const extractTextFromTag = (tag: any): string => {
    if (!tag) return "";

    console.log("Extracting text from tag:", tag);

    // Try to extract from NDEF message first
    if (tag.ndefMessage && tag.ndefMessage.length > 0) {
      const text = extractTextFromNdefMessage(tag.ndefMessage);
      if (text) {
        console.log("Found text in NDEF message:", text);
        return text;
      }
    }

    // Fallback to tag ID if no text found
    if (tag.id) {
      console.log("Using tag ID as fallback:", tag.id);
      return tag.id;
    }

    return "";
  };

  return {
    isSupported,
    isEnabled,
    error,
    startScanning,
    extractTextFromTag,
  };
}
