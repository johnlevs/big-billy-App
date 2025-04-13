import { Stack } from "expo-router/stack";
import React from "react";

// Override useLayoutEffect for SSR
if (typeof window === "undefined") React.useLayoutEffect = React.useEffect;

import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
LogBox.ignoreLogs(["props.pointerEvents is deprecated"]);

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
