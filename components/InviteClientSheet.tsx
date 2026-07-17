import { useState } from 'react'
import { Linking, StyleSheet, Text, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import Toast from 'react-native-toast-message'
import type { BottomSheetModal } from './ui/BottomSheet'
import { Sheet } from './ui/BottomSheet'
import { Input } from './ui/Input'
import { Button } from './ui/Button'
import { SkeletonCard } from './ui/SkeletonLoader'
import { useInvite } from '../src/lib/queries'
import { useAppStore } from '../src/lib/app-store'
import type { Brand } from '../src/lib/mock-data'
import { colors } from '../constants/colors'
import { radius, spacing } from '../constants/spacing'
import { typography } from '../constants/typography'

interface InviteClientSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>
  brand: Brand | null
}

// Link Magico / Codice Invito / Invito via Email — tutti e tre espongono lo
// stesso invito (Task 10): l'SMM può usare quello più comodo, il cliente ne usa
// uno solo per registrarsi. Nessun invio email reale: mailto: apre il client
// email del telefono (nessun provider email configurato lato backend).
export function InviteClientSheet({ sheetRef, brand }: InviteClientSheetProps) {
  const { userId } = useAppStore()
  const { data: invite, isLoading } = useInvite(brand?.id, userId, brand?.ownerName ?? brand?.name)
  const [email, setEmail] = useState('')

  const linkValue = invite ? `cedeasy://join/${invite.code}` : ''

  const copy = async (value: string, label: string) => {
    await Clipboard.setStringAsync(value)
    Toast.show({ type: 'success', text1: `${label} copiato!` })
  }

  const sendEmail = () => {
    if (!email.trim()) {
      Toast.show({ type: 'error', text1: 'Inserisci un\'email' })
      return
    }
    if (!invite) return
    const subject = encodeURIComponent('Il tuo SMM ti ha invitato su CedEasy')
    const body = encodeURIComponent(
      `Ciao!\n\nSei stato invitato a collegarti al tuo spazio su CedEasy.\n\n` +
      `Apri questo link dal telefono: ${linkValue}\n` +
      `Oppure registrati e inserisci il codice: ${invite.code}\n\nA presto!`
    )
    Linking.openURL(`mailto:${email.trim()}?subject=${subject}&body=${body}`)
  }

  return (
    <Sheet
      ref={sheetRef}
      title={`Invita ${brand?.ownerName || brand?.name || ''}`}
      snapPoints={['75%']}
      scrollable
    >
      <View style={styles.content}>
        <Text style={styles.subtitle}>Quando entra, vedrà subito la sua interfaccia semplificata.</Text>

        {isLoading || !invite ? (
          <SkeletonCard />
        ) : (
          <>
            <View style={styles.block}>
              <View style={styles.blockHeader}>
                <Text style={styles.blockTitle}>Link Magico</Text>
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>CONSIGLIATO</Text>
                </View>
              </View>
              <Text style={styles.blockHint}>Copialo e mandalo su WhatsApp: un tap e il cliente è dentro.</Text>
              <View style={styles.codeRow}>
                <Text style={styles.codeText} numberOfLines={1}>{linkValue}</Text>
                <Button label="Copia" onPress={() => copy(linkValue, 'Link')} variant="secondary" />
              </View>
            </View>

            <View style={styles.block}>
              <Text style={styles.blockTitle}>Codice Invito</Text>
              <Text style={styles.blockHint}>Il cliente lo inserisce quando si registra.</Text>
              <View style={styles.codeRow}>
                <Text style={styles.codeText}>{invite.code}</Text>
                <Button label="Copia" onPress={() => copy(invite.code, 'Codice')} variant="secondary" />
              </View>
            </View>

            <View style={styles.block}>
              <Text style={styles.blockTitle}>Invito via Email</Text>
              <Text style={styles.blockHint}>"Il tuo SMM ti ha invitato su CedEasy" — formale e chiaro.</Text>
              <Input
                placeholder="email@cliente.it"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <Button label="Invia" onPress={sendEmail} fullWidth />
            </View>
          </>
        )}
      </View>
    </Sheet>
  )
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  subtitle: { ...typography.body, color: colors.text.secondary },
  block: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    shadowColor: colors.shadow.card,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  blockHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  blockTitle: { ...typography.bodyMedium, color: colors.text.primary },
  blockHint: { ...typography.small, color: colors.text.muted },
  recommendedBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  recommendedText: { ...typography.caption, color: colors.primaryForeground, fontWeight: '700' },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  codeText: {
    flex: 1,
    ...typography.smallMedium,
    color: colors.text.primary,
    backgroundColor: colors.input,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
})
