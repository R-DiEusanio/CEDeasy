import { Tabs } from 'expo-router'
import { LayoutGrid, Grid3x3, Users, BarChart3, CalendarDays } from 'lucide-react-native'
import { colors } from '../../constants/colors'

export default function SmmLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: { borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="calendario"
        options={{
          title: 'Calendario',
          tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="griglia"
        options={{
          title: 'Griglia',
          tabBarIcon: ({ color, size }) => <Grid3x3 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="brands"
        options={{
          title: 'Clienti',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
        }}
      />
      {/* Non è più una tab (era la terza voce): resta navigabile via icona profilo
          nell'header globale (SmmHeader), href:null la nasconde dalla tab bar
          senza rimuovere la rotta. */}
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  )
}
