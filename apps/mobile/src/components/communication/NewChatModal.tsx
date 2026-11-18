import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  User,
  UsersThree,
  CheckCircle,
  ChatCircleText,
  MagnifyingGlass,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { useCommunicationStore } from '@/store/useCommunicationStore';
import { Conversation } from '@/types/communication';
import { UniButton } from '../ui/UniButton';

/*
<vibe_check>
Screen/Component : NewChatModal (components/communication/NewChatModal.tsx)
Tujuan           : Memungkinkan mahasiswa memulai percakapan baru (Pesan Langsung atau Grup Belajar) dengan teman sekelas, asisten lab, atau dosen
Layout strategy  : Sheet modal: Toggle tab (Pesan Langsung vs Grup Belajar), form input nama/deskripsi grup (jika grup), daftar kontak mahasiswa terverifikasi dengan inisial avatar
Color tokens     : bg.surface (#171B26), bg.elevated (#1E2333), border.subtle (#252A3D), brand.primary (#6B7FD7), brand.secondary (#4ECDC4)
Animation plan   : Slide up modal sheet
Typography       : SpaceGrotesk_600SemiBold (header & nama kontak), JetBrainsMono_400Regular (NIM/ID), SpaceGrotesk_400Regular (deskripsi)
Anti-slop check  : Rule #12 (Initials avatar real), Rule #10 (Space Grotesk + JetBrains Mono), Rule #5 (Offset shadow)
</vibe_check>
*/

interface NewChatModalProps {
  visible: boolean;
  currentUserId?: number;
  onClose: () => void;
  onConversationCreated: (conversation: Conversation) => void;
}

interface DemoContact {
  id: number;
  name: string;
  role: string;
  nimOrNip: string;
}

const DEMO_CONTACTS: DemoContact[] = [
  { id: 2, name: 'Aru Mahasiswa', role: 'Mahasiswa / Rekan Kelas', nimOrNip: 'NIM: 220101002' },
  { id: 3, name: 'Dr. Ir. Siti Aminah, M.Kom.', role: 'Dosen Pembimbing Akademik', nimOrNip: 'NIP: 198204152008122001' },
  { id: 4, name: 'Rian Pratama', role: 'Ketua Kelas TI-2022', nimOrNip: 'NIM: 220101015' },
  { id: 5, name: 'Dewi Sartika', role: 'Asisten Laboratorium AI', nimOrNip: 'NIM: 210101088' },
];

export const NewChatModal: React.FC<NewChatModalProps> = ({
  visible,
  currentUserId = 1,
  onClose,
  onConversationCreated,
}) => {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const createConversation = useCommunicationStore((s) => s.createConversation);

  const [mode, setMode] = useState<'direct' | 'group'>('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [customUserId, setCustomUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const styles = useMemo(
    () => createStyles(themeColors, themeShadows),
    [themeColors, themeShadows]
  );

  const filteredContacts = useMemo(() => {
    return DEMO_CONTACTS.filter(
      (c) =>
        c.id !== currentUserId &&
        (c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.nimOrNip.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, currentUserId]);

  const handleStartDirectChat = async (targetUserId: number) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const conv = await createConversation({
        type: 'direct',
        participant_ids: [currentUserId, targetUserId],
      });
      onConversationCreated(conv);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memulai percakapan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelectUser = (id: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setErrorMessage('Nama grup wajib diisi');
      return;
    }
    if (selectedUserIds.length === 0) {
      setErrorMessage('Pilih minimal satu anggota grup');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const allParticipants = Array.from(new Set([currentUserId, ...selectedUserIds]));
      const conv = await createConversation({
        type: 'group',
        name: groupName.trim(),
        description: groupDesc.trim() || null,
        participant_ids: allParticipants,
      });
      onConversationCreated(conv);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal membuat grup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Mulai Obrolan</Text>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeButton}>
              <X size={20} weight="bold" color={themeColors.text.muted} />
            </Pressable>
          </View>

          {/* Type Toggle */}
          <View style={styles.toggleRow}>
            <Pressable
              onPress={() => setMode('direct')}
              style={[styles.toggleBtn, mode === 'direct' && styles.toggleBtnActive]}
            >
              <User
                size={16}
                weight="duotone"
                color={mode === 'direct' ? '#FFFFFF' : themeColors.text.secondary}
              />
              <Text style={[styles.toggleText, mode === 'direct' && styles.toggleTextActive]}>
                Pesan Langsung
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setMode('group')}
              style={[styles.toggleBtn, mode === 'group' && styles.toggleBtnActive]}
            >
              <UsersThree
                size={16}
                weight="duotone"
                color={mode === 'group' ? '#FFFFFF' : themeColors.text.secondary}
              />
              <Text style={[styles.toggleText, mode === 'group' && styles.toggleTextActive]}>
                Grup Belajar
              </Text>
            </Pressable>
          </View>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Group Specific Fields */}
          {mode === 'group' && (
            <View style={styles.groupFields}>
              <TextInput
                value={groupName}
                onChangeText={setGroupName}
                placeholder="Nama Grup (cth: Kelompok Tugas Web)"
                placeholderTextColor={themeColors.text.muted}
                style={styles.textInput}
              />
              <TextInput
                value={groupDesc}
                onChangeText={setGroupDesc}
                placeholder="Deskripsi / Topik Grup (Opsional)"
                placeholderTextColor={themeColors.text.muted}
                style={styles.textInput}
              />
            </View>
          )}

          {/* Search Box */}
          <View style={styles.searchRow}>
            <MagnifyingGlass size={18} color={themeColors.text.muted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Cari nama mahasiswa / dosen..."
              placeholderTextColor={themeColors.text.muted}
              style={styles.searchInput}
            />
          </View>

          {/* Contact List */}
          <ScrollView style={styles.contactsList} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionHeader}>
              {mode === 'direct' ? 'PILIH KONTAK TUJUAN' : 'PILIH ANGGOTA GRUP'}
            </Text>

            {filteredContacts.map((contact) => {
              const isSelected = selectedUserIds.includes(contact.id);
              const initials = contact.name.substring(0, 2).toUpperCase();

              return (
                <Pressable
                  key={contact.id}
                  onPress={() => {
                    if (mode === 'direct') {
                      handleStartDirectChat(contact.id);
                    } else {
                      handleToggleSelectUser(contact.id);
                    }
                  }}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    styles.contactItem,
                    isSelected && styles.contactItemSelected,
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <View style={styles.contactAvatar}>
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  </View>

                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName} numberOfLines={1}>
                      {contact.name}
                    </Text>
                    <Text style={styles.contactRole} numberOfLines={1}>
                      {contact.role}
                    </Text>
                    <Text style={styles.contactNim}>{contact.nimOrNip}</Text>
                  </View>

                  {mode === 'group' ? (
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxActive,
                      ]}
                    >
                      {isSelected && (
                        <CheckCircle size={18} weight="fill" color={themeColors.brand.primary} />
                      )}
                    </View>
                  ) : (
                    <ChatCircleText size={20} weight="duotone" color={themeColors.brand.primary} />
                  )}
                </Pressable>
              );
            })}

            {/* Custom User ID fallback */}
            <View style={styles.customIdBox}>
              <Text style={styles.customIdLabel}>Atau masukkan User ID spesifik:</Text>
              <View style={styles.customIdRow}>
                <TextInput
                  value={customUserId}
                  onChangeText={setCustomUserId}
                  placeholder="ID Pengguna (cth: 2)"
                  placeholderTextColor={themeColors.text.muted}
                  keyboardType="numeric"
                  style={[styles.textInput, { flex: 1 }]}
                />
                <UniButton
                  label="Mulai"
                  variant="primary"
                  size="md"
                  disabled={!customUserId.trim() || isLoading}
                  loading={isLoading}
                  onPress={() => handleStartDirectChat(Number(customUserId))}
                />
              </View>
            </View>
          </ScrollView>

          {/* Group CTA */}
          {mode === 'group' && (
            <View style={styles.footerCTA}>
              <UniButton
                label={`Buat Grup (${selectedUserIds.length} Anggota)`}
                variant="primary"
                size="lg"
                loading={isLoading}
                disabled={selectedUserIds.length === 0 || !groupName.trim() || isLoading}
                onPress={handleCreateGroup}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
    },
    backdrop: {
      flex: 1,
    },
    sheetContainer: {
      backgroundColor: colors.bg.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      maxHeight: '80%',
      paddingBottom: Platform.OS === 'ios' ? 34 : spacing.xl,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.elevated,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    },
    headerTitle: {
      fontFamily: typography.h2.fontFamily,
      fontSize: 18,
      color: colors.text.primary,
    },
    closeButton: {
      padding: spacing.xs,
      borderRadius: radius.full,
      backgroundColor: colors.bg.elevated,
    },
    toggleRow: {
      flexDirection: 'row',
      marginHorizontal: spacing.lg,
      marginVertical: spacing.sm,
      backgroundColor: colors.bg.elevated,
      borderRadius: radius.md,
      padding: 3,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    toggleBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      gap: spacing.xs,
    },
    toggleBtnActive: {
      backgroundColor: colors.brand.primary,
    },
    toggleText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 13,
      color: colors.text.secondary,
    },
    toggleTextActive: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    errorBox: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.xs,
      padding: spacing.sm,
      backgroundColor: `${colors.semantic.danger}15`,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.semantic.danger,
    },
    errorText: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 12,
      color: colors.semantic.danger,
    },
    groupFields: {
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    textInput: {
      backgroundColor: colors.bg.elevated,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      fontFamily: typography.body.fontFamily,
      fontSize: 14,
      color: colors.text.primary,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: spacing.lg,
      marginVertical: spacing.xs,
      backgroundColor: colors.bg.elevated,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      paddingHorizontal: spacing.md,
      gap: spacing.xs,
    },
    searchInput: {
      flex: 1,
      paddingVertical: spacing.sm,
      fontFamily: typography.body.fontFamily,
      fontSize: 13.5,
      color: colors.text.primary,
    },
    contactsList: {
      paddingHorizontal: spacing.lg,
      marginTop: spacing.xs,
    },
    sectionHeader: {
      fontFamily: typography.label.fontFamily,
      fontSize: 11,
      letterSpacing: 0.5,
      color: colors.text.muted,
      marginVertical: spacing.xs,
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.elevated,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      padding: spacing.md,
      marginBottom: spacing.xs,
      gap: spacing.md,
    },
    contactItemSelected: {
      borderColor: colors.brand.primary,
      backgroundColor: `${colors.brand.primary}12`,
    },
    contactAvatar: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      backgroundColor: colors.bg.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitials: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 14,
      color: colors.brand.primary,
      fontWeight: '700',
    },
    contactInfo: {
      flex: 1,
      gap: 2,
    },
    contactName: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 14,
      color: colors.text.primary,
    },
    contactRole: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    contactNim: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.text.muted,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: radius.full,
      borderWidth: 1.5,
      borderColor: colors.border.default,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxActive: {
      borderColor: colors.brand.primary,
    },
    customIdBox: {
      marginVertical: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.bg.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      gap: spacing.sm,
    },
    customIdLabel: {
      fontFamily: typography.label.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    customIdRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'center',
    },
    footerCTA: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
  });
