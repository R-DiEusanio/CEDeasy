import { Alert, Platform, StyleSheet, Text, View } from 'react-native'
import { LogOut, User } from 'lucide-react-native'
import { supabase } from '../../src/lib/supabase'
import { useMyProfile } from '../../src/lib/queries'
import { useAppStore } from '../../src/lib/app-store'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { Card } from '../../components/ui/Card'
import { SkeletonCard } from '../../components/ui/SkeletonLoader'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { typography } from '../../constants/typography'

export default function SmmProfileScreen() {
  const { data: profile, isLoading } = useMyProfile()
  const { setRole, setActiveBrandId } = useAppStore()

  const doLogout = async () => {
    await supabase.auth.signOut()
    setRole('smm')
    setActiveBrandId(null)
  }

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // window.confirm è bloccato in alcuni browser embedded — esci direttamente
      doLogout()
      return
    }
    Alert.alert('Esci', 'Sei sicuro di voler uscire?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Esci', style: 'destructive', onPress: doLogout },
    ])
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>Profilo</Text>

      {isLoading ? (
        <SkeletonCard />
      ) : profile ? (
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Avatar name={profile.fullName} id={profile.id} size={52} />
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{profile.fullName}</Text>
              <Text style={styles.email}>{profile.email}</Text>
              <Text style={styles.role}>Social Media Manager</Text>
            </View>
          </View>
        </Card>
      ) : (
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.iconPlaceholder}>
              <User size={24} color={colors.text.muted} />
            </View>
            <Text style={styles.email}>Profilo non disponibile</Text>
          </View>
        </Card>
      )}

      <View style={styles.actions}>
        <Button
          label="Esci dall'account"
          onPress={handleLogout}
          variant="destructive"
          fullWidth
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.card,
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  heading: { ...typography.h2, color: colors.text.primary },
  profileCard: {},
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  profileInfo: { flex: 1, gap: 2 },
  name: { ...typography.bodyMedium, color: colors.text.primary },
  email: { ...typography.small, color: colors.text.secondary },
  role: { ...typography.caption, color: colors.primary, marginTop: 2 },
  iconPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { marginTop: spacing.sm },
})
