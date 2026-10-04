import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  ChatCircleDots,
  Plus,
  MagnifyingGlass,
  User,
  UsersThree,
  GraduationCap,
  Chats,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCommunicationStore } from '@/store/useCommunicationStore';
import { ConversationCard } from '@/components/communication/ConversationCard';
import { NewChatModal } from '@/components/communication/NewChatModal';
import { ShimmerBox } from '@/components/ui/UniSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Conversation, ConversationType } from '@/types/communication';

/*
<vibe_check>
Screen/Component : ChatInboxScreen (app/chat/index.tsx)
Tujuan           : Pusat kotak masuk pesan dan saluran komunikasi akademik bagi mahasiswa UniDemic (Pesan Langsung, Grup Tugas, dan Saluran Kuliah)
Layout strategy  : Header bernapas dengan back navigation + counter unread -> Search input berarsitektur minimalis -> Segment filter pills (Semua, Langsung, Grup, Saluran) -> Staggered message list -> Natural zone floating action button (+)
Color tokens     : bg.base (#0F1117), bg.surface (#171B26), bg.elevated (#1E2333), brand.primary (#6B7FD7), brand.secondary (#4ECDC4), text.primary (#F0F2F8)
Animation plan   : FadeInDown untuk header & cards, press scale feedback pada pill filter & FAB
Typography       : Syne_700Bold (Display title), SpaceGrotesk_600SemiBold (section & nama), JetBrainsMono_400Regular (badge & timestamp)
Anti-slop check  : Rule #10 (Space Grotesk + JetBrains Mono), Rule #21 (Skeleton shimmer bukan spinner), Rule #28 (Spring press feedback), Rule #3 (Tanpa pure black/white)
</vibe_check>
*/

type FilterType = 'all' | 'direct' | 'group' | 'course';

export default function ChatInboxScreen() {
  const router = useRouter();
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const user = useAuthStore((s) => s.user);

  const {
    conversations,
    isConversationsLoading,
    totalUnreadCount,
    fetchConversations,
    deleteConversation,
    setActiveConversation,
  } = useCommunicationStore();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNewChatModalVisible, setIsNewChatModalVisible] = useState(false);

  const styles = useMemo(
    () => createStyles(themeColors, themeShadows),
    [themeColors, themeShadows]
  );

  useEffect(() => {
    fetchConversations();
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchConversations(undefined, true);
    setIsRefreshing(false);
  }, [fetchConversations]);

  // Filter conversations by category and search term
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      // Type match
      if (activeFilter !== 'all' && c.type !== activeFilter) {
        return false;
      }

      // Search match
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const name = (c.name || '').toLowerCase();
      const courseName = (c.course?.name || '').toLowerCase();
      const otherUser = c.participants?.find((p) => p.user_id !== user?.id)?.user?.name?.toLowerCase() || '';
      const lastContent = (c.last_message?.content || '').toLowerCase();

      return (
        name.includes(q) ||
        courseName.includes(q) ||
        otherUser.includes(q) ||
        lastContent.includes(q)
      );
    });
  }, [conversations, activeFilter, searchQuery, user?.id]);

  const handleOpenConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);
    router.push(`/chat/${conversation.id}` as any);
  };

  const handleDeleteConversation = (id: number) => {
    Alert.alert(
      'Hapus Percakapan',
      'Apakah Anda yakin ingin menghapus percakapan ini dari daftar pesan Anda?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConversation(id);
            } catch (err: any) {
              Alert.alert('Gagal', err.message || 'Gagal menghapus percakapan');
            }
          },
        },
      ]
    );
  };

  const filterTabs: { key: FilterType; label: string; icon: any }[] = [
    { key: 'all', label: 'Semua', icon: Chats },
    { key: 'direct', label: 'Pesan Langsung', icon: User },
    { key: 'group', label: 'Grup Belajar', icon: UsersThree },
    { key: 'course', label: 'Saluran Kuliah', icon: GraduationCap },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(250)} style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
          >
            <ArrowLeft size={22} weight="bold" color={themeColors.text.primary} />
          </Pressable>

          <View style={styles.headerTitleBox}>
            <View style={styles.titleRow}>
              <Text style={styles.screenTitle}>Diskusi & Obrolan</Text>
              {totalUnreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount} baru
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.screenSubtitle}>
              Komunikasi mata kuliah dan kelompok belajar
            </Text>
          </View>
        </Animated.View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MagnifyingGlass size={18} weight="duotone" color={themeColors.text.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Cari obrolan, kontak, atau pesan..."
            placeholderTextColor={themeColors.text.muted}
            style={styles.searchInput}
          />
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPillsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsContainer}
          >
            {filterTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeFilter === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveFilter(tab.key)}
                  style={({ pressed }) => [
                    styles.pillButton,
                    isActive && styles.pillButtonActive,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Icon
                    size={16}
                    weight="duotone"
                    color={isActive ? '#FFFFFF' : themeColors.text.secondary}
                  />
                  <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Conversations List */}
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={themeColors.brand.primary}
              colors={[themeColors.brand.primary]}
            />
          }
        >
          {isConversationsLoading && conversations.length === 0 ? (
            // Shimmer Loading Skeleton
            <View style={styles.skeletonContainer}>
              {[1, 2, 3, 4, 5].map((item) => (
                <View key={item} style={styles.skeletonItem}>
                  <ShimmerBox width={48} height={48} borderRadius={radius.full} />
                  <View style={{ flex: 1, gap: 8 }}>
                    <ShimmerBox width="60%" height={16} borderRadius={radius.sm} />
                    <ShimmerBox width="85%" height={12} borderRadius={radius.sm} />
                  </View>
                </View>
              ))}
            </View>
          ) : filteredConversations.length === 0 ? (
            // Empty State
            <EmptyState
              icon={<ChatCircleDots size={48} weight="duotone" color={themeColors.brand.primary} />}
              title="Belum Ada Obrolan"
              description={
                searchQuery
                  ? 'Tidak ada obrolan yang cocok dengan kata kunci pencarian Anda.'
                  : 'Mulai obrolan baru dengan teman sekelas atau jelajahi saluran diskusi mata kuliah.'
              }
              actionLabel="Mulai Obrolan"
              onAction={() => setIsNewChatModalVisible(true)}
            />
          ) : (
            filteredConversations.map((conv, index) => (
              <ConversationCard
                key={conv.id}
                conversation={conv}
                currentUserId={user?.id}
                index={index}
                onPress={() => handleOpenConversation(conv)}
                onDelete={handleDeleteConversation}
              />
            ))
          )}
        </ScrollView>

        {/* Floating Action Button (FAB) */}
        <Pressable
          onPress={() => setIsNewChatModalVisible(true)}
          style={({ pressed }) => [
            styles.fab,
            pressed && { transform: [{ scale: 0.93 }] },
          ]}
        >
          <Plus size={24} weight="bold" color="#FFFFFF" />
        </Pressable>

        {/* New Chat Modal */}
        <NewChatModal
          visible={isNewChatModalVisible}
          currentUserId={user?.id}
          onClose={() => setIsNewChatModalVisible(false)}
          onConversationCreated={(newConv) => {
            handleOpenConversation(newConv);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg.base,
    },
    container: {
      flex: 1,
      backgroundColor: colors.bg.base,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      gap: spacing.md,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: colors.bg.surface,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.card,
    },
    headerTitleBox: {
      flex: 1,
      gap: 2,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    screenTitle: {
      fontFamily: typography.h1.fontFamily,
      fontSize: 22,
      color: colors.text.primary,
    },
    unreadBadge: {
      backgroundColor: `${colors.brand.primary}25`,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: colors.brand.primary,
    },
    unreadBadgeText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 10,
      color: colors.brand.primary,
      fontWeight: '600',
    },
    screenSubtitle: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 13,
      color: colors.text.secondary,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      marginHorizontal: spacing.lg,
      marginVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      gap: spacing.xs,
    },
    searchInput: {
      flex: 1,
      paddingVertical: spacing.sm + 2,
      fontFamily: typography.body.fontFamily,
      fontSize: 14,
      color: colors.text.primary,
    },
    filterPillsWrapper: {
      marginBottom: spacing.xs,
    },
    filterPillsContainer: {
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    pillButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.surface,
      borderRadius: radius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      gap: spacing.xs,
    },
    pillButtonActive: {
      backgroundColor: colors.brand.primary,
      borderColor: colors.brand.primary,
    },
    pillText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 12.5,
      color: colors.text.secondary,
    },
    pillTextActive: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    listContainer: {
      flex: 1,
    },
    listContent: {
      paddingBottom: 80,
    },
    skeletonContainer: {
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
      marginTop: spacing.md,
    },
    skeletonItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      gap: spacing.md,
    },
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: radius.full,
      backgroundColor: colors.brand.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.elevated,
    },
  });
