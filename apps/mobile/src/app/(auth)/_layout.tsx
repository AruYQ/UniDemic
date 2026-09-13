import { Stack } from 'expo-router';
import { useUniTheme } from '@/hooks/use-theme';

export default function AuthLayout() {
  const { colors } = useUniTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.bg.base,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}

