import {
  useFonts,
  Syne_700Bold,
} from '@expo-google-fonts/syne';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
} from '@expo-google-fonts/space-grotesk';
import {
  JetBrainsMono_400Regular,
} from '@expo-google-fonts/jetbrains-mono';

export function useUniDemicFonts() {
  const [fontsLoaded, fontError] = useFonts({
    Syne_700Bold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    JetBrainsMono_400Regular,
  });

  return { fontsLoaded, fontError };
}
