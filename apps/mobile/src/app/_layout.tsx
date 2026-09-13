import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import { useUniDemicFonts } from '@/hooks/useUniDemicFonts';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { colors } from '@/constants/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { fontsLoaded, fontError } = useUniDemicFonts();
  const { isAuthenticated, isLoading, initAuth } = useAuthStore();
  const { resolvedTheme, colors: themeColors, initTheme } = useThemeStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initAuth();
    initTheme();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (isLoading || (!fontsLoaded && !fontError)) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, segments, fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg.base,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <StatusBar barStyle="light-content" backgroundColor={colors.bg.base} />
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.bg.base }}>
      <StatusBar
        barStyle={resolvedTheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={themeColors.bg.base}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: themeColors.bg.base },
          animation: 'fade',
          animationDuration: 180,
          freezeOnBlur: true,
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="schedule" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="courses" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen
          name="course/[id]"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 240,
          }}
        />
        <Stack.Screen name="tasks" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="explore" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}
