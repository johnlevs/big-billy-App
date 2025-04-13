import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { FlatList } from "react-native-gesture-handler";
import { useAppState } from "../../context/state";

export default function Home() {
  const { updateClientAndServerParams, bbbParams } = useAppState(); // Use shared state from context

  return (
    <View style={styles.container}>
      <FlatList
        style={{ width: "100%" }}
        keyExtractor={(item) => item.key}
        data={bbbParams.params_list()}
        renderItem={({ item }) => (
          <View style={styles.sliderRow}>
            <Text style={styles.sliderText}>
              {`${item.key}: ${item.value.value.toFixed(0)} ${item.value.units}`}
            </Text>
            <Slider
              style={styles.slider}
              value={bbbParams.get_percent(item.key)}
              onValueChange={(value) => updateClientAndServerParams(item.key, value)}
              minimumTrackTintColor="rgb(0, 123, 255)"
              maximumTrackTintColor="rgb(190, 190, 190)"
              thumbTintColor="rgb(110, 136, 162)"
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginLeft: 20,
    marginRight: 20,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  slider: {
    width: "70%",
    height: 50,
  },
  sliderText: {
    width: "50%",
    height: 40,
    justifyContent: "space-around",
    alignItems: "flex-start",
  },
  sliderRow: {
    width: "85%",
    height: 40,
    flexDirection: "row",
  },
});
