import { useRef, useState } from 'react'
import {
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Check, FileText } from 'lucide-react-native'
import { Badge } from './ui/Badge'
import { STATUS_CONFIG } from '../src/lib/status-config'
import { colors } from '../constants/colors'
import { spacing, radius } from '../constants/spacing'
import { typography } from '../constants/typography'

export const ONBOARDING_KEY = '@cedeasy/onboarding_done'

interface Step {
  title: string
  description: string
  illustration: () => React.ReactNode
}

function ClientsIllustration() {
  return (
    <View style={illustrationStyles.overlapWrap}>
      <View style={[illustrationStyles.circle, illustrationStyles.circleP]}>
        <Text style={illustrationStyles.circleText}>P</Text>
      </View>
      <View style={[illustrationStyles.circle, illustrationStyles.circleF]}>
        <Text style={illustrationStyles.circleText}>F</Text>
      </View>
    </View>
  )
}

function StatusColorsIllustration() {
  const statuses = ['bozza_privata', 'da_revisionare', 'approvato', 'pubblicato'] as const
  return (
    <View style={illustrationStyles.badgeStack}>
      {statuses.map((s) => (
        <Badge key={s} status={s} />
      ))}
    </View>
  )
}

function SendIllustration() {
  return (
    <View style={illustrationStyles.sendRow}>
      <View style={[illustrationStyles.sendBox, { backgroundColor: STATUS_CONFIG.bozza_privata.badgeColor, borderColor: STATUS_CONFIG.bozza_privata.dotColor }]} />
      <Text style={illustrationStyles.sendArrow}>→</Text>
      <View style={[illustrationStyles.sendBox, { backgroundColor: STATUS_CONFIG.da_revisionare.badgeColor, borderColor: STATUS_CONFIG.da_revisionare.dotColor }]} />
    </View>
  )
}

function ApproveIllustration() {
  return (
    <View style={illustrationStyles.approveWrap}>
      <FileText size={64} color={STATUS_CONFIG.da_revisionare.dotColor} strokeWidth={1.5} />
      <View style={illustrationStyles.approveBadge}>
        <Check size={18} color="#fff" strokeWidth={3} />
      </View>
    </View>
  )
}

const STEPS: Step[] = [
  {
    title: 'Tutti i tuoi clienti in un posto solo',
    description: 'Crea un cliente, invitalo con un link magico e gestisci i suoi contenuti senza fogli sparsi.',
    illustration: ClientsIllustration,
  },
  {
    title: 'Ogni stato ha il suo colore',
    description: 'Rosso è bozza privata, giallo è in revisione, verde è approvato. Lo stesso colore, ovunque: calendario, liste e report.',
    illustration: StatusColorsIllustration,
  },
  {
    title: 'Invia al cliente con un tap',
    description: 'Quando un post è pronto, premi "Invia al cliente": da rosso diventa giallo e lui lo vede subito.',
    illustration: SendIllustration,
  },
  {
    title: 'Il cliente approva in due tap',
    description: 'Approva o chiede una modifica con opzioni rapide. Niente telefonate, niente vocali infiniti.',
    illustration: ApproveIllustration,
  },
]

interface Props {
  visible: boolean
  onDone: () => void
}

export function OnboardingModal({ visible, onDone }: Props) {
  const [step, setStep] = useState(0)
  const scrollRef = useRef<ScrollView>(null)
  const [screenWidth, setScreenWidth] = useState(0)

  const goTo = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * screenWidth, animated: true })
    setStep(index)
  }

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!screenWidth) return
    const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth)
    setStep(index)
  }

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true')
    onDone()
  }

  const isLast = step === STEPS.length - 1

  return (
    <Modal visible={visible} transparent={false} animationType="fade" statusBarTranslucent>
      <View style={styles.screen} onLayout={(e) => setScreenWidth(e.nativeEvent.layout.width)}>
        <Pressable style={styles.skipBtn} onPress={finish} hitSlop={12}>
          <Text style={styles.skipLabel}>Salta</Text>
        </Pressable>

        {screenWidth > 0 && (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
            style={styles.scroll}
          >
            {STEPS.map((s, i) => (
              <View key={i} style={[styles.stepContent, { width: screenWidth }]}>
                <View style={styles.illustrationWrap}>{s.illustration()}</View>
                <Text style={styles.title}>{s.title}</Text>
                <Text style={styles.description}>{s.description}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <Pressable key={i} onPress={() => goTo(i)} hitSlop={8}>
              <View style={[styles.dot, i === step && styles.dotActive]} />
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.nextBtn} onPress={() => (isLast ? finish() : goTo(step + 1))}>
          <Text style={styles.nextLabel}>{isLast ? 'Inizia!' : 'Avanti'}</Text>
        </Pressable>
      </View>
    </Modal>
  )
}

const illustrationStyles = StyleSheet.create({
  overlapWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  circle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleP: { backgroundColor: '#F5A623' },
  circleF: { backgroundColor: '#6C5CE7', marginLeft: -20 },
  circleText: { ...typography.h2, color: '#fff' },

  badgeStack: { gap: spacing.sm, alignItems: 'flex-start' },

  sendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sendBox: { width: 56, height: 72, borderRadius: radius.lg, borderWidth: 2 },
  sendArrow: { fontSize: 28, color: colors.text.muted },

  approveWrap: { alignItems: 'center', justifyContent: 'center' },
  approveBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 60,
    paddingBottom: 48,
    justifyContent: 'space-between',
  },
  skipBtn: {
    alignSelf: 'flex-end',
    padding: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  skipLabel: {
    ...typography.bodyMedium,
    color: colors.primary,
  },

  scroll: { flexGrow: 0 },
  stepContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing['2xl'],
  },
  illustrationWrap: {
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },

  nextBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    marginHorizontal: spacing['2xl'],
    borderRadius: radius.full,
    alignItems: 'center',
  },
  nextLabel: {
    ...typography.bodyMedium,
    color: colors.primaryForeground,
    fontWeight: '700',
  },
})
