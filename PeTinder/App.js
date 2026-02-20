import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

import HomeScreen from "./screens/HomeScreen";
import PeTinderScreen from "./screens/PeTinderScreen";
import ConfigScreen from "./screens/ConfigScreen";
import ChatScreen from "./screens/ChatScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />

        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animationEnabled: true,
            headerBlurEffect: "none",
            headerTransparent: false,
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ gestureEnabled: false }}
          />

          <Stack.Screen
            name="PeTinder"
            component={PeTinderScreen}
            options={{ gestureEnabled: false }}
          />

          <Stack.Screen
            name="Config"
            component={ConfigScreen}
            options={{
              headerShown: false,
              gestureEnabled: true,
            }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              headerShown: false,
              gestureEnabled: true,
            }}
          />
        </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    );
}
