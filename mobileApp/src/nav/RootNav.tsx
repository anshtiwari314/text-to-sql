import { ActivityIndicator, StyleSheet, View } from "react-native";
import { NavigationContainer, DarkTheme, LinkingOptions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useApp } from "../AppContext";
import { AuthScreen } from "../screens/AuthScreen";
import { ResetScreen } from "../screens/ResetScreen";
import { ChatScreen } from "../screens/ChatScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { ConfigScreen } from "../screens/ConfigScreen";
import { SchemasScreen } from "../screens/SchemasScreen";
import { ConnectScreen } from "../screens/ConnectScreen";
import { EditDbScreen } from "../screens/EditDbScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { colors } from "../theme";
import { AppStackParamList, AuthStackParamList, MainTabParamList } from "./types";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    primary: colors.indigoSoft,
  },
};

const stackHeader = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.text,
  contentStyle: { backgroundColor: colors.bg },
};

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.indigoSoft,
        tabBarInactiveTintColor: colors.faint,
        tabBarIcon: ({ color, size }) => {
          const name =
            route.name === "Chat"
              ? "chatbubble-ellipses-outline"
              : route.name === "History"
                ? "time-outline"
                : route.name === "Config"
                  ? "server-outline"
                  : "grid-outline";
          return <Ionicons name={name} color={color} size={size} />;
        },
      })}
    >
      <Tabs.Screen name="Chat" component={ChatScreen} />
      <Tabs.Screen name="History" component={HistoryScreen} />
      <Tabs.Screen name="Config" component={ConfigScreen} options={{ title: "Config" }} />
      <Tabs.Screen name="Schemas" component={SchemasScreen} />
    </Tabs.Navigator>
  );
}

export function RootNav() {
  const { ready, user } = useApp();
  const linking = {
    prefixes: [Linking.createURL("/"), "sqlai://"],
    config: {
      screens: user
        ? {
            Tabs: {
              screens: { Chat: "chat", History: "history", Config: "config", Schemas: "schemas" },
            },
            Connect: "connect",
            EditDb: "db/:id",
            Profile: "profile",
          }
        : { Auth: "auth", Reset: "reset-password" },
    },
  };

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.indigoSoft} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme} linking={linking as LinkingOptions<AppStackParamList>}>
      {user ? (
        <AppStack.Navigator screenOptions={stackHeader}>
          <AppStack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
          <AppStack.Screen name="Connect" component={ConnectScreen} options={{ title: "Connect source" }} />
          <AppStack.Screen name="EditDb" component={EditDbScreen} options={{ title: "Edit connection" }} />
          <AppStack.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
        </AppStack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={stackHeader}>
          <AuthStack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
          <AuthStack.Screen name="Reset" component={ResetScreen} options={{ title: "Reset password" }} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
});
