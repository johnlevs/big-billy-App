import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, Button, Alert } from "react-native";
import { useAppState } from "@/context/state";

export default function Settings() {
  const { setServerAddr, sendPlay, serverAddr, triggerFetch } = useAppState();
  const [localScreenServerAddr, setLocalScreenServerAddr] = useState("");

  useEffect(() => {
    setLocalScreenServerAddr(serverAddr.replace("http://", "").replace(":3000", ""));
  }, [serverAddr]);

  const handleSaveAddress = () => {
    // hack to refresh the server address
    setServerAddr("");
    setServerAddr(`http://${localScreenServerAddr}:3000`);
    Alert.alert("Success", "Server address saved!");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Server Address</Text>
      <TextInput
        style={styles.input}
        placeholder={`Current address: ${localScreenServerAddr}`}
        value={localScreenServerAddr}
        onChangeText={setLocalScreenServerAddr}
      />
      <View style={styles.buttonRow}>
        <Button title="Save Address" onPress={handleSaveAddress} />
        <Button title="Refresh" onPress={triggerFetch} />
        <Button title="Play Sound" onPress={sendPlay} />
      </View>
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
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "50%",
  },
});
