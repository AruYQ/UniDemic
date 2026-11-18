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
  User,
  EnvelopeSimple,
  LockKey,
  GraduationCap,
  Buildings,
  IdentificationBadge,
  ArrowRight,
  BookOpen,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { UniButton } from '@/components/ui/UniButton';
import { UniInput } from '@/components/ui/UniInput';
import { UniBadge } from '@/components/ui/UniBadge';
import { useAuthStore } from '@/store/useAuthStore';
import { useUniTheme } from '@/hooks/use-theme';

/*
<vibe_check>
Screen/Component : RegisterScreen (app/(auth)/register.tsx)
Tujuan           : Onboarding mahasiswa baru dengan form bertahap/terstruktur yang rapi, informatif, dan tidak mengintimidasi
Layout strategy  : Multi-field form dengan pengelompokan identitas akademik (Nama, Email, Kampus, NIM, Password), progress visual subtle
Color tokens     : bg.base (#0F1117), bg.surface (#171B26), brand.primary (#6B7FD7), semantic.success (#4ECDC4)
Animation plan   : FadeInDown dengan staggered delay pada form section, spring press feedback
Typography       : Syne_700Bold header, SpaceGrotesk untuk fields, JetBrainsMono untuk NIM/StudentID
Anti-slop check  : Rule #1 (no linear gradients), Rule #2 (Phosphor icons duotone), Rule #7 (geometric badge), Rule #10 (typography), Rule #28 (spring 0.97)
</vibe_check>
*/

const registerSchema = z
  .object({
    name: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
    email: z.string().email('Format email tidak valid'),
    university: z.string().optional(),
    major: z.string().optional(),
    student_id: z.string().optional(),
    password: z
      .string()
      .min(8, 'Kata sandi minimal 8 karakter')
      .regex(/[a-zA-Z]/, 'Harus mengandung huruf')
      .regex(/[0-9]/, 'Harus mengandung angka'),
    password_confirmation: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['password_confirmation'],
  });

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error: authError, clearError } = useAuthStore();
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    university: '',
    major: '',
    student_id: '',
    password: '',
    password_confirmation: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleRegister = async () => {
    clearError();
    setErrors({});

    const result = registerSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as string;
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await register(form);
      router.replace('/');
    } catch (err) {
      // Error handled in store
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(350).easing(Easing.out(Easing.cubic))}
          style={styles.header}
        >
          <View style={styles.badgeRow}>
            <UniBadge label="STUDENT ONBOARDING" variant="primary" size="sm" />
          </View>
          <Text style={styles.title}>Registrasi Akun</Text>
          <Text style={styles.subtitle}>
            Lengkapi data diri Anda untuk memulai workspace akademik UniDemic.
          </Text>
        </Animated.View>

        {/* Card */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(350).easing(Easing.out(Easing.cubic))}
          style={styles.card}
        >
          {authError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{authError}</Text>
            </View>
          )}

          {/* Profil Pribadi */}
          <Text style={styles.sectionHeader}>Informasi Dasar</Text>

          <UniInput
            label="Nama Lengkap"
            placeholder="Muhammad Rafli"
            value={form.name}
            onChangeText={(t) => updateField('name', t)}
            error={errors.name}
            leftIcon={<User size={20} color={themeColors.text.secondary} weight="duotone" />}
          />

          <UniInput
            label="Email Mahasiswa"
            placeholder="rafli@kampus.ac.id"
            value={form.email}
            onChangeText={(t) => updateField('email', t)}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            leftIcon={
              <EnvelopeSimple size={20} color={themeColors.text.secondary} weight="duotone" />
            }
          />

          {/* Info Kampus */}
          <Text style={[styles.sectionHeader, { marginTop: spacing.md }]}>
            Afiliasi Akademik (Opsional)
          </Text>

          <UniInput
            label="Universitas / Institut"
            placeholder="Institut Teknologi Bandung"
            value={form.university}
            onChangeText={(t) => updateField('university', t)}
            leftIcon={<Buildings size={20} color={themeColors.text.secondary} weight="duotone" />}
          />

          <View style={styles.splitRow}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <UniInput
                label="Jurusan / Prodi"
                placeholder="Informatika"
                value={form.major}
                onChangeText={(t) => updateField('major', t)}
                leftIcon={<BookOpen size={20} color={themeColors.text.secondary} weight="duotone" />}
              />
            </View>
            <View style={{ flex: 1 }}>
              <UniInput
                label="NIM / Student ID"
                placeholder="13521001"
                value={form.student_id}
                onChangeText={(t) => updateField('student_id', t)}
                leftIcon={
                  <IdentificationBadge
                    size={20}
                    color={themeColors.text.secondary}
                    weight="duotone"
                  />
                }
              />
            </View>
          </View>

          {/* Keamanan */}
          <Text style={[styles.sectionHeader, { marginTop: spacing.md }]}>
            Keamanan Akun
          </Text>

          <UniInput
            label="Kata Sandi"
            placeholder="Min. 8 karakter (huruf & angka)"
            value={form.password}
            onChangeText={(t) => updateField('password', t)}
            isPassword
            error={errors.password}
            leftIcon={<LockKey size={20} color={themeColors.text.secondary} weight="duotone" />}
          />

          <UniInput
            label="Konfirmasi Kata Sandi"
            placeholder="Ulangi kata sandi"
            value={form.password_confirmation}
            onChangeText={(t) => updateField('password_confirmation', t)}
            isPassword
            error={errors.password_confirmation}
            leftIcon={<LockKey size={20} color={themeColors.text.secondary} weight="duotone" />}
          />

          <UniButton
            label="Buat Akun Mahasiswa"
            onPress={handleRegister}
            loading={isLoading}
            rightIcon={<ArrowRight size={18} color={themeColors.text.inverse} weight="bold" />}
            style={styles.submitButton}
          />
        </Animated.View>

        {/* Footer */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(350).easing(Easing.out(Easing.cubic))}
          style={styles.footer}
        >
          <View style={styles.switchRow}>
            <Text style={styles.switchPrompt}>Sudah memiliki akun?</Text>
            <Pressable
              onPress={() => {
                clearError();
                router.push('/(auth)/login');
              }}
              hitSlop={8}
            >
              <Text style={styles.switchLink}>Masuk Disini</Text>
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
      paddingTop: spacing.xxl,
      paddingBottom: spacing.xxl,
    },
    header: {
      marginBottom: spacing.xl,
    },
    badgeRow: {
      marginBottom: spacing.sm,
    },
    title: {
      fontFamily: typography.display.fontFamily,
      fontSize: 28,
      color: colors.text.primary,
      letterSpacing: typography.display.letterSpacing,
      marginBottom: spacing.xs,
    },
    subtitle: {
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
    sectionHeader: {
      fontFamily: typography.label.fontFamily,
      fontSize: typography.label.fontSize,
      letterSpacing: typography.label.letterSpacing,
      color: colors.brand.primary,
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
      fontWeight: '600',
    },
    splitRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
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
    submitButton: {
      marginTop: spacing.md,
    },
    footer: {
      marginTop: spacing.xl,
      alignItems: 'center',
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
  });

