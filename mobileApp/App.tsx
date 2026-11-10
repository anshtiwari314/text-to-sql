import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "./src/AppContext";
import { RootNav } from "./src/nav/RootNav";

export default function App() {
  useEffect(() => {
    console.log("[mobile] app start");
  }, []);
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="light" />
        <RootNav />
      </AppProvider>
    </SafeAreaProvider>
  );
}
