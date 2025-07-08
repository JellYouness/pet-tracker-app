# NFC Tag Generation Feature

## Overview

Enhanced NFC functionality that allows users to generate unique NFC tags during animal registration and write them using external NFC apps like "NFC Tools" or "TagWriter NXP".

## Features Implemented

### 1. NFC Tag Generator Component (`components/NfcTagGenerator.tsx`)

A comprehensive modal component that provides:

- **Unique ID Generation**: Creates unique NFC IDs with format `PET-{timestamp}-{random}`
- **Copy to Clipboard**: One-tap copying of generated NFC ID
- **Share Functionality**: Native sharing of NFC ID via system share sheet
- **External App Integration**: Direct links to popular NFC writing apps
- **Step-by-step Instructions**: Clear guidance for users
- **Visual Feedback**: Clear display of generated tags and status

### 2. Updated Animal Registration (`app/(app)/animal/register.tsx`)

Enhanced registration flow with:

- **Name Validation**: Requires animal name before NFC generation
- **Visual Status Indicators**: Shows when NFC tag is configured
- **Integrated Workflow**: Seamless integration with existing registration
- **Dynamic Button Text**: Changes based on NFC tag status

## User Workflow

### Step 1: Animal Registration

1. User enters animal details (name is required for NFC generation)
2. User clicks "Générer tag NFC" button
3. NFC Tag Generator modal opens

### Step 2: NFC Tag Generation

1. User clicks "Générer ID NFC"
2. Unique NFC ID is generated (format: `PET-{timestamp}-{random}`)
3. Generated ID is displayed with copy/share options

### Step 3: External App Integration

1. User can copy the NFC ID to clipboard
2. User clicks "Ouvrir NFC Tools" or "Ouvrir TagWriter NXP"
3. App opens external NFC writing application
4. If app not installed, redirects to app store

### Step 4: NFC Writing (External App)

1. In NFC app: Select "Write" → "Data Records" → "Text"
2. Paste the copied NFC ID
3. Write to physical NFC tag
4. Return to Pet Tracker app

### Step 5: Completion

1. User clicks "Utiliser ce tag"
2. NFC ID is saved to animal record
3. Registration continues normally

## Technical Implementation

### NFC ID Format

```
PET-{timestamp}-{randomString}
Example: PET-1703123456789-ABC123
```

### External App Integration

- **NFC Tools**: `nfctools://` (iOS), `market://details?id=com.wakdev.wdnfc` (Android)
- **TagWriter NXP**: `tagwriter://` (iOS), `market://details?id=com.nxp.nfc.tagwriter` (Android)
- **Fallback**: App store links if apps not installed

### Dependencies Added

- `expo-clipboard`: For copying NFC IDs to clipboard
- `expo-linking`: For opening external apps (already included)

## Component API

### NfcTagGenerator Props

```typescript
type NfcTagGeneratorProps = {
  visible: boolean; // Modal visibility
  onClose: () => void; // Close callback
  onTagGenerated: (nfcId: string) => void; // Tag selection callback
  animalName: string; // Animal name for display
};
```

## Benefits

### For Users

1. **No Technical Knowledge Required**: Simple, guided process
2. **Popular App Integration**: Works with widely-used NFC apps
3. **Flexible Workflow**: Can complete NFC writing at their own pace
4. **Clear Instructions**: Step-by-step guidance provided
5. **Visual Feedback**: Clear indication of completion status

### For Developers

1. **Modular Design**: Reusable component for other screens
2. **External App Leverage**: No need to implement NFC writing
3. **Platform Agnostic**: Works on both iOS and Android
4. **Error Handling**: Graceful fallbacks for missing apps
5. **Future Extensible**: Easy to add more NFC apps

## File Structure

```
components/
├── NfcTagGenerator.tsx     # Main NFC generation modal
app/(app)/animal/
├── register.tsx            # Updated with NFC integration
hooks/
├── useNfcScanner.ts        # Existing NFC scanning (unchanged)
```

## Configuration

No additional configuration required. The feature uses:

- Existing NFC permissions (already configured)
- Standard Expo/React Native APIs
- External app deep linking

## Future Enhancements

1. **Edit Screen Integration**: Add NFC tag modification to edit screen
2. **QR Code Fallback**: Generate QR codes for non-NFC devices
3. **Batch Generation**: Generate multiple tags at once
4. **Custom Formats**: Allow custom NFC ID formats
5. **Tag Verification**: Scan and verify written tags
6. **Analytics**: Track NFC generation and usage

## Testing Notes

- **Development**: Works in development mode with mock data
- **External Apps**: Requires actual NFC Tools/TagWriter for full testing
- **Physical Tags**: Requires physical NFC tags for complete workflow
- **Platform Testing**: Test deep linking on both iOS and Android

## Migration Notes

- **Backward Compatible**: Existing NFC scanning functionality unchanged
- **Database**: No schema changes required
- **Existing Animals**: Can add NFC tags to existing animals via edit screen (future)
- **Legacy Support**: Supports animals without NFC tags
