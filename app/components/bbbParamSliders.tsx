import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import Slider from "@react-native-community/slider";

import { useAppState } from "@/context/state";

const BBBParamSliders: React.FC = () => {
  const { updateClientAndServerParams, bbbParams } = useAppState();
  return (
    <FlatList
      style={styles.FlatList}
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
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  FlatList: {
    width: "95%",
    alignSelf: "center",
  },
  sliderRow: {
    width: "85%",
    height: 40,
    flexDirection: "row",
    marginBottom: 10,
  },
  sliderText: {
    width: "50%",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  slider: {
    width: "70%",
    height: 50,
  },
});

export default BBBParamSliders;
