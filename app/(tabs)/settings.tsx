import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Button, Alert } from "react-native";
import { useAppState } from "../../context/state";

export default function Settings() {
  const { setServerAddr } = useAppState();
  const [serverAddress, setServerAddress] = useState("");

  const handleSaveAddress = () => {
    setServerAddr(`http://${serverAddress}`);
    Alert.alert("Success", "Server address saved!");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Server Address</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 192.168.4.33:3000"
        value={serverAddress}
        onChangeText={setServerAddress}
      />
      <Button title="Save Address" onPress={handleSaveAddress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    width: "100%",
    marginBottom: 20,
  },
});
