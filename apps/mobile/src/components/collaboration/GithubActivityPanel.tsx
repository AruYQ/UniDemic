import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
  Linking,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  WarningCircle,
  ArrowsClockwise,
  ArrowSquareOut,
  LinkBreak,
  X,
  Tag,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { UniBadge } from '@/components/ui/UniBadge';
import { UniButton } from '@/components/ui/UniButton';
import { UniInput } from '@/components/ui/UniInput';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ProjectGithubRepo,
  ProjectGithubActivity,
  GithubActivityType,
  ConnectGithubRepoPayload,
  connectGithubSchema,
} from '@/types/collaboration';
import { formatApiError } from '@/lib/api';

/*
<vibe_check>
Screen/Component : GithubActivityPanel (components/collaboration/GithubActivityPanel.tsx)
Tujuan           : Menampilkan status koneksi repositori GitHub proyek, sinkronisasi commit/PR/issue, serta filter feed aktivitas
Layout strategy  : Repo hero card (sync & open URL) -> Filter pill strip -> FlashList activity items -> Connect modal
Color tokens     : bg.surface, bg.overlay, brand.primary, brand.secondary, brand.accent, semantic.danger
Animation plan   : FadeInDown cards, UniButton spring feedback
Typography       : SpaceGrotesk untuk titles & filter, JetBrainsMono untuk repo name, branch, external ID/SHA, waktu
Anti-slop check  : Security UI Rules (isPassword / secureTextEntry untuk token & webhook secret, tidak pernah menampilkan raw token), FlashList
</vibe_check>
*/

export interface GithubActivityPanelProps {
  repo?: ProjectGithubRepo | null;
  activities: ProjectGithubActivity[];
  isSyncing: boolean;
  isManager: boolean;
  onConnect: (payload: ConnectGithubRepoPayload) => Promise<void>;
  onDisconnect: () => Promise<void>;
  onSync: () => Promise<void>;
}

const FILTER_OPTIONS: { key: 'all' | GithubActivityType; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'commit', label: 'Commit' },
  { key: 'pull_request', label: 'Pull Request' },
  { key: 'issue', label: 'Issue' },
];

export const GithubActivityPanel: React.FC<GithubActivityPanelProps> = ({
  repo,
  activities,
  isSyncing,
  isManager,
  onConnect,
  onDisconnect,
  onSync,
}) => {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  const [filterType, setFilterType] = useState<'all' | GithubActivityType>('all');
  const [showConnectModal, setShowConnectModal] = useState(false);

  const [repoOwner, setRepoOwner] = useState('');
  const [repoName, setRepoName] = useState('');
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [accessToken, setAccessToken] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredActivities = useMemo(() => {
    if (filterType === 'all') return activities;
    return activities.filter((a) => a.type === filterType);
  }, [activities, filterType]);

  const handleConnectSubmit = async () => {
    setErrorMsg(null);
    const parsed = connectGithubSchema.safeParse({
      repo_owner: repoOwner,
      repo_name: repoName,
      default_branch: defaultBranch || undefined,
    });

    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || 'Periksa kembali detail repositori');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConnect({
        repo_owner: parsed.data.repo_owner,
        repo_name: parsed.data.repo_name,
        default_branch: parsed.data.default_branch || 'main',
        access_token: accessToken.trim() || null,
        webhook_secret: webhookSecret.trim() || null,
      });
      setAccessToken('');
      setWebhookSecret('');
      setShowConnectModal(false);
    } catch (err) {
      setErrorMsg(formatApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDisconnect = () => {
    Alert.alert(
      'Putuskan Koneksi GitHub?',
      `Repositori ${repo?.full_name} dan log aktivitasnya akan dihapus dari proyek ini.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Putuskan',
          style: 'destructive',
          onPress: () => onDisconnect().catch((e) => Alert.alert('Gagal', formatApiError(e))),
        },
      ]
    );
  };

  const renderActivityIcon = (type: GithubActivityType) => {
    switch (type) {
      case 'commit':
        return <GitCommit size={18} color={themeColors.brand.primary} weight="duotone" />;
      case 'pull_request':
        return <GitPullRequest size={18} color={themeColors.brand.secondary} weight="duotone" />;
      case 'issue':
        return <WarningCircle size={18} color={themeColors.brand.accent} weight="duotone" />;
      default:
        return <Tag size={18} color={themeColors.text.secondary} weight="duotone" />;
    }
  };

  const getStateBadgeVariant = (state?: string | null): 'success' | 'primary' | 'warning' | 'danger' | 'neutral' => {
    if (!state) return 'neutral';
    if (state === 'merged' || state === 'committed') return 'success';
    if (state === 'open') return 'primary';
    if (state === 'closed') return 'danger';
    return 'neutral';
  };

  const formatTimestamp = (iso?: string | null) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      {!repo ? (
        <EmptyState
          icon={<GitBranch size={30} color={themeColors.brand.primary} weight="duotone" />}
          title="Hubungkan Repositori GitHub"
          description="Pantau commit, pull request, dan issue tim langsung dari workspace proyek UniDemic."
          actionLabel={isManager ? 'Hubungkan GitHub' : undefined}
          onAction={isManager ? () => setShowConnectModal(true) : undefined}
        />
      ) : (
        <>
          {/* Connected Repo Hero Card */}
          <View style={styles.repoCard}>
            <View style={styles.repoHeader}>
              <View style={styles.repoTitleRow}>
                <GitBranch size={20} color={themeColors.brand.primary} weight="duotone" />
                <Text style={styles.repoName}>{repo.full_name}</Text>
              </View>
              <UniBadge label={repo.default_branch} variant="neutral" size="sm" />
            </View>

            <Text style={styles.syncMeta}>
              Sinkronisasi terakhir: {repo.last_synced_at ? formatTimestamp(repo.last_synced_at) : 'Belum pernah'}
            </Text>

            <View style={styles.repoActions}>
              <View style={{ flex: 1 }}>
                <UniButton
                  label={isSyncing ? 'Menyinkronkan...' : 'Sinkronkan'}
                  onPress={() => onSync().catch((e) => Alert.alert('Sinkronisasi Gagal', formatApiError(e)))}
                  loading={isSyncing}
                  size="md"
                  leftIcon={<ArrowsClockwise size={16} color={themeColors.text.inverse} weight="bold" />}
                />
              </View>

              <Pressable
                onPress={() => Linking.openURL(repo.html_url).catch(() => {})}
                style={styles.iconActionBtn}
                hitSlop={8}
              >
                <ArrowSquareOut size={18} color={themeColors.text.primary} weight="duotone" />
              </Pressable>

              {isManager ? (
                <Pressable
                  onPress={handleConfirmDisconnect}
                  style={[styles.iconActionBtn, styles.dangerIconBtn]}
                  hitSlop={8}
                >
                  <LinkBreak size={18} color={themeColors.semantic.danger} weight="duotone" />
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Filter Strip */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {FILTER_OPTIONS.map((opt) => {
              const active = filterType === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setFilterType(opt.key)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Activities Feed */}
          {filteredActivities.length === 0 ? (
            <EmptyState
              icon={<GitCommit size={28} color={themeColors.text.muted} weight="duotone" />}
              title="Belum Ada Aktivitas"
              description="Tekan tombol Sinkronkan untuk menarik riwayat commit, pull request, dan issue terbaru dari GitHub."
            />
          ) : (
            <View style={styles.feedWrapper}>
              <FlashList
                data={filteredActivities}
                keyExtractor={(item) => String(item.id)}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
                renderItem={({ item, index }) => (
                  <Animated.View entering={FadeInDown.delay(Math.min(index * 40, 200)).duration(220)}>
                    <Pressable
                      onPress={() => {
                        if (item.url) Linking.openURL(item.url).catch(() => {});
                      }}
                      style={styles.activityCard}
                    >
                      <View style={styles.activityIcon}>{renderActivityIcon(item.type)}</View>
                      <View style={styles.activityBody}>
                        <View style={styles.activityTop}>
                          <Text style={styles.activityId}>
                            {item.type === 'commit'
                              ? item.external_id.substring(0, 7)
                              : `#${item.external_id}`}
                          </Text>
                          {item.state ? (
                            <UniBadge
                              label={item.state.toUpperCase()}
                              variant={getStateBadgeVariant(item.state)}
                              size="sm"
                            />
                          ) : null}
                        </View>
                        <Text style={styles.activityTitle} numberOfLines={2}>
                          {item.title}
                        </Text>
                        <Text style={styles.activityMeta}>
                          {item.author_name || 'contributor'} · {formatTimestamp(item.occurred_at)}
                        </Text>
                      </View>
                    </Pressable>
                  </Animated.View>
                )}
              />
            </View>
          )}
        </>
      )}

      {/* Connect GitHub Modal */}
      <Modal
        visible={showConnectModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowConnectModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.overlay}
        >
          <View style={styles.sheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <GitBranch size={22} color={themeColors.brand.primary} weight="duotone" />
                <Text style={styles.modalTitle}>Hubungkan Repositori GitHub</Text>
              </View>
              <Pressable onPress={() => setShowConnectModal(false)} style={styles.closeBtn} hitSlop={8}>
                <X size={20} color={themeColors.text.secondary} weight="bold" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {errorMsg ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              <UniInput
                label="Pemilik / Organisasi *"
                placeholder="Contoh: AruYQ"
                value={repoOwner}
                onChangeText={setRepoOwner}
                autoCapitalize="none"
              />

              <UniInput
                label="Nama Repositori *"
                placeholder="Contoh: UniDemic"
                value={repoName}
                onChangeText={setRepoName}
                autoCapitalize="none"
              />

              <UniInput
                label="Default Branch"
                placeholder="main atau develop"
                value={defaultBranch}
                onChangeText={setDefaultBranch}
                autoCapitalize="none"
              />

              <UniInput
                label="Personal Access Token (Opsional — untuk Repo Privat)"
                placeholder="ghp_..."
                value={accessToken}
                onChangeText={setAccessToken}
                isPassword
                autoCapitalize="none"
              />

              <UniInput
                label="Webhook Secret (Opsional — HMAC-SHA256)"
                placeholder="Rahasia webhook GitHub"
                value={webhookSecret}
                onChangeText={setWebhookSecret}
                isPassword
                autoCapitalize="none"
              />
            </ScrollView>

            <View style={{ marginTop: spacing.md }}>
              <UniButton
                label="Hubungkan Repositori"
                onPress={handleConnectSubmit}
                loading={isSubmitting}
                size="lg"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    container: {
      gap: spacing.md,
    },
    repoCard: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      padding: spacing.lg,
      gap: spacing.sm,
      ...shadows.card,
    },
    repoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    repoTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    repoName: {
      fontFamily: typography.h2.fontFamily,
      fontSize: 16,
      color: colors.text.primary,
    },
    syncMeta: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    repoActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    iconActionBtn: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: colors.bg.overlay,
      borderWidth: 1,
      borderColor: colors.border.default,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dangerIconBtn: {
      borderColor: 'rgba(224, 91, 91, 0.35)',
    },
    filterRow: {
      gap: spacing.sm,
      paddingVertical: 2,
    },
    filterChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: 7,
      borderRadius: radius.full,
      backgroundColor: colors.bg.surface,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    filterChipActive: {
      backgroundColor: colors.brand.primary,
      borderColor: colors.brand.primary,
    },
    filterChipText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    filterChipTextActive: {
      color: colors.text.inverse,
      fontWeight: '600',
    },
    feedWrapper: {
      minHeight: 120,
    },
    activityCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      padding: spacing.md,
    },
    activityIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: colors.bg.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activityBody: {
      flex: 1,
      gap: 3,
    },
    activityTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    activityId: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 12,
      color: colors.brand.primary,
    },
    activityTitle: {
      fontFamily: typography.body.fontFamily,
      fontSize: 14,
      color: colors.text.primary,
      lineHeight: 20,
    },
    activityMeta: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.text.muted,
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 17, 23, 0.72)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.bg.elevated,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      borderTopWidth: 1,
      borderColor: colors.border.default,
      maxHeight: '88%',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    modalTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    modalTitle: {
      fontFamily: typography.h2.fontFamily,
      fontSize: 18,
      color: colors.text.primary,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      backgroundColor: colors.bg.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorBanner: {
      backgroundColor: 'rgba(224, 91, 91, 0.14)',
      borderWidth: 1,
      borderColor: colors.semantic.danger,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    errorText: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 13,
      color: colors.semantic.danger,
    },
  });
