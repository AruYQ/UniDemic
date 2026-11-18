import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Eye, EyeSlash } from 'phosphor-react-native';
import { radius, spacing, typography } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';

/*
<vibe_check>
Screen/Component : UniInput
Tujuan           : Input field yang aman, elegan, dan jelas untuk formulir mahasiswa (email, password, student ID)
Layout strategy  : Label teratas dengan tracking rapi, input container dengan prefix icon dan action icon (eye toggle)
Color tokens     : Dinamis sesuai useUniTheme()
Animation plan   : Animasi border highlight subtle saat fokus
Typography       : SpaceGrotesk_500Medium untuk label, SpaceGrotesk_400Regular untuk input text
Anti-slop check  : Rule #3 (no pure white/black), Rule #19 (radius.md: 10), Security rules (password toggle, secureTextEntry)
</vibe_check>
*/

export interface UniInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
}

export const UniInput: React.FC<UniInputProps> = ({
  label,
  error,
  leftIcon,
  isPassword = false,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { colors } = useUniTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text.secondary }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.bg.surface,
            borderColor: colors.border.default,
          },
          isFocused && {
            borderColor: colors.brand.primary,
            backgroundColor: colors.bg.overlay,
          },
          Boolean(error) && {
            borderColor: colors.semantic.danger,
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, { color: colors.text.primary }, style]}
          placeholderTextColor={colors.text.muted}
          secureTextEntry={isPassword && !showPassword}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {isPassword && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
            hitSlop={8}
          >
            {showPassword ? (
              <EyeSlash size={20} color={colors.text.secondary} weight="duotone" />
            ) : (
              <Eye size={20} color={colors.text.secondary} weight="duotone" />
            )}
          </Pressable>
        )}
      </View>
      {error ? (
        <Text style={[styles.errorText, { color: colors.semantic.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    width: '100%',
  },
  label: {
    fontFamily: typography.label.fontFamily,
    fontSize: typography.label.fontSize,
    letterSpacing: typography.label.letterSpacing,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  leftIconContainer: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    paddingVertical: spacing.sm,
  },
  eyeButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  errorText: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: typography.bodySmall.fontSize,
    marginTop: spacing.xs,
  },
});
