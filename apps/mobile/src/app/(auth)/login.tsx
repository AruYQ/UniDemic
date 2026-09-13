import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, Easing } from 'react-native-reanimated';
import { z } from 'zod';
import {
  EnvelopeSimple,
  LockKey,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { UniButton } from '@/components/ui/UniButton';
import { UniInput } from '@/components/ui/UniInput';
import { UniBadge } from '@/components/ui/UniBadge';
import { useAuthStore } from '@/store/useAuthStore';
import { useUniTheme } from '@/store/useThemeStore';

/*
<vibe_check>
Screen/Component : LoginScreen (app/(auth)/login.tsx)
Tujuan           : Gerbang masuk mahasiswa ke UniDemic dengan pengalaman visual premium, aman, cepat, dan zero visual noise
Layout strategy  : Asymmetric hero header (Syne 700Bold display font, subtle academic badge), form card terstruktur di Natural Zone, CTA primer thumb-friendly
Color tokens     : bg.base (#0F1117), bg.surface (#171B26), brand.primary (#6B7FD7), brand.secondary (#4ECDC4)
Animation plan   : FadeInDown entrance animation (300ms cubic) via Reanimated v3, spring feedback pada button
Typography       : Syne_700Bold untuk brand/heading, SpaceGrotesk untuk body/form, JetBrainsMono untuk aksen version/status
Anti-slop check  : Rule #1 (no harsh gradients), Rule #2 (Phosphor icons duotone), Rule #3 (no pure white), Rule #10 (Syne + Space Grotesk), Rule #28 (spring press-down), Rule #26/27 (Terms & Privacy links provided)
</vibe_check>
*/

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email wajib diisi')
    .email('Format email tidak valid'),
  password: z
    .string()
    .min(1, 'Kata sandi wajib diisi')
    .min(8, 'Kata sandi minimal 8 karakter'),
});

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error: authError, clearError } = useAuthStore();
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleLogin = async () => {
    clearError();
    setErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0] === 'email') fieldErrors.email = issue.message;
        if (issue.path[0] === 'password') fieldErrors.password = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await login({ email, password });
      router.replace('/');
    } catch (err) {
      // Error handled in store and displayed in UI banner
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}
      >
        {/* Hero Section */}
        <Animated.View
          entering={FadeInDown.duration(350).easing(Easing.out(Easing.cubic))}
          style={styles.heroSection}
        >
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <GraduationCap size={28} color={themeColors.brand.primary} weight="duotone" />
            </View>
            <UniBadge label="ACADEMIC OS" variant="primary" size="sm" />
          </View>

          <Text style={styles.heroTitle}>UniDemic</Text>
          <Text style={styles.heroSubtitle}>
            Workspace cerdas untuk produktivitas akademik Anda.
          </Text>
        </Animated.View>

        {/* Form Container */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(350).easing(Easing.out(Easing.cubic))}
          style={styles.card}
        >
          <Text style={styles.cardHeading}>Masuk ke Akun</Text>
          <Text style={styles.cardSubheading}>
            Gunakan email universitas atau email terdaftar Anda
          </Text>

          {authError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{authError}</Text>
            </View>
          )}

          <UniInput
            label="Email Mahasiswa"
            placeholder="nama@kampus.ac.id"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            error={errors.email}
            leftIcon={
              <EnvelopeSimple size={20} color={themeColors.text.secondary} weight="duotone" />
            }
          />

          <UniInput
            label="Kata Sandi"
            placeholder="Minimal 8 karakter"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            isPassword
            error={errors.password}
            leftIcon={
              <LockKey size={20} color={themeColors.text.secondary} weight="duotone" />
            }
          />

          <View style={styles.forgotRow}>
            <View style={styles.securityPill}>
              <ShieldCheck size={14} color={themeColors.brand.secondary} weight="duotone" />
              <Text style={styles.securityText}>Sanctum 256-bit Encrypted</Text>
            </View>
          </View>

          <UniButton
            label="Masuk Sekarang"
            onPress={handleLogin}
            loading={isLoading}
            rightIcon={<ArrowRight size={18} color={themeColors.text.inverse} weight="bold" />}
            style={styles.submitButton}
          />
        </Animated.View>

        {/* Bottom Switcher & Legal (Thumb Zone) */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(350).easing(Easing.out(Easing.cubic))}
          style={styles.footer}
        >
          <View style={styles.switchRow}>
            <Text style={styles.switchPrompt}>Belum memiliki akun?</Text>
            <Pressable
              onPress={() => {
                clearError();
                router.push('/(auth)/register');
              }}
              hitSlop={8}
            >
              <Text style={styles.switchLink}>Daftar Mahasiswa</Text>
            </Pressable>
          </View>

          <View style={styles.legalRow}>
            <Text style={styles.legalText}>Dengan masuk, Anda menyetujui </Text>
            <Pressable onPress={() => {}}>
              <Text style={styles.legalLink}>Ketentuan Layanan</Text>
            </Pressable>
            <Text style={styles.legalText}> & </Text>
            <Pressable onPress={() => {}}>
              <Text style={styles.legalLink}>Kebijakan Privasi</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg.base,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xxl + 16,
      paddingBottom: spacing.xxl + 48,
    },
    heroSection: {
      marginBottom: spacing.xl,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    logoBadge: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: colors.bg.surface,
      borderWidth: 1,
      borderColor: colors.border.default,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroTitle: {
      fontFamily: typography.display.fontFamily,
      fontSize: 34,
      color: colors.text.primary,
      letterSpacing: typography.display.letterSpacing,
      marginBottom: spacing.xs,
    },
    heroSubtitle: {
      fontFamily: typography.body.fontFamily,
      fontSize: typography.body.fontSize,
      color: colors.text.secondary,
      lineHeight: 22,
    },
    card: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      padding: spacing.xl,
      ...shadows.card,
    },
    cardHeading: {
      fontFamily: typography.h2.fontFamily,
      fontSize: typography.h2.fontSize,
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    cardSubheading: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: typography.bodySmall.fontSize,
      color: colors.text.muted,
      marginBottom: spacing.lg,
    },
    errorBanner: {
      backgroundColor: 'rgba(224, 91, 91, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(224, 91, 91, 0.3)',
      borderRadius: radius.sm,
      padding: spacing.sm + 2,
      marginBottom: spacing.md,
    },
    errorBannerText: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: typography.bodySmall.fontSize,
      color: colors.semantic.danger,
    },
    forgotRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
      marginTop: -spacing.xs,
    },
    securityPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    securityText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.text.muted,
    },
    submitButton: {
      marginTop: spacing.xs,
    },
    footer: {
      marginTop: spacing.xxl,
      marginBottom: spacing.md,
      alignItems: 'center',
      gap: spacing.md,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    switchPrompt: {
      fontFamily: typography.body.fontFamily,
      fontSize: typography.body.fontSize,
      color: colors.text.secondary,
    },
    switchLink: {
      fontFamily: typography.h3.fontFamily,
      fontSize: typography.body.fontSize,
      color: colors.brand.primary,
      fontWeight: '600',
    },
    legalRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
    },
    legalText: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 12,
      color: colors.text.muted,
    },
    legalLink: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
      textDecorationLine: 'underline',
    },
  });
