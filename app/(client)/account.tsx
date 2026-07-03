import { useState } from 'react'
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Building2, Link2, LogOut, Mail, Pencil, Phone, User } from 'lucide-react-native'
import { supabase } from '../../src/lib/supabase'
import { useMyProfile, useUpsertProfile, useBrand, useUpdateBrand } from '../../src/lib/queries'
import { useAppStore } from '../../src/lib/app-store'
import type { Brand } from '../../src/lib/mock-data'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { SkeletonCard } from '../../components/ui/SkeletonLoader'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { typography } from '../../constants/typography'

const SOCIAL_FIELDS = [
  { key: 'instagramUrl', label: 'Instagram' },
  { key: 'tiktokUrl', label: 'TikTok' },
  { key: 'facebookUrl', label: 'Facebook' },
  { key: 'linkedinUrl', label: 'LinkedIn' },
  { key: 'telegramUrl', label: 'Telegram' },
] as const

type ContactDraft = {
  email: string
  phone: string
  instagramUrl: string
  tiktokUrl: string
  facebookUrl: string
  linkedinUrl: string
  telegramUrl: string
}

const emptyDraft = (brand: Brand): ContactDraft => ({
  email: brand.email ?? '',
  phone: brand.phone ?? '',
  instagramUrl: brand.instagramUrl ?? '',
  tiktokUrl: brand.tiktokUrl ?? '',
  facebookUrl: brand.facebookUrl ?? '',
  linkedinUrl: brand.linkedinUrl ?? '',
  telegramUrl: brand.telegramUrl ?? '',
})

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ClientProfileScreen() {
  const { activeBrandId, setRole, setActiveBrandId } = useAppStore()
  const { data: profile, isLoading: profileLoading } = useMyProfile()
  const { data: brand, isLoading: brandLoading } = useBrand(activeBrandId)
  const upsertProfile = useUpsertProfile()
  const updateBrand = useUpdateBrand()

  const [isEditing, setIsEditing] = useState(false)
  const [nameDraft, setNameDraft] = useState('')

  const [isEditingBrand, setIsEditingBrand] = useState(false)
  const [brandDraft, setBrandDraft] = useState<ContactDraft | null>(null)
  const [emailError, setEmailError] = useState<string | undefined>()

  const startEditingBrand = () => {
    if (!brand) return
    setBrandDraft(emptyDraft(brand))
    setEmailError(undefined)
    setIsEditingBrand(true)
  }

  const cancelEditingBrand = () => {
    setIsEditingBrand(false)
    setBrandDraft(null)
  }

  const updateDraftField = (key: keyof ContactDraft, value: string) => {
    setBrandDraft((d) => (d ? { ...d, [key]: value } : d))
  }

  const saveBrand = () => {
    if (!brand || !brandDraft) return
    const email = brandDraft.email.trim()
    if (email && !EMAIL_RE.test(email)) {
      setEmailError('Email non valida')
      return
    }
    setEmailError(undefined)
    updateBrand.mutate(
      {
        id: brand.id,
        dto: {
          email: email || undefined,
          phone: brandDraft.phone.trim() || undefined,
          instagramUrl: brandDraft.instagramUrl.trim() || undefined,
          tiktokUrl: brandDraft.tiktokUrl.trim() || undefined,
          facebookUrl: brandDraft.facebookUrl.trim() || undefined,
          linkedinUrl: brandDraft.linkedinUrl.trim() || undefined,
          telegramUrl: brandDraft.telegramUrl.trim() || undefined,
        },
      },
      { onSuccess: () => { setIsEditingBrand(false); setBrandDraft(null) } },
    )
  }

  const startEditing = () => {
    setNameDraft(profile?.fullName ?? '')
    setIsEditing(true)
  }

  const cancelEditing = () => setIsEditing(false)

  const saveName = () => {
    const trimmed = nameDraft.trim()
    if (!trimmed) return
    upsertProfile.mutate(
      { fullName: trimmed, role: 'CLIENT' },
      { onSuccess: () => setIsEditing(false) },
    )
  }

  const doLogout = async () => {
    await supabase.auth.signOut()
    setRole('smm')
    setActiveBrandId(null)
  }

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      doLogout()
      return
    }
    Alert.alert('Esci', 'Sei sicuro di voler uscire?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Esci', style: 'destructive', onPress: doLogout },
    ])
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Profilo</Text>

      {profileLoading ? (
        <SkeletonCard />
      ) : profile ? (
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Avatar name={profile.fullName} id={profile.id} size={52} />
            <View style={styles.profileInfo}>
              {isEditing ? (
                <Input
                  value={nameDraft}
                  onChangeText={setNameDraft}
                  autoCapitalize="words"
                  autoFocus
                />
              ) : (
                <Text style={styles.name}>{profile.fullName}</Text>
              )}
              <Text style={styles.email}>{profile.email}</Text>
              <Text style={styles.role}>Cliente</Text>
            </View>
            {!isEditing && (
              <Pressable onPress={startEditing} hitSlop={8} style={styles.editBtn}>
                <Pencil size={18} color={colors.text.muted} />
              </Pressable>
            )}
          </View>

          {isEditing && (
            <View style={styles.editActions}>
              <Button
                label="Annulla"
                onPress={cancelEditing}
                variant="ghost"
                disabled={upsertProfile.isPending}
              />
              <Button
                label="Salva"
                onPress={saveName}
                variant="primary"
                loading={upsertProfile.isPending}
                disabled={!nameDraft.trim()}
              />
            </View>
          )}
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

      <Text style={styles.sectionLabel}>Brand collegato</Text>

      {brandLoading ? (
        <SkeletonCard />
      ) : brand ? (
        <Card style={styles.brandCard}>
          <View style={styles.brandRow}>
            <Building2 size={18} color={colors.text.muted} />
            <View style={styles.brandInfo}>
              <Text style={styles.brandName}>{brand.name}</Text>
              {!!brand.category && <Text style={styles.brandCategory}>{brand.category}</Text>}
            </View>
            {!isEditingBrand && (
              <Pressable onPress={startEditingBrand} hitSlop={8} style={styles.editBtn}>
                <Pencil size={18} color={colors.text.muted} />
              </Pressable>
            )}
          </View>

          {isEditingBrand && brandDraft ? (
            <View style={styles.brandForm}>
              <Input
                label="Email"
                value={brandDraft.email}
                onChangeText={(v) => updateDraftField('email', v)}
                keyboardType="email-address"
                error={emailError}
              />
              <Input
                label="Telefono"
                value={brandDraft.phone}
                onChangeText={(v) => updateDraftField('phone', v)}
                keyboardType="phone-pad"
              />
              {SOCIAL_FIELDS.map(({ key, label }) => (
                <Input
                  key={key}
                  label={label}
                  placeholder="https://..."
                  value={brandDraft[key]}
                  onChangeText={(v) => updateDraftField(key, v)}
                  autoCapitalize="none"
                />
              ))}
              <View style={styles.editActions}>
                <Button
                  label="Annulla"
                  onPress={cancelEditingBrand}
                  variant="ghost"
                  disabled={updateBrand.isPending}
                />
                <Button
                  label="Salva"
                  onPress={saveBrand}
                  variant="primary"
                  loading={updateBrand.isPending}
                />
              </View>
            </View>
          ) : (
            <>
              {!!brand.email && (
                <View style={styles.contactRow}>
                  <Mail size={16} color={colors.text.muted} />
                  <Text style={styles.contactText}>{brand.email}</Text>
                </View>
              )}
              {!!brand.phone && (
                <View style={styles.contactRow}>
                  <Phone size={16} color={colors.text.muted} />
                  <Text style={styles.contactText}>{brand.phone}</Text>
                </View>
              )}
              {SOCIAL_FIELDS.map(({ key, label }) => {
                const url = brand[key]
                if (!url) return null
                return (
                  <Pressable
                    key={key}
                    style={styles.contactRow}
                    onPress={() => Linking.openURL(url)}
                  >
                    <Link2 size={16} color={colors.text.muted} />
                    <Text style={styles.contactText}>{label}</Text>
                  </Pressable>
                )
              })}
            </>
          )}
        </Card>
      ) : (
        <Card style={styles.brandCard}>
          <Text style={styles.email}>Nessun brand collegato</Text>
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
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.card,
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  heading: { ...typography.h2, color: colors.text.primary },
  profileCard: {},
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  profileInfo: { flex: 1, gap: 2 },
  name: { ...typography.bodyMedium, color: colors.text.primary },
  email: { ...typography.small, color: colors.text.secondary },
  role: { ...typography.caption, color: colors.primary, marginTop: 2 },
  editBtn: { padding: spacing.xs },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  iconPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: { ...typography.label, color: colors.text.secondary, marginTop: spacing.sm },
  brandCard: { gap: spacing.sm },
  brandForm: { gap: spacing.md, marginTop: spacing.xs },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  brandInfo: { flex: 1, gap: 2 },
  brandName: { ...typography.bodyMedium, color: colors.text.primary },
  brandCategory: { ...typography.small, color: colors.text.secondary },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  contactText: { ...typography.small, color: colors.text.secondary },
  actions: { marginTop: spacing.sm },
})
