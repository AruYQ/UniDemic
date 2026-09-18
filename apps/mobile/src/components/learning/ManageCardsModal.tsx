import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { Cards, Plus, Trash, CheckCircle } from 'phosphor-react-native';
import { AcademicModal } from '@/components/academic/AcademicModal';
import { UniInput } from '@/components/ui/UniInput';
import { UniButton } from '@/components/ui/UniButton';
import { FlashcardDeck, Flashcard, CreateFlashcardPayload } from '@/types/learning';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { formatApiError } from '@/lib/api';

/*
<vibe_check>
Screen/Component : ManageCardsModal (components/learning/ManageCardsModal.tsx)
Tujuan           : Mengelola daftar kartu flashcard dalam dek (tambah kartu baru pertanyaan-jawaban dan hapus kartu)
Layout strategy  : Header Dek -> Form Tambah Kartu Baru -> Daftar Kartu Tersimpan (Scrollable)
Color tokens     : bg.surface, bg.overlay, brand.primary, semantic.danger, text.primary
Animation plan   : FadeInDown modal transition
Typography       : SpaceGrotesk untuk pertanyaan, JetBrainsMono untuk counter interval
Anti-slop check  : Rule #1 (tokens), Rule #2 (Phosphor duotone), Rule #4 (dynamic theme)
</vibe_check>
*/

interface ManageCardsModalProps {
  visible: boolean;
  onClose: () => void;
  deck: FlashcardDeck | null;
  cards: Flashcard[];
  onAddCard: (deckId: number, payload: CreateFlashcardPayload) => Promise<any>;
  onDeleteCard: (cardId: number) => Promise<any>;
}

export const ManageCardsModal: React.FC<ManageCardsModalProps> = ({
  visible,
  onClose,
  deck,
  cards,
  onAddCard,
  onDeleteCard,
}) => {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = React.useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddCard = async () => {
    if (!deck) return;
    if (!question.trim() || !answer.trim()) {
      Alert.alert('Perhatian', 'Pertanyaan dan jawaban wajib diisi.');
      return;
    }

    setIsAdding(true);
    try {
      await onAddCard(deck.id, {
        question: question.trim(),
        answer: answer.trim(),
      });
      setQuestion('');
      setAnswer('');
    } catch (err: any) {
      Alert.alert('Gagal', formatApiError(err, 'Gagal menambahkan kartu.'));
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = (cardId: number) => {
    Alert.alert('Hapus Kartu', 'Apakah Anda yakin ingin menghapus kartu ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => onDeleteCard(cardId).catch(() => {}),
      },
    ]);
  };

  return (
    <AcademicModal
      visible={visible}
      onClose={onClose}
      title={deck?.name || 'Kelola Kartu'}
      subtitle={`Total ${cards.length} kartu dalam dek ini`}
    >
      <View style={styles.container}>
        {/* Form Tambah Kartu Baru */}
        <View style={styles.addCardBox}>
          <Text style={styles.addBoxTitle}>+ Tambah Kartu Baru</Text>

          <UniInput
            label="Sisi Depan (Pertanyaan)"
            placeholder="Contoh: Apa fungsi dari subnet mask?"
            value={question}
            onChangeText={setQuestion}
          />

          <UniInput
            label="Sisi Belakang (Jawaban)"
            placeholder="Contoh: Membedakan network ID dan host ID..."
            value={answer}
            onChangeText={setAnswer}
            multiline
            numberOfLines={2}
          />

          <View style={styles.addBtnWrapper}>
            <UniButton
              label="Tambahkan ke Dek"
              onPress={handleAddCard}
              loading={isAdding}
              disabled={isAdding}
            />
          </View>
        </View>

        {/* Existing Cards List */}
        <Text style={styles.listHeader}>Daftar Kartu ({cards.length})</Text>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cardsScroll}
        >
          {cards.length === 0 ? (
            <Text style={styles.emptyText}>Belum ada kartu di dek ini. Tambahkan di atas!</Text>
          ) : (
            cards.map((card, idx) => (
              <View key={card.id} style={styles.cardItem}>
                <View style={styles.cardItemLeft}>
                  <Text style={styles.cardNum}>#{idx + 1}</Text>
                  <View style={styles.cardTexts}>
                    <Text style={styles.qText} numberOfLines={2}>
                      Q: {card.question}
                    </Text>
                    <Text style={styles.aText} numberOfLines={2}>
                      A: {card.answer}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => handleDelete(card.id)}
                  style={styles.trashBtn}
                  hitSlop={8}
                >
                  <Trash size={16} color={themeColors.semantic.danger} weight="bold" />
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </AcademicModal>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    container: {
      paddingBottom: spacing.lg,
      maxHeight: 520,
    },
    addCardBox: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.md,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      marginBottom: spacing.md,
    },
    addBoxTitle: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: colors.brand.primary,
      marginBottom: spacing.xs,
    },
    addBtnWrapper: {
      marginTop: spacing.xs,
    },
    listHeader: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: colors.text.secondary,
      marginBottom: spacing.xs,
    },
    cardsScroll: {
      gap: spacing.xs,
      paddingBottom: spacing.md,
    },
    emptyText: {
      fontFamily: typography.body.fontFamily,
      fontSize: 12,
      color: colors.text.muted,
      textAlign: 'center',
      paddingVertical: spacing.md,
    },
    cardItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.bg.surface,
      borderRadius: radius.sm,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    cardItemLeft: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.xs,
      flex: 1,
      marginRight: spacing.sm,
    },
    cardNum: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      fontWeight: '700',
      color: colors.brand.primary,
      marginTop: 2,
    },
    cardTexts: {
      flex: 1,
    },
    qText: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 2,
    },
    aText: {
      fontFamily: typography.body.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    trashBtn: {
      padding: 6,
      borderRadius: radius.sm,
      backgroundColor: colors.semantic.danger + '14',
    },
  });
