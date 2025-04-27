import React from "react";
import { SafeAreaView } from "react-native";
import BBBAudioPlots from "@/app/components/bbbAudioPlots";
import BBBParamSliders from "@/app/components/bbbParamSliders";
import { useAppState } from "@/context/state";

export default function Home() {
  const { FFTData } = useAppState();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <BBBAudioPlots data={FFTData} />
      <BBBParamSliders />
    </SafeAreaView>
  );
}
