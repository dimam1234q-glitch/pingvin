import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider, useApp } from "@/contexts/AppContext";

SplashScreen.preventAutoHideAsync();

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowList: true,
  }),
});

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { userStats, updatePushToken } = useApp();
  const router = useRouter();
  const segments = useSegments();

  // Redirect to onboarding if needed (also if group is missing after onboarding)
  useEffect(() => {
    if (!userStats.isLoaded) return;
    const inOnboarding = segments[0] === "onboarding";
    const needsOnboarding = !userStats.onboardingDone || !userStats.group;
    if (needsOnboarding && !inOnboarding) {
      router.replace("/onboarding");
    }
  }, [userStats.isLoaded, userStats.onboardingDone, userStats.group, segments]);

  // Register for push notifications
  useEffect(() => {
    if (!userStats.onboardingDone || Platform.OS === "web") return;
    registerForPushNotifications(updatePushToken);
  }, [userStats.onboardingDone]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen
        name="lesson/[nodeId]"
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}

async function registerForPushNotifications(
  onToken: (token: string) => Promise<void>
) {
  try {
    const existingPerms = await Notifications.getPermissionsAsync();
    // expo-notifications permission shape varies by version; support both shapes
    const isGranted = (p: unknown) => {
      const o = p as Record<string, unknown>;
      return o["granted"] === true || o["status"] === "granted";
    };
    let granted = isGranted(existingPerms);

    if (!granted) {
      const newPerms = await Notifications.requestPermissionsAsync();
      granted = isGranted(newPerms);
    }

    if (!granted) return;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) return;

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    if (token.data) {
      await onToken(token.data);
    }
  } catch {
    // Push registration is non-fatal
  }
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AppProvider>
                <RootLayoutNav />
              </AppProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
