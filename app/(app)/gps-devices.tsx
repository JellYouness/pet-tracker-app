import React from "react";
import { StyleSheet, View } from "react-native";
import GpsDeviceManager from "../../components/GpsDeviceManager";

export default function GpsDevicesScreen() {
  return (
    <View style={styles.container}>
      <GpsDeviceManager
        onDeviceAdded={(device) => {
          console.log("Device added:", device);
        }}
        onDeviceUpdated={(device) => {
          console.log("Device updated:", device);
        }}
        onDeviceDeleted={(deviceId) => {
          console.log("Device deleted:", deviceId);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
});
