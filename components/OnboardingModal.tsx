import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  Sparkles,
  Users,
  PenLine,
  Layers,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react-native'
import { colors } from '../constants/colors'
import { spacing, radius } from '../constants/spacing'
import { typography } from '../constants/typography'

export const ONBOARDING_KEY = '@cedeasy/onboarding_done'

const { width: SCREEN_W } = Dimensions.get('window')

interface Step {
  icon: LucideIcon
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: 'Benvenuto su CEDeasy',
    description:
      'La tua piattaforma per gestire i contenuti social dei tuoi clienti in modo semplice e collaborativo.',
  },
  {
    icon: Users,
    title: 'Aggiungi il tuo primo cliente',
    description:
      'Vai nella scheda "Clienti" e tocca + per creare un nuovo brand. Inserisci nome, categoria, contatti e link social.',
  },
  {
    icon: PenLine,
    title: 'Pianifica i contenuti',
    description:
      'Dalla dashboard del cliente tocca + per creare un post. Scegli data, tipo di contenuto, caption e note per il cliente.',
  },
  {
    icon: Layers,
    title: 'Gestisci gli stati',
    description:
      'Ogni post ha uno stato: Bozza → In revisione → Approvato. Il cliente può richiedere modifiche e tu aggiorni il contenuto.',
  },
  {
    icon: ClipboardList,
    title: 'Piano d\'azione',
    description:
      'Dalla dashboard di ogni cliente trovi il pulsante "Strategia" per gestire il piano d\'azione con task e sottotask.',
  },
]

interface Props {
  visible: boolean
  onDone: () => void
}

export function OnboardingModal({ visible, onDone }: Props) {
  const [step, setStep] = useState(0)
  const slideAnim = useRef(new Animated.Value(0)).current

  const animateTo = (nextStep: number, direction: 1 | -1) => {
    Animated.timing(slideAnim, {
      toValue: -direction * SCREEN_W,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep)
      slideAnim.setValue(direction * SCREEN_W)
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start()
    })
  }

  const next = () => {
    if (step < STEPS.length - 1) {
      animateTo(step + 1, 1)
    } else {
      finish()
    }
  }

  const prev = () => {
    if (step > 0) animateTo(step - 1, -1)
  }

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true')
    onDone()
  }

  const isLast = step === STEPS.length - 1
  const current = STEPS[step]
  const Icon = current.icon

  return (
    <Modal visible={visible} transparent={false} animationType="fade" statusBarTranslucent>
      <View style={styles.screen}>
        {/* Skip */}
        {!isLast && (
          <Pressable style={styles.skipBtn} onPress={finish} hitSlop={12}>
            <Text style={styles.skipLabel}>Salta</Text>
          </Pressable>
        )}

        {/* Step content */}
        <Animated.View
          style={[styles.stepContent, { transform: [{ translateX: slideAnim }] }]}
        >
          <View style={styles.iconWrap}>
            <Icon size={48} color={colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.description}>{current.description}</Text>
        </Animated.View>

        {/* Dots */}
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>

        {/* Navigation */}
        <View style={styles.nav}>
          {step > 0 ? (
            <Pressable style={styles.backBtn} onPress={prev} hitSlop={8}>
              <Text style={styles.backLabel}>Indietro</Text>
            </Pressable>
          ) : (
            <View />
          )}
          <Pressable style={styles.nextBtn} onPress={next}>
            <Text style={styles.nextLabel}>{isLast ? 'Inizia' : 'Avanti'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 60,
    paddingBottom: 48,
    paddingHorizontal: spacing['2xl'],
    justifyContent: 'space-between',
  },
  skipBtn: {
    alignSelf: 'flex-end',
    padding: spacing.sm,
  },
  skipLabel: {
    ...typography.bodyMedium,
    color: colors.text.muted,
  },

  // content
  stepContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
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

  // dots
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
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

  // nav
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  backLabel: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  nextBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['2xl'],
    borderRadius: radius.full,
  },
  nextLabel: {
    ...typography.bodyMedium,
    color: colors.primaryForeground,
  },
})
