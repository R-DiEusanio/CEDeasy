import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { X } from 'lucide-react-native'
import { colors } from '../../constants/colors'
import { radius, spacing } from '../../constants/spacing'
import { typography } from '../../constants/typography'

// Stessa interfaccia di @gorhom/bottom-sheet per compatibilità con i ref esistenti
export interface BottomSheetModal {
  present: () => void
  dismiss: () => void
}

interface SheetProps {
  title?: string
  snapPoints?: (string | number)[]
  onClose?: () => void
  children: React.ReactNode
  scrollable?: boolean
}

const SCREEN_HEIGHT = Dimensions.get('window').height

export const Sheet = forwardRef<BottomSheetModal, SheetProps>(
  ({ title, snapPoints = ['50%', '90%'], onClose, children, scrollable = false }, ref) => {
    const [visible, setVisible] = useState(false)
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current

    const show = useCallback(() => {
      setVisible(true)
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 3,
      }).start()
    }, [translateY])

    const hide = useCallback(() => {
      Keyboard.dismiss()
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false)
        onClose?.()
      })
    }, [translateY, onClose])

    useImperativeHandle(ref, () => ({ present: show, dismiss: hide }))

    const snapHeight = (() => {
      const sp = snapPoints[snapPoints.length - 1]
      if (typeof sp === 'string' && sp.endsWith('%')) {
        return (parseInt(sp) / 100) * SCREEN_HEIGHT
      }
      return typeof sp === 'number' ? sp : SCREEN_HEIGHT * 0.9
    })()

    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={hide}
      >
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Pressable style={styles.overlay} onPress={hide} />
          <Animated.View
            style={[styles.sheet, { height: snapHeight, transform: [{ translateY }] }]}
          >
            <View style={styles.handleWrap}>
              <View style={styles.handle} />
            </View>

            {title && (
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <Pressable onPress={hide} style={styles.closeBtn} hitSlop={8}>
                  <X size={20} color={colors.text.secondary} />
                </Pressable>
              </View>
            )}

            {scrollable ? (
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {children}
              </ScrollView>
            ) : (
              <View style={styles.content}>{children}</View>
            )}
          </Animated.View>
        </View>
      </Modal>
    )
  }
)

Sheet.displayName = 'Sheet'

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
  },
  handleWrap: { alignItems: 'center', paddingVertical: spacing.sm },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { ...typography.h3, color: colors.text.primary },
  closeBtn: { padding: spacing.xs },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing['3xl'] },
  content: { flex: 1 },
})
