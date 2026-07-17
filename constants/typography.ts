import { StyleSheet } from 'react-native'

export const typography = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '700', lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: '600', lineHeight: 26 },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodyMedium: { fontSize: 15, fontWeight: '500', lineHeight: 22 },
  small: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  smallMedium: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '400', lineHeight: 16 },
  label: { fontSize: 13, fontWeight: '600', lineHeight: 18 },

  // Titoli di schermata (Dashboard, Calendario, Griglia, Clienti, Report, titoli sheet).
  // Fredoka non ha variable weight qui: si sceglie il font-family in base al peso desiderato.
  displayHeading: { fontFamily: 'Fredoka_700Bold', fontSize: 28, lineHeight: 36 },
  displayHeadingMedium: { fontFamily: 'Fredoka_600SemiBold', fontSize: 22, lineHeight: 30 },

  // Solo per accenti puntuali: numeri grandi in card statistiche, badge celebrativi.
  // Mai su body text o testo denso (font pesante da leggere in blocco).
  displayAccent: { fontFamily: 'LuckiestGuy_400Regular', fontSize: 22, lineHeight: 28 },
})
